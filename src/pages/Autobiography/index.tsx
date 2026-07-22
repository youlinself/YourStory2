import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useDialogueStore from '../../stores/dialogueStore';
import ExportService from '../../services/export/ExportService';
import ShareService from '../../services/share/ShareService';
import AIService from '../../services/ai/AIService';
import useAIStore from '../../stores/aiStore';
import type { ExportFormat } from '../../services/export/ExportService';
import type { Autobiography, Chapter } from '../../types';
import { EmptyState } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components';

interface ChapterWithProgress extends Chapter {
  progress: number;
  wordCount: number;
}

const AutobiographyPage: React.FC = () => {
  const navigate = useNavigate();
  const { autobiography, load, getCompletionStats } = useAutobiographyStore();
  const { initSession } = useDialogueStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [exportScope, setExportScope] = useState<'all' | 'completed' | 'chapter'>('all');
  const [exportIncludeDrafts, setExportIncludeDrafts] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isStyleCheckModalOpen, setIsStyleCheckModalOpen] = useState(false);
  const [styleCheckResult, setStyleCheckResult] = useState<{
    overall_consistency: number;
    issues: Array<{
      chapter: string;
      type: string;
      description: string;
      suggestion: string;
      examples: string[];
    }>;
    suggestions: string[];
  } | null>(null);
  const [isCheckingStyle, setIsCheckingStyle] = useState(false);
  const [isOrganizingTimeline, setIsOrganizingTimeline] = useState(false);
  const [timelineResult, setTimelineResult] = useState<{
    sortedChapters: Array<{
      id: string;
      title: string;
      timeRange: string;
      startYear: number;
      endYear: number;
      order: number;
    }>;
    gaps: Array<{
      period: string;
      description: string;
      suggestedTitle: string;
    }>;
    conflicts: Array<{
      chapterId: string;
      issue: string;
      suggestion: string;
    }>;
  } | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    load();
  }, [load]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newChapters = [...sortedChapters];
    const [draggedItem] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(dropIndex, 0, draggedItem);

    const updatedAutobiography: Autobiography = {
      ...autobiography!,
      chapters: newChapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
        draftContent: ch.draftContent,
        timeRange: ch.timeRange,
        status: ch.status,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      })),
      updatedAt: new Date(),
    };
    useAutobiographyStore.getState().setAutobiography(updatedAutobiography);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const chapters: ChapterWithProgress[] = useMemo(() => {
    return (autobiography?.chapters || []).map((ch) => ({
      ...ch,
      progress: ch.status === 'completed' ? 100 : ch.status === 'draft' ? 30 : ch.status === 'in_progress' ? 50 : 0,
      wordCount: (ch.content?.length || 0) + (ch.draftContent?.length || 0),
    }));
  }, [autobiography]);

  const stats = getCompletionStats();

  const filteredChapters = useMemo(() => {
    let result = chapters;

    if (activeTab === 'completed') {
      result = result.filter((ch) => ch.status === 'completed');
    } else if (activeTab === 'in-progress') {
      result = result.filter((ch) => ch.status !== 'completed');
    }

    if (searchValue.trim()) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (ch) =>
          ch.title.toLowerCase().includes(query) ||
          ch.timeRange?.toLowerCase().includes(query) ||
          ch.content?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [chapters, activeTab, searchValue]);

  const sortedChapters = useMemo(() => {
    return filteredChapters.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filteredChapters]);

  const totalWords = chapters.reduce((acc, ch) => acc + ch.wordCount, 0);
  const uniquePeople = useMemo(() => {
    const people = new Set<string>();
    chapters.forEach((ch) => {
      const matches = ch.content?.match(/[\u4e00-\u9fa5]{2,4}(?=先生|女士|老师|同学|朋友|父亲|母亲|爷爷|奶奶|哥哥|姐姐|弟弟|妹妹|丈夫|妻子|儿子|女儿)/g);
      if (matches) matches.forEach((m) => people.add(m));
    });
    return people.size;
  }, [chapters]);

  const timeSpan = useMemo(() => {
    const years: number[] = [];
    chapters.forEach((ch) => {
      const matches = ch.timeRange?.match(/\d{4}/g);
      if (matches) matches.forEach((m) => years.push(parseInt(m)));
    });
    if (years.length === 0) return '未设置';
    const min = Math.min(...years);
    const max = Math.max(...years);
    return `${max - min} 年`;
  }, [chapters]);

  const pageStats = [
    { label: '章节', value: stats.total.toString() },
    { label: '总字数', value: totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}K` : totalWords.toString() },
    { label: '角色', value: uniquePeople.toString() },
    { label: '时间线', value: timeSpan },
  ];

  const toggleGroup = (chapterId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleChapterClick = async (chapterId: string) => {
    await initSession(chapterId);
    navigate(`/dialogue/${chapterId}`);
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } else if (days === 1) {
      return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } else if (days < 7) {
      return `${days} 天前`;
    }
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'draft': return '有草稿';
      default: return '未开始';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-brand';
      case 'draft': return 'badge-warning';
      default: return 'badge-ghost';
    }
  };

  const handleExport = () => {
    const options = {
      format: exportFormat,
      includeDrafts: exportIncludeDrafts,
    };

    if (exportScope === 'completed') {
      const completedIds = autobiography?.chapters
        .filter((ch) => ch.status === 'completed')
        .map((ch) => ch.id) || [];
      ExportService.downloadAsMarkdown(autobiography, { ...options, chapterIds: completedIds });
    } else if (exportFormat === 'markdown') {
      ExportService.downloadAsMarkdown(autobiography, options);
    } else {
      ExportService.downloadAsText(autobiography, options);
    }

    setIsExportModalOpen(false);
  };

  const handleShare = async () => {
    if (!autobiography || !autobiography.chapters?.length) {
      toast.addToast({ type: 'error', message: '没有可分享的内容' });
      return;
    }

    setIsSharing(true);
    try {
      const link = await ShareService.shareAutobiography(autobiography);
      setShareUrl(link.url);
      setIsShareModalOpen(true);
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '分享失败' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.addToast({ type: 'success', message: '链接已复制到剪贴板' });
    } catch {
      toast.addToast({ type: 'error', message: '复制失败，请手动复制' });
    }
  };

  const handleStyleCheck = async () => {
    if (!autobiography?.chapters?.length) {
      toast.addToast({ type: 'error', message: '没有可检查的内容' });
      return;
    }

    const chaptersWithContent = autobiography.chapters.filter(
      (ch) => ch.content || ch.draftContent
    );

    if (chaptersWithContent.length < 2) {
      toast.addToast({ type: 'warning', message: '至少需要2个有内容的章节才能进行风格检查' });
      return;
    }

    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return;
    }

    setIsCheckingStyle(true);
    setStyleCheckResult(null);

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, customModelName });
      const result = await aiService.checkStyleConsistency(
        chaptersWithContent.map((ch) => ({
          title: ch.title,
          timeRange: ch.timeRange,
          content: ch.content || ch.draftContent || '',
        }))
      );
      setStyleCheckResult(result);
      setIsStyleCheckModalOpen(true);
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '风格检查失败' });
    } finally {
      setIsCheckingStyle(false);
    }
  };

  const handleTimelineOrganize = async () => {
    if (!autobiography?.chapters?.length) {
      toast.addToast({ type: 'error', message: '没有可整理的章节' });
      return;
    }

    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return;
    }

    setIsOrganizingTimeline(true);
    setTimelineResult(null);

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, customModelName });
      const result = await aiService.organizeTimeline(
        autobiography.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          timeRange: ch.timeRange,
          content: ch.content || ch.draftContent,
        }))
      );
      setTimelineResult(result);
      setIsTimelineModalOpen(true);
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '时间线整理失败' });
    } finally {
      setIsOrganizingTimeline(false);
    }
  };

  return (
    <div className="content-panel">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
            {autobiography?.title || '我的自传'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost text-xs"
              onClick={() => setIsExportModalOpen(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>导出</span>
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={handleShare}
              disabled={isSharing}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              <span>{isSharing ? '分享中...' : '分享'}</span>
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={handleStyleCheck}
              disabled={isCheckingStyle}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <span>{isCheckingStyle ? '检查中...' : '风格检查'}</span>
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={handleTimelineOrganize}
              disabled={isOrganizingTimeline}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              <span>{isOrganizingTimeline ? '整理中...' : '整理时间线'}</span>
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={() => window.print()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              <span>打印</span>
            </button>
            <button className="btn btn-primary text-xs" disabled>
              <span>预览全文</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {pageStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <p className="text-xs text-ink-muted">{stat.label}</p>
              <p className="stat-value mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center gap-6 border-b mb-5 animate-fade-in"
            style={{ borderColor: 'var(--color-border-subtle)', animationDelay: '0.05s' }}
          >
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              全部章节
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {stats.total}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('in-progress')}
            >
              草稿
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {stats.total - stats.completed > 0 ? stats.total - stats.completed : 0}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              已完成
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {stats.completed}
              </span>
            </button>
          </div>
          <div className="relative w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="input pl-9 text-xs py-1.5"
              placeholder="搜索章节..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {sortedChapters.length > 0 ? (
            sortedChapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="border border-border-subtle rounded-lg overflow-hidden cursor-move"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
                  onClick={() => toggleGroup(chapter.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-ink-faint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                    </svg>
                    <svg
                      className={`w-4 h-4 text-ink-muted transition-transform ${expandedGroups.has(chapter.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-sm font-medium text-ink">{chapter.title}</span>
                    <span className={`badge ${getStatusBadge(chapter.status)}`}>
                      {getStatusText(chapter.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">{chapter.timeRange}</span>
                    <span className="text-xs text-ink-muted">{chapter.wordCount > 0 ? `${chapter.wordCount} 字` : ''}</span>
                    <span className="text-xs text-ink-faint">{chapter.progress}%</span>
                    <div className="w-20 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${chapter.progress === 100 ? 'bg-success' : 'bg-brand'}`}
                        style={{ width: `${chapter.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
                {expandedGroups.has(chapter.id) && (
                  <div className="border-t border-border-subtle bg-bg-subtle/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-faint mb-2">最后更新时间：{formatTime(chapter.updatedAt)}</p>
                        {chapter.content ? (
                          <p className="text-sm text-ink-secondary line-clamp-3">
                            {chapter.content.slice(0, 200)}{chapter.content.length > 200 ? '...' : ''}
                          </p>
                        ) : chapter.draftContent ? (
                          <div>
                            <span className="text-xs text-warning mb-1 block">草稿内容：</span>
                            <p className="text-sm text-ink-secondary line-clamp-3">
                              {chapter.draftContent.slice(0, 200)}{chapter.draftContent.length > 200 ? '...' : ''}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-ink-faint italic">暂无内容</p>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm shrink-0"
                        onClick={() => handleChapterClick(chapter.id)}
                      >
                        {chapter.content ? '继续编辑' : '开始创作'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            searchValue ? (
              <EmptyState
                illustration="magnifying-glass"
                title="没有找到匹配的章节"
                description="尝试使用其他关键词搜索"
              />
            ) : (
              <EmptyState
                illustration="book"
                title="还没有任何章节"
                description="前往首页创建你的第一个章节"
              />
            )
          )}
        </div>
      </div>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="导出自传"
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">导出格式</label>
            <div className="flex gap-3">
              <button
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  exportFormat === 'markdown'
                    ? 'border-brand bg-brand-surface text-brand'
                    : 'border-border-subtle text-ink-muted hover:border-border'
                }`}
                onClick={() => setExportFormat('markdown')}
              >
                Markdown (.md)
              </button>
              <button
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  exportFormat === 'text'
                    ? 'border-brand bg-brand-surface text-brand'
                    : 'border-border-subtle text-ink-muted hover:border-border'
                }`}
                onClick={() => setExportFormat('text')}
              >
                纯文本 (.txt)
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">导出范围</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="w-4 h-4 text-brand"
                />
                <span className="text-sm text-ink">全部章节</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportScope === 'completed'}
                  onChange={() => setExportScope('completed')}
                  className="w-4 h-4 text-brand"
                />
                <span className="text-sm text-ink">仅已完成章节</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exportIncludeDrafts}
                onChange={(e) => setExportIncludeDrafts(e.target.checked)}
                className="w-4 h-4 rounded text-brand"
              />
              <span className="text-sm text-ink">包含草稿内容</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              className="btn btn-ghost"
              onClick={() => setIsExportModalOpen(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
            >
              导出
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="分享自传"
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">分享链接</label>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-xs"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="btn btn-outline text-xs"
                onClick={handleCopyShareLink}
              >
                复制
              </button>
            </div>
            <p className="text-xs text-ink-faint mt-2">链接有效期72小时，他人可通过此链接查看你的自传</p>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">分享到</label>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border-subtle hover:border-border hover:bg-bg-subtle transition-all"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=查看我的自传&url=${encodeURIComponent(shareUrl)}`, '_blank');
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-sm">Twitter</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border-subtle hover:border-border hover:bg-bg-subtle transition-all"
                onClick={() => {
                  window.open(`mailto:?subject=查看我的自传&body=这是我的自传链接：${encodeURIComponent(shareUrl)}`, '_blank');
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-sm">邮件</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <button
              className="btn btn-primary"
              onClick={() => setIsShareModalOpen(false)}
            >
              完成
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isStyleCheckModalOpen}
        onClose={() => setIsStyleCheckModalOpen(false)}
        title="风格一致性检查"
      >
        <div className="space-y-5">
          {styleCheckResult && (
            <>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-bg-subtle">
                <div className={`text-3xl font-bold ${
                  styleCheckResult.overall_consistency >= 0.9 ? 'text-success' :
                  styleCheckResult.overall_consistency >= 0.7 ? 'text-warning' : 'text-danger'
                }`}>
                  {Math.round(styleCheckResult.overall_consistency * 100)}%
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">整体一致性评分</p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {styleCheckResult.overall_consistency >= 0.9 ? '风格高度一致' :
                     styleCheckResult.overall_consistency >= 0.7 ? '基本一致，有轻微跳跃' :
                     styleCheckResult.overall_consistency >= 0.5 ? '存在明显不一致' : '风格差异较大'}
                  </p>
                </div>
              </div>

              {styleCheckResult.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-ink mb-3">发现的问题</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {styleCheckResult.issues.map((issue, index) => (
                      <div key={index} className="p-3 rounded-lg border border-border-subtle bg-bg-subtle/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="badge badge-warning text-xs">{issue.type}</span>
                          <span className="text-xs font-medium text-ink">{issue.chapter}</span>
                        </div>
                        <p className="text-sm text-ink-secondary mb-1">{issue.description}</p>
                        <p className="text-xs text-ink-faint">建议：{issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {styleCheckResult.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-ink mb-3">改进建议</h4>
                  <ul className="space-y-2">
                    {styleCheckResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <button
              className="btn btn-primary"
              onClick={() => setIsStyleCheckModalOpen(false)}
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        title="时间线整理"
      >
        <div className="space-y-5">
          {timelineResult && (
            <>
              {timelineResult.sortedChapters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-ink mb-3">建议的章节顺序</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {timelineResult.sortedChapters.map((ch, index) => (
                      <div key={ch.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-subtle/50">
                        <span className="w-6 h-6 rounded-full bg-brand-surface text-brand text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate">{ch.title}</p>
                          {ch.timeRange && (
                            <p className="text-xs text-ink-faint">{ch.timeRange}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timelineResult.gaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-ink mb-3">时间空白期</h4>
                  <div className="space-y-2">
                    {timelineResult.gaps.map((gap, index) => (
                      <div key={index} className="p-3 rounded-lg border border-warning/20 bg-warning/5">
                        <p className="text-sm font-medium text-ink">{gap.period}</p>
                        <p className="text-xs text-ink-faint mt-0.5">{gap.description}</p>
                        <p className="text-xs text-brand mt-1">建议：{gap.suggestedTitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timelineResult.conflicts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-ink mb-3">检测到的时间冲突</h4>
                  <div className="space-y-2">
                    {timelineResult.conflicts.map((conflict, index) => (
                      <div key={index} className="p-3 rounded-lg border border-danger/20 bg-danger/5">
                        <p className="text-sm text-ink">{conflict.issue}</p>
                        <p className="text-xs text-ink-faint mt-0.5">建议：{conflict.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <button
              className="btn btn-primary"
              onClick={() => setIsTimelineModalOpen(false)}
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AutobiographyPage;
