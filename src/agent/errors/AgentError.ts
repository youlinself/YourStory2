export enum ErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_CLOSED = 'SESSION_CLOSED',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_NOT_AVAILABLE = 'TOOL_NOT_AVAILABLE',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TOOL_TIMEOUT = 'TOOL_TIMEOUT',
  CONTENT_EXTRACTION_FAILED = 'CONTENT_EXTRACTION_FAILED',
  QUESTION_GENERATION_FAILED = 'QUESTION_GENERATION_FAILED',
  TOKEN_BUDGET_EXCEEDED = 'TOKEN_BUDGET_EXCEEDED',
  CONTEXT_COMPRESSION_FAILED = 'CONTEXT_COMPRESSION_FAILED',
  PERSISTENCE_FAILED = 'PERSISTENCE_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  AI_SERVICE_NOT_CONFIGURED = 'AI_SERVICE_NOT_CONFIGURED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED'
}

export class AgentError extends Error {
  public readonly code: ErrorCode
  public readonly sessionId?: string
  public readonly toolName?: string
  public readonly timestamp: number
  public readonly recoverable: boolean
  public readonly context?: Record<string, unknown>
  public readonly cause?: Error

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      sessionId?: string
      toolName?: string
      recoverable?: boolean
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'AgentError'
    this.code = code
    this.sessionId = options.sessionId
    this.toolName = options.toolName
    this.timestamp = Date.now()
    this.recoverable = options.recoverable ?? false
    this.context = options.context
    this.cause = options.cause
  }
}

export class SessionError extends AgentError {
  constructor(
    code: ErrorCode,
    message: string,
    options: {
      sessionId?: string
      recoverable?: boolean
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(code, message, { ...options, recoverable: options.recoverable ?? false })
    this.name = 'SessionError'
  }
}

export class ToolError extends AgentError {
  constructor(
    code: ErrorCode,
    message: string,
    options: {
      sessionId?: string
      toolName?: string
      recoverable?: boolean
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(code, message, { ...options, recoverable: options.recoverable ?? true })
    this.name = 'ToolError'
  }
}

export class TokenBudgetError extends AgentError {
  constructor(
    message: string,
    options: {
      sessionId?: string
      recoverable?: boolean
      context?: Record<string, unknown>
    } = {}
  ) {
    super(ErrorCode.TOKEN_BUDGET_EXCEEDED, message, {
      ...options,
      recoverable: options.recoverable ?? false
    })
    this.name = 'TokenBudgetError'
  }
}

export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError
}

export function isRecoverableError(error: unknown): boolean {
  return isAgentError(error) && error.recoverable
}
