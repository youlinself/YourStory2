// ==========================================
// 模拟人生 - 核心类型定义
// ==========================================

// ------------------------------------------
// 8维属性系统
// ------------------------------------------
export interface PlayerAttributes {
  energy: number;       // 精力 - 行动力、耐力、恢复速度
  physique: number;     // 体魄 - 力量、敏捷、运动能力
  health: number;       // 健康 - 免疫与恢复、疾病抵抗、寿命基础
  iq: number;           // 智商 - 学习、判断、逻辑、分析
  eq: number;           // 情商 - 人际交往、情绪管理、谈判
  wealth: number;       // 财富 - 金钱、资产、投资
  network: number;      // 人脉 - 社会关系、朋友圈
  fame: number;         // 名望 - 社会名誉、声望、口碑
}

// 属性变化记录
export interface AttributeChange {
  attr: keyof PlayerAttributes;
  oldValue: number;
  newValue: number;
  reason: string;
  timestamp: number;
}

// 隐藏标签（由玩家选择自然形成）
export interface HiddenTag {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
}

// ------------------------------------------
// 时代与出生年
// ------------------------------------------
export type BirthYear = 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020 | 2030 | 2040 | 2050 | 2060 | 2070;

export interface EraDefinition {
  year: BirthYear;
  name: string;                  // 时代名称，如"婴儿潮一代"
  baseLifeExpectancy: number;    // 基础预期寿命
  description: string;
  initialWealthRange: [number, number];  // 初始财富范围
  initialNetworkRange: [number, number];  // 初始人脉范围
}

// ------------------------------------------
// 事件系统
// ------------------------------------------
export type EventType = 'fixed' | 'random' | 'npc_triggered' | 'world_event';

export interface EventOption {
  id: string;
  text: string;
  // 成功率计算需要的属性权重
  successRate: Partial<Record<keyof PlayerAttributes, number>>;
  // 成功结果
  successOutcome: EventOutcome;
  // 失败结果
  failureOutcome: EventOutcome;
  // 隐藏标签影响
  tagModifier?: {
    tag: string;
    rateBonus: number;
  };
}

export interface EventOutcome {
  description: string;
  attributeChanges: Partial<PlayerAttributes>;
  npcRelationshipChanges?: { npcId: string; delta: number }[];
  unlockEvents?: string[];       // 解锁新事件
  lockEvents?: string[];         // 锁定事件
  nextEraModifier?: number;      // 下一时代剧本变异系数
  lifeCost?: number;             // 生命值消耗
}

export interface GameEvent {
  id: string;
  type: EventType;
  era: number;                   // 所属年代
  title: string;
  // 换皮基础文本，实际显示会根据属性换皮
  baseText: string;
  // 换皮规则：根据属性值返回不同文本
  skinRule?: (attrs: PlayerAttributes, history: ChoiceRecord[], tags: string[]) => string;
  options: EventOption[];
  // 触发条件
  triggerCondition?: (state: GameState) => boolean;
  // 是否为重大事件（影响整个时代）
  isMilestone?: boolean;
}

// ------------------------------------------
// NPC系统
// ------------------------------------------
export interface NPC {
  id: string;
  name: string;
  role: string;                  // 角色：邻居、老师、同事...
  basePersonality: string;       // 基础人设
  relationship: number;          // 与玩家的关系值 -100 ~ 100
  lifeStage: number;             // NPC当前所处的人生阶段
  isAlive: boolean;
  // 隐藏事件触发可能性
  eventTriggerChance: number;
}

export interface NPCDialogue {
  npcId: string;
  content: string;
  options: {
    text: string;
    relationshipChange: number;
    outcome: string;
  }[];
}

// ------------------------------------------
// 游戏状态
// ------------------------------------------
export type GamePhase = 'setup' | 'playing' | 'event' | 'npc_dialogue' | 'era_transition' | 'ended';

export interface ChoiceRecord {
  era: number;
  year: number;
  eventId: string;
  optionId: string;
  success: boolean;
  timestamp: number;
  description: string;
}

export interface LifeRecord {
  id: string;
  era: number;
  year: number;
  title: string;
  content: string;
  attributeChanges: AttributeChange[];
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  birthYear: BirthYear | null;
  currentYear: number;
  currentEra: number;            // 当前是第几个十年（0起始）
  age: number;
  remainingLife: number;         // 剩余生命值
  attributes: PlayerAttributes;
  hiddenTags: string[];          // 已获得的隐藏标签
  npcs: NPC[];
  choiceHistory: ChoiceRecord[];
  lifeRecords: LifeRecord[];
  availableEvents: GameEvent[];
  worldState: WorldState;        // 世界状态（被玩家选择影响）
  seed: number;                  // 随机种子
}

// 世界状态 - 记录玩家对时代的影响
export interface WorldState {
  industryEvolution: Record<string, number>;   // 产业发展状态
  socialClimate: number;                        // 社会氛围 0-100
  techProgress: number;                         // 科技进度 0-100
  customEvents: string[];                       // 玩家自创的历史事件
}

// ------------------------------------------
// 剧本模板（换皮骨架）
// ------------------------------------------
export interface ScriptTemplate {
  era: number;
  // 固定节点 - 必定发生的事件
  fixedNodes: GameEvent[];
  // 随机事件池 - 从中随机抽取填充
  randomEventPool: GameEvent[];
  // NPC模板
  npcTemplates: Omit<NPC, 'id' | 'relationship' | 'lifeStage' | 'isAlive'>[];
  // 时代描述模板
  eraDescription: string;
}

// ------------------------------------------
// 小说导出
// ------------------------------------------
export interface NovelExport {
  title: string;
  birthYear: number;
  deathYear: number;
  chapters: {
    era: string;
    title: string;
    content: string;
    highlights: string[];
  }[];
  stats: {
    maxAttributes: Partial<PlayerAttributes>;
    totalChoices: number;
    successRate: number;
    npcRelationships: { name: string; finalRelation: number }[];
    finalTags: string[];
  };
}
