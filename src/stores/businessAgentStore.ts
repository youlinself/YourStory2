import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AgentFactory } from '@/agent/AgentFactory'
import { UnifiedLLMService } from '@/agent/llm/UnifiedLLMService'
import type { SessionContext } from '@/agent/session/types'
import type { AutobiographyEventMap } from '@/agent/events/types'
import useAIStore from './aiStore'

let agentFactory: AgentFactory | null = null

function getAgentFactory(): AgentFactory {
  if (!agentFactory) {
    const aiStoreState = useAIStore.getState()
    const { apiKey, model, baseUrl, vendor, temperature, customModelName } = aiStoreState

    const llmService = new UnifiedLLMService({
      apiKey,
      model,
      baseUrl,
      vendor,
      temperature,
      customModelName,
      maxOutputTokens: 2000,
    })

    agentFactory = new AgentFactory({ llmService })
  }
  return agentFactory
}

function resetAgentFactory(): void {
  agentFactory = null
}

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

export interface BusinessAgentState {
  agent: import('@/agent/Agent').Agent | null
  currentSession: import('@/agent/session/types').AutobiographySession | null
  isLoading: boolean
  error: string | null
  activeSkills: string[]
  pendingToolCalls: PendingToolCall[]
  eventLog: EventLogEntry[]
  businessType: string | null
}

export type ContextLoader = (id: string | null) => Promise<SessionContext>
export type ContentApprover = (id: string) => Promise<void>
export type ContentRejecter = (id: string, reason: string) => Promise<void>

export interface BusinessAgentActions {
  initialize: (businessType: string) => Promise<void>
  createSession: (id: string | null, context?: SessionContext) => Promise<void>
  resumeSession: (sessionId: string) => Promise<boolean>
  pauseSession: () => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  sendMessage: (content: string) => Promise<string>
  handleMessage: (content: string, options?: { generateFollowUpQuestions?: boolean }) => Promise<{
    extractedContent?: any
    followUpQuestions?: any
    response: string
  }>
  activateSkill: (skillName: string) => Promise<void>
  deactivateSkill: (skillName: string) => Promise<void>
  executeTool: (toolName: string, args: any) => Promise<any>
  approveContent: (id: string) => Promise<void>
  rejectContent: (id: string, reason: string) => Promise<void>
  logEvent: (event: string, payload: any) => void
  clearEventLog: () => void
  dispose: () => void
}

export interface CreateBusinessAgentStoreOptions {
  defaultSkill?: string
  contextLoader?: ContextLoader
  onApproveContent?: ContentApprover
  onRejectContent?: ContentRejecter
}

export function createBusinessAgentStore(options: CreateBusinessAgentStoreOptions = {}) {
  const { defaultSkill, contextLoader, onApproveContent, onRejectContent } = options

  return create<BusinessAgentState & BusinessAgentActions>()(
    subscribeWithSelector((set, get) => ({
      agent: null,
      currentSession: null,
      isLoading: false,
      error: null,
      activeSkills: [],
      pendingToolCalls: [],
      eventLog: [],
      businessType: null,

      initialize: async (businessType: string) => {
        const factory = getAgentFactory()
        const agent = await factory.createAgent({ businessType })
        setupEventListeners(agent)
        set({ agent, businessType })
      },

      createSession: async (id: string | null, context?: SessionContext) => {
        const { agent } = get()
        if (!agent) throw new Error('Agent not initialized')

        set({ isLoading: true, error: null })

        try {
          const sessionContext = context || (contextLoader ? await contextLoader(id) : getDefaultContext(id))
          const session = await agent.createSession(id, sessionContext)

          if (defaultSkill) {
            try {
              await agent.activateSkill(session.id, defaultSkill)
            } catch (skillError) {
              console.warn('[BusinessAgentStore] activateSkill failed:', skillError)
            }
          }

          const activeSkills = agent.getActiveSkills(session.id)

          set({
            currentSession: session,
            activeSkills,
            isLoading: false
          })
        } catch (error) {
          console.error('[BusinessAgentStore] createSession error:', error)
          set({
            error: error instanceof Error ? error.message : '创建会话失败',
            isLoading: false
          })
        }
      },

      resumeSession: async (sessionId: string): Promise<boolean> => {
        const { agent } = get()
        if (!agent) throw new Error('Agent not initialized')

        set({ isLoading: true, error: null })

        try {
          const session = await agent.resumeSession(sessionId)
          if (session) {
            const activeSkills = agent.getActiveSkills(sessionId)
            set({ currentSession: session, activeSkills, isLoading: false })
            return true
          } else {
            set({ error: '会话不存在', isLoading: false })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '恢复会话失败',
            isLoading: false
          })
          return false
        }
      },

      pauseSession: async () => {
        const { agent, currentSession } = get()
        if (!agent || !currentSession) return

        await agent.pauseSession(currentSession.id)
      },

      deleteSession: async (sessionId: string) => {
        const { agent, currentSession } = get()
        if (!agent) return

        await agent.sessionManager.delete(sessionId)

        if (currentSession?.id === sessionId) {
          set({ currentSession: null, activeSkills: [] })
        }
      },

      sendMessage: async (content: string) => {
        const { agent, currentSession } = get()
        if (!agent || !currentSession) throw new Error('No active session')

        set({ isLoading: true, error: null })

        try {
          const result = await agent.sendMessage(currentSession.id, content, {
            autoExtract: false,
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

        const userTurn = {
          role: 'user' as const,
          content,
          timestamp: Date.now()
        }

        const updatedSession = {
          ...currentSession,
          history: [...currentSession.history, userTurn]
        }
        set({ currentSession: updatedSession, isLoading: true, error: null })

        try {
          const result = await agent.sendMessage(currentSession.id, content, {
            generateFollowUpQuestions: options.generateFollowUpQuestions ?? false
          })

          const finalSession = agent.getSession(currentSession.id)
          if (finalSession) {
            set({ currentSession: finalSession, isLoading: false })
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

      approveContent: async (id: string) => {
        if (onApproveContent) {
          await onApproveContent(id)
        } else {
          console.warn('[BusinessAgentStore] onApproveContent not configured')
        }
      },

      rejectContent: async (id: string, reason: string) => {
        if (onRejectContent) {
          await onRejectContent(id, reason)
        } else {
          console.warn('[BusinessAgentStore] onRejectContent not configured')
        }
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
        resetAgentFactory()
        set({
          agent: null,
          currentSession: null,
          activeSkills: [],
          pendingToolCalls: [],
          businessType: null
        })
      }
    }))
  )
}

function setupEventListeners(agent: import('@/agent/Agent').Agent): void {
  agent.events.on('session/created', (payload: AutobiographyEventMap['session/created']) => {
    console.log('[BusinessAgent] Session created:', payload)
  })

  agent.events.on('tool/called', (payload: AutobiographyEventMap['tool/called']) => {
    console.log('[BusinessAgent] Tool called:', payload.tool)
  })

  agent.events.on('tool/completed', (payload: AutobiographyEventMap['tool/completed']) => {
    console.log('[BusinessAgent] Tool completed:', payload.tool)
  })

  agent.events.on('skill/activated', (payload: AutobiographyEventMap['skill/activated']) => {
    console.log('[BusinessAgent] Skill activated:', payload.skill)
  })

  agent.events.on('skill/deactivated', (payload: AutobiographyEventMap['skill/deactivated']) => {
    console.log('[BusinessAgent] Skill deactivated:', payload.skill)
  })
}

function getDefaultContext(id: string | null): SessionContext {
  return {
    chapterId: id,
    existingContent: null,
    userPreferences: {
      style: 'casual',
      language: 'zh',
      perspective: 'first',
      autoExtract: false
    },
    timelineContext: {
      currentEra: undefined,
      keyEvents: undefined,
      characterAges: undefined
    },
    extractedCache: []
  }
}

export type BusinessAgentStore = ReturnType<typeof createBusinessAgentStore>
