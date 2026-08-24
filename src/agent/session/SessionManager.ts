import type { AutobiographySession, SessionContext, SessionState, ConversationTurn } from './types'
import { generateId } from '../../utils'

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

export class SessionManager {
  private sessions: Map<string, AutobiographySession> = new Map()
  private storage: StorageAdapter

  constructor(storage: StorageAdapter) {
    this.storage = storage
  }

  /** 创建新会话 */
  async create(chapterId: string, context: SessionContext): Promise<AutobiographySession> {
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
    await this.persist(session)
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
    await this.persist(session)
  }

  /** 关闭会话 */
  async close(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.status = 'closed'
    session.updatedAt = Date.now()
    await this.persist(session)
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
    await this.persist(session)
  }

  /** 添加对话轮次 */
  async addTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.history.push(turn)
    session.state.lastActivity = Date.now()
    session.updatedAt = Date.now()
    await this.persist(session)
  }

  /** 更新 Token 使用量 */
  async updateTokenUsage(sessionId: string, tokens: number): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.tokenBudget.used += tokens
    session.updatedAt = Date.now()

    const isWarning = session.state.tokenBudget.used >= session.state.tokenBudget.warningThreshold
    await this.persist(session)

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

    return cleanedCount
  }

  /** 删除会话 */
  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    await this.storage.remove(`session:${sessionId}`)
  }

  /** 持久化会话 */
  private async persist(session: AutobiographySession): Promise<void> {
    await this.storage.set(`session:${session.id}`, session)
  }
}
