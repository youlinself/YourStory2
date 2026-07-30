import type { PlayerAttributes, LifeCard, LifeRelic } from './simulation';

// ==========================================
// NPC身份与羁绊系统 - 核心类型定义
// ==========================================

/** 身份分类 */
export type IdentityCategory =
  | 'family'      // 家人
  | 'friendship'  // 友谊
  | 'education'   // 学业
  | 'career'      // 事业
  | 'romance'     // 爱情
  | 'rival';      // 对手

/** 身份定义 */
export interface IdentityDefinition {
  id: string;
  name: string;
  category: IdentityCategory;
  icon: string;
  description: string;
  /** 该身份最早出现的年龄 */
  minAge: number;
  /** 该身份最晚消失的年龄（可选） */
  maxAge?: number;
  /** 是否为稀有身份 */
  isRare?: boolean;
  /** 该身份可拥有的最大数量（默认1） */
  maxCount?: number;
}

/** NPC实例 */
export interface NPCBond {
  id: string;
  name: string;
  identityId: string;
  /** 关系值 0-100 */
  relationship: number;
  /** 是否已激活（关系值达到阈值） */
  isActive: boolean;
  /** 激活阈值 */
  activationThreshold: number;
  /** 相遇年龄 */
  metAge: number;
  /** 是否已死亡/离开 */
  isGone: boolean;
  /** 个人特质标签 */
  traits: string[];
  /** 头像图标 */
  avatar: string;
}

/** 羁绊奖励类型 */
export type BondRewardType =
  | 'attribute'    // 属性加成
  | 'card'         // 特殊卡牌
  | 'relic'        // 遗物
  | 'passive';     // 被动效果

/** 羁绊奖励定义 */
export interface BondReward {
  type: BondRewardType;
  /** 属性加成 */
  attributeBonus?: Partial<PlayerAttributes>;
  /** 卡牌奖励 */
  cardReward?: LifeCard;
  /** 遗物奖励 */
  relicReward?: LifeRelic;
  /** 被动效果描述 */
  passiveDescription?: string;
  /** 被动效果ID */
  passiveId?: string;
}

/** 羁绊组合定义 */
export interface BondGroupDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 需要的身份ID列表 */
  requiredIdentities: string[];
  /** 是否需要所有身份都激活 */
  requireAllActive: boolean;
  /** 奖励列表 */
  rewards: BondReward[];
  /** 羁绊等级（可升级） */
  tiers?: BondGroupTier[];
  /** 是否为隐藏羁绊 */
  isHidden?: boolean;
}

/** 羁绊等级 */
export interface BondGroupTier {
  tier: number;
  name: string;
  description: string;
  /** 需要的最低总关系值 */
  totalRelationshipRequired: number;
  rewards: BondReward[];
}

/** 羁绊系统状态 */
export interface BondSystemState {
  /** 所有NPC */
  npcs: NPCBond[];
  /** 已激活的羁绊组合ID */
  activeBondGroups: string[];
  /** 已激活的羁绊等级 {groupId: tier} */
  activeBondTiers: Record<string, number>;
  /** 已领取的奖励记录 */
  claimedRewards: string[];
  /** 身份解锁进度 */
  unlockedIdentities: string[];
}

/** 羁绊事件 */
export interface BondEvent {
  id: string;
  npcId: string;
  title: string;
  description: string;
  options: BondEventOption[];
  /** 触发年龄范围 */
  ageRange?: [number, number];
  /** 触发条件 */
  triggerCondition?: (state: BondSystemState) => boolean;
}

/** 羁绊事件选项 */
export interface BondEventOption {
  id: string;
  text: string;
  /** 关系值变化 */
  relationshipChange: number;
  /** 属性变化 */
  attributeChanges?: Partial<PlayerAttributes>;
  /** 特殊效果 */
  specialEffect?: string;
}
