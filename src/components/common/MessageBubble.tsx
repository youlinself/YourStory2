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
        className={`max-w-[70%] rounded-[18px] px-5 py-3 ${
          isUser
            ? 'bg-apple-primary text-white'
            : 'bg-apple-canvas border border-apple-hairline text-apple-ink'
        }`}
      >
        <p className="text-apple-body">{message}</p>
        {timestamp && (
          <p
            className={`text-apple-fine-print mt-[6px] ${
              isUser ? 'text-white/60' : 'text-apple-ink-muted-48'
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
