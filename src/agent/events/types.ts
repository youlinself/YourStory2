import type { ExtractedContent } from '../../types'
import type { ToolResult } from '../tools/ToolTypes'

export interface SessionEvent {
  id: string
  sessionId: string
  turn: number
  step: number
  type: SessionEventType
  payload: SessionEventPayload
  timestamp: number
  seed?: boolean
}

export type SurfaceEventType =
  | 'user/message'
  | 'assistant/message'
  | 'tool/result'

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
  | 'agent/cancelled'
  | 'agent/created'

export type SessionEventPayload =
  | { content: string }
  | { turn: number; reason?: string }
  | { step: number; turn: number }
  | { callId: string; name: string; arguments: unknown }
  | { result: unknown; callId: string; error?: string }
  | { chunk: unknown }
  | { summary: string }
  | { sessionId: string; chapterId: string }
  | { sessionId: string; cause: string }
  | Record<string, unknown>

export type SurfaceOp =
  | { op: 'append'; event: SessionEvent }
  | { op: 'replace'; events: SessionEvent[] }

export interface SessionEvents {
  'session/created': { sessionId: string; chapterId: string | null }
  'session/resumed': { sessionId: string }
  'session/paused': { sessionId: string }
  'session/closed': { sessionId: string }
}

export interface TurnEvents {
  'turn/start': { sessionId: string; userMessage: string }
  'turn/complete': { sessionId: string; assistantResponse: string; tokensUsed: number }
  'turn/error': { sessionId: string; error: Error }
}

export interface ContentEvents {
  'content/extracted': { sessionId: string; extraction: ExtractedContent }
  'content/merged': { sessionId: string; chapterId: string | null; draft: string }
  'content/approved': { sessionId: string; chapterId: string | null; content: string }
  'content/rejected': { sessionId: string; chapterId: string | null; reason: string }
}

export interface ToolEvents {
  'tool/called': { sessionId: string; tool: string; args: unknown }
  'tool/completed': { sessionId: string; tool: string; result: ToolResult }
  'tool/failed': { sessionId: string; tool: string; error: Error }
}

export interface SkillEvents {
  'skill/activated': { sessionId: string; skill: string }
  'skill/deactivated': { sessionId: string; skill: string }
}

export interface SystemEvents {
  'system/tokenWarning': { sessionId: string; used: number; limit: number }
  'system/error': { error: Error; context?: string }
}

export interface ContextEvents {
  'context/compressed': { sessionId: string; removedCount: number; tokensSaved: number }
}

export interface AgentEvents {
  'agent/cancelled': { sessionId: string; cause: string }
  'agent/created': { sessionId: string }
}

export type AutobiographyEventMap =
  & SessionEvents
  & TurnEvents
  & ContentEvents
  & ToolEvents
  & SkillEvents
  & SystemEvents
  & ContextEvents
  & AgentEvents

export type EventHandler<T = any> = (payload: T) => void | Promise<void>

export interface EventFilter {
  sessionId?: string
  chapterId?: string
}
