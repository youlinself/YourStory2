import React from 'react';
import type { Suggestion } from '../../types';

interface SuggestionBarProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  isGenerating?: boolean;
}

const typeLabels: Record<Suggestion['type'], string> = {
  guide_question: '引导问题',
  chapter_topic: '章节主题',
  follow_up: '深入追问',
  summarize: '总结建议',
};

const typeColors: Record<Suggestion['type'], string> = {
  guide_question: 'bg-sage/10 text-sage border-sage/20',
  chapter_topic: 'bg-brand/10 text-brand border-brand/20',
  follow_up: 'bg-gold/10 text-gold border-gold/20',
  summarize: 'bg-info/10 text-info border-info/20',
};

const SuggestionBar: React.FC<SuggestionBarProps> = ({
  suggestions,
  onSuggestionClick,
  isGenerating,
}) => {
  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border-subtle bg-bg-subtle/50">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-ink-muted">正在生成智能建议...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border-subtle bg-bg-subtle/30">
      <div className="flex items-center gap-2 px-4 py-2">
        <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        <span className="text-xs text-ink-muted shrink-0">智能建议</span>
      </div>
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-thin">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${typeColors[suggestion.type]}`}
          >
            <span className="block text-[10px] opacity-70 mb-0.5">{typeLabels[suggestion.type]}</span>
            <span className="block text-xs font-medium line-clamp-2 max-w-[200px]">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionBar;
