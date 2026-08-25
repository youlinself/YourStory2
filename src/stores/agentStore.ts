import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AutobiographyAgent } from '@/agent/AutobiographyAgent'
import { MemoryStorageAdapter } from '@/agent/session/SessionManager'
import type { AutobiographySession, SessionContext } from '@/agent/session/types'
import type { Chapter } from '@/types'
import type { AutobiographyEventMap } from '@/agent/events/types'

interface PendingToolCall {
  name: string
  args: any
  status: 'pending' | 'running' | 'completed' | 'failed'
}

interface EventLogEntry {
  event: string
  payload: any
  timestamp: number
}

interface AgentState {
  agent: AutobiographyAgent | null
  currentSession: AutobiographySession | null
  isLoading: boolean
  error: string | null
  activeSkills: string[]
  pendingToolCalls: PendingToolCall[]
  eventLog: EventLogEntry[]
}

interface AgentActions {
  initialize: () => Promise<void>
  createSession: (chapterId: string) => Promise<void>
  resumeSession: (sessionId: string) => Promise<void>
  pauseSession: () => Promise<void>
  sendMessage: (content: string) => Promise<string>
  handleMessage: (content: string, options?: { generateFollowUpQuestions?: boolean }) => Promise<{
    extractedContent?: any
    followUpQuestions?: any
    response: string
  }>
  activateSkill: (skillName: string) => Promise<void>
  deactivateSkill: (skillName: string) => Promise<void>
  executeTool: (toolName: string, args: any) => Promise<any>
  approveContent: (chapterId: string) => Promise<void>
  rejectContent: (chapterId: string, reason: string) => Promise<void>
  logEvent: (event: string, payload: any) => void
  clearEventLog: () => void
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
      const storage = new MemoryStorageAdapter()
      const agent = new AutobiographyAgent({ storage })

      const { registerAutobiographyTools } = await import('@/agent/tools/autobiography')
      registerAutobiographyTools(agent.toolRegistry)

      const { registerAutobiographySkills } = await import('@/agent/skills/autobiography')
      registerAutobiographySkills(agent.skillRegistry)

      setupEventListeners(agent)

      set({ agent })
    },

    createSession: async (chapterId: string) => {
      const { agent } = get()
      if (!agent) throw new Error('Agent not initialized')

      set({ isLoading: true, error: null })

      try {
        const context = await loadChapterContext(chapterId)
        const session = await agent.createSession(chapterId, context)

        await agent.activateSkill(session.id, 'deep_interview')

        const activeSkills = agent.getActiveSkills(session.id)

        set({
          currentSession: session,
          activeSkills,
          isLoading: false
        })
      } catch (error) {
        console.error('[AgentStore] createSession error:', error)
        set({
          error: error instanceof Error ? error.message : '创建会话失败',
          isLoading: false
        })
      }
    },

    resumeSession: async (sessionId: string) => {
      const { agent } = get()
      if (!agent) throw new Error('Agent not initialized')

      set({ isLoading: true, error: null })

      try {
        const session = await agent.resumeSession(sessionId)
        if (session) {
          const activeSkills = agent.getActiveSkills(sessionId)
          set({ currentSession: session, activeSkills, isLoading: false })
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

      await agent.pauseSession(currentSession.id)
    },

    sendMessage: async (content: string) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) throw new Error('No active session')

      set({ isLoading: true, error: null })

      try {
        const result = await agent.handleMessage(currentSession.id, content, {
          autoExtract: true,
          generateFollowUpQuestions: false
        })

        const updatedSession = agent.getSession(currentSession.id)
        if (updatedSession) {
          set({ currentSession: updatedSession, isLoading: false })
        } else {
          set({ isLoading: false })
        }

        return result.response
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '发送消息失败',
          isLoading: false
        })
        throw error
      }
    },

    handleMessage: async (content: string, options = {}) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) throw new Error('No active session')

      set({ isLoading: true, error: null })

      try {
        const result = await agent.handleMessage(currentSession.id, content, {
          generateFollowUpQuestions: options.generateFollowUpQuestions ?? false
        })

        const updatedSession = agent.getSession(currentSession.id)
        if (updatedSession) {
          set({ currentSession: updatedSession, isLoading: false })
        } else {
          set({ isLoading: false })
        }

        return result
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '处理消息失败',
          isLoading: false
        })
        throw error
      }
    },

    activateSkill: async (skillName: string) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) return

      set({ isLoading: true, error: null })

      try {
        await agent.activateSkill(currentSession.id, skillName)
        const activeSkills = agent.getActiveSkills(currentSession.id)
        set({ activeSkills, isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '激活技能失败',
          isLoading: false
        })
      }
    },

    deactivateSkill: async (skillName: string) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) return

      set({ isLoading: true, error: null })

      try {
        await agent.deactivateSkill(currentSession.id, skillName)
        const activeSkills = agent.getActiveSkills(currentSession.id)
        set({ activeSkills, isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '停用技能失败',
          isLoading: false
        })
      }
    },

    executeTool: async (toolName: string, args: any) => {
      const { agent, currentSession } = get()
      if (!agent || !currentSession) throw new Error('No active session')

      set(state => ({
        pendingToolCalls: [
          ...state.pendingToolCalls,
          { name: toolName, args, status: 'running' as const }
        ]
      }))

      try {
        const result = await agent.executeTool(currentSession.id, toolName, args)

        set(state => ({
          pendingToolCalls: state.pendingToolCalls.map(call =>
            call.name === toolName ? { ...call, status: 'completed' as const } : call
          )
        }))

        const updatedSession = agent.getSession(currentSession.id)
        if (updatedSession) {
          set({ currentSession: updatedSession })
        }

        return result
      } catch (error) {
        set(state => ({
          pendingToolCalls: state.pendingToolCalls.map(call =>
            call.name === toolName ? { ...call, status: 'failed' as const } : call
          )
        }))
        throw error
      }
    },

    approveContent: async (chapterId: string) => {
      const useAutobiographyStore = (await import('./autobiographyStore')).default
      await useAutobiographyStore.getState().confirmChapterDraft(chapterId)
    },

    rejectContent: async (chapterId: string, reason: string) => {
      console.log('Content rejected:', chapterId, reason)
    },

    logEvent: (event: string, payload: any) => {
      set(state => ({
        eventLog: [
          ...state.eventLog.slice(-99),
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

function setupEventListeners(agent: AutobiographyAgent): void {
  agent.events.on('session/created', (payload: AutobiographyEventMap['session/created']) => {
    console.log('[Agent] Session created:', payload)
  })

  agent.events.on('tool/called', (payload: AutobiographyEventMap['tool/called']) => {
    console.log('[Agent] Tool called:', payload.tool)
  })

  agent.events.on('tool/completed', (payload: AutobiographyEventMap['tool/completed']) => {
    console.log('[Agent] Tool completed:', payload.tool)
  })

  agent.events.on('content/extracted', (_payload: AutobiographyEventMap['content/extracted']) => {
    console.log('[Agent] Content extracted')
  })

  agent.events.on('skill/activated', (payload: AutobiographyEventMap['skill/activated']) => {
    console.log('[Agent] Skill activated:', payload.skill)
  })

  agent.events.on('skill/deactivated', (payload: AutobiographyEventMap['skill/deactivated']) => {
    console.log('[Agent] Skill deactivated:', payload.skill)
  })
}

async function loadChapterContext(chapterId: string): Promise<SessionContext> {
  let existingContent: Chapter | null = null

  try {
    const useAutobiographyStore = (await import('./autobiographyStore')).default
    const store = useAutobiographyStore.getState()
    existingContent = store.autobiography?.chapters.find((c: Chapter) => c.id === chapterId) ?? null
  } catch {
    existingContent = null
  }

  return {
    chapterId,
    existingContent,
    userPreferences: {
      style: 'casual',
      language: 'zh',
      perspective: 'first',
      autoExtract: true
    },
    timelineContext: {
      currentEra: undefined,
      keyEvents: undefined,
      characterAges: undefined
    },
    extractedCache: []
  }
}
