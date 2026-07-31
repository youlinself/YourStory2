import type { PlayerAttributes, EventOutcome, GameEvent, EventOption } from '../../types/simulation';

export interface ValidationResult<T> {
  valid: boolean;
  data: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
  autoFixed: boolean;
  fallbackValue?: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
  originalValue: unknown;
}

const ATTRIBUTE_NAME_MAPPING: Record<string, keyof PlayerAttributes> = {
  '精力': 'energy', '体力': 'energy',
  '体魄': 'physique', '体质': 'physique',
  '健康': 'health',
  '智商': 'iq', '智力': 'iq', '智慧': 'iq',
  '情商': 'eq',
  '财富': 'wealth', '金钱': 'wealth',
  '人脉': 'network', '关系': 'network',
  '名望': 'fame', '声望': 'fame', '名誉': 'fame',
  'intelligence': 'iq',
  'charisma': 'eq',
  'money': 'wealth',
  'reputation': 'fame',
};

const VALID_ATTRIBUTE_KEYS: (keyof PlayerAttributes)[] = [
  'energy', 'physique', 'health', 'iq', 'eq', 'wealth', 'network', 'fame'
];

const VALUE_LIMITS = {
  attributeChanges: { min: -20, max: 20 },
  goldReward: { min: 0, max: 1000 },
  lifeCost: { min: 0, max: 20 },
  successRate: { min: 0, max: 1 },
};

export function normalizeAttributeKey(key: string): keyof PlayerAttributes | null {
  if (key in ATTRIBUTE_NAME_MAPPING) {
    return ATTRIBUTE_NAME_MAPPING[key];
  }
  if (VALID_ATTRIBUTE_KEYS.includes(key as keyof PlayerAttributes)) {
    return key as keyof PlayerAttributes;
  }
  return null;
}

export function sanitizeAttributeChanges(changes: Record<string, unknown>): Partial<PlayerAttributes> {
  const result: Partial<PlayerAttributes> = {};

  for (const [key, value] of Object.entries(changes)) {
    const normalizedKey = normalizeAttributeKey(key);
    if (normalizedKey && typeof value === 'number') {
      const clampedValue = Math.max(
        VALUE_LIMITS.attributeChanges.min,
        Math.min(VALUE_LIMITS.attributeChanges.max, value)
      );
      result[normalizedKey] = clampedValue;
    }
  }

  return result;
}

export function sanitizeGoldReward(value: unknown): number {
  if (typeof value !== 'number') return 0;
  return Math.max(VALUE_LIMITS.goldReward.min, Math.min(VALUE_LIMITS.goldReward.max, value));
}

export function sanitizeLifeCost(value: unknown): number {
  if (typeof value !== 'number') return 0;
  return Math.max(VALUE_LIMITS.lifeCost.min, Math.min(VALUE_LIMITS.lifeCost.max, value));
}

export function sanitizeSuccessRate(value: unknown): number {
  if (typeof value !== 'number') return 0.5;
  return Math.max(VALUE_LIMITS.successRate.min, Math.min(VALUE_LIMITS.successRate.max, value));
}

export function validateEventOutcome(outcome: unknown): ValidationResult<EventOutcome> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const result: EventOutcome = {
    description: '结果未知',
    attributeChanges: {},
  };

  if (!outcome || typeof outcome !== 'object') {
    errors.push({ field: 'outcome', message: '结果不是有效对象', severity: 'critical', autoFixed: true, fallbackValue: result });
    return { valid: false, data: result, errors, warnings };
  }

  const raw = outcome as Record<string, unknown>;

  if (typeof raw.description === 'string') {
    result.description = raw.description.slice(0, 500);
  } else {
    warnings.push({ field: 'description', message: '描述字段类型错误', originalValue: raw.description });
  }

  if (raw.attributeChanges && typeof raw.attributeChanges === 'object') {
    result.attributeChanges = sanitizeAttributeChanges(raw.attributeChanges as Record<string, unknown>);
  }

  if (typeof raw.goldReward === 'number') {
    result.goldReward = sanitizeGoldReward(raw.goldReward);
  }

  if (typeof raw.lifeCost === 'number') {
    result.lifeCost = sanitizeLifeCost(raw.lifeCost);
  }

  if (raw.triggerCombat !== undefined) {
    result.triggerCombat = Boolean(raw.triggerCombat);
  }

  return { valid: errors.length === 0, data: result, errors, warnings };
}

export function validateEventOption(option: unknown, index: number): ValidationResult<EventOption> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const fallback: EventOption = {
    id: `validated_option_${index}`,
    text: `选项${index + 1}`,
    successRate: { energy: 0.5 },
    successOutcome: { description: '成功', attributeChanges: {} },
    failureOutcome: { description: '失败', attributeChanges: {} },
  };

  if (!option || typeof option !== 'object') {
    errors.push({ field: `option[${index}]`, message: '选项不是有效对象', severity: 'critical', autoFixed: true, fallbackValue: fallback });
    return { valid: false, data: fallback, errors, warnings };
  }

  const raw = option as Record<string, unknown>;

  const result: EventOption = {
    id: typeof raw.id === 'string' ? raw.id : `validated_option_${index}`,
    text: typeof raw.text === 'string' ? raw.text.slice(0, 100) : fallback.text,
    successRate: { energy: 0.5 },
    successOutcome: { description: '成功', attributeChanges: {} },
    failureOutcome: { description: '失败', attributeChanges: {} },
  };

  if (raw.successRate && typeof raw.successRate === 'object') {
    const rate = sanitizeAttributeChanges(raw.successRate as Record<string, unknown>);
    if (Object.keys(rate).length > 0) {
      result.successRate = rate;
    }
  }

  if (raw.successOutcome) {
    const successResult = validateEventOutcome(raw.successOutcome);
    result.successOutcome = successResult.data;
    errors.push(...successResult.errors);
    warnings.push(...successResult.warnings);
  }

  if (raw.failureOutcome) {
    const failureResult = validateEventOutcome(raw.failureOutcome);
    result.failureOutcome = failureResult.data;
    errors.push(...failureResult.errors);
    warnings.push(...failureResult.warnings);
  }

  return { valid: errors.filter(e => e.severity === 'critical').length === 0, data: result, errors, warnings };
}

export function validateGameEvent(event: unknown): ValidationResult<GameEvent | null> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!event || typeof event !== 'object') {
    errors.push({ field: 'event', message: '事件不是有效对象', severity: 'critical', autoFixed: false });
    return { valid: false, data: null, errors, warnings };
  }

  const raw = event as Record<string, unknown>;

  if (typeof raw.title !== 'string' || !raw.title) {
    errors.push({ field: 'title', message: '事件标题无效', severity: 'critical', autoFixed: false });
    return { valid: false, data: null, errors, warnings };
  }

  if (typeof raw.baseText !== 'string' || !raw.baseText) {
    errors.push({ field: 'baseText', message: '事件描述无效', severity: 'critical', autoFixed: false });
    return { valid: false, data: null, errors, warnings };
  }

  if (!Array.isArray(raw.options)) {
    errors.push({ field: 'options', message: '选项不是数组', severity: 'error', autoFixed: true, fallbackValue: [] });
    return { valid: false, data: null, errors, warnings };
  }

  const validatedOptions: EventOption[] = [];
  for (let i = 0; i < Math.min(raw.options.length, 3); i++) {
    const optionResult = validateEventOption(raw.options[i], i);
    validatedOptions.push(optionResult.data);
    errors.push(...optionResult.errors);
    warnings.push(...optionResult.warnings);
  }

  const result: GameEvent = {
    id: typeof raw.id === 'string' ? raw.id : `validated_event_${Date.now()}`,
    type: 'random',
    era: typeof raw.era === 'number' ? raw.era : 0,
    title: raw.title.slice(0, 50),
    baseText: raw.baseText.slice(0, 500),
    options: validatedOptions,
  };

  return { valid: true, data: result, errors, warnings };
}

export function repairJSONSyntax(raw: string): string {
  let text = raw.trim();

  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }

  text = text.replace(/^```json\s*/m, '').replace(/\s*```$/m, '');
  text = text.replace(/^```\s*/m, '').replace(/\s*```$/m, '');

  text = text.replace(/,(\s*[}\]])/g, '$1');

  text = text.replace(/'([^']*)'/g, '"$1"');

  text = text.replace(/\/\/.*$/gm, '');
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');

  return text;
}

export function safeParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      const repaired = repairJSONSyntax(raw);
      return JSON.parse(repaired) as T;
    } catch {
      return null;
    }
  }
}
