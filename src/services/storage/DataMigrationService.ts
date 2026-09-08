import NovelFileLibraryService from './NovelFileLibraryService';
import StorageService from './StorageService';
import { generateId } from '../../utils';
import type { Novel, NovelChapter } from '../../types/novel';

export interface MigrationProgress {
  phase: 'detecting' | 'migrating' | 'indexing' | 'complete' | 'error';
  currentStep: string;
  processedItems: number;
  totalItems: number;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  migratedNovels: number;
  migratedChapters: number;
  migratedCharacters: number;
  errors: string[];
  duration: number;
}

const OLD_STORAGE_KEYS = {
  novels: 'novels',
  chapters: 'chapters',
  characters: 'characters',
  worldBuilding: 'worldBuilding',
};

const DataMigrationService = {
  async detectOldData(): Promise<{
    hasOldData: boolean;
    novelCount: number;
    chapterCount: number;
  }> {
    const storage = StorageService.getInstance();
    const libraryService = NovelFileLibraryService.getInstance();

    const oldNovels = await storage.loadData<Novel[]>(OLD_STORAGE_KEYS.novels);
    const libraryIndex = await libraryService.getLibraryIndex();

    if (!oldNovels || oldNovels.length === 0) {
      return { hasOldData: false, novelCount: 0, chapterCount: 0 };
    }

    const newNovelIds = new Set(libraryIndex.map((m) => m.id));
    const unmigratedNovels = oldNovels.filter((n: Novel) => !newNovelIds.has(n.id));

    let chapterCount = 0;
    for (const novel of unmigratedNovels) {
      chapterCount += novel.chapters?.length || 0;
    }

    return {
      hasOldData: unmigratedNovels.length > 0,
      novelCount: unmigratedNovels.length,
      chapterCount,
    };
  },

  async migrateAll(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let migratedNovels = 0;
    let migratedChapters = 0;
    let migratedCharacters = 0;

    const reportProgress = (phase: MigrationProgress['phase'], step: string, processed: number, total: number) => {
      onProgress?.({
        phase,
        currentStep: step,
        processedItems: processed,
        totalItems: total,
        errors: [...errors],
      });
    };

    try {
      reportProgress('detecting', '检测旧格式数据...', 0, 0);

      const storage = StorageService.getInstance();
      const oldNovels = await storage.loadData<Novel[]>(OLD_STORAGE_KEYS.novels);

      if (!oldNovels || oldNovels.length === 0) {
        return {
          success: true,
          migratedNovels: 0,
          migratedChapters: 0,
          migratedCharacters: 0,
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      const libraryService = NovelFileLibraryService.getInstance();
      const libraryIndex = await libraryService.getLibraryIndex();
      const existingIds = new Set(libraryIndex.map((m) => m.id));

      const novelsToMigrate = oldNovels.filter((n: Novel) => !existingIds.has(n.id));
      const totalItems = novelsToMigrate.length;

      reportProgress('migrating', `开始迁移 ${totalItems} 本小说...`, 0, totalItems);

      for (let i = 0; i < novelsToMigrate.length; i++) {
        const novel = novelsToMigrate[i];
        reportProgress('migrating', `迁移小说: ${novel.title}`, i, totalItems);

        try {
          const sanitizedNovel = this.sanitizeNovel(novel);

          await libraryService.createNovelFolder(sanitizedNovel);

          for (const chapter of sanitizedNovel.chapters) {
            try {
              await libraryService.saveChapter(sanitizedNovel.id, chapter);
              migratedChapters++;
            } catch (err) {
              errors.push(`章节 "${chapter.title}" 迁移失败: ${err instanceof Error ? err.message : '未知错误'}`);
            }
          }

          for (const character of sanitizedNovel.characters) {
            try {
              await libraryService.saveCharacter(sanitizedNovel.id, character);
              migratedCharacters++;
            } catch (err) {
              errors.push(`角色 "${character.name}" 迁移失败: ${err instanceof Error ? err.message : '未知错误'}`);
            }
          }

          if (sanitizedNovel.worldBuilding) {
            try {
              await libraryService.saveWorldBuilding(sanitizedNovel.id, sanitizedNovel.worldBuilding);
            } catch (err) {
              errors.push(`世界观迁移失败: ${err instanceof Error ? err.message : '未知错误'}`);
            }
          }

          if (sanitizedNovel.volumes && sanitizedNovel.volumes.length > 0) {
            for (const volume of sanitizedNovel.volumes) {
              try {
                await libraryService.saveVolume(sanitizedNovel.id, volume);
              } catch (err) {
                errors.push(`卷 "${volume.title}" 迁移失败: ${err instanceof Error ? err.message : '未知错误'}`);
              }
            }
          }

          migratedNovels++;
        } catch (err) {
          errors.push(`小说 "${novel.title}" 迁移失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }

      reportProgress('complete', '迁移完成', totalItems, totalItems);

      return {
        success: errors.length === 0,
        migratedNovels,
        migratedChapters,
        migratedCharacters,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      errors.push(`迁移过程发生错误: ${err instanceof Error ? err.message : '未知错误'}`);
      reportProgress('error', '迁移失败', 0, 0);

      return {
        success: false,
        migratedNovels,
        migratedChapters,
        migratedCharacters,
        errors,
        duration: Date.now() - startTime,
      };
    }
  },

  sanitizeNovel(novel: Novel): Novel {
    return {
      ...novel,
      id: novel.id || generateId(),
      title: novel.title || '未命名小说',
      genre: novel.genre || 'other',
      synopsis: novel.synopsis || '',
      chapters: (novel.chapters || []).map((ch) => this.sanitizeChapter(ch, novel.id)),
      characters: novel.characters || [],
      volumes: novel.volumes || [],
      tags: novel.tags || [],
      goals: novel.goals || [],
      createdAt: novel.createdAt || new Date(),
      updatedAt: novel.updatedAt || new Date(),
    };
  },

  sanitizeChapter(chapter: NovelChapter, novelId: string): NovelChapter {
    return {
      ...chapter,
      id: chapter.id || generateId(),
      novelId,
      title: chapter.title || '未命名章节',
      order: chapter.order || 0,
      content: chapter.content || '',
      summary: chapter.summary || '',
      status: chapter.status || 'outline',
      wordCount: chapter.wordCount || 0,
      notes: chapter.notes || '',
      tags: chapter.tags || [],
      annotations: chapter.annotations || [],
      scenes: chapter.scenes || [],
      createdAt: chapter.createdAt || new Date(),
      updatedAt: chapter.updatedAt || new Date(),
    };
  },

  async rollback(migratedNovelIds: string[]): Promise<void> {
    const libraryService = NovelFileLibraryService.getInstance();
    for (const novelId of migratedNovelIds) {
      try {
        await libraryService.deleteNovel(novelId);
      } catch (err) {
        console.error(`回滚小说 ${novelId} 失败:`, err);
      }
    }
  },
};

export default DataMigrationService;
