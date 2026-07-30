import type {
  IdentityCategory,
  IdentityDefinition,
  BondGroupDefinition,
} from '../types/bond';

// ==========================================
// 身份定义数据库
// ==========================================

export const IDENTITIES: IdentityDefinition[] = [
  // ---- 家人 ----
  {
    id: 'father',
    name: '父亲',
    category: 'family',
    icon: '👨',
    description: '给予你生命的男人，家中的顶梁柱',
    minAge: 0,
    maxAge: 90,
  },
  {
    id: 'mother',
    name: '母亲',
    category: 'family',
    icon: '👩',
    description: '给予你温暖的女人，家中的港湾',
    minAge: 0,
    maxAge: 90,
  },
  {
    id: 'elder_brother',
    name: '哥哥',
    category: 'family',
    icon: '👦',
    description: '从小保护你的兄长',
    minAge: 0,
    maxAge: 80,
    maxCount: 2,
  },
  {
    id: 'elder_sister',
    name: '姐姐',
    category: 'family',
    icon: '👧',
    description: '疼爱你的姐姐',
    minAge: 0,
    maxAge: 80,
    maxCount: 2,
  },
  {
    id: 'younger_brother',
    name: '弟弟',
    category: 'family',
    icon: '👶',
    description: '你看着长大的弟弟',
    minAge: 5,
    maxAge: 80,
    maxCount: 2,
  },
  {
    id: 'younger_sister',
    name: '妹妹',
    category: 'family',
    icon: '👧',
    description: '跟在你身后的小妹',
    minAge: 5,
    maxAge: 80,
    maxCount: 2,
  },
  {
    id: 'grandfather',
    name: '祖父',
    category: 'family',
    icon: '👴',
    description: '家族的长辈，智慧的传承者',
    minAge: 0,
    maxAge: 70,
  },
  {
    id: 'grandmother',
    name: '祖母',
    category: 'family',
    icon: '👵',
    description: '慈祥的祖母，家族的情感纽带',
    minAge: 0,
    maxAge: 70,
  },
  {
    id: 'spouse',
    name: '伴侣',
    category: 'family',
    icon: '💑',
    description: '陪伴你走过人生旅途的人',
    minAge: 18,
    maxAge: 100,
  },
  {
    id: 'child',
    name: '子女',
    category: 'family',
    icon: '👨‍👩‍👧',
    description: '你生命的延续',
    minAge: 20,
    maxAge: 100,
    maxCount: 3,
  },

  // ---- 友谊 ----
  {
    id: 'childhood_friend',
    name: '发小',
    category: 'friendship',
    icon: '🤝',
    description: '从小一起长大的伙伴',
    minAge: 3,
    maxAge: 80,
    maxCount: 3,
  },
  {
    id: 'good_friend',
    name: '好友',
    category: 'friendship',
    icon: '👫',
    description: '无话不谈的知心朋友',
    minAge: 10,
    maxAge: 100,
    maxCount: 5,
  },
  {
    id: 'best_friend',
    name: '挚友',
    category: 'friendship',
    icon: '💛',
    description: '可以托付后背的挚友',
    minAge: 12,
    maxAge: 100,
    maxCount: 2,
    isRare: true,
  },
  {
    id: 'neighbor',
    name: '邻居',
    category: 'friendship',
    icon: '🏘️',
    description: '住在隔壁的邻居',
    minAge: 0,
    maxAge: 80,
    maxCount: 3,
  },

  // ---- 学业 ----
  {
    id: 'elementary_classmate',
    name: '小学同学',
    category: 'education',
    icon: '📚',
    description: '小学时代的同窗',
    minAge: 6,
    maxAge: 60,
    maxCount: 5,
  },
  {
    id: 'middle_classmate',
    name: '中学同学',
    category: 'education',
    icon: '📖',
    description: '中学时代的同窗',
    minAge: 12,
    maxAge: 60,
    maxCount: 5,
  },
  {
    id: 'high_classmate',
    name: '高中同学',
    category: 'education',
    icon: '🎒',
    description: '高中时代的同窗',
    minAge: 15,
    maxAge: 60,
    maxCount: 5,
  },
  {
    id: 'college_classmate',
    name: '大学同学',
    category: 'education',
    icon: '🎓',
    description: '大学时代的同窗',
    minAge: 18,
    maxAge: 60,
    maxCount: 5,
  },
  {
    id: 'teacher',
    name: '恩师',
    category: 'education',
    icon: '👨‍🏫',
    description: '改变你人生的老师',
    minAge: 6,
    maxAge: 80,
    maxCount: 3,
    isRare: true,
  },
  {
    id: 'mentor',
    name: '导师',
    category: 'education',
    icon: '🧙',
    description: '指引你前进方向的导师',
    minAge: 15,
    maxAge: 80,
    maxCount: 2,
    isRare: true,
  },

  // ---- 事业 ----
  {
    id: 'colleague',
    name: '同事',
    category: 'career',
    icon: '💼',
    description: '一起工作的同事',
    minAge: 18,
    maxAge: 80,
    maxCount: 5,
  },
  {
    id: 'boss',
    name: '上司',
    category: 'career',
    icon: '👔',
    description: '你的直属上司',
    minAge: 20,
    maxAge: 70,
    maxCount: 3,
  },
  {
    id: 'partner',
    name: '合伙人',
    category: 'career',
    icon: '🤝',
    description: '共同创业的伙伴',
    minAge: 22,
    maxAge: 80,
    maxCount: 2,
    isRare: true,
  },
  {
    id: 'rival',
    name: '竞争对手',
    category: 'career',
    icon: '⚔️',
    description: '与你势均力敌的对手',
    minAge: 18,
    maxAge: 70,
    maxCount: 2,
  },

  // ---- 爱情 ----
  {
    id: 'first_love',
    name: '初恋',
    category: 'romance',
    icon: '💕',
    description: '第一次心动的人',
    minAge: 14,
    maxAge: 60,
    isRare: true,
  },
  {
    id: 'lover',
    name: '恋人',
    category: 'romance',
    icon: '💘',
    description: '与你相知相守的人',
    minAge: 16,
    maxAge: 100,
    maxCount: 2,
  },
];

// ==========================================
// 身份名称映射
// ==========================================

export const IDENTITY_MAP: Record<string, IdentityDefinition> = Object.fromEntries(
  IDENTITIES.map((i) => [i.id, i])
);

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
    requiredIdentities: ['father', 'mother'],
    requireAllActive: true,
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
        totalRelationshipRequired: 50,
        rewards: [{ type: 'attribute', attributeBonus: { health: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '幸福之家',
        description: '家庭幸福，额外获得生命加成',
        totalRelationshipRequired: 100,
        rewards: [{ type: 'attribute', attributeBonus: { health: 10, eq: 5 } }],
      },
      {
        tier: 3,
        name: '模范之家',
        description: '令人羡慕的模范家庭',
        totalRelationshipRequired: 150,
        rewards: [{ type: 'attribute', attributeBonus: { health: 15, eq: 8, energy: 3 } }],
      },
    ],
  },
  {
    id: 'siblings_bond',
    name: '手足情深',
    description: '兄弟姐妹间深厚的情谊',
    icon: '👫',
    requiredIdentities: ['elder_brother', 'younger_brother'],
    requireAllActive: false,
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
        totalRelationshipRequired: 40,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, physique: 3 } }],
      },
      {
        tier: 2,
        name: '情深义重',
        description: '情深义重，关键时刻互相扶持',
        totalRelationshipRequired: 80,
        rewards: [{ type: 'attribute', attributeBonus: { network: 8, physique: 5, health: 3 } }],
      },
    ],
  },
  {
    id: 'three_generations',
    name: '三代同堂',
    description: '祖孙三代，传承与希望',
    icon: '🏠',
    requiredIdentities: ['grandfather', 'father', 'child'],
    requireAllActive: true,
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
        totalRelationshipRequired: 80,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, eq: 5 } }],
      },
      {
        tier: 2,
        name: '家族荣耀',
        description: '家族兴旺，获得特殊遗物',
        totalRelationshipRequired: 150,
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
    requiredIdentities: ['childhood_friend', 'childhood_friend'],
    requireAllActive: true,
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
        totalRelationshipRequired: 40,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '莫逆之交',
        description: '无话不谈的好朋友',
        totalRelationshipRequired: 80,
        rewards: [{ type: 'attribute', attributeBonus: { network: 8, eq: 5, health: 3 } }],
      },
      {
        tier: 3,
        name: '生死之交',
        description: '可以托付生死的挚友',
        totalRelationshipRequired: 120,
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
    requiredIdentities: ['best_friend'],
    requireAllActive: true,
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
        totalRelationshipRequired: 50,
        rewards: [{ type: 'attribute', attributeBonus: { network: 5, eq: 5 } }],
      },
      {
        tier: 2,
        name: '生死与共',
        description: '患难与共，荣辱相依',
        totalRelationshipRequired: 100,
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
    requiredIdentities: ['elementary_classmate', 'middle_classmate', 'high_classmate'],
    requireAllActive: false,
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
        totalRelationshipRequired: 60,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 3, network: 3 } }],
      },
      {
        tier: 2,
        name: '校友网络',
        description: '遍布各行各业的校友资源',
        totalRelationshipRequired: 120,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, network: 8, wealth: 3 } }],
      },
    ],
  },
  {
    id: 'teachers_grace',
    name: '师恩如山',
    description: '恩师的教诲，改变你的一生',
    icon: '👨‍🏫',
    requiredIdentities: ['teacher'],
    requireAllActive: true,
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
        totalRelationshipRequired: 40,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, eq: 3 } }],
      },
      {
        tier: 2,
        name: '再造之恩',
        description: '老师改变了你的人生轨迹',
        totalRelationshipRequired: 80,
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
    requiredIdentities: ['mentor'],
    requireAllActive: true,
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
        totalRelationshipRequired: 50,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 8, energy: 3 } }],
      },
      {
        tier: 2,
        name: '登堂入室',
        description: '你已经掌握了核心要领',
        totalRelationshipRequired: 100,
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
    requiredIdentities: ['colleague', 'partner'],
    requireAllActive: true,
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
        totalRelationshipRequired: 40,
        rewards: [{ type: 'attribute', attributeBonus: { wealth: 3, network: 3 } }],
      },
      {
        tier: 2,
        name: '事业有成',
        description: '事业蒸蒸日上',
        totalRelationshipRequired: 80,
        rewards: [{ type: 'attribute', attributeBonus: { wealth: 8, network: 5, fame: 3 } }],
      },
      {
        tier: 3,
        name: '商业帝国',
        description: '建立起自己的商业帝国',
        totalRelationshipRequired: 120,
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
    requiredIdentities: ['rival'],
    requireAllActive: true,
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
        totalRelationshipRequired: 30,
        rewards: [{ type: 'attribute', attributeBonus: { physique: 3, iq: 3 } }],
      },
      {
        tier: 2,
        name: '亦敌亦友',
        description: '竞争中互相成就',
        totalRelationshipRequired: 60,
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
    requiredIdentities: ['first_love'],
    requireAllActive: true,
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
        totalRelationshipRequired: 40,
        rewards: [{ type: 'attribute', attributeBonus: { eq: 5 } }],
      },
      {
        tier: 2,
        name: '刻骨铭心',
        description: '即使分开，也永远铭记',
        totalRelationshipRequired: 80,
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
    requiredIdentities: ['lover', 'spouse'],
    requireAllActive: true,
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
        totalRelationshipRequired: 60,
        rewards: [{ type: 'attribute', attributeBonus: { eq: 5, health: 5 } }],
      },
      {
        tier: 2,
        name: '白头偕老',
        description: '愿得一心人，白头不相离',
        totalRelationshipRequired: 120,
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
    requiredIdentities: ['father', 'mother', 'spouse', 'child', 'good_friend'],
    requireAllActive: true,
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
        totalRelationshipRequired: 150,
        rewards: [{ type: 'attribute', attributeBonus: { health: 5, eq: 5, network: 5 } }],
      },
      {
        tier: 2,
        name: '人生圆满',
        description: '家庭和睦，朋友相伴，事业有成',
        totalRelationshipRequired: 300,
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
    requiredIdentities: ['teacher', 'mentor', 'college_classmate'],
    requireAllActive: true,
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
        totalRelationshipRequired: 80,
        rewards: [{ type: 'attribute', attributeBonus: { iq: 5, energy: 3 } }],
      },
      {
        tier: 2,
        name: '学富五车',
        description: '学识渊博，见解独到',
        totalRelationshipRequired: 150,
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

/** 根据身份ID获取身份定义 */
export function getIdentityById(id: string): IdentityDefinition | undefined {
  return IDENTITY_MAP[id];
}

/** 根据分类获取身份列表 */
export function getIdentitiesByCategory(category: IdentityCategory): IdentityDefinition[] {
  return IDENTITIES.filter((i) => i.category === category);
}

/** 获取指定年龄可出现的身份 */
export function getAvailableIdentities(age: number): IdentityDefinition[] {
  return IDENTITIES.filter((i) => {
    if (age < i.minAge) return false;
    if (i.maxAge !== undefined && age > i.maxAge) return false;
    return true;
  });
}

/** 根据羁绊ID获取羁绊定义 */
export function getBondGroupById(id: string): BondGroupDefinition | undefined {
  return BOND_GROUP_MAP[id];
}

/** 获取所有羁绊组合 */
export function getAllBondGroups(): BondGroupDefinition[] {
  return BOND_GROUPS;
}

/** 根据已拥有的身份，获取可激活的羁绊 */
export function getActivatableBondGroups(identityIds: string[]): BondGroupDefinition[] {
  const identitySet = new Set(identityIds);
  return BOND_GROUPS.filter((group) => {
    if (group.requireAllActive) {
      return group.requiredIdentities.every((id) => identitySet.has(id));
    }
    return group.requiredIdentities.some((id) => identitySet.has(id));
  });
}
