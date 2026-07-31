import type { BondCardDefinition, BondRarity, BondGroupDefinition } from '../types/bond';

// ==========================================
// 羁绊卡牌数据库
// ==========================================

const RARITY_WEIGHTS: Record<BondRarity, number> = {
  common: 40,
  uncommon: 25,
  rare: 10,
  legendary: 3,
};

export const BOND_CARDS: BondCardDefinition[] = [
  // ---- 家人 ----
  {
    id: 'father',
    name: '父亲',
    category: 'family',
    icon: '👨',
    rarity: 'uncommon',
    description: '给予你生命的男人，家中的顶梁柱',
    flavorText: '他总是沉默，但目光从未离开过你',
    minAge: 0,
    maxAge: 90,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'mother',
    name: '母亲',
    category: 'family',
    icon: '👩',
    rarity: 'uncommon',
    description: '给予你温暖的女人，家中的港湾',
    flavorText: '厨房的灯光，永远为你亮着',
    minAge: 0,
    maxAge: 90,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'elder_brother',
    name: '哥哥',
    category: 'family',
    icon: '👦',
    rarity: 'common',
    description: '从小保护你的兄长',
    flavorText: '有他在，你永远不用担心被欺负',
    minAge: 0,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'elder_sister',
    name: '姐姐',
    category: 'family',
    icon: '👧',
    rarity: 'common',
    description: '疼爱你的姐姐',
    flavorText: '她会偷偷把零花钱塞进你的口袋',
    minAge: 0,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'younger_brother',
    name: '弟弟',
    category: 'family',
    icon: '👶',
    rarity: 'common',
    description: '你看着长大的弟弟',
    flavorText: '跟在你身后的小尾巴，不知不觉已经比你高了',
    minAge: 5,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'younger_sister',
    name: '妹妹',
    category: 'family',
    icon: '👧',
    rarity: 'common',
    description: '跟在你身后的小妹',
    flavorText: '她总是缠着你讲故事，直到睡着',
    minAge: 5,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'grandfather',
    name: '祖父',
    category: 'family',
    icon: '👴',
    rarity: 'uncommon',
    description: '家族的长辈，智慧的传承者',
    flavorText: '他的皱纹里，藏着整个家族的故事',
    minAge: 0,
    maxAge: 70,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'grandmother',
    name: '祖母',
    category: 'family',
    icon: '👵',
    rarity: 'uncommon',
    description: '慈祥的祖母，家族的情感纽带',
    flavorText: '她的怀抱，是世界上最温暖的地方',
    minAge: 0,
    maxAge: 70,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'spouse',
    name: '伴侣',
    category: 'family',
    icon: '💑',
    rarity: 'rare',
    description: '陪伴你走过人生旅途的人',
    flavorText: '茫茫人海中，你们选择了彼此',
    minAge: 18,
    maxAge: 100,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },
  {
    id: 'child',
    name: '子女',
    category: 'family',
    icon: '👨‍👩‍👧',
    rarity: 'rare',
    description: '你生命的延续',
    flavorText: '看着他的眼睛，你看到了整个世界的未来',
    minAge: 20,
    maxAge: 100,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },

  // ---- 友谊 ----
  {
    id: 'childhood_friend',
    name: '发小',
    category: 'friendship',
    icon: '🤝',
    rarity: 'common',
    description: '从小一起长大的伙伴',
    flavorText: '你们的秘密基地，只有彼此知道',
    minAge: 3,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'good_friend',
    name: '好友',
    category: 'friendship',
    icon: '👫',
    rarity: 'common',
    description: '无话不谈的知心朋友',
    flavorText: '深夜的电话，不用开口就知道是谁',
    minAge: 10,
    maxAge: 100,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'best_friend',
    name: '挚友',
    category: 'friendship',
    icon: '💛',
    rarity: 'rare',
    description: '可以托付后背的挚友',
    flavorText: '无需多言，一个眼神便懂',
    minAge: 12,
    maxAge: 100,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },
  {
    id: 'neighbor',
    name: '邻居',
    category: 'friendship',
    icon: '🏘️',
    rarity: 'common',
    description: '住在隔壁的邻居',
    flavorText: '见面点头微笑，远亲不如近邻',
    minAge: 0,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },

  // ---- 学业 ----
  {
    id: 'elementary_classmate',
    name: '小学同学',
    category: 'education',
    icon: '📚',
    rarity: 'common',
    description: '小学时代的同窗',
    flavorText: '同桌的那条三八线，你还记得吗',
    minAge: 6,
    maxAge: 60,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'middle_classmate',
    name: '中学同学',
    category: 'education',
    icon: '📖',
    rarity: 'common',
    description: '中学时代的同窗',
    flavorText: '青春期的烦恼，你们一起度过',
    minAge: 12,
    maxAge: 60,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'high_classmate',
    name: '高中同学',
    category: 'education',
    icon: '🎒',
    rarity: 'uncommon',
    description: '高中时代的同窗',
    flavorText: '为了同一个目标，你们并肩作战',
    minAge: 15,
    maxAge: 60,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'college_classmate',
    name: '大学同学',
    category: 'education',
    icon: '🎓',
    rarity: 'uncommon',
    description: '大学时代的同窗',
    flavorText: '象牙塔里，你们一起憧憬未来',
    minAge: 18,
    maxAge: 60,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'teacher',
    name: '恩师',
    category: 'education',
    icon: '👨‍🏫',
    rarity: 'rare',
    description: '改变你人生的老师',
    flavorText: '粉笔灰染白了他的头发，却点亮了你的人生',
    minAge: 6,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },
  {
    id: 'mentor',
    name: '导师',
    category: 'education',
    icon: '🧙',
    rarity: 'rare',
    description: '指引你前进方向的导师',
    flavorText: '在你迷茫的时候，他为你点亮一盏灯',
    minAge: 15,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },

  // ---- 事业 ----
  {
    id: 'colleague',
    name: '同事',
    category: 'career',
    icon: '💼',
    rarity: 'common',
    description: '一起工作的同事',
    flavorText: '每天相处8小时的人，比家人还久',
    minAge: 18,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.common,
  },
  {
    id: 'boss',
    name: '上司',
    category: 'career',
    icon: '👔',
    rarity: 'uncommon',
    description: '你的直属上司',
    flavorText: '他严厉的背后，是恨铁不成钢',
    minAge: 20,
    maxAge: 70,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },
  {
    id: 'partner',
    name: '合伙人',
    category: 'career',
    icon: '🤝',
    rarity: 'rare',
    description: '共同创业的伙伴',
    flavorText: '你们一起喝过的酒，比水还多',
    minAge: 22,
    maxAge: 80,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },
  {
    id: 'rival',
    name: '竞争对手',
    category: 'career',
    icon: '⚔️',
    rarity: 'uncommon',
    description: '与你势均力敌的对手',
    flavorText: '没有你的对手，你不会这么强',
    minAge: 18,
    maxAge: 70,
    appearWeight: RARITY_WEIGHTS.uncommon,
  },

  // ---- 爱情 ----
  {
    id: 'first_love',
    name: '初恋',
    category: 'romance',
    icon: '💕',
    rarity: 'legendary',
    description: '第一次心动的人',
    flavorText: '那年夏天，风刚好吹过她的发梢',
    minAge: 14,
    maxAge: 60,
    appearWeight: RARITY_WEIGHTS.legendary,
    isRare: true,
  },
  {
    id: 'lover',
    name: '恋人',
    category: 'romance',
    icon: '💘',
    rarity: 'rare',
    description: '与你相知相守的人',
    flavorText: '所有的巧合，都是命运的安排',
    minAge: 16,
    maxAge: 100,
    appearWeight: RARITY_WEIGHTS.rare,
    isRare: true,
  },
];

// ==========================================
// 卡牌映射
// ==========================================

export const BOND_CARD_MAP: Record<string, BondCardDefinition> = Object.fromEntries(
  BOND_CARDS.map((c) => [c.id, c])
);

// ==========================================
// 稀有度配置
// ==========================================

export const RARITY_CONFIG: Record<BondRarity, { label: string; color: string; bgColor: string; glowColor: string }> = {
  common: {
    label: '普通',
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.15)',
    glowColor: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    label: '稀有',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    glowColor: 'rgba(52, 211, 153, 0.3)',
  },
  rare: {
    label: '珍贵',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    glowColor: 'rgba(96, 165, 250, 0.3)',
  },
  legendary: {
    label: '传说',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    glowColor: 'rgba(251, 191, 36, 0.4)',
  },
};

/** 属性名称映射 */
export const ATTRIBUTE_NAMES: Record<string, string> = {
  health: '生命',
  iq: '智力',
  eq: '情商',
  energy: '精力',
  network: '人脉',
  physique: '体魄',
  wealth: '财富',
  fame: '名声',
};

// ==========================================
// 羁绊组合定义
// ==========================================

export const BOND_GROUPS: BondGroupDefinition[] = [
  // ---- 家庭羁绊 ----
  {
    id: 'family_love',
    name: '天伦之乐',
    description: '家人团聚，其乐融融',
    icon: '👨‍👩‍👧‍👦',
    requiredCards: ['father', 'mother'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { health: 5, eq: 3 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '和睦之家',
        description: '家庭和睦，基础属性提升',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { health: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '幸福之家',
        description: '家庭幸福，额外获得生命加成',
        duplicateCardsRequired: 3,
        rewards: [{ type: 'attribute', attributeBonus: { health: 10, eq: 5 } }],
      },
      {
        tier: 3,
        name: '模范之家',
        description: '令人羡慕的模范家庭',
        duplicateCardsRequired: 6,
        rewards: [{ type: 'attribute', attributeBonus: { health: 15, eq: 8, energy: 3 } }],
      },
    ],
  },
  {
    id: 'siblings_bond',
    name: '手足情深',
    description: '兄弟姐妹间深厚的情谊',
    icon: '👫',
    requiredCards: ['elder_brother', 'younger_brother'],
    requireAll: false,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { network: 5, physique: 3 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '兄弟同心',
        description: '兄弟齐心，其利断金',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, physique: 3 } }],
      },
      {
        tier: 2,
        name: '情深义重',
        description: '情深义重，关键时刻互相扶持',
        duplicateCardsRequired: 3,
        rewards: [{ type: 'attribute', attributeBonus: { network: 8, physique: 5, health: 3 } }],
      },
    ],
  },
  {
    id: 'three_generations',
    name: '三代同堂',
    description: '祖孙三代，传承与希望',
    icon: '🏠',
    requiredCards: ['grandfather', 'father', 'child'],
    requireAll: true,
    rewards: [
      {
        type: 'passive',
        passiveDescription: '每回合开始获得3点格挡（家族庇护）',
        passiveId: 'family_shelter',
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '薪火相传',
        description: '家族智慧代代相传',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, eq: 5 } }],
      },
      {
        tier: 2,
        name: '家族荣耀',
        description: '家族兴旺，获得特殊遗物',
        duplicateCardsRequired: 5,
        rewards: [
          {
            type: 'relic',
            relicReward: {
              id: 'family_legacy',
              name: '传家之宝',
              rarity: 'rare',
              description: '家族世代相传的宝物，蕴含家族的力量',
              icon: '🏺',
              stackable: false,
              effects: [{ type: 'max_health_bonus', value: 15 }, { type: 'card_draw_bonus', value: 1 }],
            },
          },
        ],
      },
    ],
  },

  // ---- 友谊羁绊 ----
  {
    id: 'childhood_friends',
    name: '青梅竹马',
    description: '从小一起长大的伙伴',
    icon: '🌸',
    requiredCards: ['childhood_friend', 'childhood_friend'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { network: 8, eq: 5 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '童年玩伴',
        description: '一起玩耍的童年伙伴',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '莫逆之交',
        description: '无话不谈的好朋友',
        duplicateCardsRequired: 3,
        rewards: [{ type: 'attribute', attributeBonus: { network: 8, eq: 5, health: 3 } }],
      },
      {
        tier: 3,
        name: '生死之交',
        description: '可以托付生死的挚友',
        duplicateCardsRequired: 6,
        rewards: [
          {
            type: 'card',
            cardReward: {
              id: 'friendship_card',
              name: '友谊之力',
              type: 'skill',
              rarity: 'rare',
              cost: 1,
              target: 'self',
              effects: [{ type: 'block', value: 8 }, { type: 'heal', value: 5 }, { type: 'draw', value: 1 }],
              description: '友谊的力量让你无所畏惧',
              icon: '🤝',
              tags: ['友谊', '羁绊'],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'best_friends',
    name: '莫逆之交',
    description: '人生得一知己足矣',
    icon: '💛',
    requiredCards: ['best_friend'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { network: 10, eq: 8, energy: 3 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '知心好友',
        description: '心有灵犀一点通',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, eq: 5 } }],
      },
      {
        tier: 2,
        name: '生死与共',
        description: '患难与共，荣辱相依',
        duplicateCardsRequired: 4,
        rewards: [
          { type: 'attribute', attributeBonus: { network: 10, eq: 8, energy: 3 } },
          {
            type: 'relic',
            relicReward: {
              id: 'friendship_pendant',
              name: '友谊信物',
              rarity: 'rare',
              description: '挚友赠送的信物，蕴含深厚友谊',
              icon: '📿',
              stackable: false,
              effects: [{ type: 'card_draw_bonus', value: 1 }, { type: 'energy_bonus', value: 1 }],
            },
          },
        ],
      },
    ],
  },

  // ---- 学业羁绊 ----
  {
    id: 'classmates_reunion',
    name: '同窗之谊',
    description: '一起度过校园时光的同学们',
    icon: '📚',
    requiredCards: ['elementary_classmate', 'middle_classmate', 'high_classmate'],
    requireAll: false,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { iq: 5, network: 5 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '同学聚会',
        description: '老同学相聚，回忆满满',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 3, network: 3 } }],
      },
      {
        tier: 2,
        name: '校友网络',
        description: '遍布各行各业的校友资源',
        duplicateCardsRequired: 4,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, network: 8, wealth: 3 } }],
      },
    ],
  },
  {
    id: 'teachers_grace',
    name: '师恩如山',
    description: '恩师的教诲，改变你的一生',
    icon: '👨‍🏫',
    requiredCards: ['teacher'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { iq: 10, eq: 5 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '启蒙之恩',
        description: '老师开启了你的智慧之门',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '再造之恩',
        description: '老师改变了你的人生轨迹',
        duplicateCardsRequired: 3,
        rewards: [
          { type: 'attribute', attributeBonus: { iq: 10, eq: 5 } },
          {
            type: 'relic',
            relicReward: {
              id: 'teacher_gift',
              name: '恩师赠书',
              rarity: 'rare',
              description: '恩师赠送的书籍，蕴含毕生所学',
              icon: '📖',
              stackable: false,
              effects: [{ type: 'card_draw_bonus', value: 1 }, { type: 'attribute_scaling', value: 0.15, attribute: 'iq' }],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'mentor_guidance',
    name: '名师指路',
    description: '导师的指引，让你少走弯路',
    icon: '🧙',
    requiredCards: ['mentor'],
    requireAll: true,
    rewards: [
      {
        type: 'passive',
        passiveDescription: '每回合额外抽1张牌（导师启发）',
        passiveId: 'mentor_inspiration',
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '初窥门径',
        description: '导师带你入门',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 8, energy: 3 } }],
      },
      {
        tier: 2,
        name: '登堂入室',
        description: '你已经掌握了核心要领',
        duplicateCardsRequired: 4,
        rewards: [
          { type: 'attribute', attributeBonus: { iq: 12, energy: 5 } },
          {
            type: 'card',
            cardReward: {
              id: 'mentor_secret',
              name: '导师秘传',
              type: 'power',
              rarity: 'legendary',
              cost: 2,
              target: 'self',
              effects: [{ type: 'draw', value: 3 }, { type: 'gain_energy', value: 2 }],
              description: '导师秘传的心法，让你事半功倍',
              icon: '🧙',
              tags: ['导师', '羁绊'],
            },
          },
        ],
      },
    ],
  },

  // ---- 事业羁绊 ----
  {
    id: 'work_partners',
    name: '事业伙伴',
    description: '一起打拼事业的伙伴',
    icon: '💼',
    requiredCards: ['colleague', 'partner'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { wealth: 8, network: 5 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '初出茅庐',
        description: '刚入职场的新人',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { wealth: 3, network: 3 } }],
      },
      {
        tier: 2,
        name: '事业有成',
        description: '事业蒸蒸日上',
        duplicateCardsRequired: 3,
        rewards: [{ type: 'attribute', attributeBonus: { wealth: 8, network: 5, fame: 3 } }],
      },
      {
        tier: 3,
        name: '商业帝国',
        description: '建立起自己的商业帝国',
        duplicateCardsRequired: 6,
        rewards: [
          {
            type: 'relic',
            relicReward: {
              id: 'business_empire',
              name: '商业帝国',
              rarity: 'legendary',
              description: '你一手创建的商业帝国',
              icon: '🏛️',
              stackable: false,
              effects: [{ type: 'discount', value: 0.2 }, { type: 'max_health_bonus', value: 20 }],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'worthy_rival',
    name: '棋逢对手',
    description: '强大的对手让你变得更强',
    icon: '⚔️',
    requiredCards: ['rival'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { physique: 5, iq: 5, energy: 3 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '初次交锋',
        description: '第一次遇到势均力敌的对手',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { physique: 3, iq: 3 } }],
      },
      {
        tier: 2,
        name: '亦敌亦友',
        description: '竞争中互相成就',
        duplicateCardsRequired: 3,
        rewards: [
          { type: 'attribute', attributeBonus: { physique: 5, iq: 5, energy: 3 } },
          {
            type: 'card',
            cardReward: {
              id: 'rival_inspiration',
              name: '对手激励',
              type: 'attack',
              rarity: 'uncommon',
              cost: 1,
              target: 'enemy',
              effects: [{ type: 'damage', value: 10 }, { type: 'strength', value: 2, duration: 2 }],
              description: '对手的存在激励你变得更强',
              icon: '⚔️',
              tags: ['对手', '羁绊'],
            },
          },
        ],
      },
    ],
  },

  // ---- 爱情羁绊 ----
  {
    id: 'first_love_memory',
    name: '初恋回忆',
    description: '那份纯真的感情，永远珍藏在心底',
    icon: '💕',
    requiredCards: ['first_love'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { eq: 10, health: 3 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '青涩回忆',
        description: '那份青涩的甜蜜',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { eq: 5 } }],
      },
      {
        tier: 2,
        name: '刻骨铭心',
        description: '即使分开，也永远铭记',
        duplicateCardsRequired: 3,
        rewards: [
          { type: 'attribute', attributeBonus: { eq: 10, health: 3 } },
          {
            type: 'relic',
            relicReward: {
              id: 'first_love_token',
              name: '定情信物',
              rarity: 'rare',
              description: '初恋赠送的信物，承载美好回忆',
              icon: '💌',
              stackable: false,
              effects: [{ type: 'max_health_bonus', value: 10 }, { type: 'heal_on_rest', value: 5 }],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'true_love',
    name: '真爱永恒',
    description: '与你相知相守的伴侣',
    icon: '💘',
    requiredCards: ['lover', 'spouse'],
    requireAll: true,
    rewards: [
      {
        type: 'passive',
        passiveDescription: '每回合回复2点生命（伴侣照顾）',
        passiveId: 'lover_care',
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '相知相守',
        description: '相互扶持，共同成长',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { eq: 5, health: 5 } }],
      },
      {
        tier: 2,
        name: '白头偕老',
        description: '愿得一心人，白头不相离',
        duplicateCardsRequired: 5,
        rewards: [
          { type: 'attribute', attributeBonus: { eq: 10, health: 10, energy: 3 } },
          {
            type: 'relic',
            relicReward: {
              id: 'wedding_ring',
              name: '婚戒',
              rarity: 'legendary',
              description: '象征永恒爱情的婚戒',
              icon: '💍',
              stackable: false,
              effects: [{ type: 'max_health_bonus', value: 20 }, { type: 'heal_on_rest', value: 5 }],
            },
          },
        ],
      },
    ],
  },

  // ---- 混合羁绊 ----
  {
    id: 'life_circle',
    name: '人生圆满',
    description: '拥有完整的人生圈子',
    icon: '🌟',
    requiredCards: ['father', 'mother', 'spouse', 'child', 'good_friend'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { health: 10, eq: 10, network: 10 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '人生小满',
        description: '人生已小有成就',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { health: 5, eq: 5, network: 5 } }],
      },
      {
        tier: 2,
        name: '人生圆满',
        description: '家庭和睦，朋友相伴，事业有成',
        duplicateCardsRequired: 10,
        rewards: [
          { type: 'attribute', attributeBonus: { health: 10, eq: 10, network: 10, wealth: 5 } },
          {
            type: 'relic',
            relicReward: {
              id: 'life_compass',
              name: '人生罗盘',
              rarity: 'legendary',
              description: '指引你走向圆满人生的宝物',
              icon: '🧭',
              stackable: false,
              effects: [{ type: 'max_health_bonus', value: 25 }, { type: 'card_draw_bonus', value: 1 }, { type: 'energy_bonus', value: 1 }],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'knowledge_seeker',
    name: '求知之路',
    description: '从学生到学者，永不停歇的求知之旅',
    icon: '📚',
    requiredCards: ['teacher', 'mentor', 'college_classmate'],
    requireAll: true,
    rewards: [
      {
        type: 'attribute',
        attributeBonus: { iq: 10, energy: 5 },
      },
    ],
    tiers: [
      {
        tier: 1,
        name: '勤学好问',
        description: '勤奋学习，善于提问',
        duplicateCardsRequired: 0,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, energy: 3 } }],
      },
      {
        tier: 2,
        name: '学富五车',
        description: '学识渊博，见解独到',
        duplicateCardsRequired: 5,
        rewards: [
          { type: 'attribute', attributeBonus: { iq: 10, energy: 5, fame: 5 } },
          {
            type: 'card',
            cardReward: {
              id: 'wisdom_card',
              name: '智慧之光',
              type: 'power',
              rarity: 'rare',
              cost: 1,
              target: 'self',
              effects: [{ type: 'draw', value: 2 }, { type: 'gain_energy', value: 1 }],
              description: '智慧是最好的武器',
              icon: '💡',
              tags: ['智慧', '羁绊'],
            },
          },
        ],
      },
    ],
  },
];

// ==========================================
// 羁绊组合映射
// ==========================================

export const BOND_GROUP_MAP: Record<string, BondGroupDefinition> = Object.fromEntries(
  BOND_GROUPS.map((g) => [g.id, g])
);

// ==========================================
// 辅助函数
// ==========================================

export function getCardById(id: string): BondCardDefinition | undefined {
  return BOND_CARD_MAP[id];
}

export function getCardsByCategory(category: BondCardDefinition['category']): BondCardDefinition[] {
  return BOND_CARDS.filter((c) => c.category === category);
}

export function getAvailableCards(age: number): BondCardDefinition[] {
  return BOND_CARDS.filter((c) => {
    if (age < c.minAge) return false;
    if (c.maxAge !== undefined && age > c.maxAge) return false;
    return true;
  });
}

export function getBondGroupById(id: string): BondGroupDefinition | undefined {
  return BOND_GROUP_MAP[id];
}

export function getAllBondGroups(): BondGroupDefinition[] {
  return BOND_GROUPS;
}

/** 根据已收集的卡牌，获取可激活的羁绊 */
export function getActivatableBondGroups(collectedCardIds: string[]): BondGroupDefinition[] {
  const cardSet = new Set(collectedCardIds);
  return BOND_GROUPS.filter((group) => {
    if (group.requireAll) {
      return group.requiredCards.every((id) => cardSet.has(id));
    }
    return group.requiredCards.some((id) => cardSet.has(id));
  });
}

/** 加权随机选择卡牌 */
export function weightedRandomSelect(cards: BondCardDefinition[], count: number): BondCardDefinition[] {
  const result: BondCardDefinition[] = [];
  const available = [...cards];

  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, c) => sum + c.appearWeight, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < available.length; j++) {
      random -= available[j].appearWeight;
      if (random <= 0) {
        result.push(available[j]);
        available.splice(j, 1);
        break;
      }
    }
  }

  return result;
}
