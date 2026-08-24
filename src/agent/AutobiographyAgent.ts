import { SessionManager, type StorageAdapter } from './session'
import { ToolRegistry } from './tools'
import { EventEmitter } from './events'
import { SkillRegistry } from './skills'
import type { SkillContext } from './skills/SkillTypes'
import type { AutobiographySession, SessionContext, ConversationTurn } from './session/types'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from './tools/ToolTypes'

export interface AutobiographyAgentConfig {
  storage: StorageAdapter
}

export class AutobiographyAgent {
  readonly sessionManager: SessionManager
  readonly toolRegistry: ToolRegistry
  readonly events: EventEmitter
  readonly skillRegistry: SkillRegistry

  constructor(config: AutobiographyAgentConfig) {
    this.sessionManager = new SessionManager(config.storage)
    this.toolRegistry = new ToolRegistry()
    this.events = new EventEmitter()
    this.skillRegistry = new SkillRegistry(this.toolRegistry, this.events)
    this.setupEventListeners()
  }

  /** 设置内部事件监听 */
  private setupEventListeners(): void {
    this.events.on('session/created', ({ sessionId, chapterId }) => {
      console.log(`[Agent] Session created: ${sessionId} for chapter: ${chapterId}`)
    })

    this.events.on('session/paused', ({ sessionId }) => {
      console.log(`[Agent] Session paused: ${sessionId}`)
    })

    this.events.on('session/closed', ({ sessionId }) => {
      this.skillRegistry.cleanupSession(sessionId)
      this.toolRegistry.cleanupSession(sessionId)
    })

    this.events.on('tool/failed', ({ sessionId, tool, error }) => {
      console.error(`[Agent] Tool failed in session ${sessionId}: ${tool}`, error)
    })
  }

  /** 创建会话 */
  async createSession(chapterId: string, context: SessionContext): Promise<AutobiographySession> {
    const session = await this.sessionManager.create(chapterId, context)
    this.events.emit('session/created', { sessionId: session.id, chapterId })
    return session
  }

  /** 恢复会话 */
  async resumeSession(sessionId: string): Promise<AutobiographySession | null> {
    const session = await this.sessionManager.resume(sessionId)
    if (session) {
      this.events.emit('session/resumed', { sessionId })
    }
    return session
  }

  /** 暂停会话 */
  async pauseSession(sessionId: string): Promise<void> {
    await this.sessionManager.pause(sessionId)
    this.events.emit('session/paused', { sessionId })
  }

  /** 关闭会话 */
  async closeSession(sessionId: string): Promise<void> {
    await this.sessionManager.close(sessionId)
    this.events.emit('session/closed', { sessionId })
  }

  /** 注册工具 */
  registerTool(tool: ToolDefinition): () => void {
    return this.toolRegistry.register(tool)
  }

  /** 批量注册工具 */
  registerTools(tools: ToolDefinition[]): () => void {
    return this.toolRegistry.registerAll(tools)
  }

  /** 激活会话工具 */
  activateTools(sessionId: string, toolNames: string[]): void {
    this.toolRegistry.activateForSession(sessionId, toolNames)
  }

  /** 停用会话工具 */
  deactivateTools(sessionId: string, toolNames: string[]): void {
    this.toolRegistry.deactivateForSession(sessionId, toolNames)
  }

  /** 激活技能 */
  async activateSkill(sessionId: string, skillName: string): Promise<void> {
    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const context: SkillContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      agent: this
    }

    await this.skillRegistry.activate(sessionId, skillName, context)
  }

  /** 停用技能 */
  async deactivateSkill(sessionId: string, skillName: string): Promise<void> {
    await this.skillRegistry.deactivate(sessionId, skillName)
  }

  /** 获取会话激活的技能 */
  getActiveSkills(sessionId: string): string[] {
    return this.skillRegistry.getActiveSkills(sessionId).map(as => as.skill.name)
  }

  /** 执行工具 */
  async executeTool(
    sessionId: string,
    toolName: string,
    args: any,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const tool = this.toolRegistry.get(toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    if (!this.toolRegistry.isAvailable(sessionId, toolName)) {
      throw new Error(`Tool not available for session: ${toolName}`)
    }

    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const context: ToolExecutionContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      signal: signal || new AbortController().signal
    }

    this.events.emit('tool/called', { sessionId, tool: toolName, args })

    const startTime = Date.now()
    try {
      const result = await tool.execute(args, context)
      const duration = Date.now() - startTime

      this.events.emit('tool/completed', { sessionId, tool: toolName, result })

      const turn: ConversationTurn = {
        role: 'assistant',
        content: result.messages?.join('\n') || '',
        timestamp: Date.now(),
        toolCalls: [{
          toolName,
          args,
          result,
          timestamp: startTime,
          duration
        }]
      }
      await this.sessionManager.addTurn(sessionId, turn)

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.events.emit('tool/failed', { sessionId, tool: toolName, error: err })
      throw err
    }
  }

  /** 处理用户消息（完整对话流程） */
  async handleMessage(
    sessionId: string,
    userMessage: string,
    options: {
      generateFollowUpQuestions?: boolean
      autoExtract?: boolean
    } = {}
  ): Promise<{
    extractedContent?: ToolResult
    followUpQuestions?: ToolResult
    response: string
  }> {
    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const userTurn: ConversationTurn = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }
    await this.sessionManager.addTurn(sessionId, userTurn)

    this.events.emit('turn/start', { sessionId, userMessage })

    const result: {
      extractedContent?: ToolResult
      followUpQuestions?: ToolResult
      response: string
    } = {
      response: ''
    }

    const autoExtract = options.autoExtract ?? session.context.userPreferences?.autoExtract ?? true

    if (autoExtract) {
      try {
        const extractedResult = await this.executeTool(sessionId, 'extract_content', {
          conversationSegments: [userMessage],
          extractOptions: {
            narrativeStyle: session.context.userPreferences?.perspective === 'first' ? 'first_person' : 'third_person',
            includeTimeTag: true,
            includeEmotions: true,
            includePeople: true
          }
        })
        result.extractedContent = extractedResult

        this.events.emit('content/extracted', {
          sessionId,
          extraction: extractedResult.data
        })
      } catch (error) {
        console.error('[Agent] Content extraction failed:', error)
      }
    }

    if (options.generateFollowUpQuestions) {
      try {
        const questionsResult = await this.executeTool(sessionId, 'generate_questions', {
          chapterContent: userMessage,
          count: 3,
          difficulty: 'medium'
        })
        result.followUpQuestions = questionsResult
        result.response = '已为你生成了一些引导性问题，可以帮助你更深入地回忆。'
      } catch (error) {
        console.error('[Agent] Question generation failed:', error)
        result.response = '我已经记录了你的分享，想继续聊聊吗？'
      }
    } else {
      result.response = '我已经记录了你的分享，想继续聊聊吗？'
    }

    this.events.emit('turn/complete', {
      sessionId,
      assistantResponse: result.response,
      tokensUsed: 0
    })

    return result
  }

  /** 添加对话轮次 */
  async addConversationTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    await this.sessionManager.addTurn(sessionId, turn)
  }

  /** 获取会话 */
  getSession(sessionId: string): AutobiographySession | undefined {
    return this.sessionManager.get(sessionId)
  }

  /** 获取活跃会话 */
  getActiveSessions(): AutobiographySession[] {
    return this.sessionManager.getActiveSessions()
  }

  /** 清理过期会话 */
  async cleanupSessions(maxAgeMs?: number): Promise<number> {
    return this.sessionManager.cleanup(maxAgeMs)
  }

  /** 销毁 */
  dispose(): void {
    this.events.removeAllListeners()
  }
}
