/**
 * AI 供应商预设配置（参考 your-story 项目的 settings_ai.gd VENDORS 常量）
 * 每个供应商定义了默认 baseUrl、模型列表 URL、认证方式、常用模型
 */
export interface AIVendor {
  id: string;
  name: string;
  baseUrl: string;
  modelsUrl: string;
  authHeader: string;
  authPrefix: string;
  models: string[];
  defaultModel: string;
  /** 该供应商支持的最大输出 token 数（API 硬限制） */
  maxOutputTokens: number;
}

export const AI_VENDORS: AIVendor[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelsUrl: 'https://api.openai.com/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    maxOutputTokens: 16384,
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    modelsUrl: 'https://api.anthropic.com/v1/models',
    authHeader: 'x-api-key',
    authPrefix: '',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
    maxOutputTokens: 8192,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    modelsUrl: 'https://api.deepseek.com/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    maxOutputTokens: 8192,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    modelsUrl: 'https://api.minimaxi.com/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['MiniMax-Text-01', 'abab6.5s-chat'],
    defaultModel: 'MiniMax-Text-01',
    maxOutputTokens: 40000,
  },
  {
    id: 'mimo',
    name: 'MiMo (小米)',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    modelsUrl: 'https://api.xiaomimimo.com/v1/models',
    authHeader: 'api-key',
    authPrefix: 'Bearer ',
    models: ['MiMo-VL-7B-RL', 'MiMo-7B-RL'],
    defaultModel: 'MiMo-VL-7B-RL',
    maxOutputTokens: 8192,
  },
  {
    id: 'qwen',
    name: '通义千问 (阿里云)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelsUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    defaultModel: 'qwen-max',
    maxOutputTokens: 8192,
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    modelsUrl: 'https://open.bigmodel.cn/api/paas/v4/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4-long', 'glm-4-air'],
    defaultModel: 'glm-4-plus',
    maxOutputTokens: 4096,
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    modelsUrl: 'https://api.moonshot.cn/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    defaultModel: 'moonshot-v1-32k',
    maxOutputTokens: 8192,
  },
  {
    id: 'doubao',
    name: '豆包 (火山引擎)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelsUrl: 'https://ark.cn-beijing.volces.com/api/v3/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['doubao-pro-32k', 'doubao-lite-32k', 'doubao-pro-128k'],
    defaultModel: 'doubao-pro-32k',
    maxOutputTokens: 4096,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    modelsUrl: 'https://api.siliconflow.cn/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'meta-llama/Meta-Llama-3.1-70B-Instruct'],
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    maxOutputTokens: 8192,
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434/v1',
    modelsUrl: 'http://localhost:11434/v1/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: ['llama3.2', 'llama3.1', 'qwen2.5', 'mistral', 'gemma2', 'phi3'],
    defaultModel: 'llama3.2',
    maxOutputTokens: 8192,
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    modelsUrl: '',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    models: [],
    defaultModel: '',
    maxOutputTokens: 4096,
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

export function getMaxOutputTokens(vendorId: string): number {
  const vendor = getVendorById(vendorId);
  return vendor?.maxOutputTokens ?? 4096;
}

/**
 * 通过供应商的 modelsUrl 拉取最新可用模型列表
 * 返回 model id 数组，连接失败时抛出错误
 */
export async function fetchVendorModels(
  vendorId: string,
  apiKey: string,
): Promise<string[]> {
  const vendor = getVendorById(vendorId);
  if (!vendor) throw new Error('未知供应商');
  if (!vendor.modelsUrl) throw new Error('该供应商不支持自动获取模型列表');

  const headers: Record<string, string> = {
    [vendor.authHeader]: `${vendor.authPrefix}${apiKey}`,
  };

  const response = await fetch(vendor.modelsUrl, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 100)}` : ''}`);
  }

  const json = await response.json();
  const data = json.data ?? json.models ?? [];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('未找到可用模型');
  }

  return data
    .map((item: { id?: string }) => item.id)
    .filter((id: string | undefined): id is string => !!id);
}
