import React, { useState, useCallback, useMemo } from 'react';
import type { NovelChapter } from '../../types/novel';
import { generateId } from '../../utils';

export type PlotThreadType = 'foreshadowing' | 'clue' | 'conflict' | 'subplot' | 'mystery' | 'romance' | 'quest';
export type PlotThreadStatus = 'active' | 'resolved' | 'dormant' | 'abandoned';

export interface PlotThread {
  id: string;
  novelId: string;
  type: PlotThreadType;
  status: PlotThreadStatus;
  title: string;
  description: string;
  setupChapterId: string;
  setupChapterTitle: string;
  setupPosition?: number;
  resolutionChapterId?: string;
  resolutionChapterTitle?: string;
  relatedCharacters: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PlotThreadTrackerProps {
  novelId: string;
  chapters: NovelChapter[];
  plotThreads: PlotThread[];
  onPlotThreadAdd: (thread: Omit<PlotThread, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onPlotThreadUpdate: (threadId: string, updates: Partial<PlotThread>) => void;
  onPlotThreadDelete: (threadId: string) => void;
  onChapterSelect: (chapterId: string) => void;
}

const PLOT_TYPE_LABELS: Record<PlotThreadType, string> = {
  foreshadowing: '伏笔',
  clue: '线索',
  conflict: '冲突',
  subplot: '支线',
  mystery: '悬念',
  romance: '感情线',
  quest: '任务线',
};

const PLOT_TYPE_ICONS: Record<PlotThreadType, string> = {
  foreshadowing: '🔮',
  clue: '🔍',
  conflict: '⚔️',
  subplot: '🌿',
  mystery: '❓',
  romance: '💕',
  quest: '🎯',
};

const PLOT_TYPE_COLORS: Record<PlotThreadType, string> = {
  foreshadowing: '#8b5cf6',
  clue: '#f59e0b',
  conflict: '#ef4444',
  subplot: '#10b981',
  mystery: '#6366f1',
  romance: '#ec4899',
  quest: '#14b8a6',
};

const STATUS_LABELS: Record<PlotThreadStatus, string> = {
  active: '进行中',
  resolved: '已解决',
  dormant: '休眠中',
  abandoned: '已废弃',
};

const STATUS_COLORS: Record<PlotThreadStatus, string> = {
  active: '#10b981',
  resolved: '#6b7280',
  dormant: '#f59e0b',
  abandoned: '#ef4444',
};

const PlotThreadTracker: React.FC<PlotThreadTrackerProps> = ({
  novelId,
  chapters,
  plotThreads,
  onPlotThreadAdd,
  onPlotThreadUpdate,
  onPlotThreadDelete,
  onChapterSelect,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<PlotThreadType>('clue');
  const [selectedStatus, setSelectedStatus] = useState<PlotThreadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  const [newThread, setNewThread] = useState({
    title: '',
    description: '',
    type: 'clue' as PlotThreadType,
    setupChapterId: '',
    relatedCharacters: [] as string[],
    tags: [] as string[],
    notes: '',
  });

  const filteredThreads = useMemo(() => {
    let filtered = plotThreads;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    if (selectedType) {
      filtered = filtered.filter((t) => t.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [plotThreads, selectedStatus, selectedType, searchQuery]);

  const threadsByChapter = useMemo(() => {
    const map = new Map<string, PlotThread[]>();
    for (const thread of plotThreads) {
      const list = map.get(thread.setupChapterId) || [];
      list.push(thread);
      map.set(thread.setupChapterId, list);
    }
    return map;
  }, [plotThreads]);

  const handleAddThread = useCallback(() => {
    if (!newThread.title.trim() || !newThread.setupChapterId) return;

    const setupChapter = chapters.find((ch) => ch.id === newThread.setupChapterId);
    if (!setupChapter) return;

    onPlotThreadAdd({
      novelId,
      type: newThread.type,
      status: 'active',
      title: newThread.title.trim(),
      description: newThread.description.trim(),
      setupChapterId: newThread.setupChapterId,
      setupChapterTitle: setupChapter.title,
      relatedCharacters: newThread.relatedCharacters,
      tags: newThread.tags,
      notes: newThread.notes.trim(),
    });

    setNewThread({
      title: '',
      description: '',
      type: 'clue',
      setupChapterId: '',
      relatedCharacters: [],
      tags: [],
      notes: '',
    });
    setShowAddModal(false);
  }, [newThread, chapters, novelId, onPlotThreadAdd]);

  const handleStatusChange = useCallback(
    (threadId: string, status: PlotThreadStatus) => {
      const updates: Partial<PlotThread> = { status };
      if (status === 'resolved') {
        const lastChapter = chapters[chapters.length - 1];
        if (lastChapter) {
          updates.resolutionChapterId = lastChapter.id;
          updates.resolutionChapterTitle = lastChapter.title;
        }
      }
      onPlotThreadUpdate(threadId, updates);
    },
    [chapters, onPlotThreadUpdate]
  );

  const stats = useMemo(() => {
    const active = plotThreads.filter((t) => t.status === 'active').length;
    const resolved = plotThreads.filter((t) => t.status === 'resolved').length;
    const dormant = plotThreads.filter((t) => t.status === 'dormant').length;
    return { active, resolved, dormant, total: plotThreads.length };
  }, [plotThreads]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">状态:</span>
            <select
              className="input text-xs py-1 w-24"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PlotThreadStatus | 'all')}
            >
              <option value="all">全部</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">类型:</span>
            <select
              className="input text-xs py-1 w-24"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as PlotThreadType)}
            >
              {Object.entries(PLOT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <input
            className="input text-xs py-1 w-48"
            placeholder="搜索线索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint">
            {stats.active} 进行中 / {stats.resolved} 已解决
          </span>
          <button
            className="btn btn-primary btn-sm text-xs"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>添加线索</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="border border-border-subtle rounded-lg overflow-hidden transition-all hover:border-border"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${PLOT_TYPE_COLORS[thread.type]}20` }}
                      >
                        {PLOT_TYPE_ICONS[thread.type]}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{thread.title}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${STATUS_COLORS[thread.status]}20`,
                              color: STATUS_COLORS[thread.status],
                            }}
                          >
                            {STATUS_LABELS[thread.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-ink-faint">
                            {PLOT_TYPE_LABELS[thread.type]}
                          </span>
                          <span className="text-xs text-ink-faint">·</span>
                          <span
                            className="text-xs text-brand cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChapterSelect(thread.setupChapterId);
                            }}
                          >
                            {thread.setupChapterTitle}
                          </span>
                          {thread.resolutionChapterTitle && (
                            <>
                              <span className="text-xs text-ink-faint">→</span>
                              <span className="text-xs text-success">{thread.resolutionChapterTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {thread.relatedCharacters.length > 0 && (
                        <div className="flex -space-x-1">
                          {thread.relatedCharacters.slice(0, 3).map((char, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-bg-subtle border border-border-subtle flex items-center justify-center text-[10px] text-ink-faint"
                              title={char}
                            >
                              {char.charAt(0)}
                            </div>
                          ))}
                          {thread.relatedCharacters.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-bg-subtle border border-border-subtle flex items-center justify-center text-[10px] text-ink-faint">
                              +{thread.relatedCharacters.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <svg
                        className={`w-4 h-4 text-ink-faint transition-transform ${
                          expandedThread === thread.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {expandedThread === thread.id && (
                    <div className="px-4 pb-4 border-t border-border-subtle">
                      <div className="pt-3 space-y-3">
                        {thread.description && (
                          <p className="text-xs text-ink-muted">{thread.description}</p>
                        )}

                        {thread.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {thread.tags.map((tag, idx) => (
                              <span key={idx} className="badge badge-ghost text-[10px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {thread.notes && (
                          <div className="p-2 rounded bg-bg-subtle">
                            <span className="text-[10px] text-ink-faint">备注: </span>
                            <span className="text-xs text-ink-muted">{thread.notes}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-ink-faint">状态变更:</span>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <button
                              key={key}
                              className={`px-2 py-1 rounded text-[10px] transition-all ${
                                thread.status === key
                                  ? 'text-white'
                                  : 'bg-bg-subtle text-ink-muted hover:bg-bg-base'
                              }`}
                              style={
                                thread.status === key
                                  ? { backgroundColor: STATUS_COLORS[key as PlotThreadStatus] }
                                  : {}
                              }
                              onClick={() => handleStatusChange(thread.id, key as PlotThreadStatus)}
                            >
                              {label}
                            </button>
                          ))}
                          <div className="flex-1" />
                          <button
                            className="text-xs text-danger hover:underline"
                            onClick={() => onPlotThreadDelete(thread.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-ink-muted">暂无线索/伏笔</p>
                <p className="text-xs text-ink-faint mt-1">点击"添加线索"开始追踪你的故事线索</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-64 border-l border-border-subtle p-4 overflow-y-auto">
          <h4 className="text-xs font-medium text-ink mb-3">章节线索分布</h4>
          <div className="space-y-2">
            {chapters
              .filter((ch) => (threadsByChapter.get(ch.id) || []).length > 0)
              .map((chapter) => {
                const chapterThreads = threadsByChapter.get(chapter.id) || [];
                return (
                  <div
                    key={chapter.id}
                    className="p-2 rounded bg-bg-subtle cursor-pointer hover:bg-bg-base transition-colors"
                    onClick={() => onChapterSelect(chapter.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink truncate">{chapter.title}</span>
                      <span className="text-[10px] text-ink-faint">{chapterThreads.length}</span>
                    </div>
                    <div className="flex gap-1">
                      {chapterThreads.slice(0, 5).map((thread) => (
                        <span
                          key={thread.id}
                          className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: `${PLOT_TYPE_COLORS[thread.type]}20` }}
                          title={thread.title}
                        >
                          {PLOT_TYPE_ICONS[thread.type]}
                        </span>
                      ))}
                      {chapterThreads.length > 5 && (
                        <span className="text-[10px] text-ink-faint">+{chapterThreads.length - 5}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-[500px] shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">添加新线索/伏笔</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink-muted block mb-1">标题 *</label>
                  <input
                    className="input text-sm w-full"
                    placeholder="线索名称..."
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">类型</label>
                  <select
                    className="input text-sm w-full"
                    value={newThread.type}
                    onChange={(e) => setNewThread({ ...newThread, type: e.target.value as PlotThreadType })}
                  >
                    {Object.entries(PLOT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">描述</label>
                <textarea
                  className="input text-sm w-full min-h-[80px]"
                  placeholder="描述这个线索/伏笔的内容..."
                  value={newThread.description}
                  onChange={(e) => setNewThread({ ...newThread, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">铺设章节 *</label>
                <select
                  className="input text-sm w-full"
                  value={newThread.setupChapterId}
                  onChange={(e) => setNewThread({ ...newThread, setupChapterId: e.target.value })}
                >
                  <option value="">选择章节...</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      第{ch.order + 1}章: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">标签 (逗号分隔)</label>
                <input
                  className="input text-sm w-full"
                  placeholder="如：主线,反派,秘密..."
                  value={newThread.tags.join(', ')}
                  onChange={(e) =>
                    setNewThread({
                      ...newThread,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">备注</label>
                <textarea
                  className="input text-sm w-full min-h-[60px]"
                  placeholder="其他备注信息..."
                  value={newThread.notes}
                  onChange={(e) => setNewThread({ ...newThread, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewThread({
                    title: '',
                    description: '',
                    type: 'clue',
                    setupChapterId: '',
                    relatedCharacters: [],
                    tags: [],
                    notes: '',
                  });
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddThread}
                disabled={!newThread.title.trim() || !newThread.setupChapterId}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotThreadTracker;
