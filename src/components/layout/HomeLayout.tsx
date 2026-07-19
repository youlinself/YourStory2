import React from 'react';
import Sidebar from './Sidebar';

interface HomeLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children, rightPanel }) => {
  return (
    <div className="main-area">
      <Sidebar />
      <main className="content-panel">
        {children}
      </main>
      {rightPanel && (
        <aside className="right-panel">
          {rightPanel}
        </aside>
      )}
    </div>
  );
};

export default HomeLayout;
