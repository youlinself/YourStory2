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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in ${className}`}
    >
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
        <p className={isUser ? 'text-body' : 'text-body-serif'}>{message}</p>
        {timestamp && (
          <p
            className={`text-fine-print mt-2 ${
              isUser ? 'text-ink-muted' : 'text-ink-faint'
            }`}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
