import type { NovelChapter } from '../../types/novel';

export interface ImportOptions {
  chapterSeparator: 'heading' | 'divider' | 'regex';
  customSeparator?: string;
  autoDetectChapters: boolean;
  importMetadata: boolean;
}

export interface ImportResult {
  title: string;
  chapters: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  metadata?: {
    author?: string;
    synopsis?: string;
    tags?: string[];
  };
}

const DEFAULT_OPTIONS: ImportOptions = {
  chapterSeparator: 'heading',
  autoDetectChapters: true,
  importMetadata: true,
};

const NovelImportService = {
  async parseFile(
    file: File,
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const content = await this.readFileContent(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const chapters: ImportResult['chapters'] = [];

    if (opts.autoDetectChapters) {
      const detectedChapters = this.detectChapters(content, opts);
      chapters.push(...detectedChapters);
    } else {
      chapters.push({
        title: fileName,
        content: content.trim(),
        order: 0,
      });
    }

    return {
      title: fileName,
      chapters: chapters.map((ch, idx) => ({ ...ch, order: idx })),
      metadata: opts.importMetadata ? this.extractMetadata(content) : undefined,
    };
  },

  async parseMultipleFiles(
    files: File[],
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult[]> {
    const results: ImportResult[] = [];
    for (const file of files) {
      const result = await this.parseFile(file, options);
      results.push(result);
    }
    return results;
  },

  readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取错误'));
      reader.readAsText(file, 'UTF-8');
    });
  },

  detectChapters(content: string, opts: ImportOptions): ImportResult['chapters'] {
    const chapters: ImportResult['chapters'] = [];

    let separators: RegExp[];

    switch (opts.chapterSeparator) {
      case 'heading':
        separators = [
          /^#{1,3}\s+(.+)$/gm,
          /^第[一二三四五六七八九十百千万\d]+[章回节卷篇]\s*(.*)$/gm,
          /^Chapter\s+\d+\s*[:\-]?\s*(.*)$/gim,
          /^\d+[、.]\s+(.+)$/gm,
        ];
        break;
      case 'divider':
        separators = [
          /^(---+|===+|\*{3,})\s*$/gm,
          /\n\n\n+/gm,
        ];
        break;
      case 'regex':
        separators = opts.customSeparator
          ? [new RegExp(opts.customSeparator, 'gm')]
          : [/^#{1,3}\s+(.+)$/gm];
        break;
      default:
        separators = [/^#{1,3}\s+(.+)$/gm];
    }

    let bestMatches: Array<{ index: number; title: string }> = [];

    for (const sep of separators) {
      const matches: Array<{ index: number; title: string }> = [];
      let match;
      const regex = new RegExp(sep.source, sep.flags);
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          index: match.index,
          title: match[1]?.trim() || match[0].trim(),
        });
      }
      if (matches.length > bestMatches.length) {
        bestMatches = matches;
      }
    }

    if (bestMatches.length === 0) {
      chapters.push({
        title: '全文',
        content: content.trim(),
        order: 0,
      });
    } else {
      for (let i = 0; i < bestMatches.length; i++) {
        const current = bestMatches[i];
        const next = bestMatches[i + 1];
        const chapterContent = next
          ? content.slice(current.index + current.title.length, next.index).trim()
          : content.slice(current.index + current.title.length).trim();

        if (chapterContent) {
          chapters.push({
            title: current.title,
            content: chapterContent,
            order: i,
          });
        }
      }
    }

    return chapters;
  },

  extractMetadata(content: string): NonNullable<ImportResult['metadata']> {
    const metadata: NonNullable<ImportResult['metadata']> = {};

    const authorMatch = content.match(/作者[：:]\s*(.+)/);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }

    const synopsisMatch = content.match(/(?:简介|概要|摘要|前言)[：:]\s*([\s\S]+?)(?=\n\n|\r\n\r\n|$)/);
    if (synopsisMatch) {
      metadata.synopsis = synopsisMatch[1].trim();
    }

    const tagMatch = content.match(/标签[：:]\s*(.+)/);
    if (tagMatch) {
      metadata.tags = tagMatch[1].split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
    }

    return metadata;
  },

  createChapterFromImport(importedChapter: ImportResult['chapters'][0], novelId: string): Omit<NovelChapter, 'id'> {
    return {
      novelId,
      title: importedChapter.title || '未命名章节',
      order: importedChapter.order,
      content: importedChapter.content,
      summary: '',
      status: 'draft',
      wordCount: this.calculateWordCount(importedChapter.content),
      notes: '',
      tags: [],
      annotations: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  calculateWordCount(content: string): number {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  },

  validateImportResult(result: ImportResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!result.title.trim()) {
      errors.push('标题不能为空');
    }

    if (result.chapters.length === 0) {
      errors.push('未能检测到任何章节');
    }

    for (const chapter of result.chapters) {
      if (!chapter.title.trim()) {
        errors.push(`第 ${chapter.order + 1} 章标题为空`);
      }
    }

    return { valid: errors.length === 0, errors };
  },
};

export default NovelImportService;
