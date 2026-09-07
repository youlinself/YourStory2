import React from 'react';
import LoadingDots from '../common/LoadingDots';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
  type?: 'button' | 'submit';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  loadingText,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 select-none rounded-lg active:scale-[0.97] disabled:active:scale-100';

  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-hover hover:shadow-md focus:ring-brand/50',
    secondary: 'bg-transparent text-brand border border-brand hover:bg-brand-light hover:shadow-sm focus:ring-brand/50',
    ghost: 'bg-transparent text-ink-secondary hover:bg-bg-secondary hover:text-ink-primary focus:ring-border-default',
    danger: 'bg-error text-white hover:bg-error/90 hover:shadow-md focus:ring-error/50',
  };

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs min-w-[64px]',
    md: 'px-5 py-[10px] text-sm min-w-[88px]',
    lg: 'px-7 py-3 text-base min-w-[104px]',
  };

  const isDisabled = disabled || isLoading;
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingDots size="sm" />
          {loadingText || '加载中...'}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
