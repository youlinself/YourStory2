// ==========================================
// 模拟人生 - 核心类型定义（杀戮尖塔风格）
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
  name: string;
  baseLifeExpectancy: number;
  description: string;
  initialWealthRange: [number, number];
  initialNetworkRange: [number, number];
  attributePoints: number;  // 开局可分配属性点
}

// ==========================================
// 卡牌系统 - 映射人生中的行动/能力/特质
// ==========================================
export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type CardTarget = 'enemy' | 'self' | 'all' | 'none';

// 卡牌效果
export interface CardEffect {
  type:
    | 'damage'           // 直接伤害
    | 'block'            // 获得格挡
    | 'heal'             // 恢复健康
    | 'draw'             // 抽卡
    | 'gain_energy'      // 获得精力
    | 'gain_max_energy'  // 永久增加精力上限
    | 'gain_attribute'   // 永久增加属性
    | 'lose_attribute'   // 暂时损失属性
    | 'vulnerable'       // 敌人易伤
    | 'weak'             // 敌人虚弱
    | 'poison'           // 中毒
    | 'cure'             // 净化负面效果
    | 'shield'           // 护盾（吸收伤害）
    | 'thorns'           // 反伤
    | 'rage'             // 狂暴（攻击加深）
    | 'stealth'          // 闪避下次攻击
    | 'lifedrain'        // 汲取生命值
    | 'lifesteal'        // 攻击吸血
    | 'regen'            // 每回合恢复
    | 'strength'         // 力量（攻击加成）
    | 'dexterity';       // 敏捷（防御加成）
  value: number;
  attribute?: keyof PlayerAttributes;  // 关联属性（用于基于属性的加伤等）
  duration?: number;                   // 持续回合数（undefined为即时）
}

export interface LifeCard {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;                // 消耗精力
  target: CardTarget;
  effects: CardEffect[];
  description: string;         // 显示文本（支持换皮）
  skinRule?: (state: GameState) => string;
  expires?: number;            // 持续几个时代，undefined=永久
  isUpgraded?: boolean;
  upgrade?: Partial<LifeCard>; // 升级后变化
  tags: string[];              // 标签：如"学术"、"商业"、"健康"
  icon: string;                // emoji图标
}

// ==========================================
// 遗物系统 - 永久人生优势
// ==========================================
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss' | 'legendary';

export interface RelicEffect {
  type:
    | 'max_health_bonus'     // 生命上限加成
    | 'energy_bonus'         // 初始精力加成
    | 'card_draw_bonus'      // 每回合抽卡数加成
    | 'discount'             // 商店折扣
    | 'double_damage'        // 暴击伤害
    | 'heal_on_rest'         // 休息恢复加成
    | 'extra_card_reward'    // 额外卡牌奖励选择
    | 'card_type_bonus'      // 某类型卡牌加成
    | 'attribute_scaling'    // 基于属性获得加成
    | 'lifespan_extend'      // 寿命延长（修仙模式）
    | 'retention_bonus';     // 跨时代保留加成
  value: number;
  attribute?: keyof PlayerAttributes;
  cardType?: CardType;
}

export interface LifeRelic {
  id: string;
  name: string;
  rarity: RelicRarity;
  description: string;
  effects: RelicEffect[];
  icon: string;
  stackable: boolean;          // 是否可叠加
  maxStacks?: number;
  eraLimited?: number;         // 仅限某时代可用，undefined=永久
}

// ==========================================
// 敌人和Boss系统 - 人生挑战怪物化
// ==========================================
export type EnemyIntent =
  | { type: 'attack'; damage: number; hits?: number }
  | { type: 'defend'; block: number }
  | { type: 'buff'; effect: string; value: number }
  | { type: 'debuff'; effect: string; value: number }
  | { type: 'special'; name: string; description: string }
  | { type: 'idle' };

export interface EnemyIntentDisplay {
  icon: string;
  text: string;
  isAttack: boolean;
  value?: number;
}

export interface Enemy {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  block: number;
  intents: EnemyIntent[];          // 行动循环
  currentIntentIndex: number;
  statusEffects: StatusEffect[];
  icon: string;
  isBoss: boolean;
  cardRewards: LifeCard[];         // 击败后3选1奖励卡的副本
  relicReward?: LifeRelic;         // Boss专属
  goldReward: [number, number];    // 金币奖励范围
  description: string;
}

// 状态效果
export interface StatusEffect {
  type:
    | 'vulnerable'   // 易伤（受到伤害+25%）
    | 'weak'         // 虚弱（攻击-25%）
    | 'poison'       // 中毒（每回合损失生命）
    | 'block'        // 格挡
    | 'strength'     // 力量（攻击加成）
    | 'dexterity'    // 敏捷（防御加成）
    | 'shields'      // 护盾（吸收伤害）
    | 'thorns'       // 反伤
    | 'rage'         // 狂暴
    | 'regen'        // 每回合恢复
    | 'artifact'     // 免疫debuff
    | 'intangible';  // 只受1点伤害
  value: number;
  duration: number;                // 持续回合数
}

// ==========================================
// 战斗状态机
// ==========================================
export type CombatPhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';

export interface CombatState {
  isInCombat: boolean;
  phase: CombatPhase;
  currentTurn: number;
  player: {
    currentHealth: number;
    maxHealth: number;
    block: number;
    energy: number;
    maxEnergy: number;
    hand: LifeCard[];         // 当前手牌
    drawPile: LifeCard[];     // 抽牌堆
    discardPile: LifeCard[];  // 弃牌堆
    exhaustPile: LifeCard[];  // 消耗牌堆（移除本局）
    statusEffects: StatusEffect[];
  };
  enemies: Enemy[];
  currentEnemyIndex: number;
  rewards: {
    cards: LifeCard[];
    gold: number;
    relic?: LifeRelic;
  };
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  turn: number;
  actor: 'player' | string;  // enemy id
  action: string;
  timestamp: number;
}

// ==========================================
// 地图节点系统
// ==========================================
export type NodeType =
  | 'start'       // 起点（每个时代开始）
  | 'event'       // 随机事件
  | 'combat'      // 普通战斗
  | 'elite'       // 精英战斗（高回报）
  | 'boss'        // 时代Boss
  | 'rest'        // 休息恢复
  | 'shop'        // 商店购买
  | 'treasure'    // 宝藏奖励
  | 'mystery';    // 神秘节点（随机类型）

export interface MapNode {
  id: string;
  type: NodeType;
  x: number;              // 路径位置 (0-10)
  y: number;              // 层级 (0-2，3条分支)
  connections: string[];  // 连接的节点id
  isVisited: boolean;
  isAccessible: boolean;
  data?: MapNodeData;
}

export interface MapNodeData {
  eventId?: string;
  enemyIds?: string[];
  relicId?: string;
  goldRange?: [number, number];
  choices?: EventOption[];
}

export interface EraMap {
  era: number;
  nodes: MapNode[];
  currentNodeId: string;
  completed: boolean;
}

// ------------------------------------------
// 事件系统（复用原有事件逻辑，整合入地图）
// ------------------------------------------
export type EventType = 'fixed' | 'random' | 'npc_triggered' | 'world_event' | 'map_event';

export interface EventOption {
  id: string;
  text: string;
  successRate: Partial<Record<keyof PlayerAttributes, number>>;
  successOutcome: EventOutcome;
  failureOutcome: EventOutcome;
  tagModifier?: {
    tag: string;
    rateBonus: number;
  };
}

export interface EventOutcome {
  description: string;
  attributeChanges: Partial<PlayerAttributes>;
  npcRelationshipChanges?: { npcId: string; delta: number }[];
  unlockEvents?: string[];
  lockEvents?: string[];
  nextEraModifier?: number;
  lifeCost?: number;
  cardRewards?: LifeCard[];
  relicRewards?: LifeRelic[];
  goldReward?: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  era: number;
  title: string;
  baseText: string;
  skinRule?: (attrs: PlayerAttributes, history: ChoiceRecord[], tags: string[]) => string;
  options: EventOption[];
  triggerCondition?: (state: GameState) => boolean;
  isMilestone?: boolean;
}

// ------------------------------------------
// NPC系统
// ------------------------------------------
export interface NPC {
  id: string;
  name: string;
  role: string;
  basePersonality: string;
  relationship: number;
  lifeStage: number;
  isAlive: boolean;
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
// 商城系统
// ------------------------------------------
export interface ShopItem {
  card?: LifeCard;
  relic?: LifeRelic;
  price: number;
  discount?: number;  // 遗物折扣影响
  isPurchased: boolean;
}

export interface ShopState {
  items: ShopItem[];
  refreshCost: number;
  era: number;
}

// ------------------------------------------
// 游戏状态
// ------------------------------------------
export type GamePhase =
  | 'setup'            // 选属性
  | 'allocating'       // 分配属性点
  | 'map_view'         // 查看地图选择
  | 'event'            // 事件节点
  | 'combat'           // 战斗节点
  | 'shop'             // 商店
  | 'rest'             // 休息
  | 'reward'           // 战斗奖励
  | 'era_transition'   // 时代过渡
  | 'ended'            // 游戏结束
  | 'loading';         // 加载中

export type GameMode = 'normal' | 'endless';  // 普通模式 / 修仙模式

// 修仙模式境界
export type CultivationRealm =
  | 'mortal'       // 凡人
  | 'qi_refining'  // 炼气
  | 'foundation'   // 筑基
  | 'golden_core'  // 金丹
  | 'nascent'      // 元婴
  | 'spirit'       // 化神
  | 'void'         // 炼虚
  | 'integration'  // 合体
  | 'mahayana'     // 大乘
  | 'tribulation'; // 渡劫

export interface CultivationState {
  realm: CultivationRealm;
  maxLifespan: number;
  tribulationThreshold: number;  // 触发天劫的属性要求
  realmBonus: Partial<Record<keyof PlayerAttributes, number>>;
}

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
  mode: GameMode;
  birthYear: BirthYear | null;
  currentYear: number;
  currentEra: number;
  age: number;
  maxLifespan: number;
  remainingLife: number;
  attributes: PlayerAttributes;
  remainingAttributePoints: number;  // 剩余可分配点
  hiddenTags: string[];
  npcs: NPC[];
  choiceHistory: ChoiceRecord[];
  lifeRecords: LifeRecord[];

  // 卡牌/遗物
  deck: LifeCard[];          // 当前卡组
  relics: LifeRelic[];       // 已获得的遗物
  gold: number;              // 金币（商店货币）

  // 战斗
  combat: CombatState;

  // 地图
  currentMap: EraMap | null;

  // 商店
  shop: ShopState | null;

  // 修仙
  cultivation: CultivationState | null;

  // 世界状态
  worldState: WorldState;

  // 随机种子
  seed: number;
}

export interface WorldState {
  industryEvolution: Record<string, number>;
  socialClimate: number;
  techProgress: number;
  customEvents: string[];
}

// ------------------------------------------
// 存档系统
// ------------------------------------------
export interface SaveMetadata {
  id: string;
  birthYear: number;
  currentEra: number;
  age: number;
  maxLifespan: number;
  mode: GameMode;
  isDead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// 小说导出
// ------------------------------------------
export interface NovelExport {
  title: string;
  birthYear: number;
  deathYear: number;
  mode: GameMode;
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
    relics: string[];
    deckSize: number;
    cultivationRealm?: CultivationRealm;
  };
}
