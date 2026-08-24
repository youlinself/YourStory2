import type { Skill, SkillContext, ActiveSkill, SkillPromptSection } from './SkillTypes'
import type { ToolRegistry } from '../tools/ToolRegistry'
import type { EventEmitter } from '../events/EventEmitter'
import type { AutobiographyEventMap } from '../events/types'

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map()
  private activeSkills: Map<string, ActiveSkill> = new Map()
  private toolRegistry: ToolRegistry
  private events: EventEmitter
  private promptSections: Map<string, SkillPromptSection[]> = new Map()

  constructor(toolRegistry: ToolRegistry, events: EventEmitter) {
    this.toolRegistry = toolRegistry
    this.events = events
  }

  /** 注册技能 */
  register(skill: Skill): () => void {
    if (this.skills.has(skill.name)) {
      throw new Error(`Skill already registered: ${skill.name}`)
    }
    this.skills.set(skill.name, skill)

    return () => {
      this.skills.delete(skill.name)
    }
  }

  /** 批量注册技能 */
  registerAll(skills: Skill[]): () => void {
    const unregisterFns = skills.map(skill => this.register(skill))
    return () => {
      unregisterFns.forEach(fn => fn())
    }
  }

  /** 激活技能 */
  async activate(
    sessionId: string,
    skillName: string,
    context: SkillContext
  ): Promise<void> {
    const skill = this.skills.get(skillName)
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`)
    }

    const activeKey = `${sessionId}:${skillName}`
    if (this.activeSkills.has(activeKey)) {
      return
    }

    this.toolRegistry.activateForSession(sessionId, skill.tools)

    if (skill.promptSections.length > 0) {
      const existing = this.promptSections.get(sessionId) || []
      this.promptSections.set(sessionId, [...existing, ...skill.promptSections])
    }

    const disposers: Array<() => void> = []
    if (skill.on) {
      for (const [event, handler] of Object.entries(skill.on)) {
        const wrappedHandler = (payload: any) => handler(payload, context)
        const disposer = this.events.on(event as keyof AutobiographyEventMap, wrappedHandler)
        disposers.push(disposer)
      }
    }

    if (skill.onActivate) {
      await skill.onActivate(context)
    }

    this.activeSkills.set(activeKey, {
      skill,
      context,
      disposers,
      activatedAt: Date.now()
    })

    this.events.emit('skill/activated', { sessionId, skill: skillName })
  }

  /** 停用技能 */
  async deactivate(sessionId: string, skillName: string): Promise<void> {
    const activeKey = `${sessionId}:${skillName}`
    const active = this.activeSkills.get(activeKey)

    if (!active) {
      return
    }

    const skill = active.skill

    this.toolRegistry.deactivateForSession(sessionId, skill.tools)

    if (skill.promptSections.length > 0) {
      const existing = this.promptSections.get(sessionId) || []
      const filtered = existing.filter(
        s => !skill.promptSections.some(ps => ps.name === s.name)
      )
      this.promptSections.set(sessionId, filtered)
    }

    active.disposers.forEach(d => d())

    if (skill.onDeactivate) {
      await skill.onDeactivate(active.context)
    }

    this.activeSkills.delete(activeKey)

    this.events.emit('skill/deactivated', { sessionId, skill: skillName })
  }

  /** 获取会话激活的技能 */
  getActiveSkills(sessionId: string): ActiveSkill[] {
    return Array.from(this.activeSkills.values())
      .filter(as => as.context.sessionId === sessionId)
  }

  /** 获取会话可用的 prompt 片段 */
  getPromptSections(sessionId: string): SkillPromptSection[] {
    return this.promptSections.get(sessionId) || []
  }

  /** 获取所有已注册技能名称 */
  getAllSkillNames(): string[] {
    return Array.from(this.skills.keys())
  }

  /** 获取技能定义 */
  getSkill(skillName: string): Skill | undefined {
    return this.skills.get(skillName)
  }

  /** 清理会话的所有技能 */
  async cleanupSession(sessionId: string): Promise<void> {
    const active = this.getActiveSkills(sessionId)
    for (const as of active) {
      await this.deactivate(sessionId, as.skill.name)
    }
    this.promptSections.delete(sessionId)
  }
}
