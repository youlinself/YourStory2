import { PromptComposer } from '../../ai_config';
import type { Message } from '../../types';

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

const DEFAULT_CONFIG: Partial<AIServiceConfig> = {
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.7,
  maxInputTokens: 4000,
  maxOutputTokens: 2000,
};

/**
 * AI 服务（参考 your-story 项目的 AIClient 设计）
 * 支持多供应商、可配置参数、外部提示词模板
 */
class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private temperature: number;
  private maxInputTokens: number;
  private maxOutputTokens: number;

  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_CONFIG.model!;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl!).replace(/\/+$/, '');
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature!;
    this.maxInputTokens = config.maxInputTokens ?? DEFAULT_CONFIG.maxInputTokens!;
    this.maxOutputTokens = config.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens!;
  }

  async generateResponse(userInput: string, conversationHistory: Message[]): Promise<string> {
    // 检测是否为压缩指令
    const compactDirective = PromptComposer.parseCompactCommand(userInput);
    if (compactDirective !== null) {
      return this.handleCompact(conversationHistory, compactDirective);
    }

    const historyForPrompt = conversationHistory.map((msg) => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    const messages = PromptComposer.buildMessages(userInput, historyForPrompt);
    return this.sendRequest(messages);
  }

  private async handleCompact(
    conversationHistory: Message[],
    directive: string,
  ): Promise<string> {
    const historyForPrompt = conversationHistory.map((msg) => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    let systemContent = PromptComposer.getContextCompactPrompt();
    if (directive) {
      systemContent += `\n\n用户特别关注的方向：${directive}`;
    }

    const messages = PromptComposer.mergeIntoSystem(
      [
        ...historyForPrompt,
        { role: 'user' as const, content: '/compact' },
      ],
      systemContent,
    );

    return this.sendRequest(messages);
  }

  private async sendRequest(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxOutputTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI服务错误:', error);
      throw error;
    }
  }
}

export default AIService;
