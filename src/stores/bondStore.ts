import { create } from 'zustand';
import { generateId } from '../utils';
import type {
  BondCardDefinition,
  BondCardInstance,
  BondGroupDefinition,
  BondReward,
  BondSystemState,
  CollectionStats,
  BondRarity,
} from '../types/bond';
import type { PlayerAttributes, LifeCard, LifeRelic } from '../types/simulation';
import {
  BOND_CARD_MAP,
  BOND_GROUPS,
  getAvailableCardsIncludingAI,
  getAllBondCardsIncludingAI,
  getAIGeneratedBondCards,
  weightedRandomSelect,
} from '../data/bondCards';

const AI_BOND_CARD_MAP: Record<string, BondCardDefinition> = Object.fromEntries(getAIGeneratedBondCards().map((c) => [c.id, c]));

// ==========================================
// 羁绊Store定义
// ==========================================

export interface BondStoreState extends BondSystemState {
  // 抽卡操作
  performYearDraw: (year: number) => boolean;
  selectCard: (cardDefId: string) => void;
  cancelDraw: () => void;
  addDrawChance: () => void;
  getDrawChances: () => number;

  // 查询
  getCollectionCard: (cardDefId: string) => BondCardInstance | undefined;
  getDuplicateCount: (cardDefId: string) => number;
  getTotalDuplicateCount: () => number;
  getCollectedCardIds: () => string[];
  getCollectionStats: () => CollectionStats;
  getCardStarCounts: (cardDefId: string) => { 1: number; 2: number; 3: number };
  getBestStarLevel: (cardDefId: string) => 1 | 2 | 3;
  canUpgradeCardStar: (cardDefId: string, fromStar: 1 | 2) => boolean;
  upgradeCardStar: (cardDefId: string, fromStar: 1 | 2) => boolean;

  // 羁绊组合
  checkBondGroups: () => BondGroupDefinition[];
  canActivateBondGroup: (groupId: string) => boolean;
  activateBondGroup: (groupId: string) => void;
  canUpgradeTier: (groupId: string) => boolean;
  upgradeTier: (groupId: string) => void;
  getBondGroupStatus: (groupId: string) => {
    isActive: boolean;
    currentTier: number;
    maxTier: number;
    collectedCount: number;
    requiredCount: number;
    duplicateCount: number;
    nextTierDuplicateRequired: number;
  };

  // 奖励
  claimReward: (groupId: string, tier: number) => {
    attributeBonus?: Partial<PlayerAttributes>;
    cardReward?: LifeCard;
    relicReward?: LifeRelic;
    passiveId?: string;
    passiveDescription?: string;
  } | null;
  isRewardClaimed: (rewardKey: string) => boolean;

  // 计算总加成
  getTotalAttributeBonus: () => Partial<PlayerAttributes>;
  getTotalPassiveEffects: () => { id: string; description: string }[];

  // 初始化
  resetBondSystem: () => void;
}

const initialBondState: BondSystemState = {
  collection: [],
  drawHistory: [],
  currentDraw: null,
  activeBondGroups: [],
  activeBondTiers: {},
  claimedRewards: [],
  drawChances: 0,
};

const useBondStore = create<BondStoreState>((set, get) => ({
  ...initialBondState,

  // ==========================================
  // 抽卡操作
  // ==========================================

  performYearDraw: (year) => {
    const state = get();
    if (state.drawChances <= 0) return false;
    if (state.currentDraw?.isSelecting) return false;

    const availableCards = getAvailableCardsIncludingAI(year);
    const drawnCards = weightedRandomSelect(availableCards, 5);

    set({
      currentDraw: {
        year,
        cards: drawnCards,
        isSelecting: true,
      },
      drawChances: state.drawChances - 1,
    });

    return true;
  },

  addDrawChance: () => {
    set((s) => ({ drawChances: s.drawChances + 1 }));
  },

  getDrawChances: () => {
    return get().drawChances;
  },

  selectCard: (cardDefId) => {
    const state = get();
    if (!state.currentDraw || !state.currentDraw.isSelecting) return;

    const isDuplicate = state.collection.some((c) => c.cardDefId === cardDefId);

    const newInstance: BondCardInstance = {
      instanceId: generateId(),
      cardDefId,
      obtainedYear: state.currentDraw.year,
      isDuplicate,
      starLevel: 1,
    };

    const record = {
      year: state.currentDraw.year,
      drawnCards: state.currentDraw.cards.map((c) => c.id),
      selectedCardId: cardDefId,
      discardedCards: state.currentDraw.cards
        .filter((c) => c.id !== cardDefId)
        .map((c) => c.id),
    };

    set((s) => ({
      collection: [...s.collection, newInstance],
      drawHistory: [...s.drawHistory, record],
      currentDraw: null,
    }));
  },

  cancelDraw: () => {
    set({ currentDraw: null });
  },

  // ==========================================
  // 查询
  // ==========================================

  getCollectionCard: (cardDefId) => {
    return get().collection.find((c) => c.cardDefId === cardDefId);
  },

  getDuplicateCount: (cardDefId) => {
    return get().collection.filter((c) => c.cardDefId === cardDefId).length;
  },

  getTotalDuplicateCount: () => {
    const state = get();
    const uniqueIds = new Set(state.collection.map((c) => c.cardDefId));
    return state.collection.length - uniqueIds.size;
  },

  getCollectedCardIds: () => {
    return [...new Set(get().collection.map((c) => c.cardDefId))];
  },

  getCollectionStats: () => {
    const state = get();
    const total = state.collection.length;
    const uniqueIds = new Set(state.collection.map((c) => c.cardDefId));
    const unique = uniqueIds.size;

    const byRarity: Record<BondRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
    };

    for (const cardId of uniqueIds) {
      const card = BOND_CARD_MAP[cardId] || AI_BOND_CARD_MAP[cardId];
      if (card) {
        byRarity[card.rarity]++;
      }
    }

    const totalCards = getAllBondCardsIncludingAI();
    const completionRate = totalCards.length > 0 ? unique / totalCards.length : 0;

    return { total, unique, byRarity, completionRate };
  },

  // ==========================================
  // 升星系统
  // ==========================================

  getCardStarCounts: (cardDefId) => {
    const state = get();
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const c of state.collection) {
      if (c.cardDefId === cardDefId) {
        counts[c.starLevel]++;
      }
    }
    return counts;
  },

  getBestStarLevel: (cardDefId) => {
    const state = get();
    let best: 1 | 2 | 3 = 1;
    for (const c of state.collection) {
      if (c.cardDefId === cardDefId && c.starLevel > best) {
        best = c.starLevel;
      }
    }
    return best;
  },

  canUpgradeCardStar: (cardDefId, fromStar) => {
    if (fromStar >= 3) return false;
    const state = get();
    const count = state.collection.filter(
      (c) => c.cardDefId === cardDefId && c.starLevel === fromStar
    ).length;
    return count >= 3;
  },

  upgradeCardStar: (cardDefId, fromStar) => {
    const state = get();
    if (fromStar >= 3) return false;

    const matchingCards = state.collection.filter(
      (c) => c.cardDefId === cardDefId && c.starLevel === fromStar
    );

    if (matchingCards.length < 3) return false;

    const cardsToRemove = matchingCards.slice(0, 3);
    const removeIds = new Set(cardsToRemove.map((c) => c.instanceId));

    const newCard: BondCardInstance = {
      instanceId: generateId(),
      cardDefId,
      obtainedYear: state.currentDraw?.year ?? 0,
      isDuplicate: false,
      starLevel: (fromStar + 1) as 1 | 2 | 3,
    };

    set((s) => ({
      collection: [
        ...s.collection.filter((c) => !removeIds.has(c.instanceId)),
        newCard,
      ],
    }));

    return true;
  },

  // ==========================================
  // 羁绊组合
  // ==========================================

  checkBondGroups: () => {
    const state = get();
    const collectedIds = state.getCollectedCardIds();

    return BOND_GROUPS.filter((group) => {
      if (group.requireAll) {
        return group.requiredCards.every((id) => collectedIds.includes(id));
      }
      return group.requiredCards.some((id) => collectedIds.includes(id));
    });
  },

  canActivateBondGroup: (groupId) => {
    const state = get();
    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;

    const collectedIds = state.getCollectedCardIds();

    if (group.requireAll) {
      return group.requiredCards.every((id) => collectedIds.includes(id));
    }
    return group.requiredCards.some((id) => collectedIds.includes(id));
  },

  activateBondGroup: (groupId) => {
    set((state) => {
      if (state.activeBondGroups.includes(groupId)) return state;
      return {
        ...state,
        activeBondGroups: [...state.activeBondGroups, groupId],
        activeBondTiers: {
          ...state.activeBondTiers,
          [groupId]: 1,
        },
      };
    });
  },

  canUpgradeTier: (groupId) => {
    const state = get();
    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group || !group.tiers) return false;

    const currentTier = state.activeBondTiers[groupId] || 0;
    const nextTier = group.tiers.find((t) => t.tier > currentTier);
    if (!nextTier) return false;

    const totalDuplicates = state.getTotalDuplicateCount();
    return totalDuplicates >= nextTier.duplicateCardsRequired;
  },

  upgradeTier: (groupId) => {
    const state = get();
    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group || !group.tiers) return;

    const currentTier = state.activeBondTiers[groupId] || 0;
    const nextTier = group.tiers.find((t) => t.tier > currentTier);
    if (!nextTier) return;

    const totalDuplicates = state.getTotalDuplicateCount();
    if (totalDuplicates < nextTier.duplicateCardsRequired) return;

    set((s) => ({
      activeBondTiers: {
        ...s.activeBondTiers,
        [groupId]: nextTier.tier,
      },
    }));
  },

  getBondGroupStatus: (groupId) => {
    const state = get();
    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group) {
      return {
        isActive: false,
        currentTier: 0,
        maxTier: 0,
        collectedCount: 0,
        requiredCount: 0,
        duplicateCount: 0,
        nextTierDuplicateRequired: 0,
      };
    }

    const collectedIds = state.getCollectedCardIds();

    const isActive = group.requireAll
      ? group.requiredCards.every((id) => collectedIds.includes(id))
      : group.requiredCards.some((id) => collectedIds.includes(id));

    const collectedCount = group.requiredCards.filter((id) => collectedIds.includes(id)).length;
    const requiredCount = group.requiredCards.length;

    const currentTier = state.activeBondTiers[groupId] || 0;
    const maxTier = group.tiers?.length || 1;

    const totalDuplicates = state.getTotalDuplicateCount();

    let nextTierDuplicateRequired = 0;
    if (group.tiers) {
      const nextTier = group.tiers.find((t) => t.tier > currentTier);
      if (nextTier) {
        nextTierDuplicateRequired = nextTier.duplicateCardsRequired;
      }
    }

    return {
      isActive,
      currentTier,
      maxTier,
      collectedCount,
      requiredCount,
      duplicateCount: totalDuplicates,
      nextTierDuplicateRequired,
    };
  },

  // ==========================================
  // 奖励
  // ==========================================

  claimReward: (groupId, tier) => {
    const state = get();
    const rewardKey = `${groupId}_tier${tier}`;

    if (state.claimedRewards.includes(rewardKey)) return null;

    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group) return null;

    let reward: BondReward | undefined;
    if (tier === 0 || !group.tiers) {
      reward = group.rewards[0];
    } else {
      const tierData = group.tiers.find((t) => t.tier === tier);
      reward = tierData?.rewards[0];
    }

    if (!reward) return null;

    set((s) => ({
      claimedRewards: [...s.claimedRewards, rewardKey],
      activeBondTiers: {
        ...s.activeBondTiers,
        [groupId]: Math.max(s.activeBondTiers[groupId] || 0, tier),
      },
    }));

    return {
      attributeBonus: reward.attributeBonus,
      cardReward: reward.cardReward,
      relicReward: reward.relicReward,
      passiveId: reward.passiveId,
      passiveDescription: reward.passiveDescription,
    };
  },

  isRewardClaimed: (rewardKey) => {
    return get().claimedRewards.includes(rewardKey);
  },

  // ==========================================
  // 计算总加成
  // ==========================================

  getTotalAttributeBonus: () => {
    const state = get();
    const bonus: Partial<PlayerAttributes> = {};

    for (const groupId of state.activeBondGroups) {
      const group = BOND_GROUPS.find((g) => g.id === groupId);
      if (!group) continue;

      const currentTier = state.activeBondTiers[groupId] || 0;

      for (const reward of group.rewards) {
        if (reward.attributeBonus && state.claimedRewards.includes(`${groupId}_tier0`)) {
          for (const [key, value] of Object.entries(reward.attributeBonus)) {
            bonus[key as keyof PlayerAttributes] = (bonus[key as keyof PlayerAttributes] || 0) + (value || 0);
          }
        }
      }

      if (group.tiers) {
        for (const tierData of group.tiers) {
          if (tierData.tier <= currentTier && state.claimedRewards.includes(`${groupId}_tier${tierData.tier}`)) {
            for (const reward of tierData.rewards) {
              if (reward.attributeBonus) {
                for (const [key, value] of Object.entries(reward.attributeBonus)) {
                  bonus[key as keyof PlayerAttributes] = (bonus[key as keyof PlayerAttributes] || 0) + (value || 0);
                }
              }
            }
          }
        }
      }
    }

    return bonus;
  },

  getTotalPassiveEffects: () => {
    const state = get();
    const effects: { id: string; description: string }[] = [];

    for (const groupId of state.activeBondGroups) {
      const group = BOND_GROUPS.find((g) => g.id === groupId);
      if (!group) continue;

      const currentTier = state.activeBondTiers[groupId] || 0;

      for (const reward of group.rewards) {
        if (reward.passiveId && reward.passiveDescription && state.claimedRewards.includes(`${groupId}_tier0`)) {
          effects.push({ id: reward.passiveId, description: reward.passiveDescription });
        }
      }

      if (group.tiers) {
        for (const tierData of group.tiers) {
          if (tierData.tier <= currentTier && state.claimedRewards.includes(`${groupId}_tier${tierData.tier}`)) {
            for (const reward of tierData.rewards) {
              if (reward.passiveId && reward.passiveDescription) {
                effects.push({ id: reward.passiveId, description: reward.passiveDescription });
              }
            }
          }
        }
      }
    }

    return effects;
  },

  // ==========================================
  // 初始化
  // ==========================================

  resetBondSystem: () => {
    set(initialBondState);
  },
}));

export default useBondStore;
