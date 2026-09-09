import React from 'react';
import TaskSubmissionPanel from '../../components/novel/TaskSubmissionPanel';
import WorkshopView from '../../components/novel/WorkshopView';
import OfficeCanvas from '../../components/novel/OfficeCanvas';

const AIWorkshopPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border-subtle bg-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏭</span>
          <div>
            <h1 className="text-xl font-bold text-ink">AI工作间</h1>
            <p className="text-sm text-ink-muted">发布创作任务，让AI智囊团协作完成</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-bg-subtle">
        <div className="max-w-5xl mx-auto space-y-6">
          <OfficeCanvas />
          <TaskSubmissionPanel />
          <WorkshopView />
        </div>
      </div>
    </div>
  );
};

export default AIWorkshopPage;
