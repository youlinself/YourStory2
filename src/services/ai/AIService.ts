import { PromptComposer, getMaxOutputTokens } from '../../ai_config';
import type { Message, ChapterContext, ExtractedContent, Suggestion, Autobiography } from '../../types';

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export type StreamCallback = (chunk: StreamChunk) => void;

const DEFAULT_CONFIG: Partial<AIServiceConfig> = {
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.7,
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
  private vendor: string;
  private temperature: number;
  private maxOutputTokens: number;

  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_CONFIG.model!;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl!).replace(/\/+$/, '');
    this.vendor = config.vendor || 'openai';
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature!;
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

  /** 生成欢迎引导内容 */
  async generateWelcomeGuide(
    autobiography: Autobiography | null,
    chapterId: string | null,
  ): Promise<{ welcome: string; guide: string; starters: string[]; tips: string } | null> {
    try {
      // 构建自传状态描述
      let autobiographyStatus = '空白自传，用户还没有开始创建任何内容';
      if (autobiography && autobiography.chapters.length > 0) {
        const total = autobiography.chapters.length;
        const completed = autobiography.chapters.filter(ch => ch.status === 'completed').length;
        const draft = autobiography.chapters.filter(ch => ch.status === 'draft').length;
        autobiographyStatus = `已有${total}个章节，其中${completed}个已完成，${draft}个有草稿`;
      }

      // 构建章节信息
      let chapterInfo: string | undefined;
      if (chapterId && autobiography) {
        const chapter = autobiography.chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          chapterInfo = `章节标题：${chapter.title}`;
          if (chapter.timeRange) {
            chapterInfo += `，时间范围：${chapter.timeRange}`;
          }
          if (chapter.content) {
            chapterInfo += `，已有内容：${chapter.content.slice(0, 200)}...`;
          } else if (chapter.draftContent) {
            chapterInfo += `，有草稿内容`;
          } else {
            chapterInfo += `，尚无内容`;
          }
        }
      }

      const messages = PromptComposer.buildWelcomeGuideMessages(autobiographyStatus, chapterInfo);
      const response = await this.sendRequest(messages);

      // 解析JSON响应
      const cleaned = response.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        welcome: parsed.welcome || '您好！',
        guide: parsed.guide || '',
        starters: Array.isArray(parsed.starters) ? parsed.starters.slice(0, 3) : [],
        tips: parsed.tips || '',
      };
    } catch (error) {
      console.error('生成欢迎引导失败:', error);
      return null;
    }
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
    // 根据供应商限制 clamp max_tokens，防止 API 返回 400
    const vendorLimit = getMaxOutputTokens(this.vendor);
    const maxTokens = Math.min(this.maxOutputTokens, vendorLimit);

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
          max_tokens: maxTokens,
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

  /** 流式生成响应（SSE） */
  async generateStreamingResponse(
    userInput: string,
    conversationHistory: Message[],
    callback: StreamCallback,
    chapterContext?: ChapterContext,
  ): Promise<void> {
    const compactDirective = PromptComposer.parseCompactCommand(userInput);
    if (compactDirective !== null) {
      const result = await this.handleCompact(conversationHistory, compactDirective);
      callback({ content: result, done: true });
      return;
    }

    const historyForPrompt = conversationHistory.map((msg) => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    const messages = PromptComposer.buildMessages(userInput, historyForPrompt, chapterContext);
    const vendorLimit = getMaxOutputTokens(this.vendor);
    const maxTokens = Math.min(this.maxOutputTokens, vendorLimit);

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
          max_tokens: maxTokens,
          temperature: this.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
        );
      }

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
            // 忽略解析错误的 chunk
          }
        }

        return readChunk();
      };

      await readChunk();
    } catch (error) {
      console.error('AI流式响应错误:', error);
      throw error;
    }
  }

  /**
   * 智能合并提取内容到章节草稿
   * @param existingContent 当前章节已有的草稿内容
   * @param newExtracts 新提取的内容段落数组
   * @param chapterContext 章节上下文信息
   * @returns 合并后的完整章节草稿
   */
  async mergeExtractedContent(
    existingContent: string,
    newExtracts: string[],
    chapterContext?: ChapterContext,
  ): Promise<string> {
    const messages = PromptComposer.buildMergeMessages(existingContent, newExtracts, chapterContext);
    return this.sendRequest(messages);
  }

  /**
   * 检查自传各章节的写作风格一致性
   * @param chapters 章节内容数组
   * @returns JSON格式的分析结果
   */
  async checkStyleConsistency(
    chapters: Array<{ title: string; timeRange?: string; content: string }>,
  ): Promise<{
    overall_consistency: number;
    issues: Array<{
      chapter: string;
      type: string;
      description: string;
      suggestion: string;
      examples: string[];
    }>;
    suggestions: string[];
  }> {
    const messages = PromptComposer.buildStyleCheckMessages(chapters);
    const response = await this.sendRequest(messages);

    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // 如果无法解析，返回默认结构
      return {
        overall_consistency: 0.5,
        issues: [],
        suggestions: ['无法解析分析结果，请重试'],
      };
    } catch {
      return {
        overall_consistency: 0.5,
        issues: [],
        suggestions: ['分析失败，请稍后重试'],
      };
    }
  }

  /**
   * 自动整理时间线
   * @param chapters 章节列表
   * @returns JSON格式的整理结果
   */
  async organizeTimeline(
    chapters: Array<{ id: string; title: string; timeRange?: string; content?: string }>,
  ): Promise<{
    sortedChapters: Array<{
      id: string;
      title: string;
      timeRange: string;
      startYear: number;
      endYear: number;
      order: number;
    }>;
    gaps: Array<{
      period: string;
      description: string;
      suggestedTitle: string;
    }>;
    conflicts: Array<{
      chapterId: string;
      issue: string;
      suggestion: string;
    }>;
  }> {
    const messages = PromptComposer.buildTimelineMessages(chapters);
    const response = await this.sendRequest(messages);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        sortedChapters: chapters.map((ch, i) => ({
          id: ch.id,
          title: ch.title,
          timeRange: ch.timeRange || '',
          startYear: 0,
          endYear: 0,
          order: i + 1,
        })),
        gaps: [],
        conflicts: [],
      };
    } catch {
      return {
        sortedChapters: [],
        gaps: [],
        conflicts: [],
      };
    }
  }
}

export default AIService;
