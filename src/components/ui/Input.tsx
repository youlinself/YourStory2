import React from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  error?: string;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  error,
  className = '',
  onKeyPress,
  inputRef,
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-caption font-medium text-ink-secondary">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-[0.75rem] font-sans text-[0.9375rem] leading-normal text-ink-primary bg-bg-elevated border rounded-xl outline-none transition-all duration-200 placeholder:text-ink-faint border-border-default focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-light)] ${error ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(209,36,47,0.1)]' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {error && (
        <span className="text-caption text-error">{error}</span>
      )}
    </div>
  );
};

export default Input;
