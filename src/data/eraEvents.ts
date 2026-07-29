import type { GameEvent, BirthYear } from '../types/simulation';
import { SCRIPT_1950_EVENTS } from './simulationData';

// ==========================================
// 1960年代事件（出生年份1960，0-9岁对应1960-1969年）
// ==========================================
export const SCRIPT_1960_EVENTS: GameEvent[] = [
  // ---- 出生 (1960年，0岁) ----
  {
    id: 'born_1960',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '呱呱坠地',
    baseText: '1960年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个相对宽裕的家庭，家里有存粮，母亲看着你，眼里满是欣慰。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，虽然日子紧巴，但一家人相互扶持。';
      return '你出生在一个困难时期，家里常常揭不开锅，但父母依然把最好的留给你。';
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

  // ---- 婴儿期 (1961年，1岁) ----
  {
    id: 'toddler_first_steps_1960',
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

  // ---- 幼儿期 (1962年，2岁) ----
  {
    id: 'early_childhood_1960',
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

  // ---- 困难时期 (1963年，3岁) ----
  {
    id: 'three_years_1960',
    type: 'world_event',
    era: 0,
    ageRange: [3, 3],
    title: '三年困难时期',
    baseText: '国家正处于困难时期，{hardship_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 35) return '你家有存粮，日子虽然紧巴，但还能勉强维持。';
      if (attrs.network >= 40) return '邻里之间互相帮助，你家偶尔能接到接济。';
      return '家里常常断粮，父母把仅有的口粮都留给你和兄弟姐妹。';
    },
    options: [
      {
        id: 'share_food',
        text: '与兄弟姐妹分享',
        successRate: { eq: 0.5, network: 0.3 },
        successOutcome: {
          description: '你学会了分享，虽然饿着肚子，但心里暖暖的。',
          attributeChanges: { eq: 3, network: 2 },
        },
        failureOutcome: {
          description: '你忍不住多吃了一口，被父母责备了。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'help_parents',
        text: '帮父母干活',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但已经懂得为父母分忧。',
          attributeChanges: { physique: 3, network: 2 },
        },
        failureOutcome: {
          description: '你太小了，帮了不少倒忙，但父母没有责怪你。',
          attributeChanges: { physique: 1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 幼儿园 (1964年，4岁) ----
  {
    id: 'kindergarten_1960',
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

  // ---- 社会主义教育运动 (1965年，5岁) ----
  {
    id: 'socialist_education_1960',
    type: 'world_event',
    era: 0,
    ageRange: [5, 5],
    title: '社会主义教育运动',
    baseText: '村里来了工作队，社会主义教育运动开始了。{socialist_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的成分不太好，父母整日提心吊胆。';
      if (attrs.network >= 40) return '你父亲是贫下中农，被工作队看重。';
      return '你不太明白为什么大人们突然变得紧张起来。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_activities',
        text: '参加活动',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你跟着大人们一起学习，感受到了集体的力量。',
          attributeChanges: { network: 3, energy: 1 },
        },
        failureOutcome: {
          description: '人太多，你被挤在中间，有些害怕。',
          attributeChanges: { energy: -1 },
        },
      },
    ],
  },

  // ---- 启蒙之年 (1966年，6岁) ----
  {
    id: 'school_starts_1960',
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

  // ---- 文化大革命开始 (1967年，7岁) ----
  {
    id: 'cultural_revolution_1960',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '文化大革命',
    baseText: '文化大革命开始了，{cultural_revolution_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的书籍被没收，父母被批斗，你整日以泪洗面。';
      if (attrs.eq >= 55) return '你父亲谨言慎行，平安度过了这段日子。';
      return '你看到街上贴满了大字报，不太明白发生了什么。';
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
    isMilestone: true,
  },

  // ---- 上山下乡 (1968年，8岁) ----
  {
    id: 'down_to_countryside_1960',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '上山下乡',
    baseText: '上山下乡运动开始了，{countryside_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被安排到农村插队，虽然辛苦但锻炼了意志。';
      if (attrs.iq >= 55) return '你在学校继续读书，老师说你们是未来的希望。';
      return '你跟着大人一起劳动，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_work',
        text: '参加劳动',
        successRate: { physique: 0.4, network: 0.3 },
        successOutcome: {
          description: '你学会了干农活，感受到了劳动的快乐。',
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

  // ---- 九大召开 (1969年，9岁) ----
  {
    id: 'ninth_congress_1960',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '九大召开',
    baseText: '1969年，九大召开，{ninth_congress_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加庆祝活动，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起庆祝，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_celebration',
        text: '参加庆祝',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为庆祝活动贡献了一份力量。',
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

  // ---- 时代过渡 (1969年末，9岁) ----
  {
    id: 'era_transition_1960',
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
// 1970年代事件（出生年份1970，0-9岁对应1970-1979年）
// ==========================================
export const SCRIPT_1970_EVENTS: GameEvent[] = [
  // ---- 出生 (1970年，0岁) ----
  {
    id: 'born_1970',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '呱呱坠地',
    baseText: '1970年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个相对稳定的家庭，母亲看着你，眼里满是欣慰。';
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

  // ---- 婴儿期 (1971年，1岁) ----
  {
    id: 'toddler_first_steps_1970',
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

  // ---- 幼儿期 (1972年，2岁) ----
  {
    id: 'early_childhood_1970',
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

  // ---- 批林批孔运动 (1973年，3岁) ----
  {
    id: 'criticize_lin_confucius_1970',
    type: 'world_event',
    era: 0,
    ageRange: [3, 3],
    title: '批林批孔',
    baseText: '批林批孔运动开始了，{criticize_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 35) return '你家有书籍被没收，父母整日提心吊胆。';
      if (attrs.network >= 40) return '你父亲是工人，被组织参加学习班。';
      return '你看到街上贴满了大字报，不太明白发生了什么。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_activities',
        text: '参加活动',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你跟着大人们一起学习，感受到了集体的力量。',
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

  // ---- 幼儿园 (1974年，4岁) ----
  {
    id: 'kindergarten_1970',
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

  // ---- 反击右倾翻案风 (1975年，5岁) ----
  {
    id: 'anti_rightist_1970',
    type: 'world_event',
    era: 0,
    ageRange: [5, 5],
    title: '反击右倾翻案风',
    baseText: '反击右倾翻案风运动开始了，{anti_rightist_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的成分不太好，父母整日提心吊胆。';
      if (attrs.network >= 40) return '你父亲是工人，被组织参加学习班。';
      return '你不太明白为什么大人们突然变得紧张起来。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
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

  // ---- 启蒙之年 (1976年，6岁) ----
  {
    id: 'school_starts_1970',
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

  // ---- 唐山大地震 (1977年，7岁) ----
  {
    id: 'tangshan_earthquake_1970',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '唐山大地震',
    baseText: '1976年，唐山大地震，{earthquake_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加救援，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的希望。';
      return '你跟着大人一起救灾，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_rescue',
        text: '参加救援',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为救援贡献了一份力量。',
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

  // ---- 粉碎四人帮 (1978年，8岁) ----
  {
    id: 'smash_gang_of_four_1970',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '粉碎四人帮',
    baseText: '1978年，四人帮被粉碎，{smash_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加庆祝活动，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起庆祝，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_celebration',
        text: '参加庆祝',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为庆祝活动贡献了一份力量。',
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

  // ---- 十一届三中全会 (1979年，9岁) ----
  {
    id: 'third_plenary_1970',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '十一届三中全会',
    baseText: '1979年，十一届三中全会召开，{plenary_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加庆祝活动，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起庆祝，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_celebration',
        text: '参加庆祝',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为庆祝活动贡献了一份力量。',
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

  // ---- 时代过渡 (1979年末，9岁) ----
  {
    id: 'era_transition_1970',
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
// 1980年代事件（出生年份1980，0-9岁对应1980-1989年）
// ==========================================
export const SCRIPT_1980_EVENTS: GameEvent[] = [
  // ---- 出生 (1980年，0岁) ----
  {
    id: 'born_1980',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '呱呱坠地',
    baseText: '1980年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个相对富裕的家庭，家里有电视有冰箱，母亲看着你，眼里满是欣慰。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，虽然不富裕，但一家人其乐融融。';
      return '你出生在一个贫苦的家庭，但改革春风让你家看到了希望。';
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

  // ---- 婴儿期 (1981年，1岁) ----
  {
    id: 'toddler_first_steps_1980',
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

  // ---- 幼儿期 (1982年，2岁) ----
  {
    id: 'early_childhood_1980',
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

  // ---- 家庭联产承包责任制 (1983年，3岁) ----
  {
    id: 'household_responsibility_1980',
    type: 'world_event',
    era: 0,
    ageRange: [3, 3],
    title: '家庭联产承包责任制',
    baseText: '家庭联产承包责任制推广，{responsibility_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 35) return '你家承包了土地，父母干劲十足，日子越来越好。';
      if (attrs.network >= 40) return '你父亲是村干部，带领村民一起致富。';
      return '你家也分到了土地，父母脸上洋溢着从未有过的笑容。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_activities',
        text: '参加活动',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你跟着大人们一起劳动，感受到了集体的力量。',
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

  // ---- 幼儿园 (1984年，4岁) ----
  {
    id: 'kindergarten_1980',
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

  // ---- 价格双轨制 (1985年，5岁) ----
  {
    id: 'dual_track_system_1980',
    type: 'world_event',
    era: 0,
    ageRange: [5, 5],
    title: '价格双轨制',
    baseText: '价格双轨制实施，{dual_track_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你父亲做生意赚了不少钱，家里日子越来越好。';
      if (attrs.network >= 40) return '你父亲是干部，被倒爷们围得水泄不通。';
      return '你不太明白为什么大人们突然变得忙碌起来。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 2, eq: 2 },
        },
        failureOutcome: {
          description: '你不太明白发生了什么，只是觉得村里变得热闹了。',
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

  // ---- 启蒙之年 (1986年，6岁) ----
  {
    id: 'school_starts_1980',
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

  // ---- 改革开放深化 (1987年，7岁) ----
  {
    id: 'reform_deepening_1980',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '改革开放深化',
    baseText: '改革开放继续深化，{reform_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加庆祝活动，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起庆祝，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_celebration',
        text: '参加庆祝',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为庆祝活动贡献了一份力量。',
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

  // ---- 经济过热 (1988年，8岁) ----
  {
    id: 'economic_overheat_1980',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '经济过热',
    baseText: '经济过热，通货膨胀严重，{overheat_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加抢购，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起抢购，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_panic_buying',
        text: '参加抢购',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为抢购贡献了一份力量。',
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

  // ---- 治理整顿 (1989年，9岁) ----
  {
    id: 'governance_restructuring_1980',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '治理整顿',
    baseText: '1989年，治理整顿开始，{governance_context}。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '你被组织起来参加庆祝活动，虽然累但觉得很有意义。';
      if (attrs.iq >= 55) return '你在学校学习知识，老师说你们是未来的接班人。';
      return '你跟着大人一起庆祝，虽然不太懂但干劲十足。';
    },
    options: [
      {
        id: 'join_celebration',
        text: '参加庆祝',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但为庆祝活动贡献了一份力量。',
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

  // ---- 时代过渡 (1989年末，9岁) ----
  {
    id: 'era_transition_1980',
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
// 年代事件路由表
// ==========================================
export const ERA_EVENTS_MAP: Record<BirthYear, GameEvent[]> = {
  1950: SCRIPT_1950_EVENTS,
  1960: SCRIPT_1960_EVENTS,
  1970: SCRIPT_1970_EVENTS,
  1980: SCRIPT_1980_EVENTS,
  1990: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2000: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2010: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2020: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2030: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2040: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2050: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2060: SCRIPT_1980_EVENTS, // 临时复用，待补充
  2070: SCRIPT_1980_EVENTS, // 临时复用，待补充
};

// 根据出生年份获取对应年代事件
export function getEventsByBirthYear(birthYear: BirthYear): GameEvent[] {
  return ERA_EVENTS_MAP[birthYear] || SCRIPT_1950_EVENTS;
}
