import type { EraDefinition, HiddenTag, ScriptTemplate } from '../types/simulation';

// ==========================================
// 时代定义 - 出生年选项 [1950-2070]
// ==========================================
export const ERAS: EraDefinition[] = [
  {
    year: 1950,
    name: '萌芽纪元',
    baseLifeExpectancy: 70,
    description: '百废待兴的年代，到处都是机会，也充满了挑战。物资匮乏，但人心淳朴。',
    initialWealthRange: [5, 25],
    initialNetworkRange: [10, 40],
  },
  {
    year: 1960,
    name: '风云年代',
    baseLifeExpectancy: 72,
    description: '社会剧烈变革的十年，有人乘风破浪，有人随波逐流。',
    initialWealthRange: [5, 20],
    initialNetworkRange: [15, 45],
  },
  {
    year: 1970,
    name: '转折前夜',
    baseLifeExpectancy: 75,
    description: '黎明前的黑暗即将过去，新时代的曙光即将到来。',
    initialWealthRange: [8, 25],
    initialNetworkRange: [15, 40],
  },
  {
    year: 1980,
    name: '改革春风',
    baseLifeExpectancy: 77,
    description: '思想解放的浪潮席卷大地，到处都是创业的声音。',
    initialWealthRange: [10, 35],
    initialNetworkRange: [15, 50],
  },
  {
    year: 1990,
    name: '下海浪潮',
    baseLifeExpectancy: 79,
    description: '体制变革带来巨大的机遇和风险，敢问路在何方。',
    initialWealthRange: [15, 45],
    initialNetworkRange: [20, 55],
  },
  {
    year: 2000,
    name: '信息纪元',
    baseLifeExpectancy: 81,
    description: '互联网浪潮来临，世界开始连接，新的规则正在建立。',
    initialWealthRange: [20, 55],
    initialNetworkRange: [20, 60],
  },
  {
    year: 2010,
    name: '移动互联',
    baseLifeExpectancy: 83,
    description: '智能手机普及，让每个人都能触摸到整个世界。',
    initialWealthRange: [25, 60],
    initialNetworkRange: [25, 65],
  },
  {
    year: 2020,
    name: '智能纪元',
    baseLifeExpectancy: 85,
    description: 'AI、大数据、元宇宙...科技与生活的边界正在模糊。',
    initialWealthRange: [30, 65],
    initialNetworkRange: [30, 70],
  },
  {
    year: 2030,
    name: '能源革命',
    baseLifeExpectancy: 88,
    description: '新能源技术突破，传统行业正在重新洗牌。',
    initialWealthRange: [35, 70],
    initialNetworkRange: [30, 75],
  },
  {
    year: 2040,
    name: '星际黎明',
    baseLifeExpectancy: 92,
    description: '太空商业化起步，人类的视野投向星辰大海。',
    initialWealthRange: [40, 75],
    initialNetworkRange: [35, 80],
  },
  {
    year: 2050,
    name: '共生时代',
    baseLifeExpectancy: 97,
    description: '人机融合成为常态，生命的定义正在被改写。',
    initialWealthRange: [45, 80],
    initialNetworkRange: [40, 85],
  },
  {
    year: 2060,
    name: '深空纪元',
    baseLifeExpectancy: 105,
    description: '太阳系殖民成为现实，人类的脚步不再局限于地球。',
    initialWealthRange: [50, 85],
    initialNetworkRange: [45, 90],
  },
  {
    year: 2070,
    name: '未知边疆',
    baseLifeExpectancy: 115,
    description: '没有人知道未来会怎样，因为未来由你来定义。',
    initialWealthRange: [55, 90],
    initialNetworkRange: [50, 95],
  },
];

// ==========================================
// 隐藏标签 - 由玩家选择自然形成
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
    condition: (state) => {
      const stableChoices = state.choiceHistory.filter(
        () => Math.random() > 0.3
      ).length;
      return stableChoices >= 8 && state.remainingLife >= 40;
    },
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
    id: 'mentor',
    name: '引路人',
    description: '你帮助了许多人，桃李满天下',
    condition: (state) => state.npcs.filter((n) => n.relationship > 70).length >= 2 && state.attributes.eq >= 70,
  },
];

// ==========================================
// 1950年代剧本模板（换皮骨架）
// ==========================================
const SCRIPT_1950: ScriptTemplate = {
  era: 0,
  eraDescription: '你出生在{year}年，这是{era_name}。{era_desc}',

  // 固定节点 - 必定发生
  fixedNodes: [
    {
      id: 'born_1950',
      type: 'world_event',
      era: 0,
      title: '呱呱坠地',
      baseText: '{family_situation}。你来到了这个世界。',
      skinRule: (attrs) => {
        if (attrs.wealth >= 40) return '你出生在一个相对富裕的家庭，家里有{home_condition}。母亲看着你，眼里满是欣慰。';
        if (attrs.wealth >= 20) return '你出生在一个普通家庭，{home_condition}。虽然不富裕，但一家人其乐融融。';
        return '你出生在一个贫苦的家庭，{home_condition}。但困难的环境让你从小就懂得了生活的不易。';
      },
      options: [],
      isMilestone: true,
    },
    {
      id: 'childhood_1950',
      type: 'fixed',
      era: 0,
      title: '童年印象',
      baseText: '到了上学的年纪，{school_experience}。',
      skinRule: (attrs, _history, _tags) => {
        if (attrs.iq >= 65 && attrs.wealth >= 30) return '你在学校表现优异，老师们都很喜欢你。放学后，你还得帮忙做家务。';
        if (attrs.iq >= 65) return '你聪明好学，但家里学费凑得吃力。每天你都在油灯下写作业，眼睛酸涩也不敢停。';
        if (attrs.physique >= 60) return '你不太爱读书，但身体健壮，是同龄孩子里的孩子王。';
        return '你的童年过得平平淡淡，和其他孩子一样，上学、玩耍、帮家里干活。';
      },
      options: [
        {
          id: 'study_hard',
          text: '发奋读书',
          successRate: { iq: 0.4, energy: 0.3, physique: 0.1, health: 0.2 },
          successOutcome: {
            description: '你的成绩突飞猛进，成为班级的尖子生。奖学金减轻了家里的负担。',
            attributeChanges: { iq: 5, energy: -3 },
            unlockEvents: ['scholarship_1950'],
          },
          failureOutcome: {
            description: '你虽然努力，但基础较弱，进步并不明显。不过你没有放弃。',
            attributeChanges: { iq: 2, energy: -5 },
          },
          tagModifier: { tag: 'wisdom_seeker', rateBonus: 0.15 },
        },
        {
          id: 'help_family',
          text: '帮家里干活',
          successRate: { physique: 0.4, energy: 0.3, health: 0.3 },
          successOutcome: {
            description: '你成为了家里的好帮手，田间地头的活儿样样拿手。邻里都夸你懂事。',
            attributeChanges: { physique: 4, network: 3, energy: -4 },
            npcRelationshipChanges: [{ npcId: 'neighbor_1', delta: 10 }],
          },
          failureOutcome: {
            description: '繁重的体力活让你疲惫不堪，但也锻炼了你的意志。',
            attributeChanges: { physique: 2, health: -2 },
          },
        },
        {
          id: 'play_outside',
          text: '尽情玩耍',
          successRate: { physique: 0.3, eq: 0.4, health: 0.3 },
          successOutcome: {
            description: '你和伙伴们一起玩耍，度过了无忧无虑的童年。你们的友谊一直延续到成年。',
            attributeChanges: { eq: 5, physique: 3 },
            npcRelationshipChanges: [{ npcId: 'childhood_friend', delta: 15 }],
            unlockEvents: ['friendship_1950'],
          },
          failureOutcome: {
            description: '你摔了一跤，膝盖留下了一小块疤，但很快又笑着跑开了。',
            attributeChanges: { health: -1 },
          },
        },
      ],
    },
    {
      id: 'teenage_choice_1950',
      type: 'fixed',
      era: 0,
      title: '少年志向',
      baseText: '不知不觉，你长成了少年。{career_path_question}',
      skinRule: (attrs, history) => {
        const hasScholarship = history.some((c) => c.eventId === 'scholarship_1950');
        if (hasScholarship) return '优异的成绩让你有了选择的权利。是继续深造，还是早点出来工作？';
        if (attrs.iq >= 60) return '你虽然聪明，但家里并不宽裕。你需要为自己的未来做一个决定。';
        if (attrs.wealth >= 40) return '家里已经为你安排好了一条路。是遵从父母的意愿，还是追寻自己的梦想？';
        return '家里需要劳动力。留下来帮忙，还是出去闯一闯？这是一个艰难的选择。';
      },
      options: [
        {
          id: 'continue_study',
          text: '继续求学',
          successRate: { iq: 0.5, eq: 0.2, energy: 0.3 },
          successOutcome: {
            description: '你考上了{ school_type }，成为村里的骄傲。一切都是新的开始。',
            attributeChanges: { iq: 8, wealth: -5, fame: 5 },
            unlockEvents: ['school_life_1950', 'graduation_1950'],
            nextEraModifier: 0.2,
          },
          failureOutcome: {
            description: '考试失利，名落孙山。虽然遗憾，但你决定明年再战。',
            attributeChanges: { energy: -3 },
          },
          tagModifier: { tag: 'wisdom_seeker', rateBonus: 0.2 },
        },
        {
          id: 'join_workforce',
          text: '参加工作',
          successRate: { energy: 0.3, physique: 0.3, eq: 0.4 },
          successOutcome: {
            description: '你进入{factory_type}工作。虽然辛苦，但稳定的收入让家人松了一口气。',
            attributeChanges: { wealth: 8, network: 5, fame: 2 },
            unlockEvents: ['work_life_1950', 'career_advance_1950'],
            nextEraModifier: 0.1,
          },
          failureOutcome: {
            description: '工作并不如想象中顺利，但你咬牙坚持了下来。',
            attributeChanges: { energy: -4, wealth: 2 },
          },
        },
        {
          id: 'learn_craft',
          text: '学一门手艺',
          successRate: { physique: 0.3, iq: 0.3, energy: 0.4 },
          successOutcome: {
            description: '你拜了师傅学手艺。这条路虽然辛苦，但一技傍身，走到哪里都不怕。',
            attributeChanges: { physique: 4, iq: 4, network: 4 },
            unlockEvents: ['craftsman_path_1950'],
            nextEraModifier: 0.15,
          },
          failureOutcome: {
            description: '师傅很严厉，学艺很苦，但你咬牙坚持。',
            attributeChanges: { energy: -3 },
          },
        },
      ],
    },
  ],

  // 随机事件池 - 从中抽取填充
  randomEventPool: [
    {
      id: 'neighbor_help_1950',
      type: 'random',
      era: 0,
      title: '邻里互助',
      baseText: '邻居{problem_situation}。他们来找你帮忙。',
      skinRule: (attrs) => {
        if (attrs.wealth >= 30) return '隔壁的邻居遇到了困难，想跟你家借点粮食。';
        return '一个你看着长大的老人突然生病了，家里没人照顾。';
      },
      options: [
        {
          id: 'help_generously',
          text: '尽力相助',
          successRate: { eq: 0.4, wealth: 0.3, network: 0.3 },
          successOutcome: {
            description: '你的善意被所有人看在眼里。从此以后，你在四邻八乡都有了好名声。',
            attributeChanges: { network: 6, fame: 4, wealth: -3 },
            npcRelationshipChanges: [{ npcId: 'neighbor_1', delta: 20 }],
          },
          failureOutcome: {
            description: '你虽然尽力了，但还是没有帮上太大的忙。不过这份心意大家都记在心里。',
            attributeChanges: { network: 2 },
          },
        },
        {
          id: 'help_limited',
          text: '意思一下',
          successRate: { eq: 0.3, iq: 0.3, energy: 0.4 },
          successOutcome: {
            description: '你给了力所能及的帮助，虽然不多，但也是一份心意。',
            attributeChanges: { network: 2, wealth: -1 },
          },
          failureOutcome: {
            description: '你的敷衍被看出来了，虽然没有明说，但关系终究是生疏了一些。',
            attributeChanges: { network: -2 },
          },
        },
        {
          id: 'refuse',
          text: '委婉拒绝',
          successRate: { iq: 0.5, eq: 0.5 },
          successOutcome: {
            description: '你找了个合适的理由推脱了。虽然有点愧疚，但你知道自己的能力有限。',
            attributeChanges: { network: -3 },
          },
          failureOutcome: {
            description: '你的拒绝被误解为冷漠，街坊邻居之间多了一些闲言碎语。',
            attributeChanges: { network: -5, fame: -2 },
          },
        },
      ],
    },
    {
      id: 'luck_encounter_1950',
      type: 'random',
      era: 0,
      title: '意外邂逅',
      baseText: '一次偶然的机会，你{encounter_situation}。',
      skinRule: (attrs) => {
        if (attrs.wealth >= 35) return '在集市上遇到了一个外地来的货郎，他在卖一些稀罕物件。';
        if (attrs.iq >= 60) return '在废品站翻到一本旧书，书里夹着一张泛黄的图纸。';
        return '在河边钓鱼时，救了一个落水的孩子。';
      },
      options: [
        {
          id: 'seize_opportunity',
          text: '抓住机会',
          successRate: { iq: 0.3, eq: 0.3, energy: 0.4 },
          successOutcome: {
            description: '你的果断得到了回报。这次经历成为你人生中的一个重要转折点。',
            attributeChanges: { wealth: 5, fame: 3, iq: 2 },
            unlockEvents: ['opportunity_chain_1950'],
            nextEraModifier: 0.1,
          },
          failureOutcome: {
            description: '事情并没有朝你期望的发展方向走，但你也不后悔。',
            attributeChanges: { energy: -2 },
          },
        },
        {
          id: 'observe_carefully',
          text: '谨慎观望',
          successRate: { iq: 0.5, eq: 0.3, health: 0.2 },
          successOutcome: {
            description: '你冷静观察后做出了正确的判断。虽然错过了一些东西，但避免了可能的损失。',
            attributeChanges: { iq: 3 },
          },
          failureOutcome: {
            description: '等你终于想清楚，机会已经溜走了。',
            attributeChanges: { energy: -1 },
          },
        },
      ],
    },
    {
      id: 'health_crisis_1950',
      type: 'random',
      era: 0,
      title: '健康考验',
      baseText: '{health_issue}。',
      skinRule: (attrs) => {
        if (attrs.health >= 60) return '你生了一场小病，好在身体底子好，很快就好了。';
        return '你突然病倒了，村里的条件有限，家里人为你担心。';
      },
      options: [
        {
          id: 'rest_recover',
          text: '好好休养',
          successRate: { health: 0.4, wealth: 0.3, energy: 0.3 },
          successOutcome: {
            description: '充足的休息让你恢复了健康。你对身体的重要性有了更深的认识。',
            attributeChanges: { health: 5, energy: 3, wealth: -2 },
          },
          failureOutcome: {
            description: '恢复得很慢，但你终于还是好了。',
            attributeChanges: { energy: 2, health: 1 },
          },
        },
        {
          id: 'push_through',
          text: '咬牙坚持',
          successRate: { physique: 0.5, energy: 0.5 },
          successOutcome: {
            description: '你坚持了下来，证明了你的意志力是强大的。',
            attributeChanges: { physique: 3, health: -2 },
          },
          failureOutcome: {
            description: '逞强的代价是病情加重，不得不多休息了几天。',
            attributeChanges: { health: -5, energy: -4 },
            lifeCost: 2,
          },
          tagModifier: { tag: 'steady_walker', rateBonus: 0.1 },
        },
      ],
    },
    {
      id: 'talent_discovery_1950',
      type: 'random',
      era: 0,
      title: '天赋初现',
      baseText: '你发现了自己在{ talent_area }方面的天赋。',
      skinRule: (attrs) => {
        if (attrs.iq >= 65) return '学习';
        if (attrs.physique >= 65) return '运动';
        if (attrs.eq >= 65) return '与人交往';
        return '动手实践';
      },
      options: [
        {
          id: 'develop_talent',
          text: '投入培育',
          successRate: { iq: 0.3, energy: 0.4, eq: 0.3 },
          successOutcome: {
            description: '你的天赋得到了很好的开发，这为你后来的成功打下了基础。',
            attributeChanges: { iq: 4, eq: 3, energy: -3 },
            unlockEvents: ['talent_growth_1950'],
          },
          failureOutcome: {
            description: '虽然努力了，但进步不明显。不过至少你发现了一条可能的路。',
            attributeChanges: { energy: -2 },
          },
        },
        {
          id: 'natural_development',
          text: '顺其自然',
          successRate: { eq: 0.4, health: 0.3, energy: 0.3 },
          successOutcome: {
            description: '你不刻意追求，反而让天赋自然发展，水到渠成。',
            attributeChanges: { iq: 2, eq: 2 },
          },
          failureOutcome: {
            description: '由于缺乏引导，你的天赋并没有得到充分发挥。',
            attributeChanges: {},
          },
          tagModifier: { tag: 'life_enjoyer', rateBonus: 0.1 },
        },
      ],
    },
    {
      id: 'family_event_1950',
      type: 'random',
      era: 0,
      title: '家庭变故',
      baseText: '{family_news}。',
      skinRule: (attrs) => {
        if (attrs.wealth >= 30) return '家里得到了一笔意外的收入，家人商量着怎么花。';
        return '家里的经济状况突然紧张起来，父母开始为生计发愁。';
      },
      options: [
        {
          id: 'family_first',
          text: '家庭为重',
          successRate: { eq: 0.5, network: 0.3, energy: 0.2 },
          successOutcome: {
            description: '你把家庭放在第一位，家人之间的感情更加紧密了。',
            attributeChanges: { network: 5, eq: 3 },
            npcRelationshipChanges: [{ npcId: 'family_1', delta: 15 }],
          },
          failureOutcome: {
            description: '虽然家庭为重，但你牺牲了一些个人发展的机会。',
            attributeChanges: { network: 3, iq: -1 },
          },
        },
        {
          id: 'self_development',
          text: '追求自我',
          successRate: { iq: 0.4, energy: 0.3, physique: 0.3 },
          successOutcome: {
            description: '你坚持走自己的路，虽然和家人有些摩擦，但最终证明自己是对的。',
            attributeChanges: { iq: 4, wealth: 2 },
            npcRelationshipChanges: [{ npcId: 'family_1', delta: -5 }],
          },
          failureOutcome: {
            description: '你走了自己的路，但和家人产生了裂痕。',
            attributeChanges: { iq: 2, network: -3 },
          },
        },
      ],
    },
  ],

  // NPC模板
  npcTemplates: [
    {
      name: '老王叔',
      role: '邻居',
      basePersonality: '热心肠的退伍老兵',
      eventTriggerChance: 0.3,
    },
    {
      name: '小芳',
      role: '童年玩伴',
      basePersonality: '扎着两条辫子的邻家女孩',
      eventTriggerChance: 0.25,
    },
    {
      name: '李老师',
      role: '小学老师',
      basePersonality: '严厉但负责的教书匠',
      eventTriggerChance: 0.2,
    },
    {
      name: '张伯',
      role: '村长',
      basePersonality: '德高望重的长辈',
      eventTriggerChance: 0.15,
    },
    {
      name: '阿福',
      role: '发小',
      basePersonality: '调皮的孤儿，和你一起长大',
      eventTriggerChance: 0.2,
    },
  ],
};

// ==========================================
// 剧本模板库（按时代索引）
// ==========================================
export const SCRIPT_TEMPLATES: Record<number, ScriptTemplate> = {
  0: SCRIPT_1950,
};

// ==========================================
// 获取指定时代的剧本模板
// ==========================================
export function getScriptTemplate(era: number): ScriptTemplate | undefined {
  return SCRIPT_TEMPLATES[era];
}

// ==========================================
// 属性中文名映射
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
