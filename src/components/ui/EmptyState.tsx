import React from 'react';
import Button from './Button';

type IllustrationType = 'feather-quill' | 'book' | 'magnifying-glass' | 'tree-rings' | 'lightbulb' | 'default';

interface EmptyStateProps {
  illustration?: IllustrationType;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const Illustration: React.FC<{ type: IllustrationType }> = ({ type }) => {
  const illustrations: Record<IllustrationType, React.ReactNode> = {
    'feather-quill': (
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 65C20 65 25 55 35 45C45 35 55 25 60 20C65 15 70 12 70 12C70 12 67 18 62 23C57 28 47 38 37 48C27 58 22 65 20 65Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-brand-primary/60"
        />
        <path
          d="M20 65L18 70L25 68L20 65Z"
          fill="currentColor"
          className="text-brand-primary/40"
        />
        <path
          d="M15 68C15 68 12 72 10 75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-brand-primary/40"
        />
        <ellipse cx="40" cy="72" rx="20" ry="3" className="fill-current opacity-10 text-brand-primary" />
      </svg>
    ),
    'book': (
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 15C15 13.8954 15.8954 13 17 13H38C39.1046 13 40 13.8954 40 15V65C40 63.8954 39.1046 63 38 63H17C15.8954 63 15 62.1046 15 61V15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-primary/60"
        />
        <path
          d="M40 15C40 13.8954 40.8954 13 42 13H63C64.1046 13 65 13.8954 65 15V61C65 62.1046 64.1046 63 63 63H42C40.8954 63 40 63.8954 40 65V15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-primary/60"
        />
        <path d="M20 25H35" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
        <path d="M20 32H35" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
        <path d="M20 39H32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
        <path d="M45 25H60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
        <path d="M45 32H60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
        <path d="M45 39H57" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-brand-primary/30" />
      </svg>
    ),
    'magnifying-glass': (
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="35" r="20" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary/60" />
        <circle cx="35" cy="35" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-brand-primary/30" />
        <path
          d="M50 50L65 65"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-brand-primary/60"
        />
      </svg>
    ),
    'tree-rings': (
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="6" fill="currentColor" className="text-brand-primary/60" />
        <circle cx="40" cy="40" r="12" stroke="currentColor" strokeWidth="1" className="text-brand-primary/40" />
        <circle cx="40" cy="40" r="18" stroke="currentColor" strokeWidth="1" className="text-brand-primary/30" />
        <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth="1" className="text-brand-primary/20" />
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary/40" />
      </svg>
    ),
    'lightbulb': (
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 15C30 15 22 23 22 33C22 40 26 46 32 50V58C32 59.1046 32.8954 60 34 60H46C47.1046 60 48 59.1046 48 58V50C54 46 58 40 58 33C58 23 50 15 40 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-primary/60"
        />
        <path d="M35 65H45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand-primary/40" />
        <path d="M37 70H43" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand-primary/40" />
      </svg>
    ),
    'default': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary/40" />
        <path d="M8 20H56" stroke="currentColor" strokeWidth="1" className="text-brand-primary/30" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" className="text-brand-primary/30" />
        <circle cx="22" cy="16" r="1.5" fill="currentColor" className="text-brand-primary/30" />
        <circle cx="28" cy="16" r="1.5" fill="currentColor" className="text-brand-primary/30" />
      </svg>
    ),
  };

  return <div className="flex items-center justify-center">{illustrations[type]}</div>;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'default',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="flex items-center justify-center mb-5">
        {icon || <Illustration type={illustration} />}
      </div>
      <h3 className="text-heading text-ink-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-body text-ink-secondary max-w-sm mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-col items-center gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} isLoading={primaryAction.isLoading}>
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="text-caption text-ink-muted hover:text-brand-primary transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
