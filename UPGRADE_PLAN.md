# YourStory2 Agent 架构升级方案

基于 DeepSeek Harness (`dsh`) 架构分析，本项目（Autobiography Agent）在核心设计理念上存在显著差距。本文档提供分阶段、可落地的升级路径。

---

## 一、架构差距分析

| 维度 | 当前实现 | DeepSeek Harness | 差距等级 |
|------|---------|------------------|---------|
| **事件溯源** | 简单 EventEmitter 通知 | 追加型事件日志，单一真相来源 | 🔴 高 |
| **Turn-Step 模型** | 无明确边界 | turn/start → step/* → turn/end | 🔴 高 |
| **上下文压缩** | 基础 LLM 摘要 | 压力触发 + 锁机制 + 工具结果修剪 | 🟡 中 |
| **子代理系统** | 无 | One-shot + Continuable 双模式 | 🔴 高 |
| **工作流系统** | 任务队列 + 分配 | 脚本编排 + Worker 沙箱 + 有界取消 | 🟡 中 |
| **目标系统** | 无 | 持久化目标 + 生命周期 + CAS 更新 | 🟡 中 |
| **能力接缝** | 直接依赖 | Service Definition/Provider/Consumer | 🟡 中 |
| **作用域注册** | 全局 + 会话 | 全局 + 预设 + 代理三层 | 🟢 低 |
| **流处理** | 无 | BlockAssembler + 索引关联 | 🟡 中 |
| **类型驱动状态机** | 基础枚举 | Discriminated Unions + 穷尽检查 | 🟢 低 |

---

## 二、分阶段升级方案

### 阶段一：事件溯源重构（核心基础）

> **目标**：将现有 EventEmitter 重构为追加型事件日志，建立"单一真相来源"

#### 2.1.1 事件日志核心

```typescript
// 新增：src/agent/events/SessionLog.ts

/** 追加型事件日志 - 单一真相来源 */
export interface SessionEvent {
  id: string
  sessionId: string
  turn: number
  step: number
  type: SessionEventType
  payload: SessionEventPayload
  timestamp: number
  /** 种子边界标记 - 区分构造种子和活动写入 */
  seed?: boolean
}

/** 参与模型历史派生的事件类型（表面事件） */
export type SurfaceEventType =
  | 'user/message'
  | 'assistant/message'
  | 'tool/result'

/** 完整事件类型 */
export type SessionEventType =
  | SurfaceEventType
  | 'turn/start'
  | 'turn/end'
  | 'step/start'
  | 'step/end'
  | 'tool/call'
  | 'assistant/chunk'
  | 'todo/write'
  | 'compaction/start'
  | 'compaction/summary'
  | 'compaction/end'
  | 'session/end-seed'

/** 表面操作 - 支持 append 和 replace */
export type SurfaceOp =
  | { op: 'append'; event: SessionEvent }
  | { op: 'replace'; events: SessionEvent[] }

/** 会话日志 - 追加型事件流 */
export class SessionLog {
  private events: SessionEvent[] = []
  private surfaceOps: SurfaceOp[] = []

  /** 追加事件（不可变） */
  append(event: SessionEvent): void {
    this.events.push(event)
  }

  /** 获取所有事件 */
  getAll(): readonly SessionEvent[] {
    return this.events
  }

  /** 获取表面事件（参与模型历史派生） */
  getSurfaceEvents(): SessionEvent[] {
    return this.events.filter(e =>
      ['user/message', 'assistant/message', 'tool/result'].includes(e.type)
    )
  }

  /** 派生模型消息历史 */
  deriveMessages(): ModelMessage[] {
    return this.getSurfaceEvents().map(event => {
      switch (event.type) {
        case 'user/message':
          return { role: 'user', content: event.payload.content }
        case 'assistant/message':
          return { role: 'assistant', content: event.payload.content }
        case 'tool/result':
          return { role: 'tool', content: event.payload.result, toolCallId: event.payload.callId }
      }
    })
  }

  /** 获取指定 Turn 的事件 */
  getTurnEvents(turn: number): SessionEvent[] {
    return this.events.filter(e => e.turn === turn)
  }

  /** 获取种子边界位置 */
  getSeedBoundary(): number {
    const seedIndex = this.events.findIndex(e => e.type === 'session/end-seed')
    return seedIndex >= 0 ? seedIndex + 1 : 0
  }
}
```

#### 2.1.2 事件存储适配器

```typescript
// 新增：src/agent/events/EventStore.ts

export interface EventStore {
  /** 追加事件到日志 */
  append(sessionId: string, event: SessionEvent): Promise<void>
  /** 批量追加 */
  appendBatch(sessionId: string, events: SessionEvent[]): Promise<void>
  /** 读取会话所有事件 */
  readSession(sessionId: string): Promise<SessionEvent[]>
  /** 读取指定范围事件 */
  readRange(sessionId: string, from: number, to: number): Promise<SessionEvent[]>
  /** 获取最后 N 个事件 */
  readLast(sessionId: string, count: number): Promise<SessionEvent[]>
}

/** 内存实现（测试用） */
export class MemoryEventStore implements EventStore {
  private logs: Map<string, SessionEvent[]> = new Map()

  async append(sessionId: string, event: SessionEvent): Promise<void> {
    const log = this.logs.get(sessionId) || []
    log.push(event)
    this.logs.set(sessionId, log)
  }

  async appendBatch(sessionId: string, events: SessionEvent[]): Promise<void> {
    const log = this.logs.get(sessionId) || []
    log.push(...events)
    this.logs.set(sessionId, log)
  }

  async readSession(sessionId: string): Promise<SessionEvent[]> {
    return [...(this.logs.get(sessionId) || [])]
  }

  async readRange(sessionId: string, from: number, to: number): Promise<SessionEvent[]> {
    const log = this.logs.get(sessionId) || []
    return log.slice(from, to)
  }

  async readLast(sessionId: string, count: number): Promise<SessionEvent[]> {
    const log = this.logs.get(sessionId) || []
    return log.slice(-count)
  }
}
```

#### 2.1.3 重构 EventEmitter

```typescript
// 修改：src/agent/events/EventEmitter.ts

export class EventEmitter {
  private log: SessionLog
  private store: EventStore
  private listeners: Map<string, Set<EventHandler>> = new Map()
  private middleware: Map<string, Array<(event: SessionEvent) => Promise<SessionEvent | null>>> = new Map()

  constructor(log: SessionLog, store: EventStore) {
    this.log = log
    this.store = store
  }

  /** 注册中间件（瀑布模式 - 可拦截和修改） */
  use(eventType: string, handler: (event: SessionEvent) => Promise<SessionEvent | null>): () => void {
    const handlers = this.middleware.get(eventType) || []
    handlers.push(handler)
    this.middleware.set(eventType, handlers)
    return () => {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }

  /** 发布事件 - 追加到日志并通知监听器 */
  async emit(event: SessionEvent): Promise<void> {
    // 1. 运行中间件链
    let processedEvent = event
    const handlers = this.middleware.get(event.type) || []
    for (const handler of handlers) {
      const result = await handler(processedEvent)
      if (result === null) return // 被拦截
      processedEvent = result
    }

    // 2. 追加到日志
    this.log.append(processedEvent)

    // 3. 持久化
    await this.store.append(event.sessionId, processedEvent)

    // 4. 通知监听器
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(processedEvent.payload)
        } catch (error) {
          // 监听器错误不应中断事件流
          console.error(`Listener error for ${event.type}:`, error)
        }
      }
    }
  }
}
```

---

### 阶段二：Turn-Step 模型实现

> **目标**：建立清晰的 Turn-Step 生命周期，支持可中断性和数据驱动决策

#### 2.2.1 Turn-Step 状态机

```typescript
// 新增：src/agent/turn/TurnController.ts

export type TurnEndReason =
  | 'completed'       // 正常完成
  | 'tool_calls'      // 需要执行工具
  | 'max_steps'       // 达到最大步数
  | 'cancelled'       // 被取消
  | 'error'           // 错误终止

export type StepEndReason =
  | 'tool_complete'   // 工具执行完成
  | 'tool_error'      // 工具执行失败
  | 'model_done'      // 模型完成响应
  | 'interrupted'     // 被中断

export interface Turn {
  number: number
  startTime: number
  endTime?: number
  reason?: TurnEndReason
  steps: Step[]
}

export interface Step {
  number: number
  turnNumber: number
  startTime: number
  endTime?: number
  reason?: StepEndReason
  toolCalls: ToolCallRecord[]
  modelRequest?: ModelRequest
  modelResponse?: ModelResponse
}

export class TurnController {
  private currentTurn: Turn | null = null
  private turnCounter = 0
  private stepCounter = 0
  private maxStepsPerTurn = 10

  /** 开始新 Turn */
  startTurn(): Turn {
    this.turnCounter++
    this.stepCounter = 0
    this.currentTurn = {
      number: this.turnCounter,
      startTime: Date.now(),
      steps: []
    }
    return this.currentTurn
  }

  /** 开始新 Step */
  startStep(): Step {
    if (!this.currentTurn) {
      throw new Error('No active turn')
    }
    this.stepCounter++
    const step: Step = {
      number: this.stepCounter,
      turnNumber: this.currentTurn.number,
      startTime: Date.now(),
      toolCalls: []
    }
    this.currentTurn.steps.push(step)
    return step
  }

  /** 结束当前 Step */
  endStep(reason: StepEndReason): void {
    if (!this.currentTurn) return
    const currentStep = this.currentTurn.steps[this.currentTurn.steps.length - 1]
    if (currentStep) {
      currentStep.endTime = Date.now()
      currentStep.reason = reason
    }
  }

  /** 结束当前 Turn */
  endTurn(reason: TurnEndReason): void {
    if (!this.currentTurn) return
    this.currentTurn.endTime = Date.now()
    this.currentTurn.reason = reason
  }

  /** 检查是否应该继续当前 Turn */
  shouldContinueTurn(): boolean {
    if (!this.currentTurn) return false
    return this.stepCounter < this.maxStepsPerTurn
  }

  /** 获取当前 Turn */
  getCurrentTurn(): Turn | null {
    return this.currentTurn
  }

  /** 获取当前 Step */
  getCurrentStep(): Step | null {
    if (!this.currentTurn) return null
    return this.currentTurn.steps[this.currentTurn.steps.length - 1] || null
  }
}
```

#### 2.2.2 Agent Handle 与输入路由

```typescript
// 新增：src/agent/handle/AgentHandle.ts

export type AgentStatus = 'idle' | 'running'

export type InboxTarget = 'next-turn' | 'next-step' | 'inject'

export interface InboxMessage {
  message: UserMessage
  target: InboxTarget
  wakeup: boolean
  timestamp: number
}

export class AgentHandle {
  readonly id: string
  status: AgentStatus = 'idle'
  private inbox: InboxMessage[] = []
  private processingPromise: Promise<void> | null = null

  constructor(
    readonly sessionId: string,
    private session: Session,
    private turnController: TurnController,
    private events: EventEmitter
  ) {
    this.id = sessionId
  }

  /** 发送消息到下一个 Turn */
  followup(message: UserMessage): void {
    this.inbox.push({ message, target: 'next-turn', wakeup: true, timestamp: Date.now() })
  }

  /** 引导当前 Turn 的下一个 Step */
  steer(message: UserMessage): void {
    this.inbox.push({ message, target: 'next-step', wakeup: true, timestamp: Date.now() })
  }

  /** 注入到下一个 pre-step */
  inject(message: UserMessage): void {
    this.inbox.push({ message, target: 'inject', wakeup: true, timestamp: Date.now() })
  }

  /** 发送消息（通用） */
  send(message: UserMessage, target: InboxTarget, wakeup: boolean): void {
    this.inbox.push({ message, target, wakeup, timestamp: Date.now() })
  }

  /** 取消当前处理 */
  cancel(cause: AgentCancelCause): void {
    this.events.emit({
      type: 'agent/cancelled',
      payload: { sessionId: this.id, cause }
    })
  }

  /** 等待空闲 */
  async whenIdle(): Promise<void> {
    if (this.status === 'idle') return
    await this.processingPromise
  }

  /** 获取下一个消息 */
  dequeue(): InboxMessage | undefined {
    return this.inbox.shift()
  }

  /** 是否有待处理消息 */
  hasPendingMessages(): boolean {
    return this.inbox.length > 0
  }
}

export type AgentCancelCause =
  | 'user_request'
  | 'timeout'
  | 'parent_cancelled'
  | 'system_shutdown'
```

---

### 阶段三：上下文压缩升级

> **目标**：实现压力触发、锁机制、工具结果修剪的分层压缩策略

#### 2.3.1 分层压缩策略

```typescript
// 修改：src/agent/optimization/ContextCompressor.ts

export type CompactionTrigger = 'pressure' | 'context-overflow' | 'compactNow'

export interface CompactionState {
  isCompacting: boolean
  lastCompactionTime?: number
  compactionCount: number
}

export interface ToolResultPruneOptions {
  /** 保留头部字符数 */
  headChars: number
  /** 保留尾部字符数 */
  tailChars: number
  /** 占位符 */
  placeholder: string
}

export class ContextCompressor {
  private llmAdapter: LLMAdapter
  private compactionState: CompactionState = {
    isCompacting: false,
    compactionCount: 0
  }
  private pruneOptions: ToolResultPruneOptions = {
    headChars: 200,
    tailChars: 200,
    placeholder: '\n...[内容已修剪]...\n'
  }

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter
  }

  /** 检查 Token 压力 */
  checkPressure(history: ConversationTurn[], maxTokens: number): number {
    const totalTokens = this.calculateTokens(history)
    return totalTokens / maxTokens // 返回压力比率 0-1
  }

  /** 判断是否需要压缩 */
  shouldCompress(
    history: ConversationTurn[],
    trigger: CompactionTrigger,
    options: CompressionOptions
  ): boolean {
    switch (trigger) {
      case 'pressure':
        return this.checkPressure(history, options.maxTokens || 50000) > 0.8
      case 'context-overflow':
        return this.calculateTokens(history) > (options.maxTokens || 50000)
      case 'compactNow':
        return true
      default:
        return false
    }
  }

  /** 执行压缩（带锁） */
  async compressWithLock(
    history: ConversationTurn[],
    options: CompressionOptions
  ): Promise<CompressionResult> {
    // 锁检查
    if (this.compactionState.isCompacting) {
      throw new Error('Compaction already in progress')
    }

    this.compactionState.isCompacting = true
    try {
      // 1. 先尝试工具结果修剪
      const prunedHistory = this.pruneToolResults(history)

      // 2. 执行摘要压缩
      const result = await this.compress(prunedHistory, options)

      this.compactionState.lastCompactionTime = Date.now()
      this.compactionState.compactionCount++

      return result
    } finally {
      this.compactionState.isCompacting = false
    }
  }

  /** 修剪工具结果 */
  private pruneToolResults(history: ConversationTurn[]): ConversationTurn[] {
    return history.map(turn => {
      if (turn.role === 'tool' && turn.content.length > this.pruneOptions.headChars + this.pruneOptions.tailChars) {
        const head = turn.content.slice(0, this.pruneOptions.headChars)
        const tail = turn.content.slice(-this.pruneOptions.tailChars)
        return {
          ...turn,
          content: head + this.pruneOptions.placeholder + tail
        }
      }
      return turn
    })
  }

  /** Unicode 码点级别的精确裁剪 */
  pruneAtCodePoint(text: number, headChars: number, tailChars: number): string {
    const codePoints = [...text.toString()]
    if (codePoints.length <= headChars + tailChars) return text.toString()

    const head = codePoints.slice(0, headChars).join('')
    const tail = codePoints.slice(-tailChars).join('')
    return head + this.pruneOptions.placeholder + tail
  }

  /** 获取压缩状态 */
  getCompactionState(): CompactionState {
    return { ...this.compactionState }
  }
}
```

---

### 阶段四：子代理系统

> **目标**：实现 One-shot 和 Continuable 两种子代理模式

#### 2.4.1 子代理管理器

```typescript
// 新增：src/agent/subagent/SubagentManager.ts

export type SubagentMode = 'one-shot' | 'continuable'

export type ActivationStatus = 'running' | 'waiting' | 'settled'

export interface SubagentConfig {
  mode: SubagentMode
  /** 父级会话 ID */
  parentSessionId: string
  /** 子代理系统提示词 */
  systemPrompt?: string
  /** 可用工具列表 */
  tools?: string[]
  /** 最大 Turn 数（One-shot 用） */
  maxTurns?: number
  /** 是否向父级报告 */
  reportToParent?: 'quiet' | 'next-step'
}

export interface Subagent {
  id: string
  sessionId: string
  config: SubagentConfig
  status: ActivationStatus
  createdAt: number
  completedAt?: number
  result?: unknown
}

export class SubagentManager {
  private subagents: Map<string, Subagent> = new Map()
  private parentChildren: Map<string, Set<string>> = new Map()
  private sessionParent: Map<string, string> = new Map()

  /** 创建子代理 */
  async createSubagent(config: SubagentConfig): Promise<Subagent> {
    const id = generateId()
    const sessionId = `subagent:${id}`

    const subagent: Subagent = {
      id,
      sessionId,
      config,
      status: 'running',
      createdAt: Date.now()
    }

    this.subagents.set(id, subagent)

    // 记录父子关系
    const siblings = this.parentChildren.get(config.parentSessionId) || new Set()
    siblings.add(id)
    this.parentChildren.set(config.parentSessionId, siblings)
    this.sessionParent.set(sessionId, config.parentSessionId)

    return subagent
  }

  /** 获取子代理 */
  getSubagent(id: string): Subagent | undefined {
    return this.subagents.get(id)
  }

  /** 获取父级的所有子代理 */
  getParentChildren(parentSessionId: string): Subagent[] {
    const childIds = this.parentChildren.get(parentSessionId) || new Set()
    return Array.from(childIds).map(id => this.subagents.get(id)).filter(Boolean) as Subagent[]
  }

  /** 检查是否可以向子代理发送消息（父级授权） */
  canSendMessage(subagentSessionId: string, senderSessionId: string): boolean {
    const parent = this.sessionParent.get(subagentSessionId)
    return parent === senderSessionId
  }

  /** 向子代理发送消息 */
  async sendToSubagent(subagentSessionId: string, message: UserMessage, senderSessionId: string): Promise<void> {
    if (!this.canSendMessage(subagentSessionId, senderSessionId)) {
      throw new Error('Only parent can send messages to subagent')
    }
    // 实际发送逻辑...
  }

  /** 完成子代理 */
  completeSubagent(id: string, result: unknown): void {
    const subagent = this.subagents.get(id)
    if (!subagent) return

    subagent.status = 'settled'
    subagent.completedAt = Date.now()
    subagent.result = result

    // 通知父级
    this.notifyParent(subagent)
  }

  /** 通知父级 */
  private notifyParent(subagent: Subagent): void {
    // 根据 reportToParent 配置决定是否通知
    if (subagent.config.reportToParent === 'quiet') return
    // 发送通知...
  }

  /** 清理子代理 */
  cleanupSubagent(id: string): void {
    const subagent = this.subagents.get(id)
    if (!subagent) return

    const siblings = this.parentChildren.get(subagent.config.parentSessionId)
    if (siblings) {
      siblings.delete(id)
    }
    this.sessionParent.delete(subagent.sessionId)
    this.subagents.delete(id)
  }
}
```

---

### 阶段五：工作流系统升级

> **目标**：实现脚本化编排、沙箱执行、有界取消

#### 2.5.1 工作流引擎

```typescript
// 新增：src/agent/workflow/WorkflowEngine.ts

export interface WorkflowScript {
  name: string
  description: string
  phases: WorkflowPhase[]
}

export interface WorkflowPhase {
  name: string
  description: string
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  type: 'agent' | 'tool' | 'condition' | 'parallel'
  config: Record<string, unknown>
  onError?: 'abort' | 'continue' | 'retry'
}

export class WorkflowEngine {
  private scripts: Map<string, WorkflowScript> = new Map()
  private runningWorkflows: Map<string, RunningWorkflow> = new Map()

  /** 注册工作流脚本 */
  registerScript(script: WorkflowScript): void {
    this.scripts.set(script.name, script)
  }

  /** 执行工作流 */
  async execute(scriptName: string, context: WorkflowContext): Promise<WorkflowResult> {
    const script = this.scripts.get(scriptName)
    if (!script) throw new Error(`Workflow script not found: ${scriptName}`)

    const workflowId = generateId()
    const abortController = new AbortController()
    const gracePeriodMs = 5000

    const running: RunningWorkflow = {
      id: workflowId,
      script,
      context,
      status: 'running',
      abortController,
      startTime: Date.now()
    }
    this.runningWorkflows.set(workflowId, running)

    try {
      const result = await this.runScript(script, context, abortController.signal)
      running.status = 'completed'
      return { success: true, workflowId, result }
    } catch (error) {
      running.status = 'failed'
      return { success: false, workflowId, error: error instanceof Error ? error.message : String(error) }
    } finally {
      this.runningWorkflows.delete(workflowId)
    }
  }

  /** 取消工作流（有界取消） */
  cancel(workflowId: string, gracePeriodMs: number = 5000): void {
    const running = this.runningWorkflows.get(workflowId)
    if (!running) return

    // 发送取消信号
    running.abortController.abort()

    // 宽限期后强制终止
    setTimeout(() => {
      if (running.status === 'running') {
        running.status = 'force-terminated'
        // 强制清理资源...
      }
    }, gracePeriodMs)
  }

  private async runScript(
    script: WorkflowScript,
    context: WorkflowContext,
    signal: AbortSignal
  ): Promise<unknown> {
    const results: unknown[] = []

    for (const phase of script.phases) {
      if (signal.aborted) throw new Error('Workflow cancelled')

      for (const step of phase.steps) {
        if (signal.aborted) throw new Error('Workflow cancelled')

        const stepResult = await this.executeStep(step, context, signal)
        results.push(stepResult)
      }
    }

    return results
  }

  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    signal: AbortSignal
  ): Promise<unknown> {
    switch (step.type) {
      case 'agent':
        // 启动子代理执行任务
        return this.executeAgentStep(step.config, signal)
      case 'tool':
        // 执行工具
        return this.executeToolStep(step.config, signal)
      case 'condition':
        // 条件判断
        return this.evaluateCondition(step.config, context)
      case 'parallel':
        // 并行执行
        return this.executeParallel(step.config, signal)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }
}
```

---

### 阶段六：目标系统

> **目标**：实现持久化目标、生命周期管理、CAS 更新

#### 2.6.1 目标管理器

```typescript
// 新增：src/agent/goal/GoalManager.ts

export type GoalPhase = 'active' | 'paused' | 'blocked' | 'complete'

export interface Goal {
  id: string
  sessionId: string
  title: string
  description: string
  phase: GoalPhase
  /** 用于 CAS 更新的版本号 */
  revision: number
  /** 量化指标 */
  metrics?: GoalMetric[]
  /** 进展记录 */
  progress: GoalProgress[]
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export interface GoalMetric {
  name: string
  target: number
  current: number
  unit: string
}

export interface GoalProgress {
  timestamp: number
  note: string
  delta?: Partial<Goal>
}

export class GoalManager {
  private goals: Map<string, Goal> = new Map()
  private sessionGoals: Map<string, Set<string>> = new Map()

  /** 创建目标 */
  createGoal(sessionId: string, title: string, description: string, metrics?: GoalMetric[]): Goal {
    const goal: Goal = {
      id: generateId(),
      sessionId,
      title,
      description,
      phase: 'active',
      revision: 0,
      metrics,
      progress: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.goals.set(goal.id, goal)
    const sessionGoalSet = this.sessionGoals.get(sessionId) || new Set()
    sessionGoalSet.add(goal.id)
    this.sessionGoals.set(sessionId, sessionGoalSet)

    return goal
  }

  /** CAS 更新目标 */
  updateGoal(
    goalId: string,
    expectedRevision: number,
    updates: Partial<Omit<Goal, 'id' | 'revision' | 'updatedAt'>>
  ): Goal | null {
    const goal = this.goals.get(goalId)
    if (!goal) return null

    // CAS 检查
    if (goal.revision !== expectedRevision) {
      throw new Error(`CAS conflict: expected revision ${expectedRevision}, actual ${goal.revision}`)
    }

    const previousState = { ...goal }
    Object.assign(goal, updates, {
      revision: goal.revision + 1,
      updatedAt: Date.now()
    })

    // 记录进展
    goal.progress.push({
      timestamp: Date.now(),
      note: 'Goal updated',
      delta: previousState
    })

    return goal
  }

  /** 获取会话的所有目标 */
  getSessionGoals(sessionId: string): Goal[] {
    const goalIds = this.sessionGoals.get(sessionId) || new Set()
    return Array.from(goalIds).map(id => this.goals.get(id)).filter(Boolean) as Goal[]
  }

  /** 获取活跃目标 */
  getActiveGoals(sessionId: string): Goal[] {
    return this.getSessionGoals(sessionId).filter(g => g.phase === 'active')
  }

  /** 标记目标完成 */
  completeGoal(goalId: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.phase = 'complete'
    goal.completedAt = Date.now()
    goal.revision++
    goal.updatedAt = Date.now()
  }

  /** 标记目标阻塞 */
  blockGoal(goalId: string, reason: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.phase = 'blocked'
    goal.revision++
    goal.updatedAt = Date.now()
    goal.progress.push({
      timestamp: Date.now(),
      note: `Blocked: ${reason}`
    })
  }
}
```

---

### 阶段七：能力接缝模式

> **目标**：实现 Service Definition/Provider/Consumer 三重角色

#### 2.7.1 能力注册系统

```typescript
// 新增：src/agent/capability/CapabilityRegistry.ts

/** 服务定义 - 接口契约 */
export interface ServiceDefinition<T = unknown> {
  name: string
  version: string
  capabilities: string[]
  /** 类型标记，用于编译时区分 */
  __brand?: T
}

/** 服务提供者 - 实现 */
export interface ServiceProvider<T = unknown> {
  readonly definition: ServiceDefinition<T>
  provide(): T
}

/** 消费者 - 使用 */
export interface ServiceConsumer<T = unknown> {
  readonly definition: ServiceDefinition<T>
  consume(service: T): void
}

export class CapabilityRegistry {
  private definitions: Map<string, ServiceDefinition> = new Map()
  private providers: Map<string, ServiceProvider> = new Map()
  private consumers: Map<string, ServiceConsumer[]> = new Map()

  /** 注册服务定义 */
  registerDefinition<T>(definition: ServiceDefinition<T>): void {
    this.definitions.set(definition.name, definition)
  }

  /** 注册服务提供者 */
  registerProvider<T>(provider: ServiceProvider<T>): void {
    this.providers.set(provider.definition.name, provider)
    // 通知所有等待的消费者
    this.notifyConsumers(provider.definition.name)
  }

  /** 注册服务消费者 */
  registerConsumer<T>(consumer: ServiceConsumer<T>): () => void {
    const consumers = this.consumers.get(consumer.definition.name) || []
    consumers.push(consumer as ServiceConsumer)
    this.consumers.set(consumer.definition.name, consumers)

    // 如果已有提供者，立即消费
    const provider = this.providers.get(consumer.definition.name)
    if (provider) {
      consumer.consume(provider.provide())
    }

    return () => {
      const idx = consumers.indexOf(consumer as ServiceConsumer)
      if (idx >= 0) consumers.splice(idx, 1)
    }
  }

  /** 获取服务 */
  getService<T>(name: string): T | undefined {
    const provider = this.providers.get(name)
    return provider?.provide() as T | undefined
  }

  private notifyConsumers(name: string): void {
    const provider = this.providers.get(name)
    const consumers = this.consumers.get(name) || []
    if (provider) {
      for (const consumer of consumers) {
        consumer.consume(provider.provide())
      }
    }
  }
}
```

---

## 三、类型系统增强

### 3.1 Discriminated Unions 状态机

```typescript
// 修改：src/agent/types.ts

/** 使用 Discriminated Unions 实现类型安全的状态机 */
export type SessionState =
  | { status: 'active'; lastActivity: number }
  | { status: 'paused'; pausedAt: number; reason?: string }
  | { status: 'closed'; closedAt: number; reason: TurnEndReason }
  | { status: 'compacting'; startedAt: number }

export type ToolExecutionResult =
  | { kind: 'success'; data: unknown; duration: number }
  | { kind: 'failure'; error: Error; recoverable: boolean }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'cancelled'; reason: string }

export type CompactionResult =
  | { kind: 'compressed'; summary: string; tokensSaved: number }
  | { kind: 'skipped'; reason: 'no_pressure' | 'already_compacting' | 'too_short' }
  | { kind: 'failed'; error: Error }

/** 穷尽性检查辅助函数 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`)
}

/** 使用示例 */
export function handleToolResult(result: ToolExecutionResult): string {
  switch (result.kind) {
    case 'success':
      return `Success: ${JSON.stringify(result.data)}`
    case 'failure':
      return `Failed: ${result.error.message}`
    case 'timeout':
      return `Timeout after ${result.timeoutMs}ms`
    case 'cancelled':
      return `Cancelled: ${result.reason}`
    default:
      return assertNever(result) // 编译时检查是否处理了所有情况
  }
}
```

---

## 四、实施优先级与里程碑

### 优先级矩阵

| 阶段 | 影响范围 | 实施难度 | 优先级 | 预计工时 |
|------|---------|---------|--------|---------|
| 阶段一：事件溯源重构 | 核心基础 | 高 | P0 | 3-5 天 |
| 阶段二：Turn-Step 模型 | 核心流程 | 高 | P0 | 2-3 天 |
| 阶段三：上下文压缩升级 | 性能优化 | 中 | P1 | 1-2 天 |
| 阶段四：子代理系统 | 功能扩展 | 高 | P1 | 3-4 天 |
| 阶段五：工作流系统 | 功能扩展 | 高 | P2 | 4-5 天 |
| 阶段六：目标系统 | 功能扩展 | 中 | P2 | 2-3 天 |
| 阶段七：能力接缝 | 架构优化 | 中 | P3 | 2-3 天 |

### 里程碑规划

```
M1 (2周): 核心事件系统
├── 事件日志核心实现
├── 事件存储适配器
├── EventEmitter 重构
└── 现有功能迁移

M2 (2周): 流程模型
├── Turn-Step 状态机
├── Agent Handle 实现
├── 输入路由语义
└── 集成测试

M3 (2周): 压缩与优化
├── 分层压缩策略
├── 工具结果修剪
├── 锁机制实现
└── 性能基准测试

M4 (3周): 高级功能
├── 子代理系统
├── 工作流引擎
├── 目标系统
└── 能力接缝

M5 (1周): 类型安全
├── Discriminated Unions 重构
├── 穷尽性检查
└── 类型测试
```

---

## 五、迁移策略

### 5.1 向后兼容

```typescript
// src/agent/compat/LegacyAdapter.ts

/** 旧接口适配器 - 确保平滑迁移 */
export class LegacyAdapter {
  constructor(private newAgent: NewAgentImplementation) {}

  /** 兼容旧的 handleMessage 接口 */
  async handleMessage(sessionId: string, message: string): Promise<string> {
    const handle = this.newAgent.getHandle(sessionId)
    handle.followup({ content: message, timestamp: Date.now() })
    await handle.whenIdle()
    return handle.getLastResponse()
  }

  /** 兼容旧的 executeTool 接口 */
  async executeTool(sessionId: string, toolName: string, args: any): Promise<ToolResult> {
    return this.newAgent.executeTool(sessionId, toolName, args)
  }
}
```

### 5.2 渐进式迁移

1. **Phase A**: 新增事件日志，旧 EventEmitter 继续工作
2. **Phase B**: 双写模式，新旧系统并行
3. **Phase C**: 切换到新系统，旧系统作为适配器
4. **Phase D**: 移除旧系统

---

## 六、测试策略

### 6.1 单元测试

```typescript
// 新增测试：src/agent/__tests__/event-sourcing.test.ts

describe('Event Sourcing', () => {
  test('SessionLog.append should be immutable', () => {
    const log = new SessionLog()
    const event = createTestEvent('user/message', { content: 'hello' })
    log.append(event)
    expect(log.getAll()).toHaveLength(1)
  })

  test('deriveMessages should only include surface events', () => {
    const log = new SessionLog()
    log.append(createTestEvent('turn/start', { turn: 1 }))
    log.append(createTestEvent('user/message', { content: 'hello' }))
    log.append(createTestEvent('assistant/message', { content: 'hi' }))
    log.append(createTestEvent('tool/call', { name: 'test' }))

    const messages = log.deriveMessages()
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('user')
    expect(messages[1].role).toBe('assistant')
  })

  test('compaction lock should prevent concurrent compaction', async () => {
    const compressor = new ContextCompressor(mockLLMAdapter)
    const promise1 = compressor.compressWithLock(longHistory, {})
    const promise2 = compressor.compressWithLock(longHistory, {})

    await expect(promise2).rejects.toThrow('Compaction already in progress')
    await promise1
  })
})
```

### 6.2 集成测试

```typescript
// 新增测试：src/agent/__tests__/turn-step-flow.test.ts

describe('Turn-Step Flow', () => {
  test('complete turn lifecycle', async () => {
    const agent = createTestAgent()
    const handle = await agent.createSession('chapter-1')

    handle.followup({ content: 'Hello', timestamp: Date.now() })
    await handle.whenIdle()

    const turn = agent.turnController.getCurrentTurn()
    expect(turn).toBeDefined()
    expect(turn?.reason).toBe('completed')
  })
})
```

---

## 七、总结

本升级方案基于 DeepSeek Harness 的核心设计理念，为 YourStory2 Agent 架构提供了系统性的升级路径：

### 核心收益

1. **事件溯源**：完整的审计追踪、状态重构、时间旅行调试能力
2. **清晰边界**：Turn-Step 模型提供明确的处理阶段和可中断性
3. **可扩展性**：能力接缝模式支持可替换实现
4. **类型安全**：Discriminated Unions 提供编译时状态检查
5. **生产级设计**：锁机制、有界取消、CAS 更新等生产环境特性

### 关键决策

1. **渐进式迁移**：通过适配器模式确保向后兼容
2. **测试驱动**：每个阶段都有完整的测试覆盖
3. **模块化设计**：各阶段可独立实施，降低风险
