import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { NovelChapter, Character } from '../../types/novel';
import NovelAIContextService from '../../services/ai/NovelAIContextService';

type SearchScope = 'all' | 'content' | 'title' | 'characters' | 'notes';
type SearchFilter = 'all' | 'outline' | 'draft' | 'polishing' | 'final';

interface SearchResult {
  type: 'chapter' | 'character' | 'note';
  id: string;
  title: string;
  preview: string;
  matches: string[];
  chapterId?: string;
  relevance: number;
}

interface GlobalSearchProps {
  novelId: string;
  chapters: NovelChapter[];
  characters: Character[];
  onChapterSelect: (chapterId: string) => void;
  onCharacterSelect: (characterId: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  novelId,
  chapters,
  characters,
  onChapterSelect,
  onCharacterSelect,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [statusFilter, setStatusFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const aiContextService = NovelAIContextService.getInstance();

  useEffect(() => {
    const saved = localStorage.getItem('novel_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp' && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex]);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('novel_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const lowerQuery = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      const filteredChapters = statusFilter === 'all'
        ? chapters
        : chapters.filter((ch) => ch.status === statusFilter);

      for (const chapter of filteredChapters) {
        const matches: string[] = [];
        let relevance = 0;

        if (scope === 'all' || scope === 'title') {
          if (chapter.title.toLowerCase().includes(lowerQuery)) {
            matches.push(`标题: ${chapter.title}`);
            relevance += 10;
          }
        }

        if (scope === 'all' || scope === 'content') {
          const contentLower = chapter.content.toLowerCase();
          if (contentLower.includes(lowerQuery)) {
            const index = contentLower.indexOf(lowerQuery);
            const start = Math.max(0, index - 30);
            const end = Math.min(chapter.content.length, index + searchQuery.length + 30);
            const preview = `...${chapter.content.slice(start, end)}...`;
            matches.push(`内容: ${preview}`);
            relevance += 5;

            const count = contentLower.split(lowerQuery).length - 1;
            if (count > 1) {
              relevance += count;
            }
          }
        }

        if (scope === 'all' || scope === 'characters') {
          if (chapter.scenes?.some((s) => s.characters.some((c) => c.toLowerCase().includes(lowerQuery)))) {
            matches.push('角色匹配');
            relevance += 3;
          }
        }

        if (matches.length > 0) {
          searchResults.push({
            type: 'chapter',
            id: chapter.id,
            title: chapter.title,
            preview: chapter.summary || chapter.content.slice(0, 100),
            matches,
            chapterId: chapter.id,
            relevance,
          });
        }
      }

      if (scope === 'all' || scope === 'characters') {
        for (const character of characters) {
          const matches: string[] = [];
          let relevance = 0;

          if (character.name.toLowerCase().includes(lowerQuery)) {
            matches.push(`名称: ${character.name}`);
            relevance += 10;
          }

          if (character.alias.some((a) => a.toLowerCase().includes(lowerQuery))) {
            matches.push(`别名: ${character.alias.filter((a) => a.toLowerCase().includes(lowerQuery)).join(', ')}`);
            relevance += 8;
          }

          if (character.personality.toLowerCase().includes(lowerQuery)) {
            matches.push(`性格: ${character.personality.slice(0, 100)}`);
            relevance += 3;
          }

          if (character.background?.toLowerCase().includes(lowerQuery)) {
            matches.push(`背景: ${character.background.slice(0, 100)}`);
            relevance += 2;
          }

          if (matches.length > 0) {
            searchResults.push({
              type: 'character',
              id: character.id,
              title: character.name,
              preview: character.personality,
              matches,
              relevance,
            });
          }
        }
      }

      searchResults.sort((a, b) => b.relevance - a.relevance);
      setResults(searchResults.slice(0, 50));
      setSelectedIndex(-1);
      setIsSearching(false);
      saveRecentSearch(searchQuery);
    },
    [chapters, characters, scope, statusFilter, saveRecentSearch]
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      performSearch(value);
    },
    [performSearch]
  );

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      if (result.type === 'chapter' && result.chapterId) {
        onChapterSelect(result.chapterId);
      } else if (result.type === 'character') {
        onCharacterSelect(result.id);
      }
    },
    [onChapterSelect, onCharacterSelect]
  );

  const handleRecentClick = useCallback(
    (search: string) => {
      setQuery(search);
      performSearch(search);
    },
    [performSearch]
  );

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-warning/30 text-ink rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const scopeOptions = [
    { value: 'all', label: '全部' },
    { value: 'title', label: '标题' },
    { value: 'content', label: '内容' },
    { value: 'characters', label: '角色' },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'outline', label: '大纲' },
    { value: 'draft', label: '草稿' },
    { value: 'polishing', label: '润色' },
    { value: 'final', label: '定稿' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-base rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <svg className="w-5 h-5 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint"
            placeholder="搜索章节内容、角色名、关键词... (Ctrl+K)"
            value={query}
            onChange={handleSearch}
            autoFocus
          />
          {isSearching && (
            <svg className="w-4 h-4 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <button
            className="text-ink-faint hover:text-ink"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-b border-border-subtle bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-faint">范围:</span>
            <div className="flex gap-1">
              {scopeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    scope === value
                      ? 'bg-brand text-white'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                  onClick={() => setScope(value as SearchScope)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-faint">状态:</span>
            <select
              className="input text-[10px] py-0.5 w-20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SearchFilter)}
            >
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="p-4">
              <span className="text-xs text-ink-faint">最近搜索</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    className="px-2 py-1 rounded bg-bg-subtle text-xs text-ink-muted hover:text-ink hover:bg-bg-base transition-colors"
                    onClick={() => handleRecentClick(search)}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-border-subtle">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-brand/10' : 'hover:bg-bg-subtle'
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      result.type === 'chapter' ? 'bg-brand/10 text-brand' : 'bg-success/10 text-success'
                    }`}>
                      {result.type === 'chapter' ? '章节' : '角色'}
                    </span>
                    <span className="text-sm font-medium text-ink">
                      {highlightMatch(result.title, query)}
                    </span>
                    <span className="text-[10px] text-ink-faint ml-auto">
                      相关度: {result.relevance}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted line-clamp-2">
                    {highlightMatch(result.preview, query)}
                  </p>
                  {result.matches.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.matches.slice(0, 3).map((match, idx) => (
                        <span key={idx} className="text-[10px] text-ink-faint bg-bg-subtle px-1 rounded">
                          {match}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {query.trim() !== '' && results.length === 0 && !isSearching && (
            <div className="p-8 text-center">
              <p className="text-ink-muted">未找到匹配结果</p>
              <p className="text-xs text-ink-faint mt-1">尝试使用不同的关键词或扩大搜索范围</p>
            </div>
          )}

          {query.trim() === '' && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-ink-muted">输入关键词开始搜索</p>
              <p className="text-xs text-ink-faint mt-1">支持搜索章节标题、内容、角色名等</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle bg-bg-subtle/50 text-[10px] text-ink-faint">
          <span>↑↓ 选择 · ↵ 打开 · ESC 关闭</span>
          {results.length > 0 && <span>{results.length} 个结果</span>}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
