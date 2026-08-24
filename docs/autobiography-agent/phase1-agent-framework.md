# Phase 1: 基础 Agent 框架

## 阶段目标

建立 Agent 化的基础架构，包括：
1. 会话管理系统 (Session Management)
2. 工具注册中心 (Tool Registry)
3. 事件系统 (Event System)

## 预估工时

1-2 周

---

## 1. 会话管理 (Session Management)

### 1.1 设计目标

- 支持创建、恢复、暂停会话
- 维护对话历史和上下文
- 管理 Token 预算
- 支持会话持久化

### 1.2 核心类型定义

```typescript
// src/agent/session/types.ts

/** 会话状态 */
export type SessionStatus = 'active' | 'paused' | 'extracting' | 'merging' | 'closed'

/** 对话轮次 */
export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCallRecord[]
  toolResults?: ToolResultRecord[]
}

/** Token 预算 */
export interface TokenBudget {
  used: number
  limit: number
  warningThreshold: number  // 达到此阈值触发警告
}

/** 会话上下文 */
export interface SessionContext {
  chapterId: string
  existingContent: ChapterContent | null
  userPreferences: WritingPreferences
  timelineContext: TimelineContext
  extractedCache: ExtractedContent[]
}

/** 会话状态 */
export interface SessionState {
  status: SessionStatus
  pendingExtractions: ExtractionTask[]
  lastActivity: number
  tokenBudget: TokenBudget
}

/** 完整会话 */
export interface AutobiographySession {
  id: string
  chapterId: string
  history: ConversationTurn[]
  context: SessionContext
  state: SessionState
  createdAt: number
  updatedAt: number
}
```

### 1.3 SessionManager 实现

```typescript
// src/agent/session/SessionManager.ts

import { AutobiographySession, SessionContext, SessionStatus } from './types'
import { StorageService } from '@/services/storage'

export class SessionManager {
  private sessions: Map<string, AutobiographySession> = new Map()
  private storage: StorageService

  constructor(storage: StorageService) {
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
    // 先查内存
    const cached = this.sessions.get(sessionId)
    if (cached) return cached

    // 再查持久化
    const persisted = await this.storage.get<AutobiographySession>(
      `session:${sessionId}`
    )
    if (persisted) {
      this.sessions.set(sessionId, persisted)
    }
    return persisted
  }

  /** 暂停会话 */
  async pause(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.status = 'paused'
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
  async updateTokenUsage(sessionId: string, tokens: number): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.state.tokenBudget.used += tokens
    session.updatedAt = Date.now()

    // 检查是否超过警告阈值
    if (session.state.tokenBudget.used >= session.state.tokenBudget.warningThreshold) {
      // 触发警告事件（由事件系统处理）
    }

    await this.persist(session)
  }

  /** 获取活跃会话 */
  getActiveSessions(): AutobiographySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.state.status === 'active')
  }

  /** 清理过期会话 */
  async cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now()
    for (const [id, session] of this.sessions) {
      if (now - session.updatedAt > maxAgeMs) {
        session.state.status = 'closed'
        await this.persist(session)
        this.sessions.delete(id)
      }
    }
  }

  /** 持久化会话 */
  private async persist(session: AutobiographySession): Promise<void> {
    await this.storage.set(`session:${session.id}`, session)
  }
}
```

---

## 2. 工具注册中心 (Tool Registry)

### 2.1 设计目标

- 支持工具的注册、注销、查询
- 支持作用域隔离（不同会话可使用不同工具集）
- 支持工具元数据（描述、参数 schema）

### 2.2 核心类型定义

```typescript
// src/agent/tools/ToolTypes.ts

/** 工具参数定义 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: ToolParameterSchema  // 用于 array 类型
  properties?: Record<string, ToolParameterSchema>  // 用于 object 类型
  required?: boolean
}

/** 工具参数定义集合 */
export interface ToolParameters {
  type: 'object'
  properties: Record<string, ToolParameterSchema>
  required?: string[]
}

/** 工具定义 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParameters
  execute: (args: any, context: ToolExecutionContext) => Promise<ToolResult>
  /** 是否支持并发执行 */
  isConcurrencySafe?: (args: any) => boolean
  /** 超时时间（毫秒） */
  timeoutMs?: number
}

/** 工具执行上下文 */
export interface ToolExecutionContext {
  sessionId: string
  chapterId: string
  sessionContext: SessionContext
  signal: AbortSignal
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  /** 需要额外处理的消息（如提示用户） */
  messages?: string[]
}

/** 工具调用记录 */
export interface ToolCallRecord {
  toolName: string
  args: any
  result: ToolResult
  timestamp: number
  duration: number
}
```

### 2.3 ToolRegistry 实现

```typescript
// src/agent/tools/ToolRegistry.ts

import { ToolDefinition, ToolExecutionContext, ToolResult } from './ToolTypes'

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private scopedTools: Map<string, Set<string>> = new Map()  // sessionId → toolNames

  /** 注册全局工具 */
  register(tool: ToolDefinition): () => void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`)
    }
    this.tools.set(tool.name, tool)

    // 返回注销函数
    return () => {
      this.tools.delete(tool.name)
      // 从所有作用域中移除
      for (const toolNames of this.scopedTools.values()) {
        toolNames.delete(tool.name)
      }
    }
  }

  /** 为特定会话激活工具 */
  activateForSession(sessionId: string, toolNames: string[]): void {
    const scoped = this.scopedTools.get(sessionId) || new Set()
    for (const name of toolNames) {
      if (!this.tools.has(name)) {
        throw new Error(`Tool not found: ${name}`)
      }
      scoped.add(name)
    }
    this.scopedTools.set(sessionId, scoped)
  }

  /** 为特定会话停用工具 */
  deactivateForSession(sessionId: string, toolNames: string[]): void {
    const scoped = this.scopedTools.get(sessionId)
    if (scoped) {
      for (const name of toolNames) {
        scoped.delete(name)
      }
    }
  }

  /** 获取会话可用的工具列表 */
  getAvailableTools(sessionId: string): ToolDefinition[] {
    const scoped = this.scopedTools.get(sessionId)
    if (!scoped) return []
    
    return Array.from(scoped)
      .map(name => this.tools.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined)
  }

  /** 获取特定工具 */
  get(toolName: string): ToolDefinition | undefined {
    return this.tools.get(toolName)
  }

  /** 检查工具是否对会话可用 */
  isAvailable(sessionId: string, toolName: string): boolean {
    const scoped = this.scopedTools.get(sessionId)
    return scoped?.has(toolName) || false
  }

  /** 获取所有工具名称 */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /** 清理会话的工具绑定 */
  cleanupSession(sessionId: string): void {
    this.scopedTools.delete(sessionId)
  }
}
```

---

## 3. 事件系统 (Event System)

### 3.1 设计目标

- 支持发布-订阅模式
- 支持类型化事件
- 支持异步事件处理
- 支持事件过滤

### 3.2 核心类型定义

```typescript
// src/agent/events/types.ts

/** 会话事件 */
export interface SessionEvents {
  'session/created': { sessionId: string; chapterId: string }
  'session/resumed': { sessionId: string }
  'session/paused': { sessionId: string }
  'session/closed': { sessionId: string }
}

/** 对话事件 */
export interface TurnEvents {
  'turn/start': { sessionId: string; userMessage: string }
  'turn/complete': { sessionId: string; assistantResponse: string; tokensUsed: number }
  'turn/error': { sessionId: string; error: Error }
}

/** 内容事件 */
export interface ContentEvents {
  'content/extracted': { sessionId: string; extraction: ExtractedContent }
  'content/merged': { sessionId: string; chapterId: string; draft: string }
  'content/approved': { sessionId: string; chapterId: string; content: string }
  'content/rejected': { sessionId: string; chapterId: string; reason: string }
}

/** 工具事件 */
export interface ToolEvents {
  'tool/called': { sessionId: string; tool: string; args: any }
  'tool/completed': { sessionId: string; tool: string; result: ToolResult }
  'tool/failed': { sessionId: string; tool: string; error: Error }
}

/** 技能事件 */
export interface SkillEvents {
  'skill/activated': { sessionId: string; skill: string }
  'skill/deactivated': { sessionId: string; skill: string }
}

/** 所有事件 */
export type AutobiographyEventMap = 
  & SessionEvents 
  & TurnEvents 
  & ContentEvents 
  & ToolEvents 
  & SkillEvents

/** 事件处理器 */
export type EventHandler<T = any> = (payload: T) => void | Promise<void>
```

### 3.3 EventEmitter 实现

```typescript
// src/agent/events/EventEmitter.ts

import { AutobiographyEventMap, EventHandler } from './types'

export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map()
  private asyncListeners: Map<string, Set<EventHandler>> = new Map()

  /** 订阅事件 */
  on<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>
  ): () => void {
    const set = this.listeners.get(event as string) || new Set()
    set.add(handler as EventHandler)
    this.listeners.set(event as string, set)

    // 返回取消订阅函数
    return () => {
      set.delete(handler as EventHandler)
    }
  }

  /** 订阅异步事件 */
  onAsync<K extends keyof AutobiographyEventMap>(
    event: K,
    handler: EventHandler<AutobiographyEventMap[K]>
  ): () => void {
    const set = this.asyncListeners.get(event as string) || new Set()
    set.add(handler as EventHandler)
    this.asyncListeners.set(event as string, set)

    return () => {
      set.delete(handler as EventHandler)
    }
  }

  /** 发布事件（同步） */
  emit<K extends keyof AutobiographyEventMap>(
    event: K,
    payload: AutobiographyEventMap[K]
  ): void {
    const set = this.listeners.get(event as string)
    if (set) {
      for (const handler of set) {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Event handler error for ${String(event)}:`, error)
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
      const promises = Array.from(set).map(async (handler) => {
        try {
          await handler(payload)
        } catch (error) {
          console.error(`Async event handler error for ${String(event)}:`, error)
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

  /** 获取事件监听器数量 */
  listenerCount(event: string): number {
    return (this.listeners.get(event)?.size || 0) + 
           (this.asyncListeners.get(event)?.size || 0)
  }
}
```

---

## 4. 主 Agent 类

### 4.1 AutobiographyAgent 骨架

```typescript
// src/agent/AutobiographyAgent.ts

import { SessionManager } from './session/SessionManager'
import { ToolRegistry } from './tools/ToolRegistry'
import { EventEmitter } from './events/EventEmitter'
import { AutobiographySession, SessionContext } from './session/types'
import { ToolDefinition, ToolResult, ToolExecutionContext } from './tools/ToolTypes'

export class AutobiographyAgent {
  readonly sessionManager: SessionManager
  readonly toolRegistry: ToolRegistry
  readonly events: EventEmitter

  constructor() {
    this.sessionManager = new SessionManager(/* storage */)
    this.toolRegistry = new ToolRegistry()
    this.events = new EventEmitter()
  }

  /** 创建会话 */
  async createSession(chapterId: string, context: SessionContext): Promise<AutobiographySession> {
    return this.sessionManager.create(chapterId, context)
  }

  /** 恢复会话 */
  async resumeSession(sessionId: string): Promise<AutobiographySession | null> {
    return this.sessionManager.resume(sessionId)
  }

  /** 注册工具 */
  registerTool(tool: ToolDefinition): () => void {
    return this.toolRegistry.register(tool)
  }

  /** 激活会话工具 */
  activateTools(sessionId: string, toolNames: string[]): void {
    this.toolRegistry.activateForSession(sessionId, toolNames)
  }

  /** 执行工具 */
  async executeTool(
    sessionId: string,
    toolName: string,
    args: any,
    signal?: AbortSignal
  ): Promise<ToolResult> {
    const tool = this.toolRegistry.get(toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    if (!this.toolRegistry.isAvailable(sessionId, toolName)) {
      throw new Error(`Tool not available for session: ${toolName}`)
    }

    const session = await this.sessionManager.resume(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const context: ToolExecutionContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      signal: signal || new AbortController().signal
    }

    // 发布工具调用事件
    this.events.emit('tool/called', { sessionId, tool: toolName, args })

    try {
      const result = await tool.execute(args, context)
      this.events.emit('tool/completed', { sessionId, tool: toolName, result })
      return result
    } catch (error) {
      this.events.emit('tool/failed', { sessionId, tool: toolName, error })
      throw error
    }
  }

  /** 销毁 */
  dispose(): void {
    this.events.removeAllListeners()
    this.sessionManager.cleanup()
  }
}
```

---

## 5. 测试计划

### 5.1 单元测试

| 模块 | 测试内容 |
|------|----------|
| SessionManager | 创建、恢复、暂停、清理会话 |
| ToolRegistry | 注册、注销、作用域隔离 |
| EventEmitter | 发布、订阅、取消订阅、错误处理 |

### 5.2 集成测试

| 场景 | 测试内容 |
|------|----------|
| 完整会话流程 | 创建会话 → 执行工具 → 持久化 → 恢复 |
| 事件流转 | 工具调用 → 事件发布 → UI 更新 |

---

## 6. 验收清单

- [ ] Session 可创建并持久化
- [ ] Session 可从持久化恢复
- [ ] Session 状态可更新
- [ ] 工具可注册和注销
- [ ] 工具作用域隔离正常
- [ ] 事件可发布和订阅
- [ ] 异步事件处理正常
- [ ] 所有单元测试通过
- [ ] 集成测试通过

---

## 7. 开发日志

| 日期 | 内容 | 状态 |
|------|------|------|
| - | 初始化阶段文档 | ✅ |

---

## 8. 总结

_（阶段完成后填写）_
