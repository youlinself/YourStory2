import { getMaxOutputTokens } from '../../ai_config';
import { LLMError, LLMErrorCode } from '../errors';
import { getLogger } from '../logging';

const logger = getLogger();

export interface LLMServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor: string;
  temperature: number;
  maxOutputTokens: number;
  customModelName?: string;
  testUrl?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export type StreamCallback = (chunk: StreamChunk) => void;

const DEFAULT_CONFIG: Partial<LLMServiceConfig> = {
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.7,
  maxOutputTokens: 2000,
};

export class UnifiedLLMService {
  private config: LLMServiceConfig;

  constructor(config: LLMServiceConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      baseUrl: (config.baseUrl || DEFAULT_CONFIG.baseUrl!).replace(/\/+$/, ''),
    };
  }

  updateConfig(partial: Partial<LLMServiceConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getConfig(): Readonly<LLMServiceConfig> {
    return this.config;
  }

  async testConnection(testUrl?: string): Promise<{ success: boolean; message: string; models?: string[] }> {
    const url = testUrl || this.config.testUrl || this.getDefaultTestUrl();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.vendor !== 'ollama' && this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          message: `连接失败: HTTP ${response.status}${errorText ? ` - ${errorText.slice(0, 100)}` : ''}`,
        };
      }

      try {
        const data = await response.json();
        const models = this.extractModels(data);
        return {
          success: true,
          message: models.length > 0 ? `连接成功！发现 ${models.length} 个模型` : '连接成功！',
          models: models.length > 0 ? models : undefined,
        };
      } catch {
        return {
          success: true,
          message: '连接成功！',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `网络错误: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async sendRequest(
    messages: Array<{ role: string; content: string }>,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const vendorLimit = getMaxOutputTokens(this.config.vendor);
    const maxTokens = Math.min(
      options?.maxTokens ?? this.config.maxOutputTokens,
      vendorLimit,
    );
    const activeModel = this.config.customModelName || this.config.model;

    const response = await this.makeRequest({
      model: activeModel,
      messages,
      max_tokens: maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async streamRequest(
    messages: Array<{ role: string; content: string }>,
    callback: StreamCallback,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<void> {
    const vendorLimit = getMaxOutputTokens(this.config.vendor);
    const maxTokens = Math.min(
      options?.maxTokens ?? this.config.maxOutputTokens,
      vendorLimit,
    );
    const activeModel = this.config.customModelName || this.config.model;

    const response = await this.makeRequest({
      model: activeModel,
      messages,
      max_tokens: maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      stream: true,
    });

    await this.parseStreamResponse(response, callback);
  }

  async sendCustomMessages(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    return this.sendRequest(messages);
  }

  private getDefaultTestUrl(): string {
    if (this.config.vendor === 'ollama') {
      return `${this.config.baseUrl.replace(/\/v1$/, '')}/api/tags`;
    }
    return `${this.config.baseUrl}/models`;
  }

  private extractModels(data: unknown): string[] {
    if (!data || typeof data !== 'object') return [];

    if ('data' in data && Array.isArray((data as { data: unknown[] }).data)) {
      return (data as { data: Array<{ id?: string }> }).data
        .map((item) => item.id)
        .filter((id): id is string => !!id);
    }

    if ('models' in data && Array.isArray((data as { models: unknown[] }).models)) {
      return (data as { models: Array<{ name?: string; model?: string }> }).models
        .map((item) => item.name || item.model)
        .filter((name): name is string => !!name);
    }

    return [];
  }

  private async makeRequest(body: unknown): Promise<Response> {
    const url = `${this.config.baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.error('LLMService', `API request failed: ${response.status}`, new Error(errorText), {
          statusCode: response.status,
          url,
        });

        const errorCode = this.getErrorCodeFromStatus(response.status);
        throw new LLMError(
          errorCode,
          `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
          { statusCode: response.status },
        );
      }

      return response;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      logger.error('LLMService', 'API request error', error instanceof Error ? error : new Error(String(error)));
      throw new LLMError(
        LLMErrorCode.API_CONNECTION_ERROR,
        `网络错误: ${error instanceof Error ? error.message : '未知错误'}`,
        { cause: error instanceof Error ? error : undefined },
      );
    }
  }

  private getErrorCodeFromStatus(status: number): LLMErrorCode {
    switch (status) {
      case 401:
      case 403:
        return LLMErrorCode.API_AUTH_FAILED;
      case 429:
        return LLMErrorCode.API_RATE_LIMITED;
      case 408:
        return LLMErrorCode.API_TIMEOUT;
      default:
        return LLMErrorCode.API_REQUEST_FAILED;
    }
  }

  private async parseStreamResponse(response: Response, callback: StreamCallback): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError(LLMErrorCode.STREAM_READ_ERROR, '无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const readChunk = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        callback({ content: '', done: true });
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          callback({ content: '', done: true });
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            callback({ content, done: false });
          }
        } catch {
          // 忽略解析错误的 chunk
        }
      }

      return readChunk();
    };

    await readChunk();
  }
}
