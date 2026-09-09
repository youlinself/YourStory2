import type { AutobiographySession } from '../session/types'

export type AgentStatus = 'idle' | 'running'

export type InboxTarget = 'next-turn' | 'next-step' | 'inject'

export type AgentCancelCause =
  | 'user_request'
  | 'timeout'
  | 'parent_cancelled'
  | 'system_shutdown'

export interface UserMessage {
  content: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface InboxMessage {
  message: UserMessage
  target: InboxTarget
  wakeup: boolean
  timestamp: number
}

export class AgentHandle {
  readonly id: string
  readonly session: AutobiographySession
  status: AgentStatus = 'idle'
  private inbox: InboxMessage[] = []
  private processingPromise: Promise<void> | null = null
  private lastResponse: string = ''

  constructor(
    readonly sessionId: string,
    session: AutobiographySession
  ) {
    this.id = sessionId
    this.session = session
  }

  followup(message: UserMessage): void {
    this.inbox.push({ message, target: 'next-turn', wakeup: true, timestamp: Date.now() })
  }

  steer(message: UserMessage): void {
    this.inbox.push({ message, target: 'next-step', wakeup: true, timestamp: Date.now() })
  }

  inject(message: UserMessage): void {
    this.inbox.push({ message, target: 'inject', wakeup: true, timestamp: Date.now() })
  }

  send(message: UserMessage, target: InboxTarget, wakeup: boolean): void {
    this.inbox.push({ message, target, wakeup, timestamp: Date.now() })
  }

  cancel(_cause: AgentCancelCause): void {
    this.status = 'idle'
    this.inbox = []
  }

  async whenIdle(): Promise<void> {
    if (this.status === 'idle') return
    await this.processingPromise
  }

  dequeue(): InboxMessage | undefined {
    return this.inbox.shift()
  }

  hasPendingMessages(): boolean {
    return this.inbox.length > 0
  }

  setProcessingPromise(promise: Promise<void>): void {
    this.processingPromise = promise
  }

  setStatus(status: AgentStatus): void {
    this.status = status
  }

  getLastResponse(): string {
    return this.lastResponse
  }

  setLastResponse(response: string): void {
    this.lastResponse = response
  }
}
