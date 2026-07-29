import type {
  EraDefinition,
  HiddenTag,
  LifeCard,
  LifeRelic,
  Enemy,
  CultivationRealm,
  GameEvent,
  EnemyMechanic,
  PlayerAttributes,
} from '../types/simulation';

// ==========================================
// 时代定义
// ==========================================
export const ERAS: EraDefinition[] = [
  {
    year: 1950,
    name: '萌芽纪元',
    baseLifeExpectancy: 70,
    description: '百废待兴的年代，到处都是机会，也充满了挑战。',
    initialWealthRange: [5, 25],
    initialNetworkRange: [10, 40],
    attributePoints: 30,
  },
  {
    year: 1960,
    name: '风云年代',
    baseLifeExpectancy: 72,
    description: '社会剧烈变革的十年，有人乘风破浪，有人随波逐流。',
    initialWealthRange: [5, 20],
    initialNetworkRange: [15, 45],
    attributePoints: 30,
  },
  {
    year: 1970,
    name: '转折前夜',
    baseLifeExpectancy: 75,
    description: '黎明前的黑暗即将过去，新时代的曙光即将到来。',
    initialWealthRange: [8, 25],
    initialNetworkRange: [15, 40],
    attributePoints: 32,
  },
  {
    year: 1980,
    name: '改革春风',
    baseLifeExpectancy: 77,
    description: '思想解放的浪潮席卷大地，到处都是创业的声音。',
    initialWealthRange: [10, 35],
    initialNetworkRange: [15, 50],
    attributePoints: 32,
  },
  {
    year: 1990,
    name: '下海浪潮',
    baseLifeExpectancy: 79,
    description: '体制变革带来巨大的机遇和风险，敢问路在何方。',
    initialWealthRange: [15, 45],
    initialNetworkRange: [20, 55],
    attributePoints: 34,
  },
  {
    year: 2000,
    name: '信息纪元',
    baseLifeExpectancy: 81,
    description: '互联网浪潮来临，世界开始连接，新的规则正在建立。',
    initialWealthRange: [20, 55],
    initialNetworkRange: [20, 60],
    attributePoints: 34,
  },
  {
    year: 2010,
    name: '移动互联',
    baseLifeExpectancy: 83,
    description: '智能手机普及，让每个人都能触摸到整个世界。',
    initialWealthRange: [25, 60],
    initialNetworkRange: [25, 65],
    attributePoints: 36,
  },
  {
    year: 2020,
    name: '智能纪元',
    baseLifeExpectancy: 85,
    description: 'AI、大数据、元宇宙...科技与生活的边界正在模糊。',
    initialWealthRange: [30, 65],
    initialNetworkRange: [30, 70],
    attributePoints: 36,
  },
  {
    year: 2030,
    name: '能源革命',
    baseLifeExpectancy: 88,
    description: '新能源技术突破，传统行业正在重新洗牌。',
    initialWealthRange: [35, 70],
    initialNetworkRange: [30, 75],
    attributePoints: 38,
  },
  {
    year: 2040,
    name: '星际黎明',
    baseLifeExpectancy: 92,
    description: '太空商业化起步，人类的视野投向星辰大海。',
    initialWealthRange: [40, 75],
    initialNetworkRange: [35, 80],
    attributePoints: 38,
  },
  {
    year: 2050,
    name: '共生时代',
    baseLifeExpectancy: 97,
    description: '人机融合成为常态，生命的定义正在被改写。',
    initialWealthRange: [45, 80],
    initialNetworkRange: [40, 85],
    attributePoints: 40,
  },
  {
    year: 2060,
    name: '深空纪元',
    baseLifeExpectancy: 105,
    description: '太阳系殖民成为现实，人类的脚步不再局限于地球。',
    initialWealthRange: [50, 85],
    initialNetworkRange: [45, 90],
    attributePoints: 42,
  },
  {
    year: 2070,
    name: '未知边疆',
    baseLifeExpectancy: 115,
    description: '没有人知道未来会怎样，因为未来由你来定义。',
    initialWealthRange: [55, 90],
    initialNetworkRange: [50, 95],
    attributePoints: 22,
  },
];

// ==========================================
// 隐藏标签
// ==========================================
export const HIDDEN_TAGS: HiddenTag[] = [
  {
    id: 'trendsetter',
    name: '弄潮儿',
    description: '你总是敢于在时代变革中第一个吃螃蟹',
    condition: (state) => state.choiceHistory.filter((c) => c.success).length >= 5 && state.attributes.wealth >= 70,
  },
  {
    id: 'steady_walker',
    name: '守望者',
    description: '你选择了稳健的道路，虽然不耀眼但走得长远',
    condition: (state) => state.remainingLife >= 40 && state.deck.length <= 15,
  },
  {
    id: 'wisdom_seeker',
    name: '求道者',
    description: '你对知识的追求超越了时代',
    condition: (state) => state.attributes.iq >= 80 && state.lifeRecords.length >= 6,
  },
  {
    id: 'social_master',
    name: '人脉之王',
    description: '你的关系网遍布各个领域',
    condition: (state) => state.attributes.network >= 85 && state.npcs.filter((n) => n.relationship > 60).length >= 3,
  },
  {
    id: 'hidden_dragon',
    name: '潜龙',
    description: '你不显山露水，但关键时刻总能一鸣惊人',
    condition: (state) => state.attributes.fame < 30 && state.attributes.wealth >= 60,
  },
  {
    id: 'life_enjoyer',
    name: '生活家',
    description: '你懂得在忙碌中享受生活的乐趣',
    condition: (state) => state.attributes.health >= 75 && state.attributes.energy >= 70,
  },
  {
    id: 'era_shaper',
    name: '时代塑造者',
    description: '你的选择在不知不觉间影响了时代走向',
    condition: (state) => state.worldState.customEvents.length >= 3,
  },
  {
    id: 'collector',
    name: '收藏家',
    description: '你收集了无数珍宝和知识',
    condition: (state) => state.relics.length >= 10,
  },
  {
    id: 'minimalist',
    name: '极简主义者',
    description: '你追求纯粹的卡组和人生',
    condition: (state) => state.deck.length <= 8 && state.currentEra >= 3,
  },
  {
    id: 'cultivator',
    name: '修真者',
    description: '你突破了凡人的极限',
    condition: (state) => state.cultivation !== null && state.cultivation.realm !== 'mortal',
  },
];

// ==========================================
// 卡牌数据库 - 贴合人生阶段
// ==========================================

// 通用攻击卡（所有时代可用）
export const COMMON_ATTACK_CARDS: LifeCard[] = [
  {
    id: 'strike',
    name: '日常努力',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    effects: [{ type: 'damage', value: 6 }],
    description: '普通的一击，持之以恒亦有力量',
    icon: '👊',
    tags: ['通用'],
    ageRange: null, // 全年龄段
  },
  {
    id: 'quick_action',
    name: '快速行动',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    target: 'enemy',
    effects: [{ type: 'damage', value: 3 }, { type: 'draw', value: 1 }],
    description: '速度即是力量，先发制人',
    icon: '⚡',
    tags: ['速度'],
    ageRange: null,
  },
  {
    id: 'focused_strike',
    name: '专注打击',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    effects: [{ type: 'damage', value: 8 }, { type: 'gain_energy', value: 1, duration: 1 }],
    description: '集中精力，一击必中',
    icon: '🎯',
    tags: ['专注'],
    ageRange: null,
  },
];

// 通用技能卡
export const COMMON_SKILL_CARDS: LifeCard[] = [
  {
    id: 'defend',
    name: '稳扎稳打',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 5 }],
    description: '先稳住阵脚，再图进取',
    icon: '🛡️',
    tags: ['防御'],
    ageRange: null,
  },
  {
    id: 'bandage',
    name: '自我疗愈',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 4 }],
    description: '给身体一些恢复的时间',
    icon: '🏥',
    tags: ['健康'],
    ageRange: null,
  },
  {
    id: 'plan_ahead',
    name: '提前规划',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'draw', value: 2 }],
    description: '好的计划让你事半功倍',
    icon: '📝',
    tags: ['策略'],
    ageRange: null,
  },
];

// 稀有卡
export const RARE_CARDS: LifeCard[] = [
  {
    id: 'investment',
    name: '投资理财',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_energy', value: 2 }, { type: 'draw', value: 1 }],
    description: '钱生钱，让财富为你工作',
    icon: '💰',
    tags: ['财富', '投资'],
    ageRange: [25, 65], // 成年后到退休前
  },
  {
    id: 'networking',
    name: '拓展人脉',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 3 }, { type: 'heal', value: 2 }, { type: 'draw', value: 1 }],
    description: '多个朋友多条路',
    icon: '🤝',
    tags: ['人脉'],
    ageRange: [18, 70],
  },
  {
    id: 'career_breakthrough',
    name: '事业突破',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'enemy',
    effects: [{ type: 'damage', value: 15 }, { type: 'gain_attribute', value: 2, attribute: 'wealth' }],
    description: '多年的积累终于迎来了收获',
    icon: '🚀',
    tags: ['事业'],
    ageRange: [28, 55],
  },
];

// 史诗/传说卡
export const LEGENDARY_CARDS: LifeCard[] = [
  {
    id: 'destiny_choice',
    name: '命运抉择',
    type: 'skill',
    rarity: 'legendary',
    cost: 1,
    target: 'self',
    effects: [
      {
        type: 'choice',
        value: 0,
        choices: [
          {
            id: 'energy',
            label: '+2 当前精力',
            description: '立即恢复2点精力',
            icon: '⚡',
            effects: [{ type: 'gain_energy', value: 2 }],
          },
          {
            id: 'max_energy',
            label: '+1 最大精力',
            description: '永久增加1点最大精力',
            icon: '🔋',
            effects: [{ type: 'gain_max_energy', value: 1 }],
          },
        ],
      },
    ],
    description: '在人生的十字路口，做出你的选择：+2当前精力 或 +1最大精力',
    icon: '💫',
    tags: ['命运'],
    ageRange: [18, 80], // 成年后可触发
  },
  {
    id: 'decade_mastery',
    name: '十年磨一剑',
    type: 'attack',
    rarity: 'legendary',
    cost: 3,
    target: 'enemy',
    effects: [{ type: 'damage', value: 30 }, { type: 'lifesteal', value: 0.5 }],
    description: '厚积薄发，一击致命',
    icon: '⚔️',
    tags: ['大成'],
    ageRange: [30, 80], // 需要一定积累
  },
];

// ==========================================
// 属性阶层卡牌 - 达到特定属性阶层时获得
// ==========================================

// 精力卡牌
export const ENERGY_TIER_CARDS: LifeCard[] = [
  {
    id: 'energy_tier1',
    name: '精力充沛',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    effects: [{ type: 'draw', value: 2 }],
    description: '精力旺盛，思维敏捷，抽2张牌',
    icon: '⚡',
    tags: ['精力'],
    ageRange: null,
  },
  {
    id: 'energy_tier3',
    name: '活力爆发',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_energy', value: 3 }],
    description: '精力充沛，获得3点精力',
    icon: '🔥',
    tags: ['精力'],
    ageRange: null,
  },
  {
    id: 'energy_tier5',
    name: '超凡入圣',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'gain_max_energy', value: 1 }],
    description: '精力超凡，最大精力+1（被动）',
    icon: '✨',
    tags: ['精力'],
    ageRange: null,
  },
];

// 体魄卡牌
export const PHYSIQUE_TIER_CARDS: LifeCard[] = [
  {
    id: 'physique_tier1',
    name: '强壮一击',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'enemy',
    effects: [{ type: 'damage', value: 12 }, { type: 'strength', value: 2, duration: Infinity }],
    description: '强壮的体魄让你打出有力一击，获得2点力量',
    icon: '💪',
    tags: ['体魄'],
    ageRange: null,
  },
  {
    id: 'physique_tier3',
    name: '威猛',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'block', value: 10 }, { type: 'strength', value: 3, duration: Infinity }],
    description: '威猛之姿，获得10点格挡和3点力量',
    icon: '🛡️',
    tags: ['体魄'],
    ageRange: null,
  },
  {
    id: 'physique_tier5',
    name: '勇猛',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'rage', value: 3, duration: Infinity }],
    description: '勇猛无畏，攻击卡伤害+30%（被动）',
    icon: '⚔️',
    tags: ['体魄'],
    ageRange: null,
  },
];

// 健康卡牌
export const HEALTH_TIER_CARDS: LifeCard[] = [
  {
    id: 'health_tier1',
    name: '生命恢复',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 6 }],
    description: '健康的身体让你快速恢复，回复6点生命',
    icon: '❤️',
    tags: ['健康'],
    ageRange: null,
  },
  {
    id: 'health_tier3',
    name: '坚韧',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'block', value: 12 }, { type: 'heal', value: 8 }],
    description: '坚韧不拔，获得12点格挡并回复8点生命',
    icon: '🏥',
    tags: ['健康'],
    ageRange: null,
  },
  {
    id: 'health_tier5',
    name: '钢铁之躯',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'regen', value: 2, duration: Infinity }],
    description: '钢铁之躯，每回合回复2点生命（被动）',
    icon: '🛡️',
    tags: ['健康'],
    ageRange: null,
  },
];

// 智商卡牌
export const IQ_TIER_CARDS: LifeCard[] = [
  {
    id: 'iq_tier1',
    name: '灵光一闪',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    effects: [{ type: 'draw', value: 3 }],
    description: '智商超群，灵感涌现，抽3张牌',
    icon: '🧠',
    tags: ['智商'],
    ageRange: null,
  },
  {
    id: 'iq_tier3',
    name: '聪颖',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'draw', value: 2 }, { type: 'gain_energy', value: 1 }],
    description: '聪颖过人，抽2张牌并获得1点精力',
    icon: '💡',
    tags: ['智商'],
    ageRange: null,
  },
  {
    id: 'iq_tier5',
    name: '睿智',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'gain_max_energy', value: 1 }],
    description: '睿智通达，最大精力+1（被动）',
    icon: '📚',
    tags: ['智商'],
    ageRange: null,
  },
];

// 情商卡牌
export const EQ_TIER_CARDS: LifeCard[] = [
  {
    id: 'eq_tier1',
    name: '友善',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 6 }, { type: 'cure', value: 1 }],
    description: '高情商让你化解冲突，获得6点格挡并移除1个负面效果',
    icon: '💬',
    tags: ['情商'],
    ageRange: null,
  },
  {
    id: 'eq_tier3',
    name: '亲和',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'block', value: 12 }, { type: 'cure', value: 99 }],
    description: '亲和力强，获得12点格挡并移除所有负面效果',
    icon: '🤝',
    tags: ['情商'],
    ageRange: null,
  },
  {
    id: 'eq_tier5',
    name: '沉稳',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'dexterity', value: 2, duration: Infinity }],
    description: '沉稳大气，每回合额外获得2点格挡（被动）',
    icon: '🧘',
    tags: ['情商'],
    ageRange: null,
  },
];

// 财富卡牌
export const WEALTH_TIER_CARDS: LifeCard[] = [
  {
    id: 'wealth_tier1',
    name: '小富',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    effects: [{ type: 'gain_energy', value: 1 }, { type: 'draw', value: 1 }],
    description: '小有财富，获得1点精力并抽1张牌',
    icon: '💰',
    tags: ['财富'],
    ageRange: null,
  },
  {
    id: 'wealth_tier3',
    name: '富贵',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_energy', value: 2 }, { type: 'draw', value: 1 }],
    description: '富贵逼人，获得2点精力并抽1张牌',
    icon: '💎',
    tags: ['财富'],
    ageRange: null,
  },
  {
    id: 'wealth_tier5',
    name: '豪富',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'gain_max_energy', value: 1 }],
    description: '豪富之家，最大精力+1（被动）',
    icon: '🏆',
    tags: ['财富'],
    ageRange: null,
  },
];

// 人脉卡牌
export const NETWORK_TIER_CARDS: LifeCard[] = [
  {
    id: 'network_tier1',
    name: '熟人',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 8 }],
    description: '人脉广泛，朋友相助，获得8点格挡',
    icon: '👥',
    tags: ['人脉'],
    ageRange: null,
  },
  {
    id: 'network_tier3',
    name: '人脉',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'block', value: 15 }, { type: 'draw', value: 1 }],
    description: '人脉亨通，获得15点格挡并抽1张牌',
    icon: '🌐',
    tags: ['人脉'],
    ageRange: null,
  },
  {
    id: 'network_tier5',
    name: '四通八达',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'shield', value: 10, duration: Infinity }],
    description: '四通八达，每回合开始获得10点护盾（被动）',
    icon: '🔗',
    tags: ['人脉'],
    ageRange: null,
  },
];

// 名望卡牌
export const FAME_TIER_CARDS: LifeCard[] = [
  {
    id: 'fame_tier1',
    name: '小有名气',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'enemy',
    effects: [{ type: 'damage', value: 10 }, { type: 'weak', value: 1, duration: 1 }],
    description: '名声在外，使敌人虚弱，造成10点伤害',
    icon: '⭐',
    tags: ['名望'],
    ageRange: null,
  },
  {
    id: 'fame_tier3',
    name: '威名',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'enemy',
    effects: [{ type: 'damage', value: 18 }, { type: 'vulnerable', value: 2, duration: 2 }],
    description: '威名远扬，使敌人脆弱，造成18点伤害',
    icon: '🌟',
    tags: ['名望'],
    ageRange: null,
  },
  {
    id: 'fame_tier5',
    name: '传奇',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'thorns', value: 3, duration: Infinity }],
    description: '传奇人物，攻击你的敌人受到3点反伤（被动）',
    icon: '👑',
    tags: ['名望'],
    ageRange: null,
  },
];

// 属性卡牌映射表
export const ATTRIBUTE_TIER_CARDS: Record<keyof PlayerAttributes, LifeCard[]> = {
  energy: ENERGY_TIER_CARDS,
  physique: PHYSIQUE_TIER_CARDS,
  health: HEALTH_TIER_CARDS,
  iq: IQ_TIER_CARDS,
  eq: EQ_TIER_CARDS,
  wealth: WEALTH_TIER_CARDS,
  network: NETWORK_TIER_CARDS,
  fame: FAME_TIER_CARDS,
};

// 修仙模式专属卡
export const CULTIVATION_CARDS: LifeCard[] = [
  {
    id: 'qi_absorption',
    name: '吐纳练气',
    type: 'power',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 2 }, { type: 'regen', value: 1, duration: Infinity }],
    description: '吸收天地灵气，强身健体',
    icon: '🌬️',
    tags: ['修仙', '炼气'],
  },
  {
    id: 'foundation_building',
    name: '筑基丹',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'shield', value: 20 }, { type: 'gain_max_energy', value: 1 }],
    description: '打下坚实的根基',
    icon: '💊',
    tags: ['修仙', '筑基'],
  },
{
    id: 'golden_core',
    name: '金丹大道',
    type: 'power',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [
      { type: 'shield', value: 15 },
      { type: 'rage', value: 3, duration: Infinity },
      { type: 'strength', value: 2, duration: Infinity },
    ],
    description: '结成金丹，实力大增',
    icon: '🔥',
    tags: ['修仙', '金丹'],
  },
  {
    id: 'tribulation_survive',
    name: '渡劫重生',
    type: 'skill',
    rarity: 'legendary',
    cost: 0,
    target: 'self',
    effects: [
      { type: 'heal', value: 50 },
      { type: 'cure', value: 99 },
      { type: 'thorns', value: 5, duration: Infinity },
    ],
    description: '天劫淬洗，涅槃重生',
    icon: '🌩️',
    tags: ['修仙', '渡劫'],
  },
];

// 年龄阶段卡
export const AGE_SPECIFIC_CARDS: Record<number, LifeCard[]> = [
  // 0-9岁 - 童年
  [
    {
      id: 'childhood_curiosity',
      name: '童年好奇',
      type: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'self',
      effects: [{ type: 'draw', value: 1 }, { type: 'gain_attribute', value: 1, attribute: 'iq' }],
      description: '童年的每一次好奇都在塑造大脑',
      icon: '🧒',
      tags: ['童年', '学习'],
      ageRange: [0, 9],
    },
  ],
  // 10-19岁 - 少年
  [
    {
      id: 'study_session',
      name: '寒窗苦读',
      type: 'skill',
      rarity: 'common',
      cost: 1,
      target: 'self',
      effects: [{ type: 'draw', value: 2 }, { type: 'gain_attribute', value: 1, attribute: 'iq' }],
      description: '知识改变命运',
      icon: '📚',
      tags: ['少年', '学术'],
      ageRange: [10, 19],
    },
    {
      id: 'adolescent_rebellion',
      name: '青春叛逆',
      type: 'attack',
      rarity: 'common',
      cost: 1,
      target: 'enemy',
      effects: [{ type: 'damage', value: 10 }, { type: 'gain_attribute', value: 1, attribute: 'fame' }],
      description: '年轻就是资本，敢想敢做',
      icon: '🔥',
      tags: ['少年', '叛逆'],
      ageRange: [12, 22],
    },
  ],
  // 20-29岁 - 青年
  [
    {
      id: 'college_life',
      name: '大学生活',
      type: 'skill',
      rarity: 'uncommon',
      cost: 1,
      target: 'self',
      effects: [
        { type: 'draw', value: 1 },
        { type: 'block', value: 3 },
        { type: 'heal', value: 3 },
        { type: 'gain_attribute', value: 1, attribute: 'network' },
      ],
      description: '图书馆、社团、朋友，收获满满',
      icon: '🎓',
      tags: ['青年', '学术'],
      ageRange: [18, 25],
    },
    {
      id: 'startup',
      name: '创业初期',
      type: 'attack',
      rarity: 'rare',
      cost: 2,
      target: 'enemy',
      effects: [{ type: 'damage', value: 12 }, { type: 'vulnerable', value: 2, duration: 2 }],
      description: '没有退路，只有前进',
      icon: '🚀',
      tags: ['青年', '创业'],
      ageRange: [20, 35],
    },
  ],
  // 30-39岁 - 壮年
  [
    {
      id: 'career_peak',
      name: '事业巅峰',
      type: 'attack',
      rarity: 'rare',
      cost: 2,
      target: 'enemy',
      effects: [{ type: 'damage', value: 18 }, { type: 'gain_attribute', value: 2, attribute: 'wealth' }],
      description: '多年的积累终于迎来收获',
      icon: '💼',
      tags: ['壮年', '事业'],
      ageRange: [30, 50],
    },
    {
      id: 'family_time',
      name: '家庭时光',
      type: 'skill',
      rarity: 'uncommon',
      cost: 1,
      target: 'self',
      effects: [{ type: 'heal', value: 8 }, { type: 'block', value: 5 }],
      description: '家人的支持是最强的后盾',
      icon: '👨‍👩‍👧',
      tags: ['壮年', '家庭'],
      ageRange: [28, 55],
    },
  ],
  // 40-49岁 - 中年
  [
    {
      id: 'midlife_crisis',
      name: '中年危机',
      type: 'curse',
      rarity: 'common',
      cost: 0,
      target: 'self',
      effects: [{ type: 'lose_attribute', value: 3, attribute: 'energy', duration: 2 }],
      description: '突如其来的空虚感',
      icon: '😰',
      tags: ['中年', '危机'],
      ageRange: [38, 55],
    },
    {
      id: 'wisdom_of_ages',
      name: '岁月沉淀',
      type: 'power',
      rarity: 'rare',
      cost: 2,
      target: 'self',
      effects: [{ type: 'strength', value: 1, duration: Infinity }, { type: 'dexterity', value: 1, duration: Infinity }],
      description: '历经风雨后的从容与智慧',
      icon: '🧘',
      tags: ['中年', '智慧'],
      ageRange: [40, 70],
    },
  ],
  // 50-59岁 - 知天命
  [
    {
      id: 'legacy_building',
      name: '遗产规划',
      type: 'skill',
      rarity: 'rare',
      cost: 2,
      target: 'self',
      effects: [{ type: 'block', value: 10 }, { type: 'heal', value: 10 }],
      description: '为未来做好准备',
      icon: '📜',
      tags: ['知天命', '传承'],
      ageRange: [50, 75],
    },
  ],
  // 60-69岁 - 花甲
  [
    {
      id: 'retirement',
      name: '退休生活',
      type: 'skill',
      rarity: 'common',
      cost: 1,
      target: 'self',
      effects: [{ type: 'heal', value: 12 }, { type: 'cure', value: 99 }],
      description: '终于有时间享受生活了',
      icon: '🌴',
      tags: ['花甲', '休闲'],
      ageRange: [58, 99],
    },
  ],
  // 70-79岁 - 古稀
  [
    {
      id: 'old_friend_reunion',
      name: '老友重逢',
      type: 'skill',
      rarity: 'uncommon',
      cost: 1,
      target: 'self',
      effects: [{ type: 'heal', value: 6 }, { type: 'gain_attribute', value: 2, attribute: 'network' }],
      description: '多年不见，还是那么亲切',
      icon: '🍻',
      tags: ['古稀', '友谊'],
      ageRange: [70, 79],
    },
    {
      id: 'life_reflection',
      name: '人生回顾',
      type: 'skill',
      rarity: 'uncommon',
      cost: 1,
      target: 'self',
      effects: [{ type: 'draw', value: 2 }, { type: 'heal', value: 4 }],
      description: '这一生，值了',
      icon: '📜',
      tags: ['古稀', '智慧'],
      ageRange: [70, 79],
    },
  ],
  // 80-89岁 - 杖朝
  [
    {
      id: 'grandparent_joy',
      name: '天伦之乐',
      type: 'skill',
      rarity: 'uncommon',
      cost: 1,
      target: 'self',
      effects: [{ type: 'heal', value: 10 }, { type: 'gain_attribute', value: 1, attribute: 'eq' }],
      description: '看着孙辈们成长，是最幸福的事',
      icon: '👴',
      tags: ['杖朝', '家庭'],
      ageRange: [80, 89],
    },
    {
      id: 'lifelong_wisdom',
      name: '毕生智慧',
      type: 'power',
      rarity: 'rare',
      cost: 2,
      target: 'self',
      effects: [{ type: 'strength', value: 1, duration: Infinity }, { type: 'regen', value: 1, duration: Infinity }],
      description: '活到老，学到老',
      icon: '📖',
      tags: ['杖朝', '智慧'],
      ageRange: [80, 89],
    },
  ],
  // 90-110岁 - 期颐
  [
    {
      id: 'longevity_secret',
      name: '长寿秘诀',
      type: 'power',
      rarity: 'legendary',
      cost: 2,
      target: 'self',
      effects: [{ type: 'regen', value: 3, duration: Infinity }, { type: 'gain_max_energy', value: 1 }],
      description: '心态好，自然长寿',
      icon: '🧘',
      tags: ['期颐', '长寿'],
      ageRange: [90, 110],
    },
    {
      id: 'legacy_of_life',
      name: '生命传承',
      type: 'skill',
      rarity: 'rare',
      cost: 1,
      target: 'all',
      effects: [{ type: 'heal', value: 15 }, { type: 'draw', value: 2 }],
      description: '你的故事，是家族最珍贵的财富',
      icon: '👨‍👩‍👧‍👦',
      tags: ['期颐', '传承'],
      ageRange: [90, 110],
    },
  ],
];

// 负面卡
export const CURSE_CARDS: LifeCard[] = [
  {
    id: 'burnout',
    name: '心力交瘁',
    type: 'curse',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'lose_attribute', value: 5, attribute: 'energy', duration: 1 }],
    description: '压力和疲惫让你喘不过气',
    icon: '😫',
    tags: ['负面', '疲劳'],
    ageRange: [15, 80], // 青少年到老年都可能
  },
  {
    id: 'bad_luck',
    name: '霉运当头',
    type: 'curse',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'lose_attribute', value: 2, attribute: 'wealth', duration: 1 }],
    description: '喝凉水都塞牙',
    icon: '🍀',
    tags: ['负面', '破财'],
    ageRange: null, // 全年龄段
  },
  {
    id: 'serious_illness',
    name: '重病缠身',
    type: 'curse',
    rarity: 'rare',
    cost: 0,
    target: 'self',
    effects: [{ type: 'poison', value: 3, duration: 3 }],
    description: '健康是最大的财富',
    icon: '🤒',
    tags: ['负面', '重病'],
    ageRange: [40, 99], // 中老年高发
  },
];

// ==========================================
// 年龄段专属卡牌扩展
// ==========================================

// 童年专属卡牌 (0-9岁)
export const CHILDHOOD_CARDS: LifeCard[] = [
  {
    id: 'innocent_joy',
    name: '纯真快乐',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'heal', value: 3 }, { type: 'draw', value: 1 }],
    description: '和小伙伴们一起玩耍的快乐时光',
    icon: '🎈',
    tags: ['童年', '快乐'],
    ageRange: [3, 9],
  },
  {
    id: 'first_teacher',
    name: '启蒙老师',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_attribute', value: 2, attribute: 'iq' }, { type: 'draw', value: 1 }],
    description: '老师的一句话，可能改变一生',
    icon: '👩‍🏫',
    tags: ['童年', '教育'],
    ageRange: [6, 12],
  },
  {
    id: 'childhood_dream',
    name: '童年梦想',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_max_energy', value: 1 }, { type: 'strength', value: 1, duration: Infinity }],
    description: '长大后我想当...',
    icon: '⭐',
    tags: ['童年', '梦想'],
    ageRange: [5, 10],
  },
];

// 少年专属卡牌 (10-19岁)
export const ADOLESCENT_CARDS: LifeCard[] = [
  {
    id: 'first_love',
    name: '初恋悸动',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 5 }, { type: 'gain_attribute', value: 1, attribute: 'eq' }],
    description: '那份青涩的感觉，一辈子都忘不了',
    icon: '💕',
    tags: ['少年', '情感'],
    ageRange: [14, 20],
  },
  {
    id: 'friendship_oath',
    name: '兄弟盟约',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 5 }, { type: 'gain_attribute', value: 1, attribute: 'network' }],
    description: '好兄弟，一辈子',
    icon: '🤜',
    tags: ['少年', '友谊'],
    ageRange: [12, 20],
  },
  {
    id: 'exam_war',
    name: '考试大战',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    effects: [{ type: 'damage', value: 8 }, { type: 'gain_attribute', value: 1, attribute: 'iq' }],
    description: '一分之差，千人之下',
    icon: '📝',
    tags: ['少年', '考试'],
    ageRange: [14, 20],
  },
];

// 青年专属卡牌 (20-29岁)
export const YOUTH_CARDS: LifeCard[] = [
  {
    id: 'first_job',
    name: '职场新人',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'draw', value: 2 }, { type: 'gain_attribute', value: 1, attribute: 'wealth' }],
    description: '从学生到职场人的转变',
    icon: '👔',
    tags: ['青年', '职场'],
    ageRange: [22, 28],
  },
  {
    id: 'passion_project',
    name: '激情项目',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    target: 'enemy',
    effects: [{ type: 'damage', value: 14 }, { type: 'gain_attribute', value: 1, attribute: 'fame' }],
    description: '为了梦想，全力以赴',
    icon: '🔥',
    tags: ['青年', '梦想'],
    ageRange: [20, 30],
  },
  {
    id: 'long_distance_love',
    name: '异地恋',
    type: 'curse',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'lose_attribute', value: 2, attribute: 'energy', duration: 2 }],
    description: '思念是一种病',
    icon: '💔',
    tags: ['青年', '情感'],
    ageRange: [20, 30],
  },
];

// 壮年专属卡牌 (30-39岁)
export const PRIME_CARDS: LifeCard[] = [
  {
    id: 'promotion_celebration',
    name: '升职加薪',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'gain_attribute', value: 3, attribute: 'wealth' }, { type: 'heal', value: 5 }],
    description: '努力终于得到了回报',
    icon: '🎉',
    tags: ['壮年', '事业'],
    ageRange: [30, 45],
  },
  {
    id: 'parenting_wisdom',
    name: '育儿智慧',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'block', value: 5 }, { type: 'regen', value: 2, duration: 3 }],
    description: '陪伴孩子成长，也是重新认识自己',
    icon: '👶',
    tags: ['壮年', '家庭'],
    ageRange: [28, 45],
  },
  {
    id: 'mortgage_pressure',
    name: '房贷压力',
    type: 'curse',
    rarity: 'common',
    cost: 0,
    target: 'self',
    effects: [{ type: 'lose_attribute', value: 2, attribute: 'energy', duration: 3 }],
    description: '每个月都在为银行打工',
    icon: '🏦',
    tags: ['壮年', '经济'],
    ageRange: [28, 50],
  },
];

// 中年专属卡牌 (40-55岁)
export const MIDDLE_AGE_CARDS: LifeCard[] = [
  {
    id: 'life_reassessment',
    name: '人生复盘',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'draw', value: 3 }, { type: 'cure', value: 99 }],
    description: '停下来，想想真正重要的东西',
    icon: '🤔',
    tags: ['中年', '反思'],
    ageRange: [40, 55],
  },
  {
    id: 'mentor_others',
    name: '指导后辈',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'gain_attribute', value: 2, attribute: 'network' }, { type: 'heal', value: 3 }],
    description: '传授经验，也是自我总结',
    icon: '🧑‍🏫',
    tags: ['中年', '传承'],
    ageRange: [40, 65],
  },
  {
    id: 'health_check',
    name: '健康检查',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 8 }, { type: 'cure', value: 2 }],
    description: '定期体检，防患于未然',
    icon: '🏥',
    tags: ['中年', '健康'],
    ageRange: [38, 70],
  },
];

// 老年专属卡牌 (55岁+)
export const ELDERLY_CARDS: LifeCard[] = [
  {
    id: 'grandparent_joy',
    name: '天伦之乐',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 10 }, { type: 'gain_attribute', value: 1, attribute: 'eq' }],
    description: '看着孙辈们成长，是最幸福的事',
    icon: '👴',
    tags: ['老年', '家庭'],
    ageRange: [55, 99],
  },
  {
    id: 'life_wisdom',
    name: '人生智慧',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ type: 'strength', value: 1, duration: Infinity }, { type: 'dexterity', value: 1, duration: Infinity }],
    description: '活到老，学到老',
    icon: '📖',
    tags: ['老年', '智慧'],
    ageRange: [60, 99],
  },
  {
    id: 'old_friend_reunion',
    name: '老友重逢',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 6 }, { type: 'gain_attribute', value: 2, attribute: 'network' }],
    description: '多年不见，还是那么亲切',
    icon: '🍻',
    tags: ['老年', '友谊'],
    ageRange: [55, 99],
  },
];

// 初始卡组
export const STARTER_DECK: LifeCard[] = [
  { ...COMMON_ATTACK_CARDS[0] },  // 日常努力
  { ...COMMON_ATTACK_CARDS[0] },
  { ...COMMON_ATTACK_CARDS[0] },
  { ...COMMON_ATTACK_CARDS[1] },  // 快速行动
  { ...COMMON_ATTACK_CARDS[2] },  // 专注打击
  { ...COMMON_SKILL_CARDS[0] },   // 稳扎稳打
  { ...COMMON_SKILL_CARDS[0] },
  { ...COMMON_SKILL_CARDS[1] },   // 自我疗愈
  { ...COMMON_SKILL_CARDS[2] },   // 提前规划
];

// ==========================================
// 遗物数据库
// ==========================================

// 普通遗物
export const COMMON_RELICS: LifeRelic[] = [
  {
    id: 'family_heirloom',
    name: '传家玉佩',
    rarity: 'common',
    description: '家族的祝福让你更健康',
    icon: '💎',
    stackable: false,
    effects: [{ type: 'max_health_bonus', value: 10 }],
  },
  {
    id: 'old_friend_letter',
    name: '老友书信',
    rarity: 'common',
    description: '多年的友谊是最大的财富',
    icon: '📨',
    stackable: true,
    maxStacks: 5,
    effects: [{ type: 'card_draw_bonus', value: 1 }],
  },
  {
    id: 'lucky_coin',
    name: '幸运硬币',
    rarity: 'common',
    description: '小幸运，大不同',
    icon: '🪙',
    stackable: true,
    maxStacks: 3,
    effects: [{ type: 'discount', value: 0.1 }],
  },
  {
    id: 'wellbeing_tea',
    name: '养生茶',
    rarity: 'common',
    description: '每天一杯，神清气爽',
    icon: '🍵',
    stackable: false,
    effects: [{ type: 'heal_on_rest', value: 5 }],
  },
];

// 稀有遗物
export const RARE_RELICS: LifeRelic[] = [
  {
    id: 'masters_degree',
    name: '名校文凭',
    rarity: 'rare',
    description: '知识让你事半功倍',
    icon: '🎓',
    stackable: false,
    effects: [
      { type: 'card_draw_bonus', value: 1 },
      { type: 'card_type_bonus', value: 0.2, cardType: 'skill' },
    ],
  },
  {
    id: 'property_deed',
    name: '房产证',
    rarity: 'rare',
    description: '有恒产者有恒心',
    icon: '🏠',
    stackable: false,
    effects: [{ type: 'max_health_bonus', value: 20 }, { type: 'discount', value: 0.05 }],
  },
  {
    id: 'mentor_gratitude',
    name: '恩师遗物',
    rarity: 'rare',
    description: '恩师的遗物，精神传承',
    icon: '📿',
    stackable: false,
    effects: [
      { type: 'extra_card_reward', value: 1 },
      { type: 'attribute_scaling', value: 0.1, attribute: 'iq' },
    ],
  },
];

// 史诗遗物
export const EPIC_RELICS: LifeRelic[] = [
  {
    id: 'political_power',
    name: '权柄',
    rarity: 'rare',
    description: '权力是最好的武器',
    icon: '⚖️',
    stackable: false,
    effects: [
      { type: 'double_damage', value: 0.2 },
      { type: 'card_draw_bonus', value: 1 },
    ],
  },
  {
    id: 'industry_monopoly',
    name: '行业垄断',
    rarity: 'rare',
    description: '站着把钱挣了',
    icon: '🏛️',
    stackable: false,
    effects: [
      { type: 'discount', value: 0.2 },
      { type: 'max_health_bonus', value: 15 },
      { type: 'heal_on_rest', value: 10 },
    ],
  },
];

// Boss遗物（只能从Boss获得）
export const BOSS_RELICS: LifeRelic[] = [
  {
    id: 'era_treasure',
    name: '时代宝藏',
    rarity: 'boss',
    description: '这个时代最珍贵的奖赏',
    icon: '🏆',
    stackable: false,
    effects: [
      { type: 'max_health_bonus', value: 25 },
      { type: 'card_draw_bonus', value: 1 },
      { type: 'extra_card_reward', value: 1 },
    ],
  },
  {
    id: 'legend_legacy',
    name: '传奇遗产',
    rarity: 'boss',
    description: '你已经成为这个时代的传奇',
    icon: '👑',
    stackable: false,
    effects: [
      { type: 'max_health_bonus', value: 30 },
      { type: 'double_damage', value: 0.15 },
      { type: 'discount', value: 0.15 },
    ],
  },
];

// 修仙遗物
export const CULTIVATION_RELICS: LifeRelic[] = [
  {
    id: 'spirit_stone',
    name: '灵石',
    rarity: 'common',
    description: '蕴含着天地灵气',
    icon: '💠',
    stackable: true,
    maxStacks: 99,
    effects: [{ type: 'energy_bonus', value: 1 }],
  },
  {
    id: 'immortal_fruit',
    name: '蟠桃',
    rarity: 'rare',
    description: '天庭的仙果，延年益寿',
    icon: '🍑',
    stackable: false,
    effects: [{ type: 'lifespan_extend', value: 20 }],
  },
  {
    id: 'dao_comprehension',
    name: '悟道石',
    rarity: 'rare',
    description: '蕴含大道至理',
    icon: '🪨',
    stackable: false,
    effects: [
      { type: 'card_type_bonus', value: 0.25, cardType: 'power' },
      { type: 'lifespan_extend', value: 15 },
    ],
  },
  {
    id: 'heavenly_tribulation_pearl',
    name: '渡劫珠',
    rarity: 'legendary',
    description: '渡劫成功后的天道馈赠',
    icon: '🌟',
    stackable: false,
    effects: [
      { type: 'lifespan_extend', value: 50 },
      { type: 'max_health_bonus', value: 50 },
      { type: 'double_damage', value: 0.3 },
    ],
  },
];

// ==========================================
// 奇遇奖励池
// ==========================================
export const WONDER_REWARD_POOL = {
  cards: [
    ...COMMON_ATTACK_CARDS,
    ...COMMON_SKILL_CARDS,
    ...RARE_CARDS.slice(0, 3),
  ],
  attributes: [
    { energy: 3 },
    { physique: 3 },
    { health: 3 },
    { iq: 3 },
    { eq: 3 },
    { wealth: 5 },
    { network: 3 },
    { fame: 2 },
    { energy: 5, physique: 2 },
    { iq: 3, eq: 3 },
    { wealth: 8 },
    { network: 5 },
  ],
  gold: [10, 15, 20, 25, 30],
  relics: [
    ...COMMON_RELICS,
    ...RARE_RELICS.slice(0, 3),
  ],
};

// ==========================================
// 敌人数据库 - 人生怪物化
// ==========================================

// 普通战斗敌人
export const COMMON_ENEMIES: Enemy[] = [
  {
    id: 'procrastination_slime',
    name: '拖延史莱姆',
    maxHealth: 20,
    currentHealth: 20,
    block: 0,
    intents: [
      { type: 'attack', damage: 4 },
      { type: 'defend', block: 3 },
      { type: 'attack', damage: 6 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🟢',
    isBoss: false,
    cardRewards: [COMMON_ATTACK_CARDS[1], COMMON_SKILL_CARDS[2], COMMON_ATTACK_CARDS[2]],
    goldReward: [5, 15],
    description: '拖延是时间最大的小偷',
    mechanics: [] as EnemyMechanic[],
    ageRange: [10, 80], // 青少年到老年都可能拖延
  },
  {
    id: 'anxiety_ghost',
    name: '焦虑幽灵',
    maxHealth: 25,
    currentHealth: 25,
    block: 0,
    intents: [
      { type: 'attack', damage: 3, hits: 2 },
      { type: 'buff', effect: 'strength', value: 1 },
      { type: 'attack', damage: 8 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '👻',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[0], COMMON_SKILL_CARDS[1], RARE_CARDS[0]],
    goldReward: [8, 20],
    description: '焦虑让你无法集中注意力',
    mechanics: [] as EnemyMechanic[],
    ageRange: [15, 60], // 青年到中年高发
  },
  {
    id: 'obligation_golem',
    name: '责任傀儡',
    maxHealth: 35,
    currentHealth: 35,
    block: 5,
    intents: [
      { type: 'defend', block: 8 },
      { type: 'attack', damage: 10 },
      { type: 'attack', damage: 6 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 5, duration: Infinity }],
    icon: '🗿',
    isBoss: false,
    cardRewards: [COMMON_ATTACK_CARDS[0], COMMON_ATTACK_CARDS[1], RARE_CARDS[1]],
    goldReward: [10, 25],
    description: '家庭、工作、社会责任...你无法逃避',
    mechanics: [] as EnemyMechanic[],
    ageRange: [25, 65], // 成年后到退休前
  },
  {
    id: 'self_doubt_wraith',
    name: '自我怀疑的幽灵',
    maxHealth: 18,
    currentHealth: 18,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 2 },
      { type: 'attack', damage: 5 },
      { type: 'debuff', effect: 'vulnerable', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '👤',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[0], COMMON_SKILL_CARDS[1], COMMON_SKILL_CARDS[2]],
    goldReward: [5, 15],
    description: '内心的声音在质疑你的一切',
    mechanics: [] as EnemyMechanic[],
    ageRange: [15, 50], // 青少年到中年
  },
];

// 精英敌人
export const ELITE_ENEMIES: Enemy[] = [
  {
    id: 'midlife_crisis_boss',
    name: '中年危机首领',
    maxHealth: 80,
    currentHealth: 80,
    block: 0,
    intents: [
      { type: 'attack', damage: 15 },
      { type: 'buff', effect: 'strength', value: 2 },
      { type: 'attack', damage: 10, hits: 2 },
      { type: 'defend', block: 10 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '👔',
    isBoss: false,
    cardRewards: [RARE_CARDS[0], RARE_CARDS[1], RARE_CARDS[2]],
    goldReward: [25, 50],
    description: '上有老下有小，左右为难',
    mechanics: ['double_attack'] as EnemyMechanic[],
    ageRange: [38, 55], // 中年专属
  },
  {
    id: 'burnout_demon',
    name: '过劳恶魔',
    maxHealth: 65,
    currentHealth: 65,
    block: 0,
    intents: [
      { type: 'attack', damage: 12 },
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'attack', damage: 8, hits: 2 },
      { type: 'special', name: '燃烧', description: '造成持续伤害' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 1, duration: Infinity }],
    icon: '😈',
    isBoss: false,
    cardRewards: [RARE_CARDS[1], RARE_CARDS[2], LEGENDARY_CARDS[0]],
    goldReward: [30, 60],
    description: '996的阴影笼罩着你',
    mechanics: ['shield'] as EnemyMechanic[],
    ageRange: [22, 50], // 职场过劳高发期
  },
];

// Boss敌人
export const BOSS_ENEMIES: Enemy[] = [
  {
    id: 'collective_responsibility',
    name: '社会责任巨兽',
    maxHealth: 120,
    currentHealth: 120,
    block: 10,
    intents: [
      { type: 'attack', damage: 18 },
      { type: 'defend', block: 15 },
      { type: 'attack', damage: 12, hits: 2 },
      { type: 'buff', effect: 'strength', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 10, duration: Infinity }],
    icon: '🏛️',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[0], LEGENDARY_CARDS[1], RARE_CARDS[2]],
    relicReward: BOSS_RELICS[0],
    goldReward: [50, 100],
    description: '作为社会的一员，你别无选择',
    mechanics: ['double_attack', 'shield'] as EnemyMechanic[],
    ageRange: [30, 60], // 壮年到中年
  },
  {
    id: 'final_exam_boss',
    name: '人生终考',
    maxHealth: 150,
    currentHealth: 150,
    block: 0,
    intents: [
      { type: 'special', name: '审判', description: '造成巨额固定伤害' },
      { type: 'attack', damage: 20 },
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'attack', damage: 15, hits: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 2, duration: Infinity }],
    icon: '⚖️',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[0], LEGENDARY_CARDS[1], RARE_CARDS[2]],
    relicReward: BOSS_RELICS[1],
    goldReward: [80, 150],
    description: '回顾你的一生，你满意吗？',
    mechanics: ['double_attack', 'regen'] as EnemyMechanic[],
    ageRange: [60, 99], // 老年专属
  },
  {
    id: 'infinite_doubt',
    name: '无限质疑',
    maxHealth: 180,
    currentHealth: 180,
    block: 5,
    intents: [
      { type: 'attack', damage: 22 },
      { type: 'debuff', effect: 'vulnerable', value: 4 },
      { type: 'attack', damage: 10, hits: 3 },
      { type: 'special', name: '心灵打击', description: '降低最大生命' },
    ],
    currentIntentIndex: 0,
    statusEffects: [
      { type: 'strength', value: 3, duration: Infinity },
      { type: 'artifact', value: 1, duration: Infinity },
    ],
    icon: '🌀',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[1], RARE_CARDS[2], RARE_CARDS[0]],
    relicReward: BOSS_RELICS[1],
    goldReward: [100, 200],
    description: '你内心最深处的恐惧',
    mechanics: ['double_attack', 'shield', 'rage'] as EnemyMechanic[],
    ageRange: [25, 65], // 青年到中年
  },
];

// ==========================================
// 年龄段专属敌人
// ==========================================

// 童年专属敌人 (0-9岁)
export const CHILDHOOD_ENEMIES: Enemy[] = [
  {
    id: 'study_pressure_slime',
    name: '作业史莱姆',
    maxHealth: 12,
    currentHealth: 12,
    block: 0,
    intents: [
      { type: 'attack', damage: 3 },
      { type: 'debuff', effect: 'weak', value: 1 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '📝',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[2]],
    goldReward: [3, 8],
    description: '永远写不完的作业',
    mechanics: [],
    ageRange: [6, 12],
  },
  {
    id: 'bully_goblin',
    name: '小霸王哥布林',
    maxHealth: 15,
    currentHealth: 15,
    block: 0,
    intents: [
      { type: 'attack', damage: 4 },
      { type: 'debuff', effect: 'vulnerable', value: 1 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '👊',
    isBoss: false,
    cardRewards: [COMMON_ATTACK_CARDS[0]],
    goldReward: [2, 6],
    description: '学校里的恶霸，总是找你的麻烦',
    mechanics: [],
    ageRange: [6, 14],
  },
];

// 少年专属敌人 (10-19岁)
export const ADOLESCENT_ENEMIES: Enemy[] = [
  {
    id: 'exam_pressure_demon',
    name: '考试压力魔',
    maxHealth: 22,
    currentHealth: 22,
    block: 0,
    intents: [
      { type: 'attack', damage: 5, hits: 2 },
      { type: 'debuff', effect: 'weak', value: 2 },
      { type: 'attack', damage: 8 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '📚',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[1][0]], // 寒窗苦读
    goldReward: [5, 12],
    description: '中考、高考，每一座独木桥都不好过',
    mechanics: [],
    ageRange: [14, 20],
  },
  {
    id: 'identity_confusion_wraith',
    name: '自我认同幽灵',
    maxHealth: 16,
    currentHealth: 16,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'confusion', value: 2 },
      { type: 'attack', damage: 4 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🪞',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[0]],
    goldReward: [3, 8],
    description: '我是谁？我要去哪里？',
    mechanics: [],
    ageRange: [14, 22],
  },
];

// 青年专属敌人 (20-29岁)
export const YOUTH_ENEMIES: Enemy[] = [
  {
    id: 'rent_golem',
    name: '房租傀儡',
    maxHealth: 28,
    currentHealth: 28,
    block: 0,
    intents: [
      { type: 'attack', damage: 6 },
      { type: 'attack', damage: 6 },
      { type: 'debuff', effect: 'weak', value: 1 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🏠',
    isBoss: false,
    cardRewards: [COMMON_ATTACK_CARDS[0], COMMON_SKILL_CARDS[1]],
    goldReward: [5, 10],
    description: '每个月工资還沒到手，就先交给了房东',
    mechanics: [],
    ageRange: [22, 35],
  },
  {
    id: 'dating_phoenix',
    name: '相亲凤凰',
    maxHealth: 20,
    currentHealth: 20,
    block: 3,
    intents: [
      { type: 'special', name: '灵魂拷问', description: '降低能量' },
      { type: 'debuff', effect: 'weak', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🦜',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[0]],
    goldReward: [8, 15],
    description: '有房有车了吗？工资多少？',
    mechanics: [],
    ageRange: [24, 35],
  },
];

// 壮年专属敌人 (30-39岁)
export const PRIME_ENEMIES: Enemy[] = [
  {
    id: 'workplace_competition_dragon',
    name: '职场竞争龙',
    maxHealth: 40,
    currentHealth: 40,
    block: 5,
    intents: [
      { type: 'attack', damage: 8 },
      { type: 'debuff', effect: 'vulnerable', value: 2 },
      { type: 'attack', damage: 12 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 1, duration: Infinity }],
    icon: '🐉',
    isBoss: false,
    cardRewards: [RARE_CARDS[2], AGE_SPECIFIC_CARDS[3][0]],
    goldReward: [15, 30],
    description: '年轻人越来越厉害了，你开始感到压力',
    mechanics: [],
    ageRange: [30, 45],
  },
  {
    id: 'child_education_tiger',
    name: '子教育虎',
    maxHealth: 35,
    currentHealth: 35,
    block: 0,
    intents: [
      { type: 'attack', damage: 7 },
      { type: 'debuff', effect: 'weak', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🐯',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[1]],
    goldReward: [10, 20],
    description: '不能让孩子输在起跑线上',
    mechanics: [],
    ageRange: [30, 50],
  },
];

// 中年专属敌人 (40-55岁)
export const MIDDLE_AGE_ENEMIES: Enemy[] = [
  {
    id: 'health_crisis_serpent',
    name: '健康危机蛇',
    maxHealth: 45,
    currentHealth: 45,
    block: 0,
    intents: [
      { type: 'attack', damage: 6 },
      { type: 'debuff', effect: 'poison', value: 2 },
      { type: 'special', name: '体检报告', description: '降低生命上限' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'poison', value: 1, duration: Infinity }],
    icon: '🐍',
    isBoss: false,
    cardRewards: [CURSE_CARDS[2], COMMON_SKILL_CARDS[1]],
    goldReward: [10, 25],
    description: '身体开始走下坡路，体检报告上的箭头越来越多',
    mechanics: [],
    ageRange: [40, 65],
  },
  {
    id: 'career_ceiling_golem',
    name: '职业天花板傀儡',
    maxHealth: 50,
    currentHealth: 50,
    block: 10,
    intents: [
      { type: 'defend', block: 10 },
      { type: 'attack', damage: 8 },
      { type: 'debuff', effect: 'weak', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 10, duration: Infinity }],
    icon: '🧱',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[4][1]], // 岁月沉淀
    goldReward: [15, 30],
    description: '升迁机会越来越少，后来者虎视眈眈',
    mechanics: [],
    ageRange: [38, 55],
  },
];

// 老年专属敌人 (55岁+)
export const ELDERLY_ENEMIES: Enemy[] = [
  {
    id: 'loneliness_wraith',
    name: '孤独幽灵',
    maxHealth: 25,
    currentHealth: 25,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'attack', damage: 5 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🌫️',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[6][0]], // 退休生活
    goldReward: [3, 8],
    description: '孩子们都在忙，老伴也走了',
    mechanics: [],
    ageRange: [55, 69],
  },
  {
    id: 'memory_loss_slime',
    name: '失忆史莱姆',
    maxHealth: 30,
    currentHealth: 30,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'confusion', value: 2 },
      { type: 'attack', damage: 4 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🧠',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[1]],
    goldReward: [2, 6],
    description: '刚才要说什么来着？',
    mechanics: [],
    ageRange: [65, 79],
  },
  {
    id: 'health_decline_serpent',
    name: '健康衰退蛇',
    maxHealth: 35,
    currentHealth: 35,
    block: 0,
    intents: [
      { type: 'attack', damage: 5 },
      { type: 'debuff', effect: 'poison', value: 2 },
      { type: 'special', name: '慢性病', description: '持续削弱' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'poison', value: 1, duration: Infinity }],
    icon: '🐍',
    isBoss: false,
    cardRewards: [COMMON_SKILL_CARDS[1]],
    goldReward: [3, 7],
    description: '身体机能一年不如一年',
    mechanics: [],
    ageRange: [70, 89],
  },
  {
    id: 'time_ghost',
    name: '时光幽灵',
    maxHealth: 40,
    currentHealth: 40,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 4 },
      { type: 'attack', damage: 6 },
      { type: 'special', name: '岁月流逝', description: '降低最大生命' },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '⏳',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[7][1]], // 人生回顾
    goldReward: [4, 10],
    description: '时间不等人',
    mechanics: [],
    ageRange: [75, 99],
  },
  {
    id: 'mobility_golem',
    name: '行动迟缓傀儡',
    maxHealth: 45,
    currentHealth: 45,
    block: 5,
    intents: [
      { type: 'defend', block: 8 },
      { type: 'attack', damage: 5 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 5, duration: Infinity }],
    icon: '🦽',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[8][0]], // 天伦之乐
    goldReward: [3, 8],
    description: '腿脚不如以前利索了',
    mechanics: [],
    ageRange: [80, 110],
  },
  {
    id: 'final_chapter_wraith',
    name: '终章幽灵',
    maxHealth: 50,
    currentHealth: 50,
    block: 0,
    intents: [
      { type: 'attack', damage: 7 },
      { type: 'debuff', effect: 'vulnerable', value: 3 },
      { type: 'special', name: '生命倒计时', description: '无视防御' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 2, duration: Infinity }],
    icon: '💀',
    isBoss: false,
    cardRewards: [AGE_SPECIFIC_CARDS[9][0]], // 长寿秘诀
    goldReward: [5, 15],
    description: '人生终将迎来终点',
    mechanics: [],
    ageRange: [90, 110],
  },
];

// ==========================================
// 修仙专属敌人（110岁+）
// ==========================================

// 修仙入门敌人 (110-130岁)
export const CULTIVATION_ENTRY_ENEMIES: Enemy[] = [
  {
    id: 'mortal_attachment_wraith',
    name: '凡心幽灵',
    maxHealth: 55,
    currentHealth: 55,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'attack', damage: 8 },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '😔',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[0]], // 吐纳练气
    goldReward: [10, 20],
    description: '尘世的牵挂，是你修行的第一道坎',
    mechanics: [],
    ageRange: [111, 130],
    isCultivation: true,
  },
  {
    id: 'qi_deviation_demon',
    name: '走火入魔',
    maxHealth: 60,
    currentHealth: 60,
    block: 0,
    intents: [
      { type: 'attack', damage: 10 },
      { type: 'debuff', effect: 'vulnerable', value: 3 },
      { type: 'special', name: '真气逆流', description: '无视防御' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 2, duration: Infinity }],
    icon: '👹',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[0], CULTIVATION_CARDS[1]],
    goldReward: [15, 30],
    description: '修炼急功近利，终将走火入魔',
    mechanics: [],
    ageRange: [115, 150],
    isCultivation: true,
  },
];

// 修仙中期敌人 (130-200岁)
export const CULTIVATION_MID_ENEMIES: Enemy[] = [
  {
    id: 'tribulation_thunder',
    name: '天劫雷云',
    maxHealth: 80,
    currentHealth: 80,
    block: 10,
    intents: [
      { type: 'special', name: '雷击', description: '高额固定伤害' },
      { type: 'attack', damage: 15 },
      { type: 'debuff', effect: 'weak', value: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 10, duration: Infinity }],
    icon: '⛈️',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[2]], // 金丹大道
    goldReward: [25, 50],
    description: '每突破一个境界，都要承受天劫洗礼',
    mechanics: [],
    ageRange: [130, 200],
    isCultivation: true,
  },
  {
    id: 'inner_demon_king',
    name: '心魔王',
    maxHealth: 90,
    currentHealth: 90,
    block: 5,
    intents: [
      { type: 'attack', damage: 12 },
      { type: 'debuff', effect: 'vulnerable', value: 4 },
      { type: 'special', name: '幻象',description: '降低命中' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'rage', value: 2, duration: Infinity }],
    icon: '👿',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[1], CULTIVATION_CARDS[2]],
    goldReward: [30, 60],
    description: '你最大的敌人，始终是自己',
    mechanics: [],
    ageRange: [140, 250],
    isCultivation: true,
  },
];

// 修仙后期敌人 (200岁+)
export const CULTIVATION_LATE_ENEMIES: Enemy[] = [
  {
    id: 'heavenly_punishment_dragon',
    name: '天罚龙',
    maxHealth: 120,
    currentHealth: 120,
    block: 15,
    intents: [
      { type: 'attack', damage: 20 },
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'special', name: '天谴',description: '造成巨额伤害' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 3, duration: Infinity }],
    icon: '🐲',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[3]], // 渡劫重生
    goldReward: [50, 100],
    description: '天道不容异降，降下天罚',
    mechanics: [],
    ageRange: [200, 350],
    isCultivation: true,
  },
  {
    id: 'void_chaos_beast',
    name: '虚空混沌兽',
    maxHealth: 150,
    currentHealth: 150,
    block: 20,
    intents: [
      { type: 'attack', damage: 25 },
      { type: 'debuff', effect: 'vulnerable', value: 5 },
      { type: 'special', name: '混沌',description: '随机效果' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'rage', value: 4, duration: Infinity }],
    icon: '🌌',
    isBoss: false,
    cardRewards: [CULTIVATION_CARDS[3]],
    goldReward: [80, 150],
    description: '来自虚空深处的恐怖存在',
    mechanics: [],
    ageRange: [250, 500],
    isCultivation: true,
  },
  {
    id: 'immortal_tribulation_phoenix',
    name: '仙劫凤凰',
    maxHealth: 200,
    currentHealth: 200,
    block: 25,
    intents: [
      { type: 'special', name: '涅槃真火', description: '高额持续伤害' },
      { type: 'attack', damage: 30 },
      { type: 'buff', effect: 'strength', value: 5 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'regen', value: 5, duration: Infinity }],
    icon: '🔥',
    isBoss: false,
    cardRewards: [LEGENDARY_CARDS[1]],
    goldReward: [100, 200],
    description: '九重仙劫，一重更比一重强',
    mechanics: [],
    ageRange: [400, 750],
    isCultivation: true,
  },
];

// 修仙专属Boss
export const CULTIVATION_BOSSES_AGE: Enemy[] = [
  {
    id: 'mortal_world_farewell',
    name: '凡尘了结',
    maxHealth: 100,
    currentHealth: 100,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 5 },
      { type: 'attack', damage: 15 },
      { type: 'special', name: '尘缘尽了',description: '降低最大生命' },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '🌅',
    isBoss: true,
    cardRewards: [CULTIVATION_CARDS[0], CULTIVATION_CARDS[1]],
    goldReward: [100, 200],
    description: '了却尘缘，方得长生',
    mechanics: [],
    ageRange: [111, 130],
    isCultivation: true,
  },
  {
    id: 'golden_core_tribulation',
    name: '金丹天劫',
    maxHealth: 180,
    currentHealth: 180,
    block: 15,
    intents: [
      { type: 'special', name: '天雷九重',description: '连续雷电攻击' },
      { type: 'attack', damage: 20 },
      { type: 'debuff', effect: 'vulnerable', value: 4 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 15, duration: Infinity }],
    icon: '⚡',
    isBoss: true,
    cardRewards: [CULTIVATION_CARDS[2]],
    relicReward: CULTIVATION_RELICS[1],
    goldReward: [300, 500],
    description: '结成金丹，方能脱胎换骨',
    mechanics: [],
    ageRange: [180, 220],
    isCultivation: true,
  },
  {
    id: 'nascent_soul_tribulation',
    name: '元婴天劫',
    maxHealth: 280,
    currentHealth: 280,
    block: 25,
    intents: [
      { type: 'attack', damage: 35 },
      { type: 'special', name: '天劫降临',description: '巨额固定伤害' },
      { type: 'debuff', effect: 'weak', value: 5 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'strength', value: 4, duration: Infinity }],
    icon: '🌩️',
    isBoss: true,
    cardRewards: [CULTIVATION_CARDS[3]],
    relicReward: CULTIVATION_RELICS[3],
    goldReward: [500, 1000],
    description: '元婴出窍，天地共鸣',
    mechanics: [],
    ageRange: [240, 300],
    isCultivation: true,
  },
  {
    id: 'ascension_tribulation',
    name: '飞升天劫',
    maxHealth: 400,
    currentHealth: 400,
    block: 30,
    intents: [
      { type: 'special', name: '九九雷劫',description: '毁灭性伤害' },
      { type: 'attack', damage: 50 },
      { type: 'buff', effect: 'strength', value: 8 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'rage', value: 5, duration: Infinity }],
    icon: '🌟',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[1]],
    relicReward: CULTIVATION_RELICS[3],
    goldReward: [1000, 2000],
    description: '渡劫成功，飞升成仙；失败，灰飞烟灭',
    mechanics: [],
    ageRange: [700, 800],
    isCultivation: true,
  },
];

// 修仙模式专属卡（补充高境界）
export const CULTIVATION_CARDS_HIGH: LifeCard[] = [
  {
    id: 'immortal_qi_absorption',
    name: '仙气吐纳',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    effects: [{ type: 'regen', value: 5, duration: Infinity }, { type: 'gain_max_energy', value: 1 }],
    description: '吸纳天地仙气，脱胎换骨',
    icon: '☯️',
    tags: ['修仙', '吐纳'],
    ageRange: [111, 999],
    isCultivation: true,
  },
  {
    id: 'dao_heart',
    name: '道心种魔',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [
      { type: 'strength', value: 2, duration: Infinity },
      { type: 'regen', value: 3, duration: Infinity },
      { type: 'gain_attribute', value: 5, attribute: 'iq' },
    ],
    description: '道心坚定，万法不侵',
    icon: '🪷',
    tags: ['修仙', '心法'],
    ageRange: [130, 999],
    isCultivation: true,
  },
  {
    id: 'heavenly_earthly_eye',
    name: '天眼通',
    type: 'skill',
    rarity: 'legendary',
    cost: 2,
    target: 'self',
    effects: [{ type: 'draw', value: 5 }, { type: 'gain_energy', value: 3 }],
    description: '洞察天机，趋吉避凶',
    icon: '👁️',
    tags: ['修仙', '神通'],
    ageRange: [200, 999],
    isCultivation: true,
  },
  {
    id: 'immortal_body',
    name: '仙体淬炼',
    type: 'power',
    rarity: 'legendary',
    cost: 3,
    target: 'self',
    effects: [
      { type: 'shield', value: 30 },
      { type: 'regen', value: 5, duration: Infinity },
      { type: 'cure', value: 99 },
    ],
    description: '仙体一成，万法不侵',
    icon: '💎',
    tags: ['修仙', '肉身'],
    ageRange: [250, 999],
    isCultivation: true,
  },
  {
    id: 'unity_with_dao',
    name: '天人合一',
    type: 'power',
    rarity: 'legendary',
    cost: 4,
    target: 'self',
    effects: [
      { type: 'strength', value: 3, duration: Infinity },
      { type: 'regen', value: 10, duration: Infinity },
      { type: 'gain_max_energy', value: 2 },
    ],
    description: '与天地同寿，与日月齐光',
    icon: '🌍',
    tags: ['修仙', '大成'],
    ageRange: [500, 999],
    isCultivation: true,
  },
];

// 修仙Boss（兼容旧系统）
export const CULTIVATION_BOSSES: Enemy[] = [
  {
    id: 'heart_demon',
    name: '心魔',
    maxHealth: 100,
    currentHealth: 100,
    block: 0,
    intents: [
      { type: 'debuff', effect: 'weak', value: 4 },
      { type: 'attack', damage: 15 },
      { type: 'special', name: '内魔爆发', description: '无视防御' },
    ],
    currentIntentIndex: 0,
    statusEffects: [],
    icon: '👿',
    isBoss: true,
    cardRewards: [CULTIVATION_CARDS[1], CULTIVATION_CARDS[2], LEGENDARY_CARDS[1]],
    goldReward: [100, 200],
    description: '一念之差，走火入魔',
    mechanics: ['rage', 'regen'] as EnemyMechanic[],
  },
  {
    id: 'heavenly_tribulation',
    name: '天劫',
    maxHealth: 250,
    currentHealth: 250,
    block: 20,
    intents: [
      { type: 'special', name: '雷劫', description: '高额固定伤害' },
      { type: 'attack', damage: 30 },
      { type: 'buff', effect: 'strength', value: 5 },
      { type: 'attack', damage: 20, hits: 2 },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 20, duration: Infinity }],
    icon: '⚡',
    isBoss: true,
    cardRewards: [CULTIVATION_CARDS[3], CULTIVATION_CARDS[3], LEGENDARY_CARDS[1]],
    relicReward: CULTIVATION_RELICS[3],
    goldReward: [500, 1000],
    description: '天道不容，降下九重天劫',
    mechanics: ['double_attack', 'shield', 'rage', 'summon'] as EnemyMechanic[],
  },
];

// ==========================================
// 修仙境界（年龄驱动版）
// ==========================================
export const CULTIVATION_REALMS: Record<
  CultivationRealm,
  { name: string; lifespanBonus: number; ageThreshold: number; icon: string; description: string }
> = {
  mortal: { name: '凡人', lifespanBonus: 0, ageThreshold: 0, icon: '👤', description: '凡人之躯，百年寿命' },
  qi_refining: { name: '炼气期', lifespanBonus: 20, ageThreshold: 111, icon: '🌬️', description: '引气入体，脱胎换骨，寿命延长至130岁' },
  foundation: { name: '筑基期', lifespanBonus: 50, ageThreshold: 131, icon: '🧱', description: '筑立根基，寿命延长至160岁' },
  golden_core: { name: '金丹期', lifespanBonus: 100, ageThreshold: 161, icon: '🔥', description: '结成金丹，寿命延长至200岁' },
  nascent: { name: '元婴期', lifespanBonus: 160, ageThreshold: 201, icon: '👶', description: '元婴出窍，寿命延长至260岁' },
  spirit: { name: '化神期', lifespanBonus: 240, ageThreshold: 261, icon: '👻', description: '化凡为神，寿命延长至340岁' },
  void: { name: '炼虚期', lifespanBonus: 350, ageThreshold: 341, icon: '🌀', description: '炼虚合道，寿命延长至450岁' },
  integration: { name: '合体期', lifespanBonus: 480, ageThreshold: 451, icon: '🤝', description: '与道合一，寿命延长至580岁' },
  mahayana: { name: '大乘期', lifespanBonus: 650, ageThreshold: 581, icon: '🎯', description: '大成之境，寿命延长至750岁' },
  tribulation: { name: '渡劫期', lifespanBonus: 800, ageThreshold: 751, icon: '⚡', description: '渡劫飞升，寿与天齐' },
};

// ==========================================
// 属性中文名
// ==========================================
export const ATTRIBUTE_NAMES: Record<string, string> = {
  energy: '精力',
  physique: '体魄',
  health: '健康',
  iq: '智商',
  eq: '情商',
  wealth: '财富',
  network: '人脉',
  fame: '名望',
};

export const ATTRIBUTE_ICONS: Record<string, string> = {
  energy: '⚡',
  physique: '💪',
  health: '❤️',
  iq: '🧠',
  eq: '💬',
  wealth: '💰',
  network: '🤝',
  fame: '⭐',
};

export const ATTRIBUTE_COLORS: Record<string, string> = {
  energy: '#F59E0B',
  physique: '#EF4444',
  health: '#10B981',
  iq: '#3B82F6',
  eq: '#8B5CF6',
  wealth: '#F97316',
  network: '#06B6D4',
  fame: '#EC4899',
};

export const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  energy: '⚡ 精力: 30点获【精力充沛】抽2牌 | 50/90点初始精力+1 | 70点获【活力爆发】+3精力 | 100点最大精力+1',
  physique: '💪 体魄: 30点获【强壮一击】12伤+2力量 | 50/90点攻击伤害+10% | 70点获【威猛】10格挡+3力量 | 100点攻击+30%',
  health: '❤️ 健康: 30点获【生命恢复】回6血 | 50/90点最大生命+10/15 | 70点获【坚韧】12格挡+回8血 | 100点每回合回2血',
  iq: '🧠 智商: 30点获【灵光一闪】抽3牌 | 50/90点每回合抽+1卡 | 70点获【聪颖】抽2牌+1精力 | 100点最大精力+1',
  eq: '💬 情商: 30点获【友善】6格挡+净化 | 50/90点战斗格挡+3/+5 | 70点获【亲和】12格挡+全净化 | 100点每回合+2格挡',
  wealth: '💰 财富: 30点获【小富】1精力+抽1牌 | 50/90点商店折扣5%/10% | 70点获【富贵】2精力+抽1牌 | 100点最大精力+1',
  network: '🤝 人脉: 30点获【熟人】8格挡 | 50/90点战斗格挡+3/+8 | 70点获【人脉】15格挡+抽1牌 | 100点每回合+10护盾',
  fame: '⭐ 名望: 30点获【小有名气】10伤+虚弱 | 50/90点打断敌人10%/25% | 70点获【威名】18伤+脆弱 | 100点反伤3点',
};

// ==========================================
// 隐藏标签中文名
// ==========================================
export const TAG_NAMES: Record<string, string> = {
  trendsetter: '弄潮儿',
  steady_walker: '守望者',
  wisdom_seeker: '求道者',
  social_master: '人脉之王',
  hidden_dragon: '潜龙',
  life_enjoyer: '生活家',
  era_shaper: '时代塑造者',
  collector: '收藏家',
  minimalist: '极简主义者',
  cultivator: '修真者',
};

// ==========================================
// 卡牌类型中文名
// ==========================================
export const CARD_TYPE_NAMES: Record<string, string> = {
  attack: '攻击',
  skill: '技能',
  power: '能力',
  curse: '诅咒',
};

// ==========================================
// 修真境界中文名
// ==========================================
export const CULTIVATION_REALM_NAMES: Record<string, string> = {
  mortal: '凡人',
  qi_refining: '炼气',
  foundation: '筑基',
  golden_core: '金丹',
  nascent: '元婴',
  spirit: '化神',
  void: '炼虚',
  integration: '合体',
  mahayana: '大乘',
  tribulation: '渡劫',
};

// ==========================================
// 稀有度中文名
// ==========================================
export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  legendary: '传说',
  boss: 'Boss',
};

// ==========================================
// 1950年代事件（时间轴驱动）
// ==========================================
// 特殊时间事件说明：
// - ageRange 定义事件出现的年龄窗口，超过该范围事件将不再出现
// - 事件按时间顺序排列，与时间轴严格绑定
// - 1950年代对应出生年份1950，era=0，年龄0-9岁对应1950-1959年
// ==========================================
export const SCRIPT_1950_EVENTS: GameEvent[] = [
  // ---- 出生 (1950年，0岁) ----
  {
    id: 'born_1950',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '呱呱坠地',
    baseText: '1950年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个相对富裕的家庭，家里有房有地。母亲看着你，眼里满是欣慰。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，虽然不富裕，但一家人其乐融融。';
      return '你出生在一个贫苦的家庭，但困难的环境让你从小就懂得了生活的不易。';
    },
    options: [
      {
        id: 'start_life',
        text: '开始新的人生',
        successRate: { energy: 0.5 },
        successOutcome: {
          description: '你来到了这个世界，开始了新的人生旅程。',
          attributeChanges: { health: 5 },
        },
        failureOutcome: {
          description: '生命的开始总是伴随着未知。',
          attributeChanges: {},
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 婴儿期 (1951年，1岁) ----
  {
    id: 'toddler_first_steps_1950',
    type: 'fixed',
    era: 0,
    ageRange: [1, 1],
    title: '蹒跚学步',
    baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => {
      if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。';
      if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。';
      return '你走得比别的孩子晚一些，但每一步都稳稳当当。';
    },
    options: [
      {
        id: 'explore_room',
        text: '在家里探索',
        successRate: { physique: 0.3, energy: 0.4 },
        successOutcome: {
          description: '你摸遍了家里的每个角落，对世界充满了好奇。',
          attributeChanges: { physique: 2, iq: 1 },
        },
        failureOutcome: {
          description: '你摔了一跤，哇哇大哭，但很快又爬了起来。',
          attributeChanges: { energy: -1 },
        },
      },
      {
        id: 'stay_close_parents',
        text: '依偎在父母身边',
        successRate: { eq: 0.5 },
        successOutcome: {
          description: '父母的怀抱给了你安全感，你笑得格外灿烂。',
          attributeChanges: { eq: 2, health: 1 },
        },
        failureOutcome: {
          description: '你有些认生，但父母的爱让你慢慢放松下来。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ---- 幼儿期 (1952年，2岁) ----
  {
    id: 'early_childhood_1950',
    type: 'fixed',
    era: 0,
    ageRange: [2, 2],
    title: '幼年时光',
    baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => {
      if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。';
      if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。';
      return '你躲在母亲身后，偷偷地看着这些陌生人。';
    },
    options: [
      {
        id: 'greet_guests',
        text: '主动打招呼',
        successRate: { eq: 0.5, network: 0.2 },
        successOutcome: {
          description: '你的大方得体让客人们都夸赞不已。',
          attributeChanges: { eq: 3, network: 2 },
        },
        failureOutcome: {
          description: '你喊错了称呼，惹得大人们哈哈大笑。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'play_alone',
        text: '自己玩玩具',
        successRate: { iq: 0.4 },
        successOutcome: {
          description: '你专注地摆弄着玩具，发现了新的玩法。',
          attributeChanges: { iq: 3 },
        },
        failureOutcome: {
          description: '玩具被你弄坏了，你哭了一场。',
          attributeChanges: {},
        },
      },
    ],
  },

  // ---- 土地改革见证 (1952-1953年，3岁) ----
  {
    id: 'land_reform_witness_1950',
    type: 'world_event',
    era: 0,
    ageRange: [3, 3],
    title: '土地改革',
    baseText: '村里来了工作队，土地改革运动开始了。{land_reform_context}',
    skinRule: (attrs) => {
      if (attrs.wealth >= 35) return '你家曾经有些田地，如今要分给穷人。父亲整日唉声叹气。';
      if (attrs.wealth >= 20) return '你家是中农，看着村里翻天覆地的变化，心情复杂。';
      return '你家终于分到了土地，父母脸上洋溢着从未有过的笑容。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的巨变。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_celebration',
        text: '参加庆祝活动',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你跟着大人们一起欢呼，感受到了集体的力量。',
          attributeChanges: { network: 3, energy: 1 },
        },
        failureOutcome: {
          description: '人太多，你被挤在中间，有些害怕。',
          attributeChanges: { energy: -1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 幼儿园 (1953-1954年，4岁) ----
  {
    id: 'kindergarten_1950',
    type: 'fixed',
    era: 0,
    ageRange: [4, 4],
    title: '幼儿园时光',
    baseText: '村里办了幼儿园，你有了和小朋友们一起玩耍的地方。',
    skinRule: (attrs) => {
      if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。';
      if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。';
      return '你有些害羞，但慢慢也适应了集体生活。';
    },
    options: [
      {
        id: 'make_friends',
        text: '交朋友',
        successRate: { eq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你和小伙伴们一起玩耍，度过了快乐的时光。',
          attributeChanges: { network: 4, eq: 2 },
        },
        failureOutcome: {
          description: '你和别人起了冲突，但很快就和好了。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'learn_songs',
        text: '学唱歌跳舞',
        successRate: { iq: 0.3, energy: 0.4 },
        successOutcome: {
          description: '你学会了第一首歌，回家唱给父母听。',
          attributeChanges: { iq: 2, fame: 2 },
        },
        failureOutcome: {
          description: '你总是跑调，但大家依然给你鼓掌。',
          attributeChanges: { energy: 1 },
        },
      },
    ],
  },

  // ---- 五反运动见证 (1955年，5岁) ----
  {
    id: 'five_anti_campaign_1950',
    type: 'world_event',
    era: 0,
    ageRange: [5, 5],
    title: '五反运动',
    baseText: '镇上开展了五反运动，{five_anti_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的店铺被调查，父母整日忧心忡忡。';
      if (attrs.network >= 40) return '你父亲因为为人正直，被工人们尊重。';
      return '你看到街上贴满了大字报，不太明白发生了什么。';
    },
    options: [
      {
        id: 'ask_parents',
        text: '问父母发生了什么',
        successRate: { iq: 0.5 },
        successOutcome: {
          description: '父母简单地给你解释了什么是守法与违法。',
          attributeChanges: { iq: 3, eq: 1 },
        },
        failureOutcome: {
          description: '父母只是摇摇头，让你不要多问。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'play_outside',
        text: '在外面玩耍',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你和小伙伴们无忧无虑地玩耍着。',
          attributeChanges: { physique: 2, health: 2 },
        },
        failureOutcome: {
          description: '你摔了一跤，膝盖破了皮。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
  },

  // ---- 启蒙之年 (1956年，6岁) ----
  {
    id: 'school_starts_1950',
    type: 'fixed',
    era: 0,
    ageRange: [6, 6],
    title: '背上书包',
    baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => {
      if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。';
      if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。';
      return '你不太想上学，但父亲说读书才能有出息。';
    },
    options: [
      {
        id: 'study_hard',
        text: '发奋读书',
        successRate: { iq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你的成绩突飞猛进，成为班级的尖子生。',
          attributeChanges: { iq: 5, energy: -2 },
        },
        failureOutcome: {
          description: '你虽然努力，但进步并不明显。',
          attributeChanges: { energy: -3 },
        },
      },
      {
        id: 'help_family',
        text: '帮家里干活',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你成为家里的好帮手，邻里都夸你懂事。',
          attributeChanges: { physique: 4, network: 3 },
        },
        failureOutcome: {
          description: '繁重的体力活让你疲惫不堪。',
          attributeChanges: { energy: -5 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 农业合作化 (1957年，7岁) ----
  {
    id: 'agricultural_cooperative_1950',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '农业合作化',
    baseText: '村里成立了农业生产合作社，{cooperative_context}。',
    skinRule: (attrs) => {
      if (attrs.network >= 45) return '你父亲被推选为合作社的干部，每天忙得不可开交。';
      if (attrs.wealth >= 35) return '你家的农具和牲口都入了社，母亲有些舍不得。';
      return '你跟着大人一起下田干活，虽然累但很充实。';
    },
    options: [
      {
        id: 'join_work',
        text: '参加集体劳动',
        successRate: { physique: 0.4, network: 0.3 },
        successOutcome: {
          description: '你学会了插秧和除草，感受到了劳动的快乐。',
          attributeChanges: { physique: 3, network: 2 },
        },
        failureOutcome: {
          description: '你太小了，帮了不少倒忙，但大家都不怪你。',
          attributeChanges: { physique: 1 },
        },
      },
      {
        id: 'study_after_work',
        text: '劳动后坚持学习',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你白天劳动晚上学习，成绩依然名列前茅。',
          attributeChanges: { iq: 4, energy: -2 },
        },
        failureOutcome: {
          description: '你太累了，上课总是打瞌睡。',
          attributeChanges: { energy: -3 },
        },
      },
    ],
  },

  // ---- 百花齐放 (1958年，8岁) ----
  {
    id: 'hundred_flowers_1950',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '百花齐放',
    baseText: '今年开展了"百花齐放、百家争鸣"运动，{hundred_flowers_context}。',
    skinRule: (attrs) => {
      if (attrs.iq >= 60) return '你父亲因为提了几句意见，被叫去谈话，母亲整日担心。';
      if (attrs.eq >= 55) return '你父亲谨言慎行，平安度过了这段日子。';
      return '你不太明白为什么大人们突然变得小心翼翼。';
    },
    options: [
      {
        id: 'observe_silently',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.4 },
        successOutcome: {
          description: '你学会了察言观色，明白了言多必失的道理。',
          attributeChanges: { eq: 4, iq: 2 },
        },
        failureOutcome: {
          description: '你不太理解为什么大家都不怎么说话了。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'focus_on_study',
        text: '专心读书',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你把精力都放在学习上，成绩突飞猛进。',
          attributeChanges: { iq: 5, energy: -1 },
        },
        failureOutcome: {
          description: '你虽然努力，但外面的世界让你无法专心。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
  },

  // ---- 大跃进 (1959年，9岁) ----
  {
    id: 'great_leap_forward_1950',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '大跃进年代',
    baseText: '1959年，大跃进运动如火如荼，{leap_forward_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来大炼钢铁，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起劳动，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_steel_furnace',
        text: '参加大炼钢铁',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但搬砖送水，为炼钢贡献了一份力量。',
          attributeChanges: { physique: 4, energy: -3 },
        },
        failureOutcome: {
          description: '你累倒了，休息了好几天才恢复。',
          attributeChanges: { health: -3, energy: -5 },
        },
      },
      {
        id: 'continue_studying',
        text: '继续努力学习',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你相信知识改变命运，更加刻苦学习。',
          attributeChanges: { iq: 5, fame: 1 },
        },
        failureOutcome: {
          description: '你虽然努力，但学习条件越来越差。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 时代过渡 (1959年末，9岁) ----
  {
    id: 'era_transition_1950',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '十年光阴',
    baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => {
      const achievements = [];
      if (attrs.iq >= 60) achievements.push('聪明好学');
      if (attrs.physique >= 60) achievements.push('身体健壮');
      if (attrs.network >= 50) achievements.push('人缘好');
      if (tags.length > 0) achievements.push(`获得了"${tags[0]}"的称号`);
      if (achievements.length === 0) return '你的童年平淡而快乐，没有什么特别的故事。';
      return `这十年里，你${achievements.join('、')}，童年充实而有意义。`;
    },
    options: [
      {
        id: 'look_forward',
        text: '展望未来',
        successRate: { energy: 0.3, eq: 0.3 },
        successOutcome: {
          description: '你满怀期待地准备迎接新的十年。',
          attributeChanges: { energy: 3, eq: 2 },
        },
        failureOutcome: {
          description: '你对未来有些迷茫，但依然充满希望。',
          attributeChanges: { energy: 1 },
        },
      },
    ],
    isMilestone: true,
  },
];

// ==========================================
// 辅助函数
// ==========================================

// 根据年龄获取对应阶段卡牌
export function getAgeSpecificCards(age: number): LifeCard[] {
  const index = Math.min(Math.floor(age / 10), 6);
  return AGE_SPECIFIC_CARDS[index] || [];
}

// 根据稀有度获取随机卡牌
export function getRandomCardByRarity(rarity: CardRarity): LifeCard {
  // 简化返回，实际应该按权重随机
  const pool = rarity === 'common'
    ? [...COMMON_ATTACK_CARDS, ...COMMON_SKILL_CARDS]
    : rarity === 'uncommon'
    ? [...RARE_CARDS]
    : rarity === 'rare'
    ? [...RARE_CARDS]
    : [...LEGENDARY_CARDS];
  return pool[0];
}

// 类型别名
type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

// ==========================================
// 年龄过滤工具函数
// ==========================================

/**
 * 检查卡牌是否适合指定年龄
 */
export function isCardAvailableForAge(card: LifeCard, age: number): boolean {
  if (!card.ageRange) return true; // null 表示全年龄段可用
  const [minAge, maxAge] = card.ageRange;
  return age >= minAge && age <= maxAge;
}

/**
 * 检查敌人是否适合指定年龄
 */
export function isEnemyAvailableForAge(enemy: Enemy, age: number): boolean {
  if (!enemy.ageRange) return true;
  const [minAge, maxAge] = enemy.ageRange;
  return age >= minAge && age <= maxAge;
}

/**
 * 检查事件是否适合指定年龄
 */
export function isEventAvailableForAge(event: GameEvent, age: number): boolean {
  if (!event.ageRange) return true;
  const [minAge, maxAge] = event.ageRange;
  return age >= minAge && age <= maxAge;
}

/**
 * 根据年龄过滤卡牌列表
 */
export function filterCardsByAge(cards: LifeCard[], age: number): LifeCard[] {
  return cards.filter(card => isCardAvailableForAge(card, age));
}

/**
 * 根据年龄过滤敌人列表
 */
export function filterEnemiesByAge(enemies: Enemy[], age: number): Enemy[] {
  return enemies.filter(enemy => isEnemyAvailableForAge(enemy, age));
}

/**
 * 根据年龄过滤事件列表
 */
export function filterEventsByAge(events: GameEvent[], age: number): GameEvent[] {
  return events.filter(event => isEventAvailableForAge(event, age));
}

/**
 * 获取指定年龄段可用的所有卡牌
 */
export function getAllCardsForAge(age: number): LifeCard[] {
  const allCards: LifeCard[] = [
    ...COMMON_ATTACK_CARDS,
    ...COMMON_SKILL_CARDS,
    ...RARE_CARDS,
    ...LEGENDARY_CARDS,
    ...CURSE_CARDS,
    ...CHILDHOOD_CARDS,
    ...ADOLESCENT_CARDS,
    ...YOUTH_CARDS,
    ...PRIME_CARDS,
    ...MIDDLE_AGE_CARDS,
    ...ELDERLY_CARDS,
    ...CULTIVATION_CARDS,
  ];

  // 110岁+ 添加修仙专属卡
  if (isCultivationAge(age)) {
    allCards.push(...CULTIVATION_CARDS_HIGH);
  }

  return filterCardsByAge(allCards, age);
}

/**
 * 获取指定年龄段可用的所有敌人
 */
export function getAllEnemiesForAge(age: number): Enemy[] {
  const allEnemies: Enemy[] = [
    ...COMMON_ENEMIES,
    ...ELITE_ENEMIES,
    ...CHILDHOOD_ENEMIES,
    ...ADOLESCENT_ENEMIES,
    ...YOUTH_ENEMIES,
    ...PRIME_ENEMIES,
    ...MIDDLE_AGE_ENEMIES,
    ...ELDERLY_ENEMIES,
  ];
  return filterEnemiesByAge(allEnemies, age);
}

/**
 * 根据年龄获取对应年龄段名称
 */
export function getAgeStageName(age: number): string {
  if (age < 6) return '婴幼儿';
  if (age < 10) return '童年';
  if (age < 14) return '少年';
  if (age < 18) return '青少年';
  if (age < 22) return '大学';
  if (age < 30) return '青年';
  if (age < 40) return '壮年';
  if (age < 50) return '中年';
  if (age < 60) return '知天命';
  if (age < 70) return '花甲';
  if (age < 80) return '古稀';
  if (age < 90) return '杖朝';
  if (age < 100) return '期颐';
  if (age <= 110) return '长寿之星';
  return '传奇人生';
}

/**
 * 检查是否进入修仙范围
 */
export function isCultivationAge(age: number): boolean {
  return age > 110;
}

/**
 * 获取修仙境界
 */
export function getCultivationRealm(age: number): CultivationRealm | null {
  if (age <= 110) return null;
  if (age <= 130) return 'qi_refining';
  if (age <= 160) return 'foundation';
  if (age <= 200) return 'golden_core';
  if (age <= 260) return 'nascent';
  if (age <= 340) return 'spirit';
  if (age <= 450) return 'void';
  if (age <= 580) return 'integration';
  if (age <= 750) return 'mahayana';
  return 'tribulation';
}

// 根据时代获取敌人池（支持年龄过滤）
export function getEnemyPool(era: number, age?: number): Enemy[] {
  // 110岁+ 进入修仙模式
  if (age !== undefined && isCultivationAge(age)) {
    return getCultivationEnemies(age);
  }

  let pool: Enemy[] = [...COMMON_ENEMIES];
  if (era >= 1) pool.push(...ELITE_ENEMIES);

  // 根据年龄添加专属敌人
  if (age !== undefined) {
    if (age < 10) pool.push(...CHILDHOOD_ENEMIES);
    if (age >= 10 && age < 20) pool.push(...ADOLESCENT_ENEMIES);
    if (age >= 20 && age < 30) pool.push(...YOUTH_ENEMIES);
    if (age >= 30 && age < 55) pool.push(...PRIME_ENEMIES);
    if (age >= 40 && age < 70) pool.push(...MIDDLE_AGE_ENEMIES);
    if (age >= 55) pool.push(...ELDERLY_ENEMIES);

    // 过滤出适合当前年龄的敌人
    pool = filterEnemiesByAge(pool, age);
  }

  return pool;
}

/**
 * 获取修仙专属敌人
 */
export function getCultivationEnemies(age: number): Enemy[] {
  const pool: Enemy[] = [];

  if (age >= 111 && age <= 150) {
    pool.push(...CULTIVATION_ENTRY_ENEMIES);
  }
  if (age >= 130 && age <= 250) {
    pool.push(...CULTIVATION_MID_ENEMIES);
  }
  if (age >= 200) {
    pool.push(...CULTIVATION_LATE_ENEMIES);
  }

  return filterEnemiesByAge(pool, age);
}

/**
 * 获取修仙Boss
 */
export function getCultivationBoss(age: number): Enemy | null {
  if (age >= 111 && age <= 130) {
    return CULTIVATION_BOSSES_AGE[0]; // 凡尘了结
  }
  if (age >= 180 && age <= 220) {
    return CULTIVATION_BOSSES_AGE[1]; // 金丹天劫
  }
  if (age >= 240 && age <= 300) {
    return CULTIVATION_BOSSES_AGE[2]; // 元婴天劫
  }
  if (age >= 700 && age <= 800) {
    return CULTIVATION_BOSSES_AGE[3]; // 飞升天劫
  }
  return null;
}

// 根据时代获取Boss（支持年龄过滤）
export function getBossByEra(era: number, age?: number): Enemy {
  // 修仙模式
  if (age !== undefined && isCultivationAge(age)) {
    const cultivationBoss = getCultivationBoss(age);
    if (cultivationBoss) return cultivationBoss;
  }

  if (age !== undefined) {
    // 根据年龄选择合适的Boss
    if (age >= 90) {
      return BOSS_ENEMIES[1]; // 人生终考
    }
    if (age >= 70) {
      return BOSS_ENEMIES[0]; // 社会责任巨兽
    }
    if (age >= 50) {
      return BOSS_ENEMIES[2]; // 无限质疑
    }
    if (age >= 25) {
      return BOSS_ENEMIES[2]; // 无限质疑
    }
  }
  const idx = era % BOSS_ENEMIES.length;
  return BOSS_ENEMIES[idx];
}

// 计算敌人实际伤害
export function calculateEnemyDamage(intent: { type: string; damage?: number; hits?: number }, enemy: Enemy): number {
  if (intent.type !== 'attack' || !intent.damage) return 0;
  const hits = intent.hits || 1;
  let damage = intent.damage * hits;
  // 力量加成
  const strength = enemy.statusEffects.find((e) => e.type === 'strength');
  if (strength) damage += strength.value * hits;
  return Math.max(0, damage);
}


