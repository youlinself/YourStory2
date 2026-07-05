import React from 'react';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  className?: string;
}

const AIAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  className = '',
}) => {
  if (isUser) {
    return (
      <div className={`flex justify-end animate-fade-in ${className}`}>
        <div className="flex flex-col items-end gap-1.5 max-w-[75%]">
          <div className="chat-bubble-user">
            <p className="text-body leading-relaxed">{message}</p>
          </div>
          {timestamp && (
            <span className="text-fine-print text-ink-muted px-1">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-start animate-fade-in ${className}`}>
      <div className="flex gap-3 max-w-[80%]">
        <AIAvatar />
        <div className="flex flex-col gap-1.5">
          <div className="chat-bubble-ai">
            <p className="text-body-serif leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
          {timestamp && (
            <span className="text-fine-print text-ink-faint px-1">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
