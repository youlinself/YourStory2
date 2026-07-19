export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  /** 消息类型：普通对话 / 结构化内容提取 */
  type?: 'text' | 'content_extract';
  /** 当 type='content_extract' 时，AI 提取的结构化内容 */
  extractedContent?: ExtractedContent;
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