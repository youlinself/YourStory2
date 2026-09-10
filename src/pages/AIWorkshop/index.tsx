import React from 'react';
import TaskSubmissionPanel from '../../components/novel/TaskSubmissionPanel';
import WorkshopView from '../../components/novel/WorkshopView';
import OfficeCanvas from '../../components/novel/OfficeCanvas';
import DashboardHeader from '../../components/novel/DashboardHeader';

const AIWorkshopPage: React.FC = () => {
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
            <div className="xl:col-span-4">
              <TaskSubmissionPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkshopPage;
