import React from 'react';
import Button from './Button';

type ErrorIconType = 'wifi-offline' | 'server-error' | 'generic';

interface ErrorStateProps {
  icon?: ErrorIconType;
  iconNode?: React.ReactNode;
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
  offlineIndicator?: boolean;
  className?: string;
}

const ErrorIcon: React.FC<{ type: ErrorIconType }> = ({ type }) => {
  const icons: Record<ErrorIconType, React.ReactNode> = {
    'wifi-offline': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M32 48C34.2091 48 36 46.2091 36 44C36 41.7909 34.2091 40 32 40C29.7909 40 28 41.7909 28 44C28 46.2091 29.7909 48 32 48Z"
          fill="currentColor"
          className="text-error/60"
        />
        <path
          d="M20 36C24.5 31.5 28 30 32 30C36 30 39.5 31.5 44 36"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-error/40"
        />
        <path
          d="M12 28C18 22 24 20 32 20C40 20 46 22 52 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-error/30"
        />
        <path
          d="M4 20C12 12 20 10 32 10C44 10 52 12 60 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
          className="text-error/20"
        />
        <path
          d="M10 8L54 54"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-error/50"
        />
      </svg>
    ),
    'server-error': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-error/40" />
        <rect x="8" y="36" width="48" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-error/40" />
        <circle cx="16" cy="22" r="2" fill="currentColor" className="text-error/30" />
        <circle cx="24" cy="22" r="2" fill="currentColor" className="text-error/30" />
        <path d="M12 46H32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-error/30" />
        <path d="M12 50H40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-error/20" />
        <circle cx="48" cy="46" r="8" fill="currentColor" className="text-error/20" />
        <path d="M45 43L51 49M51 43L45 49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-error/60" />
      </svg>
    ),
    'generic': (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.5" className="text-error/40" />
        <path
          d="M32 20V36"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-error/60"
        />
        <circle cx="32" cy="44" r="2" fill="currentColor" className="text-error/60" />
      </svg>
    ),
  };

  return <div className="flex items-center justify-center">{icons[type]}</div>;
};

const ErrorState: React.FC<ErrorStateProps> = ({
  icon = 'generic',
  iconNode,
  title,
  description,
  primaryAction,
  secondaryAction,
  offlineIndicator = false,
  className = '',
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      {offlineIndicator && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 text-error text-caption font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          离线状态
        </div>
      )}
      <div className="flex items-center justify-center mb-5">
        {iconNode || <ErrorIcon type={icon} />}
      </div>
      <h3 className="text-heading text-ink-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-body text-ink-secondary max-w-sm mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex justify-center gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} isLoading={primaryAction.isLoading}>
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
