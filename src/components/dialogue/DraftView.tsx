import React from 'react';
import type { Chapter, ExtractedContent } from '../../types';

interface DraftViewProps {
  chapter: Chapter | null;
  pendingExtracts: ExtractedContent[];
  onConfirmDraft: () => void;
  onGenerateSummary: () => void;
  isGenerating?: boolean;
}

const DraftView: React.FC<DraftViewProps> = ({
  chapter,
  pendingExtracts,
  onConfirmDraft,
  onGenerateSummary,
  isGenerating,
}) => {
  if (!chapter) {
    return (
      <div className="p-4 text-center text-sm text-ink-muted">
        <p>请在左侧对话中选择或创建一个章节</p>
      </div>
    );
  }

  const hasDraft = !!chapter.draftContent;
  const hasContent = !!chapter.content;
  const hasPendingExtracts = pendingExtracts.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <h3 className="text-subheading mb-3">章节草稿</h3>

        {/* 章节信息 */}
        <div className="mb-4 p-3 bg-bg-secondary rounded-lg">
          <p className="text-sm font-medium text-ink-primary">{chapter.title}</p>
          {chapter.timeRange && (
            <p className="text-xs text-ink-muted mt-1">{chapter.timeRange}</p>
          )}
        </div>

        {/* 待确认的提取内容 */}
        {hasPendingExtracts && (
          <div className="mb-4">
            <p className="text-xs text-ink-muted mb-2">
              {pendingExtracts.length} 段内容待确认
            </p>
            {pendingExtracts.map((extract, i) => (
              <div key={i} className="p-2.5 bg-brand-surface rounded-lg mb-2">
                <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
                  {extract.paragraphs[0]}
                </p>
                {extract.timeTag && (
                  <span className="inline-block mt-1 text-[10px] text-info bg-info/10 px-1.5 py-0.5 rounded">
                    {extract.timeTag}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 已有草稿 */}
        {hasDraft && (
          <div className="mb-4">
            <p className="text-xs text-ink-muted mb-2">草稿内容</p>
            <div className="p-3 bg-bg-secondary rounded-lg max-h-[200px] overflow-y-auto">
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                {chapter.draftContent}
              </p>
            </div>
          </div>
        )}

        {/* 已确认内容 */}
        {hasContent && (
          <div className="mb-4">
            <p className="text-xs text-ink-muted mb-2">已写入内容</p>
            <div className="p-3 bg-bg-secondary rounded-lg max-h-[150px] overflow-y-auto">
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap line-clamp-6">
                {chapter.content}
              </p>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!hasDraft && !hasContent && !hasPendingExtracts && (
          <div className="text-center py-6">
            <p className="text-sm text-ink-muted">
              还没有内容，通过左侧对话开始创作吧
            </p>
          </div>
        )}
      </div>

      {/* 固定底部操作按钮 */}
      <div className="shrink-0 p-4 pt-3 border-t border-border-subtle flex flex-col gap-2">
        {hasDraft && (
          <button
            onClick={onConfirmDraft}
            className="w-full px-3 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors"
          >
            确认写入章节
          </button>
        )}
        <button
          onClick={onGenerateSummary}
          disabled={isGenerating || (!hasDraft && !hasContent)}
          className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-ink-secondary text-xs font-medium hover:bg-bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成章节摘要'}
        </button>
      </div>
    </div>
  );
};

export default DraftView;
