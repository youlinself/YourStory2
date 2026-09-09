import type { SessionEvent, SurfaceEventType, SessionEventType, SurfaceOp } from './types'

export type { SessionEvent, SurfaceEventType, SessionEventType, SurfaceOp }

export interface ModelMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
}

export class SessionLog {
  private events: SessionEvent[] = []

  append(event: SessionEvent): void {
    this.events.push(event)
  }

  getAll(): readonly SessionEvent[] {
    return this.events
  }

  getSurfaceEvents(): SessionEvent[] {
    const surfaceTypes: SurfaceEventType[] = ['user/message', 'assistant/message', 'tool/result']
    return this.events.filter(e => surfaceTypes.includes(e.type as SurfaceEventType))
  }

  deriveMessages(): ModelMessage[] {
    return this.getSurfaceEvents().map(event => {
      const payload = event.payload as Record<string, unknown>
      switch (event.type) {
        case 'user/message':
          return { role: 'user', content: payload.content as string }
        case 'assistant/message':
          return { role: 'assistant', content: payload.content as string }
        case 'tool/result':
          return { role: 'tool', content: payload.result as string, toolCallId: payload.callId as string }
        default:
          return { role: 'user', content: '' }
      }
    })
  }

  getTurnEvents(turn: number): SessionEvent[] {
    return this.events.filter(e => e.turn === turn)
  }

  getSeedBoundary(): number {
    const seedIndex = this.events.findIndex(e => e.type === 'session/end-seed')
    return seedIndex >= 0 ? seedIndex + 1 : 0
  }

  getEventCount(): number {
    return this.events.length
  }

  clear(): void {
    this.events = []
  }
}
