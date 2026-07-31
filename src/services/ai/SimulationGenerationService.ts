import type { GameState, GameEvent, Enemy, LifeCard, PlayerAttributes, EraPreGeneratedContent, EraMap, YearPreGeneratedContent, YearOptionPreGenerated } from '../../types/simulation';
import { getEventsByBirthYear } from '../../data/eraEvents';
import { createAnnualBoss, getNormalMonsterVariant, createMonsterFromVariant } from '../../data/monsterMapping';
import { COMMON_ATTACK_CARDS, COMMON_SKILL_CARDS, LEGENDARY_CARDS } from '../../data/simulationData';
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
  eraMap: EraMap | null;
}

export interface MapContentRequirements {
  events: { yearIndex: number; optionId: string; age: number }[];
  normalEnemies: { yearIndex: number; optionId: string; age: number; count: number }[];
  eliteEnemies: { yearIndex: number; optionId: string; age: number; count: number }[];
  shopCards: { yearIndex: number; optionId: string; age: number; count: number }[];
  bossEnemies: { yearIndex: number; optionId: string; age: number }[];
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
    eraMap: gameState.currentMap,
  };
}

export function analyzeMapForContentRequirements(eraMap: EraMap, baseAge: number): MapContentRequirements {
  const requirements: MapContentRequirements = {
    events: [],
    normalEnemies: [],
    eliteEnemies: [],
    shopCards: [],
    bossEnemies: [],
  };

  eraMap.years.forEach((year, yearIndex) => {
    year.options.forEach((option) => {
      const age = baseAge + yearIndex;
      switch (option.type) {
        case 'event':
          requirements.events.push({ yearIndex, optionId: option.id, age });
          break;
        case 'combat':
          requirements.normalEnemies.push({ yearIndex, optionId: option.id, age, count: 2 + Math.floor(Math.random() * 2) });
          break;
        case 'elite':
          requirements.eliteEnemies.push({ yearIndex, optionId: option.id, age, count: 1 + Math.floor(Math.random() * 2) });
          break;
        case 'shop':
          requirements.shopCards.push({ yearIndex, optionId: option.id, age, count: 3 + Math.floor(Math.random() * 3) });
          break;
        case 'boss':
          requirements.bossEnemies.push({ yearIndex, optionId: option.id, age });
          break;
      }
    });
  });

  return requirements;
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

function buildEraContentPrompt(ctx: GenerationContext, requirements: MapContentRequirements): string {
  const attrSummary = Object.entries(ctx.playerAttributes)
    .map(([key, value]) => `${getAttributeName(key)}:${value}`)
    .join(', ');

  const ageStage = getAgeStageName(ctx.targetAgeStart);

  const eventAges = requirements.events.map(e => e.age).join(', ');
  const combatAges = requirements.normalEnemies.map(e => e.age).join(', ');
  const eliteAges = requirements.eliteEnemies.map(e => e.age).join(', ');
  const shopAges = requirements.shopCards.map(e => e.age).join(', ');
  const bossAge = requirements.bossEnemies.length > 0 ? requirements.bossEnemies[0].age : ctx.targetAgeEnd;

  return `请为${ageStage}(${ctx.targetAgeStart}-${ctx.targetAgeEnd}岁)生成完整的模拟人生内容。

玩家状态：
- 当前年龄：${ctx.currentAge}岁
- 目标年龄段：${ctx.targetAgeStart}-${ctx.targetAgeEnd}岁
- 属性：${attrSummary}
- 难度系数：${ctx.difficulty.toFixed(1)}

根据宏观地图分析，本次需要生成：
${requirements.events.length > 0 ? `- ${requirements.events.length}个事件（年龄段：${eventAges}）` : ''}
${requirements.normalEnemies.length > 0 ? `- ${requirements.normalEnemies.length}组普通怪物（年龄段：${combatAges}）` : ''}
${requirements.eliteEnemies.length > 0 ? `- ${requirements.eliteEnemies.length}组精英怪物（年龄段：${eliteAges}）` : ''}
${requirements.shopCards.length > 0 ? `- ${requirements.shopCards.length}组商店卡牌（年龄段：${shopAges}）` : ''}
${requirements.bossEnemies.length > 0 ? `- 1个Boss（年龄段：${bossAge}）` : ''}

请输出以下JSON格式：
{
  "events": [
    {
      "id": "event_001",
      "title": "事件标题（10字以内）",
      "baseText": "事件描述（50-100字）",
      "age": 5,
      "options": [
        {
          "id": "opt_001_1",
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
  ],
  "enemies": [
    {
      "id": "enemy_001",
      "name": "怪物名称",
      "icon": "👹",
      "description": "怪物描述",
      "maxHealth": 30,
      "block": 0,
      "intents": [{"type": "attack", "damage": 5}],
      "goldReward": [5, 15],
      "age": 5
    }
  ],
  "elites": [
    {
      "id": "elite_001",
      "name": "精英名称",
      "icon": "👺",
      "description": "精英描述",
      "maxHealth": 60,
      "block": 5,
      "intents": [{"type": "attack", "damage": 10}, {"type": "defend", "block": 5}],
      "goldReward": [15, 30],
      "age": 15
    }
  ],
  "shopCards": [
    {
      "id": "card_001",
      "name": "卡牌名称",
      "icon": "⚔️",
      "description": "卡牌描述",
      "rarity": "common",
      "type": "attack",
      "cost": 1,
      "effects": [{"type": "damage", "value": 6}]
    }
  ],
  "boss": {
    "id": "boss_001",
    "name": "Boss名称",
    "icon": "💀",
    "description": "Boss描述",
    "maxHealth": 150,
    "block": 10,
    "intents": [{"type": "attack", "damage": 20}, {"type": "special", "name": "审判"}],
    "goldReward": [80, 150]
  }
}

约束条件：
1. 事件数量：${requirements.events.length}个
2. 普通怪物组数：${requirements.normalEnemies.length}组，每组2-3个
3. 精英怪物组数：${requirements.eliteEnemies.length}组，每组1-2个
4. 商店卡牌组数：${requirements.shopCards.length}组，每组3-5张
5. Boss：${requirements.bossEnemies.length > 0 ? '1个' : '0个'}
6. attributeChanges 的键名必须是：energy, physique, health, iq, eq, wealth, network, fame
7. attributeChanges 的数值范围：-20 到 20
8. 每个事件的options数组长度：2-3个
9. 所有描述文本使用中文
10. 事件类型应该多样化（个人成长、人际关系、危机、机遇、道德困境等）
11. 怪物和Boss的强度应该与年龄段匹配`;
}

function buildEraContentSystemPrompt(): string {
  return `你是一位专业的人生叙事设计师，专门为模拟人生游戏生成完整的时代内容。

你的职责：
1. 根据宏观地图分析，生成该时代所有需要的内容
2. 事件标题简洁有力，不超过10个字
3. 事件描述生动有趣，50-100字
4. 选项设计体现不同价值观，没有绝对正确的答案
5. 成功/失败的结果描述要有戏剧性
6. 属性变化要合理，符合事件逻辑
7. 怪物和Boss的强度应该与年龄段匹配
8. 商店卡牌应该符合该年龄段的消费能力

设计原则：
- 连贯性：事件要与玩家年龄相符
- 个性化：根据玩家属性调整事件难度和选项
- 戏剧性：事件要有冲突和转折
- 后果性：选择要有真实的影响
- 时代感：体现不同年龄段的特征
- 平衡性：怪物强度与玩家成长匹配

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。`;
}

export async function generateEraContent(ctx: GenerationContext): Promise<EraPreGeneratedContent | null> {
  if (!ctx.eraMap) {
    return getDefaultEraContent(ctx.targetEra, ctx);
  }

  const aiService = await getAIService();
  const requirements = analyzeMapForContentRequirements(ctx.eraMap, ctx.targetAgeStart);

  if (!aiService) {
    return getDefaultEraContent(ctx.targetEra, ctx);
  }

  try {
    const systemPrompt = buildEraContentSystemPrompt();
    const userPrompt = buildEraContentPrompt(ctx, requirements);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await aiService.sendCustomMessages(messages);
    const parsed = safeParseJSON<{
      events: Array<{ id?: string; title: string; baseText: string; age?: number; options: unknown[] }>;
      enemies: Array<{ id?: string; name: string; icon: string; description: string; maxHealth: number; block: number; intents: unknown[]; goldReward: [number, number]; age: number }>;
      elites: Array<{ id?: string; name: string; icon: string; description: string; maxHealth: number; block: number; intents: unknown[]; goldReward: [number, number]; age: number }>;
      shopCards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
      boss: { id?: string; name: string; icon: string; description: string; maxHealth: number; block: number; intents: unknown[]; goldReward: [number, number] } | null;
    }>(response);

    if (parsed) {
      const validEvents: GameEvent[] = [];
      if (Array.isArray(parsed.events)) {
        for (const rawEvent of parsed.events) {
          const validationResult = validateGameEvent(rawEvent);
          if (validationResult.valid && validationResult.data) {
            validEvents.push(validationResult.data);
          }
        }
      }

      const validEnemies: Enemy[] = [];
      if (Array.isArray(parsed.enemies)) {
        for (const rawEnemy of parsed.enemies) {
          validEnemies.push({
            id: rawEnemy.id || generateId(),
            name: rawEnemy.name,
            icon: rawEnemy.icon,
            description: rawEnemy.description,
            maxHealth: rawEnemy.maxHealth,
            currentHealth: rawEnemy.maxHealth,
            block: rawEnemy.block || 0,
            intents: rawEnemy.intents as Enemy['intents'],
            currentIntentIndex: 0,
            statusEffects: [],
            isBoss: false,
            cardRewards: [],
            goldReward: rawEnemy.goldReward,
            mechanics: [],
            ageRange: [rawEnemy.age, rawEnemy.age + 9],
          });
        }
      }

      const validElites: Enemy[] = [];
      if (Array.isArray(parsed.elites)) {
        for (const rawElite of parsed.elites) {
          validElites.push({
            id: rawElite.id || generateId(),
            name: rawElite.name,
            icon: rawElite.icon,
            description: rawElite.description,
            maxHealth: rawElite.maxHealth,
            currentHealth: rawElite.maxHealth,
            block: rawElite.block || 0,
            intents: rawElite.intents as Enemy['intents'],
            currentIntentIndex: 0,
            statusEffects: [],
            isBoss: false,
            cardRewards: [],
            goldReward: rawElite.goldReward,
            mechanics: [],
            ageRange: [rawElite.age, rawElite.age + 9],
          });
        }
      }

      const validShopCards: LifeCard[] = [];
      if (Array.isArray(parsed.shopCards)) {
        for (const rawCard of parsed.shopCards) {
          validShopCards.push({
            id: rawCard.id || generateId(),
            name: rawCard.name,
            icon: rawCard.icon,
            description: rawCard.description,
            rarity: rawCard.rarity as LifeCard['rarity'],
            type: rawCard.type as LifeCard['type'],
            cost: rawCard.cost,
            effects: rawCard.effects as LifeCard['effects'],
            target: 'enemy',
            tags: [],
          });
        }
      }

      let validBoss: Enemy | null = null;
      if (parsed.boss) {
        validBoss = {
          id: parsed.boss.id || generateId(),
          name: parsed.boss.name,
          icon: parsed.boss.icon,
          description: parsed.boss.description,
          maxHealth: parsed.boss.maxHealth,
          currentHealth: parsed.boss.maxHealth,
          block: parsed.boss.block || 10,
          intents: parsed.boss.intents as Enemy['intents'],
          currentIntentIndex: 0,
          statusEffects: [],
          isBoss: true,
          cardRewards: LEGENDARY_CARDS.slice(0, 2).map(c => ({ ...c, id: generateId() })),
          goldReward: parsed.boss.goldReward,
          mechanics: ['boss_aura'],
          ageRange: [ctx.targetAgeStart, ctx.targetAgeEnd],
        };
      }

      const allEnemies = [...validEnemies, ...validElites];

      return assembleEraContent(ctx, requirements, validEvents, allEnemies, validBoss, validShopCards);
    }

    return getDefaultEraContent(ctx.targetEra, ctx);
  } catch (error) {
    console.error('AI时代内容生成失败:', error);
    return getDefaultEraContent(ctx.targetEra, ctx);
  }
}

function assembleEraContent(
  ctx: GenerationContext,
  requirements: MapContentRequirements,
  events: GameEvent[],
  enemies: Enemy[],
  boss: Enemy | null,
  shopCards: LifeCard[],
): EraPreGeneratedContent {
  const years: YearPreGeneratedContent[] = [];
  const baseAge = ctx.targetAgeStart;

  if (!ctx.eraMap) {
    return {
      era: ctx.targetEra,
      ageRange: [baseAge, baseAge + 9],
      years: [],
      boss,
      isComplete: true,
    };
  }

  const eventQueue = [...events];
  const enemyQueue = [...enemies];
  const shopQueue = [...shopCards];

  ctx.eraMap.years.forEach((year, yearIndex) => {
    const yearContent: YearPreGeneratedContent = {
      yearIndex,
      year: year.year,
      options: [],
    };

    year.options.forEach((option) => {
      const optionContent: YearOptionPreGenerated = {
        optionId: option.id,
        type: option.type,
      };

      switch (option.type) {
        case 'event': {
          const eventReq = requirements.events.find(e => e.optionId === option.id);
          if (eventReq && eventQueue.length > 0) {
            optionContent.event = eventQueue.shift()!;
          }
          break;
        }
        case 'combat': {
          const combatReq = requirements.normalEnemies.find(e => e.optionId === option.id);
          if (combatReq) {
            optionContent.enemies = enemyQueue.splice(0, combatReq.count);
          }
          break;
        }
        case 'elite': {
          const eliteReq = requirements.eliteEnemies.find(e => e.optionId === option.id);
          if (eliteReq) {
            optionContent.enemies = enemyQueue.splice(0, eliteReq.count);
          }
          break;
        }
        case 'shop': {
          const shopReq = requirements.shopCards.find(s => s.optionId === option.id);
          if (shopReq) {
            optionContent.shopCards = shopQueue.splice(0, shopReq.count);
          }
          break;
        }
        case 'boss': {
          if (boss) {
            optionContent.enemies = [boss];
          }
          break;
        }
      }

      yearContent.options.push(optionContent);
    });

    years.push(yearContent);
  });

  return {
    era: ctx.targetEra,
    ageRange: [baseAge, baseAge + 9],
    years,
    boss,
    isComplete: true,
  };
}

export function getDefaultEraContent(era: number, ctx: GenerationContext): EraPreGeneratedContent {
  const baseAge = era * 10;
  const multiplier = 1 + Math.floor(baseAge / 5) * 0.12;

  const years: YearPreGeneratedContent[] = [];

  if (ctx.eraMap) {
    ctx.eraMap.years.forEach((year, yearIndex) => {
      const yearContent: YearPreGeneratedContent = {
        yearIndex,
        year: year.year,
        options: [],
      };

      year.options.forEach((option) => {
        const optionContent: YearOptionPreGenerated = {
          optionId: option.id,
          type: option.type,
        };

        switch (option.type) {
          case 'event': {
            const events = getDefaultEventsForEra(era, baseAge, ctx.birthYear);
            if (events.length > 0) {
              optionContent.event = events[yearIndex % events.length];
            }
            break;
          }
          case 'combat': {
            optionContent.enemies = [];
            for (let i = 0; i < 3; i++) {
              const variant = getNormalMonsterVariant('slime', baseAge + yearIndex);
              const partial = createMonsterFromVariant(variant, 'slime', baseAge + yearIndex, multiplier);
              optionContent.enemies.push({
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
            break;
          }
          case 'elite': {
            optionContent.enemies = [];
            for (let i = 0; i < 2; i++) {
              const variant = getNormalMonsterVariant('slime', baseAge + yearIndex);
              const partial = createMonsterFromVariant(variant, 'slime', baseAge + yearIndex, multiplier * 1.5);
              optionContent.enemies.push({
                id: generateId(),
                name: variant.name + '精英',
                icon: '👺',
                description: variant.description + '（精英）',
                maxHealth: Math.floor((partial.maxHealth || 30) * 1.5),
                currentHealth: Math.floor((partial.currentHealth || 30) * 1.5),
                block: (partial.block || 0) + 5,
                intents: partial.intents || [{ type: 'attack', damage: Math.floor(8 * multiplier) }],
                currentIntentIndex: 0,
                statusEffects: [],
                isBoss: false,
                cardRewards: [],
                goldReward: [15, 30],
                mechanics: [],
                ageRange: [baseAge, baseAge + 9],
              });
            }
            break;
          }
          case 'shop': {
            optionContent.shopCards = [...COMMON_ATTACK_CARDS, ...COMMON_SKILL_CARDS].slice(0, 5).map(c => ({ ...c, id: generateId() }));
            break;
          }
          case 'boss': {
            const bossPartial = createAnnualBoss(baseAge + 9, ctx.currentYear, multiplier);
            optionContent.enemies = [{
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
            }];
            break;
          }
        }

        yearContent.options.push(optionContent);
      });

      years.push(yearContent);
    });
  }

  const bossPartial = createAnnualBoss(baseAge + 9, ctx.currentYear, multiplier);
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
    years,
    boss,
    isComplete: true,
    isDefault: true,
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
    .slice(0, 15);
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
