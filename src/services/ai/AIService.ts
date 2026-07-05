import { PromptComposer } from '../../ai_config';
import type { Message, ChapterContext, ExtractedContent, Suggestion, Autobiography } from '../../types';

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

  async generateResponse(
    userInput: string,
    conversationHistory: Message[],
    chapterContext?: ChapterContext,
  ): Promise<string> {
    // 检测是否为压缩指令
    const compactDirective = PromptComposer.parseCompactCommand(userInput);
    if (compactDirective !== null) {
      return this.handleCompact(conversationHistory, compactDirective);
    }

    const historyForPrompt = conversationHistory.map((msg) => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    const messages = PromptComposer.buildMessages(userInput, historyForPrompt, chapterContext);
    return this.sendRequest(messages);
  }

  /** 从最近对话中提取结构化内容 */
  async extractContent(
    recentMessages: Message[],
    chapterTitle: string,
  ): Promise<ExtractedContent | null> {
    try {
      const historyForPrompt = recentMessages.slice(-6).map((msg) => ({
        role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      }));

      const messages = PromptComposer.buildExtractMessages(historyForPrompt, chapterTitle);
      const response = await this.sendRequest(messages);

      // 解析 JSON 响应
      const cleaned = response.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed.paragraphs) || parsed.paragraphs.length === 0) {
        return null;
      }

      return {
        paragraphs: parsed.paragraphs,
        timeTag: parsed.timeTag,
        emotionTags: parsed.emotionTags,
        people: parsed.people,
        status: 'pending',
      };
    } catch (error) {
      console.error('内容提取失败:', error);
      return null;
    }
  }

  /** 生成智能建议 */
  async generateSuggestions(
    autobiography: Autobiography | null,
    currentChapterId: string | null,
    recentMessages: Message[],
  ): Promise<Suggestion[]> {
    try {
      const chapters = autobiography?.chapters || [];
      const chapterInfo = this.buildChapterInfo(chapters, currentChapterId);
      const recentSummary = recentMessages
        .slice(-8)
        .map((m) => `${m.isUser ? '用户' : 'AI'}: ${m.content.slice(0, 100)}`)
        .join('\n');

      const messages = PromptComposer.buildSuggestionMessages(chapterInfo, recentSummary);
      const response = await this.sendRequest(messages);

      const cleaned = response.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Array<{ type: string; text: string }>;

      return parsed.map((item, index) => ({
        id: `suggestion-${Date.now()}-${index}`,
        text: item.text,
        type: (item.type as Suggestion['type']) || 'guide_question',
        chapterId: currentChapterId || undefined,
      }));
    } catch (error) {
      console.error('建议生成失败:', error);
      return [];
    }
  }

  /** 生成章节摘要 */
  async generateChapterSummary(
    chapterTitle: string,
    dialogueContent: string,
  ): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: '你是一位自传编辑。请将以下对话内容整理为流畅的自传章节摘要，保持第一人称视角。',
      },
      {
        role: 'user' as const,
        content: `章节：${chapterTitle}\n\n对话内容：\n${dialogueContent}\n\n请生成章节摘要：`,
      },
    ];
    return this.sendRequest(messages);
  }

  private buildChapterInfo(
    chapters: Array<{ id: string; title: string; status?: string }>,
    currentChapterId: string | null,
  ): string {
    if (chapters.length === 0) {
      return '用户还没有创建任何自传章节。';
    }

    const lines = chapters.map((ch) => {
      const statusText =
        ch.id === currentChapterId
          ? '【当前创作中】'
          : ch.status === 'completed'
            ? '【已完成】'
            : ch.status === 'draft'
              ? '【有草稿】'
              : '【未开始】';
      return `- ${ch.title} ${statusText}`;
    });

    return `自传章节列表：\n${lines.join('\n')}`;
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
