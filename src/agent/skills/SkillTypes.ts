import type { SessionContext } from '../session/types'
import type { AutobiographyAgent } from '../AutobiographyAgent'
import type { AutobiographyEventMap } from '../events/types'

/** 技能提示片段 */
export interface SkillPromptSection {
  name: string
  order: number
  content: (context: SkillContext) => string
}

/** 技能事件处理器 - 类型安全的事件处理映射 */
export type SkillEventHandlers = {
  [K in keyof AutobiographyEventMap]?: (
    payload: AutobiographyEventMap[K],
    context: SkillContext
  ) => Promise<void> | void
}

/** 技能上下文 */
export interface SkillContext {
  sessionId: string
  chapterId: string
  sessionContext: SessionContext
  agent: AutobiographyAgent
}

/** 技能命令 */
export interface SkillCommand {
  name: string
  description: string
  execute: (args: string, context: SkillContext) => Promise<CommandResult>
}

/** 命令执行结果 */
export interface CommandResult {
  success: boolean
  output: string
  data?: any
}

/** 技能定义 */
export interface Skill {
  name: string
  description: string

  /** 技能依赖的工具 */
  tools: string[]

  /** 技能提供的 prompt 片段 */
  promptSections: SkillPromptSection[]

  /** 技能提供的事件处理器 */
  on?: SkillEventHandlers

  /** 技能提供的命令 */
  commands?: SkillCommand[]

  /** 技能激活时调用 */
  onActivate?: (context: SkillContext) => Promise<void> | void

  /** 技能停用时调用 */
  onDeactivate?: (context: SkillContext) => Promise<void> | void
}

/** 激活的技能实例 */
export interface ActiveSkill {
  skill: Skill
  context: SkillContext
  disposers: Array<() => void>
  activatedAt: number
}
