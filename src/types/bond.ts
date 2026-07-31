import type { PlayerAttributes, LifeCard, LifeRelic } from './simulation';

// ==========================================
// 羁绊卡牌系统 - 核心类型定义
// ==========================================

/** 身份分类 */
export type IdentityCategory =
  | 'family'      // 家人
  | 'friendship'  // 友谊
  | 'education'   // 学业
  | 'career'      // 事业
  | 'romance'     // 爱情
  | 'rival';      // 对手

/** 卡牌稀有度 */
export type BondRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** 羁绊卡牌定义 */
export interface BondCardDefinition {
  id: string;
  name: string;
  category: IdentityCategory;
  icon: string;
  rarity: BondRarity;
  description: string;
  flavorText: string;
  minAge: number;
  maxAge?: number;
  appearWeight: number;
  isRare?: boolean;
}

/** 玩家拥有的卡牌实例 */
export interface BondCardInstance {
  instanceId: string;
  cardDefId: string;
  obtainedYear: number;
  isDuplicate: boolean;
  starLevel: 1 | 2 | 3;
}

/** 抽卡记录 */
export interface DrawRecord {
  year: number;
  drawnCards: string[];
  selectedCardId: string;
  discardedCards: string[];
}

/** 当前抽卡状态 */
export interface CurrentDrawState {
  year: number;
  cards: BondCardDefinition[];
  isSelecting: boolean;
}

/** 羁绊奖励类型 */
export type BondRewardType =
  | 'attribute'
  | 'card'
  | 'relic'
  | 'passive';

/** 羁绊奖励定义 */
export interface BondReward {
  type: BondRewardType;
  attributeBonus?: Partial<PlayerAttributes>;
  cardReward?: LifeCard;
  relicReward?: LifeRelic;
  passiveDescription?: string;
  passiveId?: string;
}

/** 羁绊等级 */
export interface BondGroupTier {
  tier: number;
  name: string;
  description: string;
  duplicateCardsRequired: number;
  rewards: BondReward[];
}

/** 羁绊组合定义 */
export interface BondGroupDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredCards: string[];
  requireAll: boolean;
  rewards: BondReward[];
  tiers?: BondGroupTier[];
  isHidden?: boolean;
}

/** 羁绊系统状态 */
export interface BondSystemState {
  collection: BondCardInstance[];
  drawHistory: DrawRecord[];
  currentDraw: CurrentDrawState | null;
  activeBondGroups: string[];
  activeBondTiers: Record<string, number>;
  claimedRewards: string[];
  drawChances: number;
}

/** 收集统计 */
export interface CollectionStats {
  total: number;
  unique: number;
  byRarity: Record<BondRarity, number>;
  completionRate: number;
}
