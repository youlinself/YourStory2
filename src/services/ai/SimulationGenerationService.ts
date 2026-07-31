import type { GameState, GameEvent, Enemy, LifeCard, PlayerAttributes, PreGeneratedContent } from '../../types/simulation';
import { getEventsByBirthYear } from '../../data/eraEvents';
import { createAnnualBoss, getNormalMonsterVariant, createMonsterFromVariant } from '../../data/monsterMapping';
import { COMMON_ATTACK_CARDS, COMMON_SKILL_CARDS, RARE_CARDS, LEGENDARY_CARDS } from '../../data/simulationData';
import { generateId } from '../../utils';
import { safeParseJSON, validateGameEvent } from './ContentValidator';
import AIService from './AIService';
import useAIStore from '../../stores/aiStore';

export interface GenerationContext {
  currentAge: number;
  currentYear: number;
  birthYear: number;
  targetEra: number;
  targetAgeStart: number;
  targetAgeEnd: number;
  playerAttributes: PlayerAttributes;
  playerPerformance: {
    winRate: number;
    avgHealthPercent: number;
    deathCount: number;
  };
  difficulty: number;
}

export function getBaseDifficultyByAge(age: number): number {
  if (age <= 5) return 0.5;
  if (age <= 9) return 0.6;
  if (age <= 13) return 0.8;
  if (age <= 17) return 1.0;
  if (age <= 21) return 1.1;
  if (age <= 29) return 1.3;
  if (age <= 39) return 1.5;
  if (age <= 49) return 1.7;
  if (age <= 59) return 1.6;
  if (age <= 69) return 1.5;
  if (age <= 79) return 1.4;
  if (age <= 89) return 1.3;
  if (age <= 99) return 1.2;
  if (age <= 110) return 1.5;
  return 2.0;
}

export function calculateDifficulty(ctx: GenerationContext): number {
  let difficulty = ctx.difficulty;

  if (ctx.playerPerformance.winRate > 0.8) {
    difficulty *= 1.2;
  } else if (ctx.playerPerformance.winRate < 0.4) {
    difficulty *= 0.8;
  }

  if (ctx.playerPerformance.avgHealthPercent > 0.7) {
    difficulty *= 1.1;
  } else if (ctx.playerPerformance.avgHealthPercent < 0.3) {
    difficulty *= 0.9;
  }

  difficulty *= Math.max(0.7, 1 - ctx.playerPerformance.deathCount * 0.05);

  return Math.max(0.5, Math.min(3.0, difficulty));
}

export function getTargetAgeRange(currentAge: number): { start: number; end: number } {
  const currentEra = Math.floor(currentAge / 10);
  const nextEra = currentEra + 1;
  return {
    start: nextEra * 10,
    end: nextEra * 10 + 9,
  };
}

function calculatePlayerPerformance(gameState: GameState): { winRate: number; avgHealthPercent: number; deathCount: number } {
  const recentChoices = gameState.choiceHistory.slice(-10);
  const successCount = recentChoices.filter(c => c.success).length;
  const winRate = recentChoices.length > 0 ? successCount / recentChoices.length : 0.5;

  return {
    winRate,
    avgHealthPercent: 0.5,
    deathCount: 0,
  };
}

export function buildGenerationContext(gameState: GameState): GenerationContext {
  const { age, attributes, birthYear } = gameState;
  const targetAgeRange = getTargetAgeRange(age);

  return {
    currentAge: age,
    currentYear: gameState.currentYear,
    birthYear: birthYear || 1950,
    targetEra: Math.floor(age / 10) + 1,
    targetAgeStart: targetAgeRange.start,
    targetAgeEnd: targetAgeRange.end,
    playerAttributes: attributes,
    playerPerformance: calculatePlayerPerformance(gameState),
    difficulty: getBaseDifficultyByAge(targetAgeRange.start),
  };
}

async function getAIService(): Promise<AIService | null> {
  const aiSettings = useAIStore.getState();
  if (!aiSettings.apiKey) return null;

  return new AIService({
    apiKey: aiSettings.apiKey,
    model: aiSettings.model,
    baseUrl: aiSettings.baseUrl,
    vendor: aiSettings.vendor,
    temperature: aiSettings.temperature,
    maxOutputTokens: aiSettings.maxOutputTokens,
    customModelName: aiSettings.customModelName,
    testUrl: aiSettings.testUrl,
  });
}

function buildEventPrompt(context: GenerationContext): string {
  const attrSummary = Object.entries(context.playerAttributes)
    .map(([key, value]) => `${getAttributeName(key)}:${value}`)
    .join(', ');

  const ageStage = getAgeStageName(context.targetAgeStart);

  return `请生成一个适合${ageStage}(${context.targetAgeStart}-${context.targetAgeEnd}岁)的模拟人生事件。

玩家状态：
- 当前年龄：${context.currentAge}岁
- 目标年龄段：${context.targetAgeStart}-${context.targetAgeEnd}岁
- 属性：${attrSummary}
- 难度系数：${context.difficulty.toFixed(1)}

请输出以下JSON格式：
{
  "title": "事件标题（10字以内）",
  "baseText": "事件描述（50-100字）",
  "options": [
    {
      "text": "选项文本（20字以内）",
      "successOutcome": {
        "description": "成功结果描述",
        "attributeChanges": {"iq": 5, "eq": 3}
      },
      "failureOutcome": {
        "description": "失败结果描述",
        "attributeChanges": {"energy": -2}
      }
    }
  ]
}

约束条件：
1. attributeChanges 的键名必须是：energy, physique, health, iq, eq, wealth, network, fame
2. attributeChanges 的数值范围：-20 到 20
3. options 数组长度：2-3个
4. 所有描述文本使用中文`;
}

export async function generateEraEvents(context: GenerationContext): Promise<GameEvent[]> {
  const aiService = await getAIService();

  if (!aiService) {
    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  }

  try {
    const prompt = buildEventPrompt(context);
    const response = await aiService.generateResponse(prompt, []);
    const parsed = safeParseJSON<{ title: string; baseText: string; options: unknown[] }>(response);

    if (parsed) {
      const validationResult = validateGameEvent(parsed);
      if (validationResult.valid && validationResult.data) {
        return [validationResult.data];
      }
    }

    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  } catch (error) {
    console.error('AI事件生成失败:', error);
    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  }
}

export async function generateEraEnemies(context: GenerationContext): Promise<Enemy[]> {
  const enemies: Enemy[] = [];
  const targetAge = context.targetAgeStart;
  const multiplier = 1 + Math.floor(context.targetAgeStart / 5) * 0.12;

  const monsterCount = Math.min(5 + Math.floor(context.targetAgeStart / 10), 10);

  for (let i = 0; i < monsterCount; i++) {
    const variant = getNormalMonsterVariant('slime', targetAge + i);
    const partial = createMonsterFromVariant(variant, 'slime', targetAge + i, multiplier);

    enemies.push({
      id: generateId(),
      name: variant.name,
      icon: variant.icon,
      description: variant.description,
      maxHealth: partial.maxHealth || Math.floor(20 * multiplier),
      currentHealth: partial.currentHealth || Math.floor(20 * multiplier),
      block: partial.block || 0,
      intents: partial.intents || [{ type: 'attack', damage: Math.floor(4 * multiplier) }, { type: 'defend', block: 3 }],
      currentIntentIndex: 0,
      statusEffects: [],
      isBoss: false,
      cardRewards: [COMMON_ATTACK_CARDS[0]].filter(Boolean).map(c => ({ ...c, id: generateId() })),
      goldReward: [5, 15],
      mechanics: [],
      ageRange: [context.targetAgeStart, context.targetAgeEnd],
    });
  }

  return enemies;
}

export async function generateEraBoss(context: GenerationContext): Promise<Enemy> {
  const bossAge = context.targetAgeEnd;
  const multiplier = 1 + Math.floor(bossAge / 5) * 0.12;
  const bossPartial = createAnnualBoss(bossAge, context.currentYear, multiplier);

  return {
    id: generateId(),
    name: bossPartial.name || '时代终结者',
    icon: bossPartial.icon || '💀',
    description: bossPartial.description || '回顾你的一生',
    maxHealth: bossPartial.maxHealth || Math.floor(150 * multiplier),
    currentHealth: bossPartial.currentHealth || Math.floor(150 * multiplier),
    block: bossPartial.block || 10,
    intents: bossPartial.intents || [
      { type: 'attack', damage: Math.floor(20 * multiplier) },
      { type: 'special', name: '审判', description: '造成巨额固定伤害' },
    ],
    currentIntentIndex: 0,
    statusEffects: [{ type: 'block', value: 10, duration: Infinity }],
    isBoss: true,
    cardRewards: LEGENDARY_CARDS.slice(0, 2).map(c => ({ ...c, id: generateId() })),
    goldReward: [80, 150],
    mechanics: ['boss_aura'],
    ageRange: [context.targetAgeStart, context.targetAgeEnd],
  };
}

export async function generateEraShopCards(context: GenerationContext): Promise<LifeCard[]> {
  const cards: LifeCard[] = [];
  const cardCount = Math.min(5 + Math.floor(context.targetAgeStart / 20), 12);

  const allCards = [...COMMON_ATTACK_CARDS, ...COMMON_SKILL_CARDS, ...RARE_CARDS];

  for (let i = 0; i < cardCount; i++) {
    const card = allCards[i % allCards.length];
    if (card) {
      cards.push({ ...card, id: generateId() });
    }
  }

  return cards;
}

export async function validateAndAssemble(params: {
  era: number;
  ageRange: [number, number];
  events: GameEvent[];
  enemies: Enemy[];
  boss: Enemy;
  shopCards: LifeCard[];
}): Promise<PreGeneratedContent> {
  return {
    era: params.era,
    ageRange: params.ageRange,
    events: params.events,
    enemies: params.enemies,
    boss: params.boss,
    shopCards: params.shopCards,
    isComplete: true,
  };
}

export function getDefaultEventsForEra(_era: number, baseAge: number, birthYear: number): GameEvent[] {
  const events = getEventsByBirthYear(birthYear as 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020 | 2030 | 2040 | 2050 | 2060 | 2070);

  return events
    .filter(event => {
      if (event.ageRange) {
        const [minAge, maxAge] = event.ageRange;
        return baseAge >= minAge && baseAge <= maxAge + 9;
      }
      return true;
    })
    .slice(0, 5);
}

export function getDefaultEraContent(era: number, gameState: GameState): PreGeneratedContent {
  const baseAge = era * 10;
  const multiplier = 1 + Math.floor(baseAge / 5) * 0.12;

  const enemies: Enemy[] = [];
  for (let i = 0; i < 5; i++) {
    const variant = getNormalMonsterVariant('slime', baseAge + i);
    const partial = createMonsterFromVariant(variant, 'slime', baseAge + i, multiplier);
    enemies.push({
      id: generateId(),
      name: variant.name,
      icon: variant.icon,
      description: variant.description,
      maxHealth: partial.maxHealth || Math.floor(20 * multiplier),
      currentHealth: partial.currentHealth || Math.floor(20 * multiplier),
      block: partial.block || 0,
      intents: partial.intents || [{ type: 'attack', damage: Math.floor(4 * multiplier) }],
      currentIntentIndex: 0,
      statusEffects: [],
      isBoss: false,
      cardRewards: [],
      goldReward: [5, 15],
      mechanics: [],
      ageRange: [baseAge, baseAge + 9],
    });
  }

  const bossPartial = createAnnualBoss(baseAge + 9, gameState.currentYear, multiplier);
  const boss: Enemy = {
    id: generateId(),
    name: bossPartial.name || '时代终结者',
    icon: bossPartial.icon || '💀',
    description: bossPartial.description || '回顾你的一生',
    maxHealth: bossPartial.maxHealth || Math.floor(150 * multiplier),
    currentHealth: bossPartial.currentHealth || Math.floor(150 * multiplier),
    block: bossPartial.block || 10,
    intents: bossPartial.intents || [{ type: 'attack', damage: Math.floor(20 * multiplier) }],
    currentIntentIndex: 0,
    statusEffects: [],
    isBoss: true,
    cardRewards: LEGENDARY_CARDS.slice(0, 2).map(c => ({ ...c, id: generateId() })),
    goldReward: [80, 150],
    mechanics: ['boss_aura'],
    ageRange: [baseAge, baseAge + 9],
  };

  return {
    era,
    ageRange: [baseAge, baseAge + 9],
    events: getDefaultEventsForEra(era, baseAge, gameState.birthYear || 1950),
    enemies,
    boss,
    shopCards: [...COMMON_ATTACK_CARDS, ...COMMON_SKILL_CARDS].slice(0, 8).map(c => ({ ...c, id: generateId() })),
    isComplete: true,
    isDefault: true,
  };
}

function getAttributeName(key: string): string {
  const names: Record<string, string> = {
    energy: '精力', physique: '体魄', health: '健康',
    iq: '智商', eq: '情商', wealth: '财富',
    network: '人脉', fame: '名望',
  };
  return names[key] || key;
}

function getAgeStageName(age: number): string {
  if (age <= 5) return '婴幼儿';
  if (age <= 9) return '童年';
  if (age <= 13) return '少年';
  if (age <= 17) return '青少年';
  if (age <= 21) return '大学';
  if (age <= 29) return '青年';
  if (age <= 39) return '壮年';
  if (age <= 49) return '中年';
  if (age <= 59) return '知天命';
  if (age <= 69) return '花甲';
  if (age <= 79) return '古稀';
  if (age <= 89) return '杖朝';
  if (age <= 99) return '期颐';
  if (age <= 110) return '长寿之星';
  return '传奇人生';
}
