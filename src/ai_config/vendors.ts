/**
 * AI 供应商预设配置（参考 your-story 项目的 vendor 设计）
 * 每个供应商定义了默认 baseUrl、可用模型和请求格式
 */
export interface AIVendor {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  defaultModel: string;
}

export const AI_VENDORS: AIVendor[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: [],
    defaultModel: '',
  },
];

export function getVendorById(id: string): AIVendor | undefined {
  return AI_VENDORS.find((v) => v.id === id);
}

export function getVendorModels(vendorId: string): string[] {
  const vendor = getVendorById(vendorId);
  return vendor?.models ?? [];
}

export function getDefaultBaseUrl(vendorId: string): string {
  const vendor = getVendorById(vendorId);
  return vendor?.baseUrl ?? '';
}

export function getDefaultModel(vendorId: string): string {
  const vendor = getVendorById(vendorId);
  return vendor?.defaultModel ?? '';
}
