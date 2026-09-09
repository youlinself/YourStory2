import React from 'react';
import type { Autobiography, Chapter, ExtractedContent } from '../../types';
import OutlineView from './OutlineView';
import DraftView from './DraftView';

interface SidePanelProps {
  isOpen: boolean;
  mode: 'outline' | 'draft';
  onModeChange: (mode: 'outline' | 'draft') => void;
  onClose: () => void;
  // Outline props
  autobiography: Autobiography | null;
  currentChapterId: string | null;
  onSwitchChapter: (chapterId: string | null) => void;
  onCreateChapter: () => void;
  // Draft props
  currentChapter: Chapter | null;
  pendingExtracts: ExtractedContent[];
  onConfirmDraft: () => void;
  onGenerateSummary: () => void;
  isGenerating?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  autobiography,
  currentChapterId,
  onSwitchChapter,
  onCreateChapter,
  currentChapter,
  pendingExtracts,
  onConfirmDraft,
  onGenerateSummary,
  isGenerating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* 标签切换 */}
      <div className="flex shrink-0 border-b border-border-subtle">
        <button
          onClick={() => onModeChange('outline')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mode === 'outline'
              ? 'text-brand border-b-2 border-brand bg-brand-surface'
              : 'text-ink-muted hover:text-ink-secondary'
          }`}
        >
          大纲
        </button>
        <button
          onClick={() => onModeChange('draft')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mode === 'draft'
              ? 'text-brand border-b-2 border-brand bg-brand-surface'
              : 'text-ink-muted hover:text-ink-secondary'
          }`}
        >
          草稿
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2.5 text-ink-muted hover:text-ink-secondary transition-colors"
          title="关闭面板"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {mode === 'outline' ? (
          <OutlineView
            autobiography={autobiography}
            currentChapterId={currentChapterId}
            onSwitchChapter={onSwitchChapter}
            onCreateChapter={onCreateChapter}
          />
        ) : (
          <DraftView
            chapter={currentChapter}
            pendingExtracts={pendingExtracts}
            onConfirmDraft={onConfirmDraft}
            onGenerateSummary={onGenerateSummary}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
};

export default SidePanel;
