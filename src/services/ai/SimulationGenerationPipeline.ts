import type {
  GameEvent,
  Enemy,
  LifeCard,
  PlayerAttributes,
  EraPreGeneratedContent,
  EraMap,
  YearPreGeneratedContent,
  YearOptionPreGenerated,
  EnemyMechanic,
} from '../../types/simulation';
import type { BondCardDefinition } from '../../types/bond';
import { generateId } from '../../utils';
import { safeParseJSON, validateGameEvent } from './ContentValidator';
import AIService from './AIService';
import useAIStore from '../../stores/aiStore';
import {
  COMMON_ATTACK_CARDS,
  COMMON_SKILL_CARDS,
  RARE_CARDS,
  LEGENDARY_CARDS,
} from '../../data/simulationData';
import { BOND_CARDS, registerAIGeneratedBondCards } from '../../data/bondCards';
import { getMonsterTemplate, buildMonsterTemplatePrompt, buildMonsterExample } from './MonsterTemplateService';
import { getEventsByBirthYear } from '../../data/eraEvents';
import { createAnnualBoss, getNormalMonsterVariant, getEliteMonsterVariant, createMonsterFromVariant } from '../../data/monsterMapping';

export interface PipelineContext {
  currentAge: number;
  currentYear: number;
  birthYear: number;
  targetEra: number;
  targetAgeStart: number;
  targetAgeEnd: number;
  playerAttributes: PlayerAttributes;
  difficulty: number;
  eraMap: EraMap | null;
}

export interface GenerationRequirements {
  events: { yearIndex: number; optionId: string; age: number }[];
  normalEnemies: { yearIndex: number; optionId: string; age: number; count: number }[];
  eliteEnemies: { yearIndex: number; optionId: string; age: number; count: number }[];
  shopCards: { yearIndex: number; optionId: string; age: number; count: number }[];
  bossEnemies: { yearIndex: number; optionId: string; age: number }[];
}

export type GenerationPhase =
  | 'idle'
  | 'generating_events'
  | 'generating_enemies'
  | 'generating_elites'
  | 'generating_shop_cards'
  | 'generating_bond_cards'
  | 'generating_boss'
  | 'assembling'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  phase: GenerationPhase;
  currentStep: number;
  totalSteps: number;
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface BatchConfig {
  eventsPerRequest: number;
  enemiesPerRequest: number;
  shopCardsPerRequest: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  eventsPerRequest: 3,
  enemiesPerRequest: 4,
  shopCardsPerRequest: 5,
};

const VALID_CATEGORIES: BondCardDefinition['category'][] = ['family', 'friendship', 'education', 'career', 'romance', 'rival'];
const VALID_RARITIES: BondCardDefinition['rarity'][] = ['common', 'uncommon', 'rare', 'legendary'];

const ATTR_NAMES: Record<string, string> = {
  energy: '精力', physique: '体魄', health: '健康',
  iq: '智商', eq: '情商', wealth: '财富',
  network: '人脉', fame: '名望',
};

export class SimulationGenerationPipeline {
  private aiService: AIService | null = null;
  private progressCallback: ProgressCallback | null = null;
  private currentPhase: GenerationPhase = 'idle';
  private currentStep = 0;
  private totalSteps = 0;
  private batchConfig: BatchConfig = DEFAULT_BATCH_CONFIG;

  setProgressCallback(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  setBatchConfig(config: Partial<BatchConfig>) {
    this.batchConfig = { ...this.batchConfig, ...config };
  }

  private reportProgress(phase: GenerationPhase, message: string) {
    this.currentPhase = phase;
    this.progressCallback?.({
      phase,
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      message,
    });
  }

  private incrementStep(message: string) {
    this.currentStep++;
    this.reportProgress(this.currentPhase, message);
  }

  private async getAIService(): Promise<AIService | null> {
    if (this.aiService) return this.aiService;

    const aiSettings = useAIStore.getState();
    if (!aiSettings.apiKey) return null;

    this.aiService = new AIService({
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      vendor: aiSettings.vendor,
      temperature: aiSettings.temperature,
      maxOutputTokens: aiSettings.maxOutputTokens,
      customModelName: aiSettings.customModelName,
      testUrl: aiSettings.testUrl,
    });

    return this.aiService;
  }

  async generateEraContent(ctx: PipelineContext): Promise<EraPreGeneratedContent | null> {
    if (!ctx.eraMap) {
      return this.getDefaultEraContent(ctx);
    }

    const requirements = this.analyzeMapForContentRequirements(ctx.eraMap, ctx.targetAgeStart);
    const aiService = await this.getAIService();

    if (!aiService) {
      return this.getDefaultEraContent(ctx);
    }

    const eventBatches = Math.ceil(requirements.events.length / this.batchConfig.eventsPerRequest);
    const enemyBatches = Math.ceil(requirements.normalEnemies.length / this.batchConfig.enemiesPerRequest);
    const eliteBatches = Math.ceil(requirements.eliteEnemies.length / this.batchConfig.enemiesPerRequest);
    const shopBatches = Math.ceil(requirements.shopCards.length / this.batchConfig.shopCardsPerRequest);
    const bossBatches = requirements.bossEnemies.length > 0 ? 1 : 0;

    this.totalSteps = eventBatches + enemyBatches + eliteBatches + shopBatches + 1 + bossBatches + 1;

    this.currentStep = 0;

    try {
      const events = await this.generateEventsInBatches(ctx, requirements, aiService);
      const enemies = await this.generateEnemiesInBatches(ctx, requirements, aiService, 'normal');
      const elites = await this.generateEnemiesInBatches(ctx, requirements, aiService, 'elite');
      const shopCards = await this.generateShopCardsInBatches(ctx, requirements, aiService);
      const bondCards = await this.generateBondCardsOnce(ctx, aiService);
      const boss = await this.generateBossOnce(ctx, requirements, aiService);

      this.reportProgress('assembling', '正在组装内容...');

      const result = this.assembleEraContent(ctx, requirements, events, [...enemies, ...elites], boss, shopCards, bondCards);

      this.reportProgress('complete', '生成完成！');

      return result;
    } catch (error) {
      console.error('AI时代内容生成失败:', error);
      this.reportProgress('error', '生成失败，使用默认内容');
      return this.getDefaultEraContent(ctx);
    }
  }

  private async generateEventsInBatches(
    ctx: PipelineContext,
    requirements: GenerationRequirements,
    aiService: AIService,
  ): Promise<GameEvent[]> {
    if (requirements.events.length === 0) return [];

    const systemPrompt = this.buildEventSystemPrompt();
    const events: GameEvent[] = [];

    const batches = this.createBatches(requirements.events, this.batchConfig.eventsPerRequest);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      this.incrementStep(`正在生成事件 (${batchIndex + 1}/${batches.length})`);

      try {
        const userPrompt = this.buildBatchEventPrompt(ctx, batch);
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

        const response = await aiService.sendCustomMessages(messages);
        const parsed = safeParseJSON<Array<{ title: string; baseText: string; options: unknown[] }>>(response);

        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const rawEvent = parsed[i];
            const validationResult = validateGameEvent(rawEvent);
            if (validationResult.valid && validationResult.data) {
              events.push(validationResult.data);
            } else {
              events.push(this.getDefaultEvent(ctx, batch[i].age));
            }
          }
          continue;
        }

        for (const req of batch) {
          events.push(this.getDefaultEvent(ctx, req.age));
        }
      } catch (error) {
        console.error(`事件批次生成失败 (${batchIndex + 1}/${batches.length}):`, error);
        for (const req of batch) {
          events.push(this.getDefaultEvent(ctx, req.age));
        }
      }
    }

    return events;
  }

  private async generateEnemiesInBatches(
    ctx: PipelineContext,
    requirements: GenerationRequirements,
    aiService: AIService,
    type: 'normal' | 'elite',
  ): Promise<Enemy[]> {
    const reqs = type === 'normal' ? requirements.normalEnemies : requirements.eliteEnemies;
    if (reqs.length === 0) return [];

    const phaseName = type === 'normal' ? 'generating_enemies' : 'generating_elites';
    const label = type === 'normal' ? '普通怪物' : '精英怪物';
    this.reportProgress(phaseName, `正在生成${label}`);

    const enemies: Enemy[] = [];
    const systemPrompt = this.buildEnemySystemPrompt();
    const monsterTemplate = getMonsterTemplate();
    const templatePrompt = buildMonsterTemplatePrompt(monsterTemplate, ctx.targetAgeStart);
    const monsterExample = buildMonsterExample(ctx.targetAgeStart);

    const batches = this.createBatches(reqs, this.batchConfig.enemiesPerRequest);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      this.incrementStep(`正在生成${label} (${batchIndex + 1}/${batches.length})`);

      try {
        const userPrompt = this.buildBatchEnemyPrompt(ctx, batch, type, templatePrompt, monsterExample);
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

        const response = await aiService.sendCustomMessages(messages);
        const parsed = safeParseJSON<Array<{
          id?: string;
          name: string;
          icon: string;
          description: string;
          maxHealth: number;
          block: number;
          intents: unknown[];
          goldReward: [number, number];
          cardRewards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
          mechanics?: string[];
        }>>(response);

        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const rawEnemy = parsed[i];
            const req = batch[i];
            const enemy = this.buildEnemyFromParsed(rawEnemy, req.age, type === 'elite');
            if (enemy) {
              enemies.push(enemy);
            } else {
              enemies.push(...this.getDefaultEnemies(ctx, req.age, type, req.count));
            }
          }
          continue;
        }

        for (const req of batch) {
          enemies.push(...this.getDefaultEnemies(ctx, req.age, type, req.count));
        }
      } catch (error) {
        console.error(`${label}批次生成失败 (${batchIndex + 1}/${batches.length}):`, error);
        for (const req of batch) {
          enemies.push(...this.getDefaultEnemies(ctx, req.age, type, req.count));
        }
      }
    }

    return enemies;
  }

  private async generateShopCardsInBatches(
    ctx: PipelineContext,
    requirements: GenerationRequirements,
    aiService: AIService,
  ): Promise<LifeCard[]> {
    if (requirements.shopCards.length === 0) return [];

    this.reportProgress('generating_shop_cards', '正在生成商店卡牌');

    const allShopCards: LifeCard[] = [];
    const systemPrompt = this.buildShopCardSystemPrompt();

    const batches = this.createBatches(requirements.shopCards, this.batchConfig.shopCardsPerRequest);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      this.incrementStep(`正在生成商店卡牌 (${batchIndex + 1}/${batches.length})`);

      try {
        const userPrompt = this.buildBatchShopCardPrompt(ctx, batch);
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

        const response = await aiService.sendCustomMessages(messages);
        const parsed = safeParseJSON<{
          cards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
        }>(response);

        if (parsed && Array.isArray(parsed.cards)) {
          for (const rawCard of parsed.cards) {
            allShopCards.push({
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
          continue;
        }

        for (const req of batch) {
          allShopCards.push(...this.getDefaultShopCards(req.count));
        }
      } catch (error) {
        console.error(`商店卡牌批次生成失败 (${batchIndex + 1}/${batches.length}):`, error);
        for (const req of batch) {
          allShopCards.push(...this.getDefaultShopCards(req.count));
        }
      }
    }

    return allShopCards;
  }

  private async generateBondCardsOnce(
    ctx: PipelineContext,
    aiService: AIService,
  ): Promise<BondCardDefinition[]> {
    this.reportProgress('generating_bond_cards', '正在生成羁绊卡片');

    const systemPrompt = this.buildBondCardSystemPrompt();
    this.incrementStep('正在生成羁绊卡片');

    try {
      const userPrompt = this.buildBondCardPrompt(ctx);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await aiService.sendCustomMessages(messages);
      const parsed = safeParseJSON<{
        bondCards: Array<{ id?: string; name: string; category: string; icon: string; rarity: string; description: string; flavorText: string; minAge: number; maxAge?: number; appearWeight: number }>;
      }>(response);

      if (parsed && Array.isArray(parsed.bondCards)) {
        const validBondCards = this.validateBondCards(parsed.bondCards, ctx);
        if (validBondCards.length > 0) {
          registerAIGeneratedBondCards(validBondCards);
          return validBondCards;
        }
      }

      return [];
    } catch (error) {
      console.error('羁绊卡片生成失败:', error);
      return [];
    }
  }

  private async generateBossOnce(
    ctx: PipelineContext,
    requirements: GenerationRequirements,
    aiService: AIService,
  ): Promise<Enemy | null> {
    if (requirements.bossEnemies.length === 0) return null;

    this.reportProgress('generating_boss', '正在生成Boss');

    const bossAge = requirements.bossEnemies[0].age;
    const systemPrompt = this.buildBossSystemPrompt();
    const monsterTemplate = getMonsterTemplate();
    const templatePrompt = buildMonsterTemplatePrompt(monsterTemplate, ctx.targetAgeStart);
    const monsterExample = buildMonsterExample(ctx.targetAgeStart);

    this.incrementStep('正在生成Boss');

    try {
      const userPrompt = this.buildBossPrompt(ctx, bossAge, templatePrompt, monsterExample);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await aiService.sendCustomMessages(messages);
      const parsed = safeParseJSON<{
        id?: string;
        name: string;
        icon: string;
        description: string;
        maxHealth: number;
        block: number;
        intents: unknown[];
        goldReward: [number, number];
        cardRewards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
        mechanics?: string[];
      }>(response);

      if (parsed) {
        const boss = this.buildBossFromParsed(parsed, ctx);
        if (boss) return boss;
      }

      return this.getDefaultBoss(ctx);
    } catch (error) {
      console.error('Boss生成失败:', error);
      return this.getDefaultBoss(ctx);
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private buildEventSystemPrompt(): string {
    return `你是一位专业的人生叙事设计师，专门为模拟人生游戏生成个性化事件。

你的职责：
1. 根据玩家的年龄、属性和时代背景，生成符合情境的事件
2. 事件标题简洁有力，不超过10个字
3. 事件描述生动有趣，50-100字
4. 选项设计体现不同价值观，没有绝对正确的答案
5. 成功/失败的结果描述要有戏剧性
6. 属性变化要合理，符合事件逻辑

输出格式：严格的JSON数组格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
[
  {
    "title": "事件标题",
    "baseText": "事件描述文本...",
    "options": [
      {
        "id": "option_1",
        "text": "选项文本",
        "successRate": { "iq": 0.7 },
        "successOutcome": {
          "description": "成功结果描述",
          "attributeChanges": { "iq": 3, "fame": 5 }
        },
        "failureOutcome": {
          "description": "失败结果描述",
          "attributeChanges": { "eq": -2 }
        }
      }
    ]
  }
]`;
  }

  private buildBatchEventPrompt(ctx: PipelineContext, batch: { age: number }[]): string {
    const eraNames = ['童年', '少年', '青年', '壮年', '中年', '暮年', '老年', '耄耋', '期颐', '修仙'];
    const eraName = eraNames[ctx.targetEra] || '人生';

    const attrSummary = Object.entries(ctx.playerAttributes)
      .map(([key, value]) => `${ATTR_NAMES[key] || key}:${value}`)
      .join(', ');

    const ageList = batch.map((b, i) => `${i + 1}. ${b.age}岁（${ctx.birthYear + b.age}年）`).join('\n');

    return `请为以下玩家生成${batch.length}个年度事件：

玩家状态：
- 年代：${eraName}时期
- 属性：${attrSummary}

需要生成事件的年龄段：
${ageList}

约束条件：
1. 每个事件必须与对应年龄段相符
2. 每个事件的选项数量：2-3个
3. attributeChanges的键名必须是：energy, physique, health, iq, eq, wealth, network, fame
4. attributeChanges的数值范围：-20到20
5. 所有描述文本使用中文
6. 请按照年龄段顺序返回事件数组`;
  }

  private buildEnemySystemPrompt(): string {
    return `你是一位专业的游戏怪物设计师，专门为模拟人生游戏生成个性化怪物。

你的职责：
1. 根据玩家的年龄和时代背景，生成符合情境的怪物
2. 怪物名称简洁有力，体现年龄段特征
3. 怪物描述生动有趣，30-50字
4. 怪物的意图应该多样化，体现不同怪物的特色
5. 怪物的强度应该与年龄段匹配

输出格式：严格的JSON数组格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
[
  {
    "name": "怪物名称",
    "icon": "👹",
    "description": "怪物描述",
    "maxHealth": 30,
    "block": 0,
    "intents": [{"type": "attack", "damage": 5}],
    "goldReward": [5, 15],
    "cardRewards": [{"id": "card_001", "name": "打击", "icon": "⚔️", "description": "造成6点伤害", "rarity": "common", "type": "attack", "cost": "1", "effects": [{"type": "damage", "value": 6}]}],
    "mechanics": []
  }
]`;
  }

  private buildBatchEnemyPrompt(
    ctx: PipelineContext,
    batch: { age: number; count: number }[],
    type: 'normal' | 'elite',
    templatePrompt: string,
    monsterExample: string,
  ): string {
    const attrSummary = Object.entries(ctx.playerAttributes)
      .map(([key, value]) => `${ATTR_NAMES[key] || key}:${value}`)
      .join(', ');

    const difficultyLabel = type === 'elite' ? '精英' : '普通';

    const monsterList = batch.map((b, i) => {
      const healthRange = type === 'elite'
        ? b.age <= 17 ? '40-60' : b.age <= 39 ? '60-90' : '90-120'
        : b.age <= 17 ? '20-35' : b.age <= 39 ? '35-55' : '55-80';
      return `${i + 1}. ${b.age}岁，数量${b.count}个，生命值范围${healthRange}`;
    }).join('\n');

    return `请为以下玩家生成${batch.length}组${difficultyLabel}怪物：

玩家状态：
- 属性：${attrSummary}
- 难度系数：${ctx.difficulty.toFixed(1)}

${templatePrompt}

${monsterExample}

需要生成怪物的年龄段：
${monsterList}

约束条件：
1. 每组怪物必须与对应年龄段相符
2. 怪物类型：${difficultyLabel}
3. 每组必须包含cardRewards数组（1-2张卡牌奖励）
4. 怪物的意图应该多样化
5. 可以添加mechanics数组来给怪物特殊能力
6. 怪物名称和图标应该与年龄段特征相关
7. 所有描述文本使用中文
8. 请按照年龄段顺序返回怪物数组，每个怪物包含count字段表示该组怪物数量`;
  }

  private buildShopCardSystemPrompt(): string {
    return `你是一位专业的游戏卡牌设计师，专门为模拟人生游戏生成商店卡牌。

你的职责：
1. 根据玩家的年龄和时代背景，生成符合情境的商店卡牌
2. 卡牌名称简洁有力
3. 卡牌描述清晰明了
4. 卡牌效果应该与年龄段匹配

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
{
  "cards": [
    {
      "name": "卡牌名称",
      "icon": "⚔️",
      "description": "卡牌描述",
      "rarity": "common",
      "type": "attack",
      "cost": 1,
      "effects": [{"type": "damage", "value": 6}]
    }
  ]
}`;
  }

  private buildBatchShopCardPrompt(ctx: PipelineContext, batch: { age: number; count: number }[]): string {
    const cardList = batch.map((b) => `- ${b.age}岁：${b.count}张`).join('\n');
    const totalCards = batch.reduce((sum, b) => sum + b.count, 0);

    return `请为以下玩家生成${totalCards}张商店卡牌：

玩家状态：
- 难度系数：${ctx.difficulty.toFixed(1)}

各年龄段卡牌需求：
${cardList}

约束条件：
1. 卡牌必须与对应年龄段相符
2. rarity必须是：common、uncommon、rare、legendary之一
3. type必须是：attack、skill、power、curse之一
4. 所有描述文本使用中文`;
  }

  private buildBondCardSystemPrompt(): string {
    return `你是一位专业的羁绊设计师，专门为模拟人生游戏生成羁绊卡片。

你的职责：
1. 根据玩家的年龄和时代背景，生成符合情境的羁绊卡片
2. 羁绊名称简洁有力，体现人际关系特征
3. 羁绊描述富有情感和故事性
4. 羁绊应该体现该年龄段的人际关系特色

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
{
  "bondCards": [
    {
      "name": "羁绊名称",
      "category": "family",
      "icon": "👨",
      "rarity": "common",
      "description": "羁绊描述",
      "flavorText": "羁绊风味文本",
      "minAge": 20,
      "maxAge": 30,
      "appearWeight": 40
    }
  ]
}`;
  }

  private buildBondCardPrompt(ctx: PipelineContext): string {
    const existingBondCardNames = BOND_CARDS.map(c => c.name).join('、');

    return `请为以下年龄段生成3-5张羁绊卡片：

目标年龄段：${ctx.targetAgeStart}-${ctx.targetAgeEnd}岁

约束条件：
1. 羁绊卡片数量：3-5张
2. category必须是：family、friendship、education、career、romance、rival之一
3. rarity必须是：common、uncommon、rare、legendary之一
4. appearWeight数值：common=40、uncommon=25、rare=10、legendary=3
5. 羁绊卡片名称不能与现有羁绊重复，现有羁绊包括：${existingBondCardNames}
6. 羁绊卡片应该体现该年龄段的人际关系特征
7. flavorText应该富有情感和故事性
8. 所有描述文本使用中文`;
  }

  private buildBossSystemPrompt(): string {
    return `你是一位专业的Boss设计师，专门为模拟人生游戏生成时代Boss。

你的职责：
1. 根据玩家的年龄和时代背景，生成符合情境的Boss
2. Boss名称威严有力，体现时代终结者的特征
3. Boss描述生动有趣，50-80字
4. Boss的意图应该多样化，体现Boss的强大
5. Boss的强度应该与年龄段匹配

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
{
  "name": "Boss名称",
  "icon": "💀",
  "description": "Boss描述",
  "maxHealth": 150,
  "block": 10,
  "intents": [{"type": "attack", "damage": 20}, {"type": "special", "name": "审判"}],
  "goldReward": [80, 150],
  "cardRewards": [{"id": "card_004", "name": "天罚", "icon": "⚡", "description": "造成20点伤害", "rarity": "legendary", "type": "attack", "cost": 3, "effects": [{"type": "damage", "value": 20}]}],
  "mechanics": ["boss_aura"]
}`;
  }

  private buildBossPrompt(
    ctx: PipelineContext,
    bossAge: number,
    templatePrompt: string,
    monsterExample: string,
  ): string {
    const attrSummary = Object.entries(ctx.playerAttributes)
      .map(([key, value]) => `${ATTR_NAMES[key] || key}:${value}`)
      .join(', ');

    const healthRange = bossAge <= 17 ? '100-130' : bossAge <= 39 ? '130-180' : '180-250';

    return `请为以下玩家生成一个时代Boss：

玩家状态：
- Boss年龄：${bossAge}岁
- 属性：${attrSummary}
- 难度系数：${ctx.difficulty.toFixed(1)}

${templatePrompt}

${monsterExample}

约束条件：
1. Boss必须与${bossAge}岁年龄段相符
2. 生命值范围：${healthRange}
3. 必须包含cardRewards数组（2-3张稀有或传说卡牌）
4. Boss的意图应该多样化，体现Boss的强大
5. 必须包含mechanics数组，至少包含boss_aura
6. Boss名称和图标应该与年龄段特征相关
7. 所有描述文本使用中文`;
  }

  private buildEnemyFromParsed(
    parsed: {
      id?: string;
      name: string;
      icon: string;
      description: string;
      maxHealth: number;
      block: number;
      intents: unknown[];
      goldReward: [number, number];
      cardRewards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
      mechanics?: string[];
    },
    age: number,
    isElite: boolean,
  ): Enemy | null {
    if (!parsed.name || !parsed.description) return null;

    const cardRewards: LifeCard[] = [];
    if (Array.isArray(parsed.cardRewards)) {
      for (const rawCard of parsed.cardRewards) {
        cardRewards.push({
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

    if (cardRewards.length === 0) {
      cardRewards.push(...(isElite ? RARE_CARDS : COMMON_ATTACK_CARDS).slice(0, 1).map(c => ({ ...c, id: generateId() })));
    }

    return {
      id: parsed.id || generateId(),
      name: parsed.name,
      icon: parsed.icon || (isElite ? '👹' : '👾'),
      description: parsed.description,
      maxHealth: parsed.maxHealth || (isElite ? 50 : 30),
      currentHealth: parsed.maxHealth || (isElite ? 50 : 30),
      block: parsed.block || 0,
      intents: parsed.intents as Enemy['intents'],
      currentIntentIndex: 0,
      statusEffects: [],
      isBoss: false,
      cardRewards,
      goldReward: parsed.goldReward || (isElite ? [15, 30] : [5, 15]),
      mechanics: (parsed.mechanics as EnemyMechanic[]) || [],
      ageRange: [age, age + 9],
    };
  }

  private buildBossFromParsed(
    parsed: {
      id?: string;
      name: string;
      icon: string;
      description: string;
      maxHealth: number;
      block: number;
      intents: unknown[];
      goldReward: [number, number];
      cardRewards: Array<{ id?: string; name: string; icon: string; description: string; rarity: string; type: string; cost: number; effects: unknown[] }>;
      mechanics?: string[];
    },
    ctx: PipelineContext,
  ): Enemy | null {
    if (!parsed.name || !parsed.description) return null;

    const cardRewards: LifeCard[] = [];
    if (Array.isArray(parsed.cardRewards)) {
      for (const rawCard of parsed.cardRewards) {
        cardRewards.push({
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

    if (cardRewards.length === 0) {
      cardRewards.push(...LEGENDARY_CARDS.slice(0, 2).map(c => ({ ...c, id: generateId() })));
    }

    return {
      id: parsed.id || generateId(),
      name: parsed.name,
      icon: parsed.icon || '💀',
      description: parsed.description,
      maxHealth: parsed.maxHealth || 150,
      currentHealth: parsed.maxHealth || 150,
      block: parsed.block || 10,
      intents: parsed.intents as Enemy['intents'],
      currentIntentIndex: 0,
      statusEffects: [],
      isBoss: true,
      cardRewards,
      goldReward: parsed.goldReward || [80, 150],
      mechanics: ['boss_aura', ...((parsed.mechanics as EnemyMechanic[]) || [])],
      ageRange: [ctx.targetAgeStart, ctx.targetAgeEnd],
    };
  }

  private validateBondCards(
    rawCards: Array<{ id?: string; name: string; category: string; icon: string; rarity: string; description: string; flavorText: string; minAge: number; maxAge?: number; appearWeight: number }>,
    ctx: PipelineContext,
  ): BondCardDefinition[] {
    const existingIds = new Set(BOND_CARDS.map(c => c.id));
    const existingNames = new Set(BOND_CARDS.map(c => c.name));
    const validBondCards: BondCardDefinition[] = [];

    for (const rawCard of rawCards) {
      if (!rawCard.name || !rawCard.category || !rawCard.rarity) continue;
      if (rawCard.id && existingIds.has(rawCard.id)) continue;
      if (existingNames.has(rawCard.name)) continue;
      if (!VALID_CATEGORIES.includes(rawCard.category as BondCardDefinition['category'])) continue;
      if (!VALID_RARITIES.includes(rawCard.rarity as BondCardDefinition['rarity'])) continue;

      validBondCards.push({
        id: rawCard.id || generateId(),
        name: rawCard.name,
        category: rawCard.category as BondCardDefinition['category'],
        icon: rawCard.icon || '👤',
        rarity: rawCard.rarity as BondCardDefinition['rarity'],
        description: rawCard.description || '',
        flavorText: rawCard.flavorText || '',
        minAge: rawCard.minAge ?? ctx.targetAgeStart,
        maxAge: rawCard.maxAge,
        appearWeight: rawCard.appearWeight ?? 40,
      });
    }

    return validBondCards;
  }

  private analyzeMapForContentRequirements(eraMap: EraMap, baseAge: number): GenerationRequirements {
    const requirements: GenerationRequirements = {
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

  private assembleEraContent(
    ctx: PipelineContext,
    requirements: GenerationRequirements,
    events: GameEvent[],
    enemies: Enemy[],
    boss: Enemy | null,
    shopCards: LifeCard[],
    bondCards: BondCardDefinition[],
  ): EraPreGeneratedContent {
    const years: YearPreGeneratedContent[] = [];
    const baseAge = ctx.targetAgeStart;

    if (!ctx.eraMap) {
      return {
        era: ctx.targetEra,
        ageRange: [baseAge, baseAge + 9],
        years: [],
        boss,
        bondCards,
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
      bondCards,
      isComplete: true,
    };
  }

  private getDefaultEvent(ctx: PipelineContext, age: number): GameEvent {
    const events = getEventsByBirthYear(ctx.birthYear as 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020 | 2030 | 2040 | 2050 | 2060 | 2070);
    const ageAppropriateEvents = events.filter(e => {
      if (e.ageRange) {
        const [minAge, maxAge] = e.ageRange;
        return age >= minAge && age <= maxAge;
      }
      return true;
    });
    const pool = ageAppropriateEvents.length > 0 ? ageAppropriateEvents : events;
    return pool[Math.floor(Math.random() * pool.length)] || events[0];
  }

  private getDefaultEnemies(_ctx: PipelineContext, age: number, type: 'normal' | 'elite', count: number): Enemy[] {
    const enemies: Enemy[] = [];
    const multiplier = 1 + Math.floor(age / 5) * 0.12;

    if (type === 'normal') {
      const monsterTypes = ['slime', 'ghost', 'golem', 'wraith', 'beast', 'insect', 'undead', 'elemental'];
      for (let i = 0; i < count; i++) {
        const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        const variant = getNormalMonsterVariant(monsterType, age);
        const partial = createMonsterFromVariant(variant, monsterType, age, multiplier);
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
          cardRewards: COMMON_ATTACK_CARDS.slice(0, 1).map(c => ({ ...c, id: generateId() })),
          goldReward: [5, 15],
          mechanics: [],
          ageRange: [age, age],
        });
      }
    } else {
      const eliteTypes = ['academic', 'burnout', 'authority', 'temptation', 'crisis', 'inner_demon'];
      for (let i = 0; i < count; i++) {
        const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        const variant = getEliteMonsterVariant(eliteType, age);
        const partial = createMonsterFromVariant(variant, 'slime', age, multiplier * 1.5);
        enemies.push({
          id: generateId(),
          name: variant.name,
          icon: variant.icon,
          description: variant.description,
          maxHealth: Math.floor((partial.maxHealth || 30) * 1.5),
          currentHealth: Math.floor((partial.currentHealth || 30) * 1.5),
          block: (partial.block || 0) + 5,
          intents: partial.intents || [{ type: 'attack', damage: Math.floor(8 * multiplier) }],
          currentIntentIndex: 0,
          statusEffects: [],
          isBoss: false,
          cardRewards: RARE_CARDS.slice(0, 1).map(c => ({ ...c, id: generateId() })),
          goldReward: [15, 30],
          mechanics: [],
          ageRange: [age, age],
        });
      }
    }

    return enemies;
  }

  private getDefaultShopCards(count: number): LifeCard[] {
    return [...COMMON_ATTACK_CARDS, ...COMMON_SKILL_CARDS].slice(0, count).map(c => ({ ...c, id: generateId() }));
  }

  private getDefaultBoss(ctx: PipelineContext): Enemy {
    const baseAge = ctx.targetAgeStart;
    const finalBossAge = baseAge + 9;
    const multiplier = 1 + Math.floor(baseAge / 5) * 0.12;
    const bossPartial = createAnnualBoss(finalBossAge, ctx.currentYear, multiplier);

    return {
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
      ageRange: [finalBossAge, finalBossAge],
    };
  }

  private getDefaultEraContent(ctx: PipelineContext): EraPreGeneratedContent {
    const baseAge = ctx.targetAgeStart;

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

          const currentAgeAtYear = baseAge + yearIndex;

          switch (option.type) {
            case 'event': {
              const events = getEventsByBirthYear(ctx.birthYear as 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020 | 2030 | 2040 | 2050 | 2060 | 2070);
              const ageAppropriateEvents = events.filter(e => {
                if (e.ageRange) {
                  const [minAge, maxAge] = e.ageRange;
                  return currentAgeAtYear >= minAge && currentAgeAtYear <= maxAge;
                }
                return true;
              });
              const eventPool = ageAppropriateEvents.length > 0 ? ageAppropriateEvents : events;
              optionContent.event = eventPool[yearIndex % eventPool.length];
              break;
            }
            case 'combat': {
              optionContent.enemies = this.getDefaultEnemies(ctx, currentAgeAtYear, 'normal', 3);
              break;
            }
            case 'elite': {
              optionContent.enemies = this.getDefaultEnemies(ctx, currentAgeAtYear, 'elite', 2);
              break;
            }
            case 'shop': {
              optionContent.shopCards = this.getDefaultShopCards(5);
              break;
            }
            case 'boss': {
              optionContent.enemies = [this.getDefaultBoss(ctx)];
              break;
            }
          }

          yearContent.options.push(optionContent);
        });

        years.push(yearContent);
      });
    }

    return {
      era: ctx.targetEra,
      ageRange: [baseAge, baseAge + 9],
      years,
      boss: this.getDefaultBoss(ctx),
      bondCards: [],
      isComplete: true,
      isDefault: true,
    };
  }
}

export const simulationGenerationPipeline = new SimulationGenerationPipeline();
