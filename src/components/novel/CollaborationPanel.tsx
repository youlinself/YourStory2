import React, { useState, useCallback, useMemo } from 'react';
import CollaborationService, { Comment, EditHistoryEntry } from '../../services/collaboration/CollaborationService';

interface CollaborationPanelProps {
  chapterId: string;
  userId: string;
  userName: string;
}

const HistoryTab: React.FC<{ chapterId: string }> = ({ chapterId }) => {
  const history = CollaborationService.getEditHistory(chapterId);
  return (
    <div className="p-3 space-y-2">
      {history.length > 0 ? (
        history.slice(0, 20).map((entry: EditHistoryEntry) => (
          <div key={entry.id} className="p-2 rounded bg-bg-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink">{entry.userName}</span>
              <span className="text-[10px] text-ink-faint">
                {new Date(entry.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {entry.action === 'edit' ? '编辑了章节' :
               entry.action === 'lock' ? '锁定了章节' :
               entry.action === 'unlock' ? '解锁了章节' : '添加了评论'}
              {entry.details && `: ${entry.details}`}
            </p>
          </div>
        ))
      ) : (
        <p className="text-xs text-ink-faint text-center py-4">暂无编辑历史</p>
      )}
    </div>
  );
};

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  chapterId,
  userId,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'locks'>('comments');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(CollaborationService.getComments(chapterId));
  const [lockStatus, setLockStatus] = useState(CollaborationService.isChapterLocked(chapterId));

  const handleAcquireLock = useCallback(() => {
    const result = CollaborationService.acquireLock(chapterId, userId, userName);
    if (result.success) {
      setLockStatus({ locked: true, lockedBy: userName, expiresAt: result.lock?.expiresAt });
    }
  }, [chapterId, userId, userName]);

  const handleReleaseLock = useCallback(() => {
    CollaborationService.releaseLock(chapterId, userId);
    setLockStatus({ locked: false });
  }, [chapterId, userId]);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    CollaborationService.addComment(chapterId, userId, userName, newComment.trim());
    setComments(CollaborationService.getComments(chapterId));
    setNewComment('');
  }, [chapterId, userId, userName, newComment]);

  const handleResolveComment = useCallback((commentId: string) => {
    CollaborationService.resolveComment(chapterId, commentId);
    setComments(CollaborationService.getComments(chapterId));
  }, [chapterId]);

  const handleDeleteComment = useCallback((commentId: string) => {
    CollaborationService.deleteComment(chapterId, commentId);
    setComments(CollaborationService.getComments(chapterId));
  }, [chapterId]);

  const stats = useMemo(() => {
    return CollaborationService.getCollaborationStats(chapterId);
  }, [chapterId]);

  return (
    <div className="w-72 border-l border-border-subtle bg-bg-base flex flex-col overflow-hidden">
      <div className="flex items-center border-b border-border-subtle">
        {(['comments', 'history', 'locks'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 px-3 py-2 text-xs transition-all ${
              activeTab === tab
                ? 'border-b-2 border-brand text-brand font-medium'
                : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'comments' ? `评论 (${stats.unresolvedComments})` : tab === 'history' ? '历史' : '锁定'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'comments' && (
          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              <input
                className="input text-xs flex-1"
                placeholder="添加评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                className="btn btn-primary btn-sm text-xs"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                发送
              </button>
            </div>

            <div className="space-y-2">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-2 rounded-lg border ${
                      comment.resolved ? 'border-border-subtle opacity-60' : 'border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink">{comment.userName}</span>
                      <div className="flex items-center gap-1">
                        {!comment.resolved && (
                          <button
                            className="text-[10px] text-brand hover:underline"
                            onClick={() => handleResolveComment(comment.id)}
                          >
                            解决
                          </button>
                        )}
                        <button
                          className="text-ink-faint hover:text-danger"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs text-ink-muted ${comment.resolved ? 'line-through' : ''}`}>
                      {comment.content}
                    </p>
                    <p className="text-[10px] text-ink-faint mt-1">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-faint text-center py-4">暂无评论</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryTab chapterId={chapterId} />
        )}

        {activeTab === 'locks' && (
          <div className="p-3 space-y-3">
            <div className="p-3 rounded-lg border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-ink">章节锁定状态</span>
                {lockStatus.locked ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">已锁定</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">未锁定</span>
                )}
              </div>

              {lockStatus.locked && (
                <p className="text-xs text-ink-muted mb-2">
                  {lockStatus.lockedBy} 正在编辑此章节
                </p>
              )}

              <button
                className={`w-full py-1.5 rounded text-xs ${
                  lockStatus.locked && lockStatus.lockedBy === userName
                    ? 'bg-danger/10 text-danger hover:bg-danger/20'
                    : 'bg-brand/10 text-brand hover:bg-brand/20'
                }`}
                onClick={lockStatus.locked && lockStatus.lockedBy === userName ? handleReleaseLock : handleAcquireLock}
                disabled={lockStatus.locked && lockStatus.lockedBy !== userName}
              >
                {lockStatus.locked && lockStatus.lockedBy === userName
                  ? '解锁章节'
                  : lockStatus.locked
                  ? '已被他人锁定'
                  : '锁定章节进行编辑'}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-bg-subtle">
              <h4 className="text-xs font-medium text-ink mb-2">协作统计</h4>
              <div className="space-y-1 text-xs text-ink-muted">
                <div className="flex justify-between">
                  <span>评论数</span>
                  <span>{stats.commentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>未解决评论</span>
                  <span>{stats.unresolvedComments}</span>
                </div>
                <div className="flex justify-between">
                  <span>24h内编辑</span>
                  <span>{stats.recentEdits}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;
