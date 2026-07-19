import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useDialogueStore from '../../stores/dialogueStore';
import type { Chapter, DialogueSession } from '../../types';

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  const { autobiography, load, getCompletionStats } = useAutobiographyStore();
  const { sessions } = useDialogueStore();
  const [totalWords, setTotalWords] = useState(0);
  const [todayDialogues, setTodayDialogues] = useState(0);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autobiography?.chapters) {
      const words = autobiography.chapters.reduce(
        (acc: number, ch: Chapter) => acc + (ch.content?.length || 0) + (ch.draftContent?.length || 0),
        0
      );
      setTotalWords(words);
    }
  }, [autobiography]);

  useEffect(() => {
    const today = new Date().toDateString();
    const todaySessions = Object.values(sessions).filter(
      (s: DialogueSession) => new Date(s.updatedAt).toDateString() === today
    );
    setTodayDialogues(todaySessions.length);
  }, [sessions]);

  const stats = getCompletionStats();

  const recentChapters = autobiography?.chapters
    .slice()
    .sort((a: Chapter, b: Chapter) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5) || [];

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
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  return (
    <>
      <section>
        <h3 className="section-title">今日数据</h3>
        <div className="mt-3">
          <div className="stat-row">
            <span className="text-sm text-ink-muted">今日对话</span>
            <span className="stat-value">{todayDialogues}</span>
          </div>
          <div className="stat-row">
            <span className="text-sm text-ink-muted">累计字数</span>
            <span className="stat-value">{totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}K` : totalWords}</span>
          </div>
          <div className="stat-row">
            <span className="text-sm text-ink-muted">章节数</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-row">
            <span className="text-sm text-ink-muted">已完成</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="section-title">最近活动</h3>
        <div className="mt-2">
          {recentChapters.length > 0 ? (
            recentChapters.map((chapter: Chapter) => (
              <div
                key={chapter.id}
                className="activity-item cursor-pointer"
                onClick={() => navigate(`/dialogue/${chapter.id}`)}
              >
                <span className={`timeline-dot ${chapter.status === 'completed' ? 'bg-brand' : 'bg-ink-faint'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-secondary leading-snug truncate">
                    {chapter.title}
                    {chapter.status === 'completed' ? ' 已完成' : ' 已更新'}
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5">{formatTime(chapter.updatedAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-ink-faint">暂无活动记录</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="section-title">快捷操作</h3>
        <div className="mt-3 flex flex-col gap-2">
          <button
            className="quick-action text-sm text-ink-muted"
            onClick={() => navigate('/autobiography')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span>查看自传</span>
          </button>
          <button
            className="quick-action text-sm text-ink-muted"
            onClick={() => navigate('/dialogue')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <span>开始对话</span>
          </button>
        </div>
      </section>
    </>
  );
};

export default RightPanel;
