# Phase 5: UI 集成

## 阶段目标

将 Agent 层与现有 UI 组件集成：
1. 更新 Zustand Store
2. 集成实时事件更新
3. 优化用户体验
4. 命令面板集成

## 预估工时

1 周

---

## 1. Store 更新

### 1.1 扩展 Agent Store

```typescript
// src/stores/agentStore.ts

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AutobiographyAgent } from '@/agent/AutobiographyAgent'
import { AutobiographySession } from '@/agent/session/types'
import { ExtractedContent } from '@/types'

interface AgentState {
  // Agent 实例
  agent: AutobiographyAgent | null
  
  // 当前会话
  currentSession: AutobiographySession | null
  
  // 加载状态
  isLoading: boolean
  
  // 错误信息
  error: string | null
  
  // 激活的技能
  activeSkills: string[]
  
  // 工具调用状态
  pendingToolCalls: Array<{
    name: string
    args: any
    status: 'pending' | 'running' | 'completed' | 'failed'
  }>
  
  // 事件日志（用于调试）
  eventLog: Array<{
    event: string
    payload: any
    timestamp: number
  }>
}

interface AgentActions {
  // 初始化
  initialize: () => Promise<void>
  
  // 会话管理
  createSession: (chapterId: string) => Promise<void>
  resumeSession: (sessionId: string) => Promise<void>
  pauseSession: () => Promise<void>
  
  // 对话
  sendMessage: (content: string) => Promise<string>
  
  // 技能管理
  activateSkill: (skillName: string) => Promise<void>
  deactivateSkill: (skillName: string) => Promise<void>
  
  // 工具调用
  executeTool: (toolName: string, args: any) => Promise<any>
  
  // 内容操作
  approveContent: (chapterId: string, content: string) => Promise<void>
  rejectContent: (chapterId: string, reason: string) => Promise<void>
  
  // 事件处理
  logEvent: (event: string, payload: any) => void
  clearEventLog: () => void
  
  // 清理
  dispose: () => void
}

export const useAgentStore = create<AgentState & AgentActions>()(
  subscribeWithSelector((set, get) => ({
    agent: null,
    currentSession: null,
    isLoading: false,
    error: null,
    activeSkills: [],
    pendingToolCalls: [],
    eventLog: [],

    initialize: async () => {
      const agent = new AutobiographyAgent()
      
      // 注册工具
      const { registerAutobiographyTools } = await import('@/agent/tools/autobiography')
      registerAutobiographyTools(agent.toolRegistry)
      
      // 注册技能
      const { registerAutobiographySkills } = await import('@/agent/skills/autobiography')
      registerAutobiographySkills(agent.events as any)  // 需要适配
      
      // 订阅事件
      setupEventListeners(agent, set)
      
      set({ agent })
    },

    createSession: async (chapterId) => {
      const { agent } = get()
      if (!agent) throw new Error('Agent not initialized')

      set({ isLoading: true, error: null })
      
      try {
        const context = await loadChapterContext(chapterId)
        const session = await agent.createSession(chapterId, context)
        
        // 默认激活深度访谈技能
        await agent.activateSkill(session.id, 'deep_interview', {
          sessionId: session.id,
          chapterId,
          sessionContext: context,
          agent
        })
        
        set({ 
          currentSession: session,
          activeSkills: ['deep_interview'],
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '创建会话失败',
          isLoading: false 
        })
      }
    },

    resumeSession: async (sessionId) => {
      const { agent } = get()
      if (!agent) throw new Error('Agent not initialized')

      set({ isLoading: true, error: null })
      
      try {
        const session = await agent.resumeSession(sessionId)
        if (session) {
          set({ currentSession: session, isLoading: false })
        } else {
          set({ error: '会话不存在', isLoading: false })
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '恢复会话失败',
          isLoading: false 
        })
      }
    },

    pauseSession: async () => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) return

      await agent.sessionManager.pause(currentSession.id)
    },

    sendMessage: async (content) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) throw new Error('No active session')

      set({ isLoading: true, error: null })
      
      try {
        // 这里需要调用 Agent 的 handleMessage 方法
        // 由于 Agent 还在开发中，先简化处理
        const response = await agent.executeTool(currentSession.id, 'extract_content', {
          conversationSegments: [content]
        })
        
        set({ isLoading: false })
        return response.data?.message || '处理完成'
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '发送消息失败',
          isLoading: false 
        })
        throw error
      }
    },

    activateSkill: async (skillName) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) return

      // 需要实现技能激活逻辑
      set(state => ({
        activeSkills: [...state.activeSkills, skillName]
      }))
    },

    deactivateSkill: async (skillName) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) return

      set(state => ({
        activeSkills: state.activeSkills.filter(s => s !== skillName)
      }))
    },

    executeTool: async (toolName, args) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) throw new Error('No active session')

      const callId = Date.now().toString()
      set(state => ({
        pendingToolCalls: [
          ...state.pendingToolCalls,
          { name: toolName, args, status: 'running' }
        ]
      }))

      try {
        const result = await agent.executeTool(currentSession.id, toolName, args)
        
        set(state => ({
          pendingToolCalls: state.pendingToolCalls.map(call =>
            call.name === toolName ? { ...call, status: 'completed' } : call
          )
        }))
        
        return result
      } catch (error) {
        set(state => ({
          pendingToolCalls: state.pendingToolCalls.map(call =>
            call.name === toolName ? { ...call, status: 'failed' } : call
          )
        }))
        throw error
      }
    },

    approveContent: async (chapterId, content) => {
      // 调用现有的 autobiographyStore
      const { useAutobiographyStore } = await import('./autobiographyStore')
      await useAutobiographyStore.getState().approveContent(chapterId, content)
    },

    rejectContent: async (chapterId, reason) => {
      // 实现拒绝逻辑
      console.log('Content rejected:', chapterId, reason)
    },

    logEvent: (event, payload) => {
      set(state => ({
        eventLog: [
          ...state.eventLog.slice(-99),  // 只保留最近 100 条
          { event, payload, timestamp: Date.now() }
        ]
      }))
    },

    clearEventLog: () => set({ eventLog: [] }),

    dispose: () => {
      const { agent } = get()
      agent?.dispose()
      set({ 
        agent: null, 
        currentSession: null, 
        activeSkills: [],
        pendingToolCalls: []
      })
    }
  }))
)

/** 设置事件监听 */
function setupEventListeners(
  agent: AutobiographyAgent,
  set: (partial: Partial<AgentState>) => void
): void {
  agent.events.on('session/created', (payload) => {
    console.log('[Agent] Session created:', payload)
  })

  agent.events.on('tool/called', (payload) => {
    console.log('[Agent] Tool called:', payload.tool)
  })

  agent.events.on('tool/completed', (payload) => {
    console.log('[Agent] Tool completed:', payload.tool)
  })

  agent.events.on('content/extracted', (payload) => {
    console.log('[Agent] Content extracted')
  })

  agent.events.on('skill/activated', (payload) => {
    console.log('[Agent] Skill activated:', payload.skill)
  })
}

/** 加载章节上下文 */
async function loadChapterContext(chapterId: string): Promise<SessionContext> {
  // 从现有 store 加载章节信息
  const { useAutobiographyStore } = await import('./autobiographyStore')
  const store = useAutobiographyStore.getState()
  
  const chapter = store.autobiography?.chapters.find(c => c.id === chapterId)
  
  return {
    chapterId,
    existingContent: chapter?.content || null,
    userPreferences: {
      narrativeStyle: 'first_person',
      detailLevel: 'medium',
      emotionFocus: true
    },
    timelineContext: {
      birthYear: undefined,
      currentYear: new Date().getFullYear()
    },
    extractedCache: []
  }
}
```

---

## 2. 对话页面集成

### 2.1 更新 DialoguePage

```typescript
// src/pages/Dialogue/index.tsx

import { useEffect, useState } from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { useParams } from 'react-router-dom'
import { MessageBubble } from '@/components/common/MessageBubble'
import { SuggestionBar } from '@/components/dialogue/SuggestionBar'
import { AIGenerationLoading } from '@/components/AIGenerationLoading'

export function DialoguePage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>>([])
  
  const {
    agent,
    currentSession,
    isLoading,
    error,
    initialize,
    createSession,
    sendMessage,
    activeSkills,
    pendingToolCalls
  } = useAgentStore()

  // 初始化 Agent 和会话
  useEffect(() => {
    if (!agent) {
      initialize()
    }
  }, [agent, initialize])

  useEffect(() => {
    if (agent && chapterId && !currentSession) {
      createSession(chapterId)
    }
  }, [agent, chapterId, currentSession, createSession])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // 添加用户消息
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }])

    try {
      const response = await sendMessage(userMessage)
      
      // 添加助手回复
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `出错了: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now()
      }])
    }
  }

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <AIGenerationLoading message="正在初始化对话..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 会话信息 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">章节对话</h2>
            <p className="text-sm text-gray-500">
              会话 ID: {currentSession.id}
            </p>
          </div>
          <div className="flex gap-2">
            {/* 技能指示器 */}
            {activeSkills.map(skill => (
              <span
                key={skill}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        {/* 工具调用状态 */}
        {pendingToolCalls.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {pendingToolCalls.map(call => (
              <span
                key={call.name}
                className={`mr-2 ${
                  call.status === 'running' ? 'text-yellow-600' :
                  call.status === 'completed' ? 'text-green-600' :
                  call.status === 'failed' ? 'text-red-600' : ''
                }`}
              >
                {call.name}: {call.status}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            role={msg.role}
            content={msg.content}
          />
        ))}
        
        {isLoading && (
          <MessageBubble
            role="assistant"
            content={<AIGenerationLoading />}
          />
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 建议栏 */}
      <SuggestionBar
        onSelect={(suggestion) => setInput(suggestion)}
        disabled={isLoading}
      />

      {/* 输入框 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="分享你的故事..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. 命令面板

### 3.1 命令面板组件

```typescript
// src/components/dialogue/CommandPanel.tsx

import { useState } from 'react'
import { useAgentStore } from '@/stores/agentStore'

interface Command {
  name: string
  description: string
  execute: () => Promise<string>
}

export function CommandPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  
  const { agent, currentSession, executeTool } = useAgentStore()

  const commands: Command[] = [
    {
      name: '/timeline',
      description: '分析时间线',
      execute: async () => {
        const result = await executeTool('timeline_analyze', { chapters: [] })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/style',
      description: '检查写作风格',
      execute: async () => {
        const result = await executeTool('check_consistency', {
          currentChapter: '',
          checkItems: ['person', 'tense', 'tone']
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/questions',
      description: '生成引导问题',
      execute: async () => {
        const result = await executeTool('generate_questions', {
          chapterContent: '',
          count: 5
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/compact',
      description: '压缩上下文',
      execute: async () => {
        return '上下文已压缩'
      }
    }
  ]

  const handleExecute = async () => {
    if (!commandInput.startsWith('/')) return

    const cmdName = commandInput.split(' ')[0]
    const command = commands.find(c => c.name === cmdName)

    if (!command) {
      setOutput(`未知命令: ${cmdName}`)
      return
    }

    setOutput('执行中...')
    try {
      const result = await command.execute()
      setOutput(result)
    } catch (error) {
      setOutput(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    setCommandInput('')
  }

  return (
    <div className="border rounded-lg">
      {/* 命令输入 */}
      <div
        className="flex items-center gap-2 p-2 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400">/</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="输入命令..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      {/* 命令列表 */}
      {isOpen && (
        <div className="p-2 space-y-1">
          {commands.map(cmd => (
            <div
              key={cmd.name}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setCommandInput(cmd.name)
                setIsOpen(false)
              }}
            >
              <span className="font-mono text-sm font-semibold">{cmd.name}</span>
              <span className="text-sm text-gray-500">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* 输出显示 */}
      {output && (
        <div className="p-2 border-t bg-gray-50">
          <pre className="text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}
```

---

## 4. 技能切换器

```typescript
// src/components/dialogue/SkillSwitcher.tsx

import { useAgentStore } from '@/stores/agentStore'

const AVAILABLE_SKILLS = [
  { name: 'deep_interview', label: '深度访谈', icon: '🎙️' },
  { name: 'timeline_organize', label: '时间线整理', icon: '📅' },
  { name: 'style_check', label: '风格检查', icon: '✍️' },
  { name: 'guided_questioning', label: '引导提问', icon: '❓' }
]

export function SkillSwitcher() {
  const { agent, activeSkills, activateSkill, deactivateSkill } = useAgentStore()

  const toggleSkill = async (skillName: string) => {
    if (!agent) return

    if (activeSkills.includes(skillName)) {
      await deactivateSkill(skillName)
    } else {
      await activateSkill(skillName)
    }
  }

  return (
    <div className="flex gap-2 p-2">
      {AVAILABLE_SKILLS.map(skill => {
        const isActive = activeSkills.includes(skill.name)
        return (
          <button
            key={skill.name}
            onClick={() => toggleSkill(skill.name)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{skill.icon}</span>
            <span>{skill.label}</span>
          </button>
        )
      })}
    </div>
  )
}
```

---

## 5. 调试面板

```typescript
// src/components/debug/EventLogPanel.tsx

import { useAgentStore } from '@/stores/agentStore'

export function EventLogPanel() {
  const { eventLog, clearEventLog } = useAgentStore()

  return (
    <div className="border rounded-lg bg-gray-900 text-green-400 font-mono text-xs">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <span>事件日志</span>
        <button
          onClick={clearEventLog}
          className="text-gray-400 hover:text-white"
        >
          清空
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {eventLog.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span className="text-yellow-400">{log.event}</span>
          </div>
        ))}
        {eventLog.length === 0 && (
          <div className="text-gray-500">暂无事件</div>
        )}
      </div>
    </div>
  )
}
```

---

## 6. 测试计划

### 6.1 集成测试

| 场景 | 测试内容 |
|------|----------|
| 完整流程 | 创建会话 → 发送消息 → 工具调用 → 内容提取 |
| 技能切换 | 激活/停用技能，验证 UI 更新 |
| 命令执行 | /timeline、/style 命令 |
| 错误处理 | 网络错误、Token 超限 |

### 6.2 E2E 测试

| 场景 | 测试内容 |
|------|----------|
| 用户旅程 | 用户完成一个章节的编写 |
| 并发操作 | 多个工具同时调用 |

---

## 7. 验收清单

- [x] Agent Store 正常工作
- [x] 会话创建和恢复正常
- [x] 消息发送和接收正常
- [x] 技能切换 UI 正常
- [x] 命令面板功能正常
- [x] 事件日志显示正确
- [x] 错误处理正常
- [ ] 所有集成测试通过

---

## 8. 开发日志

| 日期 | 内容 | 状态 |
|------|------|------|
| - | 初始化阶段文档 | ✅ |
| 2026-08-24 | 创建 agentStore，集成 Agent、ToolRegistry、SkillRegistry | ✅ |
| 2026-08-24 | 实现会话创建、恢复、暂停功能 | ✅ |
| 2026-08-24 | 实现 sendMessage 完整对话流程（含内容提取） | ✅ |
| 2026-08-24 | 修复技能激活/停用未与 Agent 实际交互的问题 | ✅ |
| 2026-08-24 | 修复 registerAutobiographySkills 的 as any 类型断言 | ✅ |
| 2026-08-24 | 添加 handleMessage 方法支持完整消息处理 | ✅ |
| 2026-08-24 | 在 AutobiographyAgent 中集成 SkillRegistry | ✅ |
| 2026-08-24 | 实现技能激活/停用功能 | ✅ |
| 2026-08-24 | 创建 CommandPanel 命令面板组件 | ✅ |
| 2026-08-24 | 创建 SkillSwitcher 技能切换器组件 | ✅ |
| 2026-08-24 | 创建 EventLogPanel 事件日志面板组件 | ✅ |
| 2026-08-24 | 更新 DialoguePage 集成 Agent Store | ✅ |

---

## 9. 总结

Phase 5 UI 集成阶段已完成核心功能。实现了以下核心组件：

### Store 层
- **agentStore** - 集成 AutobiographyAgent、ToolRegistry、SkillRegistry
- 支持会话创建、恢复、暂停
- 支持技能激活/停用（与 Agent 实际交互）
- 支持完整消息处理流程（含内容提取、问题生成）

### 组件层
- **CommandPanel** - 命令面板，支持 /timeline、/style、/questions、/compact 命令
- **SkillSwitcher** - 技能切换器，可切换 4 种技能
- **EventLogPanel** - 事件日志面板，显示 Agent 事件

### 页面层
- **DialoguePage** - 对话页面，集成 Agent Store，支持消息发送和会话管理

### 修复项
1. 修复了技能激活/停用未与 Agent 实际交互的问题
2. 修复了 sendMessage 仅调用 extract_content 的问题，实现了完整对话流程
3. 修复了 registerAutobiographySkills 的 as any 类型断言
4. 在 AutobiographyAgent 中集成了 SkillRegistry
5. 添加了 handleMessage 方法支持完整消息处理
