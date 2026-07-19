import React from 'react';
import { useNavigate } from 'react-router-dom';

const RightPanel: React.FC = () => {
  const navigate = useNavigate();

  const todayStats = [
    {
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      color: 'text-brand',
      label: '新增字数',
      value: '456',
    },
    {
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-info',
      label: '创作时长',
      value: '12 分钟',
    },
    {
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      color: 'text-sage',
      label: '对话轮次',
      value: '8',
    },
  ];

  const recentActivities = [
    {
      color: 'bg-success',
      title: '完成了「第三章 · 入职故事」',
      time: '10 分钟前',
    },
    {
      color: 'bg-brand',
      title: '保存了一段新对话',
      time: '今天 14:32',
    },
    {
      color: 'bg-gold',
      title: '导出自传草稿（PDF）',
      time: '昨天 20:15',
    },
    {
      color: 'bg-info',
      title: '更新了 AI 助手设定',
      time: '2 天前',
    },
  ];

  const quickActions = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      label: '新建对话',
      onClick: () => navigate('/dialogue'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      label: '查看草稿',
      onClick: () => navigate('/autobiography'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
      label: '导出自传',
      onClick: () => {},
    },
  ];

  return (
    <>
      <section>
        <h2 className="section-title mb-2">
          今日数据
        </h2>
        <div className="card p-1">
          {todayStats.map((stat, index) => (
            <div
              key={index}
              className={`stat-row ${index !== 0 ? 'border-t border-border-subtle' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-xs text-ink-secondary">{stat.label}</span>
              </div>
              <span className="text-serif text-base font-semibold text-ink">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-2">
          最近活动
        </h2>
        <div className="space-y-0.5">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className={`timeline-dot ${activity.color} mt-1`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink leading-normal">{activity.title}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-2">
          快捷操作
        </h2>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="quick-action w-full text-ink-secondary hover:text-brand"
            >
              <span className="text-ink-muted">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

export default RightPanel;
