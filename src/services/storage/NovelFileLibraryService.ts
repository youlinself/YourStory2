import FileStorageService from './FileStorageService';
import { generateId } from '../../utils';
import type {
  Novel,
  NovelChapter,
  Character,
  WorldBuilding,
  Volume,
} from '../../types/novel';

export interface NovelFolderStructure {
  novelId: string;
  rootPath: string;
  folders: {
    chapters: string;
    characters: string;
    worldBuilding: string;
    outlines: string;
    notes: string;
    versions: string;
    exports: string;
    inspirations: string;
  };
}

export interface NovelMetadata {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  status: string;
  targetWordCount: number;
  currentWordCount: number;
  chapterCount: number;
  characterCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastWrittenAt?: string;
  completedChapters: number;
  progress: number;
}

export interface ChapterIndex {
  id: string;
  title: string;
  order: number;
  status: string;
  wordCount: number;
  summary: string;
  tags: string[];
  characters: string[];
  updatedAt: string;
}

export interface NovelSearchIndex {
  novelId: string;
  chapters: ChapterIndex[];
  characters: { id: string; name: string; alias: string[] }[];
  locations: string[];
  factions: string[];
  themes: string[];
  lastUpdated: string;
}

export interface FileLibraryStats {
  totalNovels: number;
  totalWords: number;
  totalChapters: number;
  totalCharacters: number;
  storageUsed: string;
}

const NOVEL_ROOT_PREFIX = 'novel_library/';
const METADATA_FILE = 'metadata.json';
const SEARCH_INDEX_FILE = 'search_index.json';
const LIBRARY_INDEX_FILE = 'library_index.json';

class NovelFileLibraryService {
  private static instance: NovelFileLibraryService;
  private fileStorage = FileStorageService.getInstance();

  static getInstance(): NovelFileLibraryService {
    if (!NovelFileLibraryService.instance) {
      NovelFileLibraryService.instance = new NovelFileLibraryService();
    }
    return NovelFileLibraryService.instance;
  }

  private getNovelRootPath(novelId: string): string {
    return `${NOVEL_ROOT_PREFIX}${novelId}`;
  }

  private getChaptersPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/chapters`;
  }

  private getCharactersPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/characters`;
  }

  private getWorldBuildingPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/worldbuilding`;
  }

  private getOutlinesPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/outlines`;
  }

  private getNotesPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/notes`;
  }

  private getVersionsPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/versions`;
  }

  private getExportsPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/exports`;
  }

  private getInspirationsPath(novelId: string): string {
    return `${this.getNovelRootPath(novelId)}/inspirations`;
  }

  async createNovelFolder(novel: Novel): Promise<NovelFolderStructure> {
    const novelId = novel.id;
    const structure: NovelFolderStructure = {
      novelId,
      rootPath: this.getNovelRootPath(novelId),
      folders: {
        chapters: this.getChaptersPath(novelId),
        characters: this.getCharactersPath(novelId),
        worldBuilding: this.getWorldBuildingPath(novelId),
        outlines: this.getOutlinesPath(novelId),
        notes: this.getNotesPath(novelId),
        versions: this.getVersionsPath(novelId),
        exports: this.getExportsPath(novelId),
        inspirations: this.getInspirationsPath(novelId),
      },
    };

    for (const folderPath of Object.values(structure.folders)) {
      await this.fileStorage.ensureDirectory(folderPath);
    }

    const metadata = this.extractMetadata(novel);
    await this.saveMetadata(novelId, metadata);

    await this.saveSearchIndex(novelId, this.buildSearchIndex(novel));

    await this.updateLibraryIndex(novelId, metadata);

    return structure;
  }

  async saveChapter(novelId: string, chapter: NovelChapter): Promise<void> {
    const chapterPath = `${this.getChaptersPath(novelId)}/${chapter.id}.json`;
    await this.fileStorage.saveJson(chapterPath, chapter);

    await this.updateChapterIndex(novelId, chapter);

    await this.updateNovelWordCount(novelId);
  }

  async loadChapter(novelId: string, chapterId: string): Promise<NovelChapter | null> {
    const chapterPath = `${this.getChaptersPath(novelId)}/${chapterId}.json`;
    return this.fileStorage.loadJson<NovelChapter>(chapterPath);
  }

  async deleteChapter(novelId: string, chapterId: string): Promise<void> {
    const chapterPath = `${this.getChaptersPath(novelId)}/${chapterId}.json`;
    await this.fileStorage.deleteFile(chapterPath);

    await this.removeChapterFromIndex(novelId, chapterId);
    await this.updateNovelWordCount(novelId);
  }

  async saveCharacter(novelId: string, character: Character): Promise<void> {
    const characterPath = `${this.getCharactersPath(novelId)}/${character.id}.json`;
    await this.fileStorage.saveJson(characterPath, character);

    await this.updateCharacterIndex(novelId, character);
  }

  async loadCharacter(novelId: string, characterId: string): Promise<Character | null> {
    const characterPath = `${this.getCharactersPath(novelId)}/${characterId}.json`;
    return this.fileStorage.loadJson<Character>(characterPath);
  }

  async deleteCharacter(novelId: string, characterId: string): Promise<void> {
    const characterPath = `${this.getCharactersPath(novelId)}/${characterId}.json`;
    await this.fileStorage.deleteFile(characterPath);

    await this.removeCharacterFromIndex(novelId, characterId);
  }

  async saveWorldBuilding(novelId: string, worldBuilding: WorldBuilding): Promise<void> {
    const wbPath = `${this.getWorldBuildingPath(novelId)}/main.json`;
    await this.fileStorage.saveJson(wbPath, worldBuilding);

    await this.updateWorldBuildingIndex(novelId, worldBuilding);
  }

  async loadWorldBuilding(novelId: string): Promise<WorldBuilding | null> {
    const wbPath = `${this.getWorldBuildingPath(novelId)}/main.json`;
    return this.fileStorage.loadJson<WorldBuilding>(wbPath);
  }

  async saveVolume(novelId: string, volume: Volume): Promise<void> {
    const outlinesPath = `${this.getOutlinesPath(novelId)}/volumes.json`;
    let volumes: Volume[] = (await this.fileStorage.loadJson<Volume[]>(outlinesPath)) || [];
    const existingIndex = volumes.findIndex((v) => v.id === volume.id);
    if (existingIndex >= 0) {
      volumes[existingIndex] = volume;
    } else {
      volumes.push(volume);
    }
    await this.fileStorage.saveJson(outlinesPath, volumes);
  }

  async loadVolumes(novelId: string): Promise<Volume[]> {
    const outlinesPath = `${this.getOutlinesPath(novelId)}/volumes.json`;
    return (await this.fileStorage.loadJson<Volume[]>(outlinesPath)) || [];
  }

  async saveMetadata(novelId: string, metadata: NovelMetadata): Promise<void> {
    const metadataPath = `${this.getNovelRootPath(novelId)}/${METADATA_FILE}`;
    await this.fileStorage.saveJson(metadataPath, metadata);
  }

  async loadMetadata(novelId: string): Promise<NovelMetadata | null> {
    const metadataPath = `${this.getNovelRootPath(novelId)}/${METADATA_FILE}`;
    return this.fileStorage.loadJson<NovelMetadata>(metadataPath);
  }

  async saveSearchIndex(novelId: string, index: NovelSearchIndex): Promise<void> {
    const indexPath = `${this.getNovelRootPath(novelId)}/${SEARCH_INDEX_FILE}`;
    await this.fileStorage.saveJson(indexPath, index);
  }

  async loadSearchIndex(novelId: string): Promise<NovelSearchIndex | null> {
    const indexPath = `${this.getNovelRootPath(novelId)}/${SEARCH_INDEX_FILE}`;
    return this.fileStorage.loadJson<NovelSearchIndex>(indexPath);
  }

  async saveNote(novelId: string, noteId: string, content: string, title: string): Promise<void> {
    const notePath = `${this.getNotesPath(novelId)}/${noteId}.json`;
    await this.fileStorage.saveJson(notePath, {
      id: noteId,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async loadNotes(novelId: string): Promise<Array<{ id: string; title: string; content: string; createdAt: string; updatedAt: string }>> {
    const notesPath = this.getNotesPath(novelId);
    const files = await this.fileStorage.listFiles(notesPath);
    const notes = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const note = await this.fileStorage.loadJson<{ id: string; title: string; content: string; createdAt: string; updatedAt: string }>(
          `${notesPath}/${file}`
        );
        if (note) notes.push(note);
      }
    }
    return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async deleteNote(novelId: string, noteId: string): Promise<void> {
    const notePath = `${this.getNotesPath(novelId)}/${noteId}.json`;
    await this.fileStorage.deleteFile(notePath);
  }

  async saveChapterVersion(novelId: string, chapterId: string, content: string, description: string): Promise<string> {
    const versionId = generateId();
    const versionPath = `${this.getVersionsPath(novelId)}/${chapterId}`;
    await this.fileStorage.ensureDirectory(versionPath);

    const version = {
      id: versionId,
      content,
      description,
      createdAt: new Date().toISOString(),
      wordCount: this.calculateWordCount(content),
    };

    await this.fileStorage.saveJson(`${versionPath}/${versionId}.json`, version);
    return versionId;
  }

  async loadChapterVersions(novelId: string, chapterId: string): Promise<Array<{ id: string; content: string; description: string; createdAt: string; wordCount: number }>> {
    const versionPath = `${this.getVersionsPath(novelId)}/${chapterId}`;
    const exists = await this.fileStorage.directoryExists(versionPath);
    if (!exists) return [];

    const files = await this.fileStorage.listFiles(versionPath);
    const versions = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const version = await this.fileStorage.loadJson<{
          id: string;
          content: string;
          description: string;
          createdAt: string;
          wordCount: number;
        }>(`${versionPath}/${file}`);
        if (version) versions.push(version);
      }
    }
    return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLibraryIndex(): Promise<NovelMetadata[]> {
    const index = await this.fileStorage.loadJson<NovelMetadata[]>(`${NOVEL_ROOT_PREFIX}${LIBRARY_INDEX_FILE}`);
    return index || [];
  }

  async saveInspiration(novelId: string, inspiration: { id: string; type: string; content: string; tags: string[]; chapterId?: string }): Promise<void> {
    const inspirationPath = `${this.getInspirationsPath(novelId)}/${inspiration.id}.json`;
    await this.fileStorage.saveJson(inspirationPath, {
      ...inspiration,
      createdAt: new Date().toISOString(),
      novelId,
    });
  }

  async loadInspirations(novelId: string): Promise<Array<{ id: string; type: string; content: string; tags: string[]; chapterId?: string; createdAt: string }>> {
    const inspirationPath = this.getInspirationsPath(novelId);
    const exists = await this.fileStorage.directoryExists(inspirationPath);
    if (!exists) return [];

    const files = await this.fileStorage.listFiles(inspirationPath);
    const inspirations = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const inspiration = await this.fileStorage.loadJson<{
          id: string;
          type: string;
          content: string;
          tags: string[];
          chapterId?: string;
          createdAt: string;
        }>(`${inspirationPath}/${file}`);
        if (inspiration) inspirations.push(inspiration);
      }
    }
    return inspirations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteNovel(novelId: string): Promise<void> {
    const rootPath = this.getNovelRootPath(novelId);
    await this.fileStorage.deleteDirectory(rootPath);

    const index = await this.getLibraryIndex();
    const updatedIndex = index.filter((m) => m.id !== novelId);
    await this.fileStorage.saveJson(`${NOVEL_ROOT_PREFIX}${LIBRARY_INDEX_FILE}`, updatedIndex);
  }

  async getLibraryStats(): Promise<FileLibraryStats> {
    const index = await this.getLibraryIndex();
    const novels = await this.fileStorage.listDirectories(NOVEL_ROOT_PREFIX);

    let totalWords = 0;
    let totalChapters = 0;
    let totalCharacters = 0;

    for (const metadata of index) {
      totalWords += metadata.currentWordCount;
      totalChapters += metadata.chapterCount;
      totalCharacters += metadata.characterCount;
    }

    const storageUsed = await this.fileStorage.getDirectorySize(NOVEL_ROOT_PREFIX);

    return {
      totalNovels: index.length,
      totalWords,
      totalChapters,
      totalCharacters,
      storageUsed: this.formatBytes(storageUsed),
    };
  }

  async searchInNovel(novelId: string, query: string): Promise<{
    chapters: Array<{ chapterId: string; title: string; matches: string[] }>;
    characters: Array<{ characterId: string; name: string; field: string; match: string }>;
  }> {
    const results: {
      chapters: Array<{ chapterId: string; title: string; matches: string[] }>;
      characters: Array<{ characterId: string; name: string; field: string; match: string }>;
    } = { chapters: [], characters: [] };

    const searchIndex = await this.loadSearchIndex(novelId);
    if (!searchIndex) return results;

    const lowerQuery = query.toLowerCase();

    for (const chapter of searchIndex.chapters) {
      const matches: string[] = [];
      if (chapter.title.toLowerCase().includes(lowerQuery)) {
        matches.push(`标题匹配: ${chapter.title}`);
      }
      if (chapter.summary.toLowerCase().includes(lowerQuery)) {
        matches.push(`摘要匹配: ${chapter.summary}`);
      }
      if (chapter.characters.some((c) => c.toLowerCase().includes(lowerQuery))) {
        matches.push(`角色匹配: ${chapter.characters.filter((c) => c.toLowerCase().includes(lowerQuery)).join(', ')}`);
      }
      if (matches.length > 0) {
        results.chapters.push({ chapterId: chapter.id, title: chapter.title, matches });
      }
    }

    for (const character of searchIndex.characters) {
      if (character.name.toLowerCase().includes(lowerQuery)) {
        results.characters.push({ characterId: character.id, name: character.name, field: 'name', match: character.name });
      }
      for (const alias of character.alias) {
        if (alias.toLowerCase().includes(lowerQuery)) {
          results.characters.push({ characterId: character.id, name: character.name, field: 'alias', match: alias });
        }
      }
    }

    return results;
  }

  async getNovelContextForAI(novelId: string, options?: {
    includeChapters?: boolean;
    includeCharacters?: boolean;
    includeWorldBuilding?: boolean;
    chapterLimit?: number;
    characterDetailLevel?: 'brief' | 'full';
  }): Promise<{
    metadata: NovelMetadata | null;
    chapters: Array<{ title: string; summary: string; status: string; wordCount: number }>;
    characters: Array<{ name: string; role: string; personality: string; background?: string }>;
    worldBuilding: WorldBuilding | null;
    recentChapters: Array<{ title: string; content: string }>;
  }> {
    const {
      includeChapters = true,
      includeCharacters = true,
      includeWorldBuilding = true,
      chapterLimit = 5,
      characterDetailLevel = 'brief',
    } = options || {};

    const metadata = await this.loadMetadata(novelId);
    const searchIndex = await this.loadSearchIndex(novelId);

    const chapters: Array<{ title: string; summary: string; status: string; wordCount: number }> = [];
    const characters: Array<{ name: string; role: string; personality: string; background?: string }> = [];
    let worldBuilding: WorldBuilding | null = null;
    const recentChapters: Array<{ title: string; content: string }> = [];

    if (includeChapters && searchIndex) {
      for (const ch of searchIndex.chapters.slice(0, chapterLimit)) {
        chapters.push({
          title: ch.title,
          summary: ch.summary,
          status: ch.status,
          wordCount: ch.wordCount,
        });
      }
    }

    if (includeCharacters && searchIndex) {
      for (const charId of searchIndex.characters.slice(0, 20)) {
        const character = await this.loadCharacter(novelId, charId.id);
        if (character) {
          characters.push({
            name: character.name,
            role: character.role,
            personality: character.personality,
            ...(characterDetailLevel === 'full' ? { background: character.background } : {}),
          });
        }
      }
    }

    if (includeWorldBuilding) {
      worldBuilding = await this.loadWorldBuilding(novelId);
    }

    if (searchIndex && searchIndex.chapters.length > 0) {
      const recentChapterIds = searchIndex.chapters
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);

      for (const ch of recentChapterIds) {
        const chapter = await this.loadChapter(novelId, ch.id);
        if (chapter) {
          recentChapters.push({
            title: chapter.title,
            content: chapter.content,
          });
        }
      }
    }

    return {
      metadata,
      chapters,
      characters,
      worldBuilding,
      recentChapters,
    };
  }

  async exportNovelToFile(novelId: string, format: 'markdown' | 'txt' | 'json'): Promise<string> {
    const novel = await this.loadFullNovel(novelId);
    if (!novel) throw new Error('小说不存在');

    const exportsPath = this.getExportsPath(novelId);
    await this.fileStorage.ensureDirectory(exportsPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filePath: string;
    let content: string;

    switch (format) {
      case 'markdown':
        filePath = `${exportsPath}/${novel.title}_${timestamp}.md`;
        content = this.novelToMarkdown(novel);
        break;
      case 'txt':
        filePath = `${exportsPath}/${novel.title}_${timestamp}.txt`;
        content = this.novelToText(novel);
        break;
      case 'json':
        filePath = `${exportsPath}/${novel.title}_${timestamp}.json`;
        content = JSON.stringify(novel, null, 2);
        break;
      default:
        throw new Error(`不支持的格式: ${format}`);
    }

    await this.fileStorage.writeTextFile(filePath, content);
    return filePath;
  }

  private async loadFullNovel(novelId: string): Promise<Novel | null> {
    const metadata = await this.loadMetadata(novelId);
    if (!metadata) return null;

    const chaptersPath = this.getChaptersPath(novelId);
    const chapterFiles = await this.fileStorage.listFiles(chaptersPath);
    const chapters: NovelChapter[] = [];

    for (const file of chapterFiles) {
      if (file.endsWith('.json')) {
        const chapter = await this.fileStorage.loadJson<NovelChapter>(`${chaptersPath}/${file}`);
        if (chapter) chapters.push(chapter);
      }
    }
    chapters.sort((a, b) => a.order - b.order);

    const charactersPath = this.getCharactersPath(novelId);
    const characterFiles = await this.fileStorage.listFiles(charactersPath);
    const characters: Character[] = [];

    for (const file of characterFiles) {
      if (file.endsWith('.json')) {
        const character = await this.fileStorage.loadJson<Character>(`${charactersPath}/${file}`);
        if (character) characters.push(character);
      }
    }

    const worldBuilding = await this.loadWorldBuilding(novelId);
    const volumes = await this.loadVolumes(novelId);

    return {
      id: novelId,
      title: metadata.title,
      genre: metadata.genre as Novel['genre'],
      synopsis: metadata.synopsis,
      coverImage: '',
      targetWordCount: metadata.targetWordCount,
      currentWordCount: metadata.currentWordCount,
      status: metadata.status as Novel['status'],
      chapters,
      volumes,
      characters,
      worldBuilding,
      tags: metadata.tags,
      createdAt: new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
    };
  }

  private extractMetadata(novel: Novel): NovelMetadata {
    return {
      id: novel.id,
      title: novel.title,
      genre: novel.genre,
      synopsis: novel.synopsis,
      status: novel.status,
      targetWordCount: novel.targetWordCount,
      currentWordCount: novel.currentWordCount,
      chapterCount: novel.chapters.length,
      characterCount: novel.characters.length,
      tags: novel.tags,
      createdAt: novel.createdAt.toISOString(),
      updatedAt: novel.updatedAt.toISOString(),
      completedChapters: novel.chapters.filter((ch) => ch.status === 'final').length,
      progress: novel.targetWordCount > 0 ? (novel.currentWordCount / novel.targetWordCount) * 100 : 0,
    };
  }

  private buildSearchIndex(novel: Novel): NovelSearchIndex {
    return {
      novelId: novel.id,
      chapters: novel.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        order: ch.order,
        status: ch.status,
        wordCount: ch.wordCount,
        summary: ch.summary,
        tags: [],
        characters: ch.scenes?.flatMap((s) => s.characters) || [],
        updatedAt: ch.updatedAt.toISOString(),
      })),
      characters: novel.characters.map((c) => ({
        id: c.id,
        name: c.name,
        alias: c.alias,
      })),
      locations: novel.worldBuilding ? [novel.worldBuilding.location].filter(Boolean) : [],
      factions: novel.worldBuilding?.factions || [],
      themes: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private async updateChapterIndex(novelId: string, chapter: NovelChapter): Promise<void> {
    const index = await this.loadSearchIndex(novelId);
    if (!index) return;

    const chapterIndex: ChapterIndex = {
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      status: chapter.status,
      wordCount: chapter.wordCount,
      summary: chapter.summary,
      tags: [],
      characters: chapter.scenes?.flatMap((s) => s.characters) || [],
      updatedAt: chapter.updatedAt.toISOString(),
    };

    const existingIndex = index.chapters.findIndex((ch) => ch.id === chapter.id);
    if (existingIndex >= 0) {
      index.chapters[existingIndex] = chapterIndex;
    } else {
      index.chapters.push(chapterIndex);
    }

    index.lastUpdated = new Date().toISOString();
    await this.saveSearchIndex(novelId, index);
  }

  private async removeChapterFromIndex(novelId: string, chapterId: string): Promise<void> {
    const index = await this.loadSearchIndex(novelId);
    if (!index) return;

    index.chapters = index.chapters.filter((ch) => ch.id !== chapterId);
    index.lastUpdated = new Date().toISOString();
    await this.saveSearchIndex(novelId, index);
  }

  private async updateCharacterIndex(novelId: string, character: Character): Promise<void> {
    const index = await this.loadSearchIndex(novelId);
    if (!index) return;

    const charEntry = {
      id: character.id,
      name: character.name,
      alias: character.alias,
    };

    const existingIndex = index.characters.findIndex((c) => c.id === character.id);
    if (existingIndex >= 0) {
      index.characters[existingIndex] = charEntry;
    } else {
      index.characters.push(charEntry);
    }

    index.lastUpdated = new Date().toISOString();
    await this.saveSearchIndex(novelId, index);
  }

  private async removeCharacterFromIndex(novelId: string, characterId: string): Promise<void> {
    const index = await this.loadSearchIndex(novelId);
    if (!index) return;

    index.characters = index.characters.filter((c) => c.id !== characterId);
    index.lastUpdated = new Date().toISOString();
    await this.saveSearchIndex(novelId, index);
  }

  private async updateWorldBuildingIndex(novelId: string, wb: WorldBuilding): Promise<void> {
    const index = await this.loadSearchIndex(novelId);
    if (!index) return;

    index.locations = wb.location ? [wb.location] : [];
    index.factions = wb.factions || [];
    index.lastUpdated = new Date().toISOString();
    await this.saveSearchIndex(novelId, index);
  }

  private async updateNovelWordCount(novelId: string): Promise<void> {
    const metadata = await this.loadMetadata(novelId);
    if (!metadata) return;

    const chaptersPath = this.getChaptersPath(novelId);
    const chapterFiles = await this.fileStorage.listFiles(chaptersPath);
    let totalWords = 0;
    let chapterCount = 0;
    let completedChapters = 0;

    for (const file of chapterFiles) {
      if (file.endsWith('.json')) {
        const chapter = await this.fileStorage.loadJson<NovelChapter>(`${chaptersPath}/${file}`);
        if (chapter) {
          totalWords += chapter.wordCount;
          chapterCount++;
          if (chapter.status === 'final') completedChapters++;
        }
      }
    }

    metadata.currentWordCount = totalWords;
    metadata.chapterCount = chapterCount;
    metadata.completedChapters = completedChapters;
    metadata.updatedAt = new Date().toISOString();
    metadata.progress = metadata.targetWordCount > 0 ? (totalWords / metadata.targetWordCount) * 100 : 0;

    await this.saveMetadata(novelId, metadata);
    await this.updateLibraryIndex(novelId, metadata);
  }

  private async updateLibraryIndex(novelId: string, metadata: NovelMetadata): Promise<void> {
    const index = await this.getLibraryIndex();
    const existingIndex = index.findIndex((m) => m.id === novelId);

    if (existingIndex >= 0) {
      index[existingIndex] = metadata;
    } else {
      index.push(metadata);
    }

    await this.fileStorage.saveJson(`${NOVEL_ROOT_PREFIX}${LIBRARY_INDEX_FILE}`, index);
  }

  private calculateWordCount(content: string): number {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private novelToMarkdown(novel: Novel): string {
    let md = `# ${novel.title}\n\n`;
    md += `> ${novel.synopsis || '暂无简介'}\n\n`;
    md += `---\n\n`;

    for (const chapter of novel.chapters) {
      md += `## ${chapter.title}\n\n`;
      md += `${chapter.content}\n\n`;
    }

    return md;
  }

  private novelToText(novel: Novel): string {
    let txt = `${novel.title}\n`;
    txt += `${'='.repeat(novel.title.length)}\n\n`;
    txt += `${novel.synopsis || '暂无简介'}\n\n`;
    txt += `${'-'.repeat(40)}\n\n`;

    for (const chapter of novel.chapters) {
      txt += `${chapter.title}\n`;
      txt += `${'-'.repeat(chapter.title.length)}\n\n`;
      txt += `${chapter.content}\n\n`;
    }

    return txt;
  }
}

export default NovelFileLibraryService;
