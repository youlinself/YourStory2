import type { Enemy, EnemyMechanic } from '../types/simulation';

// ==========================================
// 怪物名称阶段性映射系统
// ==========================================

/**
 * 年龄段枚举 - 与游戏生命周期对应
 */
export enum AgeStage {
  INFANT = 'infant',           // 0-5岁 婴幼儿
  CHILDHOOD = 'childhood',     // 6-9岁 童年
  ADOLESCENT = 'adolescent',   // 10-14岁 少年
  TEENAGER = 'teenager',       // 15-19岁 青少年
  YOUTH = 'youth',             // 20-29岁 青年
  PRIME = 'prime',             // 30-39岁 壮年
  MIDDLE_AGE = 'middleAge',    // 40-49岁 中年
  KNOWING_DESTINY = 'knowingDestiny', // 50-59岁 知天命
  FLOWERY_JIA = 'floweryJia',  // 60-69岁 花甲
  ANCIENT_RARE = 'ancientRare', // 70-79岁 古稀
  STAFF_COURT = 'staffCourt',  // 80-89岁 杖朝
  CENTENARIAN = 'centenarian', // 90-110岁 期颐/长寿
  CULTIVATION = 'cultivation', // 110岁+ 修仙
}

/**
 * 根据年龄获取年龄段
 */
export function getAgeStage(age: number): AgeStage {
  if (age < 6) return AgeStage.INFANT;
  if (age < 10) return AgeStage.CHILDHOOD;
  if (age < 15) return AgeStage.ADOLESCENT;
  if (age < 20) return AgeStage.TEENAGER;
  if (age < 30) return AgeStage.YOUTH;
  if (age < 40) return AgeStage.PRIME;
  if (age < 50) return AgeStage.MIDDLE_AGE;
  if (age < 60) return AgeStage.KNOWING_DESTINY;
  if (age < 70) return AgeStage.FLOWERY_JIA;
  if (age < 80) return AgeStage.ANCIENT_RARE;
  if (age < 90) return AgeStage.STAFF_COURT;
  if (age <= 110) return AgeStage.CENTENARIAN;
  return AgeStage.CULTIVATION;
}

/**
 * 获取年龄段中文名
 */
export function getAgeStageName(stage: AgeStage): string {
  const names: Record<AgeStage, string> = {
    [AgeStage.INFANT]: '婴幼儿',
    [AgeStage.CHILDHOOD]: '童年',
    [AgeStage.ADOLESCENT]: '少年',
    [AgeStage.TEENAGER]: '青少年',
    [AgeStage.YOUTH]: '青年',
    [AgeStage.PRIME]: '壮年',
    [AgeStage.MIDDLE_AGE]: '中年',
    [AgeStage.KNOWING_DESTINY]: '知天命',
    [AgeStage.FLOWERY_JIA]: '花甲',
    [AgeStage.ANCIENT_RARE]: '古稀',
    [AgeStage.STAFF_COURT]: '杖朝',
    [AgeStage.CENTENARIAN]: '期颐',
    [AgeStage.CULTIVATION]: '修仙',
  };
  return names[stage];
}

// ==========================================
// 普通怪物 - 按类型分阶段映射
// ==========================================

/**
 * 怪物变体接口
 */
export interface MonsterVariant {
  name: string;
  icon: string;
  description: string;
  cardTags: string[];
}

/**
 * 普通怪物类型映射
 * 每种怪物类型在不同年龄段有不同的名称和外观
 */
export const NORMAL_MONSTER_VARIANTS: Record<string, Record<AgeStage, MonsterVariant>> = {
  // 拖延系怪物
  slime: {
    [AgeStage.INFANT]: {
      name: '困倦睡魔',
      icon: '😴',
      description: '婴儿期的困倦感，让你无法专注于探索世界',
      cardTags: ['婴儿', '睡眠'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '玩耍诱惑精灵',
      icon: '🎈',
      description: '窗外的玩耍声让你无法专心写作业',
      cardTags: ['童年', '玩耍'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '游戏成瘾怪',
      icon: '🎮',
      description: '电子世界的诱惑让你沉迷其中无法自拔',
      cardTags: ['少年', '游戏'],
    },
    [AgeStage.TEENAGER]: {
      name: '青春散漫怪',
      icon: '🌪️',
      description: '青春期的躁动让你难以静下心来',
      cardTags: ['青少年', '躁动'],
    },
    [AgeStage.YOUTH]: {
      name: '熬夜手机怪',
      icon: '📱',
      description: '刷不完的手机，熬不完的夜',
      cardTags: ['青年', '熬夜'],
    },
    [AgeStage.PRIME]: {
      name: '工作拖延傀儡',
      icon: '📋',
      description: '堆积如山的文件，总是明天再说',
      cardTags: ['壮年', '工作'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '事业瓶颈兽',
      icon: '📊',
      description: '上升无望，却又不敢改变',
      cardTags: ['中年', '瓶颈'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '改变恐惧兽',
      icon: '😰',
      description: '害怕改变，宁愿维持现状',
      cardTags: ['知天命', '恐惧'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '学习新事物恐惧怪',
      icon: '🤔',
      description: '新手机、新功能，学不会啊',
      cardTags: ['花甲', '学习'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '回忆沉迷怪',
      icon: '📷',
      description: '总是沉浸在过去的回忆里',
      cardTags: ['古稀', '回忆'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '怀旧执念怪',
      icon: '🕰️',
      description: '过去的美好时光总是让人怀念',
      cardTags: ['杖朝', '怀旧'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '时光留恋怪',
      icon: '⏳',
      description: '感叹时光飞逝，想要抓住每一刻',
      cardTags: ['期颐', '时光'],
    },
    [AgeStage.CULTIVATION]: {
      name: '凡心执念怪',
      icon: '💭',
      description: '尘世的牵挂，修行的障碍',
      cardTags: ['修仙', '执念'],
    },
  },

  // 焦虑系怪物
  ghost: {
    [AgeStage.INFANT]: {
      name: '分离焦虑精灵',
      icon: '👶',
      description: '妈妈不在身边，好害怕',
      cardTags: ['婴儿', '分离'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '黑暗恐惧小鬼',
      icon: '🌙',
      description: '黑漆漆的房间，好像有什么东西',
      cardTags: ['童年', '恐惧'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '考试焦虑幽灵',
      icon: '📝',
      description: '考试考试考试，永远考不完的试',
      cardTags: ['少年', '考试'],
    },
    [AgeStage.TEENAGER]: {
      name: '青春期焦虑怪',
      icon: '🪞',
      description: '脸上的痘痘，莫名的烦躁',
      cardTags: ['青少年', '焦虑'],
    },
    [AgeStage.YOUTH]: {
      name: '社交焦虑幻影',
      icon: '👥',
      description: '害怕社交，害怕被评价',
      cardTags: ['青年', '社交'],
    },
    [AgeStage.PRIME]: {
      name: '比较焦虑怪',
      icon: '📈',
      description: '同龄人都已经功成名就，你呢？',
      cardTags: ['壮年', '比较'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '健康焦虑幽灵',
      icon: '🏥',
      description: '身体一天不如一天，好担心',
      cardTags: ['中年', '健康'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '退休焦虑怪',
      icon: '🚪',
      description: '快要退休了，我还能做什么？',
      cardTags: ['知天命', '退休'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '价值焦虑幽灵',
      icon: '💭',
      description: '我还被需要吗？我还有价值吗？',
      cardTags: ['花甲', '价值'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '孤独焦虑怪',
      icon: '🌫️',
      description: '孩子们都不在身边，好孤独',
      cardTags: ['古稀', '孤独'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '疾病焦虑幽灵',
      icon: '💊',
      description: '身体稍有不适就担惊受怕',
      cardTags: ['杖朝', '疾病'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '生命尽头恐惧怪',
      icon: '🌅',
      description: '生命的终点似乎越来越近',
      cardTags: ['期颐', '恐惧'],
    },
    [AgeStage.CULTIVATION]: {
      name: '天劫焦虑怪',
      icon: '⛈️',
      description: '天劫将至，道心不稳',
      cardTags: ['修仙', '天劫'],
    },
  },

  // 责任系怪物
  golem: {
    [AgeStage.INFANT]: {
      name: '养育重担傀儡',
      icon: '🍼',
      description: '尿布、奶粉、夜啼...无尽的照顾',
      cardTags: ['婴儿', '养育'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '家庭期望傀儡',
      icon: '🏠',
      description: '爸爸妈妈的期望，像一座山压在身上',
      cardTags: ['童年', '期望'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '学业压力巨人',
      icon: '📚',
      description: '成绩、排名、升学...喘不过气',
      cardTags: ['少年', '学业'],
    },
    [AgeStage.TEENAGER]: {
      name: '未来抉择傀儡',
      icon: '🔀',
      description: '选文科还是理科？选什么专业？',
      cardTags: ['青少年', '抉择'],
    },
    [AgeStage.YOUTH]: {
      name: '房租贷款怪',
      icon: '🏦',
      description: '每个月工资还没到手就交给了银行',
      cardTags: ['青年', '房贷'],
    },
    [AgeStage.PRIME]: {
      name: '家庭责任巨兽',
      icon: '👨‍👩‍👧',
      description: '上有老下有小，不敢有丝毫懈怠',
      cardTags: ['壮年', '家庭'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '养老压力傀儡',
      icon: '🧓',
      description: '父母老了，孩子还小，你该怎么办？',
      cardTags: ['中年', '养老'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '代际牵挂怪',
      icon: '👴',
      description: '牵挂着下一代，又放不下上一代',
      cardTags: ['知天命', '牵挂'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '遗产分配傀儡',
      icon: '📜',
      description: '如何把财产公平地分给子女们',
      cardTags: ['花甲', '遗产'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '医疗负担怪',
      icon: '🏥',
      description: '看病、吃药、住院...沉重的负担',
      cardTags: ['古稀', '医疗'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '拖累家人恐惧怪',
      icon: '😔',
      description: '不想成为家人的负担',
      cardTags: ['杖朝', '负担'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '生命负担傀儡',
      icon: '🕯️',
      description: '活着本身，似乎都成了负担',
      cardTags: ['期颐', '负担'],
    },
    [AgeStage.CULTIVATION]: {
      name: '尘缘牵挂怪',
      icon: '🔗',
      description: '尘世的因缘纠葛，难以斩断',
      cardTags: ['修仙', '尘缘'],
    },
  },

  // 自我怀疑系怪物
  wraith: {
    [AgeStage.INFANT]: {
      name: '存在疑惑精灵',
      icon: '❓',
      description: '我是谁？我为什么在这里？',
      cardTags: ['婴儿', '存在'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '自卑小妖',
      icon: '😢',
      description: '为什么我不如别人？',
      cardTags: ['童年', '自卑'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '身份认同幽灵',
      icon: '🪞',
      description: '我是谁？我要成为什么样的人？',
      cardTags: ['少年', '认同'],
    },
    [AgeStage.TEENAGER]: {
      name: '外貌焦虑怪',
      icon: '😳',
      description: '为什么我不够好看？',
      cardTags: ['青少年', '外貌'],
    },
    [AgeStage.YOUTH]: {
      name: '职场迷茫怪',
      icon: '🛤️',
      description: '这真的是我想要的工作吗？',
      cardTags: ['青年', '迷茫'],
    },
    [AgeStage.PRIME]: {
      name: '成就焦虑魔',
      icon: '🏆',
      description: '别人都成功了，我是不是失败了？',
      cardTags: ['壮年', '成就'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '人生意义幻影',
      icon: '🌫️',
      description: '忙忙碌碌，到底为了什么？',
      cardTags: ['中年', '意义'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '价值质疑幽灵',
      icon: '🤷',
      description: '我这一生，有价值吗？',
      cardTags: ['知天命', '价值'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '被需要感缺失怪',
      icon: '👻',
      description: '好像没有我，世界也一样运转',
      cardTags: ['花甲', '缺失'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '记忆衰退恐惧怪',
      icon: '🧠',
      description: '刚说的话就忘了，我是不是老了？',
      cardTags: ['古稀', '记忆'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '生命价值追问者',
      icon: '❓',
      description: '我这一生，到底留下了什么？',
      cardTags: ['杖朝', '追问'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '一生回顾质疑怪',
      icon: '📖',
      description: '回顾一生，有遗憾吗？',
      cardTags: ['期颐', '回顾'],
    },
    [AgeStage.CULTIVATION]: {
      name: '道心不稳怪',
      icon: '💔',
      description: '修行之路，道心何在？',
      cardTags: ['修仙', '道心'],
    },
  },
};

// ==========================================
// 精英怪物 - 按类型分阶段映射
// ==========================================

export const ELITE_MONSTER_VARIANTS: Record<string, Record<AgeStage, MonsterVariant>> = {
  // 学业/成长精英
  academic: {
    [AgeStage.INFANT]: {
      name: '早教竞争精英',
      icon: '🍼',
      description: '别人家孩子已经开始学习了',
      cardTags: ['婴儿', '早教'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '课外班精英',
      icon: '🎨',
      description: '钢琴、书法、英语...永远排不完的课程',
      cardTags: ['童年', '兴趣班'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '升学压力精英',
      icon: '📝',
      description: '中考高考，千军万马过独木桥',
      cardTags: ['少年', '升学'],
    },
    [AgeStage.TEENAGER]: {
      name: '青春叛逆首领',
      icon: '🔥',
      description: '我的人生我做主！',
      cardTags: ['青少年', '叛逆'],
    },
    [AgeStage.YOUTH]: {
      name: '职场瓶颈精英',
      icon: '📊',
      description: '入职五年，还在原地踏步',
      cardTags: ['青年', '瓶颈'],
    },
    [AgeStage.PRIME]: {
      name: '中年危机首领',
      icon: '👔',
      description: '上有老下有小，左右为难',
      cardTags: ['壮年', '危机'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '事业天花板精英',
      icon: '🧱',
      description: '升迁无望，后浪推前浪',
      cardTags: ['中年', '天花板'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '退休迷茫精英',
      icon: '🚪',
      description: '退休后，我还能做什么？',
      cardTags: ['知天命', '迷茫'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '代际冲突精英',
      icon: '😤',
      description: '和子女的观念冲突日益严重',
      cardTags: ['花甲', '冲突'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '独立生活挑战精英',
      icon: '🏠',
      description: '想要独立生活，却力不从心',
      cardTags: ['古稀', '独立'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '健康管理精英',
      icon: '💊',
      description: '每天与各种慢性病作斗争',
      cardTags: ['杖朝', '健康'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '生命质量守护精英',
      icon: '🕯️',
      description: '在生命最后阶段保持尊严',
      cardTags: ['期颐', '尊严'],
    },
    [AgeStage.CULTIVATION]: {
      name: '心魔精英',
      icon: '👿',
      description: '内心深处最黑暗的恐惧',
      cardTags: ['修仙', '心魔'],
    },
  },

  // 过劳/压力精英
  burnout: {
    [AgeStage.INFANT]: {
      name: '睡眠不足精英',
      icon: '😫',
      description: '父母的疲惫，是婴儿无休止的需求',
      cardTags: ['婴儿', '疲惫'],
    },
    [AgeStage.CHILDHOOD]: {
      name: '学习压力精英',
      icon: '📚',
      description: '作业写到晚上十点，还要上补习班',
      cardTags: ['童年', '压力'],
    },
    [AgeStage.ADOLESCENT]: {
      name: '考试过劳精英',
      icon: '😵',
      description: '周考月考模拟考，永无止境',
      cardTags: ['少年', '考试'],
    },
    [AgeStage.TEENAGER]: {
      name: '情感困扰精英',
      icon: '💔',
      description: '青春期的感情纠葛让人心力交瘁',
      cardTags: ['青少年', '情感'],
    },
    [AgeStage.YOUTH]: {
      name: '职场过劳恶魔',
      icon: '😈',
      description: '996的阴影笼罩着你',
      cardTags: ['青年', '过劳'],
    },
    [AgeStage.PRIME]: {
      name: '家庭事业双压精英',
      icon: '⚖️',
      description: '事业和家庭，如何平衡？',
      cardTags: ['壮年', '平衡'],
    },
    [AgeStage.MIDDLE_AGE]: {
      name: '中年过劳魔王',
      icon: '👹',
      description: '身体在抗议，但不敢停下来',
      cardTags: ['中年', '过劳'],
    },
    [AgeStage.KNOWING_DESTINY]: {
      name: '精力衰退精英',
      icon: '🔋',
      description: '想做的事情太多，精力却不够了',
      cardTags: ['知天命', '精力'],
    },
    [AgeStage.FLOWERY_JIA]: {
      name: '照顾负担精英',
      icon: '🤝',
      description: '照顾孙辈和年迈父母，疲惫不堪',
      cardTags: ['花甲', '照顾'],
    },
    [AgeStage.ANCIENT_RARE]: {
      name: '慢性病精英',
      icon: '🏥',
      description: '高血压、糖尿病...与疾病共存',
      cardTags: ['古稀', '慢性病'],
    },
    [AgeStage.STAFF_COURT]: {
      name: '身体衰竭精英',
      icon: '🦽',
      description: '身体机能一年不如一年',
      cardTags: ['杖朝', '衰竭'],
    },
    [AgeStage.CENTENARIAN]: {
      name: '生命衰竭精英',
      icon: '🕰️',
      description: '生命之火即将熄灭',
      cardTags: ['期颐', '衰竭'],
    },
    [AgeStage.CULTIVATION]: {
      name: '灵气枯竭精英',
      icon: '🏜️',
      description: '灵气稀薄，修行艰难',
      cardTags: ['修仙', '灵气'],
    },
  },
};

// ==========================================
// 年度Boss - 按年龄段差异化
// ==========================================

/**
 * Boss变体 - 每个年龄段遇到的不同Boss
 */
export interface BossVariant extends MonsterVariant {
  bossTitle: string;
  specialMechanics: EnemyMechanic[];
}

/**
 * 年度Boss映射 - 每个年龄段有不同的年度Boss
 * 即使在同一年（如1969年），9岁和19岁遇到的Boss也完全不同
 */
export const ANNUAL_BOSS_VARIANTS: Record<AgeStage, BossVariant> = {
  [AgeStage.INFANT]: {
    name: '第一声啼哭',
    bossTitle: '生命之初的考验',
    icon: '👶',
    description: '来到这个世界的第一道考验',
    cardTags: ['婴儿', '生命'],
    specialMechanics: ['rage'] as EnemyMechanic[],
  },
  [AgeStage.CHILDHOOD]: {
    name: '成长的烦恼',
    bossTitle: '童年的试炼',
    icon: '🧒',
    description: '无忧无虑的童年也有它的挑战',
    cardTags: ['童年', '成长'],
    specialMechanics: ['summon'] as EnemyMechanic[],
  },
  [AgeStage.ADOLESCENT]: {
    name: '学业大考',
    bossTitle: '少年的试炼',
    icon: '📝',
    description: '决定未来的重要考试',
    cardTags: ['少年', '考试'],
    specialMechanics: ['double_attack'] as EnemyMechanic[],
  },
  [AgeStage.TEENAGER]: {
    name: '青春风暴',
    bossTitle: '青少年的试炼',
    icon: '🌪️',
    description: '青春期的躁动与迷茫',
    cardTags: ['青少年', '青春'],
    specialMechanics: ['rage'] as EnemyMechanic[],
  },
  [AgeStage.YOUTH]: {
    name: '社会洗礼',
    bossTitle: '青年的试炼',
    icon: '🌊',
    description: '初入社会的风吹雨打',
    cardTags: ['青年', '社会'],
    specialMechanics: ['shield'] as EnemyMechanic[],
  },
  [AgeStage.PRIME]: {
    name: '而立之年',
    bossTitle: '壮年的试炼',
    icon: '⚔️',
    description: '三十而立，你站稳了吗？',
    cardTags: ['壮年', '而立'],
    specialMechanics: ['double_attack', 'shield'] as EnemyMechanic[],
  },
  [AgeStage.MIDDLE_AGE]: {
    name: '不惑之惑',
    bossTitle: '中年的试炼',
    icon: '❓',
    description: '四十不惑，真的不惑了吗？',
    cardTags: ['中年', '不惑'],
    specialMechanics: ['regen'] as EnemyMechanic[],
  },
  [AgeStage.KNOWING_DESTINY]: {
    name: '天命之问',
    bossTitle: '知天命的试炼',
    icon: '🌅',
    description: '五十而知天命，天命为何？',
    cardTags: ['知天命', '天命'],
    specialMechanics: ['rage', 'shield'] as EnemyMechanic[],
  },
  [AgeStage.FLOWERY_JIA]: {
    name: '花甲转型',
    bossTitle: '花甲的试炼',
    icon: '🔄',
    description: '六十花甲，人生新阶段的挑战',
    cardTags: ['花甲', '转型'],
    specialMechanics: ['shield', 'regen'] as EnemyMechanic[],
  },
  [AgeStage.ANCIENT_RARE]: {
    name: '古稀之守',
    bossTitle: '古稀的试炼',
    icon: '🛡️',
    description: '七十古稀，守护健康的战斗',
    cardTags: ['古稀', '守护'],
    specialMechanics: ['shield'] as EnemyMechanic[],
  },
  [AgeStage.STAFF_COURT]: {
    name: '杖朝之智',
    bossTitle: '杖朝的试炼',
    icon: '🧠',
    description: '八十杖朝，智慧与遗忘的对抗',
    cardTags: ['杖朝', '智慧'],
    specialMechanics: ['regen', 'summon'] as EnemyMechanic[],
  },
  [AgeStage.CENTENARIAN]: {
    name: '期颐之忆',
    bossTitle: '期颐的试炼',
    icon: '📜',
    description: '百年人生的回顾与总结',
    cardTags: ['期颐', '回顾'],
    specialMechanics: ['double_attack', 'rage'] as EnemyMechanic[],
  },
  [AgeStage.CULTIVATION]: {
    name: '修仙天劫',
    bossTitle: '修仙的试炼',
    icon: '⚡',
    description: '逆天而行，必经天劫',
    cardTags: ['修仙', '天劫'],
    specialMechanics: ['double_attack', 'shield', 'rage', 'summon'] as EnemyMechanic[],
  },
};

// ==========================================
// 年度Boss特殊变体 - 根据具体年份进一步差异化
// ==========================================

/**
 * 年度Boss年份修饰器 - 让同一年不同年龄的Boss体验完全不同
 * 例如1969年：
 * - 9岁遇到的是"童年大冒险"
 * - 19岁遇到的是"青春觉醒"
 */
export interface YearBossModifier {
  suffix: string;
  descriptionPrefix: string;
  bonusMechanics: EnemyMechanic[];
}

/**
 * 基于年龄段和年份的Boss差异化
 * 确保即使同一年，不同年龄遇到的Boss完全不同
 */
export function getAnnualBossForAge(age: number, year?: number): BossVariant {
  const stage = getAgeStage(age);
  const baseVariant = ANNUAL_BOSS_VARIANTS[stage];

  // 如果有年份信息，可以进一步差异化
  if (year !== undefined) {
    const yearModifier = getYearBossModifier(year, age);
    return {
      ...baseVariant,
      name: `${baseVariant.name}${yearModifier.suffix}`,
      description: `${yearModifier.descriptionPrefix}${baseVariant.description}`,
      specialMechanics: [...baseVariant.specialMechanics, ...yearModifier.bonusMechanics],
    };
  }

  return baseVariant;
}

/**
 * 获取年份Boss修饰器
 * 根据年份和年龄提供独特的Boss体验
 */
function getYearBossModifier(year: number, age: number): YearBossModifier {
  // 根据年份的时代特征提供不同的修饰
  const eraIndex = Math.floor((year - 1950) / 10);
  const _yearInEra = (year - 1950) % 10;
  void _yearInEra; // 保留供未来使用

  const eraModifiers: Record<number, YearBossModifier> = {
    0: { // 1950年代
      suffix: '·萌芽',
      descriptionPrefix: '百废兴的年代，',
      bonusMechanics: ['shield'] as EnemyMechanic[],
    },
    1: { // 1960年代
      suffix: '·风云',
      descriptionPrefix: '风云变幻的年代，',
      bonusMechanics: ['rage'] as EnemyMechanic[],
    },
    2: { // 1970年代
      suffix: '·转折',
      descriptionPrefix: '黎明前的黑暗，',
      bonusMechanics: ['regen'] as EnemyMechanic[],
    },
    3: { // 1980年代
      suffix: '·春潮',
      descriptionPrefix: '改革开放的春风里，',
      bonusMechanics: ['summon'] as EnemyMechanic[],
    },
    4: { // 1990年代
      suffix: '·浪潮',
      descriptionPrefix: '下海浪潮中，',
      bonusMechanics: ['double_attack'] as EnemyMechanic[],
    },
    5: { // 2000年代
      suffix: '·信息',
      descriptionPrefix: '互联网浪潮席卷，',
      bonusMechanics: ['shield', 'double_attack'] as EnemyMechanic[],
    },
    6: { // 2010年代
      suffix: '·移动',
      descriptionPrefix: '移动互联网时代，',
      bonusMechanics: ['rage', 'shield'] as EnemyMechanic[],
    },
    7: { // 2020年代
      suffix: '·智能',
      descriptionPrefix: 'AI与智能纪元，',
      bonusMechanics: ['double_attack', 'rage'] as EnemyMechanic[],
    },
    8: { // 2030年代
      suffix: '·能源',
      descriptionPrefix: '新能源革命，',
      bonusMechanics: ['regen', 'shield'] as EnemyMechanic[],
    },
    9: { // 2040年代
      suffix: '·星际',
      descriptionPrefix: '星际黎明，',
      bonusMechanics: ['summon', 'rage'] as EnemyMechanic[],
    },
    10: { // 2050年代
      suffix: '·共生',
      descriptionPrefix: '人机共生时代，',
      bonusMechanics: ['shield', 'regen'] as EnemyMechanic[],
    },
    11: { // 2060年代
      suffix: '·深空',
      descriptionPrefix: '深空纪元，',
      bonusMechanics: ['double_attack', 'shield', 'rage'] as EnemyMechanic[],
    },
    12: { // 2070年代
      suffix: '·未知',
      descriptionPrefix: '未知边疆，',
      bonusMechanics: ['summon', 'rage', 'regen'] as EnemyMechanic[],
    },
  };

  // 根据年龄在同一年份内进一步差异化
  const ageSuffix = getAgeSpecificSuffix(age);

  const modifier = eraModifiers[eraIndex] || eraModifiers[12];
  return {
    ...modifier,
    suffix: modifier.suffix + ageSuffix,
  };
}

/**
 * 获取年龄特定的后缀 - 确保同一年不同年龄的Boss不同
 */
function getAgeSpecificSuffix(age: number): string {
  if (age < 6) return '·初啼';
  if (age < 10) return '·稚子';
  if (age < 15) return '·少年';
  if (age < 20) return '·青春';
  if (age < 30) return '·青年';
  if (age < 40) return '·壮年';
  if (age < 50) return '·中年';
  if (age < 60) return '·知命';
  if (age < 70) return '·花甲';
  if (age < 80) return '·古稀';
  if (age < 90) return '·杖朝';
  if (age <= 110) return '·期颐';
  return '·仙途';
}

// ==========================================
// 怪物生成辅助函数
// ==========================================

/**
 * 获取指定年龄段的普通怪物变体
 */
export function getNormalMonsterVariant(
  monsterType: 'slime' | 'ghost' | 'golem' | 'wraith',
  age: number
): MonsterVariant {
  const stage = getAgeStage(age);
  return NORMAL_MONSTER_VARIANTS[monsterType][stage];
}

/**
 * 获取指定年龄段的精英怪物变体
 */
export function getEliteMonsterVariant(
  eliteType: 'academic' | 'burnout',
  age: number
): MonsterVariant {
  const stage = getAgeStage(age);
  return ELITE_MONSTER_VARIANTS[eliteType][stage];
}

/**
 * 生成完整的怪物对象
 */
export function createMonsterFromVariant(
  variant: MonsterVariant,
  type: 'slime' | 'ghost' | 'golem' | 'wraith',
  age: number,
  multiplier: number
): Partial<Enemy> {
  const baseStats = getBaseStatsForMonsterType(type);
  return {
    name: variant.name,
    icon: variant.icon,
    description: variant.description,
    maxHealth: Math.floor(baseStats.health * multiplier * getAgeHealthMultiplier(age)),
    currentHealth: Math.floor(baseStats.health * multiplier * getAgeHealthMultiplier(age)),
    block: baseStats.block,
    intents: getIntentsForMonsterType(type, multiplier, age),
    mechanics: baseStats.mechanics,
  };
}

/**
 * 获取怪物类型的基础属性
 */
function getBaseStatsForMonsterType(type: string): {
  health: number;
  block: number;
  mechanics: EnemyMechanic[];
} {
  const stats: Record<string, { health: number; block: number; mechanics: EnemyMechanic[] }> = {
    slime: { health: 20, block: 0, mechanics: [] },
    ghost: { health: 25, block: 0, mechanics: [] },
    golem: { health: 35, block: 5, mechanics: [] },
    wraith: { health: 18, block: 0, mechanics: [] },
  };
  return stats[type] || stats.slime;
}

/**
 * 获取年龄段的生命值调整
 * 儿童期怪物较弱，中老年怪物较强
 */
function getAgeHealthMultiplier(age: number): number {
  if (age < 6) return 0.6;
  if (age < 10) return 0.7;
  if (age < 15) return 0.8;
  if (age < 20) return 0.9;
  if (age < 30) return 1.0;
  if (age < 40) return 1.1;
  if (age < 50) return 1.2;
  if (age < 60) return 1.15;
  if (age < 70) return 1.1;
  if (age < 80) return 1.0;
  if (age < 90) return 0.95;
  if (age <= 110) return 0.9;
  return 1.5; // 修仙期
}

/**
 * 获取怪物类型的意图
 */
function getIntentsForMonsterType(
  type: string,
  multiplier: number,
  age: number
): Enemy['intents'] {
  const intents: Record<string, Enemy['intents']> = {
    slime: [
      { type: 'attack', damage: Math.floor(4 * multiplier * getAgeDamageMultiplier(age)) },
      { type: 'defend', block: Math.floor(3 * multiplier) },
      { type: 'attack', damage: Math.floor(6 * multiplier * getAgeDamageMultiplier(age)) },
    ],
    ghost: [
      { type: 'attack', damage: Math.floor(3 * multiplier * getAgeDamageMultiplier(age)), hits: 2 },
      { type: 'buff', effect: 'strength', value: 1 },
      { type: 'attack', damage: Math.floor(8 * multiplier * getAgeDamageMultiplier(age)) },
    ],
    golem: [
      { type: 'defend', block: Math.floor(8 * multiplier) },
      { type: 'attack', damage: Math.floor(10 * multiplier * getAgeDamageMultiplier(age)) },
      { type: 'attack', damage: Math.floor(6 * multiplier * getAgeDamageMultiplier(age)) },
    ],
    wraith: [
      { type: 'debuff', effect: 'weak', value: 2 },
      { type: 'attack', damage: Math.floor(5 * multiplier * getAgeDamageMultiplier(age)) },
      { type: 'debuff', effect: 'vulnerable', value: 2 },
    ],
  };
  return intents[type] || intents.slime;
}

/**
 * 获取年龄段的伤害调整
 */
function getAgeDamageMultiplier(age: number): number {
  if (age < 6) return 0.5;
  if (age < 10) return 0.6;
  if (age < 15) return 0.7;
  if (age < 20) return 0.8;
  if (age < 30) return 1.0;
  if (age < 40) return 1.1;
  if (age < 50) return 1.2;
  if (age < 60) return 1.15;
  if (age < 70) return 1.1;
  if (age < 80) return 1.0;
  if (age < 90) return 0.9;
  if (age <= 110) return 0.85;
  return 1.3; // 修仙期
}

/**
 * 生成年度Boss对象
 */
export function createAnnualBoss(age: number, year: number, multiplier: number): Partial<Enemy> {
  const bossVariant = getAnnualBossForAge(age, year);
  const stage = getAgeStage(age);

  // Boss基础生命值根据年龄段和年份调整
  const baseHealth = getBossBaseHealth(stage, year);
  const healthMultiplier = multiplier * (1 + Math.floor((year - 1950) / 10) * 0.15);

  return {
    name: bossVariant.name,
    icon: bossVariant.icon,
    description: `${bossVariant.bossTitle} - ${bossVariant.description}`,
    maxHealth: Math.floor(baseHealth * healthMultiplier),
    currentHealth: Math.floor(baseHealth * healthMultiplier),
    block: getBossBlock(stage),
    intents: getBossIntents(stage, multiplier, year),
    mechanics: [...bossVariant.specialMechanics],
    isBoss: true,
  };
}

/**
 * 获取Boss基础生命值
 * 根据年龄段和年份调整Boss难度
 */
function getBossBaseHealth(stage: AgeStage, year: number): number {
  const baseHealths: Record<AgeStage, number> = {
    [AgeStage.INFANT]: 30,
    [AgeStage.CHILDHOOD]: 40,
    [AgeStage.ADOLESCENT]: 55,
    [AgeStage.TEENAGER]: 70,
    [AgeStage.YOUTH]: 90,
    [AgeStage.PRIME]: 120,
    [AgeStage.MIDDLE_AGE]: 150,
    [AgeStage.KNOWING_DESTINY]: 130,
    [AgeStage.FLOWERY_JIA]: 110,
    [AgeStage.ANCIENT_RARE]: 100,
    [AgeStage.STAFF_COURT]: 85,
    [AgeStage.CENTENARIAN]: 70,
    [AgeStage.CULTIVATION]: 200,
  };
  // 根据年份微调Boss难度（后期年份Boss更强）
  const yearBonus = Math.floor((year - 1950) / 20) * 5;
  return (baseHealths[stage] || 100) + yearBonus;
}

/**
 * 获取Boss基础格挡
 */
function getBossBlock(stage: AgeStage): number {
  const blocks: Record<AgeStage, number> = {
    [AgeStage.INFANT]: 0,
    [AgeStage.CHILDHOOD]: 5,
    [AgeStage.ADOLESCENT]: 8,
    [AgeStage.TEENAGER]: 10,
    [AgeStage.YOUTH]: 12,
    [AgeStage.PRIME]: 15,
    [AgeStage.MIDDLE_AGE]: 18,
    [AgeStage.KNOWING_DESTINY]: 15,
    [AgeStage.FLOWERY_JIA]: 12,
    [AgeStage.ANCIENT_RARE]: 10,
    [AgeStage.STAFF_COURT]: 8,
    [AgeStage.CENTENARIAN]: 5,
    [AgeStage.CULTIVATION]: 25,
  };
  return blocks[stage] || 10;
}

/**
 * 获取Boss意图
 */
function getBossIntents(stage: AgeStage, multiplier: number, year: number): Enemy['intents'] {
  const damageScale = multiplier * (1 + Math.floor((year - 1950) / 10) * 0.1);

  const intentSets: Record<AgeStage, Enemy['intents']> = {
    [AgeStage.INFANT]: [
      { type: 'attack', damage: Math.floor(5 * damageScale) },
      { type: 'defend', block: Math.floor(5 * multiplier) },
      { type: 'special', name: '啼哭', description: '让你感到心疼' },
    ],
    [AgeStage.CHILDHOOD]: [
      { type: 'attack', damage: Math.floor(7 * damageScale) },
      { type: 'attack', damage: Math.floor(5 * damageScale), hits: 2 },
      { type: 'special', name: '玩耍诱惑', description: '让你分心' },
    ],
    [AgeStage.ADOLESCENT]: [
      { type: 'attack', damage: Math.floor(10 * damageScale) },
      { type: 'debuff', effect: 'weak', value: 2 },
      { type: 'special', name: '考试压力', description: '造成心理伤害' },
    ],
    [AgeStage.TEENAGER]: [
      { type: 'attack', damage: Math.floor(12 * damageScale) },
      { type: 'debuff', effect: 'vulnerable', value: 2 },
      { type: 'special', name: '青春叛逆', description: '无视规则' },
    ],
    [AgeStage.YOUTH]: [
      { type: 'attack', damage: Math.floor(15 * damageScale) },
      { type: 'attack', damage: Math.floor(10 * damageScale), hits: 2 },
      { type: 'special', name: '社会洗礼', description: '现实打击' },
    ],
    [AgeStage.PRIME]: [
      { type: 'attack', damage: Math.floor(18 * damageScale) },
      { type: 'defend', block: Math.floor(15 * multiplier) },
      { type: 'special', name: '责任重担', description: '多重压力' },
    ],
    [AgeStage.MIDDLE_AGE]: [
      { type: 'attack', damage: Math.floor(20 * damageScale) },
      { type: 'debuff', effect: 'weak', value: 3 },
      { type: 'special', name: '中年危机', description: '存在主义打击' },
    ],
    [AgeStage.KNOWING_DESTINY]: [
      { type: 'attack', damage: Math.floor(16 * damageScale) },
      { type: 'debuff', effect: 'vulnerable', value: 3 },
      { type: 'special', name: '天命之问', description: '灵魂拷问' },
    ],
    [AgeStage.FLOWERY_JIA]: [
      { type: 'attack', damage: Math.floor(14 * damageScale) },
      { type: 'defend', block: Math.floor(12 * multiplier) },
      { type: 'special', name: '转型之痛', description: '角色转换' },
    ],
    [AgeStage.ANCIENT_RARE]: [
      { type: 'attack', damage: Math.floor(12 * damageScale) },
      { type: 'debuff', effect: 'weak', value: 2 },
      { type: 'special', name: '健康衰退', description: '身体老化' },
    ],
    [AgeStage.STAFF_COURT]: [
      { type: 'attack', damage: Math.floor(10 * damageScale) },
      { type: 'debuff', effect: 'confusion', value: 2 },
      { type: 'special', name: '记忆迷雾', description: '记忆模糊' },
    ],
    [AgeStage.CENTENARIAN]: [
      { type: 'attack', damage: Math.floor(8 * damageScale) },
      { type: 'special', name: '人生回顾', description: '回顾一生的遗憾' },
      { type: 'special', name: '生命倒计时', description: '时间流逝' },
    ],
    [AgeStage.CULTIVATION]: [
      { type: 'attack', damage: Math.floor(25 * damageScale) },
      { type: 'special', name: '天劫降临', description: '天雷轰顶' },
      { type: 'buff', effect: 'strength', value: 3 },
    ],
  };

  return intentSets[stage] || intentSets[AgeStage.YOUTH];
}

// ==========================================
// 怪物名称显示辅助函数
// ==========================================

/**
 * 获取怪物完整显示名称（包含年龄段信息）
 */
export function getFullMonsterName(variant: MonsterVariant, age: number): string {
  const stageName = getAgeStageName(getAgeStage(age));
  return `${variant.name}（${stageName}）`;
}

/**
 * 获取怪物详细描述
 */
export function getMonsterDetailedDescription(variant: MonsterVariant, age: number): string {
  const stage = getAgeStage(age);
  return `${variant.description} [${getAgeStageName(stage)}阶段 - ${age}岁]`;
}
