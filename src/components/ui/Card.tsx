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
      className={`bg-white rounded-lg shadow-md p-6 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      } ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;