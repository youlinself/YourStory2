import { getLogger } from '../logging'

const logger = getLogger()

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: string[]
}

export class RetryPolicy {
  private options: RetryOptions

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableErrors: ['NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT'],
      ...options
    }
  }

  /** 执行带重试的操作 */
  async execute<T>(
    operation: () => Promise<T>,
    context: string = ''
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (!this.shouldRetry(error) || attempt >= this.options.maxRetries) {
          throw error
        }

        const delay = this.calculateDelay(attempt)
        logger.warn('RetryPolicy', `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /** 检查是否应该重试 */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      return this.options.retryableErrors.some(code =>
        error.message.includes(code)
      )
    }
    return false
  }

  /** 计算延迟时间（指数退避） */
  private calculateDelay(attempt: number): number {
    const delay = this.options.baseDelay * Math.pow(
      this.options.backoffFactor,
      attempt
    )
    return Math.min(delay, this.options.maxDelay)
  }

  /** 延迟 */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /** 获取当前配置 */
  getOptions(): RetryOptions {
    return { ...this.options }
  }
}
