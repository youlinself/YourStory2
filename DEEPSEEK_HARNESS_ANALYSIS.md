# DeepSeek Harness 项目分析与Agent流程优化建议

## 一、项目概述

**DeepSeek Harness (`dsh`)** 是 DeepSeek AI 开源的 Agent 框架，基于 **Cordis** 框架构建，采用 **"一切皆插件"** 的架构设计。该项目是一个高度工程化的 Agent 运行时环境，提供了完整的会话管理、工具调度、子代理协调、上下文压缩等核心能力。

### 核心设计理念

| 设计原则 | 说明 |
|---------|------|
| **一切皆插件** | 模型适配器、工具注册表、会话日志、Agent循环本身都是插件，可从配置替换 |
| **事件溯源** | 会话日志是追加型事件流，是单一事实来源（Single Source of Truth） |
| **能力接缝（Capability Seams）** | 通过 Service Definition、Provider、Consumer 三重角色实现可替换能力 |
| **类型安全** | 大量使用 TypeScript 的 branded types、discriminated unions、declaration merging |

---

## 二、AI管理与文本处理方式分析

### 2.1 会话日志与事件系统

#### 核心设计：追加型事件日志

```
Session = append-only log of typed SessionEvents
```

**关键洞察：**
- **模型可见即记录**：任何到达模型请求的内容必须能从日志重构
- **派生历史而非存储历史**：LLM 消息历史从日志派生（`deriveMessages()`），而非单独存储
- **表面（Surface）概念**：只有 `user/message`、`assistant/message`、`tool/result` 三种事件类型参与模型历史派生

#### 事件类型体系

```typescript
// 核心事件类型
interface SessionEventMap {
  'turn/start': { turn: number }
  'turn/end': { turn: number; reason: TurnEndReason }
  'step/start': { turn: number; step: number }
  'step/end': { turn: number; step: number }
  'user/message': UserMessage
  'assistant/chunk': { turn, step, chunk }  // 原始流块
  'assistant/message': { turn, step, message, usage? }
  'tool/call': { turn, step, callId, name, arguments }
  'tool/result': { turn, step, message, error?, meta? }
  'todo/write': { todos: TodoItem[] }
  'request/header': { header: EpochHeader }
  'session/end-seed': Record<string, never>
}
```

**可借鉴点：**
1. **声明式扩展**：插件通过 `declaration merging` 添加新事件类型，无需修改核心包
2. **表面操作（SurfaceOp）**：支持 `append` 和 `replace` 两种操作，为压缩功能提供基础
3. **种子边界（end-seed）**：区分构造种子和活​​动写入，支持崩溃恢复

### 2.2 上下文压缩（Compaction）

#### 压缩机制设计

```
压缩 = 选择表面范围 → 生成摘要 → 替换原内容
```

**三种压缩触发方式：**
| 触发方式 | 说明 |
|---------|------|
| `pressure` | 基于 token 压力的自动触发 |
| `context-overflow` | 上下文溢出时的强制压缩 |
| `compactNow` | 手动/空闲时的显式压缩 |

**压缩事件流：**
```
compaction/start → compaction/summary → user/message(replace) → compaction/end
```

**工具结果修剪（Tool Result Pruning）：**
- 在压缩前可选地修剪过长的工具结果
- 保留头尾部分，中间用占位符替代
- 支持 Unicode 码点级别的精确裁剪

**可借鉴点：**
1. **锁机制**：`compaction/start` 和 `compaction/end` 形成锁，防止并发压缩
2. **事务性**：整个压缩操作是事务性的，失败可检测
3. **分层策略**：先尝试修剪，再考虑摘要压缩

### 2.3 LLM 流处理

#### 流协议设计

```typescript
type StreamChunk =
  | { type: 'block-start'; index: number; blockType: ContentBlockType }
  | { type: 'text-delta'; index: number; text: string }
  | { type: 'reasoning-delta'; index: number; text: string }
  | { type: 'tool-call-delta'; index: number; id, name?, argumentsDelta }
  | { type: 'block-end'; index: number; block: ContentBlock }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'finish'; reason: FinishReason; replayState? }
```

**BlockAssembler 设计：**
- 增量组装原始流块为完整 ContentBlock
- 处理 max-tokens 截断（安全丢弃不完整的工具调用）
- 保持 replay state 与内容对齐

**可借鉴点：**
1. **索引关联**：通过 `index` 关联交错的文本和工具调用
2. **块结束标记**：`block-end` 携带完整块，消费者无需重新组装
3. **中断处理**：`interruptedBlocks()` 安全处理被取消的流

### 2.4 Token 计量

```typescript
interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  reasoningTokens?: number
}
```

**设计要点：**
- **不相交计数**：`inputTokens` 仅指未缓存输入，缓存单独报告
- **reasoningTokens 包含在 outputTokens 中**：避免重复计算

---

## 三、Agent 流程设计分析

### 3.1 Turn-Step 模型

```
Turn（轮）= 零个或多个 Step
Step（步）= 一次模型请求 + 其调用的工具
```

**Turn 生命周期：**
```
turn/start
  → claim next-step input
  → assemble prompt sections + tool schemas
  → agent/pre-step (可拒绝或进入)
    → step/start
    → append user/message
    → derive model history
    → agent/request → llm/stream → assistant/chunk* → assistant/message
    → tool/call* → tools/pre-execute → tools/execute → tools/post-execute → tool/result*
    → step/end
    → 工具需要另一次请求 → next step
  → agent/turn-stopping
turn/end
```

**可借鉴点：**
1. **明确的边界**：Turn 和 Step 有清晰的开始/结束事件
2. **可中断性**：任何阶段都可以通过事件拦截
3. **数据驱动**：`agent/turn-stopping` 是数据决策，非监听器决策

### 3.2 Agent Handle 与输入路由

```typescript
interface Agent {
  readonly id: SessionId
  readonly session: Session
  readonly inbox: Inbox
  readonly status: AgentStatus  // 'idle' | 'running'
  readonly ctx: Context
  
  send(message: UserMessage, target: InboxTarget, wakeup: boolean): void
  followup(message: UserMessage): void      // 下一个 Turn
  steer(message: UserMessage): void          // 下一个 Step
  inject(message: UserMessage): void         // 下一个 pre-step
  cancel(cause: AgentCancelCause, options?): void
  whenIdle(): Promise<void>
  runMaintenance<T>(task): Promise<T>
}
```

**Inbox 双队列设计：**
- `next-turn`：下一个 Turn 的消息
- `next-step`：下一个 Step 的消息（注入的上下文）

**可借鉴点：**
1. **精确的路由语义**：`followup`、`steer`、`inject` 有明确的时序语义
2. **唤醒控制**：`wakeup` 参数控制是否立即启动驱动
3. **维护任务**：`runMaintenance` 允许在空闲时执行非 Turn 任务

### 3.3 工具执行管道

```
tools/pre-execute → guards → tools/execute → tools/post-execute → finalizeContent → tools/result
```

**工具定义：**
```typescript
interface ToolDefinition extends ToolSchema {
  output: ToolOutputDefinition
  execute(args, exec): Promise<unknown>
  finalizeContent?(exec, result): ContentBlock[] | undefined
  timeoutMs?: number
  isConcurrencySafe?(args): boolean
  presentCall?(args): ToolCallView | undefined
  presentResult?(args, result): ToolResultView | undefined
}
```

**调度模式：**
- `parallel`：可与兄弟工具调用并行
- `exclusive`：独占执行，形成排序屏障

**可借鉴点：**
1. **三阶段拦截**：pre/execute/post 提供灵活的拦截点
2. **并发安全声明**：工具自行声明是否可并行
3. **展示与执行分离**：`presentCall`/`presentResult` 提供 UI 展示能力

### 3.4 子代理（Subagent）系统

#### 两种子代理模式

| 模式 | 说明 |
|------|------|
| **One-shot** | 一次性委托，返回结果后结束 |
| **Continuable** | 可持续对话，支持多轮交互 |

**Continuable 子代理状态机：**
```
persisted Session → optional live Activation → AgentHandle
```

**Activation 状态：**
- `running`：有活动 Turn 或唤醒工作
- `waiting`：静止但拥有未完成的子 Activation
- `settled`：静止且所有子 Activation 已处置

**可借鉴点：**
1. **持久化身份**：子代理有稳定的 SessionId，支持冷恢复
2. **父级授权**：只有记录的父级可以发送后续消息
3. **报告机制**：子代理可选择向父级报告（quiet/next-step）

### 3.5 工作流（Workflow）系统

**设计：**
- 模型编写的编排脚本，在 Worker Thread 中执行
- 脚本可以启动子代理（`agent()` 调用）
- 支持阶段（`phase()``）和日志（`log()`）

**可借鉴点：**
1. **沙箱执行**：脚本在隔离的 Worker 中运行
2. **有界取消**：取消后有宽限期，强制终止
3. **数据快照**：事件携带数据快照而非可变引用

### 3.6 目标（Goal）系统

**设计：**
- 同一会话内的持久化目标
- 支持生命周期：active → paused/blocked → complete
- 基于 revision 的 compare-and-set 更新

---

## 四、可借鉴的核心模式

### 4.1 事件溯源 + 派生投影

```
事件日志（真相来源）→ 派生投影（模型历史/UI状态）
```

**优势：**
- 完整审计追踪
- 支持时间旅行调试
- 多种投影共存

### 4.2 能力接缝模式

```
Service Definition（接口）↔ Service Provider（实现）↔ Consumer（使用）
```

**优势：**
- 可替换实现
- 清晰的依赖方向
- 支持多提供者共存

### 4.3 类型驱动的状态机

```typescript
type AgentStatus = 'idle' | 'running'
type GoalPhase = 'active' | 'paused' | 'blocked' | 'complete'
type ToolExecutionResult = ToolExecutionSuccess | ToolExecutionFailure
```

**优势：**
- 编译时状态检查
- 穷尽性检查（exhaustiveness checking）
- 自文档化

### 4.4 作用域注册

```typescript
// 全局层 + 预设层 + 代理层
ctx.tools.register(definition)  // 注册到当前作用域
ctx.tools.restrict(filter)      // 限制当前作用域
```

**优势：**
- 代理可以有独立的工具集
- 预设可以组合能力
- 支持隔离和共享

### 4.5 瀑布与串行事件

```typescript
// 瀑布：可拦截和修改
'agent/pre-step'(payload, next): Promise<PreStepDecision>

// 串行：只通知，不修改
'agent/turn-stopping'(payload): Promise<void>

// 发射：通知事件
'agent/created'(payload): void
```

---

## 五、优化建议

### 5.1 会话管理优化

1. **分层压缩策略**
   - 短期：工具结果修剪
   - 中期：摘要压缩
   - 长期：归档到外部存储

2. **事件流分区**
   - 热数据：内存中的最近事件
   - 温数据：本地持久化
   - 冷数据：远程归档

### 5.2 Agent 流程优化

1. **预测性调度**
   - 基于历史模式预测下一步工具调用
   - 预加载相关上下文

2. **自适应并发**
   - 根据工具响应时间动态调整并发度
   - 优先调度关键路径上的工具

### 5.3 文本处理优化

1. **增量 Token 化**
   - 只 token 化新增内容
   - 缓存已 token 化的结果

2. **智能上下文选择**
   - 基于相关性而非时间选择历史消息
   - 使用向量检索找到相关上下文

### 5.4 工具系统优化

1. **工具链组合**
   - 支持工具输出作为下一个工具的输入
   - 自动处理类型转换

2. **工具缓存**
   - 纯函数工具可缓存结果
   - 基于参数的缓存失效策略

---

## 六、总结

DeepSeek Harness 是一个设计精良的 Agent 框架，其核心优势在于：

1. **极致的可扩展性**：一切皆插件，通过声明式扩展添加功能
2. **类型安全**：充分利用 TypeScript 类型系统保证正确性
3. **事件溯源**：完整的审计追踪和状态重构能力
4. **清晰的抽象**：Turn/Step、Surface/Log、Seam/Consumer 等概念清晰
5. **生产级设计**：考虑了崩溃恢复、并发控制、取消语义等生产环境问题

对于构建类似 Agent 系统，最值得借鉴的是：
- 事件溯源的会话模型
- 能力接缝的可替换设计
- 类型驱动的状态机
- 作用域注册的能力组合
- 三阶段拦截的工具管道
