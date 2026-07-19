import React, { useState } from 'react';

interface MessageBubbleProps {
  message: React.ReactNode;
  isUser: boolean;
  timestamp?: Date;
  className?: string;
  isStreaming?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

const AIAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1">
    <div className="loading-dot" />
    <div className="loading-dot" />
    <div className="loading-dot" />
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  className = '',
  isStreaming = false,
  onEdit,
  onRegenerate,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    onEdit?.();
    setShowActions(false);
  };

  const handleRegenerate = () => {
    onRegenerate?.();
    setShowActions(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setShowActions(false);
  };

  if (isUser) {
    return (
      <div
        className={`flex justify-end animate-fade-in ${className}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex flex-col items-end gap-1.5 max-w-[75%]">
          <div className="relative group">
            <div className="chat-bubble-user">
              <p className="text-body leading-relaxed">{message}</p>
            </div>
            {showActions && !isStreaming && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full flex gap-1">
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle shadow-sm hover:bg-bg-subtle transition-colors"
                  title="编辑"
                >
                  <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle shadow-sm hover:bg-danger/10 transition-colors"
                  title="删除"
                >
                  <svg className="w-3.5 h-3.5 text-ink-muted hover:text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            )}
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
    <div
      className={`flex justify-start animate-fade-in ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3 max-w-[80%]">
        <AIAvatar />
        <div className="flex flex-col gap-1.5">
          <div className="relative group">
            <div className="chat-bubble-ai">
              {isStreaming && !message ? (
                <TypingIndicator />
              ) : (
                <p className="text-body-serif leading-relaxed whitespace-pre-wrap">{message}</p>
              )}
            </div>
            {showActions && !isStreaming && onRegenerate && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex gap-1">
                <button
                  onClick={handleRegenerate}
                  className="p-1.5 rounded-lg bg-bg-elevated border border-border-subtle shadow-sm hover:bg-bg-subtle transition-colors"
                  title="重新生成"
                >
                  <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            )}
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
