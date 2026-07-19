import type { Autobiography, Chapter } from '../../types';

export type ExportFormat = 'markdown' | 'text';

interface ExportOptions {
  format: ExportFormat;
  includeTitle?: boolean;
  includeTimeRange?: boolean;
  includeDrafts?: boolean;
  chapterIds?: string[];
}

class ExportService {
  /** 导出完整自传 */
  export(autobiography: Autobiography | null, options: ExportOptions): string {
    if (!autobiography) return '';

    const {
      format,
      includeTitle = true,
      includeTimeRange = true,
      includeDrafts = false,
      chapterIds,
    } = options;

    let chapters = autobiography.chapters;
    if (chapterIds && chapterIds.length > 0) {
      chapters = chapters.filter((ch) => chapterIds.includes(ch.id));
    }

    if (format === 'markdown') {
      return this.exportAsMarkdown(chapters, {
        title: autobiography.title,
        includeTitle,
        includeTimeRange,
        includeDrafts,
      });
    }

    return this.exportAsText(chapters, {
      title: autobiography.title,
      includeTitle,
      includeTimeRange,
      includeDrafts,
    });
  }

  /** 导出单个章节 */
  exportChapter(chapter: Chapter, format: ExportFormat, includeDrafts = false): string {
    if (format === 'markdown') {
      return this.formatChapterAsMarkdown(chapter, { includeDrafts });
    }
    return this.formatChapterAsText(chapter, { includeDrafts });
  }

  private exportAsMarkdown(
    chapters: Chapter[],
    options: { title: string; includeTitle: boolean; includeTimeRange: boolean; includeDrafts: boolean }
  ): string {
    const { title, includeTitle, includeTimeRange, includeDrafts } = options;

    const parts: string[] = [];

    if (includeTitle) {
      parts.push(`# ${title}`);
      parts.push('');
    }

    chapters.forEach((chapter) => {
      parts.push(this.formatChapterAsMarkdown(chapter, { includeTimeRange, includeDrafts }));
    });

    return parts.join('\n');
  }

  private formatChapterAsMarkdown(
    chapter: Chapter,
    options: { includeTimeRange?: boolean; includeDrafts: boolean }
  ): string {
    const { includeTimeRange = true, includeDrafts } = options;

    const parts: string[] = [];
    parts.push(`## ${chapter.title}`);

    if (includeTimeRange && chapter.timeRange) {
      parts.push(`*${chapter.timeRange}*`);
    }

    parts.push('');

    if (chapter.content) {
      parts.push(chapter.content);
    }

    if (includeDrafts && chapter.draftContent) {
      if (chapter.content) parts.push('');
      parts.push('---');
      parts.push('*草稿内容：*');
      parts.push(chapter.draftContent);
    }

    parts.push('');
    return parts.join('\n');
  }

  private exportAsText(
    chapters: Chapter[],
    options: { title: string; includeTitle: boolean; includeTimeRange: boolean; includeDrafts: boolean }
  ): string {
    const { title, includeTitle, includeTimeRange, includeDrafts } = options;

    const parts: string[] = [];

    if (includeTitle) {
      parts.push(title);
      parts.push('='.repeat(title.length));
      parts.push('');
    }

    chapters.forEach((chapter) => {
      parts.push(this.formatChapterAsText(chapter, { includeTimeRange, includeDrafts }));
    });

    return parts.join('\n');
  }

  private formatChapterAsText(
    chapter: Chapter,
    options: { includeTimeRange?: boolean; includeDrafts: boolean }
  ): string {
    const { includeTimeRange = true, includeDrafts } = options;

    const parts: string[] = [];
    parts.push(chapter.title);

    if (includeTimeRange && chapter.timeRange) {
      parts.push(`[${chapter.timeRange}]`);
    }

    parts.push('');

    if (chapter.content) {
      parts.push(chapter.content);
    }

    if (includeDrafts && chapter.draftContent) {
      if (chapter.content) parts.push('');
      parts.push('--- 草稿 ---');
      parts.push(chapter.draftContent);
    }

    parts.push('');
    return parts.join('\n');
  }

  /** 触发浏览器下载 */
  download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** 便捷的 Markdown 下载方法 */
  downloadAsMarkdown(autobiography: Autobiography | null, options?: Partial<ExportOptions>): void {
    const content = this.export(autobiography, {
      format: 'markdown',
      ...options,
    });
    const title = autobiography?.title || '我的自传';
    this.download(content, `${title}.md`, 'text/markdown;charset=utf-8');
  }

  /** 便捷的纯文本下载方法 */
  downloadAsText(autobiography: Autobiography | null, options?: Partial<ExportOptions>): void {
    const content = this.export(autobiography, {
      format: 'text',
      ...options,
    });
    const title = autobiography?.title || '我的自传';
    this.download(content, `${title}.txt`, 'text/plain;charset=utf-8');
  }
}

export default new ExportService();
