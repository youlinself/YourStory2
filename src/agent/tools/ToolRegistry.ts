import type { ToolDefinition, ToolResult, ToolExecutionOptions } from './ToolTypes'

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private scopedTools: Map<string, Set<string>> = new Map()

  /** 注册全局工具 */
  register(tool: ToolDefinition): () => void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`)
    }
    this.tools.set(tool.name, tool)

    return () => {
      this.tools.delete(tool.name)
      for (const toolNames of this.scopedTools.values()) {
        toolNames.delete(tool.name)
      }
    }
  }

  /** 批量注册工具 */
  registerAll(tools: ToolDefinition[]): () => void {
    const unregisterFns = tools.map(tool => this.register(tool))
    return () => {
      unregisterFns.forEach(fn => fn())
    }
  }

  /** 为特定会话激活工具 */
  activateForSession(sessionId: string, toolNames: string[]): void {
    const scoped = this.scopedTools.get(sessionId) || new Set()
    for (const name of toolNames) {
      if (!this.tools.has(name)) {
        throw new Error(`Tool not found: ${name}`)
      }
      scoped.add(name)
    }
    this.scopedTools.set(sessionId, scoped)
  }

  /** 为特定会话停用工具 */
  deactivateForSession(sessionId: string, toolNames: string[]): void {
    const scoped = this.scopedTools.get(sessionId)
    if (scoped) {
      for (const name of toolNames) {
        scoped.delete(name)
      }
    }
  }

  /** 获取会话可用的工具列表 */
  getAvailableTools(sessionId: string): ToolDefinition[] {
    const scoped = this.scopedTools.get(sessionId)
    if (!scoped) return []

    return Array.from(scoped)
      .map(name => this.tools.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined)
  }

  /** 获取特定工具 */
  get(toolName: string): ToolDefinition | undefined {
    return this.tools.get(toolName)
  }

  /** 检查工具是否对会话可用 */
  isAvailable(sessionId: string, toolName: string): boolean {
    const scoped = this.scopedTools.get(sessionId)
    return scoped?.has(toolName) || false
  }

  /** 获取所有工具名称 */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /** 获取所有工具定义 */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /** 清理会话的工具绑定 */
  cleanupSession(sessionId: string): void {
    this.scopedTools.delete(sessionId)
  }

  /** 执行工具 */
  async execute(
    sessionId: string,
    toolName: string,
    args: any,
    options?: ToolExecutionOptions
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    if (!this.isAvailable(sessionId, toolName)) {
      throw new Error(`Tool not available for session: ${toolName}`)
    }

    const timeoutMs = options?.timeoutMs ?? tool.timeoutMs ?? 30000
    const signal = options?.signal

    return new Promise<ToolResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Tool execution timeout: ${toolName}`))
      }, timeoutMs)

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId)
          reject(new Error(`Tool execution aborted: ${toolName}`))
        })
      }

      tool.execute(args, {
        sessionId,
        chapterId: '',
        sessionContext: {} as any,
        signal: signal || new AbortController().signal
      })
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }
}
