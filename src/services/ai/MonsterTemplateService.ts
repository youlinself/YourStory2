import type { EnemyIntent, EnemyMechanic, StatusEffect } from '../../types/simulation';
import { getAgeStage, AGE_STAGES } from '../../data/monsterMapping';

export interface MonsterTemplate {
  intentTypes: { type: EnemyIntent['type']; description: string; params: string[] }[];
  statusEffects: { type: StatusEffect['type']; description: string }[];
  mechanics: { type: EnemyMechanic; description: string; unlockAge: number }[];
  monsterTypes: { type: string; description: string; baseHealth: number; baseBlock: number }[];
  ageStages: { name: string; minAge: number; maxAge: number; description: string }[];
}

export function getMonsterTemplate(): MonsterTemplate {
  return {
    intentTypes: [
      { type: 'attack', description: '造成直接伤害', params: ['damage: 伤害值', 'hits: 连击次数(可选)'] },
      { type: 'defend', description: '获得格挡值', params: ['block: 格挡值'] },
      { type: 'buff', description: '给自己增益效果', params: ['effect: 效果名称', 'value: 数值'] },
      { type: 'debuff', description: '给敌人减益效果', params: ['effect: 效果名称', 'value: 数值'] },
      { type: 'special', description: '特殊技能', params: ['name: 技能名称', 'description: 技能描述'] },
      { type: 'idle', description: '空过回合', params: [] },
    ],
    statusEffects: [
      { type: 'vulnerable', description: '受到伤害增加' },
      { type: 'weak', description: '攻击伤害减少' },
      { type: 'poison', description: '每回合受到毒素伤害' },
      { type: 'block', description: '格挡值' },
      { type: 'strength', description: '攻击力增加' },
      { type: 'dexterity', description: '格挡获得增加' },
      { type: 'shields', description: '护盾值' },
      { type: 'thorns', description: '反弹伤害' },
      { type: 'rage', description: '狂暴状态' },
      { type: 'regen', description: '每回合恢复生命' },
      { type: 'artifact', description: '神器效果' },
      { type: 'intangible', description: '虚无状态' },
    ],
    mechanics: [
      { type: 'double_attack', description: '每回合攻击两次', unlockAge: 20 },
      { type: 'shield', description: '周期性获得护盾', unlockAge: 40 },
      { type: 'regen', description: '每回合恢复生命', unlockAge: 60 },
      { type: 'rage', description: '生命值低时狂暴', unlockAge: 80 },
      { type: 'summon', description: '召唤小怪', unlockAge: 30 },
      { type: 'boss_aura', description: 'Boss光环效果', unlockAge: 0 },
    ],
    monsterTypes: [
      { type: 'slime', description: '史莱姆类：基础怪物，生命值低，无特殊能力', baseHealth: 20, baseBlock: 0 },
      { type: 'ghost', description: '幽灵类：多段攻击，可增益自身', baseHealth: 25, baseBlock: 0 },
      { type: 'golem', description: '傀儡类：高生命高格挡，防御型', baseHealth: 35, baseBlock: 5 },
      { type: 'wraith', description: '暗影类：减益型，削弱敌人', baseHealth: 18, baseBlock: 0 },
    ],
    ageStages: AGE_STAGES.map(s => ({ name: s.name, minAge: s.minAge, maxAge: s.maxAge, description: s.description })),
  };
}

export function buildMonsterTemplatePrompt(template: MonsterTemplate, age: number): string {
  const stage = getAgeStage(age);
  const availableMechanics = template.mechanics.filter(m => age >= m.unlockAge);

  return `怪物生成模板（年龄段：${stage.name}，${age}岁）：

【意图类型】（怪物的行动模式）
${template.intentTypes.map(t => `- ${t.type}: ${t.description} (${t.params.join(', ')})`).join('\n')}

【状态效果】（可应用于敌我双方）
${template.statusEffects.map(t => `- ${t.type}: ${t.description}`).join('\n')}

【特殊机制】（根据年龄解锁）
${availableMechanics.map(t => `- ${t.type}: ${t.description}(${t.unlockAge}岁解锁)`).join('\n')}

【怪物类型参考】（可自由组合创新）
${template.monsterTypes.map(t => `- ${t.type}: ${t.description} (基础生命${t.baseHealth}, 基础格挡${t.baseBlock})`).join('\n')}

【年龄段特征】
${stage.name}(${stage.minAge}-${stage.maxAge}岁)：${stage.description}

生成规则：
1. 每个怪物有2-4个意图，按顺序循环执行
2. 意图可以组合：攻击+防御、减益+攻击、增益+攻击等
3. 根据年龄段选择合适的怪物强度和机制
4. 可以创造新的怪物类型，不必局限于现有类型
5. 怪物名称和描述应该体现年龄段特征
6. 强度计算公式：基础值 × (1 + 年龄/10 × 0.12) × 难度系数`;
}

export function buildMonsterExample(age: number): string {
  if (age <= 9) {
    return `示例怪物（童年期）：
{
  "id": "monster_001",
  "name": "作业精灵",
  "icon": "📝",
  "description": "被作业逼疯的小精灵，会不断扔纸团攻击",
  "maxHealth": 22,
  "block": 0,
  "intents": [
    { "type": "attack", "damage": 4 },
    { "type": "attack", "damage": 3, "hits": 2 },
    { "type": "buff", "effect": "strength", "value": 1 }
  ],
  "goldReward": [5, 12],
  "cardRewards": [{ "id": "card_001", "name": "纸团射击", "icon": "📄", "description": "造成5点伤害", "rarity": "common", "type": "attack", "cost": 1, "effects": [{"type": "damage", "value": 5}] }],
  "age": ${age}
}`;
  } else if (age <= 19) {
    return `示例怪物（青少年期）：
{
  "id": "monster_002",
  "name": "考试焦虑魔",
  "icon": "😰",
  "description": "由考试焦虑凝聚而成的怪物，会释放压力波",
  "maxHealth": 35,
  "block": 3,
  "intents": [
    { "type": "attack", "damage": 6 },
    { "type": "debuff", "effect": "weak", "value": 2 },
    { "type": "defend", "block": 5 },
    { "type": "attack", "damage": 8 }
  ],
  "goldReward": [8, 18],
  "cardRewards": [{ "id": "card_002", "name": "压力释放", "icon": "💢", "description": "造成8点伤害", "rarity": "common", "type": "attack", "cost": 1, "effects": [{"type": "damage", "value": 8}] }],
  "age": ${age}
}`;
  } else if (age <= 39) {
    return `示例怪物（青年期）：
{
  "id": "monster_003",
  "name": "职场卷王",
  "icon": "💼",
  "description": "内卷到极致的怪物，会不断加班攻击",
  "maxHealth": 45,
  "block": 5,
  "intents": [
    { "type": "attack", "damage": 8 },
    { "type": "buff", "effect": "strength", "value": 2 },
    { "type": "attack", "damage": 6, "hits": 2 },
    { "type": "defend", "block": 8 }
  ],
  "mechanics": ["double_attack"],
  "goldReward": [12, 25],
  "cardRewards": [{ "id": "card_003", "name": "996福报", "icon": "⏰", "description": "造成10点伤害", "rarity": "rare", "type": "attack", "cost": 2, "effects": [{"type": "damage", "value": 10}] }],
  "age": ${age}
}`;
  } else {
    return `示例怪物（中老年期）：
{
  "id": "monster_004",
  "name": "养生达人",
  "icon": "🧘",
  "description": "修炼养生的神秘怪物，会恢复生命",
  "maxHealth": 55,
  "block": 8,
  "intents": [
    { "type": "defend", "block": 10 },
    { "type": "buff", "effect": "regen", "value": 3 },
    { "type": "attack", "damage": 10 },
    { "type": "special", "name": "太极推手", "description": "造成15点伤害并获得格挡" }
  ],
  "mechanics": ["regen", "shield"],
  "goldReward": [18, 35],
  "cardRewards": [{ "id": "card_004", "name": "养生之道", "icon": "🍵", "description": "获得8点格挡", "rarity": "rare", "type": "skill", "cost": 1, "effects": [{"type": "block", "value": 8}] }],
  "age": ${age}
}`;
  }
}
