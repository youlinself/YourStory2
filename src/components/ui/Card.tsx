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
      className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {title && (
        <h3 className="text-heading mb-5">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
