import React, { useRef, useEffect } from 'react';
import { Sparkles, Users } from 'lucide-react';
import type { Message } from '../../types';
import ContentExtractCard from './ContentExtractCard';
import MDEditor from '@uiw/react-md-editor';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onApproveExtract: (messageId: string) => void;
  onRejectExtract: (messageId: string) => void;
  onEditExtract: (messageId: string, editedContent: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onApproveExtract,
  onRejectExtract,
  onEditExtract,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {!msg.isUser && (
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0">
              <Sparkles size={14} strokeWidth={1.5} />
            </div>
          )}
          <div className={`max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
            <div
              className={`rounded-2xl px-4 py-3 ${
                msg.isUser
                  ? 'bg-brand text-white rounded-br-md'
                  : 'bg-bg-secondary text-ink rounded-bl-md'
              }`}
            >
              {msg.isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="markdown-content text-sm leading-relaxed">
                  <MDEditor.Markdown source={msg.content} />
                </div>
              )}
            </div>
            <span className="text-[10px] text-ink-faint mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {msg.type === 'content_extract' && msg.extractedContent && (
              <ContentExtractCard
                extract={msg.extractedContent}
                onApprove={() => onApproveExtract(msg.id)}
                onReject={() => onRejectExtract(msg.id)}
                onEdit={(editedContent) => onEditExtract(msg.id, editedContent)}
              />
            )}
          </div>
          {msg.isUser && (
            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-ink-muted shrink-0">
              <Users size={14} strokeWidth={1.5} />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0">
            <Sparkles size={14} strokeWidth={1.5} />
          </div>
          <div className="bg-bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatPanel;
