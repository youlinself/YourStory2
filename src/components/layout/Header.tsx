import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/': return '首页';
      case '/dialogue': return '对话创作';
      case '/autobiography': return '我的自传';
      case '/settings': return '设置';
      default: return '';
    }
  })();

  return (
    <header className="bg-bg-elevated/80 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 h-15">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/')}
            className="text-body font-semibold text-ink-primary hover:text-brand-primary transition-colors"
          >
            YourStory
          </button>
          {pageTitle && (
            <>
              <span className="text-border-emphasis">|</span>
              <span className="text-caption text-ink-secondary">
                {pageTitle}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-secondary transition-colors"
            aria-label="设置"
          >
            <svg className="w-[18px] h-[18px] text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
