import React, { useState } from 'react';

interface Chapter {
  title: string;
  version: string;
  time: string;
}

interface ChapterGroup {
  name: string;
  progress: number;
  progressText: string;
  chapters: Chapter[];
}

const AutobiographyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));

  const stats = [
    { label: '章节', value: '8' },
    { label: '总字数', value: '18,542' },
    { label: '角色', value: '12' },
    { label: '时间线', value: '45 年' },
  ];

  const groups: ChapterGroup[] = [
    {
      name: '童年趣事',
      progress: 100,
      progressText: '已完成',
      chapters: [
        { title: '童年趣事', version: 'v3', time: '昨天 15:44' },
        { title: '童年趣事', version: 'v2', time: '前天 10:20' },
        { title: '童年趣事', version: 'v1', time: '2024/10/15' },
      ],
    },
    {
      name: '学生时代',
      progress: 100,
      progressText: '已完成',
      chapters: [
        { title: '学生时代', version: 'v2', time: '前天 11:30' },
        { title: '学生时代', version: 'v1', time: '2024/10/12' },
      ],
    },
    {
      name: '工作生涯',
      progress: 100,
      progressText: '已完成',
      chapters: [
        { title: '工作生涯', version: 'v2', time: '昨天 15:20' },
        { title: '工作生涯', version: 'v1', time: '2024/10/08' },
      ],
    },
    {
      name: '婚姻家庭',
      progress: 65,
      progressText: '进行中',
      chapters: [
        { title: '婚姻家庭', version: 'v1', time: '今天 22:52' },
      ],
    },
    {
      name: '人生感悟',
      progress: 40,
      progressText: '进行中',
      chapters: [
        { title: '人生感悟', version: 'v1', time: '今天 21:10' },
      ],
    },
  ];

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const filteredGroups = groups.filter(group => {
    if (activeTab === 'completed') return group.progress === 100;
    if (activeTab === 'in-progress') return group.progress < 100;
    return true;
  });

  return (
    <div className="main-area">
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
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </span>
            <span>首页</span>
          </a>
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </span>
            <span>对话创作</span>
          </a>
          <a className="nav-link active">
            <span className="text-brand">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </span>
            <span>我的自传</span>
          </a>
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>设置</span>
          </a>
        </nav>

        <div className="px-5 py-5 border-t border-border-subtle">
          <p className="text-xs font-medium text-ink-muted mb-2">写作进度</p>
          <div className="flex items-end gap-1.5 mb-2">
            {[100, 100, 100, 65, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm ${h === 100 ? 'bg-success' : 'bg-brand'}`}
                  style={{ height: `${h * 0.4}px` }}
                />
                <span className="text-[9px] text-ink-faint">{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-faint">预计还需 5 小时完成</p>
        </div>
      </aside>

      <main className="content-panel">
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
              我的自传
            </h1>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>导出</span>
              </button>
              <button className="btn btn-primary text-xs">
                <span>预览全文</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <p className="text-xs text-ink-muted">{stat.label}</p>
                <p className="stat-value mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-6">
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                全部
              </button>
              <button
                className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('in-progress')}
              >
                进行中
              </button>
              <button
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                已完成
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
            {filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-border-subtle rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
                  onClick={() => toggleGroup(groupIndex)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-ink-muted transition-transform ${expandedGroups.has(groupIndex) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-sm font-medium text-ink">{group.name}</span>
                    <span className={`badge ${group.progress === 100 ? 'badge-success' : 'badge-brand'}`}>
                      {group.progressText}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">{group.progress}%</span>
                    <div className="w-20 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${group.progress === 100 ? 'bg-success' : 'bg-brand'}`}
                        style={{ width: `${group.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
                {expandedGroups.has(groupIndex) && (
                  <div className="border-t border-border-subtle">
                    {group.chapters.map((chapter, chapterIndex) => (
                      <div
                        key={chapterIndex}
                        className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors cursor-pointer"
                        style={{ paddingLeft: '3.25rem' }}
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="text-sm text-ink-secondary">{chapter.title}</span>
                          <span className="text-xs text-ink-faint">{chapter.version}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-faint">{chapter.time}</span>
                          <button className="p-1 rounded hover:bg-bg-subtle">
                            <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AutobiographyPage;
