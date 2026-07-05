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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-caption font-medium text-ink-secondary">
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
        className={`input-base ${error ? 'border-error' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {error && (
        <span className="text-caption text-error">{error}</span>
      )}
    </div>
  );
};

export default Input;
