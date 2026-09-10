import { PromptComposer } from '../../../ai_config';
import type { ChapterContext } from '../../../types';
import type { PromptInput, PromptTemplate } from '../PromptRegistry';
import type { PromptRegistry } from '../PromptRegistry';

export interface DialoguePromptInput extends PromptInput {
  userInput: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  chapterContext?: ChapterContext;
  stage?: string;
}

export interface ExtractPromptInput extends PromptInput {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  chapterTitle: string;
}

export interface SuggestionPromptInput extends PromptInput {
  chapterInfo: string;
  recentSummary: string;
}

export interface WelcomeGuidePromptInput extends PromptInput {
  autobiographyStatus: string;
  chapterInfo?: string;
}

export interface MergePromptInput extends PromptInput {
  existingContent: string;
  newExtracts: string[];
  chapterContext?: ChapterContext;
}

export interface StyleCheckPromptInput extends PromptInput {
  chapters: Array<{ title: string; timeRange?: string; content: string }>;
}

export interface TimelinePromptInput extends PromptInput {
  chapters: Array<{ id: string; title: string; timeRange?: string; content?: string }>;
}

const dialogueTemplate: PromptTemplate = {
  id: 'autobiography/dialogue',
  name: '自传对话',
  description: '自传创作对话引导',
  buildMessages: (input: PromptInput) => {
    const { userInput, history, chapterContext, stage } = input as DialoguePromptInput;
    return PromptComposer.buildMessages(userInput, history, chapterContext, stage);
  },
};

const extractTemplate: PromptTemplate = {
  id: 'autobiography/extract',
  name: '内容提取',
  description: '从对话中提取结构化内容',
  buildMessages: (input: PromptInput) => {
    const { history, chapterTitle } = input as ExtractPromptInput;
    return PromptComposer.buildExtractMessages(history, chapterTitle);
  },
};

const suggestionsTemplate: PromptTemplate = {
  id: 'autobiography/suggestions',
  name: '智能建议',
  description: '生成对话建议',
  buildMessages: (input: PromptInput) => {
    const { chapterInfo, recentSummary } = input as SuggestionPromptInput;
    return PromptComposer.buildSuggestionMessages(chapterInfo, recentSummary);
  },
};

const welcomeGuideTemplate: PromptTemplate = {
  id: 'autobiography/welcome_guide',
  name: '欢迎引导',
  description: '生成欢迎引导内容',
  buildMessages: (input: PromptInput) => {
    const { autobiographyStatus, chapterInfo } = input as WelcomeGuidePromptInput;
    return PromptComposer.buildWelcomeGuideMessages(autobiographyStatus, chapterInfo);
  },
};

const mergeTemplate: PromptTemplate = {
  id: 'autobiography/merge',
  name: '内容合并',
  description: '智能合并提取内容到章节草稿',
  buildMessages: (input: PromptInput) => {
    const { existingContent, newExtracts, chapterContext } = input as MergePromptInput;
    return PromptComposer.buildMergeMessages(existingContent, newExtracts, chapterContext);
  },
};

const styleCheckTemplate: PromptTemplate = {
  id: 'autobiography/style_check',
  name: '风格检查',
  description: '检查自传各章节的写作风格一致性',
  buildMessages: (input: PromptInput) => {
    const { chapters } = input as StyleCheckPromptInput;
    return PromptComposer.buildStyleCheckMessages(chapters);
  },
};

const timelineTemplate: PromptTemplate = {
  id: 'autobiography/timeline',
  name: '时间线整理',
  description: '自动整理时间线',
  buildMessages: (input: PromptInput) => {
    const { chapters } = input as TimelinePromptInput;
    return PromptComposer.buildTimelineMessages(chapters);
  },
};

export function registerAutobiographyPrompts(registry: PromptRegistry): () => void {
  const disposers = [
    registry.register(dialogueTemplate),
    registry.register(extractTemplate),
    registry.register(suggestionsTemplate),
    registry.register(welcomeGuideTemplate),
    registry.register(mergeTemplate),
    registry.register(styleCheckTemplate),
    registry.register(timelineTemplate),
  ];

  return () => disposers.forEach(d => d());
}

export function parseCompactCommand(input: string): string | null {
  return PromptComposer.parseCompactCommand(input);
}
