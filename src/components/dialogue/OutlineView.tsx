import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Autobiography } from '../../types';

interface OutlineViewProps {
  autobiography: Autobiography | null;
  currentChapterId: string | null;
  onSwitchChapter: (chapterId: string | null) => void;
  onCreateChapter: () => void;
}

const statusConfig = {
  empty: { icon: '○', color: 'text-ink-faint', bg: 'bg-ink-faint/10' },
  draft: { icon: '◐', color: 'text-warning', bg: 'bg-warning/10' },
  in_progress: { icon: '◉', color: 'text-brand', bg: 'bg-brand/10' },
  completed: { icon: '●', color: 'text-success', bg: 'bg-success/10' },
};

const OutlineView: React.FC<OutlineViewProps> = ({
  autobiography,
  currentChapterId,
  onSwitchChapter,
  onCreateChapter,
}) => {
  const navigate = useNavigate();
  const chapters = autobiography?.chapters || [];

  const completedCount = chapters.filter((ch) => ch.status === 'completed').length;
  const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full p-4 min-h-0">
      <h3 className="text-subheading mb-3 shrink-0">自传大纲</h3>

      {/* 进度条 */}
      {chapters.length > 0 && (
        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
            <span>创作进度</span>
            <span>{completedCount}/{chapters.length} 章</span>
          </div>
          <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 自由对话入口 */}
      <button
        onClick={() => onSwitchChapter(null)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1.5 shrink-0 ${
          currentChapterId === null
            ? 'bg-brand-surface text-brand font-medium'
            : 'text-ink-secondary hover:bg-bg-secondary'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          自由对话
        </span>
      </button>

      {/* 章节列表 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {chapters.map((chapter, index) => {
          const status = statusConfig[chapter.status || 'empty'];
          const isCurrent = chapter.id === currentChapterId;
          return (
            <button
              key={chapter.id}
              onClick={() => onSwitchChapter(chapter.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-brand-surface text-brand font-medium'
                  : 'text-ink-secondary hover:bg-bg-secondary'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`${status.color} text-base leading-none shrink-0`}>{status.icon}</span>
                <span className="truncate">
                  {index + 1}. {chapter.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部操作 - 固定不滚动 */}
      <div className="shrink-0 pt-2 border-t border-border-subtle space-y-1.5">
        {/* 添加章节 */}
        <button
          onClick={onCreateChapter}
          className="w-full px-3 py-2 rounded-lg text-sm text-brand border border-dashed border-brand/30 hover:bg-brand-surface transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加新章节
        </button>

        {/* 查看完整自传 */}
        <button
          onClick={() => navigate('/autobiography')}
          className="w-full px-3 py-2 rounded-lg text-xs text-ink-muted hover:text-ink-secondary hover:bg-bg-secondary transition-colors"
        >
          查看完整自传 →
        </button>
      </div>
    </div>
  );
};

export default OutlineView;
