import type { SessionContext } from '../session/types'

/** 工具参数定义 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: ToolParameterSchema
  properties?: Record<string, ToolParameterSchema>
  required?: boolean
}

/** 工具参数定义集合 */
export interface ToolParameters {
  type: 'object'
  properties: Record<string, ToolParameterSchema>
  required?: string[]
}

/** 工具执行上下文 */
export interface ToolExecutionContext {
  sessionId: string
  chapterId: string
  sessionContext: SessionContext
  signal: AbortSignal
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  messages?: string[]
}

/** 工具定义 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParameters
  execute: (args: any, context: ToolExecutionContext) => Promise<ToolResult>
  /** 是否支持并发执行 */
  isConcurrencySafe?: (args: any) => boolean
  /** 超时时间（毫秒） */
  timeoutMs?: number
}

/** 工具执行选项 */
export interface ToolExecutionOptions {
  /** 超时时间（毫秒），覆盖工具默认值 */
  timeoutMs?: number
  /** 取消信号 */
  signal?: AbortSignal
}
