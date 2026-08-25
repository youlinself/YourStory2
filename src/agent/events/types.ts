import type { ExtractedContent } from '../../types'
import type { ToolResult } from '../tools/ToolTypes'

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

/** 系统事件 */
export interface SystemEvents {
  'system/tokenWarning': { sessionId: string; used: number; limit: number }
  'system/error': { error: Error; context?: string }
}

/** 上下文事件 */
export interface ContextEvents {
  'context/compressed': { sessionId: string; removedCount: number; tokensSaved: number }
}

/** 所有事件 */
export type AutobiographyEventMap =
  & SessionEvents
  & TurnEvents
  & ContentEvents
  & ToolEvents
  & SkillEvents
  & SystemEvents
  & ContextEvents

/** 事件处理器 */
export type EventHandler<T = any> = (payload: T) => void | Promise<void>

/** 事件过滤条件 */
export interface EventFilter {
  sessionId?: string
  chapterId?: string
}
