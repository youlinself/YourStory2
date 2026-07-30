import type { Achievement, PlayerAttributes } from '../types/simulation';

const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  energy: 0, physique: 0, health: 0, iq: 0, eq: 0, wealth: 0, network: 0, fame: 0
};

export const ACHIEVEMENTS: Achievement[] = [
  // ========== 战斗类 ==========
  {
    id: 'first_blood',
    name: '初次胜利',
    description: '赢得第一场战斗',
    icon: '⚔️',
    category: 'combat',
    rarity: 'common',
    condition: (s) => s.totalCombatsWon >= 1,
    progress: (s) => s.totalCombatsWon,
    maxProgress: 1,
  },
  {
    id: 'warrior_10',
    name: '小有成就',
    description: '累计赢得10场战斗',
    icon: '🗡️',
    category: 'combat',
    rarity: 'common',
    condition: (s) => s.totalCombatsWon >= 10,
    progress: (s) => s.totalCombatsWon,
    maxProgress: 10,
  },
  {
    id: 'warrior_50',
    name: '战斗大师',
    description: '累计赢得50场战斗',
    icon: '🛡️',
    category: 'combat',
    rarity: 'rare',
    condition: (s) => s.totalCombatsWon >= 50,
    progress: (s) => s.totalCombatsWon,
    maxProgress: 50,
  },
  {
    id: 'warrior_100',
    name: '战场传说',
    description: '累计赢得100场战斗',
    icon: '👑',
    category: 'combat',
    rarity: 'epic',
    condition: (s) => s.totalCombatsWon >= 100,
    progress: (s) => s.totalCombatsWon,
    maxProgress: 100,
  },
  {
    id: 'boss_slayer',
    name: '屠龙者',
    description: '击败一个Boss',
    icon: '🐉',
    category: 'combat',
    rarity: 'rare',
    condition: (s) => s.bossesDefeated.length >= 1,
    progress: (s) => s.bossesDefeated.length,
    maxProgress: 1,
  },
  {
    id: 'boss_collector',
    name: 'Boss猎人',
    description: '击败5个不同的Boss',
    icon: '💀',
    category: 'combat',
    rarity: 'epic',
    condition: (s) => s.bossesDefeated.length >= 5,
    progress: (s) => s.bossesDefeated.length,
    maxProgress: 5,
  },

  // ========== 人生类 ==========
  {
    id: 'first_life',
    name: '初入人世',
    description: '完成第一次人生',
    icon: '🌱',
    category: 'life',
    rarity: 'common',
    condition: (s) => s.totalGamesPlayed >= 1,
    progress: (s) => s.totalGamesPlayed,
    maxProgress: 1,
  },
  {
    id: 'veteran_10',
    name: '轮回者',
    description: '累计完成10次人生',
    icon: '🔄',
    category: 'life',
    rarity: 'rare',
    condition: (s) => s.totalGamesPlayed >= 10,
    progress: (s) => s.totalGamesPlayed,
    maxProgress: 10,
  },
  {
    id: 'veteran_50',
    name: '人生百态',
    description: '累计完成50次人生',
    icon: '📚',
    category: 'life',
    rarity: 'epic',
    condition: (s) => s.totalGamesPlayed >= 50,
    progress: (s) => s.totalGamesPlayed,
    maxProgress: 50,
  },
  {
    id: 'live_to_50',
    name: '知天命',
    description: '单次人生活到50岁',
    icon: '🎂',
    category: 'life',
    rarity: 'common',
    condition: (s) => s.highestAge >= 50,
    progress: (s) => s.highestAge,
    maxProgress: 50,
  },
  {
    id: 'live_to_80',
    name: '杖朝之年',
    description: '单次人生活到80岁',
    icon: '🧓',
    category: 'life',
    rarity: 'rare',
    condition: (s) => s.highestAge >= 80,
    progress: (s) => s.highestAge,
    maxProgress: 80,
  },
  {
    id: 'live_to_100',
    name: '期颐之年',
    description: '单次人生活到100岁',
    icon: '🎊',
    category: 'life',
    rarity: 'epic',
    condition: (s) => s.highestAge >= 100,
    progress: (s) => s.highestAge,
    maxProgress: 100,
  },
  {
    id: 'centenarian_plus',
    name: '长寿传奇',
    description: '单次人生活到150岁',
    icon: '🏆',
    category: 'life',
    rarity: 'legendary',
    condition: (s) => s.highestAge >= 150,
    progress: (s) => s.highestAge,
    maxProgress: 150,
  },
  {
    id: 'event_master',
    name: '命运之子',
    description: '累计完成100个事件',
    icon: '📜',
    category: 'life',
    rarity: 'rare',
    condition: (s) => s.totalEventsCompleted >= 100,
    progress: (s) => s.totalEventsCompleted,
    maxProgress: 100,
  },
  {
    id: 'choice_maker',
    name: '抉择者',
    description: '累计做出200次选择',
    icon: '🤔',
    category: 'life',
    rarity: 'rare',
    condition: (s) => s.choicesMade >= 200,
    progress: (s) => s.choicesMade,
    maxProgress: 200,
  },

  // ========== 修仙类 ==========
  {
    id: 'first_breakthrough',
    name: '踏入仙途',
    description: '首次突破境界',
    icon: '☯️',
    category: 'cultivation',
    rarity: 'common',
    condition: (s) => s.totalBreakthroughs >= 1,
    progress: (s) => s.totalBreakthroughs,
    maxProgress: 1,
  },
  {
    id: 'foundation_builder',
    name: '筑基修士',
    description: '达到筑基境界',
    icon: '🔮',
    category: 'cultivation',
    rarity: 'rare',
    condition: (s) => s.cultivationRealmsReached.includes('foundation'),
  },
  {
    id: 'golden_core',
    name: '金丹大道',
    description: '达到金丹境界',
    icon: '🌟',
    category: 'cultivation',
    rarity: 'epic',
    condition: (s) => s.cultivationRealmsReached.includes('golden_core'),
  },
  {
    id: 'nascent_soul',
    name: '元婴老怪',
    description: '达到元婴境界',
    icon: '👶',
    category: 'cultivation',
    rarity: 'epic',
    condition: (s) => s.cultivationRealmsReached.includes('nascent'),
  },
  {
    id: 'immortal_ascension',
    name: '飞升成仙',
    description: '达到渡劫境界',
    icon: '🐲',
    category: 'cultivation',
    rarity: 'legendary',
    condition: (s) => s.cultivationRealmsReached.includes('tribulation'),
  },
  {
    id: 'breakthrough_10',
    name: '修炼狂魔',
    description: '累计突破10次境界',
    icon: '⚡',
    category: 'cultivation',
    rarity: 'epic',
    condition: (s) => s.totalBreakthroughs >= 10,
    progress: (s) => s.totalBreakthroughs,
    maxProgress: 10,
  },

  // ========== 收集类 ==========
  {
    id: 'card_collector_20',
    name: '卡牌新手',
    description: '累计收集20张卡牌',
    icon: '🃏',
    category: 'collection',
    rarity: 'common',
    condition: (s) => s.totalCardsCollected >= 20,
    progress: (s) => s.totalCardsCollected,
    maxProgress: 20,
  },
  {
    id: 'card_collector_50',
    name: '卡牌收藏家',
    description: '累计收集50张卡牌',
    icon: '🎴',
    category: 'collection',
    rarity: 'rare',
    condition: (s) => s.totalCardsCollected >= 50,
    progress: (s) => s.totalCardsCollected,
    maxProgress: 50,
  },
  {
    id: 'card_collector_100',
    name: '卡牌大师',
    description: '累计收集100张卡牌',
    icon: '🏅',
    category: 'collection',
    rarity: 'epic',
    condition: (s) => s.totalCardsCollected >= 100,
    progress: (s) => s.totalCardsCollected,
    maxProgress: 100,
  },
  {
    id: 'relic_hunter_10',
    name: '遗物猎人',
    description: '累计收集10件遗物',
    icon: '🏺',
    category: 'collection',
    rarity: 'rare',
    condition: (s) => s.totalRelicsCollected >= 10,
    progress: (s) => s.totalRelicsCollected,
    maxProgress: 10,
  },
  {
    id: 'relic_hunter_30',
    name: '遗物收藏家',
    description: '累计收集30件遗物',
    icon: '💎',
    category: 'collection',
    rarity: 'epic',
    condition: (s) => s.totalRelicsCollected >= 30,
    progress: (s) => s.totalRelicsCollected,
    maxProgress: 30,
  },
  {
    id: 'gold_1000',
    name: '小富翁',
    description: '累计获得1000金币',
    icon: '💰',
    category: 'collection',
    rarity: 'common',
    condition: (s) => s.totalGoldEarned >= 1000,
    progress: (s) => s.totalGoldEarned,
    maxProgress: 1000,
  },
  {
    id: 'gold_10000',
    name: '富甲一方',
    description: '累计获得10000金币',
    icon: '🤑',
    category: 'collection',
    rarity: 'epic',
    condition: (s) => s.totalGoldEarned >= 10000,
    progress: (s) => s.totalGoldEarned,
    maxProgress: 10000,
  },

  // ========== 特殊类 ==========
  {
    id: 'max_attribute',
    name: '天赋异禀',
    description: '任意属性达到100',
    icon: '✨',
    category: 'special',
    rarity: 'epic',
    condition: (s) => Object.values(s.highestAttributes).some(v => v >= 100),
  },
  {
    id: 'all_attributes_50',
    name: '全面发展',
    description: '所有属性均达到50以上',
    icon: '📊',
    category: 'special',
    rarity: 'rare',
    condition: (s) => Object.values(s.highestAttributes).every(v => v >= 50),
  },
  {
    id: 'tag_collector_10',
    name: '标签达人',
    description: '累计解锁10个标签',
    icon: '🏷️',
    category: 'special',
    rarity: 'rare',
    condition: (s) => s.tagsUnlocked.length >= 10,
    progress: (s) => s.tagsUnlocked.length,
    maxProgress: 10,
  },
  {
    id: 'social_butterfly',
    name: '社交达人',
    description: '累计与5个NPC建立关系',
    icon: '🦋',
    category: 'special',
    rarity: 'common',
    condition: (s) => s.npcRelationships >= 5,
    progress: (s) => s.npcRelationships,
    maxProgress: 5,
  },
  {
    id: 'perfect_life',
    name: '圆满人生',
    description: '单次人生活到寿命上限且属性全满',
    icon: '🌈',
    category: 'special',
    rarity: 'legendary',
    condition: (s) => {
      const gs = s.currentGameState;
      if (!gs) return false;
      return gs.age >= gs.maxLifespan - 1 && Object.values(gs.attributes).every(v => v >= 90);
    },
    hidden: true,
  },
  {
    id: 'speedrun',
    name: '速战速决',
    description: '在5次人生内击败Boss',
    icon: '⏱️',
    category: 'special',
    rarity: 'rare',
    condition: (s) => s.bossesDefeated.length >= 1 && s.totalGamesPlayed <= 5,
    hidden: true,
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsByCategory = (category: string): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '#6B7280';
    case 'rare': return '#3B82F6';
    case 'epic': return '#8B5CF6';
    case 'legendary': return '#F59E0B';
    default: return '#6B7280';
  }
};

export const getCategoryName = (category: string): string => {
  switch (category) {
    case 'combat': return '战斗';
    case 'life': return '人生';
    case 'cultivation': return '修仙';
    case 'collection': return '收集';
    case 'special': return '特殊';
    default: return category;
  }
};

export const getRarityName = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    default: return rarity;
  }
};

export { DEFAULT_ATTRIBUTES };
