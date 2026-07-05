import React from 'react';
import type { Suggestion } from '../../types';

interface SuggestionBarProps {
  suggestions: Suggestion[];
  onSuggestionClick: (text: string) => void;
  isLoading?: boolean;
}

const typeIcons: Record<Suggestion['type'], string> = {
  guide_question: '?',
  chapter_topic: '+',
  follow_up: '...',
  summarize: '=',
};

const SuggestionBar: React.FC<SuggestionBarProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading,
}) => {
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="px-6 pb-3">
      {isLoading && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <div className="w-3 h-3 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <span>正在生成建议...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="suggestion-chip group"
            >
              <span className="w-4 h-4 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {typeIcons[suggestion.type]}
              </span>
              <span>{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionBar;
