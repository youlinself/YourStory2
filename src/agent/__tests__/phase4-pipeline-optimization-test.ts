/**
 * Phase 4 管道与优化 - 逻辑验证脚本
 * 运行方式: npx tsx src/agent/__tests__/phase4-pipeline-optimization-test.ts
 */

declare const process: { exit(code?: number): never }

import { ExtractionPipeline } from '../pipeline/ExtractionPipeline'
import {
  validationHook,
  tokenBudgetHook,
  abortCheckHook,
  resultValidationHook,
  sessionExistsHook,
  rateLimitHook
} from '../pipeline/hooks'
import { TokenBudgetManager } from '../optimization/TokenBudget'
import { ContextCompressor } from '../optimization/ContextCompressor'
import { RetryPolicy } from '../optimization/RetryPolicy'
import { EventEmitter, SessionLog, MemoryEventStore } from '../events'

function createEventEmitter(): EventEmitter {
  return new EventEmitter(new SessionLog(), new MemoryEventStore())
}
import type { PipelineContext } from '../pipeline/types'
import type { ToolDefinition, ToolResult } from '../tools/ToolTypes'
import type { LLMAdapter } from '../llm/LLMAdapter'
import type { SessionContext } from '../session/types'
import type { ConversationTurn } from '../session/types'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected)
  if (isEqual) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
    console.error(`     期望: ${JSON.stringify(expected)}`)
    console.error(`     实际: ${JSON.stringify(actual)}`)
  }
}

async function runAsync(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n📦 ${name}`)
  try {
    await fn()
  } catch (error) {
    failed++
    console.error(`  ❌ 测试抛出异常: ${error}`)
  }
}

// ============================================================
// 测试数据
// ============================================================
const mockContext: SessionContext = {
  chapterId: 'ch-001',
  existingContent: null,
  userPreferences: {
    style: 'casual',
    language: 'zh',
    perspective: 'first',
    autoExtract: true
  },
  timelineContext: { currentEra: '1990-2000' },
  extractedCache: []
}

const createMockTool = (name: string, result: ToolResult): ToolDefinition => ({
  name,
  description: `测试工具 ${name}`,
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: '输入' }
    }
  },
  async execute(_args: unknown) {
    return result
  }
})

const createPipelineContext = (overrides: Partial<PipelineContext> = {}): PipelineContext => ({
  sessionId: 'session-001',
  toolName: 'test_tool',
  args: { input: 'test' },
  sessionContext: mockContext,
  signal: new AbortController().signal,
  ...overrides
})

// ============================================================
// ExtractionPipeline 测试
// ============================================================
async function testExtractionPipeline(): Promise<void> {
  await runAsync('ExtractionPipeline - 基本执行', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)
    const tool = createMockTool('test_tool', { success: true, data: { output: 'result' } })
    const context = createPipelineContext()

    const result = await pipeline.execute(tool, context.args, context)

    assertEqual(result.success, true, '执行成功')
    assertEqual((result.data as { output: string }).output, 'result', '返回数据正确')
    assertEqual(result.messages.length, 0, '无额外消息')
  })

  await runAsync('ExtractionPipeline - pre-hook 拒绝执行', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)

    pipeline.addPreHook(async () => ({ kind: 'deny', reason: '测试拒绝' }))

    const tool = createMockTool('test_tool', { success: true })
    const context = createPipelineContext()

    const result = await pipeline.execute(tool, context.args, context)

    assertEqual(result.success, false, '执行失败')
    assertEqual(result.blocked, true, '被阻止')
    assertEqual(result.error, '测试拒绝', '拒绝原因正确')
  })

  await runAsync('ExtractionPipeline - post-hook 阻止结果', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)

    pipeline.addPostHook(async (_ctx, _result, _next) => ({
      kind: 'block',
      feedback: '结果被阻止'
    }))

    const tool = createMockTool('test_tool', { success: true })
    const context = createPipelineContext()

    const result = await pipeline.execute(tool, context.args, context)

    assertEqual(result.success, false, '执行失败')
    assertEqual(result.blocked, true, '被阻止')
    assertEqual(result.error, '结果被阻止', '阻止原因正确')
  })

  await runAsync('ExtractionPipeline - hook 链式执行', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)
    const executionOrder: string[] = []

    pipeline.addPreHook(async (_ctx, next) => {
      executionOrder.push('pre-hook-1')
      return next()
    })

    pipeline.addPreHook(async (_ctx, next) => {
      executionOrder.push('pre-hook-2')
      return next()
    })

    const tool = createMockTool('test_tool', { success: true })
    const context = createPipelineContext()

    await pipeline.execute(tool, context.args, context)

    assertEqual(executionOrder, ['pre-hook-1', 'pre-hook-2'], 'hook 按顺序执行')
  })

  await runAsync('ExtractionPipeline - 工具执行异常', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)

    const errorTool: ToolDefinition = {
      name: 'error_tool',
      description: '错误工具',
      parameters: { type: 'object', properties: {} },
      async execute() {
        throw new Error('工具执行错误')
      }
    }

    const context = createPipelineContext({ toolName: 'error_tool' })
    const result = await pipeline.execute(errorTool, context.args, context)

    assertEqual(result.success, false, '执行失败')
    assertEqual(result.error, '工具执行错误', '错误信息正确')
  })

  await runAsync('ExtractionPipeline - 注销 hook', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)

    const hook = async () => ({ kind: 'deny' as const, reason: '阻止' })
    const unsubscribe = pipeline.addPreHook(hook)

    assertEqual(pipeline.getPreHookCount(), 1, 'hook 已注册')

    unsubscribe()
    assertEqual(pipeline.getPreHookCount(), 0, 'hook 已注销')
  })

  await runAsync('ExtractionPipeline - 清空所有 hook', async () => {
    const events = createEventEmitter()
    const pipeline = new ExtractionPipeline(events)

    pipeline.addPreHook(async (_ctx, next) => next())
    pipeline.addPostHook(async (_ctx, _result, next) => next())

    assertEqual(pipeline.getPreHookCount(), 1, 'pre-hook 已注册')
    assertEqual(pipeline.getPostHookCount(), 1, 'post-hook 已注册')

    pipeline.clearHooks()

    assertEqual(pipeline.getPreHookCount(), 0, 'pre-hook 已清空')
    assertEqual(pipeline.getPostHookCount(), 0, 'post-hook 已清空')
  })
}

// ============================================================
// 内置钩子测试
// ============================================================
async function testBuiltInHooks(): Promise<void> {
  await runAsync('validationHook - 参数完整时放行', async () => {
    const context = createPipelineContext()
    const decision = await validationHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'allow', '参数完整，放行')
  })

  await runAsync('validationHook - 参数不完整时拒绝', async () => {
    const context = createPipelineContext({ toolName: '' })
    const decision = await validationHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'deny', '参数不完整，拒绝')
  })

  await runAsync('tokenBudgetHook - 预算充足时放行', async () => {
    const getBudget = () => ({ used: 50000, limit: 100000 })
    const hook = tokenBudgetHook(getBudget)
    const context = createPipelineContext()

    const decision = await hook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'allow', '预算充足，放行')
  })

  await runAsync('tokenBudgetHook - 预算不足时拒绝', async () => {
    const getBudget = () => ({ used: 99500, limit: 100000 })
    const hook = tokenBudgetHook(getBudget)
    const context = createPipelineContext()

    const decision = await hook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'deny', '预算不足，拒绝')
  })

  await runAsync('abortCheckHook - 未取消时放行', async () => {
    const context = createPipelineContext()
    const decision = await abortCheckHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'allow', '未取消，放行')
  })

  await runAsync('abortCheckHook - 已取消时拒绝', async () => {
    const controller = new AbortController()
    controller.abort()
    const context = createPipelineContext({ signal: controller.signal })

    const decision = await abortCheckHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'deny', '已取消，拒绝')
  })

  await runAsync('sessionExistsHook - 会话 ID 存在时放行', async () => {
    const context = createPipelineContext({ sessionId: 'session-001' })
    const decision = await sessionExistsHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'allow', '会话 ID 存在，放行')
  })

  await runAsync('sessionExistsHook - 会话 ID 为空时拒绝', async () => {
    const context = createPipelineContext({ sessionId: '' })
    const decision = await sessionExistsHook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'deny', '会话 ID 为空，拒绝')
  })

  await runAsync('rateLimitHook - 限制内放行', async () => {
    const hook = rateLimitHook(3, 1000)
    const context = createPipelineContext()

    const decision1 = await hook(context, async () => ({ kind: 'allow' }))
    const decision2 = await hook(context, async () => ({ kind: 'allow' }))
    const decision3 = await hook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision1.kind, 'allow', '第1次请求放行')
    assertEqual(decision2.kind, 'allow', '第2次请求放行')
    assertEqual(decision3.kind, 'allow', '第3次请求放行')
  })

  await runAsync('rateLimitHook - 超出限制拒绝', async () => {
    const hook = rateLimitHook(2, 1000)
    const context = createPipelineContext()

    await hook(context, async () => ({ kind: 'allow' }))
    await hook(context, async () => ({ kind: 'allow' }))
    const decision = await hook(context, async () => ({ kind: 'allow' }))

    assertEqual(decision.kind, 'deny', '超出限制，拒绝')
  })

  await runAsync('resultValidationHook - 成功结果放行', async () => {
    const context = createPipelineContext()
    const result: ToolResult = { success: true, data: 'test' }

    const decision = await resultValidationHook(context, result, async () => ({
      kind: 'accept',
      content: result.data
    }))

    assertEqual(decision.kind, 'accept', '成功结果，放行')
  })
}

// ============================================================
// TokenBudgetManager 测试
// ============================================================
async function testTokenBudgetManager(): Promise<void> {
  await runAsync('TokenBudgetManager - 初始化会话', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001', 100000, 80000)

    const stats = manager.getStats('session-001')
    assert(stats !== null, '会话已初始化')
    assertEqual(stats?.used, 0, '初始使用量为 0')
    assertEqual(stats?.limit, 100000, '限额正确')
    assertEqual(stats?.warningThreshold, 80000, '警告阈值正确')
  })

  await runAsync('TokenBudgetManager - 记录使用量', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001')

    manager.recordUsage('session-001', 1000)
    manager.recordUsage('session-001', 2000)

    assertEqual(manager.getStats('session-001')?.used, 3000, '使用量累计正确')
    assertEqual(manager.getRemaining('session-001'), 97000, '剩余量正确')
  })

  await runAsync('TokenBudgetManager - 警告回调', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001', 100000, 80000)

    let warningTriggered = false
    manager.onWarning('session-001', () => { warningTriggered = true })

    manager.recordUsage('session-001', 70000)
    assertEqual(warningTriggered, false, '70000 未触发警告')

    manager.recordUsage('session-001', 15000)
    assertEqual(warningTriggered, true, '85000 触发警告')
  })

  await runAsync('TokenBudgetManager - 限制回调', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001', 100000, 80000)

    let limitTriggered = false
    manager.onLimitReached('session-001', () => { limitTriggered = true })

    manager.recordUsage('session-001', 90000)
    assertEqual(limitTriggered, false, '90000 未触发限制')

    manager.recordUsage('session-001', 15000)
    assertEqual(limitTriggered, true, '105000 触发限制')
  })

  await runAsync('TokenBudgetManager - 估算 Token', async () => {
    const manager = new TokenBudgetManager()

    const chineseTokens = manager.estimateTokens('你好世界')
    assert(chineseTokens > 0, '中文 Token 估算大于 0')

    const englishTokens = manager.estimateTokens('Hello World')
    assert(englishTokens > 0, '英文 Token 估算大于 0')
  })

  await runAsync('TokenBudgetManager - 清理会话', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001')

    assert(manager.hasSession('session-001'), '会话存在')

    manager.cleanup('session-001')

    assert(!manager.hasSession('session-001'), '会话已清理')
    assertEqual(manager.getStats('session-001'), null, '清理后获取为 null')
  })

  await runAsync('TokenBudgetManager - 获取所有会话 ID', async () => {
    const manager = new TokenBudgetManager()
    manager.initSession('session-001')
    manager.initSession('session-002')

    const ids = manager.getSessionIds()
    assertEqual(ids.length, 2, '获取到 2 个会话 ID')
    assert(ids.includes('session-001'), '包含 session-001')
    assert(ids.includes('session-002'), '包含 session-002')
  })
}

// ============================================================
// ContextCompressor 测试
// ============================================================
async function testContextCompressor(): Promise<void> {
  const mockLLMAdapter: LLMAdapter = {
    async generate() {
      return '这是对话的摘要'
    },
    async generateStreaming(_prompt, onChunk) {
      onChunk('这是对话的摘要')
      return '这是对话的摘要'
    }
  }

  await runAsync('ContextCompressor - 不需要压缩', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)
    const history: ConversationTurn[] = [
      { role: 'user', content: '你好', timestamp: Date.now() }
    ]

    assertEqual(compressor.shouldCompressLegacy(history, 20, 50000), false, '短历史不需要压缩')
  })

  await runAsync('ContextCompressor - 需要压缩（轮次超限）', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)
    const history: ConversationTurn[] = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `这是一条比较长的消息内容，用于测试 Token 超限的情况，消息 ${i}`,
      timestamp: Date.now() + i
    }))

    assertEqual(compressor.shouldCompressLegacy(history, 20, 50000), true, '超过 20 轮需要压缩')
  })

  await runAsync('ContextCompressor - 执行压缩', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)
    const history: ConversationTurn[] = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `消息 ${i}`,
      timestamp: Date.now() + i
    }))

    const result = await compressor.compress(history, { keepRecent: 3 })

    assertEqual(result.compressedHistory.length, 4, '压缩后保留 3 轮 + 1 条摘要')
    assertEqual(result.removedCount, 7, '移除了 7 轮')
    assert(result.tokensSaved > 0, '节省了 Token')
    assert(result.summary.length > 0, '生成了摘要')
  })

  await runAsync('ContextCompressor - 历史过短不压缩', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)
    const history: ConversationTurn[] = [
      { role: 'user', content: '你好', timestamp: Date.now() }
    ]

    const result = await compressor.compress(history, { keepRecent: 5 })

    assertEqual(result.compressedHistory.length, 1, '历史过短不压缩')
    assertEqual(result.removedCount, 0, '未移除任何轮次')
    assertEqual(result.tokensSaved, 0, '未节省 Token')
  })

  await runAsync('ContextCompressor - 估算 Token', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)

    const tokens = compressor.estimateTokens('Hello World')
    assert(tokens > 0, 'Token 估算大于 0')
  })
}

// ============================================================
// RetryPolicy 测试
// ============================================================
async function testRetryPolicy(): Promise<void> {
  await runAsync('RetryPolicy - 成功不重试', async () => {
    const policy = new RetryPolicy()
    let attempts = 0

    const result = await policy.execute(async () => {
      attempts++
      return 'success'
    })

    assertEqual(result, 'success', '执行成功')
    assertEqual(attempts, 1, '只执行一次')
  })

  await runAsync('RetryPolicy - 可重试错误自动重试', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelay: 10,
      retryableErrors: ['NETWORK_ERROR']
    })
    let attempts = 0

    const result = await policy.execute(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('NETWORK_ERROR: connection failed')
      }
      return 'success'
    })

    assertEqual(result, 'success', '最终成功')
    assertEqual(attempts, 3, '执行了 3 次')
  })

  await runAsync('RetryPolicy - 不可重试错误立即失败', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      retryableErrors: ['NETWORK_ERROR']
    })
    let attempts = 0

    let threw = false
    try {
      await policy.execute(async () => {
        attempts++
        throw new Error('INVALID_INPUT')
      })
    } catch {
      threw = true
    }

    assert(threw, '抛出异常')
    assertEqual(attempts, 1, '只执行一次')
  })

  await runAsync('RetryPolicy - 超过最大重试次数', async () => {
    const policy = new RetryPolicy({
      maxRetries: 2,
      baseDelay: 10,
      retryableErrors: ['NETWORK_ERROR']
    })
    let attempts = 0

    let threw = false
    try {
      await policy.execute(async () => {
        attempts++
        throw new Error('NETWORK_ERROR')
      })
    } catch {
      threw = true
    }

    assert(threw, '抛出异常')
    assertEqual(attempts, 3, '执行了 3 次（1 + 2 次重试）')
  })

  await runAsync('RetryPolicy - 获取配置', async () => {
    const policy = new RetryPolicy({ maxRetries: 5 })
    const options = policy.getOptions()

    assertEqual(options.maxRetries, 5, '配置正确')
  })
}

// ============================================================
// 运行所有测试
// ============================================================
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Phase 4 管道与优化 - 逻辑验证')
  console.log('='.repeat(60))

  await testExtractionPipeline()
  await testBuiltInHooks()
  await testTokenBudgetManager()
  await testContextCompressor()
  await testRetryPolicy()

  console.log('\n' + '='.repeat(60))
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('='.repeat(60))

  if (failed > 0) {
    throw new Error(`${failed} tests failed`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
