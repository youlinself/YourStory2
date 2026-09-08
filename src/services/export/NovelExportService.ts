import type { Novel, NovelChapter, Volume } from '../../types/novel';
import { GENRE_LABELS, NOVEL_STATUS_LABELS } from '../../types/novel';

export type ExportFormat = 'markdown' | 'txt' | 'json' | 'epub' | 'submission' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  scope: 'chapter' | 'volume' | 'novel';
  chapterId?: string;
  volumeId?: string;
  includeTitle: boolean;
  includeSynopsis: boolean;
  includeToc: boolean;
  includeChapterTitle: boolean;
  includeSeparator: boolean;
  includeAuthor: boolean;
  authorName?: string;
  includeTimestamp: boolean;
  customCss?: string;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

const DEFAULT_EXPORT_OPTIONS: Partial<ExportOptions> = {
  includeTitle: true,
  includeSynopsis: true,
  includeToc: true,
  includeChapterTitle: true,
  includeSeparator: true,
  includeAuthor: false,
  includeTimestamp: false,
};

class NovelExportService {
  private static instance: NovelExportService;

  static getInstance(): NovelExportService {
    if (!NovelExportService.instance) {
      NovelExportService.instance = new NovelExportService();
    }
    return NovelExportService.instance;
  }

  async exportNovel(novel: Novel, options: ExportOptions): Promise<ExportResult> {
    const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };

    switch (mergedOptions.format) {
      case 'markdown':
        return this.exportMarkdown(novel, mergedOptions);
      case 'txt':
        return this.exportText(novel, mergedOptions);
      case 'json':
        return this.exportJson(novel, mergedOptions);
      case 'epub':
        return this.exportEpub(novel, mergedOptions);
      case 'submission':
        return this.exportSubmission(novel, mergedOptions);
      case 'html':
        return this.exportHtml(novel, mergedOptions);
      default:
        throw new Error(`不支持的导出格式: ${mergedOptions.format}`);
    }
  }

  private getChaptersToExport(novel: Novel, options: ExportOptions): NovelChapter[] {
    let chapters: NovelChapter[] = [];

    if (options.scope === 'chapter' && options.chapterId) {
      const chapter = novel.chapters.find((ch) => ch.id === options.chapterId);
      if (chapter) chapters = [chapter];
    } else if (options.scope === 'volume' && options.volumeId) {
      chapters = novel.chapters.filter((ch) => ch.volumeId === options.volumeId);
    } else {
      chapters = novel.chapters;
    }

    return chapters.sort((a, b) => a.order - b.order);
  }

  private exportMarkdown(novel: Novel, options: ExportOptions): ExportResult {
    let md = '';

    if (options.includeTitle) {
      md += `# ${novel.title}\n\n`;
    }

    if (options.includeAuthor && options.authorName) {
      md += `**作者:** ${options.authorName}\n\n`;
    }

    if (options.includeSynopsis && novel.synopsis) {
      md += `## 简介\n\n${novel.synopsis}\n\n`;
    }

    if (options.includeTimestamp) {
      md += `*导出时间: ${new Date().toLocaleString('')}*\n\n`;
    }

    const chapters = this.getChaptersToExport(novel, options);

    if (options.includeToc && chapters.length > 1) {
      md += `## 目录\n\n`;
      chapters.forEach((ch, idx) => {
        md += `${idx + 1}. [${ch.title}](#${this.slugify(ch.title)})\n`;
      });
      md += `\n---\n\n`;
    }

    chapters.forEach((chapter, idx) => {
      if (options.includeChapterTitle) {
        md += `## ${chapter.title}\n\n`;
      }
      md += `${chapter.content}\n\n`;

      if (options.includeSeparator && idx < chapters.length - 1) {
        md += `---\n\n`;
      }
    });

    return {
      content: md,
      filename: `${novel.title}.md`,
      mimeType: 'text/markdown',
    };
  }

  private exportText(novel: Novel, options: ExportOptions): ExportResult {
    let txt = '';

    if (options.includeTitle) {
      txt += `${novel.title}\n`;
      txt += `${'='.repeat(novel.title.length)}\n\n`;
    }

    if (options.includeAuthor && options.authorName) {
      txt += `作者: ${options.authorName}\n\n`;
    }

    if (options.includeSynopsis && novel.synopsis) {
      txt += `简介\n${'-'.repeat(20)}\n${novel.synopsis}\n\n`;
    }

    if (options.includeTimestamp) {
      txt += `导出时间: ${new Date().toLocaleString('')}\n\n`;
    }

    const chapters = this.getChaptersToExport(novel, options);

    if (options.includeToc && chapters.length > 1) {
      txt += `目录\n${'-'.repeat(20)}\n`;
      chapters.forEach((ch, idx) => {
        txt += `${idx + 1}. ${ch.title}\n`;
      });
      txt += `\n${'='.repeat(40)}\n\n`;
    }

    chapters.forEach((chapter, idx) => {
      if (options.includeChapterTitle) {
        txt += `${chapter.title}\n`;
        txt += `${'-'.repeat(chapter.title.length)}\n\n`;
      }
      txt += `${chapter.content}\n\n`;

      if (options.includeSeparator && idx < chapters.length - 1) {
        txt += `${'·'.repeat(30)}\n\n`;
      }
    });

    return {
      content: txt,
      filename: `${novel.title}.txt`,
      mimeType: 'text/plain',
    };
  }

  private exportJson(novel: Novel, options: ExportOptions): ExportResult {
    const chapters = this.getChaptersToExport(novel, options);

    const exportData = {
      title: novel.title,
      genre: novel.genre,
      synopsis: novel.synopsis,
      status: novel.status,
      author: options.authorName || undefined,
      exportedAt: new Date().toISOString(),
      statistics: {
        totalChapters: chapters.length,
        totalWords: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
      },
      chapters: chapters.map((ch) => ({
        title: ch.title,
        order: ch.order,
        content: ch.content,
        wordCount: ch.wordCount,
        summary: ch.summary,
        status: ch.status,
      })),
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `${novel.title}.json`,
      mimeType: 'application/json',
    };
  }

  private exportEpub(novel: Novel, options: ExportOptions): ExportResult {
    const chapters = this.getChaptersToExport(novel, options);

    const htmlChapters = chapters
      .map(
        (ch) => `
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <title>${this.escapeHtml(ch.title)}</title>
      <style>
        body { font-family: "Noto Serif SC", serif; line-height: 1.8; padding: 2em; }
        h1 { text-align: center; margin-bottom: 1em; }
        p { text-indent: 2em; margin: 0.5em 0; }
      </style>
    </head>
    <body>
      <h1>${this.escapeHtml(ch.title)}</h1>
      ${ch.content
        .split('\n\n')
        .map((p) => `<p>${this.escapeHtml(p)}</p>`)
        .join('\n      ')}
    </body>
    </html>`
      )
      .join('\n');

    const toc = chapters.map((ch, idx) => `<li><a href="chapter_${idx}.xhtml">${this.escapeHtml(ch.title)}</a></li>`).join('\n    ');

    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${this.escapeHtml(novel.title)}</dc:title>
    <dc:creator>${this.escapeHtml(options.authorName || 'Unknown')}</dc:creator>
    <dc:identifier id="bookid">${novel.id}</dc:identifier>
    <dc:language>zh-CN</dc:language>
  </metadata>
  <manifest>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${chapters.map((_, idx) => `<item id="chapter_${idx}" href="chapter_${idx}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine toc="toc">
    ${chapters.map((_, idx) => `<itemref idref="chapter_${idx}"/>`).join('\n    ')}
  </spine>
</package>`;

    const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${novel.id}"/>
  </head>
  <docTitle>
    <text>${this.escapeHtml(novel.title)}</text>
  </docTitle>
  <navMap>
    ${chapters
      .map(
        (ch, idx) => `
    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel>
        <text>${this.escapeHtml(ch.title)}</text>
      </navLabel>
      <content src="chapter_${idx}.xhtml"/>
    </navPoint>`
      )
      .join('')}
  </navMap>
</ncx>`;

    const navContent = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>目录</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>目录</h1>
    <ol>
      ${toc}
    </ol>
  </nav>
</body>
</html>`;

    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

    const mimeType = 'application/epub+zip';

    const epubStructure = {
      'mimetype': mimeType,
      'META-INF/container.xml': containerXml,
      'OEBPS/content.opf': opfContent,
      'OEBPS/toc.ncx': ncxContent,
      'OEBPS/nav.xhtml': navContent,
      ...Object.fromEntries(
        chapters.map((ch, idx) => [`OEBPS/chapter_${idx}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeHtml(ch.title)}</title>
  <style>
    body { font-family: "Noto Serif SC", serif; line-height: 1.8; padding: 2em; }
    h1 { text-align: center; margin-bottom: 1em; }
    p { text-indent: 2em; margin: 0.5em 0; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(ch.title)}</h1>
  ${ch.content
    .split('\n\n')
    .map((p) => `<p>${this.escapeHtml(p)}</p>`)
    .join('\n      ')}
</body>
</html>`])
      ),
    };

    return {
      content: JSON.stringify(epubStructure),
      filename: `${novel.title}.epub.json`,
      mimeType: 'application/json',
    };
  }

  private exportSubmission(novel: Novel, options: ExportOptions): ExportResult {
    let content = '';

    content += `【小说投稿格式】\n`;
    content += `${'='.repeat(40)}\n\n`;

    content += `作品标题: ${novel.title}\n`;
    content += `作品类型: ${GENRE_LABELS[novel.genre]}\n`;
    content += `作品状态: ${NOVEL_STATUS_LABELS[novel.status]}\n`;
    content += `总字数: ${novel.currentWordCount} 字\n`;
    content += `章节数: ${novel.chapters.length} 章\n`;
    if (options.authorName) {
      content += `作者笔名: ${options.authorName}\n`;
    }
    content += `\n${'='.repeat(40)}\n\n`;

    content += `【作品简介】\n`;
    content += `${novel.synopsis || '暂无简介'}\n\n`;

    content += `${'='.repeat(40)}\n\n`;

    content += `【主要角色】\n`;
    const mainCharacters = novel.characters.filter((c) => c.role === 'protagonist' || c.role === 'supporting');
    mainCharacters.forEach((char) => {
      content += `- ${char.name} (${char.role === 'protagonist' ? '主角' : '配角'}): ${char.personality}\n`;
    });
    content += `\n${'='.repeat(40)}\n\n`;

    content += `【故事大纲】\n`;
    novel.chapters.slice(0, 10).forEach((ch, idx) => {
      content += `第${idx + 1}章 ${ch.title}: ${ch.summary || '暂无摘要'}\n`;
    });
    if (novel.chapters.length > 10) {
      content += `... (共${novel.chapters.length}章)\n`;
    }
    content += `\n${'='.repeat(40)}\n\n`;

    content += `【正文内容】\n\n`;

    const chapters = this.getChaptersToExport(novel, options);
    chapters.forEach((chapter, idx) => {
      content += `${chapter.title}\n`;
      content += `${'-'.repeat(20)}\n\n`;
      content += `${chapter.content}\n\n`;
      if (idx < chapters.length - 1) {
        content += `${'·'.repeat(20)}\n\n`;
      }
    });

    return {
      content,
      filename: `${novel.title}_投稿格式.txt`,
      mimeType: 'text/plain',
    };
  }

  private exportHtml(novel: Novel, options: ExportOptions): ExportResult {
    const chapters = this.getChaptersToExport(novel, options);

    const chapterHtml = chapters
      .map(
        (ch) => `
      <section class="chapter" id="chapter-${ch.order}">
        <h2>${this.escapeHtml(ch.title)}</h2>
        <div class="chapter-content">
          ${ch.content
            .split('\n\n')
            .map((p) => `<p>${this.escapeHtml(p)}</p>`)
            .join('\n          ')}
        </div>
      </section>`
      )
      .join('\n');

    const tocHtml = chapters
      .map((ch) => `<li><a href="#chapter-${ch.order}">${this.escapeHtml(ch.title)}</a> <span class="word-count">${ch.wordCount}字</span></li>`)
      .join('\n        ');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(novel.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Noto Serif SC", "Source Han Serif SC", serif;
      line-height: 1.8;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2em;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .title {
      text-align: center;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 2px solid #333;
    }
    .title h1 { font-size: 2em; margin-bottom: 0.5em; }
    .title .meta { color: #666; font-size: 0.9em; }
    .synopsis {
      background: #f9f9f9;
      padding: 1.5em;
      margin-bottom: 2em;
      border-left: 4px solid #333;
    }
    .toc {
      background: #f9f9f9;
      padding: 1.5em;
      margin-bottom: 2em;
    }
    .toc h2 { margin-bottom: 1em; }
    .toc ol { list-style-position: inside; }
    .toc li { margin: 0.5em 0; }
    .toc a { color: #333; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .word-count { color: #999; font-size: 0.8em; }
    .chapter { margin-bottom: 3em; }
    .chapter h2 {
      font-size: 1.5em;
      margin-bottom: 1em;
      padding-bottom: 0.5em;
      border-bottom: 1px solid #ddd;
    }
    .chapter-content p {
      text-indent: 2em;
      margin: 0.8em 0;
      text-align: justify;
    }
    ${options.customCss || ''}
  </style>
</head>
<body>
  <div class="container">
    <header class="title">
      <h1>${this.escapeHtml(novel.title)}</h1>
      ${options.authorName ? `<div class="meta">作者: ${this.escapeHtml(options.authorName)}</div>` : ''}
      <div class="meta">${GENRE_LABELS[novel.genre]} · ${novel.currentWordCount}字 · ${novel.chapters.length}章</div>
    </header>

    ${options.includeSynopsis && novel.synopsis ? `
    <section class="synopsis">
      <h2>简介</h2>
      <p>${this.escapeHtml(novel.synopsis)}</p>
    </section>
    ` : ''}

    ${options.includeToc && chapters.length > 1 ? `
    <nav class="toc">
      <h2>目录</h2>
      <ol>
        ${tocHtml}
      </ol>
    </nav>
    ` : ''}

    <main>
      ${chapterHtml}
    </main>

    <footer style="text-align: center; margin-top: 3em; padding-top: 1em; border-top: 1px solid #ddd; color: #999;">
      <p>由 YourStory2 导出 · ${new Date().toLocaleString('')}</p>
    </footer>
  </div>
</body>
</html>`;

    return {
      content: html,
      filename: `${novel.title}.html`,
      mimeType: 'text/html',
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  downloadFile(result: ExportResult): void {
    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default NovelExportService;
