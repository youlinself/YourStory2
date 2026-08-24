import type { ExtractedContent, Chapter, WritingPreferences, TimelineContext } from '../../types'

/** 会话状态 */
export type SessionStatus = 'active' | 'paused' | 'extracting' | 'merging' | 'closed'

/** 工具调用记录 */
export interface ToolCallRecord {
  toolName: string
  args: any
  result: {
    success: boolean
    data?: any
    error?: string
    messages?: string[]
  }
  timestamp: number
  duration: number
}

/** 工具结果记录 */
export interface ToolResultRecord {
  toolName: string
  result: any
  timestamp: number
}

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
  warningThreshold: number
}

/** 提取任务 */
export interface ExtractionTask {
  id: string
  type: 'extract' | 'merge' | 'compact'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payload: any
  result?: any
  error?: string
  createdAt: number
  updatedAt: number
}

/** 会话上下文 */
export interface SessionContext {
  chapterId: string
  existingContent: Chapter | null
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
