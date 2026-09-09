import React, { useState, useMemo, useCallback } from 'react';
import type { NovelChapter, Volume } from '../../types/novel';
import { CHAPTER_STATUS_LABELS } from '../../types/novel';

interface ChapterListProps {
  chapters: NovelChapter[];
  volumes: Volume[];
  currentChapterId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onChapterMoveToVolume: (chapterId: string, volumeId: string | undefined) => void;
  onTagAdd?: (chapterId: string, tag: string) => void;
  onTagRemove?: (chapterId: string, tag: string) => void;
}

const TAG_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#84cc16', '#f43f5e', '#8b5cf6', '#0ea5e9',
];

const PRESET_TAGS = ['主线', '支线', '高潮', '转折', '伏笔', '回忆', '感情线', '战斗', '日常', '对话', '铺垫', '悬念'];

const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  volumes,
  currentChapterId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onChapterMoveToVolume,
  onTagAdd,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set(volumes.map(v => v.id)));
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [quickTagChapterId, setQuickTagChapterId] = useState<string | null>(null);

  const { chaptersByVolume, unassignedChapters } = useMemo(() => {
    const map = new Map<string, NovelChapter[]>();
    for (const volume of volumes) {
      const volumeChapters = chapters.filter((ch) => ch.volumeId === volume.id);
      map.set(volume.id, volumeChapters);
    }
    const unassigned = chapters.filter((ch) => !ch.volumeId);
    return { chaptersByVolume: map, unassignedChapters: unassigned };
  }, [chapters, volumes]);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, Set<string>>();
    for (const chapter of chapters) {
      for (const tag of chapter.tags || []) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, new Set());
        }
        tagMap.get(tag)!.add(chapter.id);
      }
    }
    return Array.from(tagMap.entries())
      .map(([name, chapterIds]) => ({ name, count: chapterIds.size }))
      .sort((a, b) => b.count - a.count);
  }, [chapters]);

  const displayChapters = useMemo(() => {
    if (!tagFilter) return null;
    return chapters.filter(ch => (ch.tags || []).includes(tagFilter));
  }, [chapters, tagFilter]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    onReorder(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleVolumeDrop = (e: React.DragEvent, volumeId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex < chapters.length) {
      const chapterId = chapters[draggedIndex].id;
      onChapterMoveToVolume(chapterId, volumeId);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleVolumeExpand = (volumeId: string) => {
    setExpandedVolumes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId);
      } else {
        newSet.add(volumeId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'bg-success';
      case 'polishing':
        return 'bg-warning';
      case 'draft':
        return 'bg-brand';
      default:
        return 'bg-ink-faint';
    }
  };

  const getTagColor = useCallback((tagName: string) => {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }, []);

  const totalWordsInVolume = (volumeId: string) => {
    const volChapters = chaptersByVolume.get(volumeId) || [];
    return volChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  };

  const renderChapter = (chapter: NovelChapter, _index: number, globalIndex: number) => (
    <div
      key={chapter.id}
      className={`group relative px-3 py-2 cursor-pointer transition-colors ${
        currentChapterId === chapter.id
          ? 'bg-brand-surface border-l-2 border-brand'
          : 'hover:bg-bg-subtle border-l-2 border-transparent'
      } ${dragOverIndex === globalIndex ? 'border-t-2 border-t-brand' : ''}`}
      draggable
      onDragStart={(e) => handleDragStart(e, globalIndex)}
      onDragOver={(e) => handleDragOver(e, globalIndex)}
      onDrop={(e) => handleDrop(e, globalIndex)}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(chapter.id)}
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-ink-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(chapter.status)}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink truncate">{chapter.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-ink-faint">
            <span>{CHAPTER_STATUS_LABELS[chapter.status]}</span>
            {chapter.wordCount > 0 && <span>{chapter.wordCount}字</span>}
          </div>
          {(chapter.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {(chapter.tags || []).slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="inline-block px-1 py-0.5 rounded text-[8px] text-white truncate max-w-[60px]"
                  style={{ backgroundColor: getTagColor(tag) }}
                  title={tag}
                >
                  {tag}
                </span>
              ))}
              {(chapter.tags || []).length > 3 && (
                <span className="text-[8px] text-ink-faint">+{chapter.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <button
          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chapter.id);
          }}
          title="删除章节"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {quickTagChapterId === chapter.id && onTagAdd && (
        <div className="mt-2 p-2 bg-bg-subtle rounded-lg" onClick={e => e.stopPropagation()}>
          <p className="text-[10px] text-ink-faint mb-1">快速添加标签:</p>
          <div className="flex flex-wrap gap-1">
            {PRESET_TAGS.filter(t => !(chapter.tags || []).includes(t)).map(tag => (
              <button
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] border border-border-subtle hover:border-brand hover:bg-brand/5 transition-colors"
                onClick={() => {
                  onTagAdd(chapter.id, tag);
                  setQuickTagChapterId(null);
                }}
              >
                {tag}
              </button>
            ))}
            <button
              className="text-[10px] text-brand hover:underline"
              onClick={() => setQuickTagChapterId(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTagFilter = () => {
    if (allTags.length === 0) return null;
    return (
      <div className="px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-ink-faint">按标签筛选</span>
          {tagFilter && (
            <button
              className="text-[10px] text-brand hover:underline"
              onClick={() => setTagFilter(null)}
            >
              清除
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {allTags.slice(0, 8).map(tag => (
            <button
              key={tag.name}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                tagFilter === tag.name
                  ? 'bg-brand text-white'
                  : 'bg-bg-subtle text-ink-muted hover:text-ink'
              }`}
              onClick={() => setTagFilter(tagFilter === tag.name ? null : tag.name)}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tagFilter === tag.name ? '#fff' : getTagColor(tag.name) }} />
              {tag.name}
              <span className="opacity-60">×{tag.count}</span>
            </button>
          ))}
          {allTags.length > 8 && (
            <span className="text-[10px] text-ink-faint self-center">+{allTags.length - 8}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <span className="text-xs font-medium text-ink-muted">章节列表</span>
        <div className="flex items-center gap-2">
          {onTagAdd && (
            <button
              className="w-6 h-6 rounded-full bg-bg-subtle text-ink-faint flex items-center justify-center hover:bg-brand/10 hover:text-brand transition-colors"
              onClick={() => {
                if (currentChapterId) {
                  setQuickTagChapterId(quickTagChapterId === currentChapterId ? null : currentChapterId);
                }
              }}
              title="快速添加标签"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </button>
          )}
          <button
            className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand/20 transition-colors"
            onClick={onAdd}
            title="添加章节"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {renderTagFilter()}

      <div className="flex-1 overflow-y-auto">
        {displayChapters !== null ? (
          <div className="py-2">
            <div className="px-3 py-2 bg-brand/5 border-b border-brand/20">
              <p className="text-xs text-brand">
                标签 "{tagFilter}" 的章节 ({displayChapters.length})
              </p>
            </div>
            {displayChapters.length > 0 ? (
              <div className="pl-2">
                {displayChapters.map((chapter, chapterIndex) =>
                  renderChapter(chapter, chapterIndex, chapters.indexOf(chapter))
                )}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs text-ink-faint">
                没有匹配的章节
              </div>
            )}
          </div>
        ) : volumes.length > 0 || unassignedChapters.length > 0 ? (
          <div className="py-2">
            {volumes.map((volume, volumeIndex) => {
              const volumeChapters = chaptersByVolume.get(volume.id) || [];
              const isExpanded = expandedVolumes.has(volume.id);
              const volumeWords = totalWordsInVolume(volume.id);
              return (
                <div key={volume.id} className="mb-1">
                  <div
                    className="flex items-center gap-2 px-3 py-2 bg-bg-subtle cursor-pointer hover:bg-bg-subtle/80 transition-colors"
                    onClick={() => toggleVolumeExpand(volume.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => handleVolumeDrop(e, volume.id)}
                  >
                    <svg
                      className={`w-3 h-3 text-ink-faint transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">
                        第{volumeIndex + 1}卷 · {volume.title}
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        {volumeChapters.length}章 · {volumeWords > 10000 ? `${(volumeWords / 10000).toFixed(1)}万字` : `${volumeWords}字`}
                      </p>
                    </div>
                  </div>
                  {isExpanded && volumeChapters.length > 0 && (
                    <div className="pl-2">
                      {volumeChapters.map((chapter, chapterIndex) =>
                        renderChapter(chapter, chapterIndex, chapters.indexOf(chapter))
                      )}
                    </div>
                  )}
                  {isExpanded && volumeChapters.length === 0 && (
                    <div className="px-4 py-3 text-center text-[10px] text-ink-faint">
                      拖拽章节到此处
                    </div>
                  )}
                </div>
              );
            })}

            {unassignedChapters.length > 0 && (
              <div className="mb-1">
                <div
                  className="flex items-center gap-2 px-3 py-2 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => handleVolumeDrop(e, undefined)}
                >
                  <svg className="w-4 h-4 text-warning shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">未分配分卷</p>
                    <p className="text-[10px] text-ink-faint">{unassignedChapters.length}章</p>
                  </div>
                </div>
                <div className="pl-2">
                  {unassignedChapters.map((chapter, chapterIndex) =>
                    renderChapter(chapter, chapterIndex, chapters.indexOf(chapter))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <svg
              className="w-10 h-10 text-ink-faint mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.35H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-xs text-ink-faint mb-3">还没有章节</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={onAdd}
            >
              添加第一个章节
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterList;
