# Phase 4: 管道与优化

## 阶段目标

实现执行管道和系统优化：
1. 执行管道 (Extraction Pipeline)
2. Token 预算管理
3. 上下文压缩
4. 错误处理与重试机制

## 预估工时

1 周

---

## 1. 执行管道 (Extraction Pipeline)

### 1.1 设计目标

实现类似 deepseek-harness 的工具执行管道：
- pre-execute：执行前验证
- execute：执行工具
- post-execute：执行后处理

### 1.2 核心类型定义

```typescript
// src/agent/pipeline/types.ts

/** 执行前决策 */
export type PreExecutionDecision =
  | { kind: 'allow' }
  | { kind: 'deny'; reason: string }
  | { kind: 'ask'; reason?: string }

/** 执行后决策 */
export type PostExecutionDecision =
  | { kind: 'accept'; content?: any; additionalMessages?: string[] }
  | { kind: 'block'; feedback: string; additionalMessages?: string[] }

/** 管道上下文 */
export interface PipelineContext {
  sessionId: string
  toolName: string
  args: any
  sessionContext: SessionContext
  signal: AbortSignal
}

/** 管道阶段结果 */
export interface PipelineResult {
  success: boolean
  data?: any
  error?: string
  blocked?: boolean
  messages: string[]
}
```

### 1.3 Pipeline 实现

```typescript
// src/agent/pipeline/ExtractionPipeline.ts

import {
  PreExecutionDecision,
  PostExecutionDecision,
  PipelineContext,
  PipelineResult
} from './types'
import { ToolDefinition, ToolResult } from '../tools/ToolTypes'
import { EventEmitter } from '../events/EventEmitter'

export type PreExecutionHook = (
  context: PipelineContext,
  next: () => Promise<PreExecutionDecision>
) => Promise<PreExecutionDecision>

export type PostExecutionHook = (
  context: PipelineContext,
  result: ToolResult,
  next: () => Promise<PostExecutionDecision>
) => Promise<PostExecutionDecision>

export class ExtractionPipeline {
  private preHooks: PreExecutionHook[] = []
  private postHooks: PostExecutionHook[] = []
  private events: EventEmitter

  constructor(events: EventEmitter) {
    this.events = events
  }

  /** 注册执行前钩子 */
  addPreHook(hook: PreExecutionHook): () => void {
    this.preHooks.push(hook)
    return () => {
      const index = this.preHooks.indexOf(hook)
      if (index >= 0) this.preHooks.splice(index, 1)
    }
  }

  /** 注册执行后钩子 */
  addPostHook(hook: PostExecutionHook): () => void {
    this.postHooks.push(hook)
    return () => {
      const index = this.postHooks.indexOf(hook)
      if (index >= 0) this.postHooks.splice(index, 1)
    }
  }

  /** 执行完整管道 */
  async execute(
    tool: ToolDefinition,
    args: any,
    context: PipelineContext
  ): Promise<PipelineResult> {
    const messages: string[] = []

    // 1. Pre-execute 阶段
    const preDecision = await this.runPreExecute(context)
    if (preDecision.kind === 'deny') {
      return {
        success: false,
        blocked: true,
        error: preDecision.reason,
        messages: [`执行被拒绝: ${preDecision.reason}`]
      }
    }

    // 2. Execute 阶段
    let result: ToolResult
    try {
      result = await tool.execute(args, {
        sessionId: context.sessionId,
        chapterId: context.chapterId,
        sessionContext: context.sessionContext,
        signal: context.signal
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        messages: ['工具执行出错']
      }
    }

    // 3. Post-execute 阶段
    const postDecision = await this.runPostExecute(context, result)
    if (postDecision.kind === 'block') {
      return {
        success: false,
        blocked: true,
        error: postDecision.feedback,
        messages: [postDecision.feedback]
      }
    }

    // 收集额外消息
    messages.push(...(postDecision.additionalMessages || []))

    return {
      success: result.success,
      data: result.data,
      messages
    }
  }

  /** 执行 pre-execute 链 */
  private async runPreExecute(
    context: PipelineContext
  ): Promise<PreExecutionDecision> {
    let index = 0

    const next = async (): Promise<PreExecutionDecision> => {
      if (index >= this.preHooks.length) {
        return { kind: 'allow' }
      }
      const hook = this.preHooks[index++]
      return hook(context, next)
    }

    return next()
  }

  /** 执行 post-execute 链 */
  private async runPostExecute(
    context: PipelineContext,
    result: ToolResult
  ): Promise<PostExecutionDecision> {
    let index = 0

    const next = async (): Promise<PostExecutionDecision> => {
      if (index >= this.postHooks.length) {
        return { kind: 'accept', content: result.data }
      }
      const hook = this.postHooks[index++]
      return hook(context, result, next)
    }

    return next()
  }
}
```

### 1.4 内置钩子

```typescript
// src/agent/pipeline/hooks.ts

import { PreExecutionHook, PostExecutionHook, PipelineContext } from './types'

/** 参数验证钩子 */
export const validationHook: PreExecutionHook = async (context, next) => {
  // 验证参数
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

/** 结果验证钩子 */
export const resultValidationHook: PostExecutionHook = async (
  context,
  result,
  next
) => {
  if (!result.success && result.error) {
    // 可以选择阻止错误结果或继续
    console.warn(`[Pipeline] Tool ${context.toolName} failed: ${result.error}`)
  }
  return next()
}
```

---

## 2. Token 预算管理

### 2.1 设计目标

- 追踪每个会话的 Token 使用量
- 设置警告和限制阈值
- 超限时触发上下文压缩或停止

### 2.2 实现

```typescript
// src/agent/optimization/TokenBudget.ts

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

    // 检查警告阈值
    if (stats.used >= stats.warningThreshold && stats.used - tokens < stats.warningThreshold) {
      this.warningCallbacks.get(sessionId)?.()
    }

    // 检查限制
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
    // 粗略估算：中文约 1.5 token/字，英文约 0.75 token/词
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const otherChars = text.length - chineseChars - englishWords.join('').length
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 0.75 + otherChars * 0.5)
  }

  /** 清理会话 */
  cleanup(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.warningCallbacks.delete(sessionId)
    this.limitCallbacks.delete(sessionId)
  }
}
```

---

## 3. 上下文压缩

### 3.1 设计目标

- 当对话历史过长时自动压缩
- 保留关键信息
- 减少 Token 消耗

### 3.2 实现

```typescript
// src/agent/optimization/ContextCompressor.ts

import { ConversationTurn } from '../session/types'

export interface CompressionResult {
  compressedHistory: ConversationTurn[]
  summary: string
  removedCount: number
  tokensSaved: number
}

export class ContextCompressor {
  private llmAdapter: LLMAdapter

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter
  }

  /** 检查是否需要压缩 */
  shouldCompress(
    history: ConversationTurn[],
    maxTurns: number = 20,
    maxTokens: number = 50000
  ): boolean {
    if (history.length <= maxTurns) return false
    
    const totalTokens = history.reduce(
      (sum, turn) => sum + this.estimateTokens(turn.content),
      0
    )
    
    return totalTokens > maxTokens
  }

  /** 执行压缩 */
  async compress(
    history: ConversationTurn[],
    options: {
      keepRecent?: number  // 保留最近 N 轮
      summaryPrompt?: string
    } = {}
  ): Promise<CompressionResult> {
    const { keepRecent = 5 } = options
    
    if (history.length <= keepRecent) {
      return {
        compressedHistory: history,
        summary: '',
        removedCount: 0,
        tokensSaved: 0
      }
    }

    // 分离需要压缩的部分和保留的部分
    const toCompress = history.slice(0, -keepRecent)
    const toKeep = history.slice(-keepRecent)

    // 生成摘要
    const summary = await this.generateSummary(toCompress)

    // 构建压缩后的历史
    const compressedHistory: ConversationTurn[] = [
      {
        role: 'system',
        content: `[之前的对话摘要]\n${summary}`,
        timestamp: toCompress[0].timestamp
      },
      ...toKeep
    ]

    // 计算节省的 Token
    const originalTokens = this.calculateTokens(history)
    const compressedTokens = this.calculateTokens(compressedHistory)

    return {
      compressedHistory,
      summary,
      removedCount: toCompress.length,
      tokensSaved: originalTokens - compressedTokens
    }
  }

  /** 生成对话摘要 */
  private async generateSummary(turns: ConversationTurn[]): Promise<string> {
    const conversationText = turns
      .map(t => `${t.role}: ${t.content}`)
      .join('\n')

    const prompt = `
请将以下对话内容压缩为简洁的摘要，保留关键信息、决策和情感要点：

${conversationText}

要求：
1. 提取关键事件和决定
2. 保留重要的人物和情感信息
3. 用简洁的语言总结
4. 字数控制在原文的 20-30%
    `.trim()

    return this.llmAdapter.generate(prompt)
  }

  /** 估算 Token */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length * 0.75)  // 粗略估算
  }

  /** 计算历史总 Token */
  private calculateTokens(history: ConversationTurn[]): number {
    return history.reduce((sum, turn) => sum + this.estimateTokens(turn.content), 0)
  }
}
```

---

## 4. 错误处理与重试

### 4.1 实现

```typescript
// src/agent/optimization/RetryPolicy.ts

export interface RetryOptions {
  maxRetries: number      // 最大重试次数
  baseDelay: number       // 基础延迟（毫秒）
  maxDelay: number        // 最大延迟（毫秒）
  backoffFactor: number   // 退避因子
  retryableErrors: string[]  // 可重试的错误代码
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

        // 检查是否应该重试
        if (!this.shouldRetry(error) || attempt >= this.options.maxRetries) {
          throw error
        }

        // 计算延迟
        const delay = this.calculateDelay(attempt)
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /** 检查是否应该重试 */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // 检查错误消息中是否包含可重试的错误代码
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
}
```

---

## 5. LLM 适配层

```typescript
// src/agent/llm/LLMAdapter.ts

export interface LLMOptions {
  model: string
  temperature?: number
  maxTokens?: number
}

export interface LLMAdapter {
  generate(prompt: string, options?: LLMOptions): Promise<string>
  generateStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMOptions
  ): Promise<string>
}

/** 统一 LLM 适配器实现 */
export class UnifiedLLMAdapter implements LLMAdapter {
  private vendors: Map<string, AIVendor>
  private defaultVendor: string

  constructor(vendors: Map<string, AIVendor>, defaultVendor: string) {
    this.vendors = vendors
    this.defaultVendor = defaultVendor
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    const vendor = this.vendors.get(this.defaultVendor)
    if (!vendor) throw new Error(`Vendor not found: ${this.defaultVendor}`)

    return vendor.chat({
      messages: [{ role: 'user', content: prompt }],
      ...options
    })
  }

  async generateStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: LLMOptions = {}
  ): Promise<string> {
    const vendor = this.vendors.get(this.defaultVendor)
    if (!vendor) throw new Error(`Vendor not found: ${this.defaultVendor}`)

    return vendor.chatStream({
      messages: [{ role: 'user', content: prompt }],
      onChunk,
      ...options
    })
  }
}
```

---

## 6. 测试计划

### 6.1 单元测试

| 模块 | 测试内容 |
|------|----------|
| Pipeline | pre/execute/post 钩子链 |
| TokenBudget | 使用记录、警告、限制 |
| ContextCompressor | 压缩逻辑、摘要生成 |
| RetryPolicy | 重试逻辑、退避计算 |

### 6.2 集成测试

| 场景 | 测试内容 |
|------|----------|
| 完整管道 | 验证 → 执行 → 后处理 |
| Token 超限 | 触发压缩或停止 |
| 网络错误 | 自动重试 |

---

## 7. 验收清单

- [ ] 执行管道正常工作
- [ ] 钩子可注册和执行
- [ ] Token 预算追踪准确
- [ ] 警告和限制回调正常
- [ ] 上下文压缩有效
- [ ] 重试机制正常
- [ ] 所有单元测试通过

---

## 8. 开发日志

| 日期 | 内容 | 状态 |
|------|------|------|
| - | 初始化阶段文档 | ✅ |

---

## 9. 总结

_（阶段完成后填写）_
