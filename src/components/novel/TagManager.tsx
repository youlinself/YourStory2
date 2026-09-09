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

interface QuickTagPanelProps {
  chapter: NovelChapter;
  onAddTag: (tag: string) => void;
  onClose: () => void;
}

const QuickTagPanel: React.FC<QuickTagPanelProps> = ({ chapter, onAddTag, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const chapterTagNames = useMemo(() => new Set(chapter.tags || []), [chapter.tags]);

  const availablePresets = useMemo(() => {
    return PRESET_TAGS.filter(p => !chapterTagNames.has(p.name));
  }, [chapterTagNames]);

  const categorizedPresets = useMemo(() => {
    const result: Record<string, typeof PRESET_TAGS> = {};
    for (const cat of CATEGORIES) {
      if (cat === '全部') {
        result[cat] = availablePresets;
      } else {
        result[cat] = availablePresets.filter(p => p.category === cat);
      }
    }
    return result;
  }, [availablePresets]);

  const handleAddCustomTag = useCallback(() => {
    const tag = inputValue.trim();
    if (tag && !chapterTagNames.has(tag)) {
      onAddTag(tag);
    }
    setInputValue('');
  }, [inputValue, chapterTagNames, onAddTag]);

  return (
    <div className="mt-2 p-3 bg-bg-base border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-ink-muted">为「{chapter.title}」添加标签</span>
        <button
          className="text-ink-faint hover:text-ink"
          onClick={onClose}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {CATEGORIES.filter(cat => cat !== '自定义').map(cat => (
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

      <div className="flex flex-wrap gap-1 mb-2">
        {categorizedPresets[activeCategory]?.map(preset => (
          <button
            key={preset.name}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-border-subtle hover:border-brand hover:bg-brand/5 transition-colors"
            onClick={() => onAddTag(preset.name)}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TAG_COLORS[PRESET_TAGS.indexOf(preset) % TAG_COLORS.length] }} />
            <span>{preset.name}</span>
          </button>
        ))}
        {(!categorizedPresets[activeCategory] || categorizedPresets[activeCategory].length === 0) && (
          <span className="text-[10px] text-ink-faint">该分类下暂无可用标签</span>
        )}
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-border-subtle">
        <input
          ref={inputRef}
          className="flex-1 px-2 py-1 text-xs bg-bg-subtle border border-border-subtle rounded focus:outline-none focus:border-brand"
          placeholder="输入自定义标签..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCustomTag();
            if (e.key === 'Escape') onClose();
          }}
        />
        <button
          className="px-2 py-1 text-xs bg-brand text-white rounded hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddCustomTag}
          disabled={!inputValue.trim()}
        >
          添加
        </button>
      </div>
    </div>
  );
};

interface TagManageModalProps {
  chapters: NovelChapter[];
  onClose: () => void;
}

const TagManageModal: React.FC<TagManageModalProps> = ({ chapters, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('全部');

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const chapter of chapters) {
      for (const tag of chapter.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return counts;
  }, [chapters]);

  const allTagNames = useMemo(() => {
    const names = new Set<string>();
    for (const preset of PRESET_TAGS) {
      names.add(preset.name);
    }
    for (const chapter of chapters) {
      for (const tag of chapter.tags || []) {
        names.add(tag);
      }
    }
    return Array.from(names);
  }, [chapters]);

  const presetTagNames = useMemo(() => new Set(PRESET_TAGS.map(p => p.name)), []);

  const getTagColor = useCallback((tagName: string) => {
    const presetIndex = PRESET_TAGS.findIndex(p => p.name === tagName);
    if (presetIndex >= 0) {
      return TAG_COLORS[presetIndex % TAG_COLORS.length];
    }
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }, []);

  const getTagCategory = useCallback((tagName: string) => {
    const preset = PRESET_TAGS.find(p => p.name === tagName);
    return preset?.category || '自定义';
  }, []);

  const categorizedTags = useMemo(() => {
    const result: Record<string, Array<{ name: string; count: number }>> = {};
    for (const cat of CATEGORIES) {
      if (cat === '全部') {
        result[cat] = allTagNames.map(name => ({ name, count: tagCounts.get(name) || 0 }));
      } else if (cat === '自定义') {
        result[cat] = allTagNames
          .filter(name => !presetTagNames.has(name))
          .map(name => ({ name, count: tagCounts.get(name) || 0 }));
      } else {
        result[cat] = allTagNames
          .filter(name => getTagCategory(name) === cat)
          .map(name => ({ name, count: tagCounts.get(name) || 0 }));
      }
    }
    return result;
  }, [allTagNames, tagCounts, presetTagNames, getTagCategory]);

  const totalTags = allTagNames.length;
  const usedTags = Array.from(tagCounts.keys()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg-base rounded-lg shadow-xl w-[480px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h3 className="text-sm font-medium text-ink">标签管理</h3>
          <button
            className="text-ink-faint hover:text-ink"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <div className="flex-1 p-3 bg-bg-subtle rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">预设标签</span>
                <span className="text-xs text-ink-faint">{PRESET_TAGS.length} 个</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">已使用标签</span>
                <span className="text-xs text-ink-faint">{usedTags} 个</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">自定义标签</span>
                <span className="text-xs text-ink-faint">{totalTags - PRESET_TAGS.length} 个</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand text-white'
                    : 'bg-bg-subtle text-ink-muted hover:text-ink'
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                <span className="ml-1 opacity-60">
                  ({categorizedTags[cat]?.length || 0})
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {categorizedTags[activeCategory]?.map(tag => {
              const isPreset = presetTagNames.has(tag.name);
              return (
                <div
                  key={tag.name}
                  className="flex items-center justify-between p-2 rounded hover:bg-bg-subtle"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getTagColor(tag.name) }}
                    />
                    <span className="text-sm text-ink">{tag.name}</span>
                    {isPreset && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-ink-faint">
                        预设
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-faint">
                      {tag.count > 0 ? `${tag.count} 章` : '未使用'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border-subtle">
          <p className="text-[10px] text-ink-faint mb-2">
            提示：标签通过点击章节的「+ 标签」按钮添加到对应章节。预设标签可直接选用，自定义标签会自动保存。
          </p>
        </div>
      </div>
    </div>
  );
};

const TagManager: React.FC<TagManagerProps> = ({
  chapters,
  onChapterTagAdd,
  onChapterTagRemove,
  onBatchTagAdd,
  onBatchTagRemove,
}) => {
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTagChapterId, setQuickTagChapterId] = useState<string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);

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
      <div className="px-4 py-3 border-b border-border-subtle space-y-2">
        <div className="flex items-center gap-2">
          <input
            className="input text-xs flex-1"
            placeholder="搜索章节或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-xs inline-flex items-center gap-1"
            onClick={() => setShowManageModal(true)}
            title="管理所有标签"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            标签管理
          </button>
        </div>

        {filterTag && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-faint">筛选:</span>
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-brand/10 text-brand hover:bg-brand/20"
              onClick={() => setFilterTag(null)}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: handleTagColor(filterTag) }} />
              {filterTag}
              <span>×</span>
            </button>
          </div>
        )}

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
                        <QuickTagPanel
                          chapter={chapter}
                          onAddTag={(tag) => {
                            handleQuickTag(chapter.id, tag, true);
                            setQuickTagChapterId(null);
                          }}
                          onClose={() => setQuickTagChapterId(null)}
                        />
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

        <div className="w-56 border-l border-border-subtle p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-ink">标签概览</h4>
            <button
              className="text-[10px] text-brand hover:underline"
              onClick={() => setShowManageModal(true)}
            >
              管理
            </button>
          </div>
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
                    <span className="text-xs text-ink truncate max-w-[80px]">{tag.name}</span>
                  </div>
                  <span className="text-[10px] text-ink-faint">{tag.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <svg className="w-8 h-8 text-ink-faint mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                <p className="text-xs text-ink-faint mb-2">暂无标签</p>
                <button
                  className="text-xs text-brand hover:underline"
                  onClick={() => setShowManageModal(true)}
                >
                  查看预设
                </button>
              </div>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <h4 className="text-xs font-medium text-ink mb-2">统计</h4>
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

      {showManageModal && (
        <TagManageModal
          chapters={chapters}
          onClose={() => setShowManageModal(false)}
        />
      )}
    </div>
  );
};

export default TagManager;
