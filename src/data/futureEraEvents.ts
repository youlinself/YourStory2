import type { GameEvent } from '../types/simulation';

// ==========================================
// 2010年代事件（出生年份2010，0-9岁对应2010-2019年）
// 特色：移动互联网、智能手机、社交媒体、短视频
// ==========================================
export const SCRIPT_2010_EVENTS: GameEvent[] = [
  {
    id: 'born_2010',
    type: 'world_event',
    era: 0,
    ageRange: [0, 0],
    title: '移动互联时代',
    baseText: '2010年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => {
      if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有平板电脑，父亲刚买了最新款的智能手机。';
      if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚装了WiFi，母亲喜欢用手机给你拍照。';
      return '你出生在移动互联网时代，虽然家境一般，但数字世界为你打开了新的大门。';
    },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2010', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2010', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'tablet_age_2010', type: 'world_event', era: 0, ageRange: [3, 3], title: '平板电脑时代', baseText: '2013年，平板电脑开始普及，{tablet_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家买了最新款的平板电脑，你玩着上面的益智游戏。'; if (attrs.network >= 40) return '你父亲买了第一部平板电脑，你跟着他一起看动画片。'; return '你去邻居家看他们玩平板电脑，觉得特别神奇。'; },
    options: [{ id: 'learn_apps', text: '学习使用应用', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你很快就学会了操作平板，对新科技充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只会玩小游戏，其他什么都没学会。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你和小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 2 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2010', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'mobile_internet_2010', type: 'world_event', era: 0, ageRange: [5, 5], title: '移动互联网普及', baseText: '2015年，4G网络普及，移动互联网改变了生活。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家每个人都有智能手机，你学会了用手机和爷爷奶奶视频通话。'; if (attrs.iq >= 55) return '你对手机产生了浓厚的兴趣，开始学习编程基础。'; return '你看到大人们都在低头看手机，觉得很好奇。'; },
    options: [{ id: 'learn_digital', text: '学习数字技能', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你学会了使用各种应用，对数字世界充满好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只学会了玩游戏，其他什么都没学会。', attributeChanges: { iq: 2 } } }, { id: 'read_books', text: '读纸质书', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你喜欢纸质书的质感，阅读能力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得读书有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2010', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'short_video_2010', type: 'world_event', era: 0, ageRange: [7, 7], title: '短视频时代', baseText: '2017年，短视频平台风靡全国，{video_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你注册了短视频账号，成为了小小的创作者。'; if (attrs.eq >= 55) return '你喜欢看各种有趣的视频，学到了很多知识。'; return '你看到大人们都在刷短视频，觉得很好奇。'; },
    options: [{ id: 'create_content', text: '尝试创作', successRate: { network: 0.4, eq: 0.3 }, successOutcome: { description: '你学会了制作短视频，交到了更多朋友。', attributeChanges: { network: 5, fame: 3 } }, failureOutcome: { description: '你不太会拍，只是看别人玩。', attributeChanges: { network: 1 } } }, { id: 'focus_study', text: '专心学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你把精力放在学习上，成绩一直名列前茅。', attributeChanges: { iq: 5, wealth: 1 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'mobile_payment_2010', type: 'world_event', era: 0, ageRange: [8, 8], title: '移动支付时代', baseText: '2018年，移动支付普及，{payment_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家出门都不用带钱包，一部手机搞定一切。'; if (attrs.iq >= 55) return '你对手机支付产生了兴趣，开始了解金融知识。'; return '你看着大人们用手机付款，觉得特别神奇。'; },
    options: [{ id: 'learn_finance', text: '学习理财知识', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解金融知识，对经济现象产生了兴趣。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'save_money', text: '攒零花钱', successRate: { eq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始攒零花钱，学会了延迟满足。', attributeChanges: { eq: 3, wealth: 4 } }, failureOutcome: { description: '你很快就把零花钱花光了。', attributeChanges: { wealth: 1 } } }],
  },
  {
    id: '5g_era_2010', type: 'world_event', era: 0, ageRange: [9, 9], title: '5G时代来临', baseText: '2019年，5G网络开始建设，{5g_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了科技节，展示了5G相关的作品。'; if (attrs.iq >= 55) return '老师给你讲述5G的未来，你听得入迷。'; return '你跟着家人一起看5G新闻，虽然不懂但觉得很自豪。'; },
    options: [{ id: 'watch_news', text: '观看5G新闻', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你感受到了科技的力量，心中充满了向往。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '新闻太专业了，你只看了片段。', attributeChanges: { iq: 1 } } }, { id: 'join_tech', text: '参加科技活动', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的科技活动，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在活动中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2010', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];

// ==========================================
// 2060年代事件（出生年份2060，0-9岁对应2060-2069年）
// 特色：深空探索、星际旅行、外星资源开发
// ==========================================
export const SCRIPT_2060_EVENTS: GameEvent[] = [
  {
    id: 'born_2060', type: 'world_event', era: 0, ageRange: [0, 0], title: '深空时代', baseText: '2060年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，父母在深空探索企业工作，家里有星际全息投影。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里能看到深空探测器的新闻，父亲说那是通往星辰的路。'; return '你出生在深空时代，虽然家境一般，但星际探索为人类打开了新的边疆。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2060', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2060', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'interstellar_travel_2060', type: 'world_event', era: 0, ageRange: [3, 3], title: '星际旅行商业化', baseText: '2063年，星际旅行商业化，{travel_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有星际旅行的VR体验舱，你可以体验飞往比邻星的感觉。'; if (attrs.network >= 40) return '你父亲在星际旅行公司工作，经常给你讲太空的故事。'; return '你看到电视里的星际旅行广告，觉得特别神奇。'; },
    options: [{ id: 'experience_vr', text: '体验VR星际旅行', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你体验了VR星际旅行，对宇宙充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你觉得VR有些晕，不敢多玩。', attributeChanges: { iq: 1 } } }, { id: 'play_with_toys', text: '玩太空玩具', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '玩具飞船被你弄坏了，你哭了一场。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2060', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'alien_resources_2060', type: 'world_event', era: 0, ageRange: [5, 5], title: '外星资源开发', baseText: '2065年，外星资源开发取得突破，{resources_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有外星矿石标本，你可以了解来自其他星球的矿物。'; if (attrs.iq >= 55) return '你对外星资源产生了浓厚的兴趣，开始了解宇宙矿物学。'; return '你在学校看了外星资源开发的纪录片，觉得特别神奇。'; },
    options: [{ id: 'learn_resources', text: '了解外星资源', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你了解了外星资源的种类，对宇宙产生好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只记住了外星矿石很漂亮。', attributeChanges: { iq: 2 } } }, { id: 'draw_space', text: '画外星画', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你画了很多外星世界的画，想象力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得画画有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2060', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'warp_drive_2060', type: 'world_event', era: 0, ageRange: [7, 7], title: '曲速引擎时代', baseText: '2067年，曲速引擎技术突破，{warp_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你参加了学校的曲速引擎设计比赛，成为了小小工程师。'; if (attrs.eq >= 55) return '你学会了团队合作，和同学们一起完成了曲速引擎模型。'; return '你看了曲速引擎的纪录片，觉得特别酷。'; },
    options: [{ id: 'join_engineering_club', text: '参加工程社团', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你参加了学校的工程社团，学到了很多知识。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你不太适应社团活动，但也很开心。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'interstellar_colony_2060', type: 'world_event', era: 0, ageRange: [8, 8], title: '星际殖民地', baseText: '2068年，星际殖民地建设启动，{colony_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有星际殖民地的全息投影，你可以看到其他星球的城市。'; if (attrs.iq >= 55) return '你对星际殖民地产生了浓厚的兴趣，开始了解外星居住。'; return '你在学校听老师讲星际殖民地的故事，觉得特别神奇。'; },
    options: [{ id: 'learn_colony', text: '了解星际殖民地', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解星际殖民地技术，对科技产生了兴趣。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'galaxy_exploration_2060', type: 'world_event', era: 0, ageRange: [9, 9], title: '银河探索', baseText: '2069年，银河探索计划启动，{galaxy_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了银河探索设计比赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你银河探索的知识，你听得入迷。'; return '你跟着家人一起看银河探索的新闻，觉得特别酷。'; },
    options: [{ id: 'learn_galaxy', text: '了解银河探索', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你了解了银河探索的发展，心中充满了向往。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '新闻太专业了，你只看了片段。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2060', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];

// ==========================================
// 2070年代事件（出生年份2070，0-9岁对应2070-2079年）
// 特色：未来科技、意识网络、多元宇宙探索
// ==========================================
export const SCRIPT_2070_EVENTS: GameEvent[] = [
  {
    id: 'born_2070', type: 'world_event', era: 0, ageRange: [0, 0], title: '未来纪元', baseText: '2070年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有意识网络设备，父母都是多元宇宙研究员。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚装了意识网络终端，母亲说这是连接未来的桥梁。'; return '你出生在未来纪元，虽然家境一般，但意识网络技术带来了无限可能。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2070', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2070', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷随地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'consciousness_network_2070', type: 'world_event', era: 0, ageRange: [3, 3], title: '意识网络时代', baseText: '2073年，意识网络建成，{consciousness_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有了意识网络终端，你可以用意念和远方的朋友交流。'; if (attrs.network >= 40) return '你父亲买了意识网络设备，你喜欢用它学习新知识。'; return '你看到别的小朋友用意识网络设备，觉得特别神奇。'; },
    options: [{ id: 'learn_consciousness', text: '学习意识网络', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你学会了用意识网络交流，对科技充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只学会了用意识网络玩游戏。', attributeChanges: { iq: 1 } } }, { id: 'play_with_kids', text: '和小伙伴玩', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2070', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'multiverse_exploration_2070', type: 'world_event', era: 0, ageRange: [5, 5], title: '多元宇宙探索', baseText: '2075年，多元宇宙探索启动，{multiverse_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有多元宇宙体验舱，你可以体验平行世界的自己。'; if (attrs.iq >= 55) return '你对多元宇宙产生了浓厚的兴趣，开始了解平行世界。'; return '你在学校看了多元宇宙的纪录片，觉得特别神奇。'; },
    options: [{ id: 'learn_multiverse', text: '了解多元宇宙', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你了解了多元宇宙的理论，对平行世界产生好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只记住了多元宇宙有很多个自己。', attributeChanges: { iq: 2 } } }, { id: 'play_game', text: '玩游戏', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你玩了很多有趣的游戏，想象力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得游戏有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2070', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'time_travel_2070', type: 'world_event', era: 0, ageRange: [7, 7], title: '时间旅行理论', baseText: '2077年，时间旅行理论取得突破，{time_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你参加了学校的时间旅行设计比赛，成为了小小科学家。'; if (attrs.eq >= 55) return '你学会了团队合作，和同学们一起完成了时间机器模型。'; return '你看了时间旅行的纪录片，觉得特别酷。'; },
    options: [{ id: 'join_science_club', text: '参加科学社团', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你参加了学校的科学社团，学到了很多知识。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你不太适应社团活动，但也很开心。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'dimension_shift_2070', type: 'world_event', era: 0, ageRange: [8, 8], title: '维度跃迁', baseText: '2078年，维度跃迁技术取得突破，{dimension_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有维度体验舱，你可以体验不同维度的世界。'; if (attrs.iq >= 55) return '你对维度跃迁产生了浓厚的兴趣，开始了解高维空间。'; return '你在学校听老师讲维度跃迁的故事，觉得特别神奇。'; },
    options: [{ id: 'learn_dimension', text: '了解维度跃迁', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解维度跃迁技术，对空间产生了新的理解。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'cosmic_consciousness_2070', type: 'world_event', era: 0, ageRange: [9, 9], title: '宇宙意识', baseText: '2079年，宇宙意识网络启动，{cosmic_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了宇宙意识设计比赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你宇宙意识的知识，你听得入迷。'; return '你跟着家人一起看宇宙意识的新闻，觉得特别酷。'; },
    options: [{ id: 'learn_cosmic', text: '了解宇宙意识', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你了解了宇宙意识的发展，心中充满了向往。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '新闻太专业了，你只看了片段。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2070', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];
// ==========================================
// 2050年代事件（出生年份2050，0-9岁对应2050-2059年）
// 特色：人机融合、脑机接口、意识上传
// ==========================================
export const SCRIPT_2050_EVENTS: GameEvent[] = [
  {
    id: 'born_2050', type: 'world_event', era: 0, ageRange: [0, 0], title: '人机融合时代', baseText: '2050年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有神经接口设备，父母都是脑机接口研究员。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚装了脑机接口学习机，母亲说这是最好的教育工具。'; return '你出生在人机融合时代，虽然家境一般，但脑机接口技术带来了新的可能。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2050', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2050', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'brain_computer_2050', type: 'world_event', era: 0, ageRange: [3, 3], title: '脑机接口启蒙', baseText: '2053年，脑机接口技术普及，{bci_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有了儿童脑机接口学习头盔，你可以用意念控制玩具。'; if (attrs.network >= 40) return '你父亲买了脑机接口学习机，你喜欢用它学习新知识。'; return '你看到别的小朋友用脑机接口玩玩具，觉得特别神奇。'; },
    options: [{ id: 'learn_bci', text: '学习脑机接口', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你学会了用脑机接口学习，对科技充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只学会了用脑机接口玩游戏。', attributeChanges: { iq: 1 } } }, { id: 'play_with_kids', text: '和小伙伴玩', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2050', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'mind_upload_2050', type: 'world_event', era: 0, ageRange: [5, 5], title: '意识上传实验', baseText: '2055年，意识上传技术取得突破，{upload_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有意识备份设备，你可以体验虚拟永生。'; if (attrs.iq >= 55) return '你对意识上传产生了浓厚的兴趣，开始了解数字生命。'; return '你在学校看了意识上传的纪录片，觉得特别神奇。'; },
    options: [{ id: 'learn_upload', text: '了解意识上传', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你了解了意识上传的原理，对数字生命产生好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只记住了意识可以上传到电脑。', attributeChanges: { iq: 2 } } }, { id: 'play_game', text: '玩游戏', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你玩了很多有趣的游戏，想象力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得游戏有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2050', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'neural_enhance_2050', type: 'world_event', era: 0, ageRange: [7, 7], title: '神经增强时代', baseText: '2057年，神经增强技术普及，{neural_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你有了神经增强头盔，学习效率大大提升。'; if (attrs.eq >= 55) return '你学会了专注力训练，学习变得更加高效。'; return '你看到同学们都用神经增强设备，觉得很好奇。'; },
    options: [{ id: 'use_neural', text: '使用神经增强', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你通过神经增强，学习效率大大提升。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你不太习惯神经增强，效果一般。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'digital_immortality_2050', type: 'world_event', era: 0, ageRange: [8, 8], title: '数字永生', baseText: '2058年，数字永生成为现实，{immortality_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有数字永生服务，你可以和已故亲人的数字分身对话。'; if (attrs.iq >= 55) return '你对数字永生产生了浓厚的兴趣，开始了解生命的意义。'; return '你在学校听老师讲数字永生的故事，觉得特别神奇。'; },
    options: [{ id: 'learn_immortality', text: '了解数字永生', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解数字永生技术，对生命产生了新的理解。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'human_machine_2050', type: 'world_event', era: 0, ageRange: [9, 9], title: '人机共生', baseText: '2059年，人机共生成为主流，{symbiosis_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了人机共生设计比赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你人机共生的知识，你听得入迷。'; return '你跟着家人一起看人机共生的新闻，觉得特别酷。'; },
    options: [{ id: 'learn_symbiosis', text: '了解人机共生', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你了解了人机共生的发展，心中充满了向往。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '新闻太专业了，你只看了片段。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2050', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];
// ==========================================
// 2040年代事件（出生年份2040，0-9岁对应2040-2049年）
// 特色：星际探索、太空商业化、火星殖民
// ==========================================
export const SCRIPT_2040_EVENTS: GameEvent[] = [
  {
    id: 'born_2040', type: 'world_event', era: 0, ageRange: [0, 0], title: '星际黎明', baseText: '2040年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，父母在太空企业工作，家里有全息投影的星空穹顶。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里能看到太空电梯的灯光，父亲说那是通天的路。'; return '你出生在星际时代，虽然家境一般，但太空探索为人类打开了新的边疆。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2040', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2040', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'space_elevator_2040', type: 'world_event', era: 0, ageRange: [3, 3], title: '太空电梯时代', baseText: '2043年，太空电梯建成，{elevator_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有太空电梯的模型，你可以想象乘坐它飞向太空。'; if (attrs.network >= 40) return '你父亲在太空电梯基地工作，经常给你讲太空的故事。'; return '你看到电视里的太空电梯，觉得特别神奇。'; },
    options: [{ id: 'learn_space', text: '了解太空知识', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你了解了太空电梯的原理，对宇宙充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只记住了太空电梯很高很高。', attributeChanges: { iq: 1 } } }, { id: 'play_with_toys', text: '玩太空玩具', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小伙伴们一起玩太空玩具，度过了快乐的时光。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '玩具火箭被你弄坏了，你哭了一场。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2040', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'moon_base_2040', type: 'world_event', era: 0, ageRange: [5, 5], title: '月球基地', baseText: '2045年，月球永久基地建成，{moon_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有全息投影的月球基地模型，你可以虚拟参观。'; if (attrs.iq >= 55) return '你对月球基地产生了浓厚的兴趣，开始了解太空生活。'; return '你在学校看了月球基地的纪录片，觉得特别神奇。'; },
    options: [{ id: 'learn_moon', text: '了解月球基地', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你了解了月球基地的生活，对太空探索产生好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只记住了月球上没有空气。', attributeChanges: { iq: 2 } } }, { id: 'draw_space', text: '画太空画', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你画了很多太空的画，想象力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得画画有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2040', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'mars_migration_2040', type: 'world_event', era: 0, ageRange: [7, 7], title: '火星移民计划', baseText: '2047年，火星移民计划启动，{mars_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你参加了学校的火星移民模拟活动，成为了小小宇航员。'; if (attrs.eq >= 55) return '你学会了团队合作，和同学们一起完成了火星任务模拟。'; return '你看了火星移民的纪录片，觉得特别酷。'; },
    options: [{ id: 'join_space_club', text: '参加太空社团', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你参加了学校的太空社团，学到了很多知识。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你不太适应社团活动，但也很开心。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'asteroid_mining_2040', type: 'world_event', era: 0, ageRange: [8, 8], title: '小行星采矿', baseText: '2048年，小行星采矿成为现实，{asteroid_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有全息投影的太阳系模型，你可以看到采矿飞船的位置。'; if (attrs.iq >= 55) return '你对小行星采矿产生了浓厚的兴趣，开始了解太空资源。'; return '你在学校听老师讲小行星采矿的故事，觉得特别神奇。'; },
    options: [{ id: 'learn_asteroid', text: '了解小行星采矿', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解太空采矿技术，对科技产生了兴趣。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'space_tourism_2040', type: 'world_event', era: 0, ageRange: [9, 9], title: '太空旅游时代', baseText: '2049年，太空旅游商业化，{tourism_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了太空旅游设计比赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你太空旅游的知识，你听得入迷。'; return '你跟着家人一起看太空旅游的新闻，觉得特别酷。'; },
    options: [{ id: 'learn_tourism', text: '了解太空旅游', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你了解了太空旅游的发展，心中充满了向往。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '新闻太专业了，你只看了片段。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2040', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];
// ==========================================
// 2030年代事件（出生年份2030，0-9岁对应2030-2039年）
// 特色：能源革命、新能源技术、碳中和
// ==========================================
export const SCRIPT_2030_EVENTS: GameEvent[] = [
  {
    id: 'born_2030', type: 'world_event', era: 0, ageRange: [0, 0], title: '能源革命', baseText: '2030年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有太阳能发电系统，父母都在新能源企业工作。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚换了新能源汽车，父亲说这是未来的趋势。'; return '你出生在能源革命时代，虽然家境一般，但新能源技术带来了新的希望。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2030', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2030', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'electric_vehicle_2030', type: 'world_event', era: 0, ageRange: [3, 3], title: '新能源汽车时代', baseText: '2033年，新能源汽车全面取代燃油车，{ev_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家买了最新款的电动汽车，你坐在车里觉得特别安静。'; if (attrs.network >= 40) return '你父亲在新能源汽车工厂工作，经常给你讲汽车的故事。'; return '你看到街上越来越多的电动汽车，觉得特别神奇。'; },
    options: [{ id: 'learn_about_ev', text: '了解电动汽车', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你了解了电动汽车的原理，对新科技充满了好奇。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只记住了汽车的样子，其他什么都没学会。', attributeChanges: { iq: 1 } } }, { id: 'play_with_toys', text: '玩汽车玩具', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小伙伴们一起玩汽车玩具，度过了快乐的时光。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '玩具汽车被你弄坏了，你哭了一场。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2030', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'carbon_neutral_2030', type: 'world_event', era: 0, ageRange: [5, 5], title: '碳中和教育', baseText: '2035年，碳中和理念深入人心，{carbon_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家参加了碳中和计划，院子里种了很多树。'; if (attrs.iq >= 55) return '你对环保产生了浓厚的兴趣，开始了解气候变化。'; return '你看到学校里张贴了很多环保海报，觉得很重要。'; },
    options: [{ id: 'learn_environment', text: '学习环保知识', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你了解了环保的重要性，对自然科学产生好奇。', attributeChanges: { iq: 5, fame: 1 } }, failureOutcome: { description: '你只记住了要节约用水用电。', attributeChanges: { iq: 2 } } }, { id: 'plant_trees', text: '参加植树活动', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小伙伴们一起种树，感受到了劳动的快乐。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '你挖土挖累了，休息了好一会儿。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'school_starts_2030', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'solar_roof_2030', type: 'world_event', era: 0, ageRange: [7, 7], title: '太阳能屋顶', baseText: '2037年，太阳能屋顶成为标配，{solar_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你家的太阳能屋顶发电，还能把多余的电卖给电网。'; if (attrs.eq >= 55) return '你学会了节约能源，随手关灯关电器。'; return '你看到邻居家的太阳能屋顶，觉得特别酷。'; },
    options: [{ id: 'learn_solar', text: '了解太阳能', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你了解了太阳能的原理，对新能源产生了兴趣。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你只记住了太阳能能发电。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'hydrogen_energy_2030', type: 'world_event', era: 0, ageRange: [8, 8], title: '氢能源时代', baseText: '2038年，氢能源技术取得突破，{hydrogen_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有氢能源热水器，洗澡水都可以用来发电。'; if (attrs.iq >= 55) return '你对氢能源产生了浓厚的兴趣，开始了解新能源技术。'; return '你在学校听老师讲氢能源的故事，觉得特别神奇。'; },
    options: [{ id: 'learn_hydrogen', text: '学习氢能源知识', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解氢能源技术，对科技产生了兴趣。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'green_life_2030', type: 'world_event', era: 0, ageRange: [9, 9], title: '绿色生活', baseText: '2039年，绿色生活方式成为主流，{green_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了环保知识竞赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你如何保护环境，你听得入迷。'; return '你跟着家人一起参加社区环保活动，觉得很有意义。'; },
    options: [{ id: 'join_environment', text: '参加环保活动', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你参加了社区的环保活动，心中充满了责任感。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '活动很累，但你学到了很多。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2030', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];

// ==========================================
// 2020年代事件（出生年份2020，0-9岁对应2020-2029年）
// 特色：AI、元宇宙、虚拟现实
// ==========================================
export const SCRIPT_2020_EVENTS: GameEvent[] = [
  {
    id: 'born_2020', type: 'world_event', era: 0, ageRange: [0, 0], title: '智能纪元', baseText: '2020年，{newborn_context}。你来到了这个世界。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你出生在一个富裕家庭，家里有智能机器人管家，父母都是AI工程师。'; if (attrs.wealth >= 20) return '你出生在一个普通家庭，家里刚装了智能音箱，母亲喜欢用AI助手播放儿歌。'; return '你出生在智能时代，虽然家境一般，但AI技术为你带来了新的可能。'; },
    options: [{ id: 'start_life', text: '开始新的人生', successRate: { energy: 0.5 }, successOutcome: { description: '你来到了这个世界，开始了新的人生旅程。', attributeChanges: { health: 5 } }, failureOutcome: { description: '生命的开始总是伴随着未知。', attributeChanges: {} } }],
    isMilestone: true,
  },
  {
    id: 'toddler_first_steps_2020', type: 'fixed', era: 0, ageRange: [1, 1], title: '蹒跚学步', baseText: '一岁的你开始尝试着迈出人生的第一步。',
    skinRule: (attrs) => { if (attrs.physique >= 60) return '你身体壮实，没几天就能摇摇晃晃地走了。'; if (attrs.health >= 55) return '你虽然瘦小，但好奇心驱使你不断尝试。'; return '你走得比别的孩子晚一些，但每一步都稳稳当当。'; },
    options: [{ id: 'explore_room', text: '在家里探索', successRate: { physique: 0.3, energy: 0.4 }, successOutcome: { description: '你摸遍了家里的每个角落，对世界充满了好奇。', attributeChanges: { physique: 2, iq: 1 } }, failureOutcome: { description: '你摔了一跤，哇哇大哭，但很快又爬了起来。', attributeChanges: { energy: -1 } } }, { id: 'stay_close_parents', text: '依偎在父母身边', successRate: { eq: 0.5 }, successOutcome: { description: '父母的怀抱给了你安全感，你笑得格外灿烂。', attributeChanges: { eq: 2, health: 1 } }, failureOutcome: { description: '你有些认生，但父母的爱让你慢慢放松下来。', attributeChanges: { eq: 1 } } }],
  },
  {
    id: 'early_childhood_2020', type: 'fixed', era: 0, ageRange: [2, 2], title: '幼年时光', baseText: '两岁的你开始认识这个世界，家里来了客人。',
    skinRule: (attrs) => { if (attrs.eq >= 55) return '你一点也不怕生，主动叫叔叔阿姨，大家都夸你聪明。'; if (attrs.iq >= 55) return '你虽然不太说话，但眼睛滴溜溜地转，观察着一切。'; return '你躲在母亲身后，偷偷地看着这些陌生人。'; },
    options: [{ id: 'greet_guests', text: '主动打招呼', successRate: { eq: 0.5, network: 0.2 }, successOutcome: { description: '你的大方得体让客人们都夸赞不已。', attributeChanges: { eq: 3, network: 2 } }, failureOutcome: { description: '你喊错了称呼，惹得大人们哈哈大笑。', attributeChanges: { eq: 1 } } }, { id: 'play_alone', text: '自己玩玩具', successRate: { iq: 0.4 }, successOutcome: { description: '你专注地摆弄着玩具，发现了新的玩法。', attributeChanges: { iq: 3 } }, failureOutcome: { description: '玩具被你弄坏了，你哭了一场。', attributeChanges: {} } }],
  },
  {
    id: 'ai_companion_2020', type: 'world_event', era: 0, ageRange: [3, 3], title: 'AI陪伴时代', baseText: '2023年，AI助手走进千家万户，{ai_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有了智能AI助手，它能陪你聊天、教你认字。'; if (attrs.network >= 40) return '你父亲给家里装了智能音箱，你喜欢和它对话。'; return '你看到别的小朋友和AI助手玩，觉得特别神奇。'; },
    options: [{ id: 'interact_ai', text: '和AI互动', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你和AI成为了好朋友，学到了很多新知识。', attributeChanges: { iq: 4, fame: 1 } }, failureOutcome: { description: '你只会让AI放动画片。', attributeChanges: { iq: 1 } } }, { id: 'play_with_kids', text: '和小伙伴玩', successRate: { physique: 0.4, network: 0.3 }, successOutcome: { description: '你和小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, network: 2 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'kindergarten_2020', type: 'fixed', era: 0, ageRange: [4, 4], title: '幼儿园时光', baseText: '镇上新开了幼儿园，你有了和小小朋友们一起玩耍的地方。',
    skinRule: (attrs) => { if (attrs.eq >= 55 && attrs.network >= 40) return '你很快就交到了很多朋友，是孩子王。'; if (attrs.iq >= 55) return '你最喜欢听老师讲故事，学得又快又好。'; return '你有些害羞，但慢慢也适应了集体生活。'; },
    options: [{ id: 'make_friends', text: '交朋友', successRate: { eq: 0.4, network: 0.4 }, successOutcome: { description: '你和小伙伴们一起玩耍，度过了快乐的时光。', attributeChanges: { network: 4, eq: 2 } }, failureOutcome: { description: '你和别人起了冲突，但很快就和好了。', attributeChanges: { eq: 1 } } }, { id: 'learn_songs', text: '学唱歌跳舞', successRate: { iq: 0.3, energy: 0.4 }, successOutcome: { description: '你学会了第一首歌，回家唱给父母听。', attributeChanges: { iq: 2, fame: 2 } }, failureOutcome: { description: '你总是跑调，但大家依然给你鼓掌。', attributeChanges: { energy: 1 } } }],
  },
  {
    id: 'metaverse_intro_2020', type: 'world_event', era: 0, ageRange: [5, 5], title: '元宇宙初体验', baseText: '2025年，虚拟现实技术走进家庭，{metaverse_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家买了VR眼镜，你可以进入虚拟世界玩耍。'; if (attrs.iq >= 55) return '你对虚拟现实产生了浓厚的兴趣，开始了解这个新领域。'; return '你在商场体验了一次VR游戏，觉得特别神奇。'; },
    options: [{ id: 'explore_vr', text: '探索虚拟世界', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你学会了使用VR设备，对数字世界充满好奇。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你觉得VR有些晕，不敢多玩。', attributeChanges: { iq: 2 } } }, { id: 'read_books', text: '读纸质书', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你喜欢纸质书的质感，阅读能力大大提升。', attributeChanges: { iq: 4, eq: 3 } }, failureOutcome: { description: '你觉得读书有些枯燥。', attributeChanges: { iq: 1 } } }],
  },
  {
    id: 'school_starts_2020', type: 'fixed', era: 0, ageRange: [6, 6], title: '背上书包', baseText: '六岁的你终于到了上学的年纪，{school_start_context}。',
    skinRule: (attrs) => { if (attrs.iq >= 60 && attrs.wealth >= 30) return '你背着崭新的书包，穿着整洁的校服，神气极了。'; if (attrs.iq >= 60) return '你虽然穿着旧衣服，但书包是母亲亲手缝的，你格外珍惜。'; return '你不太想上学，但父亲说读书才能有出息。'; },
    options: [{ id: 'study_hard', text: '发奋读书', successRate: { iq: 0.4, energy: 0.3 }, successOutcome: { description: '你的成绩突飞猛进，成为班级的尖子生。', attributeChanges: { iq: 5, energy: -2 } }, failureOutcome: { description: '你虽然努力，但进步并不明显。', attributeChanges: { energy: -3 } } }, { id: 'help_family', text: '帮家里干活', successRate: { physique: 0.4, energy: 0.3 }, successOutcome: { description: '你成为家里的好帮手，邻里都夸你懂事。', attributeChanges: { physique: 4, network: 3 } }, failureOutcome: { description: '繁重的体力活让你疲惫不堪。', attributeChanges: { energy: -5 } } }],
    isMilestone: true,
  },
  {
    id: 'ai_tutor_2020', type: 'world_event', era: 0, ageRange: [7, 7], title: 'AI学习助手', baseText: '2027年，AI辅导系统普及，{ai_tutor_context}。',
    skinRule: (attrs) => { if (attrs.network >= 50) return '你有了专属的AI学习助手，它根据你的进度定制课程。'; if (attrs.eq >= 55) return '你喜欢和AI互动学习，觉得学习变得更有趣了。'; return '你看到同学们都用AI学习，觉得很好奇。'; },
    options: [{ id: 'use_ai_tutor', text: '使用AI辅导', successRate: { network: 0.4, iq: 0.3 }, successOutcome: { description: '你通过AI辅导，学习效率大大提升。', attributeChanges: { iq: 5, fame: 2 } }, failureOutcome: { description: '你不太习惯AI教学，效果一般。', attributeChanges: { iq: 2 } } }, { id: 'traditional_learn', text: '传统学习', successRate: { iq: 0.5, energy: 0.2 }, successOutcome: { description: '你坚持传统学习方式，成绩依然优秀。', attributeChanges: { iq: 5, eq: 2 } }, failureOutcome: { description: '你虽然努力，但觉得学习有些枯燥。', attributeChanges: { iq: 2 } } }],
  },
  {
    id: 'smart_home_2020', type: 'world_event', era: 0, ageRange: [8, 8], title: '智能家居时代', baseText: '2028年，智能家居全面普及，{smart_home_context}。',
    skinRule: (attrs) => { if (attrs.wealth >= 40) return '你家有智能灯光、智能窗帘、智能扫地机器人，生活非常便利。'; if (attrs.iq >= 55) return '你对智能家居产生了浓厚的兴趣，开始了解物联网技术。'; return '你看到广告里的智能家居，觉得特别酷。'; },
    options: [{ id: 'learn_iot', text: '学习物联网知识', successRate: { iq: 0.4, wealth: 0.3 }, successOutcome: { description: '你开始了解物联网技术，对科技产生了兴趣。', attributeChanges: { iq: 4, wealth: 3 } }, failureOutcome: { description: '你还太小，不太理解这些概念。', attributeChanges: { iq: 1 } } }, { id: 'play_outside', text: '户外玩耍', successRate: { physique: 0.4, health: 0.3 }, successOutcome: { description: '你和小伙伴们一起玩耍，身体越来越壮。', attributeChanges: { physique: 4, health: 3 } }, failureOutcome: { description: '你摔了一跤，膝盖破了皮。', attributeChanges: { energy: -2 } } }],
  },
  {
    id: 'digital_citizen_2020', type: 'world_event', era: 0, ageRange: [9, 9], title: '数字公民', baseText: '2029年，数字素养成为必备技能，{digital_context}。',
    skinRule: (attrs) => { if (attrs.fame >= 50) return '你在学校参加了数字素养大赛，获得了奖项。'; if (attrs.iq >= 55) return '老师教你如何正确使用互联网，你听得入迷。'; return '你跟着老师学习网络安全知识，觉得很有用。'; },
    options: [{ id: 'learn_digital', text: '学习数字素养', successRate: { iq: 0.4, eq: 0.3 }, successOutcome: { description: '你学会了如何安全使用互联网，心中充满了自信。', attributeChanges: { iq: 3, eq: 3 } }, failureOutcome: { description: '课程有些复杂，你只学了基础。', attributeChanges: { iq: 1 } } }, { id: 'join_club', text: '参加兴趣社团', successRate: { network: 0.4, energy: 0.3 }, successOutcome: { description: '你参加了学校的兴趣社团，认识了很多朋友。', attributeChanges: { network: 4, fame: 2 } }, failureOutcome: { description: '你在社团中表现一般，但也很开心。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
  {
    id: 'era_transition_2020', type: 'world_event', era: 0, ageRange: [9, 9], title: '十年光阴', baseText: '转眼间，你已经从一个婴儿长成了十岁的少年。',
    skinRule: (attrs, _history, tags) => { const a: string[] = []; if (attrs.iq >= 60) a.push('聪明好学'); if (attrs.network >= 50) a.push('善于社交'); if (attrs.physique >= 60) a.push('身体健壮'); if (attrs.eq >= 50) a.push('情商高'); if (tags.length > 0) a.push(`获得了"${tags[0]}"的称号`); return a.length === 0 ? '你的童年平淡而快乐，没有什么特别的故事。' : `这十年里，你${a.join('、')}，童年充实而有意义。`; },
    options: [{ id: 'look_forward', text: '展望未来', successRate: { energy: 0.3, eq: 0.3 }, successOutcome: { description: '你满怀期待地准备迎接新的十年。', attributeChanges: { energy: 3, eq: 2, fame: 1 } }, failureOutcome: { description: '你对未来有些迷茫，但依然充满希望。', attributeChanges: { energy: 1 } } }],
    isMilestone: true,
  },
];