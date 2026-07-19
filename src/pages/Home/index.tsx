import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../../components/layout/HomeLayout';
import RightPanel from '../../components/home/RightPanel';

type TabKey = 'overview' | 'create' | 'stats';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '概览' },
    { key: 'create', label: '创作' },
    { key: 'stats', label: '统计' },
  ];

  const chapters = [
    {
      id: 1,
      title: '童年时光',
      description: '记忆深处的故乡小路，外婆家的那棵大枣树……',
      wordCount: '1,240',
      progress: 100,
      status: 'completed',
      statusLabel: '已完成',
      chapterNumber: '第一章',
    },
    {
      id: 2,
      title: '求学岁月',
      description: '校园里那些充满梦想的日子，与同窗的故事……',
      wordCount: '2,180',
      progress: 100,
      status: 'completed',
      statusLabel: '已完成',
      chapterNumber: '第二章',
    },
    {
      id: 3,
      title: '初入职场的日子',
      description: '第一次踏入职场，面对陌生的一切既紧张又兴奋……',
      wordCount: '860',
      progress: 60,
      status: 'in-progress',
      statusLabel: '进行中',
      chapterNumber: '第三章',
    },
    {
      id: 4,
      title: '重要的人',
      description: '那些在你的生命里留下印记的人，等待诉说……',
      wordCount: null,
      progress: 0,
      status: 'draft',
      statusLabel: '草稿',
      chapterNumber: '第四章',
    },
  ];

  const steps = [
    {
      number: 1,
      title: '配置 AI 助手',
      description: '选择你喜欢的叙事风格，让 AI 更懂你的故事基调。',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      footer: '下一步: 开始对话',
      footerIcon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      ),
      footerColor: 'text-ink-faint',
    },
    {
      number: 2,
      title: '开始对话',
      description: '与 AI 自由对话，挖掘记忆深处的珍贵片段。',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      footer: '下一步: 审阅导出',
      footerIcon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      ),
      footerColor: 'text-ink-faint',
    },
    {
      number: 3,
      title: '审阅与导出',
      description: '整理润色你的故事，导出为精美的自传文稿。',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      footer: '完成创作流程',
      footerIcon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
      footerColor: 'text-success',
    },
  ];

  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge bg-success-bg text-success';
      case 'in-progress':
        return 'badge bg-brand-surface text-brand';
      case 'draft':
        return 'badge bg-bg-subtle text-ink-muted';
      default:
        return '';
    }
  };

  return (
    <HomeLayout rightPanel={<RightPanel />}>
      <div className="max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-ink text-serif">
            欢迎回来
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            今天，继续书写属于你的篇章吧。
          </p>
        </div>

        <div className="flex items-center gap-6 mb-6 pb-0 border-b border-border-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer ${
                activeTab === tab.key ? 'active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              章节进度
            </h2>
            <button
              onClick={() => navigate('/autobiography')}
              className="text-xs text-ink-muted hover:text-brand flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
            >
              查看全部
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                onClick={() => navigate('/dialogue')}
                className="chapter-card cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={getBadgeClasses(chapter.status)}>
                    {chapter.status === 'completed' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {chapter.status === 'in-progress' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                    {chapter.status === 'draft' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    )}
                    {chapter.statusLabel}
                  </span>
                  <span className="text-[11px] text-ink-faint">{chapter.chapterNumber}</span>
                </div>
                <h3 className="text-[15px] font-medium text-ink mb-1.5">{chapter.title}</h3>
                <p className="text-xs text-ink-muted mb-3 line-clamp-2 leading-relaxed">{chapter.description}</p>
                {chapter.wordCount ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-ink-faint mb-1.5">
                      <span>{chapter.wordCount} 字</span>
                      <span>{chapter.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`h-full rounded-full transition-all duration-400 ${
                          chapter.progress === 100 ? 'bg-success' : 'bg-brand'
                        }`}
                        style={{ width: `${chapter.progress}%`, borderRadius: 'var(--radius-full)' }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center text-[11px] text-ink-faint mt-6">
                    <span>尚未开始</span>
                  </div>
                )}
              </div>
            ))}

            <div
              onClick={() => navigate('/dialogue')}
              className="border-[1.5px] border-dashed border-border-emphasis rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-brand hover:bg-brand-surface min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-full bg-bg-subtle flex items-center justify-center">
                <svg className="w-5 h-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm font-medium text-ink-muted">开始下一章</span>
              <span className="text-[11px] text-ink-faint">点击添加新章节</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title mb-4">
            快速开始指南
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="chapter-card flex-col items-start gap-3.5 hover:shadow-md hover:border-border"
              >
                <div className="w-7 h-7 rounded-full bg-brand-surface text-brand flex items-center justify-center text-xs font-semibold text-serif">
                  {step.number}
                </div>
                <div className="flex items-center justify-center w-full py-2 text-brand">
                  {step.icon}
                </div>
                <h3 className="text-[15px] font-medium text-ink">{step.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{step.description}</p>
                <div className={`flex items-center gap-1 text-[11px] mt-auto pt-2 ${step.footerColor}`}>
                  {step.footerIcon}
                  <span>{step.footer}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-8" />
      </div>
    </HomeLayout>
  );
};

export default Home;
