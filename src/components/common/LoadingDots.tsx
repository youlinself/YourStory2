import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: { dot: 'w-1 h-1', gap: 'gap-1' },
    md: { dot: 'w-1.5 h-1.5', gap: 'gap-1.5' },
    lg: { dot: 'w-2 h-2', gap: 'gap-2' },
  };

  const config = sizeConfig[size];

  return (
    <span className={`flex items-center ${config.gap} ${className}`}>
      <span
        className={`${config.dot} rounded-full bg-current opacity-60 loading-dot`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`${config.dot} rounded-full bg-current opacity-60 loading-dot`}
        style={{ animationDelay: '200ms' }}
      />
      <span
        className={`${config.dot} rounded-full bg-current opacity-60 loading-dot`}
        style={{ animationDelay: '400ms' }}
      />
    </span>
  );
};

export default LoadingDots;
