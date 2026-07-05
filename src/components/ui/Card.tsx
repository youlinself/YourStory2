import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[18px] border border-apple-hairline p-6 ${
        onClick ? 'cursor-pointer hover:bg-apple-parchment/50 transition-colors duration-200' : ''
      } ${className}`}
    >
      {title && (
        <h3 className="text-apple-tagline text-apple-ink mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
