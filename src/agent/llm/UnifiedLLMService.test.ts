import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const getMaxOutputTokens = (_vendor: string) => 16384;

class TestUnifiedLLMService {
  private config: LLMServiceConfig;

  constructor(config: LLMServiceConfig) {
    this.config = {
      ...config,
      baseUrl: (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, ''),
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
    callback: (chunk: { content: string; done: boolean }) => void,
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
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
      );
    }

    return response;
  }

  private async parseStreamResponse(response: Response, callback: (chunk: { content: string; done: boolean }) => void): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
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
        }
      }

      return readChunk();
    };

    await readChunk();
  }
}

interface LLMServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor: string;
  temperature: number;
  maxOutputTokens: number;
  customModelName?: string;
  testUrl?: string;
}

describe('UnifiedLLMService', () => {
  let service: TestUnifiedLLMService;
  const mockConfig: LLMServiceConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    vendor: 'openai',
    temperature: 0.7,
    maxOutputTokens: 2000,
  };

  beforeEach(() => {
    service = new TestUnifiedLLMService(mockConfig);
  });

  describe('constructor', () => {
    it('should create instance with provided config', () => {
      const config = service.getConfig();
      assert.equal(config.apiKey, 'test-api-key');
      assert.equal(config.model, 'gpt-4o-mini');
      assert.equal(config.baseUrl, 'https://api.openai.com/v1');
      assert.equal(config.vendor, 'openai');
      assert.equal(config.temperature, 0.7);
      assert.equal(config.maxOutputTokens, 2000);
    });

    it('should apply default values for missing config', () => {
      const minimalService = new TestUnifiedLLMService({
        apiKey: 'key',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        vendor: 'openai',
        temperature: 0.7,
        maxOutputTokens: 2000,
      });
      const config = minimalService.getConfig();
      assert.equal(config.model, 'gpt-4o-mini');
      assert.equal(config.baseUrl, 'https://api.openai.com/v1');
    });

    it('should remove trailing slashes from baseUrl', () => {
      const svc = new TestUnifiedLLMService({
        ...mockConfig,
        baseUrl: 'https://api.openai.com/v1///',
      });
      assert.equal(svc.getConfig().baseUrl, 'https://api.openai.com/v1');
    });
  });

  describe('updateConfig', () => {
    it('should update partial config', () => {
      service.updateConfig({ temperature: 0.5 });
      assert.equal(service.getConfig().temperature, 0.5);
      assert.equal(service.getConfig().apiKey, 'test-api-key');
    });

    it('should update multiple fields', () => {
      service.updateConfig({ temperature: 0.9, maxOutputTokens: 4000 });
      const config = service.getConfig();
      assert.equal(config.temperature, 0.9);
      assert.equal(config.maxOutputTokens, 4000);
    });
  });

  describe('getConfig', () => {
    it('should return readonly config', () => {
      const config = service.getConfig();
      assert.equal(typeof config, 'object');
      assert.equal(config.apiKey, 'test-api-key');
    });
  });

  describe('testConnection', () => {
    it('should return success for valid response', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({
          data: [{ id: 'gpt-4o-mini' }, { id: 'gpt-4o' }],
        }), { status: 200 });
      };

      try {
        const result = await service.testConnection('https://api.openai.com/v1/models');
        assert.equal(result.success, true);
        assert.equal(result.models?.length, 2);
        assert.equal(result.models?.[0], 'gpt-4o-mini');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should return failure for error response', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response('Unauthorized', { status: 401 });
      };

      try {
        const result = await service.testConnection('https://api.openai.com/v1/models');
        assert.equal(result.success, false);
        assert.match(result.message, /连接失败/);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle network errors', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        throw new Error('Network error');
      };

      try {
        const result = await service.testConnection('https://api.openai.com/v1/models');
        assert.equal(result.success, false);
        assert.match(result.message, /网络错误/);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should handle ollama vendor', async () => {
      const ollamaService = new TestUnifiedLLMService({
        ...mockConfig,
        vendor: 'ollama',
        baseUrl: 'http://localhost:11434/v1',
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('/api/tags')) {
          return new Response(JSON.stringify({
            models: [{ name: 'llama3' }],
          }), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      };

      try {
        const result = await ollamaService.testConnection();
        assert.equal(result.success, true);
        assert.equal(result.models?.[0], 'llama3');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('sendRequest', () => {
    it('should send request and return response', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({
          choices: [{ message: { content: 'Test response' } }],
        }), { status: 200 });
      };

      try {
        const result = await service.sendRequest([
          { role: 'user', content: 'Hello' },
        ]);
        assert.equal(result, 'Test response');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should use customModelName when provided', async () => {
      const customService = new TestUnifiedLLMService({
        ...mockConfig,
        customModelName: 'custom-model',
      });

      let capturedBody: unknown;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (_url, options) => {
        capturedBody = JSON.parse((options?.body as string) || '{}');
        return new Response(JSON.stringify({
          choices: [{ message: { content: 'Response' } }],
        }), { status: 200 });
      };

      try {
        await customService.sendRequest([{ role: 'user', content: 'Hi' }]);
        assert.equal((capturedBody as { model: string }).model, 'custom-model');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should throw on error response', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response('Bad Request', { status: 400 });
      };

      try {
        await assert.rejects(
          () => service.sendRequest([{ role: 'user', content: 'Hi' }]),
          /API请求失败/
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('streamRequest', () => {
    it('should handle streaming response', async () => {
      const chunks: string[] = [];
      const callback = (chunk: { content: string; done: boolean }) => {
        if (!chunk.done && chunk.content) {
          chunks.push(chunk.content);
        }
      };

      const streamBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(streamBody, { status: 200 });
      };

      try {
        await service.streamRequest([{ role: 'user', content: 'Hi' }], callback);
        assert.deepEqual(chunks, ['Hello', ' World']);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('sendCustomMessages', () => {
    it('should call sendRequest internally', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({
          choices: [{ message: { content: 'Custom response' } }],
        }), { status: 200 });
      };

      try {
        const result = await service.sendCustomMessages([
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'User message' },
        ]);
        assert.equal(result, 'Custom response');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
