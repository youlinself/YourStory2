import React, { useState } from 'react';
import RightPanel from '../../components/home/RightPanel';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'steps'>('chapters');

  const chapters = [
    { title: '童年趣事', desc: '童年生活的点滴记录，无忧无虑的时光', progress: 100, status: '已完成', badge: 'complete' },
    { title: '学生时代', desc: '求学阶段的成长故事，从小学到大学', progress: 100, status: '已完成', badge: 'complete' },
    { title: '工作生涯', desc: '职场经历与感悟，一路走来的成长与收获', progress: 100, status: '已完成', badge: 'complete' },
    { title: '婚姻家庭', desc: '爱情与生活，另一半和家庭故事', progress: 65, status: '进行中', badge: 'progress' },
    { title: '人生感悟', desc: '积累多年的思考与感悟，人生的得与失', progress: 40, status: '进行中', badge: 'progress' },
  ];

  const steps = [
    { title: '话题引导', desc: '通过对话形式，引导你回忆和讲述人生故事', num: 1 },
    { title: '内容生成', desc: 'AI根据你的讲述，智能生成流畅的传记内容', num: 2 },
    { title: '审阅编辑', desc: '你可以对生成的内容进行修改和润色，使之更符合你的想法', num: 3 },
  ];

  const badgeStyles: Record<string, string> = {
    complete: 'badge badge-success',
    progress: 'badge badge-brand',
  };

  return (
    <div className="flex flex-1 min-h-0">
      <div className="content-panel flex-1">
        <div className="animate-fade-in">
          <div className="flex items-center gap-1 mb-1">
            <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
              欢迎回来，李华
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-ink-muted text-[14px] leading-relaxed">
            今天想聊聊人生中的哪个阶段呢？
          </p>

          <div
            className="flex items-center gap-6 border-b mb-5 animate-fade-in"
            style={{ borderColor: 'var(--color-border-subtle)', animationDelay: '0.05s' }}
          >
            <button
              className={`tab ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              概览
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {chapters.length}
              </span>
            </button>
            <button
              className={`tab ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              创作
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>
                {steps.length}
              </span>
            </button>
            <button className="tab">
              统计
              <span className="text-xs ml-1" style={{ color: 'var(--color-ink-faint)' }}>4</span>
            </button>
          </div>

          {activeTab === 'chapters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {chapters.map((chapter, index) => (
                <div key={index} className="chapter-card">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[15px] font-semibold leading-snug text-ink">{chapter.title}</h3>
                    <span className={badgeStyles[chapter.badge]} style={{ marginTop: '1px' }}>
                      {chapter.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed mb-3">{chapter.desc}</p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ink-faint">完成度</span>
                      <span className="text-xs font-medium text-ink-muted">{chapter.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${chapter.progress === 100 ? 'complete' : ''}`}
                        style={{ width: `${chapter.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button className="add-chapter-card text-ink-muted">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-sm font-medium">添加新章节</span>
              </button>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="flex gap-4 mt-6">
              {steps.map((step, index) => (
                <div key={index} className="step-card">
                  <span className="step-number">{step.num}</span>
                  <h3 className="text-[15px] font-semibold leading-snug text-ink">{step.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="right-panel">
        <RightPanel />
      </aside>
    </div>
  );
};

export default HomePage;
