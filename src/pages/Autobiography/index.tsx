import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, ConfirmDialog, EmptyState } from '../../components';
import { useNavigate } from 'react-router-dom';
import { useAutobiographyStore } from '../../stores';

const AutobiographyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; chapterId: string; chapterTitle: string }>({
    isOpen: false,
    chapterId: '',
    chapterTitle: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (chapterId: string, chapterTitle: string) => {
    setDeleteConfirm({ isOpen: true, chapterId, chapterTitle });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await deleteChapter(deleteConfirm.chapterId);
    setIsDeleting(false);
    setDeleteConfirm({ isOpen: false, chapterId: '', chapterTitle: '' });
  };

  const stats = getCompletionStats();

  if (!autobiography) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-display-md mb-8">
          我的自传
        </h1>
        <Card>
          <EmptyState
            illustration="feather-quill"
            title="您的故事，从这里开始"
            description="每一部伟大的自传都始于第一个章节。让我们一起创建您的第一章吧。"
            primaryAction={{
              label: '开始创作',
              onClick: handleCreateNew,
            }}
            secondaryAction={{
              label: '了解如何创作',
              onClick: () => navigate('/dialogue'),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-display-md">
            {autobiography.title}
          </h1>
          {stats.total > 0 && (
            <p className="text-caption text-ink-muted mt-2">
              共 {stats.total} 章 · 已完成 {stats.completed} 章 · 草稿 {stats.draft} 章
            </p>
          )}
        </div>
        <div className="flex gap-3">
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
          <EmptyState
            illustration="book"
            title="还没有章节"
            description="点击上方按钮添加您的第一章，或开始对话创作让AI帮助您梳理人生故事。"
            primaryAction={{
              label: '开始对话创作',
              onClick: () => navigate('/dialogue'),
            }}
            secondaryAction={{
              label: '手动添加章节',
              onClick: () => setIsModalOpen(true),
            }}
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {autobiography.chapters.map((chapter, index) => {
            const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
              completed: { label: '已完成', color: 'text-success', bg: 'bg-success/10' },
              draft: { label: '草稿', color: 'text-warning', bg: 'bg-warning/10' },
              in_progress: { label: '进行中', color: 'text-brand-primary', bg: 'bg-brand-primary-light' },
              empty: { label: '未开始', color: 'text-ink-muted', bg: 'bg-bg-secondary' },
            };
            const status = statusConfig[chapter.status || 'empty'] || statusConfig.empty;

            return (
              <Card key={chapter.id}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-body font-semibold text-ink-primary">
                        第{index + 1}章: {chapter.title}
                      </h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-caption text-ink-muted mt-2">
                      创建于: {new Date(chapter.createdAt).toLocaleDateString()}
                      {chapter.timeRange && ` · ${chapter.timeRange}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/dialogue/${chapter.id}`)}
                    >
                      对话创作
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(chapter.id, chapter.title)}
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
            <Button onClick={handleAddChapter} loadingText="添加中...">
              添加
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, chapterId: '', chapterTitle: '' })}
        onConfirm={handleDeleteConfirm}
        title="删除这一章？"
        description={`章节「${deleteConfirm.chapterTitle}」及其所有内容将被永久删除，此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AutobiographyPage;
