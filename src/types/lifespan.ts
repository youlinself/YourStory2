// ==========================================
// 寿命延长系统 - 类型定义
// ==========================================

// ==========================================
// 炼丹系统
// ==========================================

export type PillRarity = 'mortal' | 'earth' | 'heaven' | 'immortal';
export type PillGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface HerbMaterial {
  id: string;
  name: string;
  rarity: PillRarity;
  description: string;
  icon: string;
  lifespan: number;
  foundInRealm: string[];
  quantity: number;
}

export interface PillFormula {
  id: string;
  name: string;
  rarity: PillRarity;
  grade: PillGrade;
  description: string;
  icon: string;
  requiredMaterials: { herbId: string; count: number }[];
  requiredAlchemyLevel: number;
  lifespanExtension: number;
  sideEffect?: { attribute: string; value: number };
  successRate: number;
  isDiscovered: boolean;
}

export interface AlchemyState {
  level: number;
  exp: number;
  expToNext: number;
  masteredFormulas: string[];
  craftingHistory: CraftedPill[];
  furnaceTier: number;
}

export interface CraftedPill {
  formulaId: string;
  name: string;
  quality: 'low' | 'normal' | 'high' | 'perfect';
  lifespanExtension: number;
  craftedAt: number;
}

// ==========================================
// 养生功法系统
// ==========================================

export type TechniqueType = 'breathing' | 'meditation' | 'bodyTempering' | 'spiritual';
export type TechniqueTier = 'basic' | 'intermediate' | 'advanced' | 'supreme';

export interface LongevityTechnique {
  id: string;
  name: string;
  type: TechniqueType;
  tier: TechniqueTier;
  description: string;
  icon: string;
  maxLevel: number;
  currentLevel: number;
  lifespanBonusPerLevel: number;
  requiredRealm: string;
  cultivationCost: number;
  maintenanceCost: number;
  isLearned: boolean;
  isActive: boolean;
  learnRequirements: {
    gold?: number;
    herbs?: string[];
    karma?: number;
  };
}

// ==========================================
// 因果功德系统
// ==========================================

export type KarmaActionType = 'good' | 'evil' | 'neutral';

export interface KarmaAction {
  id: string;
  name: string;
  description: string;
  type: KarmaActionType;
  karmaChange: number;
  lifespanChange: number;
  attributeChanges: Record<string, number>;
  icon: string;
  availableAtAge: number;
  cooldown: number;
}

export interface KarmaState {
  totalKarma: number;
  goodDeeds: number;
  evilDeeds: number;
  karmaLevel: string;
  accumulatedMerit: number;
  lifespanFromKarma: number;
  availableActions: string[];
  actionCooldowns: Record<string, number>;
}

// ==========================================
// 血脉觉醒系统
// ==========================================

export type BloodlineType = 'dragon' | 'phoenix' | 'turtle' | 'tiger' | 'void' | 'celestial';

export interface BloodlineAbility {
  id: string;
  name: string;
  description: string;
  unlockAtPurity: number;
  effect: {
    type: 'lifespan' | 'attribute' | 'combat';
    value: number;
    attribute?: string;
  };
  isActive: boolean;
}

export interface BloodlineState {
  type: BloodlineType | null;
  name: string;
  purity: number;
  maxPurity: number;
  awakeningLevel: number;
  abilities: BloodlineAbility[];
  isInherited: boolean;
  parentBloodline: BloodlineType | null;
  lifespanBonus: number;
}

// ==========================================
// 洞天福地系统
// ============================================

export interface SanctuaryUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: {
    type: 'lifespan_regen' | 'herb_growth' | 'cultivation_speed';
    value: number;
  };
  isPurchased: boolean;
  requiredUpgrade?: string;
}

export interface SanctuaryState {
  level: number;
  name: string;
  spiritualEnergy: number;
  maxSpiritualEnergy: number;
  lifespanRegenPerYear: number;
  herbGrowthRate: number;
  cultivationSpeedBonus: number;
  upgrades: SanctuaryUpgrade[];
  isEstablished: boolean;
}

// ==========================================
// 延寿宝物系统
// ============================================

export interface LifespanTreasure {
  id: string;
  name: string;
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  description: string;
  icon: string;
  lifespanExtension: number;
  activationAge: number;
  isActivated: boolean;
  activationRequirements: {
    realm?: string;
    karma?: number;
    herbs?: string[];
    gold?: number;
  };
  specialEffect?: string;
}

// ==========================================
// 综合寿命状态
// ==========================================

export interface LifespanExtensionState {
  baseLifespan: number;
  currentLifespan: number;
  totalExtensions: number;
  extensionsBySource: {
    alchemy: number;
    techniques: number;
    karma: number;
    bloodline: number;
    sanctuary: number;
    treasures: number;
  };
  alchemy: AlchemyState;
  techniques: LongevityTechnique[];
  karma: KarmaState;
  bloodline: BloodlineState;
  sanctuary: SanctuaryState;
  treasures: LifespanTreasure[];
  lifespanHistory: LifespanRecord[];
}

export interface LifespanRecord {
  age: number;
  previousLifespan: number;
  newLifespan: number;
  source: string;
  detail: string;
  timestamp: number;
}

// ==========================================
// 延寿事件
// ============================================

export interface LifespanEvent {
  id: string;
  title: string;
  description: string;
  ageRange: [number, number];
  type: 'alchemy' | 'technique' | 'karma' | 'bloodline' | 'sanctuary' | 'treasure';
  triggerCondition: (state: LifespanExtensionState, gameAge: number) => boolean;
  options: LifespanEventOption[];
}

export interface LifespanEventOption {
  id: string;
  text: string;
  description: string;
  icon: string;
  requirements?: {
    gold?: number;
    herbs?: string[];
    karma?: number;
    realm?: string;
  };
  outcome: {
    success: {
      lifespanGain: number;
      description: string;
      effects?: Record<string, number>;
    };
    failure: {
      lifespanLoss: number;
      description: string;
    };
  };
  successRate: number;
}
