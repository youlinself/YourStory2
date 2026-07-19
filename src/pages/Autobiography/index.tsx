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

  const todoCount = groups.filter(g => g.progress < 100 && g.progress > 0).length;
  const completedCount = groups.filter(g => g.progress === 100).length;

  return (
    <div className="content-panel">
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
                {groups.length}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('in-progress')}
            >
              草稿
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {todoCount}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              已完成
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {completedCount}
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
    </div>
  );
};

export default AutobiographyPage;
