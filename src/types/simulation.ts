// ==========================================
// 模拟人生 - 核心类型定义（杀戮尖塔风格）
// ==========================================

// ------------------------------------------
// 8维属性系统
// ------------------------------------------
export interface PlayerAttributes {
  energy: number;
  physique: number;
  health: number;
  iq: number;
  eq: number;
  wealth: number;
  network: number;
  fame: number;
}

export interface AttributeChange {
  attr: keyof PlayerAttributes;
  oldValue: number;
  newValue: number;
  reason: string;
  timestamp: number;
}

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
  attributePoints: number;
}

// ==========================================
// 卡牌系统
// ==========================================
export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type CardTarget = 'enemy' | 'self' | 'all' | 'none';

export interface CardEffect {
  type:
    | 'damage' | 'block' | 'heal' | 'draw' | 'gain_energy' | 'gain_max_energy'
    | 'gain_attribute' | 'lose_attribute' | 'vulnerable' | 'weak' | 'poison'
    | 'cure' | 'shield' | 'thorns' | 'rage' | 'stealth' | 'lifedrain' | 'lifesteal'
    | 'regen' | 'strength' | 'dexterity';
  value: number;
  attribute?: keyof PlayerAttributes;
  duration?: number;
}

export interface LifeCard {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  target: CardTarget;
  effects: CardEffect[];
  description: string;
  skinRule?: (state: GameState) => string;
  expires?: number;
  isUpgraded?: boolean;
  upgrade?: Partial<LifeCard>;
  tags: string[];
  icon: string;
}

// ==========================================
// 遗物系统
// ==========================================
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss' | 'legendary';

export interface RelicEffect {
  type:
    | 'max_health_bonus' | 'energy_bonus' | 'card_draw_bonus' | 'discount'
    | 'double_damage' | 'heal_on_rest' | 'extra_card_reward' | 'card_type_bonus'
    | 'attribute_scaling' | 'lifespan_extend' | 'retention_bonus';
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
  stackable: boolean;
  maxStacks?: number;
  eraLimited?: number;
}

// ==========================================
// 敌人和Boss系统
// ==========================================
export type EnemyIntent =
  | { type: 'attack'; damage: number; hits?: number }
  | { type: 'defend'; block: number }
  | { type: 'buff'; effect: string; value: number }
  | { type: 'debuff'; effect: string; value: number }
  | { type: 'special'; name: string; description: string }
  | { type: 'idle' };

export interface Enemy {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  block: number;
  intents: EnemyIntent[];
  currentIntentIndex: number;
  statusEffects: StatusEffect[];
  icon: string;
  isBoss: boolean;
  cardRewards: LifeCard[];
  relicReward?: LifeRelic;
  goldReward: [number, number];
  description: string;
}

export interface StatusEffect {
  type:
    | 'vulnerable' | 'weak' | 'poison' | 'block' | 'strength' | 'dexterity'
    | 'shields' | 'thorns' | 'rage' | 'regen' | 'artifact' | 'intangible';
  value: number;
  duration: number;
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
    hand: LifeCard[];
    drawPile: LifeCard[];
    discardPile: LifeCard[];
    exhaustPile: LifeCard[];
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
  actor: 'player' | string;
  action: string;
  timestamp: number;
}

// ==========================================
// 地图节点系统
// ==========================================
export type NodeType =
  | 'start' | 'event' | 'combat' | 'elite' | 'boss'
  | 'rest' | 'shop' | 'treasure' | 'mystery';

export interface MapNode {
  id: string;
  type: NodeType;
  x: number;              // 深度位置 (0-9, 对应每年)
  y: number;              // 分支 (0-2, 3条路径)
  connections: string[];  // 连接的节点id
  isVisited: boolean;
  isAccessible: boolean;
  isCurrent: boolean;     // 是否为当前选中节点
  data?: MapNodeData;
}

export interface MapNodeData {
  eventId?: string;
  enemyIds?: string[];
  relicId?: string;
  goldRange?: [number, number];
}

export interface EraMap {
  era: number;
  nodes: MapNode[];
  currentNodeId: string;
  currentLayer: number;       // 当前层数
  maxAccessibleLayer: number; // 最高可达层数
  completed: boolean;
}

// ------------------------------------------
// 事件系统
// ------------------------------------------
export type EventType = 'fixed' | 'random' | 'npc_triggered' | 'world_event' | 'map_event';

export interface EventOption {
  id: string;
  text: string;
  successRate: Partial<Record<keyof PlayerAttributes, number>>;
  successOutcome: EventOutcome;
  failureOutcome: EventOutcome;
  tagModifier?: { tag: string; rateBonus: number };
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

// ------------------------------------------
// 商城系统
// ------------------------------------------
export interface ShopItem {
  card?: LifeCard;
  relic?: LifeRelic;
  price: number;
  discount?: number;
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
  | 'setup' | 'allocating' | 'map_view' | 'event' | 'combat'
  | 'shop' | 'rest' | 'reward' | 'era_transition' | 'ended' | 'loading';

export type GameMode = 'normal' | 'endless';

export type CultivationRealm =
  | 'mortal' | 'qi_refining' | 'foundation' | 'golden_core' | 'nascent'
  | 'spirit' | 'void' | 'integration' | 'mahayana' | 'tribulation';

export interface CultivationState {
  realm: CultivationRealm;
  maxLifespan: number;
  tribulationThreshold: number;
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
  remainingAttributePoints: number;
  hiddenTags: string[];
  npcs: NPC[];
  choiceHistory: ChoiceRecord[];
  lifeRecords: LifeRecord[];

  // 卡牌/遗物
  deck: LifeCard[];
  relics: LifeRelic[];
  gold: number;

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

export {};
