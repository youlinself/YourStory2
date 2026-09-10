import type { AutobiographySession, SessionContext, SessionState, ConversationTurn } from './types'
import { generateId } from '../../utils'
import { getLogger } from '../logging'

const logger = getLogger()

/** 存储接口 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

/** 内存存储适配器（用于测试） */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, any> = new Map()

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }
}

/** localStorage 存储适配器（用于生产环境，数据持久化） */
export class LocalStorageStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      console.error(`[LocalStorageAdapter] 读取失败: ${key}`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`[LocalStorageAdapter] 写入失败: ${key}`, error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[LocalStorageAdapter] 删除失败: ${key}`, error)
    }
  }
}

export interface SessionManagerConfig {
  /** 防抖延迟（毫秒），0 表示立即持久化 */
  debounceMs?: number
  /** 是否启用批量持久化 */
  enableBatching?: boolean
}

export class SessionManager {
  private sessions: Map<string, AutobiographySession> = new Map()
  private storage: StorageAdapter
  private config: SessionManagerConfig
  private pendingPersists: Map<string, number> = new Map()
  private batchTimer: ReturnType<typeof setTimeout> | null = null

  constructor(storage: StorageAdapter, config: SessionManagerConfig = {}) {
    this.storage = storage
    this.config = {
      debounceMs: 100,
      enableBatching: true,
      ...config
    }
  }

  /** 创建新会话 */
  async create(chapterId: string | null, context: SessionContext): Promise<AutobiographySession> {
    const session: AutobiographySession = {
      id: generateId(),
      chapterId,
      history: [],
      context,
      state: {
        status: 'active',
        pendingExtractions: [],
        lastActivity: Date.now(),
        tokenBudget: { used: 0, limit: 100000, warningThreshold: 80000 }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.sessions.set(session.id, session)
    await this.persistImmediate(session)
    logger.info('SessionManager', 'Session created', { sessionId: session.id, chapterId })
    return session
  }

  /** 恢复会话 */
  async resume(sessionId: string): Promise<AutobiographySession | null> {
    const cached = this.sessions.get(sessionId)
    if (cached) return cached

    const persisted = await this.storage.get<AutobiographySession>(
      `session:${sessionId}`
    )
    if (persisted) {
      this.sessions.set(sessionId, persisted)
    }
    return persisted ?? null
  }

  /** 暂停会话 */
  async pause(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.status = 'paused'
    session.updatedAt = Date.now()
    await this.persistImmediate(session)
    logger.info('SessionManager', 'Session paused', { sessionId })
  }

  /** 关闭会话 */
  async close(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.status = 'closed'
    session.updatedAt = Date.now()
    await this.persistImmediate(session)
    logger.info('SessionManager', 'Session closed', { sessionId })
  }

  /** 更新会话状态 */
  async updateState(
    sessionId: string,
    updates: Partial<SessionState>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state = { ...session.state, ...updates }
    session.updatedAt = Date.now()
    this.schedulePersist(sessionId)
  }

  /** 添加对话轮次 */
  async addTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.history.push(turn)
    session.state.lastActivity = Date.now()
    session.updatedAt = Date.now()
    this.schedulePersist(sessionId)
  }

  /** 更新 Token 使用量 */
  async updateTokenUsage(sessionId: string, tokens: number): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.tokenBudget.used += tokens
    session.updatedAt = Date.now()

    const isWarning = session.state.tokenBudget.used >= session.state.tokenBudget.warningThreshold
    this.schedulePersist(sessionId)

    return isWarning
  }

  /** 获取会话 */
  get(sessionId: string): AutobiographySession | undefined {
    return this.sessions.get(sessionId)
  }

  /** 获取活跃会话 */
  getActiveSessions(): AutobiographySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.state.status === 'active')
  }

  /** 清理过期会话 */
  async cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now()
    let cleanedCount = 0

    for (const [id, session] of this.sessions) {
      if (now - session.updatedAt > maxAgeMs) {
        session.state.status = 'closed'
        await this.persist(session)
        this.sessions.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info('SessionManager', 'Cleaned up expired sessions', { count: cleanedCount })
    }
    return cleanedCount
  }

  /** 删除会话 */
  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    this.pendingPersists.delete(sessionId)
    await this.storage.remove(`session:${sessionId}`)
  }

  /** 立即持久化（用于关键操作） */
  async persistImmediate(session: AutobiographySession): Promise<void> {
    this.pendingPersists.delete(session.id)
    await this.storage.set(`session:${session.id}`, session)
  }

  /** 刷新所有待处理的持久化 */
  async flushPending(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const pendingIds = Array.from(this.pendingPersists.keys())
    this.pendingPersists.clear()

    for (const sessionId of pendingIds) {
      const session = this.sessions.get(sessionId)
      if (session) {
        await this.storage.set(`session:${sessionId}`, session)
      }
    }

    if (pendingIds.length > 0) {
      logger.debug('SessionManager', 'Flushed pending persists', { count: pendingIds.length })
    }
  }

  /** 调度持久化（防抖） */
  private schedulePersist(sessionId: string): void {
    if (this.config.debounceMs === 0) {
      const session = this.sessions.get(sessionId)
      if (session) {
        this.persistImmediate(session)
      }
      return
    }

    this.pendingPersists.set(sessionId, Date.now())

    if (this.config.enableBatching && !this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null
        this.flushPending()
      }, this.config.debounceMs ?? 100)
    }
  }

  /** 持久化会话（内部使用） */
  private async persist(session: AutobiographySession): Promise<void> {
    await this.storage.set(`session:${session.id}`, session)
  }
}
