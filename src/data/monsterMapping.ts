import type { EnemyIntent, EnemyMechanic } from '../types/simulation';

// ==========================================
// 年龄段定义
// ==========================================

export interface AgeStage {
  name: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export const AGE_STAGES: AgeStage[] = [
  { name: '婴幼儿', minAge: 0, maxAge: 5, description: '初生的生命，对世界充满好奇' },
  { name: '童年', minAge: 6, maxAge: 9, description: '无忧无虑的童年时光' },
  { name: '少年', minAge: 10, maxAge: 13, description: '渐渐懂事的少年时期' },
  { name: '青少年', minAge: 14, maxAge: 17, description: '青春期的叛逆与成长' },
  { name: '大学', minAge: 18, maxAge: 21, description: '求学探索的阶段' },
  { name: '青年', minAge: 22, maxAge: 29, description: '踏入社会的青年时期' },
  { name: '壮年', minAge: 30, maxAge: 39, description: '事业有成的壮年时期' },
  { name: '中年', minAge: 40, maxAge: 49, description: '肩负重任的中年时期' },
  { name: '知天命', minAge: 50, maxAge: 59, description: '看透世事的知天命之年' },
  { name: '花甲', minAge: 60, maxAge: 69, description: '花甲之年的智慧与从容' },
  { name: '古稀', minAge: 70, maxAge: 79, description: '古稀之年的豁达与宁静' },
  { name: '杖朝', minAge: 80, maxAge: 89, description: '杖朝之年的沉稳与睿智' },
  { name: '期颐', minAge: 90, maxAge: 99, description: '期颐之年的长寿与福泽' },
  { name: '长寿之星', minAge: 100, maxAge: 110, description: '超越常人的长寿存在' },
  { name: '传奇人生', minAge: 111, maxAge: 999, description: '超越凡俗的传奇存在' },
];

// ==========================================
// 怪物变体定义
// ==========================================

export interface MonsterVariant {
  name: string;
  icon: string;
  description: string;
}

// 普通怪物变体映射表
const NORMAL_MONSTER_VARIANTS: Record<string, Record<string, MonsterVariant>> = {
  slime: {
    婴幼儿: { name: '黏液泡泡', icon: '🫧', description: '一团透明的黏液泡泡，会缓慢蠕动' },
    童年: { name: '鼻涕虫', icon: '🐛', description: '胖乎乎的绿色虫子，喜欢躲在草丛里' },
    少年: { name: '史莱姆', icon: '🟢', description: '经典的凝胶状生物，会分裂再生' },
    青少年: { name: '酸液怪', icon: '🟩', description: '能分泌腐蚀液体的危险史莱姆' },
    大学: { name: '实验凝胶', icon: '🧪', description: '实验室里逃出的变异凝胶' },
    青年: { name: '职场泥怪', icon: '💼', description: '被工作压垮后化成的泥状怪物' },
    壮年: { name: '油腻怪', icon: '🟫', description: '浑身散发油腻气息的怪物' },
    中年: { name: '脂肪肝怪', icon: '🟤', description: '由不健康饮食凝聚而成的怪物' },
    知天命: { name: '养生果冻', icon: '🍮', description: '热衷于养生的神秘果冻' },
    花甲: { name: '枸杞史莱姆', icon: '🔴', description: '泡着枸杞的养生史莱姆' },
    古稀: { name: '太极凝胶', icon: '☯️', description: '动作缓慢但蕴含内力的老史莱姆' },
    杖朝: { name: '仙丹软糖', icon: '🍬', description: '传说能延年益寿的软糖' },
    期颐: { name: '长生果冻', icon: '✨', description: '千年不老的神秘果冻' },
    长寿之星: { name: '寿星凝胶', icon: '🌟', description: '拥有万年寿命的传奇史莱姆' },
    传奇人生: { name: '混沌原液', icon: '🌌', description: '开天辟地时残留的原始物质' },
  },
  ghost: {
    婴幼儿: { name: '小幽灵', icon: '👻', description: '可爱的小幽灵，只会发出咯咯笑声' },
    童年: { name: '床下鬼', icon: '😈', description: '躲在床下吓唬小孩的小鬼' },
    少年: { name: '校园幽灵', icon: '🏫', description: '徘徊在校园里的传说幽灵' },
    青少年: { name: '青春期怨灵', icon: '😤', description: '充满青春期烦恼的怨灵' },
    大学: { name: '挂科幽灵', icon: '📚', description: '因挂科而死的悲惨幽灵' },
    青年: { name: '加班怨灵', icon: '💀', description: '因过劳而死的职场怨灵' },
    壮年: { name: 'KPI恶鬼', icon: '📊', description: '被KPI压垮的恶鬼' },
    中年: { name: '房贷幽灵', icon: '🏠', description: '被房贷压得喘不过气的幽灵' },
    知天命: { name: '养生鬼魂', icon: '🧘', description: '修炼养生的鬼魂' },
    花甲: { name: '广场舞幽灵', icon: '💃', description: '在广场上翩翩起舞的幽灵' },
    古稀: { name: '太极鬼魂', icon: '☯️', description: '修炼太极之道的鬼魂' },
    杖朝: { name: '仙风幽灵', icon: '🌬️', description: '仙风道骨的老幽灵' },
    期颐: { name: '长生鬼仙', icon: '👼', description: '修炼千年的鬼仙' },
    长寿之星: { name: '万年鬼王', icon: '👑', description: '统御万鬼的鬼王' },
    传奇人生: { name: '混沌魔神', icon: '🌑', description: '开天辟地时的混沌魔神' },
  },
  golem: {
    婴幼儿: { name: '泥巴娃娃', icon: '🫠', description: '用泥巴捏成的小娃娃' },
    童年: { name: '积木傀儡', icon: '🧱', description: '由积木拼成的傀儡' },
    少年: { name: '石头人', icon: '🪨', description: '由普通石头组成的石人' },
    青少年: { name: '铁傀儡', icon: '⚙️', description: '由废铁拼凑的铁傀儡' },
    大学: { name: '论文傀儡', icon: '📄', description: '被论文逼出来的傀儡' },
    青年: { name: '打工石人', icon: '⛏️', description: '日复一日打工的石人' },
    壮年: { name: '房贷傀儡', icon: '🏗️', description: '背负房贷的沉重傀儡' },
    中年: { name: '中年石魔', icon: '🗿', description: '被生活磨平棱角的石魔' },
    知天命: { name: '养生石人', icon: '🧘', description: '修炼养生的石人' },
    花甲: { name: '太极石人', icon: '☯️', description: '修炼太极的石人' },
    古稀: { name: '仙灵石卫', icon: '💎', description: '被仙灵附体的石卫' },
    杖朝: { name: '玉傀儡', icon: '🟩', description: '由美玉雕琢的傀儡' },
    期颐: { name: '长生石像', icon: '🗿', description: '千年不朽的石像' },
    长寿之星: { name: '万年岩神', icon: '⛰️', description: '沉睡万年的岩神' },
    传奇人生: { name: '混沌巨灵', icon: '🌋', description: '开天辟地时的混沌巨灵' },
  },
  wraith: {
    婴幼儿: { name: '小影子', icon: '👤', description: '调皮的小影子' },
    童年: { name: '恶作剧幽灵', icon: '😜', description: '喜欢恶作剧的小幽灵' },
    少年: { name: '暗影人', icon: '🕶️', description: '潜伏在暗处的影人' },
    青少年: { name: '叛逆暗影', icon: '🖤', description: '充满叛逆气息的暗影' },
    大学: { name: '迷茫幽灵', icon: '❓', description: '对未来感到迷茫的幽灵' },
    青年: { name: '社畜幽魂', icon: '💼', description: '被工作吞噬的幽魂' },
    壮年: { name: '危机暗影', icon: '⚠️', description: '带来危机的暗影' },
    中年: { name: '危机幽灵', icon: '🌪️', description: '象征中年危机的幽灵' },
    知天命: { name: '看透幽魂', icon: '👁️', description: '看透世事的幽魂' },
    花甲: { name: '智慧暗影', icon: '🦉', description: '蕴含智慧的暗影' },
    古稀: { name: '长寿幽魂', icon: '🕯️', description: '象征长寿的幽魂' },
    杖朝: { name: '仙灵暗影', icon: '✨', description: '仙灵化的暗影' },
    期颐: { name: '长生幽魂', icon: '🌙', description: '千年不散的幽魂' },
    长寿之星: { name: '万年暗影', icon: '🌑', description: '万年不灭的暗影' },
    传奇人生: { name: '混沌虚影', icon: '🌌', description: '混沌中诞生的虚影' },
  },
};

// 精英怪物变体映射表
const ELITE_MONSTER_VARIANTS: Record<string, Record<string, MonsterVariant>> = {
  academic: {
    婴幼儿: { name: '早教老师', icon: '👩‍🏫', description: '热衷于早教的启蒙老师' },
    童年: { name: '幼儿园老师', icon: '🏫', description: '管理着一群小怪兽的老师' },
    少年: { name: '小学班主任', icon: '📝', description: '布置作业无数的班主任' },
    青少年: { name: '中学教导主任', icon: '👔', description: '严厉的教导主任' },
    大学: { name: '大学教授', icon: '🎓', description: '学识渊博但苛刻的教授' },
    青年: { name: '论文导师', icon: '📚', description: '让你改论文到凌晨的导师' },
    壮年: { name: '学术权威', icon: '🏆', description: '垄断学术资源的权威' },
    中年: { name: '学阀', icon: '🎩', description: '控制学术门派的学阀' },
    知天命: { name: '养生学者', icon: '🧘', description: '研究养生的学者' },
    花甲: { name: '退休教授', icon: '📖', description: '退休后仍笔耕不辍的教授' },
    古稀: { name: '学术泰斗', icon: '🌟', description: '学术界的泰山北斗' },
    杖朝: { name: '国师', icon: '👑', description: '帝王之师的学术大佬' },
    期颐: { name: '百年学者', icon: '📜', description: '活了百年的传奇学者' },
    长寿之星: { name: '学术之神', icon: '⚡', description: '超越凡人的学术之神' },
    传奇人生: { name: '智慧化身', icon: '🧠', description: '智慧本身的化身' },
  },
  burnout: {
    婴幼儿: { name: '哭闹宝宝', icon: '👶', description: '永远在哭闹的疲惫宝宝' },
    童年: { name: '作业恶魔', icon: '📝', description: '被作业压垮的小恶魔' },
    少年: { name: '考试焦虑怪', icon: '😰', description: '被考试焦虑吞噬的怪物' },
    青少年: { name: '青春期烦恼', icon: '😩', description: '充满青春期烦恼的怪物' },
    大学: { name: '内卷之王', icon: '📉', description: '内卷到极致的怪物' },
    青年: { name: '社畜本畜', icon: '💼', description: '被工作完全吞噬的社畜' },
    壮年: { name: '过劳怪', icon: '☕', description: '靠咖啡续命的过劳怪' },
    中年: { name: '中年危机', icon: '😵', description: '陷入中年危机的怪物' },
    知天命: { name: '看透红尘', icon: '🧘', description: '看透红尘的疲惫仙人' },
    花甲: { name: '广场舞霸主', icon: '💃', description: '称霸广场舞的退休大佬' },
    古稀: { name: '养生达人', icon: '🍵', description: '沉迷养生的退休达人' },
    杖朝: { name: '太极宗师', icon: '☯️', description: '修炼太极的退休宗师' },
    期颐: { name: '长生仙人', icon: '🌙', description: '长生不老的仙人' },
    长寿之星: { name: '万年老怪', icon: '👹', description: '活了万年的老怪物' },
    传奇人生: { name: '混沌疲劳', icon: '🌌', description: '混沌中诞生的永恒疲劳' },
  },
};

// 年度Boss名称前缀和后缀
const BOSS_NAME_PREFIXES: Record<string, string[]> = {
  婴幼儿: ['初生的', '萌芽的', '天真的'],
  童年: ['童年的', '稚嫩的', '懵懂的'],
  少年: ['少年的', '青涩的', '成长的'],
  青少年: ['青春的', '叛逆的', '热血的'],
  大学: ['求知的', '探索的', '迷茫的'],
  青年: ['奋斗的', '拼搏的', '迷茫的'],
  壮年: ['辉煌的', '成功的', '压力山大的'],
  中年: ['沉稳的', '疲惫的', '肩负重任的'],
  知天命: ['看透的', '豁达的', '淡然的'],
  花甲: ['智慧的', '从容的', '慈祥的'],
  古稀: ['古稀的', '长寿的', '仙风的'],
  杖朝: ['杖朝的', '仙灵的', '超凡的'],
  期颐: ['期颐的', '长生的', '不朽的'],
  长寿之星: ['万年寿星', '永恒', '超越生死的'],
  传奇人生: ['混沌', '创世', '开天辟地的'],
};

const BOSS_NAME_SUFFIXES = [
  '守护者', '审判者', '观察者', '记录者', '引路人',
  '试炼者', '守望者', '终结者', '启蒙者', '引渡人',
];

const BOSS_ICONS: Record<string, string[]> = {
  婴幼儿: ['🌱', '🍼', '🧸'],
  童年: ['🎮', '📚', '🎨'],
  少年: ['⚔️', '🛡️', '🏹'],
  青少年: ['🔥', '💥', '⚡'],
  大学: ['🎓', '📖', '🔬'],
  青年: ['💼', '📈', '🏃'],
  壮年: ['🏆', '👑', '💰'],
  中年: ['⚖️', '🏛️', '📊'],
  知天命: ['🧘', '📿', '🍵'],
  花甲: ['🌅', '🎋', '🦅'],
  古稀: ['🌙', '⭐', '🏔️'],
  杖朝: ['🌤️', '🎋', '🦢'],
  期颐: ['✨', '🌟', '💫'],
  长寿之星: ['🌌', '☀️', '🌍'],
  传奇人生: ['🌌', '⚛️', '🔮'],
};

// ==========================================
// 函数实现
// ==========================================

/**
 * 根据年龄获取年龄段信息
 */
export function getAgeStage(age: number): AgeStage {
  for (const stage of AGE_STAGES) {
    if (age >= stage.minAge && age <= stage.maxAge) {
      return stage;
    }
  }
  return AGE_STAGES[AGE_STAGES.length - 1];
}

/**
 * 获取普通怪物变体
 */
export function getNormalMonsterVariant(type: string, age: number): MonsterVariant {
  const stage = getAgeStage(age);
  const variants = NORMAL_MONSTER_VARIANTS[type];
  if (!variants) {
    return { name: '未知怪物', icon: '❓', description: '来历不明的怪物' };
  }
  return variants[stage.name] || { name: '未知怪物', icon: '❓', description: '来历不明的怪物' };
}

/**
 * 获取精英怪物变体
 */
export function getEliteMonsterVariant(type: string, age: number): MonsterVariant {
  const stage = getAgeStage(age);
  const variants = ELITE_MONSTER_VARIANTS[type];
  if (!variants) {
    return { name: '未知精英', icon: '❓', description: '来历不明的精英怪物' };
  }
  return variants[stage.name] || { name: '未知精英', icon: '❓', description: '来历不明的精英怪物' };
}

// 怪物基础属性配置
const MONSTER_BASE_STATS: Record<string, { health: number; block: number }> = {
  slime: { health: 20, block: 0 },
  ghost: { health: 25, block: 0 },
  golem: { health: 35, block: 5 },
  wraith: { health: 18, block: 0 },
};

// 怪物意图配置
const MONSTER_INTENTS: Record<string, EnemyIntent[]> = {
  slime: [
    { type: 'attack', damage: 4 },
    { type: 'defend', block: 3 },
    { type: 'attack', damage: 6 },
  ],
  ghost: [
    { type: 'attack', damage: 3, hits: 2 },
    { type: 'buff', effect: 'strength', value: 1 },
    { type: 'attack', damage: 8 },
  ],
  golem: [
    { type: 'defend', block: 8 },
    { type: 'attack', damage: 10 },
    { type: 'attack', damage: 6 },
  ],
  wraith: [
    { type: 'debuff', effect: 'weak', value: 2 },
    { type: 'attack', damage: 5 },
    { type: 'debuff', effect: 'vulnerable', value: 2 },
  ],
};

/**
 * 根据变体创建怪物属性
 */
export function createMonsterFromVariant(
  _variant: MonsterVariant,
  type: string,
  age: number,
  multiplier: number
): {
  maxHealth: number;
  currentHealth: number;
  block: number;
  intents: EnemyIntent[];
} {
  const baseStats = MONSTER_BASE_STATS[type] || { health: 20, block: 0 };
  const baseIntents = MONSTER_INTENTS[type] || [{ type: 'attack', damage: 4 }];

  const ageBonus = Math.floor(age / 10) * 0.1;
  const finalMultiplier = multiplier + ageBonus;

  const intents: EnemyIntent[] = baseIntents.map((intent) => {
    if (intent.type === 'attack') {
      return {
        ...intent,
        damage: Math.floor(intent.damage * finalMultiplier),
      };
    }
    if (intent.type === 'defend') {
      return {
        ...intent,
        block: Math.floor(intent.block * finalMultiplier),
      };
    }
    return { ...intent };
  });

  const maxHealth = Math.floor(baseStats.health * finalMultiplier);

  return {
    maxHealth,
    currentHealth: maxHealth,
    block: Math.floor(baseStats.block * finalMultiplier),
    intents,
  };
}

/**
 * 创建年度Boss
 */
export function createAnnualBoss(
  age: number,
  year: number,
  multiplier: number
): {
  name: string;
  icon: string;
  description: string;
  maxHealth: number;
  currentHealth: number;
  block: number;
  intents: EnemyIntent[];
  mechanics: EnemyMechanic[];
} {
  const stage = getAgeStage(age);
  const prefixes = BOSS_NAME_PREFIXES[stage.name] || ['神秘的'];
  const suffixes = BOSS_NAME_SUFFIXES;
  const icons = BOSS_ICONS[stage.name] || ['💀'];

  const prefixIndex = year % prefixes.length;
  const suffixIndex = (year + age) % suffixes.length;
  const iconIndex = (year + Math.floor(age / 10)) % icons.length;

  const name = `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;
  const icon = icons[iconIndex];
  const description = `${stage.name}的守护者，在${year}年降临，考验着每一个生灵`;

  const ageBonus = Math.floor(age / 10) * 0.15;
  const finalMultiplier = multiplier + ageBonus;

  const maxHealth = Math.floor(150 * finalMultiplier);
  const block = Math.floor(10 * finalMultiplier);

  const intents: EnemyIntent[] = [
    { type: 'attack', damage: Math.floor(20 * finalMultiplier) },
    { type: 'special', name: '审判', description: '造成巨额固定伤害' },
    { type: 'debuff', effect: 'weak', value: 3 },
  ];

  const mechanics: EnemyMechanic[] = ['boss_aura'];
  if (age >= 20) mechanics.push('double_attack');
  if (age >= 40) mechanics.push('shield');
  if (age >= 60) mechanics.push('regen');
  if (age >= 80) mechanics.push('rage');

  return {
    name,
    icon,
    description,
    maxHealth,
    currentHealth: maxHealth,
    block,
    intents,
    mechanics,
  };
}
