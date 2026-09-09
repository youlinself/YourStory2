import type { SessionEvent, AutobiographyEventMap, EventHandler, EventFilter } from './types'
import type { SessionLog } from './SessionLog'
import type { EventStore } from './EventStore'
import { getLogger } from '../logging'

const logger = getLogger()

type FilteredHandler<T = any> = {
  handler: EventHandler<T>
  filter?: EventFilter
}

export class EventEmitter {
  private listeners: Map<string, Set<FilteredHandler>> = new Map()
  private asyncListeners: Map<string, Set<FilteredHandler>> = new Map()
  private middleware: Map<string, Array<(event: SessionEvent) => Promise<SessionEvent | null>>> = new Map()
  private log: SessionLog
  private store: EventStore

  constructor(log: SessionLog, store: EventStore) {
    this.log = log
    this.store = store
  }

  on<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>,
    filter?: EventFilter
  ): () => void {
    const set = this.listeners.get(event as string) || new Set()
    const entry: FilteredHandler<AutobiographyEventMap[K]> = { handler, filter }
    set.add(entry as FilteredHandler)
    this.listeners.set(event as string, set)

    return () => {
      set.delete(entry as FilteredHandler)
    }
  }

  onAsync<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>,
    filter?: EventFilter
  ): () => void {
    const set = this.asyncListeners.get(event as string) || new Set()
    const entry: FilteredHandler<AutobiographyEventMap[K]> = { handler, filter }
    set.add(entry as FilteredHandler)
    this.asyncListeners.set(event as string, set)

    return () => {
      set.delete(entry as FilteredHandler)
    }
  }

  once<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>,
    filter?: EventFilter
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe()
      handler(payload)
    }, filter)
    return unsubscribe
  }

  use(eventType: string, handler: (event: SessionEvent) => Promise<SessionEvent | null>): () => void {
    const handlers = this.middleware.get(eventType) || []
    handlers.push(handler)
    this.middleware.set(eventType, handlers)
    return () => {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }

  async emitEvent(event: SessionEvent): Promise<void> {
    let processedEvent = event
    const handlers = this.middleware.get(event.type) || []
    for (const handler of handlers) {
      const result = await handler(processedEvent)
      if (result === null) return
      processedEvent = result
    }

    this.log.append(processedEvent)
    await this.store.append(event.sessionId, processedEvent)

    this.notifyListeners(event.type, processedEvent.payload)
    this.notifyAsyncListeners(event.type, processedEvent.payload)
  }

  emit<K extends keyof AutobiographyEventMap>(
    event: K,
    payload: AutobiographyEventMap[K]
  ): void {
    const set = this.listeners.get(event as string)
    if (set) {
      for (const entry of set) {
        if (this.matchesFilter(payload, entry.filter)) {
          try {
            entry.handler(payload)
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            logger.error('EventEmitter', `Handler error for ${String(event)}`, err)
          }
        }
      }
    }
  }

  async emitAsync<K extends keyof AutobiographyEventMap>(
    event: K,
    payload: AutobiographyEventMap[K]
  ): Promise<void> {
    const set = this.asyncListeners.get(event as string)
    if (set) {
      const matchingHandlers = Array.from(set).filter(
        entry => this.matchesFilter(payload, entry.filter)
      )
      const promises = matchingHandlers.map(async (entry) => {
        try {
          await entry.handler(payload)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('EventEmitter', `Async handler error for ${String(event)}`, err)
        }
      })
      await Promise.all(promises)
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.asyncListeners.delete(event)
      this.middleware.delete(event)
    } else {
      this.listeners.clear()
      this.asyncListeners.clear()
      this.middleware.clear()
    }
  }

  removeListener<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>
  ): void {
    const syncSet = this.listeners.get(event as string)
    if (syncSet) {
      for (const entry of syncSet) {
        if (entry.handler === handler) {
          syncSet.delete(entry)
          break
        }
      }
    }

    const asyncSet = this.asyncListeners.get(event as string)
    if (asyncSet) {
      for (const entry of asyncSet) {
        if (entry.handler === handler) {
          asyncSet.delete(entry)
          break
        }
      }
    }
  }

  listenerCount(event: string): number {
    return (this.listeners.get(event)?.size || 0) +
           (this.asyncListeners.get(event)?.size || 0)
  }

  private notifyListeners(eventType: string, payload: unknown): void {
    const set = this.listeners.get(eventType)
    if (set) {
      for (const entry of set) {
        if (this.matchesFilter(payload, entry.filter)) {
          try {
            entry.handler(payload)
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            logger.error('EventEmitter', `Handler error for ${eventType}`, err)
          }
        }
      }
    }
  }

  private async notifyAsyncListeners(eventType: string, payload: unknown): Promise<void> {
    const set = this.asyncListeners.get(eventType)
    if (set) {
      const matchingHandlers = Array.from(set).filter(
        entry => this.matchesFilter(payload, entry.filter)
      )
      const promises = matchingHandlers.map(async (entry) => {
        try {
          await entry.handler(payload)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('EventEmitter', `Async handler error for ${eventType}`, err)
        }
      })
      await Promise.all(promises)
    }
  }

  private matchesFilter(payload: any, filter?: EventFilter): boolean {
    if (!filter) return true

    if (filter.sessionId && payload?.sessionId !== filter.sessionId) {
      return false
    }

    if (filter.chapterId && payload?.chapterId !== filter.chapterId) {
      return false
    }

    return true
  }
}
