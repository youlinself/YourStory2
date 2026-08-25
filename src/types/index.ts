export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  /** 消息类型：普通对话 / 结构化内容提取 */
  type?: 'text' | 'content_extract' | 'node_created' | 'decision_marked' | 'emotion_tagged';
  /** 当 type='content_extract' 时，AI 提取的结构化内容 */
  extractedContent?: ExtractedContent;
  /** 关联的叙事节点ID */
  nodeId?: string;
  /** 智能追问问题 */
  followUpQuestions?: string[];
}

/** 人生阶段枚举 */
export type LifeStage = 'childhood' | 'school' | 'work' | 'marriage' | 'parenthood' | 'retirement' | 'other';

/** 事件类型枚举 */
export type EventType = 'active_choice' | 'passive_event' | 'emotional_turning' | 'regret_node';

/** 叙事节点 - 结构化创作的基本单元 */
export interface NarrativeNode {
  id: string;
  stage: LifeStage;
  title: string;
  content: string;
  type: EventType;
  emotionTags: string[];
  emotionNote?: string;
  reason?: string;
  relatedNodes: string[];
  isSensitive: boolean;
  isDecisionPoint: boolean;
  decisionDescription?: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 抉择点 - 可用于重生的分叉入口 */
export interface DecisionPoint {
  id: string;
  nodeId: string;
  originalChoice: string;
  forkable: boolean;
  rebirthCount: number;
  regretLevel: 1 | 2 | 3 | 4 | 5;
}

/** 重生体验 - 平行宇宙版本 */
export interface RebirthExperience {
  id: string;
  autobiographyId: string;
  forkNodeId: string;
  forkContext: string;
  title: string;
  nodes: NarrativeNode[];
  diffSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

/** AI 从对话中提取的结构化内容 */
export interface ExtractedContent {
  /** 提取的段落（可直接写入章节） */
  paragraphs: string[];
  /** 时间标签（如 "1990年夏天"） */
  timeTag?: string;
  /** 情感标签（如 "温馨", "艰辛"） */
  emotionTags?: string[];
  /** 关键人物 */
  people?: string[];
  /** 用户确认状态 */
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  /** 用户编辑后的内容（status='edited' 时有值） */
  editedContent?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  /** 对话产生的草稿内容（未确认） */
  draftContent?: string;
  /** 时间范围，如 "1990-2000" */
  timeRange?: string;
  /** 章节状态 */
  status?: 'empty' | 'draft' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Autobiography {
  id: string;
  title: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AISettings {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor: string;
  temperature: number;
  maxInputTokens: number;
  maxOutputTokens: number;
}

/** 对话会话 */
export interface DialogueSession {
  id: string;
  /** 关联章节，null 表示自由对话 */
  chapterId: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  /** 会话标签 */
  tags?: string[];
}

/** 智能建议 */
export interface Suggestion {
  id: string;
  text: string;
  type: 'guide_question' | 'chapter_topic' | 'follow_up' | 'summarize';
  /** 建议关联的章节（可选） */
  chapterId?: string;
}

/** 章节上下文（传给 AI） */
export interface ChapterContext {
  chapterId: string;
  chapterTitle: string;
  existingContent: string;
  timeRange?: string;
}

/** 写作偏好 */
export interface WritingPreferences {
  /** 写作风格 */
  style: 'formal' | 'casual' | 'literary' | 'concise'
  /** 语言 */
  language: 'zh' | 'en'
  /** 人称视角 */
  perspective: 'first' | 'third'
  /** 是否自动提取内容 */
  autoExtract: boolean
  /** 自定义提示 */
  customPrompts?: string[]
}

/** 时间线上下文 */
export interface TimelineContext {
  /** 当前章节时间范围 */
  currentEra?: string
  /** 已发生的关键事件 */
  keyEvents?: TimelineEvent[]
  /** 人物年龄映射 */
  characterAges?: Record<string, number>
}

/** 时间线事件 */
export interface TimelineEvent {
  id: string
  title: string
  description: string
  year: number
  month?: number
  day?: number
  relatedCharacters?: string[]
}

// 羁绊系统类型导出
export type {
  IdentityCategory,
  BondRarity,
  BondCardDefinition,
  BondCardInstance,
  DrawRecord,
  CurrentDrawState,
  BondRewardType,
  BondReward,
  BondGroupDefinition,
  BondGroupTier,
  BondSystemState,
  CollectionStats,
} from './bond';