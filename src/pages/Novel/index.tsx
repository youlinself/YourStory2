import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useNovelStore from '../../stores/novelStore';
import ExportService from '../../services/export/ExportService';
import { EmptyState } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components';
import {
  GENRE_LABELS,
  NOVEL_STATUS_LABELS,
  NovelGenre,
} from '../../types/novel';
import type { Novel } from '../../types/novel';
import NovelCard from '../../components/novel/NovelCard';
import CreateNovelModal from '../../components/novel/CreateNovelModal';

const NovelListPage: React.FC = () => {
  const navigate = useNavigate();
  const { novels, loadNovels, deleteNovel, setCurrentNovel } = useNovelStore();
  const toast = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [filterGenre, setFilterGenre] = useState<NovelGenre | 'all'>('all');
  const [filterStatus, setStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadNovels();
  }, [loadNovels]);

  const filteredNovels = useMemo(() => {
    let result = novels;

    if (filterGenre !== 'all') {
      result = result.filter((n) => n.genre === filterGenre);
    }

    if (filterStatus !== 'all') {
      result = result.filter((n) => n.status === filterStatus);
    }

    if (searchValue.trim()) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.synopsis.toLowerCase().includes(query) ||
          n.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [novels, filterGenre, filterStatus, searchValue]);

  const stats = useMemo(() => {
    return {
      total: novels.length,
      writing: novels.filter((n) => n.status === 'writing').length,
      completed: novels.filter((n) => n.status === 'completed').length,
      totalWords: novels.reduce((sum, n) => sum + n.currentWordCount, 0),
    };
  }, [novels]);

  const handleNovelClick = (novelId: string) => {
    setCurrentNovel(novelId);
    navigate(`/novel/${novelId}`);
  };

  const handleDelete = async (novelId: string) => {
    setIsDeleting(novelId);
    try {
      await deleteNovel(novelId);
      toast.addToast({ type: 'success', message: '小说已删除' });
    } catch {
      toast.addToast({ type: 'error', message: '删除失败' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExport = (novel: Novel) => {
    setSelectedNovel(novel);
    setIsExportModalOpen(true);
  };

  const performExport = (format: 'markdown' | 'text') => {
    if (!selectedNovel) return;

    const content = ExportService.export(
      {
        id: selectedNovel.id,
        title: selectedNovel.title,
        chapters: selectedNovel.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
          draftContent: '',
          status: ch.status,
          createdAt: ch.createdAt,
          updatedAt: ch.updatedAt,
        })),
        createdAt: selectedNovel.createdAt,
        updatedAt: selectedNovel.updatedAt,
      } as any,
      { format }
    );

    const ext = format === 'markdown' ? 'md' : 'txt';
    ExportService.download(content, `${selectedNovel.title}.${ext}`, `text/${format};charset=utf-8`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="content-panel">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
              我的小说
            </h1>
            <p className="text-sm text-ink-muted mt-1">创作你的虚构世界</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>新建小说</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs text-ink-muted">全部小说</p>
            <p className="stat-value mt-1">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-ink-muted">写作中</p>
            <p className="stat-value mt-1">{stats.writing}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-ink-muted">已完成</p>
            <p className="stat-value mt-1">{stats.completed}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-ink-muted">总字数</p>
            <p className="stat-value mt-1">
              {stats.totalWords > 10000
                ? `${(stats.totalWords / 10000).toFixed(1)}万`
                : stats.totalWords}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select
              className="input text-xs py-1.5 w-28"
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value as NovelGenre | 'all')}
            >
              <option value="all">全部题材</option>
              {Object.entries(GENRE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className="input text-xs py-1.5 w-28"
              value={filterStatus}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">全部状态</option>
              {Object.entries(NOVEL_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative w-48">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              className="input pl-9 text-xs py-1.5"
              placeholder="搜索小说..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filteredNovels.length > 0 ? (
            filteredNovels.map((novel) => (
              <NovelCard
                key={novel.id}
                novel={novel}
                onClick={() => handleNovelClick(novel.id)}
                onDelete={() => handleDelete(novel.id)}
                onExport={() => handleExport(novel)}
                isDeleting={isDeleting === novel.id}
              />
            ))
          ) : (
            <div className="col-span-3">
              {searchValue || filterGenre !== 'all' || filterStatus !== 'all' ? (
                <EmptyState
                  illustration="magnifying-glass"
                  title="没有找到匹配的小说"
                  description="尝试使用其他筛选条件"
                />
              ) : (
                <EmptyState
                  illustration="book"
                  title="还没有任何小说"
                  description="点击「新建小说」开始你的创作之旅"
                />
              )}
            </div>
          )}

          {filteredNovels.length > 0 && (
            <div
              className="border-2 border-dashed border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand-surface/30 transition-all min-h-[200px]"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <svg
                className="w-10 h-10 text-ink-faint mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-sm text-ink-muted">新建小说</span>
            </div>
          )}
        </div>
      </div>

      <CreateNovelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="导出小说"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">选择导出格式：</p>
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand-surface/30 transition-all text-sm font-medium"
              onClick={() => performExport('markdown')}
            >
              Markdown (.md)
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand-surface/30 transition-all text-sm font-medium"
              onClick={() => performExport('text')}
            >
              纯文本 (.txt)
            </button>
          </div>
          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <button
              className="btn btn-ghost"
              onClick={() => setIsExportModalOpen(false)}
            >
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NovelListPage;
