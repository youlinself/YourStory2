import type {
  EraDefinition,
  HiddenTag,
  LifeCard,
  LifeRelic,
  Enemy,
  CultivationRealm,
  GameEvent,
  StatusEffect,
  EnemyMechanic,
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
    attributePoints: 15,
  },
  {
    year: 1960,
    name: '风云年代',
    baseLifeExpectancy: 72,
    description: '社会剧烈变革的十年，有人乘风破浪，有人随波逐流。',
    initialWealthRange: [5, 20],
    initialNetworkRange: [15, 45],
    attributePoints: 15,
  },
  {
    year: 1970,
    name: '转折前夜',
    baseLifeExpectancy: 75,
    description: '黎明前的黑暗即将过去，新时代的曙光即将到来。',
    initialWealthRange: [8, 25],
    initialNetworkRange: [15, 40],
    attributePoints: 16,
  },
  {
    year: 1980,
    name: '改革春风',
    baseLifeExpectancy: 77,
    description: '思想解放的浪潮席卷大地，到处都是创业的声音。',
    initialWealthRange: [10, 35],
    initialNetworkRange: [15, 50],
    attributePoints: 16,
  },
  {
    year: 1990,
    name: '下海浪潮',
    baseLifeExpectancy: 79,
    description: '体制变革带来巨大的机遇和风险，敢问路在何方。',
    initialWealthRange: [15, 45],
    initialNetworkRange: [20, 55],
    attributePoints: 17,
  },
  {
    year: 2000,
    name: '信息纪元',
    baseLifeExpectancy: 81,
    description: '互联网浪潮来临，世界开始连接，新的规则正在建立。',
    initialWealthRange: [20, 55],
    initialNetworkRange: [20, 60],
    attributePoints: 17,
  },
  {
    year: 2010,
    name: '移动互联',
    baseLifeExpectancy: 83,
    description: '智能手机普及，让每个人都能触摸到整个世界。',
    initialWealthRange: [25, 60],
    initialNetworkRange: [25, 65],
    attributePoints: 18,
  },
  {
    year: 2020,
    name: '智能纪元',
    baseLifeExpectancy: 85,
    description: 'AI、大数据、元宇宙...科技与生活的边界正在模糊。',
    initialWealthRange: [30, 65],
    initialNetworkRange: [30, 70],
    attributePoints: 18,
  },
  {
    year: 2030,
    name: '能源革命',
    baseLifeExpectancy: 88,
    description: '新能源技术突破，传统行业正在重新洗牌。',
    initialWealthRange: [35, 70],
    initialNetworkRange: [30, 75],
    attributePoints: 19,
  },
  {
    year: 2040,
    name: '星际黎明',
    baseLifeExpectancy: 92,
    description: '太空商业化起步，人类的视野投向星辰大海。',
    initialWealthRange: [40, 75],
    initialNetworkRange: [35, 80],
    attributePoints: 19,
  },
  {
    year: 2050,
    name: '共生时代',
    baseLifeExpectancy: 97,
    description: '人机融合成为常态，生命的定义正在被改写。',
    initialWealthRange: [45, 80],
    initialNetworkRange: [40, 85],
    attributePoints: 20,
  },
  {
    year: 2060,
    name: '深空纪元',
    baseLifeExpectancy: 105,
    description: '太阳系殖民成为现实，人类的脚步不再局限于地球。',
    initialWealthRange: [50, 85],
    initialNetworkRange: [45, 90],
    attributePoints: 21,
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
  },
];

// 史诗/传说卡
export const LEGENDARY_CARDS: LifeCard[] = [
  {
    id: 'destiny_choice',
    name: '命运抉择',
    type: 'skill',
    rarity: 'legendary',
    cost: 3,
    target: 'self',
    effects: [
      { type: 'draw', value: 3 },
      { type: 'gain_energy', value: 2 },
      { type: 'gain_max_energy', value: 1 },
    ],
    description: '在人生的十字路口，你做出了正确的选择',
    icon: '💫',
    tags: ['命运'],
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
  },
];

// 修仙模式专属卡
export const CULTIVATION_CARDS: LifeCard[] = [
  {
    id: 'qi_absorption',
    name: '吐纳练气',
    type: 'power',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ type: 'heal', value: 2 }, { type: 'regen', value: 1, duration: 99 }],
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
      { type: 'rage', value: 3, duration: 99 },
      { type: 'strength', value: 2, duration: 99 },
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
      { type: 'thorns', value: 5, duration: 99 },
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
    },
    {
      id: 'wisdom_of_ages',
      name: '岁月沉淀',
      type: 'power',
      rarity: 'rare',
      cost: 2,
      target: 'self',
      effects: [{ type: 'strength', value: 1, duration: 99 }, { type: 'dexterity', value: 1, duration: 99 }],
      description: '历经风雨后的从容与智慧',
      icon: '🧘',
      tags: ['中年', '智慧'],
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
    statusEffects: [{ type: 'block', value: 5, duration: 99 }],
    icon: '🗿',
    isBoss: false,
    cardRewards: [COMMON_ATTACK_CARDS[0], COMMON_ATTACK_CARDS[1], RARE_CARDS[1]],
    goldReward: [10, 25],
    description: '家庭、工作、社会责任...你无法逃避',
    mechanics: [] as EnemyMechanic[],
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
    statusEffects: [{ type: 'strength', value: 1, duration: 99 }],
    icon: '😈',
    isBoss: false,
    cardRewards: [RARE_CARDS[1], RARE_CARDS[2], LEGENDARY_CARDS[0]],
    goldReward: [30, 60],
    description: '996的阴影笼罩着你',
    mechanics: ['shield'] as EnemyMechanic[],
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
    statusEffects: [{ type: 'block', value: 10, duration: 99 }],
    icon: '🏛️',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[0], LEGENDARY_CARDS[1], RARE_CARDS[2]],
    relicReward: BOSS_RELICS[0],
    goldReward: [50, 100],
    description: '作为社会的一员，你别无选择',
    mechanics: ['double_attack', 'shield'] as EnemyMechanic[],
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
    statusEffects: [{ type: 'strength', value: 2, duration: 99 }],
    icon: '⚖️',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[0], LEGENDARY_CARDS[1], RARE_CARDS[2]],
    relicReward: BOSS_RELICS[1],
    goldReward: [80, 150],
    description: '回顾你的一生，你满意吗？',
    mechanics: ['double_attack', 'regen'] as EnemyMechanic[],
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
      { type: 'strength', value: 3, duration: 99 },
      { type: 'artifact', value: 1, duration: 99 },
    ],
    icon: '🌀',
    isBoss: true,
    cardRewards: [LEGENDARY_CARDS[1], RARE_CARDS[2], RARE_CARDS[0]],
    relicReward: BOSS_RELICS[1],
    goldReward: [100, 200],
    description: '你内心最深处的恐惧',
    mechanics: ['double_attack', 'shield', 'rage'] as EnemyMechanic[],
  },
];

// 修仙Boss
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
    statusEffects: [{ type: 'block', value: 20, duration: 99 }],
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
// 修仙境界
// ==========================================
export const CULTIVATION_REALMS: Record<
  CultivationRealm,
  { name: string; lifespanBonus: number; threshold: number; icon: string }
> = {
  mortal: { name: '凡人', lifespanBonus: 0, threshold: 0, icon: '👤' },
  qi_refining: { name: '炼气期', lifespanBonus: 10, threshold: 50, icon: '🌬️' },
  foundation: { name: '筑基期', lifespanBonus: 25, threshold: 80, icon: '🧱' },
  golden_core: { name: '金丹期', lifespanBonus: 50, threshold: 120, icon: '🔥' },
  nascent: { name: '元婴期', lifespanBonus: 80, threshold: 170, icon: '👶' },
  spirit: { name: '化神期', lifespanBonus: 120, threshold: 230, icon: '👻' },
  void: { name: '炼虚期', lifespanBonus: 170, threshold: 300, icon: '🌀' },
  integration: { name: '合体期', lifespanBonus: 230, threshold: 380, icon: '🤝' },
  mahayana: { name: '大乘期', lifespanBonus: 300, threshold: 470, icon: '🎯' },
  tribulation: { name: '渡劫期', lifespanBonus: 400, threshold: 570, icon: '⚡' },
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
  energy: '决定行动力与精力上限，影响每回合可出牌数量及事件成功率',
  physique: '身体素质与力量，影响战斗伤害、体力活动成功率及寿命',
  health: '身体健康状况，影响生命值上限、恢复速度及疾病抵抗力',
  iq: '智力与学识，影响技能卡效果、事件判断成功率及卡牌奖励',
  eq: '情商与社交智慧，影响人脉拓展、NPC关系建立及事件成功率',
  wealth: '金钱与物质资源，影响商店购买力、初始资产及投资回报',
  network: '人脉与社会关系，影响随机事件质量、NPC互动及信息获取',
  fame: '名声与社会影响力，影响事件卡奖励、特殊选项解锁及结局评价',
};

// ==========================================
// 1950年代事件（兼容旧系统）
// ==========================================
export const SCRIPT_1950_EVENTS: GameEvent[] = [
  {
    id: 'born_1950',
    type: 'world_event',
    era: 0,
    title: '呱呱坠地',
    baseText: '{family_situation}。你来到了这个世界。',
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
  {
    id: 'childhood_1950',
    type: 'fixed',
    era: 0,
    title: '童年印象',
    baseText: '到了上学的年纪，{school_experience}。',
    skinRule: (attrs, _history) => {
      if (attrs.iq >= 65 && attrs.wealth >= 30) return '你在学校表现优异，老师们都很喜欢你。';
      if (attrs.iq >= 65) return '你聪明好学，但家里学费凑得吃力。每天你都在油灯下写作业。';
      if (attrs.physique >= 60) return '你不太爱读书，但身体健壮，是同龄孩子里的孩子王。';
      return '你的童年过得平平淡淡。';
    },
    options: [
      {
        id: 'study_hard',
        text: '发奋读书',
        successRate: { iq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你的成绩突飞猛进，成为班级的尖子生。',
          attributeChanges: { iq: 5 },
          goldReward: 50,
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

// 根据时代获取敌人池
export function getEnemyPool(era: number): Enemy[] {
  const pool = [...COMMON_ENEMIES];
  if (era >= 1) pool.push(...ELITE_ENEMIES);
  return pool;
}

// 根据时代获取Boss
export function getBossByEra(era: number): Enemy {
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

// 计算实际伤害（考虑各种加成）
export function calculateDamage(baseDamage: number, attackerEffects: StatusEffect[], defenderEffects: StatusEffect[]): number {
  let damage = baseDamage;

  // 攻击者加成
  const strength = attackerEffects.find((e) => e.type === 'strength');
  if (strength) damage += strength.value;
  const rage = attackerEffects.find((e) => e.type === 'rage');
  if (rage) damage = Math.floor(damage * 1.5);

  // 防御者加成
  const vulnerable = defenderEffects.find((e) => e.type === 'vulnerable');
  if (vulnerable) damage = Math.floor(damage * 1.25);
  const intangible = defenderEffects.find((e) => e.type === 'intangible');
  if (intangible) damage = 1;

  return Math.max(0, damage);
}
