import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useDialogueStore from '../../stores/dialogueStore';
import RightPanel from '../../components/home/RightPanel';
import { EmptyState } from '../../components/ui';
import Modal from '../../components/ui/Modal';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chapters' | 'steps'>('chapters');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTimeRange, setNewChapterTimeRange] = useState('');

  const { autobiography, load, create, createChapter, getCompletionStats } = useAutobiographyStore();
  const { initSession } = useDialogueStore();

  useEffect(() => {
    load();
  }, [load]);

  const chapters = autobiography?.chapters || [];
  const stats = getCompletionStats();

  const steps = [
    { title: '话题引导', desc: '通过对话形式，引导你回忆和讲述人生故事', num: 1 },
    { title: '内容生成', desc: 'AI根据你的讲述，智能生成流畅的传记内容', num: 2 },
    { title: '审阅编辑', desc: '你可以对生成的内容进行修改和润色，使之更符合你的想法', num: 3 },
  ];

  const getChapterProgress = (status?: string): number => {
    switch (status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      case 'draft': return 30;
      default: return 0;
    }
  };

  const getChapterStatus = (status?: string): { text: string; badge: string } => {
    switch (status) {
      case 'completed': return { text: '已完成', badge: 'complete' };
      case 'in_progress': return { text: '进行中', badge: 'progress' };
      case 'draft': return { text: '草稿', badge: 'draft' };
      default: return { text: '未开始', badge: 'empty' };
    }
  };

  const handleChapterClick = async (chapterId: string) => {
    await initSession(chapterId);
    navigate(`/dialogue/${chapterId}`);
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;

    if (!autobiography) {
      await create();
    }

    const chapterId = await createChapter(newChapterTitle.trim(), newChapterTimeRange.trim());
    setNewChapterTitle('');
    setNewChapterTimeRange('');
    setIsAddModalOpen(false);

    if (chapterId) {
      await initSession(chapterId);
      navigate(`/dialogue/${chapterId}`);
    }
  };

  const badgeStyles: Record<string, string> = {
    complete: 'badge badge-success',
    progress: 'badge badge-brand',
    draft: 'badge badge-warning',
    empty: 'badge badge-ghost',
  };

  return (
    <div className="flex flex-1 min-h-0">
      <div className="content-panel flex-1">
        <div className="animate-fade-in">
          <div className="flex items-center gap-1 mb-1">
            <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
              欢迎回来
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-ink-muted text-[14px] leading-relaxed">
            {chapters.length > 0 ? '今天想聊聊人生中的哪个阶段呢？' : '开始创作你的人生故事吧'}
          </p>

          <div
            className="flex items-center gap-6 border-b mb-5 animate-fade-in"
            style={{ borderColor: 'var(--color-border-subtle)', animationDelay: '0.05s' }}
          >
            <button
              className={`tab ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              概览
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {chapters.length}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              创作
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {steps.length}
              </span>
            </button>
            <button className="tab">
              统计
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {stats.completed}
              </span>
            </button>
          </div>

          {activeTab === 'chapters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {chapters.length > 0 ? (
                chapters.map((chapter) => {
                  const progress = getChapterProgress(chapter.status);
                  const statusInfo = getChapterStatus(chapter.status);
                  return (
                    <div
                      key={chapter.id}
                      className="chapter-card cursor-pointer"
                      onClick={() => handleChapterClick(chapter.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-[15px] font-semibold leading-snug text-ink">{chapter.title}</h3>
                        <span className={badgeStyles[statusInfo.badge]} style={{ marginTop: '1px' }}>
                          {statusInfo.text}
                        </span>
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed mb-3">
                        {chapter.timeRange ? `${chapter.timeRange} · ` : ''}
                        {chapter.content ? `${chapter.content.slice(0, 50)}...` : '暂无内容'}
                      </p>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-ink-faint">完成度</span>
                          <span className="text-xs font-medium text-ink-muted">{progress}%</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${progress === 100 ? 'complete' : ''}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    illustration="feather-quill"
                    title="还没有任何章节"
                    description="开始创作你的人生故事吧，每一个章节都将成为你人生的珍贵记录"
                    primaryAction={{
                      label: '创建第一个章节',
                      onClick: () => setIsAddModalOpen(true),
                    }}
                  />
                </div>
              )}

              <button
                className="add-chapter-card text-ink-muted"
                onClick={() => setIsAddModalOpen(true)}
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-sm font-medium">添加新章节</span>
              </button>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="flex gap-4 mt-6">
              {steps.map((step, index) => (
                <div key={index} className="step-card">
                  <span className="step-number">{step.num}</span>
                  <h3 className="text-[15px] font-semibold leading-snug text-ink">{step.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="right-panel">
        <RightPanel />
      </aside>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="添加新章节"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">章节标题</label>
            <input
              className="input w-full"
              placeholder="例如：童年趣事、学生时代..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">时间范围（可选）</label>
            <input
              className="input w-full"
              placeholder="例如：1990-2000"
              value={newChapterTimeRange}
              onChange={(e) => setNewChapterTimeRange(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn btn-ghost"
              onClick={() => setIsAddModalOpen(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddChapter}
              disabled={!newChapterTitle.trim()}
            >
              创建章节
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
