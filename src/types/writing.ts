export interface WritingStats {
  daily: DailyWritingStat[];
  goals: WritingGoals;
  streak: StreakInfo;
}

export interface DailyWritingStat {
  date: string;
  wordCount: number;
  duration: number;
  chapters: string[];
}

export interface WritingGoals {
  dailyWordCount: number;
  novelWordCount: number;
  deadline?: string;
  reminderEnabled: boolean;
  reminderTime: string;
  notifyOnComplete: boolean;
  notifyOnStreakBreak: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastWriteDate: string;
}

export interface WritingSession {
  id: string;
  novelId: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  wordCountStart: number;
  wordCountEnd: number;
  wordsAdded: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlockedAt?: string;
}

export interface AchievementCondition {
  type: 'wordCount' | 'streak' | 'chapter' | 'session';
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_word', name: '妙笔生花', description: '写下第一个字', icon: '✍️', condition: { type: 'wordCount', threshold: 1 } },
  { id: 'thousand_words', name: '初露锋芒', description: '累计写作1000字', icon: '📝', condition: { type: 'wordCount', threshold: 1000 } },
  { id: 'ten_thousand_words', name: '文思泉涌', description: '累计写作10000字', icon: '📚', condition: { type: 'wordCount', threshold: 10000 } },
  { id: 'hundred_thousand_words', name: '著作等身', description: '累计写作100000字', icon: '🏆', condition: { type: 'wordCount', threshold: 100000 } },
  { id: 'streak_7', name: '持之以恒', description: '连续写作7天', icon: '🔥', condition: { type: 'streak', threshold: 7 } },
  { id: 'streak_30', name: '笔耕不辍', description: '连续写作30天', icon: '💪', condition: { type: 'streak', threshold: 30 } },
  { id: 'chapter_10', name: '十章成书', description: '完成10个章节', icon: '📖', condition: { type: 'chapter', threshold: 10 } },
  { id: 'session_3000', name: '文思如泉', description: '单次写作3000字', icon: '⚡', condition: { type: 'session', threshold: 3000 } },
];

export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  wordCount: number;
  createdAt: string;
  description: string;
  isAutoSave: boolean;
}

export interface VersionDiff {
  additions: { text: string; position: number }[];
  deletions: { text: string; position: number }[];
  modifications: { oldText: string; newText: string; position: number }[];
}

export interface AIParams {
  continue: {
    length: 'short' | 'medium' | 'long';
    style: 'original' | 'literary' | 'colloquial' | 'custom';
    direction: string;
    temperature: number;
  };
  polish: {
    intensity: 'light' | 'medium' | 'heavy';
    focus: ('fluency' | 'imagery' | 'emotion' | 'rhythm')[];
    preserveStyle: boolean;
  };
  expand: {
    ratio: 2 | 3 | 4;
    focus: ('action' | 'psychology' | 'environment' | 'dialogue')[];
  };
}

export const DEFAULT_AI_PARAMS: AIParams = {
  continue: {
    length: 'medium',
    style: 'original',
    direction: '',
    temperature: 0.7,
  },
  polish: {
    intensity: 'medium',
    focus: ['fluency'],
    preserveStyle: true,
  },
  expand: {
    ratio: 2,
    focus: ['action'],
  },
};

export interface AIHistoryItem {
  id: string;
  type: 'continue' | 'polish' | 'expand' | 'suggest' | 'name' | 'inspire';
  input: string;
  output: string;
  params: AIParams;
  timestamp: string;
  novelId: string;
  chapterId?: string;
  isFavorited: boolean;
}

export interface SmartSuggestion {
  enabled: boolean;
  triggers: {
    onPause: boolean;
    onParagraphEnd: boolean;
    onChapterEnd: boolean;
    onRepeatPhrase: boolean;
  };
  suggestionTypes: ('continue' | 'polish' | 'alternative')[];
}

export interface SavedInspiration {
  id: string;
  type: 'plot' | 'character' | 'scene' | 'dialogue' | 'theme';
  content: string;
  tags: string[];
  novelId?: string;
  chapterId?: string;
  isUsed: boolean;
  createdAt: string;
}

export interface InspirationLibrary {
  inspirations: SavedInspiration[];
  categories: string[];
  filters: {
    type?: string;
    isUsed?: boolean;
    tags?: string[];
  };
}

export interface ExportConfig {
  format: 'markdown' | 'text' | 'pdf' | 'docx' | 'html';
  scope: 'chapter' | 'volume' | 'novel';
  include: {
    title: boolean;
    author: boolean;
    synopsis: boolean;
    toc: boolean;
    chapterTitle: boolean;
    separator: boolean;
  };
  style?: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    pageMargin: number;
  };
}

export interface CharacterArc {
  characterId: string;
  events: {
    chapterId: string;
    sceneId?: string;
    description: string;
    changeType: 'growth' | 'setback' | 'revelation' | 'relationship';
    timestamp: string;
  }[];
}

export interface CharacterAppearance {
  characterId: string;
  chapterAppearances: {
    chapterId: string;
    count: number;
    firstAppearance: number;
  }[];
}

export type EditorMode = 'plaintext' | 'markdown' | 'split' | 'focus';

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number;
  debounce: number;
  showIndicator: boolean;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface EditorState {
  content: string;
  history: string[];
  historyIndex: number;
  cursorPosition: number;
  selection: { start: number; end: number };
}

/** 自定义写作技能类型 */
export type SkillCategory = 'writing' | 'analysis' | 'generation' | 'organization' | 'custom';

/** 自定义写作技能 */
export interface CustomWritingSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  /** 技能提示词模板 */
  promptTemplate: string;
  /** 快捷触发词 */
  triggerWords: string[];
  /** 关联的AI参数覆盖 */
  paramsOverride?: Partial<AIParams>;
  /** 是否启用 */
  isEnabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** AI 扩展配置 */
export interface AIExtensionConfig {
  /** 自定义系统提示词 */
  customSystemPrompt: string;
  /** 写作风格预设 */
  writingStylePresets: WritingStylePreset[];
  /** 自动触发技能 */
  autoTriggerSkills: boolean;
  /** 技能建议阈值 */
  skillSuggestionThreshold: number;
}

/** 写作风格预设 */
export interface WritingStylePreset {
  id: string;
  name: string;
  description: string;
  /** 风格提示词 */
  stylePrompt: string;
  /** 示例文本 */
  exampleText: string;
  /** 关联参数 */
  params: Partial<AIParams>;
  isDefault: boolean;
}

/** AI智囊团成员角色类型 */
export type ThinkTankRole = 'plot_writer' | 'character_designer' | 'world_builder' | 'dialogue_specialist' | 'style_polisher' | 'creative_consultant' | 'secretary_assistant' | 'custom';

/** AI智囊团成员 */
export interface ThinkTankMember {
  id: string;
  /** 成员名称（用户自定义） */
  name: string;
  /** 成员角色 */
  role: ThinkTankRole;
  /** 成员描述 */
  description: string;
  /** AI配置 */
  config: {
    apiKey: string;
    model: string;
    baseUrl: string;
    vendor: string;
    temperature: number;
    maxInputTokens: number;
    maxOutputTokens: number;
    customModelName: string;
    testUrl: string;
  };
  /** 是否启用 */
  isEnabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** AI智囊团预设角色配置 */
export interface ThinkTankRolePreset {
  role: ThinkTankRole;
  name: string;
  description: string;
  icon: string;
  defaultPrompt: string;
}
