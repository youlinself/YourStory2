import React, { useState, useCallback, useMemo } from 'react';
import type { NovelChapter, Scene, Volume } from '../../types/novel';
import { CHAPTER_STATUS_LABELS } from '../../types/novel';

interface OutlineTimelineProps {
  chapters: NovelChapter[];
  volumes: Volume[];
  onChapterSelect: (chapterId: string) => void;
  onChapterReorder: (fromIndex: number, toIndex: number) => void;
  onSceneAdd: (chapterId: string, scene: Omit<Scene, 'id'>) => void;
  onSceneUpdate: (chapterId: string, sceneId: string, updates: Partial<Scene>) => void;
  onSceneDelete: (chapterId: string, sceneId: string) => void;
  onVolumeAdd: (volume: Omit<Volume, 'id'>) => void;
  onVolumeUpdate: (volumeId: string, updates: Partial<Volume>) => void;
  onVolumeDelete: (volumeId: string) => void;
  currentChapterId?: string;
}

type ViewMode = 'timeline' | 'corkboard' | 'list';

const OutlineTimeline: React.FC<OutlineTimelineProps> = ({
  chapters,
  volumes,
  onChapterSelect,
  onChapterReorder,
  onSceneAdd,
  onSceneUpdate,
  onSceneDelete,
  onVolumeAdd,
  onVolumeUpdate,
  onVolumeDelete,
  currentChapterId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState<string | null>(null);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newSceneGoal, setNewSceneGoal] = useState('');

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.order - b.order);
  }, [chapters]);

  const chaptersByVolume = useMemo(() => {
    const map = new Map<string | undefined, NovelChapter[]>();
    for (const chapter of sortedChapters) {
      const volumeId = chapter.volumeId;
      const list = map.get(volumeId) || [];
      list.push(chapter);
      map.set(volumeId, list);
    }
    return map;
  }, [sortedChapters]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onChapterReorder(draggedIndex, index);
      setDraggedIndex(index);
    }
  }, [draggedIndex, onChapterReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const toggleChapterExpand = useCallback((chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const handleAddVolume = useCallback(() => {
    if (!newVolumeTitle.trim()) return;
    onVolumeAdd({
      title: newVolumeTitle.trim(),
      order: volumes.length,
      description: '',
      chapters: [],
    });
    setNewVolumeTitle('');
    setShowVolumeModal(false);
  }, [newVolumeTitle, volumes.length, onVolumeAdd]);

  const handleAddScene = useCallback((chapterId: string) => {
    if (!newSceneTitle.trim()) return;
    const chapter = chapters.find((ch) => ch.id === chapterId);
    onSceneAdd(chapterId, {
      title: newSceneTitle.trim(),
      order: chapter?.scenes.length || 0,
      content: '',
      characters: [],
      location: '',
      goal: newSceneGoal.trim(),
    });
    setNewSceneTitle('');
    setNewSceneGoal('');
    setShowSceneModal(null);
  }, [newSceneTitle, newSceneGoal, chapters, onSceneAdd]);

  const renderTimelineView = () => (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border-subtle" />
      <div className="space-y-4">
        {sortedChapters.map((chapter, index) => (
          <div
            key={chapter.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative pl-14 pr-4 py-3 rounded-lg border transition-all cursor-pointer ${
              currentChapterId === chapter.id
                ? 'border-brand bg-brand/5'
                : 'border-border-subtle hover:border-border'
            } ${draggedIndex === index ? 'opacity-50' : ''}`}
            onClick={() => onChapterSelect(chapter.id)}
          >
            <div className="absolute left-4 top-4 w-5 h-5 rounded-full bg-bg-base border-2 border-brand flex items-center justify-center">
              <span className="text-[10px] font-medium text-brand">{index + 1}</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink">{chapter.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`badge text-[10px] ${
                  chapter.status === 'final' ? 'badge-success' :
                  chapter.status === 'draft' ? 'badge-brand' :
                  chapter.status === 'polishing' ? 'badge-warning' : 'badge-ghost'
                }`}>
                  {CHAPTER_STATUS_LABELS[chapter.status]}
                </span>
                <span className="text-xs text-ink-faint">{chapter.wordCount}字</span>
              </div>
            </div>

            {chapter.summary && (
              <p className="text-xs text-ink-muted line-clamp-2 mb-2">{chapter.summary}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                className="text-xs text-brand hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChapterExpand(chapter.id);
                }}
              >
                {expandedChapters.has(chapter.id) ? '收起场景' : `展开场景 (${chapter.scenes.length})`}
              </button>
              <button
                className="text-xs text-ink-faint hover:text-brand"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSceneModal(chapter.id);
                }}
              >
                + 添加场景
              </button>
            </div>

            {expandedChapters.has(chapter.id) && chapter.scenes.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-border-subtle space-y-2">
                {chapter.scenes
                  .sort((a, b) => a.order - b.order)
                  .map((scene, sceneIndex) => (
                    <div
                      key={scene.id}
                      className="p-2 rounded bg-bg-subtle text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">
                          {sceneIndex + 1}. {scene.title}
                        </span>
                        <button
                          className="text-ink-faint hover:text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSceneDelete(chapter.id, scene.id);
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {scene.goal && (
                        <p className="text-ink-faint mt-1">目标: {scene.goal}</p>
                      )}
                      {scene.characters.length > 0 && (
                        <p className="text-ink-faint mt-1">角色: {scene.characters.join(', ')}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCorkboardView = () => {
    const statusGroups = {
      outline: sortedChapters.filter((ch) => ch.status === 'outline'),
      draft: sortedChapters.filter((ch) => ch.status === 'draft'),
      polishing: sortedChapters.filter((ch) => ch.status === 'polishing'),
      final: sortedChapters.filter((ch) => ch.status === 'final'),
    };

    return (
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusGroups).map(([status, statusChapters]) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-medium text-ink">
                {CHAPTER_STATUS_LABELS[status as keyof typeof CHAPTER_STATUS_LABELS]}
              </span>
              <span className="text-xs text-ink-faint">{statusChapters.length}</span>
            </div>
            <div className="space-y-2">
              {statusChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={() => handleDragStart(chapter.order)}
                  onDragOver={(e) => handleDragOver(e, chapter.order)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    currentChapterId === chapter.id
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-border bg-bg-base'
                  }`}
                  onClick={() => onChapterSelect(chapter.id)}
                >
                  <h4 className="text-xs font-medium text-ink mb-1">{chapter.title}</h4>
                  <p className="text-[10px] text-ink-faint line-clamp-2">
                    {chapter.summary || '暂无摘要'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-ink-faint">{chapter.wordCount}字</span>
                    <span className="text-[10px] text-ink-faint">{chapter.scenes.length}场景</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      {volumes.length > 0 ? (
        volumes.map((volume) => {
          const volumeChapters = chaptersByVolume.get(volume.id) || [];
          return (
            <div key={volume.id} className="border border-border-subtle rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-bg-subtle">
                <div>
                  <h3 className="text-sm font-medium text-ink">{volume.title}</h3>
                  {volume.description && (
                    <p className="text-xs text-ink-faint mt-0.5">{volume.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-faint">{volumeChapters.length}章</span>
                  <button
                    className="text-xs text-ink-faint hover:text-danger"
                    onClick={() => onVolumeDelete(volume.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022-.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border-subtle">
                {volumeChapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-bg-subtle transition-colors ${
                      currentChapterId === chapter.id ? 'bg-brand/5' : ''
                    }`}
                    onClick={() => onChapterSelect(chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-faint w-6">{index + 1}</span>
                      <span className="text-sm text-ink">{chapter.title}</span>
                      <span className={`badge text-[10px] ${
                        chapter.status === 'final' ? 'badge-success' :
                        chapter.status === 'draft' ? 'badge-brand' :
                        chapter.status === 'polishing' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {CHAPTER_STATUS_LABELS[chapter.status]}
                      </span>
                    </div>
                    <span className="text-xs text-ink-faint">{chapter.wordCount}字</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-ink-muted">暂无分卷，所有章节将显示在这里</p>
        </div>
      )}

      {chaptersByVolume.get(undefined)?.map((chapter, index) => (
        <div
          key={chapter.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-all ${
            currentChapterId === chapter.id
              ? 'border-brand bg-brand/5'
              : 'border-border-subtle hover:border-border'
          }`}
          onClick={() => onChapterSelect(chapter.id)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-faint w-6">{index + 1}</span>
            <span className="text-sm text-ink">{chapter.title}</span>
            <span className={`badge text-[10px] ${
              chapter.status === 'final' ? 'badge-success' :
              chapter.status === 'draft' ? 'badge-brand' :
              chapter.status === 'polishing' ? 'badge-warning' : 'badge-ghost'
            }`}>
              {CHAPTER_STATUS_LABELS[chapter.status]}
            </span>
          </div>
          <span className="text-xs text-ink-faint">{chapter.wordCount}字</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-bg-subtle rounded-lg p-1">
            {[
              { mode: 'timeline', label: '时间线' },
              { mode: 'corkboard', label: '看板' },
              { mode: 'list', label: '列表' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                className={`px-3 py-1.5 rounded text-xs transition-all ${
                  viewMode === mode
                    ? 'bg-brand text-white'
                    : 'text-ink-muted hover:text-ink'
                }`}
                onClick={() => setViewMode(mode as ViewMode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setShowVolumeModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>添加卷</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'corkboard' && renderCorkboardView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {showVolumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">添加新卷</h3>
            <input
              className="input text-sm w-full mb-4"
              placeholder="卷标题..."
              value={newVolumeTitle}
              onChange={(e) => setNewVolumeTitle(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowVolumeModal(false);
                  setNewVolumeTitle('');
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddVolume}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showSceneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">添加新场景</h3>
            <div className="space-y-3">
              <input
                className="input text-sm w-full"
                placeholder="场景标题..."
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                autoFocus
              />
              <input
                className="input text-sm w-full"
                placeholder="场景目标..."
                value={newSceneGoal}
                onChange={(e) => setNewSceneGoal(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowSceneModal(null);
                  setNewSceneTitle('');
                  setNewSceneGoal('');
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAddScene(showSceneModal)}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineTimeline;
