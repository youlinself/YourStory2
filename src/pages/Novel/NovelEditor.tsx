import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import useThinkTankStore from '../../stores/thinkTankStore';
import useWritingSkillStore from '../../stores/writingSkillStore';
import NovelAIService from '../../services/ai/NovelAIService';
import { useToast } from '../../components';
import {
  GENRE_LABELS,
  NOVEL_STATUS_LABELS,
  CHAPTER_STATUS_LABELS,
  ChapterStatus,
} from '../../types/novel';
import {
  EditorMode,
  SaveStatus,
  WritingStats,
  AIHistoryItem,
  AIParams,
} from '../../types';
import ChapterList from '../../components/novel/ChapterList';
import AIAssistantPanel from '../../components/novel/AIAssistantPanel';
import CharacterPanel from '../../components/novel/CharacterPanel';
import WorldBuildingPanel from '../../components/novel/WorldBuildingPanel';
import NovelInfoPanel from '../../components/novel/NovelInfoPanel';
import MarkdownEditor from '../../components/novel/MarkdownEditor';
import WritingStatsPanel from '../../components/novel/WritingStatsPanel';
import OutlineTimeline from '../../components/novel/OutlineTimeline';
import CharacterRelationshipGraph from '../../components/novel/CharacterRelationshipGraph';
import WritingEnhancementPanel from '../../components/novel/WritingEnhancementPanel';
import GlobalSearch from '../../components/novel/GlobalSearch';
import VersionCompare from '../../components/novel/VersionCompare';
import TagManager from '../../components/novel/TagManager';
import InspirationBoard from '../../components/novel/InspirationBoard';
import VolumeManager from '../../components/novel/VolumeManager';
import WritingAnalytics from '../../components/novel/WritingAnalytics';
import ImportModal from '../../components/novel/ImportModal';
import WritingSkillsPanel from '../../components/novel/WritingSkillsPanel';
import type { PlotThread } from '../../components/novel/PlotThreadTracker';
import type { SavedInspiration } from '../../types';
import type { Volume } from '../../types/novel';

type ViewMode = 'write' | 'outline' | 'characters' | 'world' | 'novelInfo' | 'stats' | 'tags' | 'inspirations' | 'volumes' | 'analytics' | 'skills';

const MAX_HISTORY = 50;
const HISTORY_DEBOUNCE_MS = 500;
const AUTO_SAVE_DEBOUNCE_MS = 1000;

const NovelEditor: React.FC = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    novels,
    currentChapterId,
    setCurrentNovel,
    setCurrentChapter,
    updateChapter,
    addChapter,
    deleteChapter,
    reorderChapters,
  } = useNovelStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();
  const { members: thinkTankMembers } = useThinkTankStore();
  const { loadSettings: loadSkillSettings } = useWritingSkillStore();

  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [editorMode, setEditorMode] = useState<EditorMode>('plaintext');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showStats, setShowStats] = useState(false);
  const [selectedThinkTankMemberId, setSelectedThinkTankMemberId] = useState<string | null>(null);

  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [writingStats, setWritingStats] = useState<WritingStats>({
    daily: [],
    goals: {
      dailyWordCount: 2000,
      novelWordCount: 0,
      reminderEnabled: false,
      reminderTime: '20:00',
      notifyOnComplete: true,
      notifyOnStreakBreak: true,
    },
    streak: {
      current: 0,
      longest: 0,
      lastWriteDate: '',
    },
  });

  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>([]);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEnhancementPanel, setShowEnhancementPanel] = useState(false);
  useState<PlotThread[]>([]);
  const [inspirations, setInspirations] = useState<SavedInspiration[]>([]);
  const [chapterVersions, setChapterVersions] = useState<Array<{ id: string; content: string; description: string; createdAt: string; wordCount: number; isAutoSave: boolean }>>([]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordCountStartRef = useRef<number>(0);
  const sessionStartRef = useRef<Date>(new Date());

  const localContentRef = useRef<string>('');
  const pendingContentRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');

  const novel = useMemo(
    () => novels.find((n) => n.id === novelId),
    [novels, novelId]
  );

  const currentChapter = useMemo(
    () => novel?.chapters.find((ch) => ch.id === currentChapterId),
    [novel, currentChapterId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
        setShowVersionCompare(false);
        setShowImportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (novelId) {
      setCurrentNovel(novelId);
    }
  }, [novelId, setCurrentNovel]);

  useEffect(() => {
    loadSkillSettings();
  }, [loadSkillSettings]);

  useEffect(() => {
    if (novel && !currentChapterId && novel.chapters.length > 0) {
      setCurrentChapter(novel.chapters[0].id);
    }
  }, [novel, currentChapterId, setCurrentChapter]);

  useEffect(() => {
    if (currentChapter) {
      const content = currentChapter.content;
      localContentRef.current = content;
      pendingContentRef.current = content;
      lastSavedContentRef.current = content;
      setContentHistory([content]);
      setHistoryIndex(0);
      wordCountStartRef.current = calculateWordCount(content);
      sessionStartRef.current = new Date();
    }
  }, [currentChapter?.id]);

  const calculateWordCount = (content: string): number => {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  };

  const updateWritingStats = useCallback(
    (_novelId: string, chapterId: string, newContent: string) => {
      const today = new Date().toISOString().split('T')[0];
      const wordsAdded = calculateWordCount(newContent) - wordCountStartRef.current;

      setWritingStats((prev) => {
        const newDaily = [...prev.daily];
        const todayIndex = newDaily.findIndex((d) => d.date === today);

        if (todayIndex >= 0) {
          newDaily[todayIndex] = {
            ...newDaily[todayIndex],
            wordCount: newDaily[todayIndex].wordCount + Math.max(0, wordsAdded),
            chapters: [...new Set([...newDaily[todayIndex].chapters, chapterId])],
          };
        } else {
          newDaily.push({
            date: today,
            wordCount: Math.max(0, wordsAdded),
            duration: 0,
            chapters: [chapterId],
          });
        }

        const streak = { ...prev.streak };
        if (streak.lastWriteDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (streak.lastWriteDate === yesterdayStr) {
            streak.current += 1;
            streak.longest = Math.max(streak.longest, streak.current);
          } else if (streak.lastWriteDate === '') {
            streak.current = 1;
          } else {
            streak.current = 1;
          }
          streak.lastWriteDate = today;
        }

        return {
          ...prev,
          daily: newDaily,
          streak,
        };
      });
    },
    []
  );

  const syncToStore = useCallback(
    async (content: string) => {
      if (!novelId || !currentChapterId) return;
      if (content === lastSavedContentRef.current) return;

      setSaveStatus('saving');

      try {
        await updateChapter(novelId, currentChapterId, { content });
        lastSavedContentRef.current = content;
        setSaveStatus('saved');
        updateWritingStats(novelId, currentChapterId, content);
      } catch {
        setSaveStatus('error');
        toast.addToast({ type: 'error', message: '保存失败' });
      }
    },
    [novelId, currentChapterId, updateChapter, toast, updateWritingStats]
  );

  const scheduleAutoSave = useCallback(
    (content: string) => {
      pendingContentRef.current = content;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus('unsaved');

      saveTimeoutRef.current = setTimeout(() => {
        syncToStore(pendingContentRef.current);
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [syncToStore]
  );

  const scheduleHistoryUpdate = useCallback(
    (content: string) => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }

      historyTimeoutRef.current = setTimeout(() => {
        setContentHistory((prev) => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry === content) return prev;

          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(content);
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
            return newHistory;
          }
          return newHistory;
        });
        setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
      }, HISTORY_DEBOUNCE_MS);
    },
    [historyIndex]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!currentChapterId) return;

      localContentRef.current = content;

      scheduleAutoSave(content);
      scheduleHistoryUpdate(content);
    },
    [currentChapterId, scheduleAutoSave, scheduleHistoryUpdate]
  );

  const syncToStoreImmediate = useCallback(
    (content: string) => {
      if (!novelId || !currentChapterId) return;
      if (content === lastSavedContentRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      syncToStore(content);
    },
    [novelId, currentChapterId, syncToStore]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const content = contentHistory[newIndex];
      if (currentChapterId && content !== undefined) {
        localContentRef.current = content;
        syncToStoreImmediate(content);
      }
    }
  }, [historyIndex, contentHistory, currentChapterId, syncToStoreImmediate]);

  const handleRedo = useCallback(() => {
    if (historyIndex < contentHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const content = contentHistory[newIndex];
      if (currentChapterId && content !== undefined) {
        localContentRef.current = content;
        syncToStoreImmediate(content);
      }
    }
  }, [historyIndex, contentHistory, currentChapterId, syncToStoreImmediate]);

  const getCurrentVolumeInfo = useCallback(() => {
    if (!currentChapter || !novel?.volumes) return null;
    const volumeId = currentChapter.volumeId;
    if (!volumeId) return null;
    const volume = novel.volumes.find((v) => v.id === volumeId);
    if (!volume) return null;
    const volumeChapters = novel.chapters.filter((ch) => ch.volumeId === volumeId);
    const chapterIndex = volumeChapters.findIndex((ch) => ch.id === currentChapter.id);
    return {
      volume,
      volumeIndex: novel.volumes.findIndex((v) => v.id === volumeId),
      chapterIndex: chapterIndex >= 0 ? chapterIndex + 1 : null,
      totalChaptersInVolume: volumeChapters.length,
    };
  }, [currentChapter, novel?.volumes, novel?.chapters]);

  const handleAddChapter = async () => {
    if (!novelId) return;

    const currentVolumeInfo = getCurrentVolumeInfo();
    let defaultTitle = '新章节';
    if (currentVolumeInfo) {
      defaultTitle = `${currentVolumeInfo.volume.title} - 第${currentVolumeInfo.totalChaptersInVolume + 1}章`;
    }

    const title = prompt('输入新章节标题：', defaultTitle);
    if (!title?.trim()) return;

    try {
      const chapterId = await addChapter(novelId, title.trim());
      const currentChapterVolumeId = currentChapter?.volumeId;
      if (currentChapterVolumeId) {
        await updateChapter(novelId, chapterId, { volumeId: currentChapterVolumeId });
      }
      setCurrentChapter(chapterId);
      setViewMode('write');
      toast.addToast({ type: 'success', message: '章节已添加' });
    } catch {
      toast.addToast({ type: 'error', message: '添加失败' });
    }
  };

  const navigateToVolumeChapter = useCallback((direction: 'prev' | 'next') => {
    if (!currentChapter || !novel?.volumes || !novel?.chapters) return;
    const volumeId = currentChapter.volumeId;
    if (!volumeId) return;
    const volumeChapters = novel.chapters.filter((ch) => ch.volumeId === volumeId);
    const currentIndex = volumeChapters.findIndex((ch) => ch.id === currentChapter.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < volumeChapters.length) {
      setCurrentChapter(volumeChapters[targetIndex].id);
    }
  }, [currentChapter, novel?.volumes, novel?.chapters]);

  const handleDeleteChapter = async (chapterId: string) => {
    if (!novelId) return;

    if (!confirm('确定要删除这个章节吗？此操作不可恢复。')) return;

    try {
      await deleteChapter(novelId, chapterId);
      toast.addToast({ type: 'success', message: '章节已删除' });
    } catch {
      toast.addToast({ type: 'error', message: '删除失败' });
    }
  };

  const handleReorderChapters = async (fromIndex: number, toIndex: number) => {
    if (!novelId) return;
    try {
      await reorderChapters(novelId, fromIndex, toIndex);
    } catch {
      toast.addToast({ type: 'error', message: '排序失败' });
    }
  };

  const handleStatusChange = async (chapterId: string, status: ChapterStatus) => {
    if (!novelId) return;
    try {
      await updateChapter(novelId, chapterId, { status });
    } catch {
      toast.addToast({ type: 'error', message: '状态更新失败' });
    }
  };

  const handleAIAssist = async (
    type: 'continue' | 'polish' | 'expand' | 'suggest',
    selectedText?: string,
    params?: AIParams,
    memberId?: string | null
  ) => {
    let memberConfig = { apiKey, model, baseUrl, vendor, temperature, customModelName };

    if (memberId) {
      const member = thinkTankMembers.find((m) => m.id === memberId);
      if (member && member.isEnabled) {
        memberConfig = {
          apiKey: member.config.apiKey,
          model: member.config.model,
          baseUrl: member.config.baseUrl,
          vendor: member.config.vendor,
          temperature: member.config.temperature,
          customModelName: member.config.customModelName,
        };
      }
    }

    if (!memberConfig.apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return null;
    }

    if (!novel || !currentChapter) {
      toast.addToast({ type: 'warning', message: '请先选择一个章节' });
      return null;
    }

    const aiService = new NovelAIService({
      apiKey: memberConfig.apiKey,
      model: memberConfig.model,
      baseUrl: memberConfig.baseUrl,
      vendor: memberConfig.vendor,
      temperature: params?.continue?.temperature ?? memberConfig.temperature,
      customModelName: memberConfig.customModelName,
    });

    try {
      let result: string | string[] | null = null;

      switch (type) {
        case 'continue':
          result = await aiService.continueWriting(
            currentChapter,
            novel.characters,
            novel.worldBuilding
          );
          break;
        case 'polish':
          if (!selectedText) {
            toast.addToast({ type: 'warning', message: '请先选择要润色的文本' });
            return null;
          }
          result = await aiService.polishText(selectedText, params?.continue.style);
          break;
        case 'expand':
          if (!selectedText) {
            toast.addToast({ type: 'warning', message: '请先选择要扩写的文本' });
            return null;
          }
          result = await aiService.expandText(selectedText, params?.continue.direction);
          break;
        case 'suggest':
          result = await aiService.generatePlotSuggestions(novel.chapters, novel.synopsis);
          break;
      }

      if (result) {
        const historyItem: AIHistoryItem = {
          id: `ai_${Date.now()}`,
          type,
          input: selectedText || currentChapter.content.slice(-500),
          output: Array.isArray(result) ? result.join('\n') : result,
          params: params || {
            continue: { length: 'medium', style: 'original', direction: '', temperature: 0.7 },
            polish: { intensity: 'medium', focus: ['fluency'], preserveStyle: true },
            expand: { ratio: 2, focus: ['action'] },
          },
          timestamp: new Date().toISOString(),
          novelId: novel.id,
          chapterId: currentChapter.id,
          isFavorited: false,
        };
        setAiHistory((prev) => [historyItem, ...prev].slice(0, 50));
      }

      return result;
    } catch (error) {
      toast.addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'AI请求失败',
      });
      return null;
    }
  };

  const handleClearHistory = useCallback(() => {
    setAiHistory([]);
    toast.addToast({ type: 'success', message: '历史记录已清空' });
  }, [toast]);

  const handleToggleFavorite = useCallback((id: string) => {
    setAiHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorited: !item.isFavorited } : item
      )
    );
  }, []);

  const handleOpenGoals = useCallback(() => {
    const dailyGoal = prompt('设置每日写作目标（字）：', String(writingStats.goals.dailyWordCount));
    if (dailyGoal && !isNaN(Number(dailyGoal))) {
      setWritingStats((prev) => ({
        ...prev,
        goals: { ...prev.goals, dailyWordCount: Number(dailyGoal) },
      }));
    }
  }, [writingStats.goals.dailyWordCount]);

  const handleChapterTagAdd = useCallback((chapterId: string, tag: string) => {
    if (!novelId) return;
    const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;
    const tags = [...(chapter.tags || []), tag];
    updateChapter(novelId, chapterId, { tags });
  }, [novelId, novel?.chapters, updateChapter]);

  const handleChapterTagRemove = useCallback((chapterId: string, tag: string) => {
    if (!novelId) return;
    const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;
    const tags = (chapter.tags || []).filter((t) => t !== tag);
    updateChapter(novelId, chapterId, { tags });
  }, [novelId, novel?.chapters, updateChapter]);

  const handleBatchTagAdd = useCallback((chapterIds: string[], tag: string) => {
    if (!novelId) return;
    for (const chapterId of chapterIds) {
      const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
      if (chapter) {
        const tags = [...(chapter.tags || []), tag];
        updateChapter(novelId, chapterId, { tags });
      }
    }
  }, [novelId, novel?.chapters, updateChapter]);

  const handleBatchTagRemove = useCallback((chapterIds: string[], tag: string) => {
    if (!novelId) return;
    for (const chapterId of chapterIds) {
      const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
      if (chapter) {
        const tags = (chapter.tags || []).filter((t) => t !== tag);
        updateChapter(novelId, chapterId, { tags });
      }
    }
  }, [novelId, novel?.chapters, updateChapter]);

  const handleVolumeAdd = useCallback((volume: Omit<Volume, 'id'>) => {
    if (!novelId) return;
    const newVolume: Volume = {
      ...volume,
      id: `vol_${Date.now()}`,
    };
    const volumes = [...(novel?.volumes || []), newVolume];
    useNovelStore.getState().updateNovel(novelId, { volumes });
  }, [novelId, novel?.volumes]);

  const handleVolumeUpdate = useCallback((volumeId: string, updates: Partial<Volume>) => {
    if (!novelId) return;
    const volumes = (novel?.volumes || []).map((v) => (v.id === volumeId ? { ...v, ...updates } : v));
    useNovelStore.getState().updateNovel(novelId, { volumes });
  }, [novelId, novel?.volumes]);

  const handleVolumeDelete = useCallback((volumeId: string) => {
    if (!novelId) return;
    const volumes = (novel?.volumes || []).filter((v) => v.id !== volumeId);
    useNovelStore.getState().updateNovel(novelId, { volumes });
  }, [novelId, novel?.volumes]);

  const handleChapterMove = useCallback((chapterId: string, volumeId: string | undefined) => {
    if (!novelId) return;
    updateChapter(novelId, chapterId, { volumeId });
  }, [novelId, updateChapter]);

  const handleVolumeReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!novelId) return;
    const volumes = [...(novel?.volumes || [])];
    const [moved] = volumes.splice(fromIndex, 1);
    volumes.splice(toIndex, 0, moved);
    const reordered = volumes.map((v, idx) => ({ ...v, order: idx }));
    useNovelStore.getState().updateNovel(novelId, { volumes: reordered });
  }, [novelId, novel?.volumes]);

  const inspirationIdCounter = useRef(0);

  const handleInspirationAdd = useCallback((inspiration: Omit<SavedInspiration, 'id' | 'createdAt'>) => {
    const newInspiration: SavedInspiration = {
      ...inspiration,
      id: `insp_${Date.now()}_${++inspirationIdCounter.current}`,
      createdAt: new Date().toISOString(),
    };
    setInspirations((prev) => [...prev, newInspiration]);
  }, []);

  const handleInspirationDelete = useCallback((id: string) => {
    setInspirations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleInspirationUse = useCallback((id: string) => {
    setInspirations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isUsed: true } : i))
    );
  }, []);

  const handleSaveVersion = useCallback((description: string) => {
    if (!currentChapter) return;
    const version = {
      id: `ver_${Date.now()}`,
      content: currentChapter.content,
      description,
      createdAt: new Date().toISOString(),
      wordCount: currentChapter.wordCount,
      isAutoSave: false,
    };
    setChapterVersions((prev) => [version, ...prev]);
    toast.addToast({ type: 'success', message: '版本已保存' });
  }, [currentChapter, toast]);

  const handleRestoreVersion = useCallback((content: string) => {
    if (!currentChapterId) return;
    handleContentChange(content);
    toast.addToast({ type: 'success', message: '版本已恢复' });
  }, [currentChapterId, handleContentChange, toast]);

  if (!novel) {
    return (
      <div className="content-panel flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted">小说不存在</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => navigate('/novel')}
          >
            返回小说列表
          </button>
        </div>
      </div>
    );
  }

  const wordCount = calculateWordCount(localContentRef.current || currentChapter?.content || '');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-bg-base min-w-0">
        <div className="flex items-center gap-4 min-w-0 overflow-hidden">
          <button
            className="text-ink-muted hover:text-ink transition-colors flex-shrink-0"
            onClick={() => navigate('/novel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-ink">{novel.title}</h1>
            <div className="flex items-center gap-2 text-xs text-ink-faint whitespace-nowrap">
              <span>{GENRE_LABELS[novel.genre]}</span>
              <span>·</span>
              <span>{NOVEL_STATUS_LABELS[novel.status]}</span>
              <span>·</span>
              <span>{novel.chapters.length} 章</span>
              <span>·</span>
              <span>
                {novel.currentWordCount > 10000
                  ? `${(novel.currentWordCount / 10000).toFixed(1)}万字`
                  : `${novel.currentWordCount}字`}
              </span>
            </div>
          </div>
          {currentChapter && (
            <div className="flex items-center gap-3 text-xs whitespace-nowrap">
              {getCurrentVolumeInfo() ? (
                <div className="flex items-center gap-1 bg-brand/10 text-brand rounded-full">
                  <button
                    className="p-1.5 hover:bg-brand/20 transition-colors disabled:opacity-30"
                    onClick={() => navigateToVolumeChapter('prev')}
                    disabled={getCurrentVolumeInfo()?.chapterIndex === 1}
                    title="上一章"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 px-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="font-medium">
                      第{getCurrentVolumeInfo()?.volumeIndex !== undefined ? getCurrentVolumeInfo()!.volumeIndex + 1 : ''}卷
                    </span>
                    <span className="text-brand/70">·</span>
                    <span>{getCurrentVolumeInfo()?.volume.title}</span>
                    <span className="text-brand/70">·</span>
                    <span>第{getCurrentVolumeInfo()?.chapterIndex}/{getCurrentVolumeInfo()?.totalChaptersInVolume}章</span>
                  </div>
                  <button
                    className="p-1.5 hover:bg-brand/20 transition-colors disabled:opacity-30"
                    onClick={() => navigateToVolumeChapter('next')}
                    disabled={getCurrentVolumeInfo()?.chapterIndex === getCurrentVolumeInfo()?.totalChaptersInVolume}
                    title="下一章"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>未分配分卷</span>
                </div>
              )}
              <span className="text-ink-faint">本章 {wordCount} 字</span>
              <select
                className="input text-xs py-1 w-24"
                value={currentChapter.status}
                onChange={(e) =>
                  handleStatusChange(currentChapter.id, e.target.value as ChapterStatus)
                }
              >
                {Object.entries(CHAPTER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label as string}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => setShowGlobalSearch(true)}
            title="全局搜索 (Ctrl+K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          {viewMode === 'write' && (
            <>
              <button
                className={`btn text-xs transition-all ${
                  showStats
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'btn-ghost hover:bg-bg-subtle'
                }`}
                onClick={() => setShowStats(!showStats)}
                title="写作统计"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </button>
              <button
                className={`btn text-xs transition-all ${
                  isFocusMode
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'btn-ghost hover:bg-bg-subtle'
                }`}
                onClick={() => setIsFocusMode(!isFocusMode)}
                title="专注模式"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                className={`btn text-xs transition-all ${
                  showEnhancementPanel
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'btn-ghost hover:bg-bg-subtle'
                }`}
                onClick={() => setShowEnhancementPanel(!showEnhancementPanel)}
                title="写作增强"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </button>
            </>
          )}
          <button
            className="btn btn-ghost text-xs"
            onClick={() => setShowVersionCompare(true)}
            title="版本对比"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </button>
          <button
            className="btn btn-ghost text-xs"
            onClick={() => setShowImportModal(true)}
            title="导入"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
            </svg>
          </button>
          <button
            className="btn btn-primary text-xs"
            onClick={() => setViewMode('write')}
          >
            写作
          </button>
        </div>
      </div>

      {!isFocusMode && (
        <div className="flex items-center gap-6 px-6 py-2 border-b border-border-subtle bg-bg-subtle/50">
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'write'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('write')}
          >
            写作
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'outline'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('outline')}
          >
            大纲
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'characters'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('characters')}
          >
            角色 ({novel.characters.length})
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'world'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('world')}
          >
            世界观
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'novelInfo'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('novelInfo')}
          >
            小说信息
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'tags'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('tags')}
          >
            标签
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'volumes'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('volumes')}
          >
            分卷
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'inspirations'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('inspirations')}
          >
            灵感
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'analytics'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('analytics')}
          >
            统计
          </button>
          <button
            className={`text-sm pb-1 border-b-2 transition-all ${
              viewMode === 'skills'
                ? 'border-brand text-brand font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('skills')}
          >
            AI技能
          </button>

          <div className="flex-1" />

          {viewMode === 'write' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-bg-base rounded-lg p-1">
                {[
                  { mode: 'plaintext', label: '纯文本' },
                  { mode: 'markdown', label: 'Markdown' },
                  { mode: 'split', label: '分屏' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      editorMode === mode
                        ? 'bg-brand text-white'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                    onClick={() => setEditorMode(mode as EditorMode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
        )}

        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!isFocusMode && viewMode === 'write' && (
          <div className="w-64 border-r border-border-subtle overflow-y-auto">
            <ChapterList
              chapters={novel.chapters}
              volumes={novel.volumes}
              currentChapterId={currentChapterId}
              onSelect={(id) => setCurrentChapter(id)}
              onAdd={handleAddChapter}
              onDelete={handleDeleteChapter}
              onReorder={handleReorderChapters}
              onChapterMoveToVolume={handleChapterMove}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'write' && (
            <>
              {currentChapter ? (
                <MarkdownEditor
                  key={currentChapter.id}
                  initialContent={currentChapter.content}
                  onChange={handleContentChange}
                  mode={editorMode}
                  placeholder="开始写作..."
                  saveStatus={saveStatus}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < contentHistory.length - 1}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 text-ink-faint mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    <p className="text-ink-muted mb-4">选择一个章节开始写作，或创建新章节</p>
                    <button className="btn btn-primary" onClick={handleAddChapter}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>新建章节</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === 'outline' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-ink">大纲视图</h2>
                  <button className="btn btn-primary btn-sm" onClick={handleAddChapter}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>添加章节</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {novel.chapters.length > 0 ? (
                    novel.chapters.map((chapter, index) => (
                      <div
                        key={chapter.id}
                        className="border border-border-subtle rounded-lg p-4 hover:border-border transition-colors cursor-pointer"
                        onClick={() => {
                          setCurrentChapter(chapter.id);
                          setViewMode('write');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-medium flex items-center justify-center">
                              {index + 1}
                            </span>
                            <h3 className="text-sm font-medium text-ink">{chapter.title}</h3>
                            <span className={`badge ${chapter.status === 'final' ? 'badge-success' : chapter.status === 'draft' ? 'badge-brand' : 'badge-ghost'}`}>
                              {CHAPTER_STATUS_LABELS[chapter.status]}
                            </span>
                          </div>
                          <span className="text-xs text-ink-faint">{chapter.wordCount} 字</span>
                        </div>
                        {chapter.summary && (
                          <p className="text-xs text-ink-muted line-clamp-2 pl-9">{chapter.summary}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-ink-muted">还没有任何章节</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'world' && (
            <WorldBuildingPanel
              novelId={novel.id}
              worldBuilding={novel.worldBuilding}
            />
          )}

          {viewMode === 'novelInfo' && (
            <NovelInfoPanel novel={novel} />
          )}

          {viewMode === 'outline' && (
            <OutlineTimeline
              chapters={novel.chapters}
              volumes={novel.volumes}
              onChapterSelect={(id) => {
                setCurrentChapter(id);
                setViewMode('write');
              }}
              onChapterReorder={handleReorderChapters}
              onSceneAdd={(chapterId, scene) => {
                if (!novelId) return;
                const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
                if (chapter) {
                  const scenes = [...(chapter.scenes || []), { ...scene, id: `scene_${Date.now()}` }];
                  updateChapter(novelId, chapterId, { scenes });
                }
              }}
              onSceneDelete={(chapterId, sceneId) => {
                if (!novelId) return;
                const chapter = novel?.chapters.find((ch) => ch.id === chapterId);
                if (chapter) {
                  const scenes = (chapter.scenes || []).filter((s) => s.id !== sceneId);
                  updateChapter(novelId, chapterId, { scenes });
                }
              }}
              onVolumeAdd={handleVolumeAdd}
              onVolumeDelete={handleVolumeDelete}
              currentChapterId={currentChapterId || undefined}
            />
          )}

          {viewMode === 'characters' && (
            <div className="flex-1 flex overflow-hidden">
              <CharacterPanel
                novelId={novel.id}
                characters={novel.characters}
              />
              <CharacterRelationshipGraph
                characters={novel.characters}
                onCharacterSelect={() => {
                  if (novel.chapters.length > 0) {
                    setCurrentChapter(novel.chapters[0].id);
                  }
                }}
                onRelationshipAdd={(fromId, _toId, relationship) => {
                  if (!novelId) return;
                  const character = novel?.characters.find((c) => c.id === fromId);
                  if (character) {
                    const relationships = [...(character.relationships || []), relationship];
                    useNovelStore.getState().updateCharacter(novelId, fromId, { relationships });
                  }
                }}
                onRelationshipDelete={(characterId, targetId) => {
                  if (!novelId) return;
                  const character = novel?.characters.find((c) => c.id === characterId);
                  if (character) {
                    const relationships = (character.relationships || []).filter((r) => r.targetCharacterId !== targetId);
                    useNovelStore.getState().updateCharacter(novelId, characterId, { relationships });
                  }
                }}
              />
            </div>
          )}

          {viewMode === 'tags' && (
            <TagManager
              chapters={novel.chapters}
              onChapterTagAdd={handleChapterTagAdd}
              onChapterTagRemove={handleChapterTagRemove}
              onBatchTagAdd={handleBatchTagAdd}
              onBatchTagRemove={handleBatchTagRemove}
            />
          )}

          {viewMode === 'inspirations' && (
            <InspirationBoard
              inspirations={inspirations}
              onInspirationAdd={handleInspirationAdd}
              onInspirationDelete={handleInspirationDelete}
              onInspirationUse={handleInspirationUse}
            />
          )}

          {viewMode === 'volumes' && (
            <VolumeManager
              chapters={novel.chapters}
              volumes={novel.volumes}
              onVolumeAdd={handleVolumeAdd}
              onVolumeUpdate={handleVolumeUpdate}
              onVolumeDelete={handleVolumeDelete}
              onChapterMove={handleChapterMove}
              onVolumeReorder={handleVolumeReorder}
              onChapterSelect={(id) => {
                setCurrentChapter(id);
                setViewMode('write');
              }}
            />
          )}

          {viewMode === 'analytics' && (
            <WritingAnalytics
              dailyStats={writingStats.daily}
              totalWords={novel.currentWordCount}
              streakDays={writingStats.streak.current}
            />
          )}

          {viewMode === 'skills' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-ink mb-1">AI 写作技能</h2>
                  <p className="text-sm text-ink-muted">
                    管理自定义写作技能、风格预设和AI扩展配置
                  </p>
                </div>
                <WritingSkillsPanel />
              </div>
            </div>
          )}
        </div>

        {viewMode === 'write' && !isFocusMode && currentChapter && (
          <AIAssistantPanel
            onAssist={handleAIAssist}
            onInsertText={(text) => {
              const newContent = localContentRef.current + text;
              handleContentChange(newContent);
            }}
            history={aiHistory}
            onClearHistory={handleClearHistory}
            onToggleFavorite={handleToggleFavorite}
            selectedMemberId={selectedThinkTankMemberId}
            onSelectedMemberChange={setSelectedThinkTankMemberId}
          />
        )}

        {showStats && viewMode === 'write' && (
          <WritingStatsPanel
            stats={writingStats}
            goals={writingStats.goals}
            totalWords={novel.currentWordCount}
            onOpenGoals={handleOpenGoals}
          />
        )}

        {showEnhancementPanel && viewMode === 'write' && currentChapter && (
          <WritingEnhancementPanel
            wordCount={wordCount}
            targetWordCount={novel.targetWordCount}
            onTypewriterModeToggle={() => {}}
            onFocusModeToggle={() => setIsFocusMode(!isFocusMode)}
            isTypewriterMode={false}
            isFocusMode={isFocusMode}
          />
        )}

        {showGlobalSearch && (
          <GlobalSearch
            novelId={novel.id}
            chapters={novel.chapters}
            characters={novel.characters}
            onChapterSelect={(id) => {
              setCurrentChapter(id);
              setViewMode('write');
              setShowGlobalSearch(false);
            }}
            onCharacterSelect={() => {
              setViewMode('characters');
              setShowGlobalSearch(false);
            }}
            onClose={() => setShowGlobalSearch(false)}
          />
        )}

        {showVersionCompare && currentChapter && (
          <VersionCompare
            versions={chapterVersions}
            currentContent={currentChapter.content}
            onRestoreVersion={handleRestoreVersion}
            onSaveVersion={handleSaveVersion}
            onClose={() => setShowVersionCompare(false)}
          />
        )}

        {showImportModal && (
          <ImportModal
            onImport={(result) => {
              setShowImportModal(false);
              toast.addToast({ type: 'success', message: `成功导入 ${result.chapters.length} 个章节` });
            }}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default NovelEditor;
