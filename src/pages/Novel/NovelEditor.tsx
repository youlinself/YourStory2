import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';
import { useToast } from '../../components';
import {
  GENRE_LABELS,
  NOVEL_STATUS_LABELS,
  CHAPTER_STATUS_LABELS,
  ChapterStatus,
} from '../../types/novel';
import ChapterList from '../../components/novel/ChapterList';
import AIAssistantPanel from '../../components/novel/AIAssistantPanel';
import CharacterPanel from '../../components/novel/CharacterPanel';
import WorldBuildingPanel from '../../components/novel/WorldBuildingPanel';

type ViewMode = 'write' | 'outline' | 'characters' | 'world';

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

  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const novel = useMemo(
    () => novels.find((n) => n.id === novelId),
    [novels, novelId]
  );

  const currentChapter = useMemo(
    () => novel?.chapters.find((ch) => ch.id === currentChapterId),
    [novel, currentChapterId]
  );

  useEffect(() => {
    if (novelId) {
      setCurrentNovel(novelId);
    }
  }, [novelId, setCurrentNovel]);

  useEffect(() => {
    if (novel && !currentChapterId && novel.chapters.length > 0) {
      setCurrentChapter(novel.chapters[0].id);
    }
  }, [novel, currentChapterId, setCurrentChapter]);

  const autoSave = useCallback(
    async (chapterId: string, content: string) => {
      if (!novelId || !chapterId) return;

      try {
        await updateChapter(novelId, chapterId, { content });
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000);
      } catch {
        toast.addToast({ type: 'error', message: '保存失败' });
      }
    },
    [novelId, updateChapter, toast]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!currentChapterId) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        autoSave(currentChapterId, content);
      }, 1000);
    },
    [currentChapterId, autoSave]
  );

  const handleAddChapter = async () => {
    if (!novelId) return;

    const title = prompt('输入新章节标题：');
    if (!title?.trim()) return;

    try {
      const chapterId = await addChapter(novelId, title.trim());
      setCurrentChapter(chapterId);
      setViewMode('write');
      toast.addToast({ type: 'success', message: '章节已添加' });
    } catch {
      toast.addToast({ type: 'error', message: '添加失败' });
    }
  };

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
    selectedText?: string
  ) => {
    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return null;
    }

    if (!novel || !currentChapter) {
      toast.addToast({ type: 'warning', message: '请先选择一个章节' });
      return null;
    }

    const aiService = new NovelAIService({
      apiKey,
      model,
      baseUrl,
      vendor,
      temperature,
      customModelName,
    });

    try {
      switch (type) {
        case 'continue':
          return await aiService.continueWriting(
            currentChapter,
            novel.characters,
            novel.worldBuilding
          );
        case 'polish':
          if (!selectedText) {
            toast.addToast({ type: 'warning', message: '请先选择要润色的文本' });
            return null;
          }
          return await aiService.polishText(selectedText);
        case 'expand':
          if (!selectedText) {
            toast.addToast({ type: 'warning', message: '请先选择要扩写的文本' });
            return null;
          }
          return await aiService.expandText(selectedText);
        case 'suggest':
          return await aiService.generatePlotSuggestions(novel.chapters, novel.synopsis);
        default:
          return null;
      }
    } catch (error) {
      toast.addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'AI请求失败',
      });
      return null;
    }
  };

  const calculateWordCount = (content: string): number => {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  };

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

  const wordCount = calculateWordCount(currentChapter?.content || '');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-bg-base">
        <div className="flex items-center gap-4">
          <button
            className="text-ink-muted hover:text-ink transition-colors"
            onClick={() => navigate('/novel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-semibold text-ink">{novel.title}</h1>
            <div className="flex items-center gap-2 text-xs text-ink-faint">
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
        </div>

        <div className="flex items-center gap-2">
          {showSaveIndicator && (
            <span className="text-xs text-success flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              已保存
            </span>
          )}
          <button
            className={`btn btn-ghost text-xs ${isFocusMode ? 'bg-brand-surface text-brand' : ''}`}
            onClick={() => setIsFocusMode(!isFocusMode)}
            title="专注模式"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

          <div className="flex-1" />

          {viewMode === 'write' && currentChapter && (
            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <span>本章 {wordCount} 字</span>
              <select
                className="input text-xs py-1 w-24"
                value={currentChapter.status}
                onChange={(e) =>
                  handleStatusChange(currentChapter.id, e.target.value as ChapterStatus)
                }
              >
                {Object.entries(CHAPTER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!isFocusMode && viewMode === 'write' && (
          <div className="w-56 border-r border-border-subtle overflow-y-auto">
            <ChapterList
              chapters={novel.chapters}
              currentChapterId={currentChapterId}
              onSelect={(id) => setCurrentChapter(id)}
              onAdd={handleAddChapter}
              onDelete={handleDeleteChapter}
              onReorder={handleReorderChapters}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'write' && (
            <>
              {currentChapter ? (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">{currentChapter.title}</h2>
                      {currentChapter.summary && (
                        <p className="text-xs text-ink-faint mt-1 line-clamp-1">
                          概要：{currentChapter.summary}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-ink-faint">
                      最后更新：{new Date(currentChapter.updatedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  <textarea
                    className="flex-1 w-full resize-none bg-transparent text-base text-ink leading-relaxed focus:outline-none"
                    placeholder="开始写作..."
                    value={currentChapter.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif' }}
                  />
                </div>
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

          {viewMode === 'characters' && (
            <CharacterPanel
              novelId={novel.id}
              characters={novel.characters}
            />
          )}

          {viewMode === 'world' && (
            <WorldBuildingPanel
              novelId={novel.id}
              worldBuilding={novel.worldBuilding}
            />
          )}
        </div>

        {viewMode === 'write' && !isFocusMode && currentChapter && (
          <AIAssistantPanel
            onAssist={handleAIAssist}
            onInsertText={(text) => {
              const newContent = currentChapter.content + text;
              handleContentChange(newContent);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NovelEditor;
