export type SessionState =
  | { status: 'active'; lastActivity: number }
  | { status: 'paused'; pausedAt: number; reason?: string }
  | { status: 'closed'; closedAt: number; reason: string }
  | { status: 'compacting'; startedAt: number }

export type ToolExecutionResult =
  | { kind: 'success'; data: unknown; duration: number }
  | { kind: 'failure'; error: Error; recoverable: boolean }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'cancelled'; reason: string }

export type CompactionResult =
  | { kind: 'compressed'; summary: string; tokensSaved: number }
  | { kind: 'skipped'; reason: 'no_pressure' | 'already_compacting' | 'too_short' }
  | { kind: 'failed'; error: Error }

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`)
}

export function handleToolResult(result: ToolExecutionResult): string {
  switch (result.kind) {
    case 'success':
      return `Success: ${JSON.stringify(result.data)}`
    case 'failure':
      return `Failed: ${result.error.message}`
    case 'timeout':
      return `Timeout after ${result.timeoutMs}ms`
    case 'cancelled':
      return `Cancelled: ${result.reason}`
    default:
      return assertNever(result)
  }
}

export function handleCompactionResult(result: CompactionResult): string {
  switch (result.kind) {
    case 'compressed':
      return `Compressed: saved ${result.tokensSaved} tokens`
    case 'skipped':
      return `Skipped: ${result.reason}`
    case 'failed':
      return `Failed: ${result.error.message}`
    default:
      return assertNever(result)
  }
}
