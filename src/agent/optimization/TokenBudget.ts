export interface TokenStats {
  used: number
  limit: number
  warningThreshold: number
  history: Array<{ timestamp: number; tokens: number }>
}

export class TokenBudgetManager {
  private sessions: Map<string, TokenStats> = new Map()
  private warningCallbacks: Map<string, () => void> = new Map()
  private limitCallbacks: Map<string, () => void> = new Map()

  /** 初始化会话预算 */
  initSession(
    sessionId: string,
    limit: number = 100000,
    warningThreshold: number = 80000
  ): void {
    this.sessions.set(sessionId, {
      used: 0,
      limit,
      warningThreshold,
      history: []
    })
  }

  /** 记录 Token 使用 */
  recordUsage(sessionId: string, tokens: number): void {
    const stats = this.sessions.get(sessionId)
    if (!stats) return

    stats.used += tokens
    stats.history.push({ timestamp: Date.now(), tokens })

    if (stats.used >= stats.warningThreshold && stats.used - tokens < stats.warningThreshold) {
      this.warningCallbacks.get(sessionId)?.()
    }

    if (stats.used >= stats.limit) {
      this.limitCallbacks.get(sessionId)?.()
    }
  }

  /** 获取剩余 Token */
  getRemaining(sessionId: string): number {
    const stats = this.sessions.get(sessionId)
    if (!stats) return 0
    return Math.max(0, stats.limit - stats.used)
  }

  /** 获取使用统计 */
  getStats(sessionId: string): TokenStats | null {
    return this.sessions.get(sessionId) || null
  }

  /** 注册警告回调 */
  onWarning(sessionId: string, callback: () => void): void {
    this.warningCallbacks.set(sessionId, callback)
  }

  /** 注册限制回调 */
  onLimitReached(sessionId: string, callback: () => void): void {
    this.limitCallbacks.set(sessionId, callback)
  }

  /** 估算 Token 数量（简单实现） */
  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWordMatches = text.match(/[a-zA-Z]+/g) || []
    const englishWordChars = englishWordMatches.reduce((sum, word) => sum + word.length, 0)
    const otherChars = text.length - chineseChars - englishWordChars

    return Math.ceil(chineseChars * 1.5 + englishWordMatches.length * 0.75 + otherChars * 0.5)
  }

  /** 清理会话 */
  cleanup(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.warningCallbacks.delete(sessionId)
    this.limitCallbacks.delete(sessionId)
  }

  /** 获取所有会话 ID */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys())
  }

  /** 检查会话是否已初始化 */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }
}
