export type NovelGenre =
  | 'fantasy'
  | 'romance'
  | 'sci-fi'
  | 'mystery'
  | 'historical'
  | 'modern'
  | 'wuxia'
  | 'urban'
  | 'horror'
  | 'other';

export type NovelStatus = 'planning' | 'writing' | 'completed' | 'paused';

export type ChapterStatus = 'outline' | 'draft' | 'polishing' | 'final';

export type CharacterRole = 'protagonist' | 'supporting' | 'antagonist' | 'extra';

export type CharacterGender = 'male' | 'female' | 'unknown';

export interface Relationship {
  targetCharacterId: string;
  type: string;
  description?: string;
}

export type ArcNodeType = 'turning_point' | 'growth' | 'setback' | 'revelation' | 'decision' | 'climax' | 'resolution';

export interface CharacterArcNode {
  id: string;
  title: string;
  description: string;
  arcType: ArcNodeType;
  chapterId?: string;
  order: number;
  createdAt: string;
}

export interface CharacterArc {
  nodes: CharacterArcNode[];
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  alias: string[];
  role: CharacterRole;
  gender: CharacterGender;
  age: number;
  appearance: string;
  personality: string;
  background: string;
  goals: string;
  relationships: Relationship[];
  avatar: string;
  notes: string;
  characterArc?: CharacterArc;
  createdAt: Date;
}

export const ARC_NODE_TYPES: Record<ArcNodeType, string> = {
  turning_point: '转折点',
  growth: '成长',
  setback: '挫折',
  revelation: '领悟',
  decision: '抉择',
  climax: '高潮',
  resolution: '结局',
};

export const ARC_NODE_COLORS: Record<ArcNodeType, string> = {
  turning_point: '#f59e0b',
  growth: '#10b981',
  setback: '#ef4444',
  revelation: '#8b5cf6',
  decision: '#3b82f6',
  climax: '#ec4899',
  resolution: '#14b8a6',
};

export interface WorldBuilding {
  id: string;
  novelId: string;
  setting: string;
  era: string;
  location: string;
  magicSystem: string;
  factions: string[];
  rules: string[];
  notes: string;
  updatedAt: Date;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  content: string;
  characters: string[];
  location: string;
  goal: string;
}

export interface Annotation {
  id: string;
  startPos: number;
  endPos: number;
  text: string;
  note: string;
  type: 'comment' | 'todo' | 'idea';
  createdAt: string;
  updatedAt: string;
}

export interface NovelChapter {
  id: string;
  novelId: string;
  title: string;
  order: number;
  content: string;
  summary: string;
  status: ChapterStatus;
  wordCount: number;
  notes: string;
  volumeId?: string;
  tags: string[];
  annotations: Annotation[];
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Volume {
  id: string;
  novelId: string;
  title: string;
  order: number;
  description: string;
  chapters: NovelChapter[];
}

export interface Novel {
  id: string;
  title: string;
  genre: NovelGenre;
  synopsis: string;
  coverImage: string;
  targetWordCount: number;
  currentWordCount: number;
  status: NovelStatus;
  chapters: NovelChapter[];
  volumes: Volume[];
  characters: Character[];
  worldBuilding: WorldBuilding | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NovelTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  genres: NovelGenre[];
}

export const GENRE_LABELS: Record<NovelGenre, string> = {
  'fantasy': '玄幻',
  'romance': '言情',
  'sci-fi': '科幻',
  'mystery': '悬疑',
  'historical': '历史',
  'modern': '现代',
  'wuxia': '武侠',
  'urban': '都市',
  'horror': '恐怖',
  'other': '其他',
};

export const NOVEL_STATUS_LABELS: Record<NovelStatus, string> = {
  'planning': '构思中',
  'writing': '写作中',
  'completed': '已完成',
  'paused': '暂停',
};

export const CHAPTER_STATUS_LABELS: Record<ChapterStatus, string> = {
  'outline': '大纲',
  'draft': '草稿',
  'polishing': '润色',
  'final': '定稿',
};

export const CHARACTER_ROLE_LABELS: Record<CharacterRole, string> = {
  'protagonist': '主角',
  'supporting': '配角',
  'antagonist': '反派',
  'extra': '龙套',
};

export const NOVEL_TEMPLATES: NovelTemplate[] = [
  {
    id: 'three-act',
    name: '三幕式',
    description: '开端→对抗→结局',
    structure: ['开端', '发展', '高潮', '结局'],
    genres: ['fantasy', 'mystery', 'urban', 'other'],
  },
  {
    id: 'four-act',
    name: '起承转合',
    description: '起→承→转→合',
    structure: ['起', '承', '转', '合'],
    genres: ['romance', 'modern', 'historical'],
  },
  {
    id: 'hero-journey',
    name: '英雄之旅',
    description: '启程→启蒙→归来',
    structure: ['平凡世界', '冒险召唤', '跨越门槛', '试炼之路', '最终奖赏', '归来'],
    genres: ['fantasy', 'wuxia', 'sci-fi'],
  },
  {
    id: 'chapter-style',
    name: '章回体',
    description: '多章回，每回独立故事',
    structure: ['第一回', '第二回', '第三回', '第四回'],
    genres: ['historical', 'wuxia'],
  },
  {
    id: 'multi-thread',
    name: '网状叙事',
    description: '多线并行，相互交织',
    structure: ['线索A', '线索B', '线索C', '线索交汇', '结局'],
    genres: ['mystery', 'urban'],
  },
];
