import type { GameEvent, BirthYear } from '../types/simulation';
import { SCRIPT_1950_EVENTS } from './simulationData';
import {
  SCRIPT_2010_EVENTS,
  SCRIPT_2020_EVENTS,
  SCRIPT_2030_EVENTS,
  SCRIPT_2040_EVENTS,
  SCRIPT_2050_EVENTS,
  SCRIPT_2060_EVENTS,
  SCRIPT_2070_EVENTS,
} from './futureEraEvents';

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
// 1990年代事件（出生年份1990，0-9岁对应1990-1999年）
// ==========================================
export const SCRIPT_1990_EVENTS: GameEvent[] = [
  // ---- 出生 (1990年，0岁) ----
  {
    id: 'born_1990',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '呱呱坠地',
    baseText: '1990年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个相对富裕的家庭，家里有彩电有冰箱，父亲刚做了一笔好生意。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，改革春风让家里的日子越过越好。';
      return '你出生在一个普通家庭，父母虽然不富裕，但对你充满期望。';
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

  // ---- 婴儿期 (1991年，1岁) ----
  {
    id: 'toddler_first_steps_1990',
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

  // ---- 幼年时光 (1992年，2岁) ----
  {
    id: 'early_childhood_1990',
    type: 'world_event',
    era: 0,
    ageRange: [2, 2],
    title: '南巡春风',
    baseText: '1992年，邓小平南巡讲话，改革春风吹遍大地。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 35) return '你父亲响应号召开始做生意，家里渐渐富裕起来。';
      if (attrs.network >= 40) return '你父亲是干部，被派去南方学习改革经验。';
      return '虽然年幼，你也能感受到大人们谈论"下海"时的兴奋。';
    },
    options: [
      {
        id: 'observe_quietly',
        text: '默默观察',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '虽然年幼，你隐约感受到了时代的变化。',
          attributeChanges: { iq: 3, wealth: 2 },
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
          attributeChanges: { physique: 3, health: 2 },
        },
        failureOutcome: {
          description: '你摔了一跤，膝盖破了皮。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 幼儿园 (1993年，3岁) ----
  {
    id: 'kindergarten_1990',
    type: 'fixed',
    era: 0,
    ageRange: [3, 3],
    title: '幼儿园时光',
    baseText: '镇上新开了幼儿园，你有了和小朋友们一起玩耍的地方。',
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

  // ---- 市场经济 (1994年，4岁) ----
  {
    id: 'market_economy_1990',
    type: 'world_event',
    era: 0,
    ageRange: [4, 4],
    title: '市场经济大潮',
    baseText: '1994年，社会主义市场经济体制确立，{market_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你父亲生意越做越大，家里盖了新房。';
      if (attrs.network >= 40) return '镇上新开了不少店铺，你家也开了一个小卖部。';
      return '街上的商店越来越多了，各种商品琳琅满目。';
    },
    options: [
      {
        id: 'help_family_business',
        text: '帮家里看店',
        successRate: { eq: 0.4, network: 0.3 },
        successOutcome: {
          description: '你学会了招呼客人，大家都夸你聪明能干。',
          attributeChanges: { eq: 3, network: 3 },
        },
        failureOutcome: {
          description: '你算错了账，被父亲批评了一顿。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'play_with_toys',
        text: '玩新玩具',
        successRate: { iq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你收到了很多新玩具，开心极了。',
          attributeChanges: { iq: 2, health: 2 },
        },
        failureOutcome: {
          description: '玩具坏了，你哭了一场。',
          attributeChanges: { energy: -1 },
        },
      },
    ],
  },

  // ---- 启蒙之年 (1995年，5岁) ----
  {
    id: 'school_starts_1990',
    type: 'fixed',
    era: 0,
    ageRange: [5, 5],
    title: '背上书包',
    baseText: '五岁的你终于到了上学的年纪，{school_start_context}。',
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
        id: 'play_after_school',
        text: '放学后玩耍',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你和小伙伴们一起玩耍，度过了快乐的童年。',
          attributeChanges: { physique: 4, network: 3 },
        },
        failureOutcome: {
          description: '你玩得太疯，作业没写完被老师批评。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 国企改革 (1996年，6岁) ----
  {
    id: 'soe_reform_1990',
    type: 'world_event',
    era: 0,
    ageRange: [6, 6],
    title: '国企改革',
    baseText: '1996年，国有企业改革推进，{soe_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你父亲在国企工作，改革让他有了下岗的压力。';
      if (attrs.network >= 40) return '你父亲下岗后开始创业，虽然辛苦但充满了干劲。';
      return '你不太明白为什么父亲最近总是叹气。';
    },
    options: [
      {
        id: 'comfort_parents',
        text: '安慰父母',
        successRate: { eq: 0.5, health: 0.2 },
        successOutcome: {
          description: '你变得更加懂事，努力学习不让父母担心。',
          attributeChanges: { eq: 4, iq: 2 },
        },
        failureOutcome: {
          description: '你不太懂得怎么安慰，只是默默地陪在父母身边。',
          attributeChanges: { eq: 2 },
        },
      },
      {
        id: 'focus_on_study',
        text: '专心学习',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你把全部精力投入学习，成绩名列前茅。',
          attributeChanges: { iq: 5, energy: 2 },
        },
        failureOutcome: {
          description: '你虽然努力，但家里的变故让你分心。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 香港回归 (1997年，7岁) ----
  {
    id: 'hong_kong_return_1990',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '香港回归',
    baseText: '1997年7月1日，香港回归祖国，{hk_context}。',
    skinRule: (attrs) => {
      if (attrs.fame >= 50) return '你在学校参加了庆祝活动，表演了节目。';
      if (attrs.iq >= 55) return '老师给你讲述香港的历史，你听得入迷。';
      return '你跟着家人一起看了电视转播，虽然不太懂但觉得很自豪。';
    },
    options: [
      {
        id: 'watch_ceremony',
        text: '观看回归仪式',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你感受到了祖国的强大，心中充满了自豪。',
          attributeChanges: { iq: 3, eq: 3 },
        },
        failureOutcome: {
          description: '电视信号不太好，你只看了片段。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_celebration',
        text: '参加学校庆祝',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你参加了学校的庆祝活动，认识了很多朋友。',
          attributeChanges: { network: 4, fame: 2 },
        },
        failureOutcome: {
          description: '你在活动中表现一般，但也很开心。',
          attributeChanges: { energy: 1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 亚洲金融危机 (1998年，8岁) ----
  {
    id: 'asian_financial_crisis_1990',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '亚洲金融危机',
    baseText: '1998年，亚洲金融危机波及中国，{crisis_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的生意受到了影响，但还能维持。';
      if (attrs.network >= 40) return '你父亲说危机中也有机遇，开始寻找新的商机。';
      return '你不太明白为什么街上的店铺关门了好几家。';
    },
    options: [
      {
        id: 'save_money',
        text: '学会节俭',
        successRate: { eq: 0.4, wealth: 0.3 },
        successOutcome: {
          description: '你开始学会节约，理解了金钱的来之不易。',
          attributeChanges: { eq: 3, wealth: 3 },
        },
        failureOutcome: {
          description: '你还不太懂得节俭的意义。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'observe_society',
        text: '观察社会',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你对经济现象产生了浓厚的兴趣。',
          attributeChanges: { iq: 4, wealth: 2 },
        },
        failureOutcome: {
          description: '你只是觉得最近不太景气。',
          attributeChanges: { iq: 1 },
        },
      },
    ],
  },

  // ---- 澳门回归 (1999年，9岁) ----
  {
    id: 'macau_return_1990',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '澳门回归',
    baseText: '1999年12月20日，澳门回归祖国，{macau_context}。',
    skinRule: (attrs) => {
      if (attrs.fame >= 50) return '你在学校参加了庆祝活动，表演了节目。';
      if (attrs.iq >= 55) return '老师给你讲述澳门的历史，你听得入迷。';
      return '你跟着家人一起看了电视转播，为祖国感到自豪。';
    },
    options: [
      {
        id: 'watch_ceremony',
        text: '观看回归仪式',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你感受到了国家的统一，心中充满了自豪。',
          attributeChanges: { iq: 3, eq: 3 },
        },
        failureOutcome: {
          description: '电视信号不太好，你只看了片段。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'join_celebration',
        text: '参加学校庆祝',
        successRate: { network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你参加了学校的庆祝活动，认识了很多朋友。',
          attributeChanges: { network: 4, fame: 2 },
        },
        failureOutcome: {
          description: '你在活动中表现一般，但也很开心。',
          attributeChanges: { energy: 1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 世纪之交 (1999年末，9岁) ----
  {
    id: 'era_transition_1990',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '跨越世纪',
    baseText: '转眼间，你已经从一个婴儿长成了十岁的少年，即将迎来新的世纪。',
    skinRule: (attrs, _history, tags) => {
      const achievements = [];
      if (attrs.iq >= 60) achievements.push('聪明好学');
      if (attrs.wealth >= 50) achievements.push('家境殷实');
      if (attrs.network >= 50) achievements.push('人缘好');
      if (attrs.eq >= 50) achievements.push('情商高');
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
          description: '你满怀期待地准备迎接新的世纪。',
          attributeChanges: { energy: 3, eq: 2, fame: 1 },
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
// 2000年代事件（出生年份2000，0-9岁对应2000-2009年）
// ==========================================
export const SCRIPT_2000_EVENTS: GameEvent[] = [
  // ---- 出生 (2000年，0岁) ----
  {
    id: 'born_2000',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '世纪宝宝',
    baseText: '2000年，{newborn_context}。你作为世纪宝宝来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有电脑，父亲在互联网公司工作。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚装了电话，父亲给你取了"世纪"的小名。';
      return '你出生在千禧年，父母希望你能赶上新时代的潮流。';
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

  // ---- 婴儿期 (2001年，1岁) ----
  {
    id: 'toddler_first_steps_2000',
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

  // ---- 幼年时光 (2002年，2岁) ----
  {
    id: 'early_childhood_2000',
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

  // ---- 幼儿园 (2003年，3岁) ----
  {
    id: 'kindergarten_2000',
    type: 'world_event',
    era: 0,
    ageRange: [3, 3],
    title: '非典记忆',
    baseText: '2003年，非典疫情爆发，{sars_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家买了好多消毒液和口罩，父母每天测量体温。';
      if (attrs.network >= 40) return '村里组织了防疫，你父亲是志愿者。';
      return '你还小，但记得大人们都很紧张，街上人很少。';
    },
    options: [
      {
        id: 'stay_home',
        text: '待在家里',
        successRate: { health: 0.4, iq: 0.3 },
        successOutcome: {
          description: '你乖乖待在家里，学会了看电视认字。',
          attributeChanges: { health: 3, iq: 3 },
        },
        failureOutcome: {
          description: '你觉得待在家里很无聊。',
          attributeChanges: { energy: -1 },
        },
      },
      {
        id: 'learn_hygiene',
        text: '学习卫生知识',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你学会了勤洗手讲卫生，养成了好习惯。',
          attributeChanges: { iq: 2, health: 4 },
        },
        failureOutcome: {
          description: '你不太明白为什么要这样做。',
          attributeChanges: { iq: 1 },
        },
      },
    ],
  },

  // ---- 数字时代 (2004年，4岁) ----
  {
    id: 'digital_age_2000',
    type: 'world_event',
    era: 0,
    ageRange: [4, 4],
    title: '数字时代来临',
    baseText: '2004年，互联网开始普及，{digital_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家买了新电脑，你开始接触电子游戏。';
      if (attrs.network >= 40) return '你父亲买了第一部手机，你好奇地玩个不停。';
      return '街上的网吧越来越多，大人们都在聊QQ。';
    },
    options: [
      {
        id: 'explore_computer',
        text: '探索电脑世界',
        successRate: { iq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你学会了用电脑，对新科技充满了好奇。',
          attributeChanges: { iq: 4, wealth: 1 },
        },
        failureOutcome: {
          description: '你只学会玩游戏，其他什么都没学会。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'play_outside',
        text: '户外玩耍',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你和小伙伴们一起玩耍，身体越来越壮。',
          attributeChanges: { physique: 4, health: 2 },
        },
        failureOutcome: {
          description: '你摔了一跤，膝盖破了皮。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
  },

  // ---- 启蒙之年 (2005年，5岁) ----
  {
    id: 'school_starts_2000',
    type: 'fixed',
    era: 0,
    ageRange: [5, 5],
    title: '背上书包',
    baseText: '五岁的你终于到了上学的年纪，{school_start_context}。',
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
        id: 'make_friends',
        text: '交朋友',
        successRate: { eq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你很快就交到了好朋友，大家都很喜欢你。',
          attributeChanges: { network: 4, eq: 3 },
        },
        failureOutcome: {
          description: '你有些害羞，但慢慢也适应了。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 网络世界 (2006年，6岁) ----
  {
    id: 'internet_world_2000',
    type: 'world_event',
    era: 0,
    ageRange: [6, 6],
    title: '网络世界',
    baseText: '2006年，互联网渗透到生活的方方面面，{internet_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家装了宽带，你开始在网上看动画片、玩游戏。';
      if (attrs.iq >= 55) return '你对电脑产生了浓厚的兴趣，开始自学编程基础。';
      return '你去网吧看别人玩游戏，觉得特别酷。';
    },
    options: [
      {
        id: 'learn_computer',
        text: '学习电脑知识',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你学会了打字和上网，对数字世界充满好奇。',
          attributeChanges: { iq: 5, fame: 1 },
        },
        failureOutcome: {
          description: '你只学会了玩游戏，其他什么都没学会。',
          attributeChanges: { iq: 2 },
        },
      },
      {
        id: 'play_sports',
        text: '参加体育运动',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你参加了学校的体育队，身体越来越棒。',
          attributeChanges: { physique: 4, health: 3 },
        },
        failureOutcome: {
          description: '你运动过度，受了点伤。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
  },

  // ---- 社交时代 (2007年，7岁) ----
  {
    id: 'social_media_2000',
    type: 'world_event',
    era: 0,
    ageRange: [7, 7],
    title: '社交时代',
    baseText: '2007年，社交网站兴起，{social_context}。',
    skinRule: (attrs) => {
      if (attrs.network >= 50) return '你注册了QQ，交到了很多网友。';
      if (attrs.eq >= 55) return '你学会了用手机发短信，和同学保持联系。';
      return '你看到大人们都在玩社交网络，觉得很好奇。';
    },
    options: [
      {
        id: 'join_social',
        text: '尝试社交网络',
        successRate: { network: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你学会了使用社交软件，交到了更多朋友。',
          attributeChanges: { network: 5, eq: 2 },
        },
        failureOutcome: {
          description: '你不太会用，只是看别人玩。',
          attributeChanges: { network: 1 },
        },
      },
      {
        id: 'focus_study',
        text: '专心学习',
        successRate: { iq: 0.5, energy: 0.2 },
        successOutcome: {
          description: '你把精力放在学习上，成绩一直名列前茅。',
          attributeChanges: { iq: 5, wealth: 1 },
        },
        failureOutcome: {
          description: '你虽然努力，但觉得学习有些枯燥。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
  },

  // ---- 北京奥运 (2008年，8岁) ----
  {
    id: 'beijing_olympics_2000',
    type: 'world_event',
    era: 0,
    ageRange: [8, 8],
    title: '北京奥运会',
    baseText: '2008年8月，北京奥运会开幕，{olympics_context}。',
    skinRule: (attrs) => {
      if (attrs.fame >= 50) return '你在学校参加了奥运宣传活动，制作了手抄报。';
      if (attrs.physique >= 55) return '你最喜欢看体育比赛，梦想着也能参加奥运会。';
      return '你跟着家人一起看了开幕式，觉得特别震撼。';
    },
    options: [
      {
        id: 'watch_ceremony',
        text: '观看开幕式',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你被开幕式的精彩表演深深震撼，为祖国感到自豪。',
          attributeChanges: { iq: 3, eq: 3, fame: 1 },
        },
        failureOutcome: {
          description: '你只看了片段，但也很激动。',
          attributeChanges: { energy: 1 },
        },
      },
      {
        id: 'join_sports',
        text: '参加体育运动',
        successRate: { physique: 0.4, energy: 0.3 },
        successOutcome: {
          description: '奥运精神激励你更加热爱运动。',
          attributeChanges: { physique: 4, health: 3 },
        },
        failureOutcome: {
          description: '你在运动中受了点伤。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
    isMilestone: true,
  },

  // ---- 金融危机 (2009年，9岁) ----
  {
    id: 'financial_crisis_2000',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '金融危机',
    baseText: '2009年，全球金融危机的影响逐渐消退，{crisis_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你家的生活没有受到太大影响，父母说要学会理财。';
      if (attrs.iq >= 55) return '你对金融危机产生了兴趣，开始关注经济新闻。';
      return '你不太明白为什么大人们最近都在讨论经济问题。';
    },
    options: [
      {
        id: 'learn_finance',
        text: '学习理财知识',
        successRate: { iq: 0.4, wealth: 0.3 },
        successOutcome: {
          description: '你开始了解金融知识，对经济现象产生了兴趣。',
          attributeChanges: { iq: 4, wealth: 3 },
        },
        failureOutcome: {
          description: '你还太小，不太理解这些概念。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'save_pocket_money',
        text: '攒零花钱',
        successRate: { eq: 0.4, wealth: 0.3 },
        successOutcome: {
          description: '你开始攒零花钱，学会了延迟满足。',
          attributeChanges: { eq: 3, wealth: 4 },
        },
        failureOutcome: {
          description: '你很快就把零花钱花光了。',
          attributeChanges: { wealth: 1 },
        },
      },
    ],
  },

  // ---- 时代过渡 (2009年末，9岁) ----
  {
    id: 'era_transition_2000',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '十年光阴',
    baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => {
      const achievements = [];
      if (attrs.iq >= 60) achievements.push('聪明好学');
      if (attrs.network >= 50) achievements.push('善于社交');
      if (attrs.physique >= 60) achievements.push('身体健壮');
      if (attrs.eq >= 50) achievements.push('情商高');
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
          attributeChanges: { energy: 3, eq: 2, fame: 1 },
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
// 条件触发事件示例（演示 triggerCondition 和 unlockEvents/lockEvents）
// ==========================================
export const SCRIPT_CONDITIONAL_EVENTS: GameEvent[] = [
  {
    id: 'genius_childhood',
    type: 'random',
    era: 0,
    ageRange: [6, 8],
    title: '天才儿童',
    baseText: '老师发现了你在学习上的天赋，建议让你跳级。',
    triggerCondition: (state) => state.attributes.iq >= 60,
    options: [
      {
        id: 'skip_grade',
        text: '接受跳级',
        successRate: { iq: 0.6, energy: 0.3 },
        successOutcome: {
          description: '你成功跳级，成为班里年纪最小的学生，名声远扬。',
          attributeChanges: { iq: 5, fame: 3 },
          unlockEvents: ['young_scholar'],
        },
        failureOutcome: {
          description: '跳级后学习压力太大，你有些吃不消。',
          attributeChanges: { energy: -3, iq: 2 },
        },
      },
      {
        id: 'stay_normal',
        text: '留在原年级',
        successRate: { eq: 0.5 },
        successOutcome: {
          description: '你选择稳扎稳打，和同龄人一起成长。',
          attributeChanges: { eq: 3, network: 2 },
        },
        failureOutcome: {
          description: '你有些犹豫，但最终还是决定留下来。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },
  {
    id: 'young_scholar',
    type: 'random',
    era: 0,
    ageRange: [9, 10],
    title: '少年学者',
    baseText: '因为跳级的经历，你被推荐参加少年班选拔。',
    triggerCondition: (state) => state.worldState.unlockedEvents.includes('young_scholar'),
    options: [
      {
        id: 'join_gifted',
        text: '参加少年班',
        successRate: { iq: 0.5, energy: 0.4 },
        successOutcome: {
          description: '你成功入选少年班，提前开始了更高层次的学习。',
          attributeChanges: { iq: 8, fame: 5 },
          unlockEvents: ['early_college'],
        },
        failureOutcome: {
          description: '选拔很遗憾没有通过，但你积累了经验。',
          attributeChanges: { iq: 2, eq: 2 },
        },
      },
      {
        id: 'decline',
        text: '放弃机会',
        successRate: { eq: 0.4 },
        successOutcome: {
          description: '你选择按部就班，享受正常的童年生活。',
          attributeChanges: { eq: 4, network: 3 },
          lockEvents: ['early_college'],
        },
        failureOutcome: {
          description: '你虽然放弃了，但心中有些遗憾。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },
  {
    id: 'early_college',
    type: 'random',
    era: 1,
    ageRange: [15, 17],
    title: '少年大学生',
    baseText: '你以优异的成绩被大学提前录取，成为校园里最年轻的学生。',
    triggerCondition: (state) => state.worldState.unlockedEvents.includes('early_college'),
    options: [
      {
        id: 'embrace_challenge',
        text: '迎接挑战',
        successRate: { iq: 0.5, eq: 0.3 },
        successOutcome: {
          description: '你虽然年纪小，但凭借努力跟上了课程，还交到了很多大朋友。',
          attributeChanges: { iq: 6, network: 5, eq: 3 },
        },
        failureOutcome: {
          description: '大学课程太难了，你感到压力巨大。',
          attributeChanges: { energy: -5, iq: 2 },
        },
      },
      {
        id: 'focus_research',
        text: '专注科研',
        successRate: { iq: 0.6, energy: 0.2 },
        successOutcome: {
          description: '你加入了教授的实验室，开始了前沿研究。',
          attributeChanges: { iq: 10, fame: 3 },
        },
        failureOutcome: {
          description: '科研并不像想象中那么有趣，你有些迷茫。',
          attributeChanges: { iq: 3, energy: -2 },
        },
      },
    ],
  },
  {
    id: 'sports_talent',
    type: 'random',
    era: 0,
    ageRange: [7, 9],
    title: '体育天赋',
    baseText: '体育老师发现了你的运动天赋，推荐你加入校队。',
    triggerCondition: (state) => state.attributes.physique >= 55,
    options: [
      {
        id: 'join_team',
        text: '加入校队',
        successRate: { physique: 0.5, energy: 0.4 },
        successOutcome: {
          description: '你成为校队主力，多次为校争光。',
          attributeChanges: { physique: 6, fame: 4, network: 3 },
          unlockEvents: ['sports_champion'],
        },
        failureOutcome: {
          description: '训练太辛苦了，你有些吃不消。',
          attributeChanges: { physique: 2, energy: -3 },
        },
      },
      {
        id: 'focus_study',
        text: '专注学习',
        successRate: { iq: 0.5 },
        successOutcome: {
          description: '你选择把精力放在学习上，成绩稳步提升。',
          attributeChanges: { iq: 5, energy: 2 },
          lockEvents: ['sports_champion'],
        },
        failureOutcome: {
          description: '你虽然放弃了体育，但学习也没有明显进步。',
          attributeChanges: { iq: 1 },
        },
      },
    ],
  },
  {
    id: 'sports_champion',
    type: 'random',
    era: 1,
    ageRange: [14, 16],
    title: '体育冠军',
    baseText: '经过多年训练，你在省级比赛中获得了冠军。',
    triggerCondition: (state) => state.worldState.unlockedEvents.includes('sports_champion'),
    options: [
      {
        id: 'go_pro',
        text: '走职业道路',
        successRate: { physique: 0.5, energy: 0.4 },
        successOutcome: {
          description: '你成为职业运动员，为国争光。',
          attributeChanges: { physique: 8, fame: 10, wealth: 5 },
        },
        failureOutcome: {
          description: '职业道路充满挑战，你遇到了强劲的对手。',
          attributeChanges: { physique: 3, energy: -4 },
        },
      },
      {
        id: 'retire_study',
        text: '退役读书',
        successRate: { iq: 0.4, eq: 0.4 },
        successOutcome: {
          description: '你选择退役，回到学校继续学业。',
          attributeChanges: { iq: 6, eq: 4, network: 3 },
        },
        failureOutcome: {
          description: '退役后的学习生活有些不适应。',
          attributeChanges: { iq: 2, eq: 1 },
        },
      },
    ],
  },
  {
    id: 'wealthy_family_event',
    type: 'random',
    era: 0,
    ageRange: [5, 8],
    title: '优渥家境',
    baseText: '你的家庭条件很好，父母给你提供了很多机会。',
    triggerCondition: (state) => state.attributes.wealth >= 50,
    options: [
      {
        id: 'enjoy_privilege',
        text: '享受优越条件',
        successRate: { eq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你接受了最好的教育，见识广博，人脉丰富。',
          attributeChanges: { iq: 4, network: 6, eq: 3, wealth: 3 },
          unlockEvents: ['study_abroad'],
        },
        failureOutcome: {
          description: '优越的条件让你有些骄傲，需要学会谦虚。',
          attributeChanges: { eq: -2, network: 3 },
        },
      },
      {
        id: 'stay_humble',
        text: '保持谦逊',
        successRate: { eq: 0.5, iq: 0.3 },
        successOutcome: {
          description: '你不因家境而骄傲，反而更加努力学习。',
          attributeChanges: { iq: 5, eq: 5 },
        },
        failureOutcome: {
          description: '你虽然努力，但家境的影响让你有些困扰。',
          attributeChanges: { eq: 2 },
        },
      },
    ],
  },
  {
    id: 'study_abroad',
    type: 'random',
    era: 1,
    ageRange: [16, 18],
    title: '出国留学',
    baseText: '家里支持你出国留学，你面临人生的重要选择。',
    triggerCondition: (state) => state.worldState.unlockedEvents.includes('study_abroad'),
    options: [
      {
        id: 'go_abroad',
        text: '出国深造',
        successRate: { iq: 0.5, eq: 0.4 },
        successOutcome: {
          description: '你远赴海外求学，开拓了国际视野。',
          attributeChanges: { iq: 8, eq: 5, network: 6, wealth: -5 },
        },
        failureOutcome: {
          description: '留学生活充满挑战，语言和文化差异让你有些迷茫。',
          attributeChanges: { eq: 2, energy: -3 },
        },
      },
      {
        id: 'stay_domestic',
        text: '留在国内',
        successRate: { iq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你选择在国内读书，同样取得了优异的成绩。',
          attributeChanges: { iq: 5, network: 5, wealth: 3 },
        },
        failureOutcome: {
          description: '虽然留在国内，但你时常想象留学的生活。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
  },
];

// ==========================================
// 年代事件路由表
// ==========================================
export const ERA_EVENTS_MAP: Record<BirthYear, GameEvent[]> = {
  1950: [...SCRIPT_1950_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  1960: [...SCRIPT_1960_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  1970: [...SCRIPT_1970_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  1980: [...SCRIPT_1980_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  1990: [...SCRIPT_1990_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2000: [...SCRIPT_2000_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2010: [...SCRIPT_2010_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2020: [...SCRIPT_2020_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2030: [...SCRIPT_2030_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2040: [...SCRIPT_2040_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2050: [...SCRIPT_2050_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2060: [...SCRIPT_2060_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
  2070: [...SCRIPT_2070_EVENTS, ...SCRIPT_CONDITIONAL_EVENTS],
};

// 根据出生年份获取对应年代事件
export function getEventsByBirthYear(birthYear: BirthYear): GameEvent[] {
  return ERA_EVENTS_MAP[birthYear] || SCRIPT_1950_EVENTS;
}
