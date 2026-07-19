import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type { Autobiography, Chapter } from '../types';

interface AutobiographyState {
  autobiography: Autobiography | null;

  // Actions
  load: () => Promise<void>;
  create: () => Promise<void>;
  createChapter: (title: string, timeRange?: string) => Promise<string>;
  deleteChapter: (chapterId: string) => Promise<void>;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  updateChapterDraft: (chapterId: string, draftContent: string) => Promise<void>;
  confirmChapterDraft: (chapterId: string) => Promise<void>;
  setAutobiography: (autobiography: Autobiography) => void;
  getCompletionStats: () => { total: number; completed: number; inProgress: number; draft: number };
}

const storageService = StorageService.getInstance();
const STORAGE_KEY = 'autobiography';

const useAutobiographyStore = create<AutobiographyState>((set, get) => ({
  autobiography: null,

  load: async () => {
    try {
      const data = await storageService.loadData<Autobiography>(STORAGE_KEY);
      if (data) {
        // 兼容旧数据：给缺少字段的章节补上默认值
        const chapters = data.chapters.map((ch) => ({
          ...ch,
          draftContent: ch.draftContent ?? '',
          status: ch.status ?? (ch.content ? 'completed' : 'empty'),
          timeRange: ch.timeRange ?? '',
        }));
        set({ autobiography: { ...data, chapters } });
      }
    } catch (error) {
      console.error('加载自传失败:', error);
    }
  },

  create: async () => {
    const newAutobiography: Autobiography = {
      id: generateId(),
      title: '我的自传',
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await storageService.saveData(STORAGE_KEY, newAutobiography);
    set({ autobiography: newAutobiography });
  },

  createChapter: async (title: string, timeRange?: string) => {
    const { autobiography } = get();
    if (!autobiography) return '';

    const newChapter: Chapter = {
      id: generateId(),
      title,
      content: '',
      draftContent: '',
      timeRange: timeRange || '',
      status: 'empty',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = {
      ...autobiography,
      chapters: [...autobiography.chapters, newChapter],
      updatedAt: new Date(),
    };

    await storageService.saveData(STORAGE_KEY, updated);
    set({ autobiography: updated });
    return newChapter.id;
  },

  deleteChapter: async (chapterId: string) => {
    const { autobiography } = get();
    if (!autobiography) return;

    const updated = {
      ...autobiography,
      chapters: autobiography.chapters.filter((ch) => ch.id !== chapterId),
      updatedAt: new Date(),
    };

    await storageService.saveData(STORAGE_KEY, updated);
    set({ autobiography: updated });
  },

  updateChapterContent: async (chapterId: string, content: string) => {
    const { autobiography } = get();
    if (!autobiography) return;

    const chapters = autobiography.chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, content, status: content ? 'completed' as const : 'empty' as const, updatedAt: new Date() }
        : ch,
    );

    const updated = { ...autobiography, chapters, updatedAt: new Date() };
    await storageService.saveData(STORAGE_KEY, updated);
    set({ autobiography: updated });
  },

  updateChapterDraft: async (chapterId: string, draftContent: string) => {
    const { autobiography } = get();
    if (!autobiography) return;

    const chapters = autobiography.chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, draftContent, status: 'draft' as const, updatedAt: new Date() }
        : ch,
    );

    const updated = { ...autobiography, chapters, updatedAt: new Date() };
    await storageService.saveData(STORAGE_KEY, updated);
    set({ autobiography: updated });
  },

  confirmChapterDraft: async (chapterId: string) => {
    const { autobiography } = get();
    if (!autobiography) return;

    const chapters = autobiography.chapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const newContent = ch.content
        ? `${ch.content}\n\n${ch.draftContent}`
        : ch.draftContent || '';
      return {
        ...ch,
        content: newContent,
        draftContent: '',
        status: (newContent ? 'completed' : 'empty') as 'completed' | 'empty',
        updatedAt: new Date(),
      };
    });

    const updated = { ...autobiography, chapters, updatedAt: new Date() };
    await storageService.saveData(STORAGE_KEY, updated);
    set({ autobiography: updated });
  },

  setAutobiography: (autobiography: Autobiography) => {
    set({ autobiography });
  },

  getCompletionStats: () => {
    const chapters = get().autobiography?.chapters || [];
    return {
      total: chapters.length,
      completed: chapters.filter((ch) => ch.status === 'completed').length,
      inProgress: chapters.filter((ch) => ch.status === 'in_progress').length,
      draft: chapters.filter((ch) => ch.status === 'draft').length,
    };
  },
}));

export default useAutobiographyStore;
