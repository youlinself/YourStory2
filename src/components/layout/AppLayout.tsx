import React, { useEffect } from 'react';
import { Outlet, useLocation, Link, useParams } from 'react-router-dom';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useDialogueStore from '../../stores/dialogueStore';
import type { Chapter } from '../../types';

const navItems = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/dialogue', label: '对话创作', icon: 'message-circle' },
  { path: '/autobiography', label: '我的自传', icon: 'book-text' },
  { path: '/settings', label: '设置', icon: 'settings' },
];

const iconMap: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  'message-circle': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  'book-text': (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const SidebarBottomContent: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { chapterId: routeChapterId } = useParams<{ chapterId?: string }>();

  const { autobiography, load, getCompletionStats } = useAutobiographyStore();
  const { activeSession } = useDialogueStore();

  useEffect(() => {
    load();
  }, [load]);

  const chapters = autobiography?.chapters || [];
  const stats = getCompletionStats();
  const totalChapters = stats.total;
  const completedChapters = stats.completed;
  const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const currentChapterId = routeChapterId || activeSession?.chapterId;
  const currentChapter = currentChapterId ? chapters.find((ch: Chapter) => ch.id === currentChapterId) : null;

  const getChapterProgress = (status?: string): number => {
    switch (status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      case 'draft': return 30;
      default: return 0;
    }
  };

  if (path === '/') {
    return (
      <div className="px-5 py-5 border-t border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-ink-muted">整体进度</span>
          <span className="text-xs font-semibold text-brand">{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[11px] mt-2 text-ink-faint">
          {totalChapters > 0
            ? `${completedChapters}/${totalChapters} 章节已完成 · 继续加油`
            : '还没有章节，开始创作吧'}
        </p>
      </div>
    );
  }

  if (path === '/autobiography') {
    return (
      <div className="px-5 py-5 border-t border-border-subtle">
        <p className="text-xs font-medium text-ink-muted mb-2">写作进度</p>
        <div className="flex items-end gap-1.5 mb-2">
          {chapters.length > 0 ? (
            chapters.slice(0, 5).map((ch: Chapter, i: number) => {
              const h = getChapterProgress(ch.status);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${ch.status === 'completed' ? 'bg-success' : 'bg-brand'}`}
                    style={{ height: `${Math.max(h * 0.4, 8)}px` }}
                  />
                  <span className="text-[9px] text-ink-faint">{i + 1}</span>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-ink-faint">暂无章节</p>
          )}
        </div>
        <p className="text-[11px] text-ink-faint">
          {totalChapters > 0 ? `共 ${totalChapters} 个章节` : '开始创作你的故事'}
        </p>
      </div>
    );
  }

  if (path === '/settings') {
    return (
      <div className="px-5 py-5 border-t border-border-subtle">
        <p className="text-xs text-ink-faint">版本 v1.0.0</p>
        <p className="text-[11px] text-ink-faint mt-1">© 2024 YourStory</p>
      </div>
    );
  }

  if (path.startsWith('/dialogue')) {
    const sessionMessages = activeSession?.messages || [];
    const userMessageCount = sessionMessages.filter((m) => m.isUser).length;
    const generatedWords = sessionMessages
      .filter((m) => !m.isUser)
      .reduce((acc: number, m) => acc + m.content.length, 0);

    return (
      <>
        <div className="px-3 py-4">
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  {currentChapter?.title || '自由对话'}
                </p>
                <p className="text-[10px] text-ink-faint">当前章节</p>
              </div>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${currentChapter?.status === 'completed' ? 'complete' : ''}`}
                style={{ width: `${getChapterProgress(currentChapter?.status)}%` }}
              />
            </div>
            <p className="text-[10px] text-ink-faint mt-1.5">
              {currentChapter?.status === 'completed' ? '已完成' : '创作中'}
            </p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border-subtle">
          <p className="text-xs font-medium text-ink-muted mb-2">本次会话</p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-faint">对话轮次</span>
            <span className="text-xs font-medium text-ink">{userMessageCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-faint">生成字数</span>
            <span className="text-xs font-medium text-ink">{generatedWords > 1000 ? `${(generatedWords / 1000).toFixed(1)}K` : generatedWords}</span>
          </div>
        </div>
      </>
    );
  }

  return null;
};

const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="main-area h-screen">
      <aside className="sidebar h-full">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-ink">YourStory</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className={isActive ? 'text-brand' : ''}>{iconMap[item.icon]}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <SidebarBottomContent />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
