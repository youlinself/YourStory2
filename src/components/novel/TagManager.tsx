import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { NovelChapter } from '../../types/novel';

interface TagManagerProps {
  chapters: NovelChapter[];
  onChapterTagAdd: (chapterId: string, tag: string) => void;
  onChapterTagRemove: (chapterId: string, tag: string) => void;
  onBatchTagAdd: (chapterIds: string[], tag: string) => void;
  onBatchTagRemove: (chapterIds: string[], tag: string) => void;
}

interface TagInfo {
  name: string;
  count: number;
  color: string;
}

const TAG_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#84cc16', '#f43f5e', '#8b5cf6', '#0ea5e9',
];

const PRESET_TAGS = [
  { name: '主线', category: '情节' },
  { name: '支线', category: '情节' },
  { name: '高潮', category: '情节' },
  { name: '转折', category: '情节' },
  { name: '伏笔', category: '情节' },
  { name: '回忆', category: '情节' },
  { name: '感情线', category: '情感' },
  { name: '战斗', category: '场景' },
  { name: '日常', category: '场景' },
  { name: '对话', category: '场景' },
  { name: '铺垫', category: '节奏' },
  { name: '悬念', category: '节奏' },
];

const CATEGORIES = ['全部', '情节', '情感', '场景', '节奏', '自定义'];

const TagManager: React.FC<TagManagerProps> = ({
  chapters,
  onChapterTagAdd,
  onChapterTagRemove,
  onBatchTagAdd,
  onBatchTagRemove,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showPresets, setShowPresets] = useState(false);
  const [quickTagChapterId, setQuickTagChapterId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const chapter of chapters) {
      for (const tag of chapter.tags || []) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    const tags: TagInfo[] = [];
    let colorIndex = 0;
    for (const [name, count] of tagMap) {
      tags.push({ name, count, color: TAG_COLORS[colorIndex % TAG_COLORS.length] });
      colorIndex++;
    }
    return tags.sort((a, b) => b.count - a.count);
  }, [chapters]);

  const presetTagNames = useMemo(() => new Set(PRESET_TAGS.map(t => t.name)), []);

  const customTags = useMemo(() => {
    return allTags.filter(t => !presetTagNames.has(t.name));
  }, [allTags, presetTagNames]);

  const categorizedTags = useMemo(() => {
    const result: Record<string, TagInfo[]> = {};
    for (const cat of CATEGORIES) {
      if (cat === '全部') {
        result[cat] = allTags;
      } else if (cat === '自定义') {
        result[cat] = customTags;
      } else {
        const presetNames = new Set(PRESET_TAGS.filter(t => t.category === cat).map(t => t.name));
        result[cat] = allTags.filter(t => presetNames.has(t.name));
      }
    }
    return result;
  }, [allTags, customTags]);

  const filteredChapters = useMemo(() => {
    let filtered = chapters;
    if (filterTag) {
      filtered = filtered.filter((ch) => (ch.tags || []).includes(filterTag));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ch) =>
        ch.title.toLowerCase().includes(query) ||
        (ch.tags || []).some((t) => t.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [chapters, filterTag, searchQuery]);

  const handleAddTag = useCallback(() => {
    const name = newTagName.trim();
    if (!name) return;
    if (selectedChapters.size > 0) {
      onBatchTagAdd(Array.from(selectedChapters), name);
    }
    setNewTagName('');
    setShowPresets(false);
  }, [newTagName, selectedChapters, onBatchTagAdd]);

  const handleTagColor = useCallback((tagName: string) => {
    const tag = allTags.find((t) => t.name === tagName);
    return tag?.color || TAG_COLORS[0];
  }, [allTags]);

  const toggleChapterSelection = useCallback((chapterId: string) => {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedChapters(new Set(filteredChapters.map((ch) => ch.id)));
  }, [filteredChapters]);

  const clearSelection = useCallback(() => {
    setSelectedChapters(new Set());
  }, []);

  const handlePresetClick = useCallback((tagName: string) => {
    if (selectedChapters.size > 0) {
      onBatchTagAdd(Array.from(selectedChapters), tagName);
    } else if (quickTagChapterId) {
      onChapterTagAdd(quickTagChapterId, tagName);
    }
    setNewTagName('');
  }, [selectedChapters, quickTagChapterId, onBatchTagAdd, onChapterTagAdd]);

  const handleQuickTag = useCallback((chapterId: string, tag: string, isAdding: boolean) => {
    if (isAdding) {
      onChapterTagAdd(chapterId, tag);
    } else {
      onChapterTagRemove(chapterId, tag);
    }
  }, [onChapterTagAdd, onChapterTagRemove]);

  const getTagCategory = useCallback((tagName: string) => {
    const preset = PRESET_TAGS.find(t => t.name === tagName);
    return preset?.category || '自定义';
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative" ref={presetRef}>
            <input
              ref={inputRef}
              className="input text-sm w-full pr-8"
              placeholder={selectedChapters.size > 0 ? `为选中的 ${selectedChapters.size} 章添加标签...` : "输入标签名或选择预设..."}
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                setShowPresets(e.target.value.length === 0);
              }}
              onFocus={() => setShowPresets(newTagName.length === 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') {
                  setShowPresets(false);
                  inputRef.current?.blur();
                }
              }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              onClick={() => setShowPresets(!showPresets)}
            >
              <svg className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showPresets && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-base border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                          activeCategory === cat
                            ? 'bg-brand text-white'
                            : 'bg-bg-subtle text-ink-muted hover:text-ink'
                        }`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(categorizedTags[activeCategory] || []).map(tag => (
                      <button
                        key={tag.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-border-subtle hover:border-brand hover:bg-brand/5 transition-colors"
                        onClick={() => handlePresetClick(tag.name)}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span>{tag.name}</span>
                        <span className="text-[10px] text-ink-faint">×{tag.count}</span>
                      </button>
                    ))}
                    {activeCategory === '全部' && PRESET_TAGS.filter(p => !allTags.some(t => t.name === p.name)).map(preset => (
                      <button
                        key={preset.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-dashed border-border-subtle hover:border-brand hover:bg-brand/5 transition-colors text-ink-muted"
                        onClick={() => handlePresetClick(preset.name)}
                      >
                        <span className="w-2 h-2 rounded-full bg-ink-faint" />
                        <span>{preset.name}</span>
                        <span className="text-[10px]">+</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddTag}
            disabled={!newTagName.trim() || (selectedChapters.size === 0 && !quickTagChapterId)}
          >
            添加
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="input text-xs flex-1"
            placeholder="搜索章节..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filterTag && (
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-brand/10 text-brand hover:bg-brand/20"
              onClick={() => setFilterTag(null)}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: handleTagColor(filterTag) }} />
              {filterTag}
              <span>×</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-brand hover:underline"
              onClick={selectAllVisible}
            >
              全选
            </button>
            <button
              className="text-xs text-ink-muted hover:text-ink"
              onClick={clearSelection}
            >
              清除
            </button>
            {selectedChapters.size > 0 && (
              <span className="text-xs text-ink-faint">
                已选 {selectedChapters.size} 章
              </span>
            )}
          </div>
          {selectedChapters.size > 0 && (
            <div className="flex items-center gap-2">
              <select
                className="input text-xs py-1"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onBatchTagAdd(Array.from(selectedChapters), e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">批量添加...</option>
                {allTags.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
              <select
                className="input text-xs py-1"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onBatchTagRemove(Array.from(selectedChapters), e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">批量移除...</option>
                {allTags.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredChapters.length > 0 ? (
              filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedChapters.has(chapter.id)
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.has(chapter.id)}
                      onChange={() => toggleChapterSelection(chapter.id)}
                      className="w-4 h-4 rounded border-border-subtle mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{chapter.title}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(chapter.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white group"
                            style={{ backgroundColor: handleTagColor(tag) }}
                          >
                            <span className="opacity-70 text-[8px]">{getTagCategory(tag)}</span>
                            {tag}
                            <button
                              className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded transition-all"
                              onClick={() => onChapterTagRemove(chapter.id, tag)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border border-dashed border-ink-faint text-ink-faint hover:border-brand hover:text-brand transition-colors"
                          onClick={() => setQuickTagChapterId(quickTagChapterId === chapter.id ? null : chapter.id)}
                        >
                          + 标签
                        </button>
                      </div>
                      {quickTagChapterId === chapter.id && (
                        <div className="mt-2 p-2 bg-bg-subtle rounded-lg">
                          <div className="flex flex-wrap gap-1">
                            {allTags
                              .filter((t) => !(chapter.tags || []).includes(t.name))
                              .slice(0, 10)
                              .map((t) => (
                                <button
                                  key={t.name}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-border-subtle hover:border-brand hover:bg-brand/5 transition-colors"
                                  onClick={() => {
                                    handleQuickTag(chapter.id, t.name, true);
                                    setQuickTagChapterId(null);
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                  {t.name}
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
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-ink-faint mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                <p className="text-sm text-ink-muted">暂无章节</p>
                {filterTag && (
                  <button
                    className="text-xs text-brand hover:underline mt-2"
                    onClick={() => setFilterTag(null)}
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-60 border-l border-border-subtle p-4 overflow-y-auto">
          <h4 className="text-xs font-medium text-ink mb-3">标签概览</h4>
          <div className="space-y-1">
            {allTags.length > 0 ? (
              allTags.map((tag) => (
                <div
                  key={tag.name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    filterTag === tag.name ? 'bg-brand/10' : 'hover:bg-bg-subtle'
                  }`}
                  onClick={() => setFilterTag(filterTag === tag.name ? null : tag.name)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-xs text-ink">{tag.name}</span>
                    <span className="text-[9px] text-ink-faint px-1 py-0.5 rounded bg-bg-subtle">
                      {getTagCategory(tag.name)}
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-faint">{tag.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-faint text-center py-4">暂无标签</p>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <h4 className="text-xs font-medium text-ink mb-2">标签统计</h4>
              <div className="text-[10px] text-ink-faint space-y-1">
                <p>共 {allTags.length} 个标签</p>
                <p>覆盖 {new Set(allTags.flatMap(t => 
                  chapters.filter(ch => (ch.tags || []).includes(t.name)).map(ch => ch.id)
                )).size} 个章节</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagManager;
