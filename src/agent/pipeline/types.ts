import type { SessionContext } from '../session/types'

/** 执行前决策 */
export type PreExecutionDecision =
  | { kind: 'allow' }
  | { kind: 'deny'; reason: string }
  | { kind: 'ask'; reason?: string }

/** 执行后决策 */
export type PostExecutionDecision =
  | { kind: 'accept'; content?: unknown; additionalMessages?: string[] }
  | { kind: 'block'; feedback: string; additionalMessages?: string[] }

/** 管道上下文 */
export interface PipelineContext {
  sessionId: string
  toolName: string
  args: unknown
  sessionContext: SessionContext
  signal: AbortSignal
}

/** 管道阶段结果 */
export interface PipelineResult {
  success: boolean
  data?: unknown
  error?: string
  blocked?: boolean
  messages: string[]
}
