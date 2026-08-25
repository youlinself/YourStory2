import type { PreExecutionHook, PostExecutionHook } from './ExtractionPipeline'
import type { PipelineContext } from './types'

/** 参数验证钩子 */
export const validationHook: PreExecutionHook = async (context, next) => {
  if (!context.toolName || !context.args) {
    return { kind: 'deny', reason: '参数不完整' }
  }
  return next()
}

/** Token 预算检查钩子 */
export const tokenBudgetHook = (
  getBudget: () => { used: number; limit: number }
): PreExecutionHook => {
  return async (context, next) => {
    const budget = getBudget()
    const remaining = budget.limit - budget.used

    if (remaining < 1000) {
      return {
        kind: 'deny',
        reason: `Token 预算不足，剩余: ${remaining}`
      }
    }

    return next()
  }
}

/** 取消信号检查钩子 */
export const abortCheckHook: PreExecutionHook = async (context, next) => {
  if (context.signal.aborted) {
    return { kind: 'deny', reason: '操作已取消' }
  }
  return next()
}

import { getLogger } from '../logging'

const logger = getLogger()

/** 结果验证钩子 */
export const resultValidationHook: PostExecutionHook = async (
  context,
  result,
  next
) => {
  if (!result.success && result.error) {
    logger.warn('Pipeline', `Tool ${context.toolName} failed: ${result.error}`)
  }
  return next()
}

/** 会话存在性检查钩子 */
export const sessionExistsHook: PreExecutionHook = async (context, next) => {
  if (!context.sessionId) {
    return { kind: 'deny', reason: '会话 ID 不能为空' }
  }
  return next()
}

/** 执行时间限制钩子 */
export const executionTimeHook = (maxExecutionTimeMs: number): PreExecutionHook => {
  return async (context, next) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, maxExecutionTimeMs)

    const originalSignal = context.signal
    const handleAbort = () => controller.abort()
    originalSignal.addEventListener('abort', handleAbort)

    Object.defineProperty(context, 'signal', {
      value: controller.signal,
      writable: false
    })

    try {
      const result = await next()
      clearTimeout(timeoutId)
      originalSignal.removeEventListener('abort', handleAbort)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      originalSignal.removeEventListener('abort', handleAbort)
      if (controller.signal.aborted) {
        return { kind: 'deny', reason: `执行超时 (${maxExecutionTimeMs}ms)` }
      }
      throw error
    }
  }
}

/** 速率限制钩子 */
export const rateLimitHook = (
  maxRequests: number,
  windowMs: number
): PreExecutionHook => {
  const requestTimestamps: number[] = []

  return async (_context, next) => {
    const now = Date.now()
    const windowStart = now - windowMs

    while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
      requestTimestamps.shift()
    }

    if (requestTimestamps.length >= maxRequests) {
      return {
        kind: 'deny',
        reason: `速率限制: ${maxRequests} 次请求/${windowMs}ms`
      }
    }

    requestTimestamps.push(now)
    return next()
  }
}
