import React from 'react';

const RightPanel: React.FC = () => {
  const stats = [
    { label: '今日对话', value: '6' },
    { label: '累计字数', value: '18.5K' },
    { label: 'AI 回复', value: '156' },
    { label: '消耗 Token', value: '23.4K' },
  ];

  const activities = [
    { type: 'complete', text: '"大学"章节已完成', time: '今天 15:44' },
    { type: 'info', text: 'AI完善了"童年"时间线', time: '今天 15:20' },
    { type: 'info', text: '新角色"小雨"已添加', time: '昨天 22:52' },
    { type: 'info', text: 'AI为你重写了"工作"场景', time: '昨天 21:10' },
    { type: 'info', text: '导出 PDF 成功', time: '昨天 16:35' },
    { type: 'info', text: '更新"爱情"章节风格', time: '前天 21:15' },
  ];

  const actions = [
    { icon: 'download', label: '导出全文' },
    { icon: 'copy', label: '复制章节' },
  ];

  const dotColors: Record<string, string> = {
    complete: 'bg-brand',
    info: 'bg-ink-faint',
  };

  const actionIcons: Record<string, React.ReactNode> = {
    download: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    copy: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
  };

  return (
    <>
      <section>
        <h3 className="section-title">今日数据</h3>
        <div className="mt-3">
          {stats.map((stat, index) => (
            <div key={index} className="stat-row">
              <span className="text-sm text-ink-muted">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">最近活动</h3>
        <div className="mt-2">
          {activities.map((item, index) => (
            <div key={index} className="activity-item">
              <span className={`timeline-dot ${dotColors[item.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-secondary leading-snug">{item.text}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">快捷操作</h3>
        <div className="mt-3 flex flex-col gap-2">
          {actions.map((action, index) => (
            <button key={index} className="quick-action text-sm text-ink-muted">
              <span>{actionIcons[action.icon]}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

export default RightPanel;
