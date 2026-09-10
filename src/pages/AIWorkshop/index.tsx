import React, { useState } from 'react';
import TaskSubmissionPanel from '../../components/novel/TaskSubmissionPanel';
import WorkshopView from '../../components/novel/WorkshopView';
import OfficeCanvas from '../../components/novel/OfficeCanvas';
import DashboardHeader from '../../components/novel/DashboardHeader';
import SecretaryAssistant from '../../components/novel/SecretaryAssistant';

const AIWorkshopPage: React.FC = () => {
  const [showSecretary, setShowSecretary] = useState(false);

  return (
    <div className="h-full flex flex-col bg-bg-subtle">
      <DashboardHeader />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
            <div className="xl:col-span-8 space-y-4">
              <OfficeCanvas />
              <WorkshopView />
            </div>
            <div className="xl:col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSecretary(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !showSecretary
                      ? 'bg-brand text-white'
                      : 'bg-bg-subtle text-ink-muted hover:bg-bg-base'
                  }`}
                >
                  任务面板
                </button>
                <button
                  onClick={() => setShowSecretary(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    showSecretary
                      ? 'bg-brand text-white'
                      : 'bg-bg-subtle text-ink-muted hover:bg-bg-base'
                  }`}
                >
                  <span>📋</span>
                  秘书助手
                </button>
              </div>
              <div className="h-[calc(100vh-200px)]">
                {showSecretary ? (
                  <SecretaryAssistant onClose={() => setShowSecretary(false)} />
                ) : (
                  <TaskSubmissionPanel />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkshopPage;
