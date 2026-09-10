import type { PromptInput, PromptTemplate } from '../PromptRegistry';
import type { PromptRegistry } from '../PromptRegistry';
import type { GameEvent, PlayerAttributes, ChoiceRecord } from '../../../types/simulation';

export interface SimulationEventPromptInput extends PromptInput {
  age: number;
  birthYear: number;
  attributes: PlayerAttributes;
  choiceHistory: ChoiceRecord[];
  era: number;
}

const ATTR_NAMES: Record<string, string> = {
  energy: '精力',
  physique: '体魄',
  health: '健康',
  iq: '智商',
  eq: '情商',
  wealth: '财富',
  network: '人脉',
  fame: '名望',
};

function buildEventSystemPrompt(): string {
  return `你是一位专业的人生叙事设计师，专门为模拟人生游戏生成个性化事件。

你的职责：
1. 根据玩家的年龄、属性和时代背景，生成符合情境的事件
2. 事件标题简洁有力，不超过10个字
3. 事件描述生动有趣，50-100字
4. 选项设计体现不同价值观，没有绝对正确的答案
5. 成功/失败的结果描述要有戏剧性
6. 属性变化要合理，符合事件逻辑

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。

返回格式示例：
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
}`;
}

function buildSingleEventPrompt(prompt: SimulationEventPromptInput): string {
  const eraNames = ['童年', '少年', '青年', '壮年', '中年', '暮年', '老年', '耄耋', '期颐', '修仙'];
  const eraName = eraNames[prompt.era] || '人生';

  const attrSummary = Object.entries(prompt.attributes)
    .map(([key, value]) => `${ATTR_NAMES[key] || key}:${value}`)
    .join(', ');

  const recentChoices = prompt.choiceHistory
    .slice(-3)
    .map((c) => `- ${c.description}(${c.success ? '成功' : '失败'})`)
    .join('\n');

  return `请为以下玩家生成一个适合其年龄的年度事件：

玩家状态：
- 年龄：${prompt.age}岁（${prompt.birthYear + prompt.age}年）
- 年代：${eraName}时期
- 属性：${attrSummary}
- 近期经历：${recentChoices || '无'}

约束条件：
1. 事件必须与${prompt.age}岁年龄段相符
2. 选项数量：2-3个
3. attributeChanges的键名必须是：energy, physique, health, iq, eq, wealth, network, fame
4. attributeChanges的数值范围：-20到20
5. 所有描述文本使用中文`;
}

const simulationEventTemplate: PromptTemplate = {
  id: 'simulation/event',
  name: '模拟人生事件',
  description: '为模拟人生游戏生成个性化事件',
  buildMessages: (input: PromptInput) => {
    const prompt = input as SimulationEventPromptInput;
    return [
      { role: 'system', content: buildEventSystemPrompt() },
      { role: 'user', content: buildSingleEventPrompt(prompt) },
    ];
  },
};

export function registerSimulationPrompts(registry: PromptRegistry): () => void {
  const disposers = [
    registry.register(simulationEventTemplate),
  ];

  return () => disposers.forEach(d => d());
}

export function validateAndFormatEvent(parsed: any, era: number): GameEvent | null {
  if (!parsed.title || !parsed.baseText || !Array.isArray(parsed.options)) {
    return null;
  }

  const validAttrs = ['energy', 'physique', 'health', 'iq', 'eq', 'wealth', 'network', 'fame'];

  const sanitizeAttributeChanges = (changes: Record<string, number>): Partial<PlayerAttributes> => {
    const result: Partial<PlayerAttributes> = {};
    for (const [key, value] of Object.entries(changes)) {
      if (validAttrs.includes(key) && typeof value === 'number') {
        const clampedValue = Math.max(-5, Math.min(5, value));
        result[key as keyof PlayerAttributes] = clampedValue;
      }
    }
    return result;
  };

  const options = parsed.options.slice(0, 3).map((opt: any, index: number) => ({
    id: opt.id || `ai_option_${index}`,
    text: opt.text || `选项${index + 1}`,
    successRate: opt.successRate || { energy: 0.5 },
    successOutcome: {
      description: opt.successOutcome?.description || '成功',
      attributeChanges: sanitizeAttributeChanges(opt.successOutcome?.attributeChanges || {}),
    },
    failureOutcome: {
      description: opt.failureOutcome?.description || '失败',
      attributeChanges: sanitizeAttributeChanges(opt.failureOutcome?.attributeChanges || {}),
    },
  }));

  return {
    id: parsed.id || `ai_event_${Date.now()}`,
    type: 'random',
    era,
    title: parsed.title,
    baseText: parsed.baseText,
    options,
    triggerCondition: undefined,
  };
}
