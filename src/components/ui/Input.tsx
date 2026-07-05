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
}) => {
  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      {label && (
        <label className="text-apple-caption-strong text-apple-ink-muted-80">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className={`px-5 py-3 border rounded-full text-apple-body text-apple-ink placeholder:text-apple-ink-muted-48
          focus:outline-none focus:ring-2 focus:ring-apple-primary-focus focus:border-transparent
          ${error ? 'border-red-400' : 'border-apple-hairline'}
          ${disabled ? 'bg-apple-parchment cursor-not-allowed text-apple-ink-muted-48' : 'bg-white'}`}
      />
      {error && (
        <span className="text-apple-caption text-red-500">{error}</span>
      )}
    </div>
  );
};

export default Input;
