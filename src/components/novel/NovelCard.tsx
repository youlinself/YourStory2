import React, { useState } from 'react';
import type { Novel } from '../../types/novel';
import { GENRE_LABELS, NOVEL_STATUS_LABELS } from '../../types/novel';

interface NovelCardProps {
  novel: Novel;
  onClick: () => void;
  onDelete: () => void;
  onExport: () => void;
  isDeleting?: boolean;
}

const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  onClick,
  onDelete,
  onExport,
  isDeleting,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'writing':
        return 'bg-brand';
      case 'completed':
        return 'bg-success';
      case 'paused':
        return 'bg-warning';
      default:
        return 'bg-ink-faint';
    }
  };

  return (
    <div className="card group relative">
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-3 overflow-hidden relative">
          {novel.coverImage ? (
            <img
              src={novel.coverImage}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <svg
                className="w-12 h-12 text-brand/40 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <span className="text-sm text-ink-faint line-clamp-2">{novel.title}</span>
            </div>
          )}

          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white ${getStatusColor(novel.status)}`}>
              {NOVEL_STATUS_LABELS[novel.status]}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-ink truncate mb-1">{novel.title}</h3>

        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-ghost text-xs">{GENRE_LABELS[novel.genre]}</span>
          <span className="text-xs text-ink-faint">
            {novel.chapters.length} 章
          </span>
        </div>

        <p className="text-xs text-ink-muted line-clamp-2 mb-3 min-h-[2.5em]">
          {novel.synopsis || '暂无简介'}
        </p>

        <div className="flex items-center justify-between text-xs text-ink-faint">
          <span>
            {novel.currentWordCount > 0
              ? novel.currentWordCount > 10000
                ? `${(novel.currentWordCount / 10000).toFixed(1)}万字`
                : `${novel.currentWordCount}字`
              : '未开始'}
          </span>
          <span>{formatDate(novel.updatedAt)}</span>
        </div>
      </div>

      <div
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            className="w-7 h-7 rounded-full bg-bg-base/80 backdrop-blur flex items-center justify-center hover:bg-bg-subtle transition-colors"
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg
              className="w-4 h-4 text-ink-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-bg-base border border-border-subtle rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
              <button
                className="w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-bg-subtle flex items-center gap-2"
                onClick={() => {
                  onExport();
                  setShowMenu(false);
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                导出
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-xs text-danger hover:bg-danger/10 flex items-center gap-2"
                onClick={() => {
                  if (confirm('确定要删除这部小说吗？此操作不可恢复。')) {
                    onDelete();
                  }
                  setShowMenu(false);
                }}
                disabled={isDeleting}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </div>
          )}
        </div>
      </div>

      {novel.targetWordCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between text-xs text-ink-faint mb-1">
            <span>进度</span>
            <span>{Math.round((novel.currentWordCount / novel.targetWordCount) * 100)}%</span>
          </div>
          <div className="h-1 bg-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{
                width: `${Math.min(100, (novel.currentWordCount / novel.targetWordCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelCard;
