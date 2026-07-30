import type { GameEvent } from '../types/simulation';

// ==========================================
// 补充事件池 - 为各年龄段提供额外事件
// 确保每个年龄段有足够多样化的事件体验
// ==========================================

export const SCRIPT_SUPPLEMENTARY_EVENTS: GameEvent[] = [
  // ==========================================
  // 0-9岁：童年补充事件
  // ==========================================

  // ---- 0岁：出生补充 ----
  {
    id: 'supplementary_born_fate',
    type: 'random',
    era: 0,
    ageRange: [0, 0],
    'title': '天命之选',
    baseText: '你出生的那一刻，{fate_context}。',
    triggerCondition: (state) => state.attributes.iq >= 30 || state.attributes.eq >= 30,
    skinRule: (attrs) => {
      if (attrs.iq >= 50) return '据说那天夜里有流星划过，村里老人说你将来必成大器。';
      if (attrs.eq >= 50) return '你出生时没有哭闹，安静地观察着这个世界。';
      return '你的第一声响亮有力，让产房外的家人都松了一口气。';
    },
    options: [
      {
        id: 'embrace_fate',
        text: '接受命运的安排',
        successRate: { energy: 0.5, eq: 0.3 },
        successOutcome: {
          description: '你似乎注定要有一个不平凡的人生。',
          attributeChanges: { fame: 2, health: 3 },
        },
        failureOutcome: {
          description: '命运总是充满未知。',
          attributeChanges: { health: 1 },
        },
      },
    ],
  },

  // ---- 3岁：幼儿期补充 ----
  {
    id: 'supplementary_toddler_discovery',
    type: 'fixed',
    era: 0,
    ageRange: [3, 3],
    title: '好奇发现',
    baseText: '三岁的你在家里发现了一个从未见过的东西。',
    skinRule: (attrs) => {
      if (attrs.iq >= 50) return '你翻箱倒柜，找到了一本旧书，虽然看不懂，但被里面的图画吸引。';
      if (attrs.physique >= 50) return '你爬上了高高的椅子，拿到了一个漂亮的盒子。';
      return '你在院子里发现了一只受伤的麻雀，决定照顾它。';
    },
    options: [
      {
        id: 'investigate',
        text: '仔细研究',
        successRate: { iq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你的好奇心得到了满足，还学到了一些新知识。',
          attributeChanges: { iq: 3, energy: 1 },
        },
        failureOutcome: {
          description: '你弄坏了那个东西，被父母批评了一顿。',
          attributeChanges: { energy: -1 },
        },
      },
      {
        id: 'show_parents',
        text: '拿给父母看',
        successRate: { eq: 0.5, network: 0.2 },
        successOutcome: {
          description: '父母夸你是个善于观察的好孩子。',
          attributeChanges: { eq: 2, network: 2 },
        },
        failureOutcome: {
          description: '父母太忙，只是看了一眼就没再关注。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ---- 4岁：幼儿园补充 ----
  {
    id: 'supplementary_kindergarten_art',
    type: 'fixed',
    era: 0,
    ageRange: [4, 4],
    title: '小小画家',
    baseText: '幼儿园的艺术课上，老师让大家自由画画。',
    skinRule: (attrs) => {
      if (attrs.iq >= 55) return '你画了一幅让老师惊叹的画作，色彩丰富，构图新颖。';
      if (attrs.eq >= 55) return '你画了和好朋友一起玩耍的场景，温馨有趣。';
      return '你画的房子歪歪扭扭，但那是你心中的家。';
    },
    options: [
      {
        id: 'draw_creatively',
        text: '发挥创意',
        successRate: { iq: 0.4, eq: 0.3 },
        successOutcome: {
          description: '你的画被贴在教室的墙上展示，小朋友们都很羡慕。',
          attributeChanges: { iq: 2, fame: 3 },
        },
        failureOutcome: {
          description: '你画得不太好，但老师还是鼓励了你。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'draw_with_friends',
        text: '和小伙伴一起画',
        successRate: { eq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你们一起完成了一幅大画，合作愉快。',
          attributeChanges: { network: 3, eq: 2 },
        },
        failureOutcome: {
          description: '你们意见不合，最后各自画了各自的。',
          attributeChanges: { network: 1 },
        },
      },
    ],
  },

  // ---- 5岁：学前补充 ----
  {
    id: 'supplementary_preschool_challenge',
    type: 'fixed',
    era: 0,
    ageRange: [5, 5],
    title: '第一次挑战',
    baseText: '五岁的你遇到了一个小小的挑战。',
    skinRule: (attrs) => {
      if (attrs.physique >= 55) return '公园里的攀爬架最高处，你敢不敢爬上去？';
      if (attrs.eq >= 55) return '邻居家的小朋友想和你交换玩具，你愿意吗？';
      return '妈妈让你独自去便利店买盐，你敢去吗？';
    },
    options: [
      {
        id: 'face_challenge',
        text: '勇敢面对',
        successRate: { physique: 0.3, eq: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你成功完成了挑战，感到无比自豪！',
          attributeChanges: { physique: 2, eq: 2, fame: 1 },
        },
        failureOutcome: {
          description: '你虽然失败了，但学会了勇敢面对困难。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'think_first',
        text: '先想一想',
        successRate: { iq: 0.5 },
        successOutcome: {
          description: '你仔细思考后，找到了更好的解决办法。',
          attributeChanges: { iq: 3 },
        },
        failureOutcome: {
          description: '你想了很久，最后还是没敢尝试。',
          attributeChanges: { iq: 1 },
        },
      },
    ],
  },

  // ---- 7岁：小学补充 ----
  {
    id: 'supplementary_school_friendship',
    type: 'fixed',
    era: 0,
    ageRange: [7, 7],
    title: '友谊的建立',
    baseText: '七岁的你转学到新学校，需要适应新环境。',
    skinRule: (attrs) => {
      if (attrs.eq >= 55) return '你很快就交到了新朋友，大家都很喜欢你。';
      if (attrs.network >= 50) return '你主动和同学们打招呼，融入了新集体。';
      return '你有些害羞，但同桌主动和你说话，你们成了朋友。';
    },
    options: [
      {
        id: 'help_classmate',
        text: '帮助同学',
        successRate: { eq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你帮助了有困难的同学，大家都很感激你。',
          attributeChanges: { network: 4, eq: 2 },
        },
        failureOutcome: {
          description: '你虽然没帮上忙，但你的善意被同学们记住了。',
          attributeChanges: { eq: 1 },
        },
      },
      {
        id: 'join_activity',
        text: '参加课外活动',
        successRate: { physique: 0.3, network: 0.4, energy: 0.3 },
        successOutcome: {
          description: '你参加了学校的兴趣小组，认识了很多志同道合的朋友。',
          attributeChanges: { network: 3, fame: 2 },
        },
        failureOutcome: {
          description: '你不太适应集体活动，但也在慢慢学习。',
          attributeChanges: { network: 1 },
        },
      },
    ],
  },

  // ---- 8岁：小学补充 ----
  {
    id: 'supplementary_school_competition',
    type: 'fixed',
    era: 0,
    ageRange: [8, 8],
    title: '第一次比赛',
    baseText: '学校举办了一场竞赛，你被老师推荐参加。',
    skinRule: (attrs) => {
      if (attrs.iq >= 60) return '这是一场知识竞赛，你对答如流。';
      if (attrs.physique >= 60) return '这是一场体育竞赛，你奋力拼搏。';
      return '这是一场才艺比赛，你展示了自己独特的才能。';
    },
    options: [
      {
        id: 'compete_hard',
        text: '全力以赴',
        successRate: { iq: 0.3, physique: 0.3, energy: 0.4 },
        successOutcome: {
          description: '你获得了好成绩，为班级争了光！',
          attributeChanges: { fame: 4, iq: 2, physique: 2 },
        },
        failureOutcome: {
          description: '你没有获得名次，但积累了比赛经验。',
          attributeChanges: { energy: -2 },
        },
      },
      {
        id: 'enjoy_process',
        text: '享受过程',
        successRate: { eq: 0.5, network: 0.3 },
        successOutcome: {
          description: '你虽然没有获奖，但比赛过程让你收获满满。',
          attributeChanges: { eq: 3, network: 2 },
        },
        failureOutcome: {
          description: '你轻松对待，反而发挥得不错。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ---- 9岁：童年尾声补充 ----
  {
    id: 'supplementary_childhood_summary',
    type: 'world_event',
    era: 0,
    ageRange: [9, 9],
    title: '童年的回忆',
    baseText: '即将告别童年，{summary_context}。',
    skinRule: (attrs) => {
      const achievements: string[] = [];
      if (attrs.iq >= 60) achievements.push('学习优秀');
      if (attrs.network >= 50) achievements.push('朋友众多');
      if (attrs.physique >= 60) achievements.push('身体健康');
      if (attrs.fame >= 40) achievements.push('小有名气');
      if (achievements.length === 0) return '你的童年平淡而快乐，没有什么特别的故事。';
      return `回顾童年，你${achievements.join('、')}，这是一段美好的回忆。`;
    },
    options: [
      {
        id: 'cherish_memory',
        text: '珍藏回忆',
        successRate: { eq: 0.5, iq: 0.3 },
        successOutcome: {
          description: '童年的美好回忆将成为你一生的财富。',
          attributeChanges: { eq: 3, iq: 2 },
        },
        failureOutcome: {
          description: '童年即将结束，你有些感伤。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
    isMilestone: true,
  },

  // ==========================================
  // 10-19岁：少年/青年补充事件
  // ==========================================

  // ---- 10-12岁：少年期补充 ----
  {
    id: 'supplementary_teen_hobby',
    type: 'fixed',
    era: 1,
    ageRange: [10, 12],
    title: '兴趣培养',
    baseText: '你开始培养一项新的兴趣爱好。',
    skinRule: (attrs) => {
      if (attrs.iq >= 55) return '你对编程产生了浓厚的兴趣，开始学习写代码。';
      if (attrs.physique >= 55) return '你加入了学校的篮球队，每天刻苦训练。';
      if (attrs.eq >= 55) return '你开始学习吉他，音乐让你的生活更加丰富。';
      return '你开始学习画画，用画笔记录下看到的世界。';
    },
    options: [
      {
        id: 'practice_diligently',
        text: '勤加练习',
        successRate: { energy: 0.4, physique: 0.3, iq: 0.3 },
        successOutcome: {
          description: '你的技艺突飞猛进，在学校的比赛中获得了奖项。',
          attributeChanges: { fame: 3, iq: 2, physique: 2 },
        },
        failureOutcome: {
          description: '练习很辛苦，但你没有放弃。',
          attributeChanges: { energy: -2 },
        },
      },
      {
        id: 'explore_more',
        text: '广泛尝试',
        successRate: { iq: 0.4, eq: 0.4 },
        successOutcome: {
          description: '你尝试了很多不同的爱好，发现了自己真正喜欢的东西。',
          attributeChanges: { iq: 3, eq: 2 },
        },
        failureOutcome: {
          description: '你什么都想学，但都没有深入。',
          attributeChanges: { iq: 1 },
        },
      },
    ],
  },

  // ---- 13-15岁：青春期补充 ----
  {
    id: 'supplementary_teen_dream',
    type: 'fixed',
    era: 1,
    ageRange: [13, 15],
    title: '青春梦想',
    baseText: '青春期的你开始思考未来的梦想。',
    skinRule: (attrs) => {
      if (attrs.iq >= 60) return '你想成为一名科学家，改变世界。';
      if (attrs.fame >= 50) return '你想成为明星，被众人瞩目。';
      if (attrs.eq >= 60) return '你想成为一名心理咨询师，帮助他人。';
      return '你想过平凡但幸福的生活。';
    },
    options: [
      {
        id: 'pursue_dream',
        text: '追逐梦想',
        successRate: { energy: 0.4, iq: 0.4 },
        successOutcome: {
          description: '你为梦想付出了努力，离目标越来越近。',
          attributeChanges: { iq: 4, energy: 2 },
        },
        failureOutcome: {
          description: '梦想的路上充满坎坷，但你没有放弃。',
          attributeChanges: { energy: -2 },
        },
      },
      {
        id: 'stay_grounded',
        text: '脚踏实地',
        successRate: { eq: 0.5, physique: 0.3 },
        successOutcome: {
          description: '你决定先做好眼前的事，一步一个脚印。',
          attributeChanges: { eq: 3, physique: 2 },
        },
        failureOutcome: {
          description: '你虽然务实，但有时也会感到迷茫。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ---- 16-19岁：青年期补充 ----
  {
    id: 'supplementary_youth_love',
    type: 'random',
    era: 1,
    ageRange: [16, 19],
    title: '青涩情感',
    baseText: '青春期的情感开始萌芽，{love_context}。',
    triggerCondition: (state) => state.attributes.eq >= 45,
    skinRule: (attrs) => {
      if (attrs.eq >= 60) return '你遇到了一个让你心动的人，每天都期待见到TA。';
      if (attrs.network >= 55) return '你身边有很多朋友，但还没有遇到特别的人。';
      return '你专注于学习，暂时没有考虑感情的事。';
    },
    options: [
      {
        id: 'express_feelings',
        text: '表达心意',
        successRate: { eq: 0.5, network: 0.3 },
        successOutcome: {
          description: '你的真诚打动了对方，你们开始了一段美好的感情。',
          attributeChanges: { eq: 4, network: 3 },
        },
        failureOutcome: {
          description: '对方拒绝了你的心意，但你学会了勇敢面对。',
          attributeChanges: { eq: 2 },
        },
      },
      {
        id: 'focus_growth',
        text: '专注成长',
        successRate: { iq: 0.5, energy: 0.3 },
        successOutcome: {
          description: '你决定先提升自己，为未来打下基础。',
          attributeChanges: { iq: 4, energy: 2 },
        },
        failureOutcome: {
          description: '你虽然专注于学习，但有时会感到孤独。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
  },

  // ==========================================
  // 20-29岁：初入社会补充事件
  // ==========================================

  // ---- 20-25岁：职场新人 ----
  {
    id: 'supplementary_career_start',
    type: 'fixed',
    era: 2,
    ageRange: [20, 25],
    title: '职场初体验',
    baseText: '你开始了第一份工作，{career_context}。',
    skinRule: (attrs) => {
      if (attrs.iq >= 55) return '你很快适应了工作节奏，表现出色。';
      if (attrs.eq >= 55) return '你很快和同事们打成一片，工作氛围融洽。';
      return '你正在努力适应新的工作环境。';
    },
    options: [
      {
        id: 'work_overtime',
        text: '加班加点',
        successRate: { energy: 0.4, physique: 0.4 },
        successOutcome: {
          description: '你的努力被领导看在眼里，获得了晋升机会。',
          attributeChanges: { wealth: 4, fame: 2 },
        },
        failureOutcome: {
          description: '你虽然努力，但效果并不明显。',
          attributeChanges: { energy: -3 },
        },
      },
      {
        id: 'work_life_balance',
        text: '平衡生活',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你学会了平衡工作和生活，身心都很健康。',
          attributeChanges: { eq: 3, health: 3 },
        },
        failureOutcome: {
          description: '你虽然注重生活，但工作表现一般。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ---- 26-29岁：事业上升期 ----
  {
    id: 'supplementary_career_crossroads',
    type: 'fixed',
    era: 2,
    ageRange: [26, 29],
    title: '事业十字路口',
    baseText: '工作几年后，你面临一个重要的职业选择。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 55) return '你有了一定的积蓄，可以考虑创业。';
      if (attrs.network >= 55) return '你收到了猎手的邀请，有更好的工作机会。';
      return '你对当前的工作感到迷茫，不知道未来在哪里。';
    },
    options: [
      {
        id: 'take_risk',
        text: '冒险一试',
        successRate: { energy: 0.4, physique: 0.3, iq: 0.3 },
        successOutcome: {
          description: '你勇敢地迈出了第一步，开启了新的篇章。',
          attributeChanges: { wealth: 5, fame: 3 },
        },
        failureOutcome: {
          description: '你虽然失败了，但积累了宝贵的经验。',
          attributeChanges: { energy: -3 },
        },
      },
      {
        id: 'stay_safe',
        text: '稳扎稳打',
        successRate: { eq: 0.5, iq: 0.3 },
        successOutcome: {
          description: '你选择了稳定的道路，事业稳步发展。',
          attributeChanges: { wealth: 3, eq: 2 },
        },
        failureOutcome: {
          description: '你虽然稳定，但有时会感到遗憾。',
          attributeChanges: { eq: 1 },
        },
      },
    ],
  },

  // ==========================================
  // 30-39岁：而立之年补充事件
  // ==========================================

  // ---- 30-35岁：家庭与事业 ----
  {
    id: 'supplementary_family_foundation',
    type: 'fixed',
    era: 3,
    ageRange: [30, 35],
    title: '成家立业',
    baseText: '三十岁出头的你，{family_context}。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 60) return '事业有成，家庭美满，是众人羡慕的对象。';
      if (attrs.eq >= 60) return '你经营着温馨的小家，虽然不富裕但很幸福。';
      return '你正在努力平衡事业和家庭，有时感到力不从心。';
    },
    options: [
      {
        id: 'invest_family',
        text: '投入家庭',
        successRate: { eq: 0.5, network: 0.3 },
        successOutcome: {
          description: '你的家庭更加和睦，家人为你感到骄傲。',
          attributeChanges: { eq: 4, network: 3 },
        },
        failureOutcome: {
          description: '你虽然努力，但家庭关系有时还是会出现问题。',
          attributeChanges: { eq: 2 },
        },
      },
      {
        id: 'career_push',
        text: '事业冲刺',
        successRate: { iq: 0.4, energy: 0.4 },
        successOutcome: {
          description: '你的事业更上一层楼，收入大幅增加。',
          attributeChanges: { wealth: 5, fame: 3 },
        },
        failureOutcome: {
          description: '你虽然努力，但事业遇到了瓶颈。',
          attributeChanges: { energy: -3 },
        },
      },
    ],
  },

  // ---- 36-39岁：中年危机 ----
  {
    id: 'supplementary_midlife_reflection',
    type: 'fixed',
    era: 3,
    ageRange: [36, 39],
    title: '中年反思',
    baseText: '临近四十岁，你开始反思自己的人生。',
    skinRule: (attrs) => {
      if (attrs.fame >= 55) return '你在事业上取得了成就，但有时会感到空虚。';
      if (attrs.iq >= 55) return '岁月赋予了你智慧，你更加从容淡定。';
      return '你开始思考人生的意义，寻找内心的平静。';
    },
    options: [
      {
        id: 'seek_meaning',
        text: '寻找意义',
        successRate: { iq: 0.5, eq: 0.3 },
        successOutcome: {
          description: '你找到了人生的新方向，内心更加充实。',
          attributeChanges: { iq: 4, eq: 3 },
        },
        failureOutcome: {
          description: '你虽然还在寻找，但已经不再焦虑。',
          attributeChanges: { iq: 2 },
        },
      },
      {
        id: 'mentor_others',
        text: '指导他人',
        successRate: { network: 0.4, eq: 0.4 },
        successOutcome: {
          description: '你把自己的经验传授给年轻人，收获了尊重和感激。',
          attributeChanges: { network: 4, fame: 3 },
        },
        failureOutcome: {
          description: '你尽力帮助他人，虽然效果一般，但问心无愧。',
          attributeChanges: { network: 2 },
        },
      },
    ],
  },

  // ==========================================
  // 40-49岁：不惑之年补充事件
  // ==========================================

  // ---- 40-45岁：事业巅峰 ----
  {
    id: 'supplementary_peak_career',
    type: 'fixed',
    era: 4,
    ageRange: [40, 45],
    title: '事业巅峰',
    baseText: '四十多岁的你，事业达到了新的高度。',
    skinRule: (attrs) => {
      if (attrs.fame >= 60) return '你在行业内已经小有名气，经常被邀请参加各种活动。';
      if (attrs.wealth >= 60) return '你的收入稳定，生活富足。';
      return '你在自己的岗位上默默奉献，虽然平凡但很满足。';
    },
    options: [
      {
        id: 'expand_influence',
        text: '扩大影响',
        successRate: { network: 0.4, fame: 0.4 },
        successOutcome: {
          description: '你的影响力越来越大，成为行业内的领军人物。',
          attributeChanges: { fame: 5, network: 4 },
        },
        failureOutcome: {
          description: '你虽然努力，但影响力提升有限。',
          attributeChanges: { network: 2 },
        },
      },
      {
        id: 'give_back_society',
        text: '回馈社会',
        successRate: { eq: 0.5, wealth: 0.3 },
        successOutcome: {
          description: '你热心公益，帮助了许多需要帮助的人。',
          attributeChanges: { fame: 4, eq: 3 },
        },
        failureOutcome: {
          description: '你的善举得到了社会的认可。',
          attributeChanges: { fame: 2 },
        },
      },
    ],
  },

  // ---- 46-49岁：人生智慧 ----
  {
    id: 'supplementary_life_wisdom',
    type: 'fixed',
    era: 4,
    ageRange: [46, 49],
    title: '人生智慧',
    baseText: '近五十岁的你，对人生有了更深的理解。',
    skinRule: (attrs) => {
      if (attrs.iq >= 60) return '你开始著书立说，分享自己的人生经验。';
      if (attrs.eq >= 60) return '你成为家人和朋友的智囊，大家遇到问题都来找你。';
      return '你学会了放下，不再为小事烦恼。';
    },
    options: [
      {
        id: 'share_wisdom',
        text: '分享智慧',
        successRate: { iq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你的智慧帮助了很多人，大家都很感激你。',
          attributeChanges: { fame: 4, network: 3 },
        },
        failureOutcome: {
          description: '你虽然尽力分享，但并不是所有人都能理解。',
          attributeChanges: { network: 2 },
        },
      },
      {
        id: 'enjoy_peace',
        text: '享受宁静',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你学会了享受内心的宁静，生活更加从容。',
          attributeChanges: { eq: 4, health: 3 },
        },
        failureOutcome: {
          description: '你虽然追求宁静，但有时还是会感到焦虑。',
          attributeChanges: { eq: 2 },
        },
      },
    ],
  },

  // ==========================================
  // 50-59岁：知天命补充事件
  // ==========================================

  // ---- 50-55岁：退休准备 ----
  {
    id: 'supplementary_pre_retirement',
    type: 'fixed',
    era: 5,
    ageRange: [50, 55],
    title: '退休准备',
    baseText: '五十多岁的你，开始为退休生活做准备。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 60) return '你的积蓄足够让你安享晚年。';
      if (attrs.health >= 60) return '你身体健康，计划退休后去旅行。';
      return '你开始规划退休后的生活，希望过得充实而有意义。';
    },
    options: [
      {
        id: 'plan_retirement',
        text: '规划退休',
        successRate: { iq: 0.5, wealth: 0.3 },
        successOutcome: {
          description: '你制定了详细的退休计划，对未来充满期待。',
          attributeChanges: { iq: 3, wealth: 2 },
        },
        failureOutcome: {
          description: '你虽然计划了，但总觉得准备不够充分。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'stay_active',
        text: '保持活跃',
        successRate: { physique: 0.4, energy: 0.4 },
        successOutcome: {
          description: '你坚持锻炼，身体依然保持得很好。',
          attributeChanges: { physique: 3, health: 3 },
        },
        failureOutcome: {
          description: '你虽然想保持活跃，但有些力不从心。',
          attributeChanges: { energy: -2 },
        },
      },
    ],
  },

  // ---- 56-59岁：传承 ----
  {
    id: 'supplementary_legacy_building',
    type: 'fixed',
    era: 5,
    ageRange: [56, 59],
    title: '传承与延续',
    baseText: '临近六十岁的你，开始思考如何传承自己的经验。',
    skinRule: (attrs) => {
      if (attrs.fame >= 55) return '你决定把自己的经验写成书，留给后人。';
      if (attrs.network >= 55) return '你开始指导年轻人，帮助他们成长。';
      return '你希望把自己的价值观传递给下一代。';
    },
    options: [
      {
        id: 'write_book',
        text: '著书立说',
        successRate: { iq: 0.5, energy: 0.3 },
        successOutcome: {
          description: '你的书出版了，受到了读者的喜爱。',
          attributeChanges: { fame: 5, iq: 3 },
        },
        failureOutcome: {
          description: '你虽然写了，但出版并不顺利。',
          attributeChanges: { iq: 2 },
        },
      },
      {
        id: 'mentor_next_gen',
        text: '指导后辈',
        successRate: { eq: 0.5, network: 0.3 },
        successOutcome: {
          description: '你指导的年轻人取得了成功，你感到无比欣慰。',
          attributeChanges: { network: 4, eq: 3 },
        },
        failureOutcome: {
          description: '你尽力指导，但效果因人而异。',
          attributeChanges: { network: 2 },
        },
      },
    ],
  },

  // ==========================================
  // 60-69岁：花甲之年补充事件
  // ==========================================

  // ---- 60-65岁：退休生活 ----
  {
    id: 'supplementary_retirement_life',
    type: 'fixed',
    era: 6,
    ageRange: [60, 65],
    title: '退休生活',
    baseText: '六十多岁的你，开始了全新的退休生活。',
    skinRule: (attrs) => {
      if (attrs.health >= 60) return '你身体硬朗，每天坚持锻炼，还参加了老年大学。';
      if (attrs.wealth >= 60) return '你开始环游世界，实现年轻时的梦想。';
      return '你享受着平静的退休生活，每天都很充实。';
    },
    options: [
      {
        id: 'travel_world',
        text: '周游世界',
        successRate: { wealth: 0.4, health: 0.4 },
        successOutcome: {
          description: '你去了很多地方，看到了不同的风景，收获满满。',
          attributeChanges: { fame: 3, eq: 3 },
        },
        failureOutcome: {
          description: '你虽然去了几个地方，但体力有些跟不上。',
          attributeChanges: { health: -2 },
        },
      },
      {
        id: 'learn_new_skills',
        text: '学习新技能',
        successRate: { iq: 0.5, energy: 0.3 },
        successOutcome: {
          description: '你学会了用智能手机，还学会了视频剪辑。',
          attributeChanges: { iq: 4, network: 2 },
        },
        failureOutcome: {
          description: '你虽然想学，但有些力不从心。',
          attributeChanges: { iq: 2 },
        },
      },
    ],
  },

  // ---- 66-69岁：天伦之乐 ----
  {
    id: 'supplementary_family_joy',
    type: 'fixed',
    era: 6,
    ageRange: [66, 69],
    title: '天伦之乐',
    baseText: '近七十岁的你，享受着儿孙满堂的幸福。',
    skinRule: (attrs) => {
      if (attrs.network >= 60) return '你的子孙都很孝顺，经常回来看你。';
      if (attrs.eq >= 60) return '你享受着和家人在一起的每一刻。';
      return '你看着孩子们成长，心中满是欣慰。';
    },
    options: [
      {
        id: 'spend_with_family',
        text: '陪伴家人',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你和家人在一起，感受到了满满的幸福。',
          attributeChanges: { eq: 4, health: 3 },
        },
        failureOutcome: {
          description: '你虽然想陪伴，但孩子们都很忙。',
          attributeChanges: { eq: 2 },
        },
      },
      {
        id: 'share_life_stories',
        text: '讲述人生',
        successRate: { iq: 0.4, network: 0.4 },
        successOutcome: {
          description: '你给孩子们讲述自己的人生故事，他们听得入迷。',
          attributeChanges: { network: 3, fame: 2 },
        },
        failureOutcome: {
          description: '你虽然讲了很多，但孩子们似乎不太感兴趣。',
          attributeChanges: { network: 1 },
        },
      },
    ],
  },

  // ==========================================
  // 70-100岁：古稀之年补充事件
  // ==========================================

  // ---- 70-79岁：晚年生活 ----
  {
    id: 'supplementary_elderly_wisdom',
    type: 'fixed',
    era: 7,
    ageRange: [70, 79],
    title: '晚年智慧',
    baseText: '七十多岁的你，成为了家族中最受尊敬的长辈。',
    skinRule: (attrs) => {
      if (attrs.fame >= 60) return '你的事迹被人们传颂，德高望重。';
      if (attrs.health >= 60) return '你精神矍铄，每天还能读书看报。';
      return '你安享晚年，看着儿孙满堂，心中满是欣慰。';
    },
    options: [
      {
        id: 'record_memories',
        text: '记录回忆',
        successRate: { iq: 0.5, eq: 0.3 },
        successOutcome: {
          description: '你把自己的回忆记录下来，成为家族的宝贵财富。',
          attributeChanges: { iq: 3, fame: 3 },
        },
        failureOutcome: {
          description: '你虽然想记录，但提笔忘字。',
          attributeChanges: { iq: 1 },
        },
      },
      {
        id: 'enjoy_each_day',
        text: '享受当下',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你学会了珍惜每一天，生活充满了阳光。',
          attributeChanges: { eq: 4, health: 3 },
        },
        failureOutcome: {
          description: '你虽然想享受，但身体有些吃不消。',
          attributeChanges: { eq: 2 },
        },
      },
    ],
  },

  // ---- 80-89岁：耄耋之年 ----
  {
    id: 'supplementary_longevity_celebration',
    type: 'fixed',
    era: 7,
    ageRange: [80, 89],
    title: '长寿庆典',
    baseText: '八十多岁的你，迎来了长寿庆典。',
    skinRule: (attrs) => {
      if (attrs.health >= 60) return '你身体依然健康，儿孙们为你举办了盛大的寿宴。';
      if (attrs.fame >= 60) return '很多人来为你祝寿，你感到无比幸福。';
      return '家人团聚在一起，为你庆祝生日。';
    },
    options: [
      {
        id: 'celebrate_grandly',
        text: '大摆筵席',
        successRate: { wealth: 0.4, network: 0.4 },
        successOutcome: {
          description: '你的寿宴热闹非凡，亲朋好友都来为你祝寿。',
          attributeChanges: { fame: 5, network: 4 },
        },
        failureOutcome: {
          description: '你虽然想大办，但身体不允许。',
          attributeChanges: { health: -2 },
        },
      },
      {
        id: 'quiet_celebration',
        text: '简单庆祝',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你和家人简单庆祝，温馨而幸福。',
          attributeChanges: { eq: 4, health: 3 },
        },
        failureOutcome: {
          description: '你虽然想简单，但家人还是为你准备了惊喜。',
          attributeChanges: { eq: 2 },
        },
      },
    ],
  },

  // ---- 90-100岁：期颐之年 ----
  {
    id: 'supplementary_centenarian',
    type: 'fixed',
    era: 7,
    ageRange: [90, 100],
    title: '期颐之年',
    baseText: '九十多岁的你，成为了人人羡慕的长寿老人。',
    skinRule: (attrs) => {
      if (attrs.health >= 70) return '你依然耳聪目明，身体硬朗。';
      if (attrs.fame >= 70) return '你的事迹被媒体报道，成为了传奇。';
      return '你安享晚年，看着家族兴旺，心中满是欣慰。';
    },
    options: [
      {
        id: 'share_longevity_secret',
        text: '分享长寿秘诀',
        successRate: { iq: 0.4, eq: 0.4 },
        successOutcome: {
          description: '你的长寿秘诀帮助了很多人，大家都很感激你。',
          attributeChanges: { fame: 5, network: 4 },
        },
        failureOutcome: {
          description: '你分享了经验，但每个人的情况不同。',
          attributeChanges: { fame: 2 },
        },
      },
      {
        id: 'peaceful_acceptance',
        text: '平和接受',
        successRate: { eq: 0.5, health: 0.3 },
        successOutcome: {
          description: '你平和地接受一切，心境淡然。',
          attributeChanges: { eq: 5, health: 3 },
        },
        failureOutcome: {
          description: '你虽然想平和，但有时还是会感到不安。',
          attributeChanges: { eq: 2 },
        },
      },
    ],
    isMilestone: true,
  },
];
