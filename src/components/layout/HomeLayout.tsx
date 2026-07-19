import React from 'react';
import Sidebar from './Sidebar';

interface HomeLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children, rightPanel }) => {
  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <Sidebar />

      <main className="content-panel">
        {children}
      </main>

      {rightPanel && (
        <aside className="right-panel shrink-0 flex flex-col gap-6">
          {rightPanel}
        </aside>
      )}
    </div>
  );
};

export default HomeLayout;
