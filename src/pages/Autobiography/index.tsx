import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type TabKey = 'all' | 'completed' | 'in-progress';

interface ChapterInfo {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  content: string;
  wordCount: number;
  progress: number;
  status: 'completed' | 'in-progress' | 'draft';
  statusLabel: string;
  chapterNumber: string;
}

interface ChapterListProps {
  title: string;
  count: number;
  chapters: ChapterInfo[];
}

const ChapterList: React.FC<ChapterListProps> = ({ title, count, chapters }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-2 bg-transparent border-none w-full"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3 h-3 text-ink-faint transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-serif text-[0.9375rem] font-semibold text-ink">
            {title} <span className="text-ink-faint font-normal">({count})</span>
          </span>
        </div>
      </div>

      {isExpanded && (
        <>
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-6 py-5 mb-3 cursor-pointer transition-all hover:shadow-md hover:border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-serif text-xl font-semibold text-ink">
                    {chapter.title}
                  </h3>
                  <span className="text-xs text-ink-faint">{chapter.chapterNumber}</span>
                </div>
                <p className="text-sm text-ink-muted mt-0.5">{chapter.subtitle}</p>
                <p className="text-xs text-ink-faint mt-1">{chapter.time}</p>
              </div>
              <span className={`badge whitespace-nowrap ${
                chapter.status === 'completed'
                  ? 'bg-success-bg text-success'
                  : chapter.status === 'in-progress'
                  ? 'bg-brand-surface text-brand'
                  : 'bg-bg-subtle text-ink-muted'
              }`}>
                {chapter.statusLabel}
              </span>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed text-serif">
              {chapter.content}
            </p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-xs text-ink-faint">
                <span>{chapter.wordCount.toLocaleString()} 字</span>
                <span>进度 {chapter.progress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost border border-border-subtle text-ink-muted hover:border-brand hover:text-brand px-3 py-1.5 text-xs">
                  预览
                </button>
                <button className="btn btn-primary px-3 py-1.5 text-xs">
                  编辑
                </button>
              </div>
            </div>
          </div>
        ))}
        </>
      )}
    </div>
  );
};

const Autobiography: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: '全部章节' },
    { key: 'completed', label: '已完成' },
    { key: 'in-progress', label: '进行中' },
  ];

  const navItems = [
    { id: 'home', label: '首页', path: '/' },
    { id: 'dialogue', label: '对话创作', path: '/dialogue' },
    { id: 'autobiography', label: '我的自传', path: '/autobiography' },
    { id: 'settings', label: '设置', path: '/settings' },
  ];

  const [activeNav, setActiveNav] = useState('autobiography');

  const allChapters: ChapterInfo[] = [
    {
      id: 1,
      title: '童年时光',
      subtitle: '记忆深处的故乡',
      time: '2000年9月 - 2006年6月',
      content: '我出生在一个小山村里，那里有我记忆深处的故乡小路，外婆家的那棵大枣树...每天早上，阳光透过窗帘的缝隙照进来，我在外婆的轻声呼唤中醒来...',
      wordCount: 3240,
      progress: 100,
      status: 'completed',
      statusLabel: '已完成',
      chapterNumber: '第一章',
    },
    {
      id: 2,
      title: '求学岁月',
      subtitle: '知识改变命运',
      time: '2006年9月 - 2012年6月',
      content: '2006年夏天，我告别了爷爷奶奶，跟随父母来到县城读书。初中三年，我不仅学到了知识，更学会了如何与同学相处...',
      wordCount: 2856,
      progress: 100,
      status: 'completed',
      statusLabel: '已完成',
      chapterNumber: '第二章',
    },
    {
      id: 3,
      title: '初入职场的日子',
      subtitle: '第一次独立面对世界',
      time: '2018年7月 - 2019年12月',
      content: '第一次踏入职场，面对陌生的一切既紧张又兴奋。领导交给我的第一个项目是...',
      wordCount: 1842,
      progress: 65,
      status: 'in-progress',
      statusLabel: '进行中',
      chapterNumber: '第三章',
    },
    {
      id: 4,
      title: '重要的人',
      subtitle: '生命中的温暖阳光',
      time: '一生中的重要角色',
      content: '在我的生命里，有许多人留下了深刻的印记...',
      wordCount: 0,
      progress: 0,
      status: 'draft',
      statusLabel: '草稿',
      chapterNumber: '第四章',
    },
  ];

  const completedChapters = allChapters.filter((c) => c.status === 'completed');
  const inProgressChapters = allChapters.filter((c) => c.status === 'in-progress');

  const stats = [
    { label: '章节', value: '8' },
    { label: '总字数', value: '9,456' },
    { label: '完成度', value: '38%' },
  ];

  const getDisplayChapters = () => {
    switch (activeTab) {
      case 'completed':
        return (
          <ChapterList
            title="已完成"
            count={completedChapters.length}
            chapters={completedChapters}
          />
        );
      case 'in-progress':
        return (
          <ChapterList
            title="进行中"
            count={inProgressChapters.length}
            chapters={inProgressChapters}
          />
        );
      default:
        return (
          <>
            {completedChapters.length > 0 && (
              <ChapterList
                title="已完成"
                count={completedChapters.length}
                chapters={completedChapters}
              />
            )}
            {inProgressChapters.length > 0 && (
              <ChapterList
                title="进行中"
                count={inProgressChapters.length}
                chapters={inProgressChapters}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[240px] bg-bg-elevated border-r border-border-subtle flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-brand">
            <span className="text-white font-bold text-sm">YS</span>
          </div>
          <span className="font-semibold text-ink text-[0.9375rem] text-serif">YourStory</span>
        </div>

        <nav className="px-3 py-4 flex-1">
          <div className="mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>创作</span>
          </div>
          <ul className="space-y-1">
            {navItems.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`nav-link ${item.id === activeNav ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>设置</span>
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                to="/settings"
                className="nav-link"
              >
                设置
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mx-3 mb-4 p-3 rounded-md bg-brand-surface border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.6875rem] font-medium text-ink-muted">写作进度</span>
            <span className="text-[0.6875rem] font-medium text-brand">38%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '38%' }} />
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto py-6 px-10 bg-bg">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-ink text-serif">
                我的自传
              </h1>
              <p className="text-sm text-ink-muted mt-1">记录你的人生故事，让它代代相传</p>
            </div>
            <button className="btn btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              新建章节
            </button>
          </div>

          <div className="flex items-center gap-8 mb-6 p-4 card">
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                <div className="text-center">
                  <p className="text-serif text-xl font-semibold text-brand">{stat.value}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{stat.label}</p>
                </div>
                {index < stats.length - 1 && (
                  <div className="h-8 w-px bg-border-subtle" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-bg-elevated border border-border-subtle rounded-md p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all bg-transparent border-none cursor-pointer ${
                    activeTab === tab.key
                      ? 'text-brand bg-brand-surface'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索章节..."
                  className="input pl-9 w-48"
                />
              </div>
              <button className="btn btn-ghost border border-border-subtle text-ink-muted flex items-center gap-1.5 px-3 py-2 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                筛选
              </button>
            </div>
          </div>

          {getDisplayChapters()}
        </div>
      </div>
    </div>
  );
};

export default Autobiography;
