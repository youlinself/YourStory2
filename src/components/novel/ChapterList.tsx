import React, { useState } from 'react';
import type { NovelChapter } from '../../types/novel';
import { CHAPTER_STATUS_LABELS } from '../../types/novel';

interface ChapterListProps {
  chapters: NovelChapter[];
  currentChapterId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <span className="text-xs font-medium text-ink-muted">章节列表</span>
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

      <div className="flex-1 overflow-y-auto">
        {chapters.length > 0 ? (
          <div className="py-2">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className={`group relative px-3 py-2 cursor-pointer transition-colors ${
                  currentChapterId === chapter.id
                    ? 'bg-brand-surface border-l-2 border-brand'
                    : 'hover:bg-bg-subtle border-l-2 border-transparent'
                } ${dragOverIndex === index ? 'border-t-2 border-t-brand' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
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
              </div>
            ))}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
