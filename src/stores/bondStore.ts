import { create } from 'zustand';
import { generateId } from '../utils';
import type {
  NPCBond,
  BondSystemState,
  BondGroupDefinition,
  IdentityDefinition,
} from '../types/bond';
import type { PlayerAttributes, LifeCard, LifeRelic } from '../types/simulation';
import {
  IDENTITY_MAP,
  BOND_GROUPS,
  getAvailableIdentities,
} from '../data/bondData';

// ==========================================
// NPC名字库
// ==========================================

const NPC_NAMES: Record<string, string[]> = {
  father: ['建国', '志强', '明远', '德昌', '文斌', '国强', '建平', '学军'],
  mother: ['秀兰', '桂英', '玉兰', '淑芬', '秀英', '丽娟', '敏芳', '慧珍'],
  elder_brother: ['志强', '志伟', '明志', '远航', '宏伟', '鹏飞', '俊杰', '浩然'],
  elder_sister: ['秀珍', '丽萍', '玉兰', '美玲', '晓燕', '婷婷', '雪梅', '红梅'],
  younger_brother: ['志远', '明辉', '宇轩', '子豪', '天佑', '文博', '瑞祥', '嘉诚'],
  younger_sister: ['小雨', '梦琪', '诗涵', '佳怡', '欣妍', '雅静', '雪莹', '慧敏'],
  grandfather: ['德厚', '永昌', '仁厚', '义长', '礼忠', '信达', '福田', '根深'],
  grandmother: ['王淑', '李芳', '张秀', '刘英', '陈兰', '杨翠', '赵梅', '周莲'],
  spouse: ['志强', '明远', '宇轩', '子豪', '秀兰', '丽娟', '敏芳', '慧珍'],
  child: ['梓涵', '一诺', '浩宇', '欣怡', '梦瑶', '诗涵', '子墨', '雨桐'],
  childhood_friend: ['小明', '小刚', '小强', '小华', '小军', '小伟', '小杰', '小峰'],
  good_friend: ['阿强', '阿明', '阿华', '阿军', '阿伟', '阿杰', '阿峰', '阿鹏'],
  best_friend: ['铁子', '老铁', '兄弟', '哥们', '挚友', '知己', '莫逆', '至交'],
  neighbor: ['老张', '老李', '老王', '老赵', '老陈', '老刘', '老杨', '老周'],
  elementary_classmate: ['小红', '小芳', '小丽', '小娟', '小霞', '小玲', '小燕', '小敏'],
  middle_classmate: ['晓东', '晓峰', '志晓', '明晓', '建晓', '文晓', '德晓', '学晓'],
  high_classmate: ['文博', '学雅', '思远', '怀瑾', '书涵', '墨轩', '彦博', '哲瀚'],
  college_classmate: ['子墨', '梓涵', '一诺', '浩宇', '欣怡', '梦瑶', '诗涵', '雨桐'],
  teacher: ['张老师', '李老师', '王老师', '赵老师', '陈老师', '刘老师', '杨老师', '周老师'],
  mentor: ['陈教授', '李教授', '王教授', '张教授', '刘教授', '赵教授', '周教授', '吴教授'],
  colleague: ['小张', '小李', '小王', '小赵', '小陈', '小刘', '小杨', '小周'],
  boss: ['王总', '李总', '张总', '赵总', '陈总', '刘总', '杨总', '周总'],
  partner: ['合伙人A', '合伙人B', '合伙人C', '老搭档', '老伙伴', '老战友'],
  rival: ['对手A', '对手B', '对手C', '竞争者', '挑战者', '宿敌'],
  first_love: ['初恋', '那个TA', '青春', '回忆', '心动', '美好'],
  lover: ['爱人', '挚爱', '伴侣', '心上人', '另一半', '灵魂伴侣'],
};

const NPC_TRAITS: Record<string, string[]> = {
  father: ['严厉', '慈爱', '沉默寡言', '勤劳', '正直', '严厉但温暖', '传统', '开明'],
  mother: ['温柔', '勤劳', '慈爱', '节俭', '善良', '坚强', '细心', '包容'],
  elder_brother: ['保护欲强', '有担当', '沉稳', '可靠', '严厉', '幽默', '内敛', '坚强'],
  elder_sister: ['温柔', '体贴', '细心', '聪慧', '独立', '善解人意', '优雅', '大方'],
  younger_brother: ['活泼', '调皮', '机灵', '依赖', '崇拜', '好动', '聪明', '可爱'],
  younger_sister: ['可爱', '活泼', '依赖', '乖巧', '聪明', '温柔', '善良', '体贴'],
  grandfather: ['慈祥', '智慧', '传统', '和蔼', '有故事', '慢条斯理', '见多识广', '淡泊'],
  grandmother: ['慈祥', '和蔼', '勤劳', '节俭', '温暖', '细心', '有爱心', '传统'],
  spouse: ['温柔', '体贴', '善解人意', '坚强', '独立', '聪慧', '幽默', '包容'],
  child: ['可爱', '活泼', '聪明', '调皮', '乖巧', '懂事', '有天赋', '好奇'],
  childhood_friend: ['忠诚', '讲义气', '幽默', '调皮', '可靠', '直率', '热情', '真诚'],
  good_friend: ['真诚', '可靠', '幽默', '义气', '善解人意', '直率', '热情', '信任'],
  best_friend: ['生死与共', '绝对信任', '无条件支持', '默契', '灵魂伴侣', '知己', '挚友', '莫逆'],
  neighbor: ['热心', '八卦', '友善', '多事', '和蔼', '好帮忙', '多嘴', '亲切'],
  elementary_classmate: ['天真', '活泼', '调皮', '可爱', '单纯', '好动', '好奇', '热情'],
  middle_classmate: ['叛逆', '活泼', '好动', '好奇', '敏感', '热情', '直率', '冲动'],
  high_classmate: ['努力', '焦虑', '拼搏', '迷茫', '热血', '青春', '梦想', '奋斗'],
  college_classmate: ['自由', '独立', '迷茫', '探索', '成长', '友谊', '青春', '梦想'],
  teacher: ['严谨', '慈祥', '负责', '严格', '有耐心', '博学', '正直', '有智慧'],
  mentor: ['睿智', '博学', '严谨', '有远见', '严格', '慈祥', '有耐心', '有智慧'],
  colleague: ['专业', '合作', '竞争', '友好', '可靠', '有经验', '有野心', '踏实'],
  boss: ['严厉', '有远识', '苛刻', '公正', '有魄力', '精明', '有担当', '有野心'],
  partner: ['可靠', '有野心', '有远见', '信任', '合作', '有魄力', '有担当', '有智慧'],
  rival: ['强大', '狡猾', '有野心', '聪明', '有实力', '有魄力', '有远见', '有手段'],
  first_love: ['纯真', '美好', '青涩', '温柔', '难忘', '心动', '美好回忆', '青涩美好'],
  lover: ['温柔', '体贴', '善解人意', '坚强', '独立', '聪慧', '幽默', '包容'],
};

// ==========================================
// 工具函数
// ==========================================

function getRandomName(identityId: string): string {
  const names = NPC_NAMES[identityId] || ['某人'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomTraits(identityId: string): string[] {
  const traits = NPC_TRAITS[identityId] || ['普通'];
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...traits].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getAvatarByIdentity(identityId: string): string {
  const identity = IDENTITY_MAP[identityId];
  return identity?.icon || '👤';
}

// ==========================================
// 羁绊Store定义
// ==========================================

export interface BondStoreState extends BondSystemState {
  // NPC管理
  addNPC: (identityId: string, age: number, customName?: string) => NPCBond | null;
  removeNPC: (npcId: string) => void;
  updateRelationship: (npcId: string, delta: number) => void;
  setRelationship: (npcId: string, value: number) => void;
  getNPCById: (npcId: string) => NPCBond | undefined;
  getNPCsByIdentity: (identityId: string) => NPCBond[];
  getActiveNPCs: () => NPCBond[];

  // 羁绊组合
  checkBondGroups: () => BondGroupDefinition[];
  activateBondGroup: (groupId: string) => void;
  getBondGroupStatus: (groupId: string) => {
    isActive: boolean;
    currentTier: number;
    maxTier: number;
    progress: number;
    totalRelationship: number;
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
  initializeBondSystem: (age: number) => void;
  resetBondSystem: () => void;

  // 年龄触发
  onAgeUp: (age: number) => NPCBond[];
}

const initialBondState: BondSystemState = {
  npcs: [],
  activeBondGroups: [],
  activeBondTiers: {},
  claimedRewards: [],
  unlockedIdentities: [],
};

const useBondStore = create<BondStoreState>((set, get) => ({
  ...initialBondState,

  addNPC: (identityId, age, customName) => {
    const identity = IDENTITY_MAP[identityId];
    if (!identity) return null;

    const existing = get().getNPCsByIdentity(identityId);
    const maxCount = identity.maxCount || 1;
    if (existing.length >= maxCount) return null;

    const npc: NPCBond = {
      id: generateId(),
      name: customName || getRandomName(identityId),
      identityId,
      relationship: 10,
      isActive: false,
      activationThreshold: 30,
      metAge: age,
      isGone: false,
      traits: getRandomTraits(identityId),
      avatar: getAvatarByIdentity(identityId),
    };

    set((state) => ({
      npcs: [...state.npcs, npc],
      unlockedIdentities: state.unlockedIdentities.includes(identityId)
        ? state.unlockedIdentities
        : [...state.unlockedIdentities, identityId],
    }));

    return npc;
  },

  removeNPC: (npcId) => {
    set((state) => ({
      npcs: state.npcs.filter((n) => n.id !== npcId),
    }));
  },

  updateRelationship: (npcId, delta) => {
    set((state) => ({
      npcs: state.npcs.map((n) => {
        if (n.id !== npcId) return n;
        const newRelationship = Math.max(0, Math.min(100, n.relationship + delta));
        return {
          ...n,
          relationship: newRelationship,
          isActive: newRelationship >= n.activationThreshold,
        };
      }),
    }));
  },

  setRelationship: (npcId, value) => {
    set((state) => ({
      npcs: state.npcs.map((n) => {
        if (n.id !== npcId) return n;
        const clampedValue = Math.max(0, Math.min(100, value));
        return {
          ...n,
          relationship: clampedValue,
          isActive: clampedValue >= n.activationThreshold,
        };
      }),
    }));
  },

  getNPCById: (npcId) => {
    return get().npcs.find((n) => n.id === npcId);
  },

  getNPCsByIdentity: (identityId) => {
    return get().npcs.filter((n) => n.identityId === identityId);
  },

  getActiveNPCs: () => {
    return get().npcs.filter((n) => n.isActive && !n.isGone);
  },

  checkBondGroups: () => {
    const state = get();
    const activeNPCs = state.getActiveNPCs();
    const activeIdentityIds = activeNPCs.map((n) => n.identityId);

    return BOND_GROUPS.filter((group) => {
      if (group.requireAllActive) {
        return group.requiredIdentities.every((id) => activeIdentityIds.includes(id));
      }
      return group.requiredIdentities.some((id) => activeIdentityIds.includes(id));
    });
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

  getBondGroupStatus: (groupId) => {
    const state = get();
    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group) {
      return { isActive: false, currentTier: 0, maxTier: 0, progress: 0, totalRelationship: 0 };
    }

    const activeNPCs = state.getActiveNPCs();
    const activeIdentityIds = activeNPCs.map((n) => n.identityId);

    const isActive = group.requireAllActive
      ? group.requiredIdentities.every((id) => activeIdentityIds.includes(id))
      : group.requiredIdentities.some((id) => activeIdentityIds.includes(id));

    const relevantNPCs = state.npcs.filter((n) =>
      group.requiredIdentities.includes(n.identityId) && !n.isGone
    );
    const totalRelationship = relevantNPCs.reduce((sum, n) => sum + n.relationship, 0);

    const currentTier = state.activeBondTiers[groupId] || 0;
    const maxTier = group.tiers?.length || 1;

    let progress = 100;
    if (group.tiers && group.tiers.length > 0) {
      const nextTier = group.tiers.find((t) => t.tier > currentTier);
      if (nextTier) {
        progress = Math.min(100, (totalRelationship / nextTier.totalRelationshipRequired) * 100);
      }
    }

    return { isActive, currentTier, maxTier, progress, totalRelationship };
  },

  claimReward: (groupId, tier) => {
    const state = get();
    const rewardKey = `${groupId}_tier${tier}`;

    if (state.claimedRewards.includes(rewardKey)) return null;

    const group = BOND_GROUPS.find((g) => g.id === groupId);
    if (!group) return null;

    let reward;
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

  initializeBondSystem: (age) => {
    const availableIdentities = getAvailableIdentities(age);
    const newNPCs: NPCBond[] = [];

    const initialPool = availableIdentities.filter((i) => i.minAge === 0);

    const targetCount = 4 + Math.floor(Math.random() * 3);

    const shuffled = [...initialPool].sort(() => Math.random() - 0.5);
    const selectedTypes: IdentityDefinition[] = [];
    let totalSlots = 0;

    for (const identity of shuffled) {
      if (totalSlots >= targetCount) break;
      const slots = Math.min(identity.maxCount || 1, targetCount - totalSlots);
      for (let i = 0; i < slots; i++) {
        selectedTypes.push(identity);
      }
      totalSlots += slots;
    }

    for (const identity of selectedTypes) {
      newNPCs.push({
        id: generateId(),
        name: getRandomName(identity.id),
        identityId: identity.id,
        relationship: Math.floor(Math.random() * 31),
        isActive: false,
        activationThreshold: 30,
        metAge: 0,
        isGone: false,
        traits: getRandomTraits(identity.id),
        avatar: identity.icon,
      });
    }

    set({
      npcs: newNPCs,
      unlockedIdentities: newNPCs.map((n) => n.identityId),
    });
  },

  resetBondSystem: () => {
    set(initialBondState);
  },

  onAgeUp: (age) => {
    const state = get();
    const newNPCs: NPCBond[] = [];

    const availableIdentities = getAvailableIdentities(age);

    for (const identity of availableIdentities) {
      const existingNPCs = state.npcs.filter((n) => n.identityId === identity.id && !n.isGone);
      const maxCount = identity.maxCount || 1;

      if (existingNPCs.length < maxCount && age === identity.minAge) {
        if (Math.random() < 0.7) {
          const npc: NPCBond = {
            id: generateId(),
            name: getRandomName(identity.id),
            identityId: identity.id,
            relationship: 10,
            isActive: false,
            activationThreshold: 30,
            metAge: age,
            isGone: false,
            traits: getRandomTraits(identity.id),
            avatar: identity.icon,
          };
          newNPCs.push(npc);
        }
      }
    }

    if (newNPCs.length > 0) {
      set((s) => ({
        npcs: [...s.npcs, ...newNPCs],
        unlockedIdentities: [
          ...new Set([...s.unlockedIdentities, ...newNPCs.map((n) => n.identityId)]),
        ],
      }));
    }

    return newNPCs;
  },
}));

export default useBondStore;
