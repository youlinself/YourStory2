import { SessionManager, type StorageAdapter } from './session'
import { ToolRegistry } from './tools'
import { EventEmitter } from './events'
import { SkillRegistry } from './skills'
import { getLogger } from './logging'
import { AgentError, ErrorCode, SessionError, ToolError, TokenBudgetError } from './errors'
import { TokenBudgetManager } from './optimization/TokenBudget'
import { ContextCompressor, type CompressionOptions } from './optimization/ContextCompressor'
import type { LLMAdapter } from './llm/LLMAdapter'
import type { SkillContext } from './skills/SkillTypes'
import type { AutobiographySession, SessionContext, ConversationTurn } from './session/types'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from './tools/ToolTypes'
import type AIService from '@/services/ai/AIService'
import { PromptComposer } from '@/ai_config'

const logger = getLogger()

export interface AutobiographyAgentConfig {
  storage: StorageAdapter
  aiService?: AIService
  tokenBudget?: {
    limit: number
    warningThreshold: number
  }
  contextCompression?: {
    enabled: boolean
    maxTurns?: number
    maxTokens?: number
    keepRecent?: number
  }
  llmAdapter?: LLMAdapter
}

export class AutobiographyAgent {
  readonly sessionManager: SessionManager
  readonly toolRegistry: ToolRegistry
  readonly events: EventEmitter
  readonly skillRegistry: SkillRegistry
  readonly tokenBudgetManager: TokenBudgetManager
  readonly contextCompressor: ContextCompressor | null
  private aiService: AIService | null = null
  private compressionConfig: CompressionOptions
  private sessionQueues: Map<string, Promise<void>> = new Map()

  constructor(config: AutobiographyAgentConfig) {
    this.sessionManager = new SessionManager(config.storage)
    this.toolRegistry = new ToolRegistry()
    this.events = new EventEmitter()
    this.skillRegistry = new SkillRegistry(this.toolRegistry, this.events)
    this.tokenBudgetManager = new TokenBudgetManager()
    this.aiService = config.aiService || null
    this.compressionConfig = {
      keepRecent: config.contextCompression?.keepRecent ?? 5,
      maxTurns: config.contextCompression?.maxTurns ?? 20,
      maxTokens: config.contextCompression?.maxTokens ?? 50000
    }

    if (config.llmAdapter && config.contextCompression?.enabled) {
      this.contextCompressor = new ContextCompressor(config.llmAdapter)
    } else {
      this.contextCompressor = null
    }

    this.setupEventListeners()

    if (config.tokenBudget) {
      this.tokenBudgetManager.setDefaultConfig(
        config.tokenBudget.limit,
        config.tokenBudget.warningThreshold
      )
    }
  }

  /** 设置内部事件监听 */
  private setupEventListeners(): void {
    this.events.on('session/created', ({ sessionId, chapterId }) => {
      logger.info('Agent', 'Session created', { sessionId, chapterId })
    })

    this.events.on('session/paused', ({ sessionId }) => {
      logger.info('Agent', 'Session paused', { sessionId })
    })

    this.events.on('session/closed', ({ sessionId }) => {
      logger.info('Agent', 'Session closed', { sessionId })
      this.skillRegistry.cleanupSession(sessionId)
      this.toolRegistry.cleanupSession(sessionId)
    })

    this.events.on('tool/failed', ({ sessionId, tool, error }) => {
      logger.error('Agent', `Tool failed: ${tool}`, error, { sessionId })
    })

    this.events.on('session/closed', ({ sessionId }) => {
      this.tokenBudgetManager.cleanup(sessionId)
    })
  }

  /** 检查并执行上下文压缩 */
  async checkAndCompressContext(sessionId: string): Promise<boolean> {
    if (!this.contextCompressor) {
      return false
    }

    const session = this.sessionManager.get(sessionId)
    if (!session) {
      return false
    }

    const shouldCompress = this.contextCompressor.shouldCompress(
      session.history,
      this.compressionConfig.maxTurns,
      this.compressionConfig.maxTokens
    )

    if (!shouldCompress) {
      return false
    }

    logger.info('Agent', 'Compressing conversation context', {
      sessionId,
      historyLength: session.history.length
    })

    try {
      const result = await this.contextCompressor.compress(session.history, this.compressionConfig)

      session.history = result.compressedHistory
      this.events.emit('context/compressed', {
        sessionId,
        removedCount: result.removedCount,
        tokensSaved: result.tokensSaved
      })

      logger.info('Agent', 'Context compression completed', {
        sessionId,
        removedCount: result.removedCount,
        tokensSaved: result.tokensSaved
      })

      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Agent', 'Context compression failed', err, { sessionId })
      this.events.emit('system/error', {
        error: err,
        context: 'context-compression'
      })
      return false
    }
  }

  /** 检查 Token 预算 */
  checkTokenBudget(sessionId: string): { canProceed: boolean; remaining: number } {
    const remaining = this.tokenBudgetManager.getRemaining(sessionId)
    const stats = this.tokenBudgetManager.getStats(sessionId)
    const canProceed = stats ? remaining > 1000 : true
    return { canProceed, remaining }
  }

  /** 记录 Token 使用 */
  recordTokenUsage(sessionId: string, tokens: number): void {
    this.tokenBudgetManager.recordUsage(sessionId, tokens)
    const stats = this.tokenBudgetManager.getStats(sessionId)
    if (stats) {
      logger.debug('Agent', 'Token usage recorded', { sessionId, tokens, totalUsed: stats.used })
    }
  }

  /** 创建会话 */
  async createSession(chapterId: string, context: SessionContext): Promise<AutobiographySession> {
    const session = await this.sessionManager.create(chapterId, context)
    this.tokenBudgetManager.initSession(session.id)
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
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false
      })
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
      throw new ToolError(ErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, {
        toolName,
        recoverable: false
      })
    }

    if (!this.toolRegistry.isAvailable(sessionId, toolName)) {
      throw new ToolError(ErrorCode.TOOL_NOT_AVAILABLE, `Tool not available for session: ${toolName}`, {
        sessionId,
        toolName,
        recoverable: true
      })
    }

    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false
      })
    }

    const context: ToolExecutionContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      signal: signal || new AbortController().signal
    }

    this.events.emit('tool/called', { sessionId, tool: toolName, args })

    try {
      const result = await tool.execute(args, context)

      this.events.emit('tool/completed', { sessionId, tool: toolName, result })

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const toolError = new ToolError(ErrorCode.TOOL_EXECUTION_FAILED, `Tool execution failed: ${toolName}`, {
        sessionId,
        toolName,
        recoverable: true,
        cause: err
      })
      logger.error('Agent', `Tool execution failed: ${toolName}`, toolError, { sessionId })
      this.events.emit('tool/failed', { sessionId, tool: toolName, error: toolError })
      throw toolError
    }
  }

  /** 处理用户消息（完整对话流程）- 带并发控制 */
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
    const existingQueue = this.sessionQueues.get(sessionId) || Promise.resolve()

    const newQueue = existingQueue.then(() => this._handleMessageInternal(sessionId, userMessage, options))

    this.sessionQueues.set(
      sessionId,
      newQueue.then(() => {}).catch(() => {})
    )

    try {
      return await newQueue
    } finally {
      if (this.sessionQueues.get(sessionId) === newQueue.then(() => {}).catch(() => {})) {
        this.sessionQueues.delete(sessionId)
      }
    }
  }

  /** 内部消息处理方法 */
  private async _handleMessageInternal(
    sessionId: string,
    userMessage: string,
    options: {
      generateFollowUpQuestions?: boolean
      autoExtract?: boolean
    }
  ): Promise<{
    extractedContent?: ToolResult
    followUpQuestions?: ToolResult
    response: string
  }> {
    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false
      })
    }

    const tokenCheck = this.checkTokenBudget(sessionId)
    if (!tokenCheck.canProceed) {
      throw new TokenBudgetError(`Token budget exceeded. Remaining: ${tokenCheck.remaining}`, {
        sessionId,
        recoverable: false,
        context: { remaining: tokenCheck.remaining }
      })
    }

    const userTurn: ConversationTurn = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }
    await this.sessionManager.addTurn(sessionId, userTurn)

    const inputTokens = this.tokenBudgetManager.estimateTokens(userMessage)
    this.recordTokenUsage(sessionId, inputTokens)

    await this.checkAndCompressContext(sessionId)

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
        const err = error instanceof Error ? error : new Error(String(error))
        const extractionError = new AgentError(ErrorCode.CONTENT_EXTRACTION_FAILED, 'Content extraction failed', {
          sessionId,
          recoverable: true,
          cause: err
        })
        logger.error('Agent', 'Content extraction failed', extractionError, { sessionId })
        this.events.emit('turn/error', { sessionId, error: extractionError })
      }
    }

    try {
      if (!this.aiService) {
        throw new AgentError(ErrorCode.AI_SERVICE_NOT_CONFIGURED, 'AI服务未配置，请在设置页面配置AI参数', {
          sessionId,
          recoverable: false
        })
      }

      const session = this.sessionManager.get(sessionId)
      const chapterTitle = session?.context?.existingContent?.title || ''

      const conversationHistory = session?.history
        .slice(-10)
        .map((turn) => ({
          role: (turn.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: turn.content,
        })) || []

      const chapterContext = chapterTitle ? {
        chapterId: session?.chapterId || '',
        chapterTitle,
        existingContent: session?.context?.existingContent?.content || '',
        timeRange: session?.context?.existingContent?.timeRange,
      } : undefined

      const messages = PromptComposer.buildMessages(
        userMessage,
        conversationHistory,
        chapterContext
      )

      const aiResponse = await this.aiService.sendCustomMessages(messages)
      result.response = aiResponse

      const responseTokens = this.tokenBudgetManager.estimateTokens(aiResponse)
      this.recordTokenUsage(sessionId, responseTokens)

      const assistantTurn: ConversationTurn = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      }
      await this.sessionManager.addTurn(sessionId, assistantTurn)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const agentError = new AgentError(ErrorCode.AI_GENERATION_FAILED, 'AI生成回复失败', {
        sessionId,
        recoverable: true,
        cause: err
      })
      logger.error('Agent', 'AI generation failed', agentError, { sessionId })
      this.events.emit('turn/error', { sessionId, error: agentError })
      result.response = '抱歉，AI服务暂时不可用，请检查AI配置后重试。'
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
