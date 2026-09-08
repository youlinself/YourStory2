import NovelFileLibraryService, {
  NovelMetadata,
  ChapterIndex,
  NovelSearchIndex,
} from '../storage/NovelFileLibraryService';
import type { NovelChapter, Character, WorldBuilding } from '../../types/novel';

export interface AIContextPrompt {
  systemContext: string;
  recentContent: string;
  characterSummary: string;
  worldBuildingSummary: string;
  plotSummary: string;
  styleGuide: string;
}

export interface NovelSummaryForAI {
  novelInfo: {
    title: string;
    genre: string;
    synopsis: string;
    totalWords: number;
    chapterCount: number;
    progress: number;
  };
  currentChapter: {
    title: string;
    content: string;
    wordCount: number;
  } | null;
  previousChapters: Array<{
    title: string;
    summary: string;
    keyEvents: string[];
  }>;
  mainCharacters: Array<{
    name: string;
    role: string;
    personality: string;
    currentStatus: string;
  }>;
  worldBuilding: {
    setting: string;
    era: string;
    location: string;
    magicSystem: string;
    factions: string[];
  } | null;
  ongoingPlots: string[];
  recentDevelopments: string[];
}

export interface StyleAnalysis {
  tone: string;
  pacing: string;
  dialogueStyle: string;
  descriptionDensity: string;
  sentenceStructure: string;
  vocabularyLevel: string;
  samplePassages: string[];
}

class NovelAIContextService {
  private static instance: NovelAIContextService;
  private fileLibrary = NovelFileLibraryService.getInstance();

  static getInstance(): NovelAIContextService {
    if (!NovelAIContextService.instance) {
      NovelAIContextService.instance = new NovelAIContextService();
    }
    return NovelAIContextService.instance;
  }

  async getFullContextForAI(novelId: string, chapterId?: string): Promise<AIContextPrompt> {
    const context = await this.fileLibrary.getNovelContextForAI(novelId, {
      includeChapters: true,
      includeCharacters: true,
      includeWorldBuilding: true,
      chapterLimit: 10,
      characterDetailLevel: 'full',
    });

    const searchIndex = await this.fileLibrary.loadSearchIndex(novelId);
    const recentChapters = await this.getRecentChaptersContent(novelId, 3);

    return {
      systemContext: this.buildSystemContext(context.metadata, searchIndex),
      recentContent: this.buildRecentContent(recentChapters),
      characterSummary: this.buildCharacterSummary(context.characters),
      worldBuildingSummary: this.buildWorldBuildingSummary(context.worldBuilding),
      plotSummary: this.buildPlotSummary(context.chapters),
      styleGuide: await this.analyzeWritingStyle(novelId),
    };
  }

  async getNovelSummary(novelId: string): Promise<NovelSummaryForAI> {
    const context = await this.fileLibrary.getNovelContextForAI(novelId, {
      includeChapters: true,
      includeCharacters: true,
      includeWorldBuilding: true,
      chapterLimit: 50,
      characterDetailLevel: 'brief',
    });

    const searchIndex = await this.fileLibrary.loadSearchIndex(novelId);
    const recentChapters = await this.getRecentChaptersContent(novelId, 3);

    const mainCharacters = context.characters.slice(0, 10).map((c) => ({
      name: c.name,
      role: c.role,
      personality: c.personality,
      currentStatus: '活跃',
    }));

    const previousChapters = context.chapters.slice(-10).map((ch) => ({
      title: ch.title,
      summary: ch.summary || '暂无摘要',
      keyEvents: this.extractKeyEvents(ch.summary),
    }));

    const recentDevelopments = recentChapters.map((ch) => {
      const preview = ch.content.slice(0, 200);
      return `《${ch.title}》: ${preview}`;
    });

    return {
      novelInfo: {
        title: context.metadata?.title || '未知',
        genre: context.metadata?.genre || '未知',
        synopsis: context.metadata?.synopsis || '暂无简介',
        totalWords: context.metadata?.currentWordCount || 0,
        chapterCount: context.metadata?.chapterCount || 0,
        progress: context.metadata?.progress || 0,
      },
      currentChapter: recentChapters.length > 0
        ? {
            title: recentChapters[0].title,
            content: recentChapters[0].content,
            wordCount: recentChapters[0].content.length,
          }
        : null,
      previousChapters,
      mainCharacters,
      worldBuilding: context.worldBuilding
        ? {
            setting: context.worldBuilding.setting,
            era: context.worldBuilding.era,
            location: context.worldBuilding.location,
            magicSystem: context.worldBuilding.magicSystem,
            factions: context.worldBuilding.factions,
          }
        : null,
      ongoingPlots: this.inferOngoingPlots(context.chapters),
      recentDevelopments,
    };
  }

  async searchAndContextualize(novelId: string, query: string): Promise<{
    relevantChapters: Array<{ title: string; content: string; relevance: string }>;
    relevantCharacters: Array<{ name: string; info: string }>;
    context: string;
  }> {
    const searchResults = await this.fileLibrary.searchInNovel(novelId, query);

    const relevantChapters: Array<{ title: string; content: string; relevance: string }> = [];
    for (const result of searchResults.chapters.slice(0, 5)) {
      const chapter = await this.fileLibrary.loadChapter(novelId, result.chapterId);
      if (chapter) {
        relevantChapters.push({
          title: chapter.title,
          content: chapter.content,
          relevance: result.matches.join('; '),
        });
      }
    }

    const relevantCharacters: Array<{ name: string; info: string }> = [];
    for (const charResult of searchResults.characters.slice(0, 5)) {
      const character = await this.fileLibrary.loadCharacter(novelId, charResult.characterId);
      if (character) {
        relevantCharacters.push({
          name: character.name,
          info: `${character.role} - ${character.personality}`,
        });
      }
    }

    const contextParts: string[] = [];
    if (relevantChapters.length > 0) {
      contextParts.push('相关章节内容:');
      relevantChapters.forEach((ch) => {
        contextParts.push(`\n--- ${ch.title} ---\n${ch.content.slice(0, 1000)}`);
      });
    }
    if (relevantCharacters.length > 0) {
      contextParts.push('\n相关角色:');
      relevantCharacters.forEach((char) => {
        contextParts.push(`- ${char.name}: ${char.info}`);
      });
    }

    return {
      relevantChapters,
      relevantCharacters,
      context: contextParts.join('\n'),
    };
  }

  async analyzeWritingStyle(novelId: string): Promise<string> {
    const recentChapters = await this.getRecentChaptersContent(novelId, 5);
    if (recentChapters.length === 0) {
      return '暂无足够内容分析写作风格';
    }

    const combinedContent = recentChapters.map((ch) => ch.content).join('\n\n');
    const sampleSize = Math.min(5000, combinedContent.length);
    const sample = combinedContent.slice(0, sampleSize);

    const dialogueCount = (sample.match(/[""]/g) || []).length;
    const dialogueRatio = dialogueCount / sample.length;

    const avgSentenceLength = this.calculateAvgSentenceLength(sample);
    const paragraphCount = (sample.match(/\n\n/g) || []).length;
    const avgParagraphLength = sample.length / Math.max(paragraphCount, 1);

    const descriptiveWords = (sample.match(/[美丽明净清幽繁华萧瑟磅礴婉约]/g) || []).length;
    const descriptiveRatio = descriptiveWords / sample.length;

    const styleObservations: string[] = [];

    if (dialogueRatio > 0.1) {
      styleObservations.push('对话驱动型叙事，角色互动频繁');
    } else if (dialogueRatio > 0.05) {
      styleObservations.push('对话与叙述平衡');
    } else {
      styleObservations.push('叙述为主，对话较少');
    }

    if (avgSentenceLength < 20) {
      styleObservations.push('句式简洁明快，节奏紧凑');
    } else if (avgSentenceLength < 40) {
      styleObservations.push('句式适中，叙述流畅');
    } else {
      styleObservations.push('句式较长，描写细腻');
    }

    if (descriptiveRatio > 0.02) {
      styleObservations.push('注重环境氛围描写');
    }

    return `写作风格分析:\n${styleObservations.map((o) => `- ${o}`).join('\n')}\n\n示例段落:\n${sample.slice(0, 500)}`;
  }

  async generateChapterOutline(novelId: string, chapterCount: number = 5): Promise<Array<{
    title: string;
    summary: string;
    keyEvents: string[];
    involvedCharacters: string[];
  }>> {
    const context = await this.getNovelSummary(novelId);
    const lastChapters = context.previousChapters.slice(-3);

    const outline: Array<{
      title: string;
      summary: string;
      keyEvents: string[];
      involvedCharacters: string[];
    }> = [];

    for (let i = 0; i < chapterCount; i++) {
      outline.push({
        title: `第${context.novelInfo.chapterCount + i + 1}章`,
        summary: '待规划情节',
        keyEvents: [],
        involvedCharacters: context.mainCharacters.slice(0, 3).map((c) => c.name),
      });
    }

    return outline;
  }

  async checkConsistency(novelId: string): Promise<{
    issues: string[];
    suggestions: string[];
  }> {
    const context = await this.fileLibrary.getNovelContextForAI(novelId, {
      includeChapters: true,
      includeCharacters: true,
      includeWorldBuilding: true,
      chapterLimit: 20,
      characterDetailLevel: 'full',
    });

    const issues: string[] = [];
    const suggestions: string[] = [];

    const characterAppearances = new Map<string, number[]>();
    for (const chapter of context.recentChapters) {
      const content = chapter.content;
      for (const char of context.characters) {
        if (content.includes(char.name)) {
          const appearances = characterAppearances.get(char.name) || [];
          appearances.push(chapter.title === context.recentChapters[context.recentChapters.length - 1]?.title ? context.recentChapters.length : 0);
          characterAppearances.set(char.name, appearances);
        }
      }
    }

    for (const char of context.characters) {
      if (char.role === 'protagonist') {
        const appearances = characterAppearances.get(char.name) || [];
        if (appearances.length === 0 && context.recentChapters.length > 2) {
          issues.push(`主角「${char.name}」在最近的章节中未出现`);
          suggestions.push(`考虑在后续章节中增加「${char.name}」的戏份`);
        }
      }
    }

    if (context.worldBuilding) {
      const { factions, rules } = context.worldBuilding;
      if (factions.length > 5) {
        suggestions.push(`当前设定了${factions.length}个势力，建议确保每个势力都有明确的定位和作用`);
      }
      if (rules.length === 0) {
        suggestions.push('建议补充世界规则设定，增强世界观的逻辑性');
      }
    }

    return { issues, suggestions };
  }

  async getTimelineForAI(novelId: string): Promise<{
    chapters: Array<{
      title: string;
      order: number;
      status: string;
      summary: string;
      characters: string[];
    }>;
    characterArcs: Array<{
      characterName: string;
      appearances: string[];
    }>;
  }> {
    const searchIndex = await this.fileLibrary.loadSearchIndex(novelId);
    const context = await this.fileLibrary.getNovelContextForAI(novelId, {
      includeChapters: true,
      includeCharacters: false,
      includeWorldBuilding: false,
      chapterLimit: 100,
    });

    const chapters = (searchIndex?.chapters || []).map((ch) => ({
      title: ch.title,
      order: ch.order,
      status: ch.status,
      summary: ch.summary || '暂无摘要',
      characters: ch.characters || [],
    }));

    const characterAppearances = new Map<string, string[]>();
    for (const ch of chapters) {
      for (const charName of ch.characters) {
        const appearances = characterAppearances.get(charName) || [];
        if (!appearances.includes(ch.title)) {
          appearances.push(ch.title);
        }
        characterAppearances.set(charName, appearances);
      }
    }

    const characterArcs = Array.from(characterAppearances.entries())
      .map(([name, appearances]) => ({
        characterName: name,
        appearances,
      }))
      .sort((a, b) => b.appearances.length - a.appearances.length);

    return { chapters, characterArcs };
  }

  private async getRecentChaptersContent(novelId: string, count: number): Promise<Array<{ title: string; content: string }>> {
    const context = await this.fileLibrary.getNovelContextForAI(novelId, {
      includeChapters: false,
      includeCharacters: false,
      includeWorldBuilding: false,
    });

    const searchIndex = await this.fileLibrary.loadSearchIndex(novelId);
    if (!searchIndex) return [];

    const sortedChapters = [...searchIndex.chapters].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const recentChapters: Array<{ title: string; content: string }> = [];
    for (const ch of sortedChapters.slice(0, count)) {
      const chapter = await this.fileLibrary.loadChapter(novelId, ch.id);
      if (chapter) {
        recentChapters.push({
          title: chapter.title,
          content: chapter.content,
        });
      }
    }

    return recentChapters;
  }

  private buildSystemContext(metadata: NovelMetadata | null, searchIndex: NovelSearchIndex | null): string {
    if (!metadata) return '小说元数据不可用';

    return `【小说信息】
标题: ${metadata.title}
类型: ${metadata.genre}
状态: ${metadata.status}
总字数: ${metadata.currentWordCount}
章节数: ${metadata.chapterCount}
目标字数: ${metadata.targetWordCount}
完成度: ${metadata.progress.toFixed(1)}%

【作品简介】
${metadata.synopsis}

【章节列表】
${searchIndex?.chapters.map((ch, i) => `${i + 1}. ${ch.title} (${ch.status}) - ${ch.wordCount}字`).join('\n') || '暂无章节'}

【主要角色】
${searchIndex?.characters.map((c) => `- ${c.name}${c.alias.length > 0 ? ` (${c.alias.join(', ')})` : ''}`).join('\n') || '暂无角色'}`;
  }

  private buildRecentContent(recentChapters: Array<{ title: string; content: string }>): string {
    if (recentChapters.length === 0) return '暂无最近内容';

    return recentChapters
      .map((ch) => {
        const preview = ch.content.length > 1000 ? ch.content.slice(-1000) : ch.content;
        return `--- ${ch.title} ---\n${preview}`;
      })
      .join('\n\n');
  }

  private buildCharacterSummary(characters: Array<{ name: string; role: string; personality: string; background?: string }>): string {
    if (characters.length === 0) return '暂无角色信息';

    return characters
      .map((c) => {
        let summary = `- ${c.name} (${c.role}): ${c.personality}`;
        if (c.background) {
          summary += `\n  背景: ${c.background}`;
        }
        return summary;
      })
      .join('\n');
  }

  private buildWorldBuildingSummary(wb: WorldBuilding | null): string {
    if (!wb) return '暂无世界观设定';

    return `世界设定: ${wb.setting}
时代背景: ${wb.era}
主要地点: ${wb.location}
力量体系: ${wb.magicSystem || '无'}
势力组织: ${wb.factions.join(', ') || '无'}
世界规则: ${wb.rules.join('; ') || '无'}`;
  }

  private buildPlotSummary(chapters: Array<{ title: string; summary: string; status: string; wordCount: number }>): string {
    if (chapters.length === 0) return '暂无章节';

    return chapters
      .map((ch, i) => `${i + 1}. ${ch.title}: ${ch.summary || '暂无摘要'} (${ch.status})`)
      .join('\n');
  }

  private extractKeyEvents(summary: string): string[] {
    if (!summary) return [];
    return summary
      .split(/[，。；\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && s.length < 50)
      .slice(0, 5);
  }

  private inferOngoingPlots(chapters: Array<{ title: string; summary: string }>): string[] {
    if (chapters.length === 0) return [];

    const lastThree = chapters.slice(-3);
    return lastThree
      .map((ch) => ch.summary)
      .filter((s) => s && s.length > 10)
      .slice(0, 3);
  }

  private calculateAvgSentenceLength(text: string): number {
    const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    const totalLength = sentences.reduce((sum, s) => sum + s.length, 0);
    return totalLength / sentences.length;
  }
}

export default NovelAIContextService;
