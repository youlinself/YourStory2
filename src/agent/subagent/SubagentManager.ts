import { generateId } from '../../utils'

export type SubagentMode = 'one-shot' | 'continuable'

export type ActivationStatus = 'running' | 'waiting' | 'settled'

export interface SubagentConfig {
  mode: SubagentMode
  parentSessionId: string
  systemPrompt?: string
  tools?: string[]
  maxTurns?: number
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

export type SubagentEventListener = (subagent: Subagent) => void

export class SubagentManager {
  private subagents: Map<string, Subagent> = new Map()
  private parentChildren: Map<string, Set<string>> = new Map()
  private sessionParent: Map<string, string> = new Map()
  private listeners: Map<string, Set<SubagentEventListener>> = new Map()

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

    const siblings = this.parentChildren.get(config.parentSessionId) || new Set()
    siblings.add(id)
    this.parentChildren.set(config.parentSessionId, siblings)
    this.sessionParent.set(sessionId, config.parentSessionId)

    this.notifyListeners('created', subagent)

    return subagent
  }

  getSubagent(id: string): Subagent | undefined {
    return this.subagents.get(id)
  }

  getParentChildren(parentSessionId: string): Subagent[] {
    const childIds = this.parentChildren.get(parentSessionId) || new Set()
    return Array.from(childIds).map(id => this.subagents.get(id)).filter(Boolean) as Subagent[]
  }

  getSubagentBySessionId(sessionId: string): Subagent | undefined {
    return Array.from(this.subagents.values()).find(s => s.sessionId === sessionId)
  }

  canSendMessage(subagentSessionId: string, senderSessionId: string): boolean {
    const parent = this.sessionParent.get(subagentSessionId)
    return parent === senderSessionId
  }

  async sendToSubagent(subagentSessionId: string, _content: string, senderSessionId: string): Promise<void> {
    if (!this.canSendMessage(subagentSessionId, senderSessionId)) {
      throw new Error('Only parent can send messages to subagent')
    }
    const subagent = this.getSubagentBySessionId(subagentSessionId)
    if (!subagent) {
      throw new Error('Subagent not found')
    }
    this.notifyListeners('message', subagent)
  }

  completeSubagent(id: string, result: unknown): void {
    const subagent = this.subagents.get(id)
    if (!subagent) return

    subagent.status = 'settled'
    subagent.completedAt = Date.now()
    subagent.result = result

    this.notifyListeners('completed', subagent)

    if (subagent.config.reportToParent === 'next-step') {
      this.notifyParent(subagent)
    }
  }

  updateSubagentStatus(id: string, status: ActivationStatus): void {
    const subagent = this.subagents.get(id)
    if (!subagent) return

    subagent.status = status
    this.notifyListeners('statusChanged', subagent)
  }

  private notifyParent(subagent: Subagent): void {
    this.notifyListeners('report', subagent)
  }

  cleanupSubagent(id: string): void {
    const subagent = this.subagents.get(id)
    if (!subagent) return

    const siblings = this.parentChildren.get(subagent.config.parentSessionId)
    if (siblings) {
      siblings.delete(id)
    }
    this.sessionParent.delete(subagent.sessionId)
    this.subagents.delete(id)

    this.notifyListeners('cleanedup', subagent)
  }

  on(event: string, listener: SubagentEventListener): () => void {
    const listeners = this.listeners.get(event) || new Set()
    listeners.add(listener)
    this.listeners.set(event, listeners)
    return () => {
      listeners.delete(listener)
    }
  }

  private notifyListeners(event: string, subagent: Subagent): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      for (const listener of listeners) {
        listener(subagent)
      }
    }
  }

  getActiveSubagents(): Subagent[] {
    return Array.from(this.subagents.values()).filter(s => s.status === 'running')
  }

  getSettledSubagents(): Subagent[] {
    return Array.from(this.subagents.values()).filter(s => s.status === 'settled')
  }

  cleanupAll(): void {
    this.subagents.clear()
    this.parentChildren.clear()
    this.sessionParent.clear()
  }
}
