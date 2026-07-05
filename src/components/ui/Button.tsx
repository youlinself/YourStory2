import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-apple-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none';

  const variantClasses = {
    primary: 'bg-apple-primary text-white rounded-full focus:ring-apple-primary-focus hover:brightness-110',
    secondary: 'bg-transparent text-apple-primary border border-apple-primary rounded-full hover:bg-apple-primary/5 focus:ring-apple-primary-focus',
    outline: 'bg-apple-pearl text-apple-ink-muted-80 border-[3px] border-apple-divider-soft rounded-[11px] hover:bg-apple-divider-soft/50 focus:ring-apple-hairline',
    ghost: 'bg-transparent text-apple-ink-muted-48 rounded-md hover:bg-apple-parchment focus:ring-apple-hairline',
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-[14px] leading-[1.29] tracking-[-0.224px]',
    md: 'px-[22px] py-[11px] text-[17px] leading-[1.47] tracking-[-0.374px]',
    lg: 'px-7 py-[14px] text-[18px] leading-[1.0] font-light',
  };

  const disabledClasses = disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
