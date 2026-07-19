import SYSTEM_PROMPT from './prompts/system_prompt.md?raw';
import JSON_OUTPUT_RULES from './prompts/json_output_rules.md?raw';
import CONTEXT_COMPACT from './prompts/context_compact.md?raw';
import CONTENT_EXTRACT from './prompts/content_extract.md?raw';
import SUGGESTION_GEN from './prompts/suggestion_gen.md?raw';
import WELCOME_GUIDE from './prompts/welcome_guide.md?raw';
import CONTENT_MERGE from './prompts/content_merge.md?raw';
import STYLE_CHECK from './prompts/style_check.md?raw';
import TIMELINE_ORGANIZE from './prompts/timeline_organize.md?raw';
import type { ChapterContext } from '../types';

/**
 * AI 提示词组装工具（参考 your-story 项目的 AiPromptComposer 设计）
 * 负责从配置文件加载提示词、合并 system 消息
 */
export const PromptComposer = {
  /** 获取自传助手主系统提示词 */
  getSystemPrompt(): string {
    return SYSTEM_PROMPT.trim();
  },

  /** 获取 JSON 输出规范 */
  getJsonOutputRules(): string {
    return JSON_OUTPUT_RULES.trim();
  },

  /** 获取上下文压缩提示词 */
  getContextCompactPrompt(): string {
    return CONTEXT_COMPACT.trim();
  },

  /** 获取内容提取提示词 */
  getContentExtractPrompt(): string {
    return CONTENT_EXTRACT.trim();
  },

  /** 获取建议词生成提示词 */
  getSuggestionGenPrompt(): string {
    return SUGGESTION_GEN.trim();
  },

  /** 获取欢迎引导提示词 */
  getWelcomeGuidePrompt(): string {
    return WELCOME_GUIDE.trim();
  },

  /** 将 JSON 输出规范拼接到 system 消息前面 */
  prependJsonRulesToSystem(systemContent: string): string {
    const rules = this.getJsonOutputRules();
    if (!rules) return systemContent;
    if (!systemContent) return rules;
    return `${rules}\n\n---\n\n${systemContent}`;
  },

  /** 将片段合并到已有 messages 数组的 system 消息中 */
  mergeIntoSystem(
    messages: Array<{ role: string; content: string }>,
    fragment: string,
  ): Array<{ role: string; content: string }> {
    const piece = fragment.trim();
    if (!piece) return [...messages];

    const out: Array<{ role: string; content: string }> = [];
    let merged = false;

    for (const msg of messages) {
      if (msg.role === 'system' && !merged) {
        merged = true;
        const existing = msg.content.trim();
        const combined = existing ? `${existing}\n\n---\n\n${piece}` : piece;
        out.push({ role: 'system', content: combined });
      } else {
        out.push({ ...msg });
      }
    }

    if (!merged) {
      out.unshift({ role: 'system', content: piece });
    }
    return out;
  },

  /**
   * 构建完整的消息数组（组装 system + 历史 + 用户输入）
   * @param userInput 用户当前输入
   * @param conversationHistory 对话历史
   * @param chapterContext 章节上下文（可选，用于章节关联对话）
   * @param stage 当前对话阶段描述（可选）
   */
  buildMessages(
    userInput: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    chapterContext?: ChapterContext,
    stage?: string,
  ): Array<{ role: string; content: string }> {
    let systemContent = this.getSystemPrompt();

    if (chapterContext) {
      systemContent += `\n\n## 当前章节上下文\n- 章节标题：${chapterContext.chapterTitle}`;
      if (chapterContext.timeRange) {
        systemContent += `\n- 时间范围：${chapterContext.timeRange}`;
      }
      if (chapterContext.existingContent) {
        systemContent += `\n- 已有内容：\n${chapterContext.existingContent}`;
      }
    }

    if (stage) {
      systemContent += `\n\n当前对话阶段：${stage}`;
    }

    return [
      { role: 'system', content: systemContent },
      ...conversationHistory,
      { role: 'user', content: userInput },
    ];
  },

  /**
   * 构建内容提取的消息数组
   * @param recentMessages 最近的对话记录
   * @param chapterTitle 章节标题
   */
  buildExtractMessages(
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
    chapterTitle: string,
  ): Array<{ role: string; content: string }> {
    const systemContent = this.prependJsonRulesToSystem(this.getContentExtractPrompt());
    return [
      { role: 'system', content: systemContent },
      ...recentMessages,
      {
        role: 'user',
        content: `请从以上对话中提取可用于自传写作的内容。当前章节：「${chapterTitle}」`,
      },
    ];
  },

  /**
   * 构建建议词生成的消息数组
   * @param chapterInfo 章节信息描述
   * @param recentSummary 最近对话摘要
   */
  buildSuggestionMessages(
    chapterInfo: string,
    recentSummary: string,
  ): Array<{ role: string; content: string }> {
    const systemContent = this.prependJsonRulesToSystem(this.getSuggestionGenPrompt());
    return [
      { role: 'system', content: systemContent },
      {
        role: 'user',
        content: `${chapterInfo}\n\n最近对话内容：\n${recentSummary}`,
      },
    ];
  },

  /**
   * 构建欢迎引导的消息数组
   * @param autobiographyStatus 自传状态描述
   * @param chapterInfo 当前章节信息（如果有）
   */
  buildWelcomeGuideMessages(
    autobiographyStatus: string,
    chapterInfo?: string,
  ): Array<{ role: string; content: string }> {
    const systemContent = this.prependJsonRulesToSystem(this.getWelcomeGuidePrompt());
    let userContent = `用户的自传状态：${autobiographyStatus}`;
    if (chapterInfo) {
      userContent += `\n\n当前章节信息：${chapterInfo}`;
    }
    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ];
  },

  /**
   * 检测是否为压缩指令
   * @returns 如果是 /compact 指令，返回关注指令文本；否则返回 null
   */
  parseCompactCommand(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/compact')) return null;
    const directive = trimmed.slice('/compact'.length).trim();
    return directive || null;
  },

  /**
   * 获取内容合并提示词
   */
  getMergePrompt(): string {
    return CONTENT_MERGE;
  },

  /**
   * 构建内容合并的消息数组
   * @param existingContent 当前章节已有的草稿内容
   * @param newExtracts 新提取的内容段落数组
   * @param chapterContext 章节上下文信息
   */
  buildMergeMessages(
    existingContent: string,
    newExtracts: string[],
    chapterContext?: ChapterContext,
  ): Array<{ role: string; content: string }> {
    const systemContent = `${SYSTEM_PROMPT}\n\n${this.getMergePrompt()}`;

    const parts: string[] = [];

    if (chapterContext) {
      parts.push(`当前章节：${chapterContext.chapterTitle}`);
      if (chapterContext.timeRange) {
        parts.push(`时间范围：${chapterContext.timeRange}`);
      }
      parts.push('');
    }

    parts.push('## 当前草稿内容');
    parts.push(existingContent || '（暂无内容）');
    parts.push('');

    parts.push('## 新提取的内容（共' + newExtracts.length + '段）');
    newExtracts.forEach((extract, index) => {
      parts.push(`\n### 第${index + 1}段提取内容`);
      parts.push(extract);
    });

    parts.push('\n\n请将上述内容合并为一个连贯的章节草稿：');

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: parts.join('\n') },
    ];
  },

  /**
   * 获取风格检查提示词
   */
  getStyleCheckPrompt(): string {
    return STYLE_CHECK;
  },

  /**
   * 构建风格检查的消息数组
   * @param chapters 章节内容数组（标题+内容）
   */
  buildStyleCheckMessages(
    chapters: Array<{ title: string; timeRange?: string; content: string }>,
  ): Array<{ role: string; content: string }> {
    const systemContent = `${SYSTEM_PROMPT}\n\n${this.getStyleCheckPrompt()}`;

    const parts: string[] = ['请检查以下自传章节的写作风格一致性：\n'];

    chapters.forEach((chapter, index) => {
      parts.push(`## 章节 ${index + 1}：${chapter.title}`);
      if (chapter.timeRange) {
        parts.push(`*时间范围：${chapter.timeRange}*`);
      }
      parts.push('');
      parts.push(chapter.content);
      parts.push('');
    });

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: parts.join('\n') },
    ];
  },

  /**
   * 获取时间线整理提示词
   */
  getTimelinePrompt(): string {
    return TIMELINE_ORGANIZE;
  },

  /**
   * 构建时间线整理的消息数组
   * @param chapters 章节列表（标题、时间范围、内容摘要）
   */
  buildTimelineMessages(
    chapters: Array<{ id: string; title: string; timeRange?: string; content?: string }>,
  ): Array<{ role: string; content: string }> {
    const systemContent = `${SYSTEM_PROMPT}\n\n${this.getTimelinePrompt()}`;

    const parts: string[] = ['请根据以下章节信息，按时间顺序整理自传章节：\n'];

    chapters.forEach((chapter, index) => {
      parts.push(`## 章节 ${index + 1}`);
      parts.push(`ID: ${chapter.id}`);
      parts.push(`标题: ${chapter.title}`);
      if (chapter.timeRange) {
        parts.push(`时间范围: ${chapter.timeRange}`);
      }
      if (chapter.content) {
        const summary = chapter.content.slice(0, 200);
        parts.push(`内容摘要: ${summary}${chapter.content.length > 200 ? '...' : ''}`);
      }
      parts.push('');
    });

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: parts.join('\n') },
    ];
  },
};

export default PromptComposer;
