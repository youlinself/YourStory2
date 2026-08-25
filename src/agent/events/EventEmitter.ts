import type { AutobiographyEventMap, EventHandler, EventFilter } from './types'
import { getLogger } from '../logging'

const logger = getLogger()

type FilteredHandler<T = any> = {
  handler: EventHandler<T>
  filter?: EventFilter
}

export class EventEmitter {
  private listeners: Map<string, Set<FilteredHandler>> = new Map()
  private asyncListeners: Map<string, Set<FilteredHandler>> = new Map()

  /** 订阅事件 */
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

  /** 订阅异步事件 */
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

  /** 订阅一次性事件 */
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

  /** 发布事件（同步） */
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

  /** 发布事件（异步） */
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

  /** 移除所有监听器 */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.asyncListeners.delete(event)
    } else {
      this.listeners.clear()
      this.asyncListeners.clear()
    }
  }

  /** 移除特定事件的监听器 */
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

  /** 获取事件监听器数量 */
  listenerCount(event: string): number {
    return (this.listeners.get(event)?.size || 0) +
           (this.asyncListeners.get(event)?.size || 0)
  }

  /** 检查 payload 是否匹配过滤条件 */
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
