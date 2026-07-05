import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../../components';
import { useNavigate } from 'react-router-dom';
import { useAutobiographyStore } from '../../stores';

const AutobiographyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const {
    autobiography,
    load,
    create,
    createChapter,
    deleteChapter,
    getCompletionStats,
  } = useAutobiographyStore();

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateNew = async () => {
    await create();
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    await createChapter(newChapterTitle.trim());
    setNewChapterTitle('');
    setIsModalOpen(false);
  };

  const stats = getCompletionStats();

  if (!autobiography) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-display-md mb-8">
          我的自传
        </h1>
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-body text-ink-secondary mb-6">
              您还没有开始创建自传
            </p>
            <Button onClick={handleCreateNew}>
              开始创建自传
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-display-md">
            {autobiography.title}
          </h1>
          {stats.total > 0 && (
            <p className="text-caption text-ink-muted mt-1.5">
              共 {stats.total} 章 · 已完成 {stats.completed} 章 · 草稿 {stats.draft} 章
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" onClick={() => navigate('/dialogue')}>
            对话创作
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            添加章节
          </Button>
        </div>
      </div>

      {autobiography.chapters.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-body text-ink-secondary mb-6">
              还没有章节，点击上方按钮添加第一章
            </p>
            <Button onClick={() => navigate('/dialogue')}>
              开始对话创作
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {autobiography.chapters.map((chapter, index) => {
            const statusLabel = chapter.status === 'completed' ? '已完成'
              : chapter.status === 'draft' ? '草稿'
              : chapter.status === 'in_progress' ? '进行中'
              : '未开始';
            const statusColor = chapter.status === 'completed' ? 'text-success'
              : chapter.status === 'draft' ? 'text-warning'
              : chapter.status === 'in_progress' ? 'text-brand-primary'
              : 'text-ink-muted';

            return (
              <Card key={chapter.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-semibold text-ink-primary">
                        第{index + 1}章: {chapter.title}
                      </h3>
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-caption text-ink-muted mt-1.5">
                      创建于: {new Date(chapter.createdAt).toLocaleDateString()}
                      {chapter.timeRange && ` · ${chapter.timeRange}`}
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/dialogue/${chapter.id}`)}
                    >
                      对话创作
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChapter(chapter.id)}
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      删除
                    </Button>
                  </div>
                </div>
                {chapter.content && (
                  <div className="mt-5 p-5 bg-bg-secondary rounded-xl">
                    <p className="text-body text-ink-secondary line-clamp-3">
                      {chapter.content}
                    </p>
                  </div>
                )}
                {chapter.draftContent && !chapter.content && (
                  <div className="mt-5 p-5 bg-brand-primary-subtle rounded-xl">
                    <p className="text-caption text-brand-primary mb-1">草稿预览</p>
                    <p className="text-body text-ink-secondary line-clamp-3">
                      {chapter.draftContent}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="添加新章节"
      >
        <div className="space-y-5">
          <Input
            label="章节标题"
            value={newChapterTitle}
            onChange={setNewChapterTitle}
            placeholder="请输入章节标题"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleAddChapter}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AutobiographyPage;
