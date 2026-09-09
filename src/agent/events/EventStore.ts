import type { SessionEvent } from './types'

export interface EventStore {
  append(sessionId: string, event: SessionEvent): Promise<void>
  appendBatch(sessionId: string, events: SessionEvent[]): Promise<void>
  readSession(sessionId: string): Promise<SessionEvent[]>
  readRange(sessionId: string, from: number, to: number): Promise<SessionEvent[]>
  readLast(sessionId: string, count: number): Promise<SessionEvent[]>
}

export class MemoryEventStore implements EventStore {
  private logs: Map<string, SessionEvent[]> = new Map()

  async append(sessionId: string, event: SessionEvent): Promise<void> {
    const log = this.logs.get(sessionId) || []
    log.push(event)
    this.logs.set(sessionId, log)
  }

  async appendBatch(sessionId: string, events: SessionEvent[]): Promise<void> {
    const log = this.logs.get(sessionId) || []
    log.push(...events)
    this.logs.set(sessionId, log)
  }

  async readSession(sessionId: string): Promise<SessionEvent[]> {
    return [...(this.logs.get(sessionId) || [])]
  }

  async readRange(sessionId: string, from: number, to: number): Promise<SessionEvent[]> {
    const log = this.logs.get(sessionId) || []
    return log.slice(from, to)
  }

  async readLast(sessionId: string, count: number): Promise<SessionEvent[]> {
    const log = this.logs.get(sessionId) || []
    return log.slice(-count)
  }

  clear(sessionId?: string): void {
    if (sessionId) {
      this.logs.delete(sessionId)
    } else {
      this.logs.clear()
    }
  }
}
