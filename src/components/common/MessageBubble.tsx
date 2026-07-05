import React from 'react';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  className = '',
}) => {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <p className="text-sm">{message}</p>
        {timestamp && (
          <p
            className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;