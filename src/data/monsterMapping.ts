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

// 新增普通怪物变体映射表
const NORMAL_MONSTER_VARIANTS_EXTENDED: Record<string, Record<string, MonsterVariant>> = {
  beast: {
    婴幼儿: { name: '小奶猫', icon: '🐱', description: '毛茸茸的小奶猫，会伸出小爪子挠人' },
    童年: { name: '野兔', icon: '🐰', description: '草丛里蹦出来的野兔，动作敏捷' },
    少年: { name: '野狼', icon: '🐺', description: '森林里的野狼，团队协作捕猎' },
    青少年: { name: '猎豹', icon: '🐆', description: '速度极快的猎豹，一击必杀' },
    大学: { name: '实验鼠', icon: '🐭', description: '实验室里逃出的变异老鼠' },
    青年: { name: '社畜猛虎', icon: '🐯', description: '被工作压迫后化成的猛虎' },
    壮年: { name: '油腻雄狮', icon: '🦁', description: '浑身散发油腻气息的雄狮' },
    中年: { name: '脂肪肝熊', icon: '🐻', description: '由不健康饮食凝聚而成的巨熊' },
    知天命: { name: '养生熊猫', icon: '🐼', description: '热衷于养生的神秘熊猫' },
    花甲: { name: '太极虎', icon: '🐅', description: '动作缓慢但蕴含内力的老虎' },
    古稀: { name: '仙鹤', icon: '🦢', description: '超凡脱俗的仙鹤' },
    杖朝: { name: '麒麟', icon: '🦄', description: '传说中的祥瑞之兽' },
    期颐: { name: '长生神兽', icon: '🌟', description: '千年不朽的神兽' },
    长寿之星: { name: '万年灵狐', icon: '🦊', description: '拥有万年寿命的灵狐' },
    传奇人生: { name: '混沌魔兽', icon: '🌌', description: '开天辟地时残留的魔兽' },
  },
  insect: {
    婴幼儿: { name: '小蚂蚁', icon: '🐜', description: '勤劳的小蚂蚁，虽然渺小但团结' },
    童年: { name: '毛毛虫', icon: '🐛', description: '胖乎乎的毛毛虫，正在蜕变' },
    少年: { name: '蜜蜂', icon: '🐝', description: '勤劳的蜜蜂，蜇人很疼' },
    青少年: { name: '马蜂', icon: '🪰', description: '暴躁的马蜂，攻击性极强' },
    大学: { name: '论文虫', icon: '🪲', description: '啃食论文的蛀虫' },
    青年: { name: '加班蚊', icon: '🦟', description: '嗡嗡作响的加班蚊，扰人清梦' },
    壮年: { name: 'KPI蜂后', icon: '🐝', description: '指挥蜂群攻击的蜂后' },
    中年: { name: '房贷蚁后', icon: '🐜', description: '背负房贷的蚁后' },
    知天命: { name: '养生虫', icon: '🪱', description: '热衷于养生的神秘虫' },
    花甲: { name: '太极蝉', icon: '🦗', description: '修炼太极的蝉' },
    古稀: { name: '仙虫', icon: '🐞', description: '超凡脱俗的仙虫' },
    杖朝: { name: '灵虫', icon: '🦋', description: '修炼千年的灵虫' },
    期颐: { name: '长生蝶', icon: '🦋', description: '千年不朽的蝴蝶' },
    长寿之星: { name: '万年虫王', icon: '👑', description: '统御万虫的虫王' },
    传奇人生: { name: '混沌虫群', icon: '🌌', description: '开天辟地时的混沌虫群' },
  },
  undead: {
    婴幼儿: { name: '小骷髅', icon: '💀', description: '可爱的小骷髅，会咯咯笑' },
    童年: { name: '玩具僵尸', icon: '🧸', description: '会走路的玩具僵尸' },
    少年: { name: '骷髅兵', icon: '⚔️', description: '手持利剑的骷髅兵' },
    青少年: { name: '幽灵骑士', icon: '🏇', description: '骑着幽灵马的骑士' },
    大学: { name: '论文亡灵', icon: '📚', description: '被论文逼死的亡灵' },
    青年: { name: '加班僵尸', icon: '🧟', description: '因过劳而死的僵尸' },
    壮年: { name: 'KPI骷髅王', icon: '👑', description: '被KPI压垮的骷髅王' },
    中年: { name: '房贷幽灵', icon: '🏠', description: '被房贷压得喘不过气的幽灵' },
    知天命: { name: '养生鬼魂', icon: '🧘', description: '修炼养生的鬼魂' },
    花甲: { name: '太极骷髅', icon: '☯️', description: '修炼太极的骷髅' },
    古稀: { name: '仙灵骷髅', icon: '✨', description: '超凡脱俗的仙灵骷髅' },
    杖朝: { name: '玉骷髅', icon: '🟩', description: '由美玉雕琢的骷髅' },
    期颐: { name: '长生亡灵', icon: '🌙', description: '千年不散的亡灵' },
    长寿之星: { name: '万年死神', icon: '🌑', description: '万年不灭的死神' },
    传奇人生: { name: '混沌亡灵', icon: '🌌', description: '混沌中诞生的亡灵' },
  },
  elemental: {
    婴幼儿: { name: '小火苗', icon: '🔥', description: '调皮的小火苗，会舔舐一切' },
    童年: { name: '小水珠', icon: '💧', description: '晶莹剔透的小水珠' },
    少年: { name: '小风灵', icon: '🌬️', description: '呼啸的小风灵' },
    青少年: { name: '雷电精灵', icon: '⚡', description: '充满能量的雷电精灵' },
    大学: { name: '实验元素', icon: '🧪', description: '实验室里逃出的元素' },
    青年: { name: '职场火焰', icon: '🔥', description: '被工作点燃的火焰' },
    壮年: { name: 'KPI雷电', icon: '⚡', description: '被KPI激发的雷电' },
    中年: { name: '房贷冰霜', icon: '❄️', description: '被房贷冻结的冰霜' },
    知天命: { name: '养生之风', icon: '🌬️', description: '温和的养生之风' },
    花甲: { name: '太极之火', icon: '☯️', description: '修炼太极的火焰' },
    古稀: { name: '仙灵元素', icon: '✨', description: '超凡脱俗的仙灵元素' },
    杖朝: { name: '玉元素', icon: '💎', description: '由美玉凝聚的元素' },
    期颐: { name: '长生元素', icon: '🌟', description: '千年不朽的元素' },
    长寿之星: { name: '万年元素神', icon: '🌌', description: '万年不灭的元素神' },
    传奇人生: { name: '混沌元素', icon: '🌌', description: '混沌中诞生的元素' },
  },
};

// 新增精英怪物变体映射表
const ELITE_MONSTER_VARIANTS_EXTENDED: Record<string, Record<string, MonsterVariant>> = {
  authority: {
    婴幼儿: { name: '家长大人', icon: '👨‍👩‍👧', description: '掌控一切的家长大人' },
    童年: { name: '幼儿园园长', icon: '🏫', description: '管理着一群小怪兽的园长' },
    少年: { name: '小学校长', icon: '📝', description: '严厉的校长' },
    青少年: { name: '高中班主任', icon: '👔', description: '控制欲极强的班主任' },
    大学: { name: '系主任', icon: '🎓', description: '掌控学系的系主任' },
    青年: { name: '公司领导', icon: '💼', description: '掌控员工命运的领导' },
    壮年: { name: '行业大佬', icon: '🏆', description: '垄断行业的大佬' },
    中年: { name: '权贵', icon: '🎩', description: '掌握权力的权贵' },
    知天命: { name: '退休高官', icon: '📖', description: '退休后仍有影响力的官员' },
    花甲: { name: '家族长老', icon: '👴', description: '掌控家族的长老' },
    古稀: { name: '泰斗', icon: '🌟', description: '行业泰斗' },
    杖朝: { name: '国师', icon: '👑', description: '帝王之师' },
    期颐: { name: '百年权威', icon: '📜', description: '活了百年的权威' },
    长寿之星: { name: '权威之神', icon: '⚡', description: '超越凡人的权威之神' },
    传奇人生: { name: '秩序化身', icon: '🧠', description: '秩序本身的化身' },
  },
  temptation: {
    婴幼儿: { name: '糖果怪', icon: '🍬', description: '用糖果诱惑的怪物' },
    童年: { name: '玩具魔', icon: '🎮', description: '用玩具诱惑的恶魔' },
    少年: { name: '游戏妖', icon: '🎲', description: '用游戏诱惑的妖怪' },
    青少年: { name: '恋爱魔', icon: '💕', description: '用恋爱诱惑的恶魔' },
    大学: { name: '挂科魔', icon: '📉', description: '用挂科诱惑的恶魔' },
    青年: { name: '消费魔', icon: '💳', description: '用消费诱惑的恶魔' },
    壮年: { name: '权力魔', icon: '👑', description: '用权力诱惑的恶魔' },
    中年: { name: '贪婪魔', icon: '💰', description: '用金钱诱惑的恶魔' },
    知天命: { name: '养生魔', icon: '🧘', description: '用养生诱惑的恶魔' },
    花甲: { name: '长寿魔', icon: '🍵', description: '用长寿诱惑的恶魔' },
    古稀: { name: '仙福魔', icon: '🌟', description: '用仙福诱惑的恶魔' },
    杖朝: { name: '超凡魔', icon: '✨', description: '用超凡诱惑的恶魔' },
    期颐: { name: '长生魔', icon: '🌙', description: '用长生诱惑的恶魔' },
    长寿之星: { name: '永恒魔', icon: '🌌', description: '用永恒诱惑的恶魔' },
    传奇人生: { name: '混沌诱惑', icon: '🌌', description: '混沌中诞生的诱惑' },
  },
  crisis: {
    婴幼儿: { name: '哭闹魔', icon: '👶', description: '永远在哭闹的恶魔' },
    童年: { name: '作业魔', icon: '📝', description: '被作业压垮的恶魔' },
    少年: { name: '考试魔', icon: '😰', description: '被考试焦虑吞噬的恶魔' },
    青少年: { name: '青春魔', icon: '😩', description: '充满青春期烦恼的恶魔' },
    大学: { name: '就业魔', icon: '📉', description: '被就业压力吞噬的恶魔' },
    青年: { name: '过劳魔', icon: '☕', description: '靠咖啡续命的恶魔' },
    壮年: { name: '中年危机', icon: '😵', description: '陷入中年危机的恶魔' },
    中年: { name: '退休危机', icon: '😵', description: '面临退休危机的恶魔' },
    知天命: { name: '健康危机', icon: '🏥', description: '面临健康危机的恶魔' },
    花甲: { name: '孤独危机', icon: '😢', description: '面临孤独危机的恶魔' },
    古稀: { name: '疾病危机', icon: '💊', description: '面临疾病危机的恶魔' },
    杖朝: { name: '失能危机', icon: '🦽', description: '面临失能危机的恶魔' },
    期颐: { name: '生命危机', icon: '💀', description: '面临生命危机的恶魔' },
    长寿之星: { name: '存在危机', icon: '🌌', description: '面临存在危机的恶魔' },
    传奇人生: { name: '混沌危机', icon: '🌌', description: '混沌中诞生的危机' },
  },
  inner_demon: {
    婴幼儿: { name: '小魔头', icon: '👿', description: '调皮的小魔头' },
    童年: { name: '小恶魔', icon: '😈', description: '喜欢恶作剧的小恶魔' },
    少年: { name: '心魔', icon: '🖤', description: '潜伏在心中的魔' },
    青少年: { name: '叛逆魔', icon: '🖤', description: '充满叛逆气息的魔' },
    大学: { name: '迷茫魔', icon: '❓', description: '对未来感到迷茫的魔' },
    青年: { name: '社畜魔', icon: '💼', description: '被工作吞噬的魔' },
    壮年: { name: '压力魔', icon: '⚠️', description: '带来压力的魔' },
    中年: { name: '危机魔', icon: '🌪️', description: '象征中年危机的魔' },
    知天命: { name: '看透魔', icon: '👁️', description: '看透世事的魔' },
    花甲: { name: '智慧魔', icon: '🦉', description: '蕴含智慧的魔' },
    古稀: { name: '长寿魔', icon: '🕯️', description: '象征长寿的魔' },
    杖朝: { name: '仙灵魔', icon: '✨', description: '仙灵化的魔' },
    期颐: { name: '长生魔', icon: '🌙', description: '千年不散的魔' },
    长寿之星: { name: '万年魔', icon: '🌑', description: '万年不灭的魔' },
    传奇人生: { name: '混沌心魔', icon: '🌌', description: '混沌中诞生的心魔' },
  },
};

// 新增Boss怪物变体映射表
const BOSS_MONSTER_VARIANTS: Record<string, Record<string, MonsterVariant>> = {
  life_boss: {
    婴幼儿: { name: '初生的守护者', icon: '🌱', description: '守护新生的守护者' },
    童年: { name: '童年的审判者', icon: '🎮', description: '审判童年的审判者' },
    少年: { name: '少年的试炼者', icon: '⚔️', description: '试炼少年的试炼者' },
    青少年: { name: '青春的终结者', icon: '🔥', description: '终结青春的终结者' },
    大学: { name: '求知的引路人', icon: '🎓', description: '引导求知的引路人' },
    青年: { name: '奋斗的守望者', icon: '💼', description: '守望奋斗的守望者' },
    壮年: { name: '辉煌的观察者', icon: '🏆', description: '观察辉煌的观察者' },
    中年: { name: '沉稳的记录者', icon: '⚖️', description: '记录沉稳的记录者' },
    知天命: { name: '看透的启蒙者', icon: '🧘', description: '启蒙看透的启蒙者' },
    花甲: { name: '智慧的引渡人', icon: '🌅', description: '引渡智慧的引渡人' },
    古稀: { name: '古稀的守护者', icon: '🌙', description: '守护古稀的守护者' },
    杖朝: { name: '杖朝的审判者', icon: '🌤️', description: '审判杖朝的审判者' },
    期颐: { name: '期颐的试炼者', icon: '✨', description: '试炼期颐的试炼者' },
    长寿之星: { name: '万年守望者', icon: '🌌', description: '守望万年的守望者' },
    传奇人生: { name: '混沌守护者', icon: '🌌', description: '守护混沌的守护者' },
  },
  fate_boss: {
    婴幼儿: { name: '命运的萌芽', icon: '🌱', description: '命运刚刚萌芽' },
    童年: { name: '命运的玩具', icon: '🎮', description: '命运如同玩具' },
    少年: { name: '命运的挑战', icon: '⚔️', description: '命运带来挑战' },
    青少年: { name: '命运的火花', icon: '🔥', description: '命运迸发火花' },
    大学: { name: '命运的探索', icon: '🎓', description: '命运需要探索' },
    青年: { name: '命运的拼搏', icon: '💼', description: '命运需要拼搏' },
    壮年: { name: '命运的辉煌', icon: '🏆', description: '命运达到辉煌' },
    中年: { name: '命运的沉思', icon: '⚖️', description: '命运需要沉思' },
    知天命: { name: '命运的豁达', icon: '🧘', description: '命运变得豁达' },
    花甲: { name: '命运的从容', icon: '🌅', description: '命运变得从容' },
    古稀: { name: '命运的宁静', icon: '🌙', description: '命运变得宁静' },
    杖朝: { name: '命运的睿智', icon: '🌤️', description: '命运变得睿智' },
    期颐: { name: '命运的长生', icon: '✨', description: '命运获得长生' },
    长寿之星: { name: '命运的永恒', icon: '🌌', description: '命运达到永恒' },
    传奇人生: { name: '混沌命运', icon: '🌌', description: '混沌中的命运' },
  },
  time_boss: {
    婴幼儿: { name: '时间的起点', icon: '⏰', description: '时间刚刚起点' },
    童年: { name: '时间的流逝', icon: '⏳', description: '时间不断流逝' },
    少年: { name: '时间的成长', icon: '⚔️', description: '时间见证成长' },
    青少年: { name: '时间的燃烧', icon: '🔥', description: '时间在燃烧' },
    大学: { name: '时间的积累', icon: '🎓', description: '时间在积累' },
    青年: { name: '时间的加速', icon: '💼', description: '时间在加速' },
    壮年: { name: '时间的压力', icon: '🏆', description: '时间带来压力' },
    中年: { name: '时间的危机', icon: '⚖️', description: '时间带来危机' },
    知天命: { name: '时间的豁达', icon: '🧘', description: '时间变得豁达' },
    花甲: { name: '时间的从容', icon: '🌅', description: '时间变得从容' },
    古稀: { name: '时间的宁静', icon: '🌙', description: '时间变得宁静' },
    杖朝: { name: '时间的睿智', icon: '🌤️', description: '时间变得睿智' },
    期颐: { name: '时间的长生', icon: '✨', description: '时间获得长生' },
    长寿之星: { name: '时间的永恒', icon: '🌌', description: '时间达到永恒' },
    传奇人生: { name: '混沌时间', icon: '🌌', description: '混沌中的时间' },
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
 * 获取普通怪物变体（包含扩展类型）
 */
export function getNormalMonsterVariant(type: string, age: number): MonsterVariant {
  const stage = getAgeStage(age);
  const variants = NORMAL_MONSTER_VARIANTS[type] || NORMAL_MONSTER_VARIANTS_EXTENDED[type];
  if (!variants) {
    return { name: '未知怪物', icon: '❓', description: '来历不明的怪物' };
  }
  return variants[stage.name] || { name: '未知怪物', icon: '❓', description: '来历不明的怪物' };
}

/**
 * 获取精英怪物变体（包含扩展类型）
 */
export function getEliteMonsterVariant(type: string, age: number): MonsterVariant {
  const stage = getAgeStage(age);
  const variants = ELITE_MONSTER_VARIANTS[type] || ELITE_MONSTER_VARIANTS_EXTENDED[type];
  if (!variants) {
    return { name: '未知精英', icon: '❓', description: '来历不明的精英怪物' };
  }
  return variants[stage.name] || { name: '未知精英', icon: '❓', description: '来历不明的精英怪物' };
}

/**
 * 获取Boss怪物变体
 */
export function getBossMonsterVariant(type: string, age: number): MonsterVariant {
  const stage = getAgeStage(age);
  const variants = BOSS_MONSTER_VARIANTS[type];
  if (!variants) {
    return { name: '未知Boss', icon: '❓', description: '来历不明的Boss怪物' };
  }
  return variants[stage.name] || { name: '未知Boss', icon: '❓', description: '来历不明的Boss怪物' };
}

/**
 * 根据怪物类型和年龄获取变体（统一接口）
 */
export function getMonsterVariantByType(type: string, age: number, group: 'regular' | 'elite' | 'boss'): MonsterVariant {
  switch (group) {
    case 'regular':
      return getNormalMonsterVariant(type, age);
    case 'elite':
      return getEliteMonsterVariant(type, age);
    case 'boss':
      return getBossMonsterVariant(type, age);
  }
}

// 怪物基础属性配置
const MONSTER_BASE_STATS: Record<string, { health: number; block: number }> = {
  slime: { health: 20, block: 0 },
  ghost: { health: 25, block: 0 },
  golem: { health: 35, block: 5 },
  wraith: { health: 18, block: 0 },
  beast: { health: 28, block: 0 },
  insect: { health: 15, block: 0 },
  undead: { health: 30, block: 3 },
  elemental: { health: 22, block: 0 },
  academic: { health: 80, block: 0 },
  burnout: { health: 65, block: 0 },
  authority: { health: 90, block: 5 },
  temptation: { health: 70, block: 0 },
  crisis: { health: 100, block: 0 },
  inner_demon: { health: 85, block: 0 },
  life_boss: { health: 150, block: 10 },
  fate_boss: { health: 180, block: 5 },
  time_boss: { health: 200, block: 8 },
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
  beast: [
    { type: 'attack', damage: 8, hits: 2 },
    { type: 'buff', effect: 'strength', value: 2 },
    { type: 'attack', damage: 12 },
  ],
  insect: [
    { type: 'special', name: '召唤', description: '召唤同类助战' },
    { type: 'attack', damage: 3, hits: 3 },
    { type: 'buff', effect: 'dexterity', value: 2 },
  ],
  undead: [
    { type: 'defend', block: 5 },
    { type: 'buff', effect: 'regen', value: 3 },
    { type: 'attack', damage: 7 },
  ],
  elemental: [
    { type: 'attack', damage: 6 },
    { type: 'debuff', effect: 'vulnerable', value: 2 },
    { type: 'attack', damage: 10 },
  ],
  academic: [
    { type: 'attack', damage: 15 },
    { type: 'buff', effect: 'strength', value: 2 },
    { type: 'attack', damage: 10, hits: 2 },
    { type: 'defend', block: 10 },
  ],
  burnout: [
    { type: 'attack', damage: 12 },
    { type: 'debuff', effect: 'weak', value: 3 },
    { type: 'attack', damage: 8, hits: 2 },
    { type: 'special', name: '燃烧', description: '造成持续伤害' },
  ],
  authority: [
    { type: 'defend', block: 12 },
    { type: 'attack', damage: 14 },
    { type: 'debuff', effect: 'weak', value: 2 },
    { type: 'special', name: '压制', description: '限制玩家行动' },
  ],
  temptation: [
    { type: 'buff', effect: 'strength', value: 3 },
    { type: 'attack', damage: 10 },
    { type: 'debuff', effect: 'vulnerable', value: 3 },
    { type: 'special', name: '迷惑', description: '降低玩家防御' },
  ],
  crisis: [
    { type: 'attack', damage: 20 },
    { type: 'attack', damage: 15, hits: 2 },
    { type: 'special', name: '同归于尽', description: '造成大量伤害但自身也受损' },
  ],
  inner_demon: [
    { type: 'attack', damage: 12 },
    { type: 'debuff', effect: 'weak', value: 2 },
    { type: 'buff', effect: 'strength', value: 2 },
    { type: 'special', name: '镜像', description: '复制玩家技能' },
  ],
  life_boss: [
    { type: 'attack', damage: 20 },
    { type: 'defend', block: 15 },
    { type: 'attack', damage: 12, hits: 2 },
    { type: 'buff', effect: 'strength', value: 2 },
  ],
  fate_boss: [
    { type: 'special', name: '随机命运', description: '随机触发不同效果' },
    { type: 'attack', damage: 22 },
    { type: 'debuff', effect: 'vulnerable', value: 4 },
    { type: 'attack', damage: 10, hits: 3 },
  ],
  time_boss: [
    { type: 'attack', damage: 25 },
    { type: 'debuff', effect: 'weak', value: 3 },
    { type: 'special', name: '时间加速', description: '增加自身行动次数' },
    { type: 'attack', damage: 15, hits: 2 },
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
