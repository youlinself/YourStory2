import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type {
  Novel,
  NovelChapter,
  Character,
  WorldBuilding,
  NovelGenre,
  NovelStatus,
} from '../types/novel';

interface NovelState {
  novels: Novel[];
  currentNovelId: string | null;
  currentChapterId: string | null;

  loadNovels: () => Promise<void>;
  createNovel: (data: {
    title: string;
    genre: NovelGenre;
    synopsis?: string;
    targetWordCount?: number;
  }) => Promise<string>;
  updateNovel: (novelId: string, updates: Partial<Novel>) => Promise<void>;
  deleteNovel: (novelId: string) => Promise<void>;
  setCurrentNovel: (novelId: string | null) => void;

  addChapter: (novelId: string, title: string) => Promise<string>;
  updateChapter: (novelId: string, chapterId: string, updates: Partial<NovelChapter>) => Promise<void>;
  deleteChapter: (novelId: string, chapterId: string) => Promise<void>;
  reorderChapters: (novelId: string, fromIndex: number, toIndex: number) => Promise<void>;
  setCurrentChapter: (chapterId: string | null) => void;

  addCharacter: (novelId: string, data: Omit<Character, 'id' | 'novelId' | 'createdAt'>) => Promise<string>;
  updateCharacter: (novelId: string, characterId: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (novelId: string, characterId: string) => Promise<void>;

  updateWorldBuilding: (novelId: string, updates: Partial<WorldBuilding>) => Promise<void>;

  getCurrentNovel: () => Novel | null;
  getCurrentChapter: () => NovelChapter | null;
  getNovelStats: (novelId: string) => { totalChapters: number; totalWords: number; completedChapters: number };
}

const storageService = StorageService.getInstance();
const STORAGE_KEY = 'novels';

const calculateWordCount = (content: string): number => {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
};

const recalculateNovelStats = (novel: Novel): Novel => {
  const totalWords = novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const hasContent = novel.chapters.some((ch) => ch.wordCount > 0);
  const allFinal = novel.chapters.length > 0 && novel.chapters.every((ch) => ch.status === 'final');

  let status: NovelStatus = novel.status;
  if (allFinal && novel.chapters.length > 0) {
    status = 'completed';
  } else if (hasContent && status === 'planning') {
    status = 'writing';
  }

  return {
    ...novel,
    currentWordCount: totalWords,
    status,
    updatedAt: new Date(),
  };
};

const useNovelStore = create<NovelState>((set, get) => ({
  novels: [],
  currentNovelId: null,
  currentChapterId: null,

  loadNovels: async () => {
    try {
      const data = await storageService.loadData<Novel[]>(STORAGE_KEY);
      if (data) {
        set({ novels: data });
      }
    } catch (error) {
      console.error('加载小说列表失败:', error);
    }
  },

  createNovel: async (data) => {
    const newNovel: Novel = {
      id: generateId(),
      title: data.title,
      genre: data.genre,
      synopsis: data.synopsis || '',
      coverImage: '',
      targetWordCount: data.targetWordCount || 0,
      currentWordCount: 0,
      status: 'planning',
      chapters: [],
      volumes: [],
      characters: [],
      worldBuilding: null,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const novels = [...get().novels, newNovel];
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels, currentNovelId: newNovel.id });
    return newNovel.id;
  },

  updateNovel: async (novelId, updates) => {
    const novels = get().novels.map((n) =>
      n.id === novelId ? { ...n, ...updates, updatedAt: new Date() } : n
    );
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  deleteNovel: async (novelId) => {
    const novels = get().novels.filter((n) => n.id !== novelId);
    await storageService.saveData(STORAGE_KEY, novels);
    set({
      novels,
      currentNovelId: get().currentNovelId === novelId ? null : get().currentNovelId,
    });
  },

  setCurrentNovel: (novelId) => {
    set({ currentNovelId: novelId, currentChapterId: null });
  },

  addChapter: async (novelId, title) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return '';

    const newChapter: NovelChapter = {
      id: generateId(),
      novelId,
      title,
      order: novel.chapters.length,
      content: '',
      summary: '',
      status: 'outline',
      wordCount: 0,
      notes: '',
      tags: [],
      annotations: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedNovel = recalculateNovelStats({
      ...novel,
      chapters: [...novel.chapters, newChapter],
    });

    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels, currentChapterId: newChapter.id });
    return newChapter.id;
  },

  updateChapter: async (novelId, chapterId, updates) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const chapters = novel.chapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const updated = { ...ch, ...updates, updatedAt: new Date() };
      if (updates.content !== undefined) {
        updated.wordCount = calculateWordCount(updates.content);
      }
      return updated;
    });

    const updatedNovel = recalculateNovelStats({ ...novel, chapters });
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  deleteChapter: async (novelId, chapterId) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const chapters = novel.chapters
      .filter((ch) => ch.id !== chapterId)
      .map((ch, idx) => ({ ...ch, order: idx }));

    const updatedNovel = recalculateNovelStats({ ...novel, chapters });
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({
      novels,
      currentChapterId: get().currentChapterId === chapterId ? null : get().currentChapterId,
    });
  },

  reorderChapters: async (novelId, fromIndex, toIndex) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const chapters = [...novel.chapters];
    const [moved] = chapters.splice(fromIndex, 1);
    chapters.splice(toIndex, 0, moved);
    const reordered = chapters.map((ch, idx) => ({ ...ch, order: idx }));

    const updatedNovel = { ...novel, chapters: reordered, updatedAt: new Date() };
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  setCurrentChapter: (chapterId) => {
    set({ currentChapterId: chapterId });
  },

  addCharacter: async (novelId, data) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return '';

    const newCharacter: Character = {
      ...data,
      id: generateId(),
      novelId,
      createdAt: new Date(),
    };

    const updatedNovel = {
      ...novel,
      characters: [...novel.characters, newCharacter],
      updatedAt: new Date(),
    };

    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
    return newCharacter.id;
  },

  updateCharacter: async (novelId, characterId, updates) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const characters = novel.characters.map((c) =>
      c.id === characterId ? { ...c, ...updates } : c
    );

    const updatedNovel = { ...novel, characters, updatedAt: new Date() };
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  deleteCharacter: async (novelId, characterId) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const characters = novel.characters.filter((c) => c.id !== characterId);
    const updatedNovel = { ...novel, characters, updatedAt: new Date() };
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  updateWorldBuilding: async (novelId, updates) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;

    const worldBuilding: WorldBuilding = {
      id: novel.worldBuilding?.id || generateId(),
      novelId,
      setting: updates.setting ?? novel.worldBuilding?.setting ?? '',
      era: updates.era ?? novel.worldBuilding?.era ?? '',
      location: updates.location ?? novel.worldBuilding?.location ?? '',
      magicSystem: updates.magicSystem ?? novel.worldBuilding?.magicSystem ?? '',
      factions: updates.factions ?? novel.worldBuilding?.factions ?? [],
      rules: updates.rules ?? novel.worldBuilding?.rules ?? [],
      notes: updates.notes ?? novel.worldBuilding?.notes ?? '',
      updatedAt: new Date(),
    };

    const updatedNovel = { ...novel, worldBuilding, updatedAt: new Date() };
    const novels = get().novels.map((n) => (n.id === novelId ? updatedNovel : n));
    await storageService.saveData(STORAGE_KEY, novels);
    set({ novels });
  },

  getCurrentNovel: () => {
    const { novels, currentNovelId } = get();
    return novels.find((n) => n.id === currentNovelId) || null;
  },

  getCurrentChapter: () => {
    const novel = get().getCurrentNovel();
    if (!novel) return null;
    return novel.chapters.find((ch) => ch.id === get().currentChapterId) || null;
  },

  getNovelStats: (novelId) => {
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return { totalChapters: 0, totalWords: 0, completedChapters: 0 };

    return {
      totalChapters: novel.chapters.length,
      totalWords: novel.currentWordCount,
      completedChapters: novel.chapters.filter((ch) => ch.status === 'final').length,
    };
  },
}));

export default useNovelStore;
