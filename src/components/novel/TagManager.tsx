import React, { useState, useCallback, useMemo } from 'react';
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
];

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

  const handleAddTag = useCallback(() => {
    const name = newTagName.trim();
    if (!name) return;
    if (selectedChapters.size > 0) {
      onBatchTagAdd(Array.from(selectedChapters), name);
    }
    setNewTagName('');
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <input
            className="input text-sm flex-1"
            placeholder="新建标签..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddTag}
            disabled={!newTagName.trim() || selectedChapters.size === 0}
          >
            添加
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            className="input text-xs flex-1"
            placeholder="搜索章节或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filterTag && (
            <button
              className="px-2 py-1 rounded text-xs bg-brand/10 text-brand hover:bg-brand/20"
              onClick={() => setFilterTag(null)}
            >
              {filterTag} ×
            </button>
          )}
        </div>

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
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedChapters.has(chapter.id)
                    ? 'border-brand bg-brand/5'
                    : 'border-border-subtle hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedChapters.has(chapter.id)}
                    onChange={() => toggleChapterSelection(chapter.id)}
                    className="w-4 h-4 rounded border-border-subtle"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{chapter.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(chapter.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: handleTagColor(tag) }}
                        >
                          {tag}
                          <button
                            className="hover:opacity-70"
                            onClick={() => onChapterTagRemove(chapter.id, tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <select
                    className="input text-xs py-1 w-24"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onChapterTagAdd(chapter.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ 标签</option>
                    {allTags
                      .filter((t) => !(chapter.tags || []).includes(t.name))
                      .map((t) => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-56 border-l border-border-subtle p-4 overflow-y-auto">
          <h4 className="text-xs font-medium text-ink mb-3">所有标签</h4>
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
                  </div>
                  <span className="text-[10px] text-ink-faint">{tag.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-faint text-center py-4">暂无标签</p>
            )}
          </div>

          {selectedChapters.size > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <h4 className="text-xs font-medium text-ink mb-2">批量操作</h4>
              <div className="space-y-2">
                <select
                  className="input text-xs w-full"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onBatchTagAdd(Array.from(selectedChapters), e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">添加标签...</option>
                  {allTags.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <select
                  className="input text-xs w-full"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onBatchTagRemove(Array.from(selectedChapters), e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">移除标签...</option>
                  {allTags.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagManager;
