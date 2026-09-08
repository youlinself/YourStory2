import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useNovelStore from '../../stores/novelStore';
import type { Novel } from '../../types/novel';
import { GENRE_LABELS, NOVEL_STATUS_LABELS } from '../../types/novel';

type SortField = 'updatedAt' | 'createdAt' | 'title' | 'progress';
type SortDirection = 'asc' | 'desc';

const NovelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { novels } = useNovelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const stats = useMemo(() => {
    const totalNovels = novels.length;
    const totalWords = novels.reduce((sum, n) => sum + n.currentWordCount, 0);
    const totalChapters = novels.reduce((sum, n) => sum + n.chapters.length, 0);
    const completedNovels = novels.filter((n) => n.status === 'completed').length;
    const activeNovels = novels.filter((n) => n.status === 'writing').length;

    return { totalNovels, totalWords, totalChapters, completedNovels, activeNovels };
  }, [novels]);

  const filteredAndSortedNovels = useMemo(() => {
    let filtered = novels;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.synopsis.toLowerCase().includes(query) ||
          n.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (filterGenre !== 'all') {
      filtered = filtered.filter((n) => n.genre === filterGenre);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((n) => n.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'progress':
          const aProgress = a.targetWordCount > 0 ? a.currentWordCount / a.targetWordCount : 0;
          const bProgress = b.targetWordCount > 0 ? b.currentWordCount / b.targetWordCount : 0;
          comparison = aProgress - bProgress;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [novels, searchQuery, filterGenre, filterStatus, sortField, sortDirection]);

  const recentEdits = useMemo(() => {
    return [...novels]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [novels]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const getProgressPercentage = (novel: Novel) => {
    if (novel.targetWordCount <= 0) return 0;
    return Math.min(100, (novel.currentWordCount / novel.targetWordCount) * 100);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border-subtle">
        <h1 className="text-xl font-bold text-ink mb-4">小说管理仪表盘</h1>

        <div className="grid grid-cols-5 gap-4">
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/20">
            <p className="text-2xl font-bold text-brand">{stats.totalNovels}</p>
            <p className="text-xs text-ink-faint">小说总数</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-2xl font-bold text-success">{stats.activeNovels}</p>
            <p className="text-xs text-ink-faint">写作中</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{stats.completedNovels}</p>
            <p className="text-xs text-ink-faint">已完成</p>
          </div>
          <div className="p-3 rounded-lg bg-ink-faint/5 border border-ink-faint/20">
            <p className="text-2xl font-bold text-ink">{stats.totalChapters}</p>
            <p className="text-xs text-ink-faint">总章节数</p>
          </div>
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/20">
            <p className="text-2xl font-bold text-brand">
              {stats.totalWords > 10000
                ? `${(stats.totalWords / 10000).toFixed(1)}万`
                : stats.totalWords.toLocaleString()}
            </p>
            <p className="text-xs text-ink-faint">总字数</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border-subtle">
            <input
              className="input text-sm flex-1"
              placeholder="搜索小说..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="input text-xs py-1 w-28"
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
            >
              <option value="all">全部类型</option>
              {Object.entries(GENRE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className="input text-xs py-1 w-28"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">全部状态</option>
              {Object.entries(NOVEL_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 px-6 py-2 border-b border-border-subtle bg-bg-subtle/50 text-xs text-ink-faint">
            <button
              className={`flex items-center gap-1 ${sortField === 'title' ? 'text-brand' : ''}`}
              onClick={() => handleSort('title')}
            >
              标题 {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`flex items-center gap-1 ${sortField === 'updatedAt' ? 'text-brand' : ''}`}
              onClick={() => handleSort('updatedAt')}
            >
              最近更新 {sortField === 'updatedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`flex items-center gap-1 ${sortField === 'progress' ? 'text-brand' : ''}`}
              onClick={() => handleSort('progress')}
            >
              进度 {sortField === 'progress' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {filteredAndSortedNovels.length > 0 ? (
                filteredAndSortedNovels.map((novel) => (
                  <div
                    key={novel.id}
                    className="p-4 rounded-lg border border-border-subtle hover:border-border transition-all cursor-pointer"
                    onClick={() => navigate(`/novel/${novel.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-ink truncate">{novel.title}</h3>
                      <span className={`badge text-[10px] ${
                        novel.status === 'completed' ? 'badge-success' :
                        novel.status === 'writing' ? 'badge-brand' :
                        novel.status === 'paused' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {NOVEL_STATUS_LABELS[novel.status]}
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted line-clamp-2 mb-3">
                      {novel.synopsis || '暂无简介'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-ink-faint mb-2">
                      <span>{GENRE_LABELS[novel.genre]}</span>
                      <span>{novel.chapters.length} 章</span>
                      <span>
                        {novel.currentWordCount > 10000
                          ? `${(novel.currentWordCount / 10000).toFixed(1)}万字`
                          : `${novel.currentWordCount}字`}
                      </span>
                    </div>

                    {novel.targetWordCount > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-ink-faint mb-1">
                          <span>进度</span>
                          <span>{Math.round(getProgressPercentage(novel))}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${getProgressPercentage(novel)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-ink-faint">
                      <span>更新: {new Date(novel.updatedAt).toLocaleDateString('zh-CN')}</span>
                      <span>{novel.characters.length} 角色</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-ink-muted">没有找到匹配的小说</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-border-subtle p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-ink mb-3">最近编辑</h3>
          <div className="space-y-2">
            {recentEdits.map((novel) => (
              <div
                key={novel.id}
                className="p-2 rounded-lg border border-border-subtle hover:border-border cursor-pointer transition-all"
                onClick={() => navigate(`/novel/${novel.id}`)}
              >
                <p className="text-xs font-medium text-ink truncate">{novel.title}</p>
                <p className="text-[10px] text-ink-faint">
                  {new Date(novel.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle">
            <h3 className="text-sm font-semibold text-ink mb-3">类型分布</h3>
            <div className="space-y-2">
              {Object.entries(GENRE_LABELS).map(([key, label]) => {
                const count = novels.filter((n) => n.genre === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">{label}</span>
                    <span className="text-xs text-ink-faint">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelDashboard;
