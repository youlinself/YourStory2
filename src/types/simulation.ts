// ==========================================
// 模拟人生 - 核心类型定义（年度决策版）
// ==========================================

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

export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type CardTarget = 'enemy' | 'self' | 'all' | 'none';

export interface CardEffect {
  type: 'damage' | 'block' | 'heal' | 'draw' | 'gain_energy' | 'gain_max_energy'
    | 'gain_attribute' | 'lose_attribute' | 'vulnerable' | 'weak' | 'poison'
    | 'cure' | 'shield' | 'thorns' | 'rage' | 'stealth' | 'lifedrain' | 'lifesteal'
    | 'regen' | 'strength' | 'dexterity';
  value: number;
  attribute?: keyof PlayerAttributes;
  duration?: number;
}

export type AgeRange = [number, number] | null; // null 表示全年龄段可用

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
  tags: string[];
  icon: string;
  ageRange?: AgeRange; // 年龄段限制，如 [0, 18] 表示0-18岁可用
  isCultivation?: boolean; // 是否为修仙专属
}

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss' | 'legendary';

export interface RelicEffect {
  type: 'max_health_bonus' | 'energy_bonus' | 'card_draw_bonus' | 'discount'
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

export type EnemyIntent =
  | { type: 'attack'; damage: number; hits?: number }
  | { type: 'defend'; block: number }
  | { type: 'buff'; effect: string; value: number }
  | { type: 'debuff'; effect: string; value: number }
  | { type: 'special'; name: string; description: string }
  | { type: 'idle' };

export interface StatusEffect {
  type: 'vulnerable' | 'weak' | 'poison' | 'block' | 'strength' | 'dexterity'
    | 'shields' | 'thorns' | 'rage' | 'regen' | 'artifact' | 'intangible';
  value: number;
  duration: number;
}

export type EnemyMechanic = 'double_attack' | 'shield' | 'regen' | 'rage' | 'summon';

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
  mechanics: EnemyMechanic[];
  ageRange?: AgeRange; // 年龄段限制
  isCultivation?: boolean; // 是否为修仙专属
}

export type OptionType =
  | 'combat'
  | 'elite'
  | 'event'
  | 'wonder'
  | 'rest'
  | 'shop'
  | 'boss';

export interface YearOption {
  id: string;
  type: OptionType;
  data?: {
    eventId?: string;
    enemyIds?: string[];
    relicId?: string;
    goldRange?: [number, number];
  };
}

export interface YearNode {
  year: number;
  eraIndex: number;
  isBossYear: boolean;
  options: YearOption[];
  selectedOptionId: string | null;
  isCompleted: boolean;
}

export interface EraMap {
  era: number;
  birthYear: number;
  years: YearNode[];
  currentYearIndex: number;
  completed: boolean;
}

export type CombatPhase = 'player_turn' | 'discard_selection' | 'enemy_turn' | 'victory' | 'defeat';

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
    attribute?: Partial<PlayerAttributes>;
    cards: LifeCard[];
    relic?: LifeRelic;
  };
  availableBonuses: CombatBonus[];
  log: CombatLogEntry[];
  selectedForDiscard: string[];
}

export interface CombatBonus {
  id: string;
  name: string;
  description: string;
  lifeCost: number;
  effect: 'draw' | 'damage_boost' | 'heal' | 'skip_enemy' | 'extra_energy';
  value: number;
}

export interface CombatLogEntry {
  turn: number;
  actor: 'player' | string;
  action: string;
  timestamp: number;
}

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
  ageRange?: AgeRange; // 年龄段限制
}

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

export type GamePhase =
  | 'setup' | 'allocating' | 'year_view' | 'event' | 'combat'
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

export interface AttributeThresholdBonus {
  attribute: keyof PlayerAttributes;
  threshold: number;
  name: string;
  description: string;
  effect: 'damage_boost' | 'extra_draw' | 'debuff_reduction' | 'max_health_bonus'
    | 'energy_bonus' | 'shop_discount' | 'start_block' | 'interrupt_chance';
  value: number;
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
  baseAttributes: PlayerAttributes;
  remainingAttributePoints: number;
  hiddenTags: string[];
  npcs: NPC[];
  choiceHistory: ChoiceRecord[];
  lifeRecords: LifeRecord[];
  deck: LifeCard[];
  relics: LifeRelic[];
  gold: number;
  combat: CombatState;
  currentMap: EraMap | null;
  shop: ShopState | null;
  cultivation: CultivationState | null;
  worldState: WorldState;
  seed: number;
  damageEventCounter: number;
  lastCombatEnemies: Enemy[];
}

export interface WorldState {
  industryEvolution: Record<string, number>;
  socialClimate: number;
  techProgress: number;
  customEvents: string[];
}

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

export {};
