import React, { useRef, useEffect } from 'react';
import { Sparkles, Users, BookOpen, TreePine, Cake, School, PenLine } from 'lucide-react';
import type { Message } from '../../types';
import ContentExtractCard from './ContentExtractCard';
import MDEditor from '@uiw/react-md-editor';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  hasHistory: boolean;
  onApproveExtract: (messageId: string) => void;
  onRejectExtract: (messageId: string) => void;
  onEditExtract: (messageId: string, editedContent: string) => void;
  onStartChapter: () => void;
  onTopicClick: (label: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  hasHistory,
  onApproveExtract,
  onRejectExtract,
  onEditExtract,
  onStartChapter,
  onTopicClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      <div>
        {!hasHistory && !isLoading && (
          <div className="welcome-hero">
            <div className="hero-icon">
              <BookOpen size={32} strokeWidth={1.5} className="text-brand" />
            </div>
            <h1 className="hero-title">开始你的故事创作之旅</h1>
            <p className="hero-subtitle">
              Story 助手将引导你通过对话的方式，把珍贵的记忆一一记录下来
            </p>

            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={onStartChapter}>
                <PenLine size={18} strokeWidth={2} />
                开始创作
              </button>
              <p className="cta-hint">选择一个话题开始，或直接点击按钮开启创作</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${msg.isUser ? 'message-row-user' : 'message-row-ai'}`}
          >
            {!msg.isUser && (
              <div className="avatar brand-gradient text-white">
                <Sparkles size={16} strokeWidth={1.5} />
              </div>
            )}
            <div className={`chat-bubble ${msg.isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              {msg.isUser ? (
                <p>{msg.content}</p>
              ) : (
                <div className="markdown-content">
                  <MDEditor.Markdown source={msg.content} />
                </div>
              )}
              <span className="message-time">
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
              <div className="avatar avatar-user">
                <Users size={16} strokeWidth={1.5} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message-row message-row-ai">
            <div className="avatar brand-gradient text-white">
              <Sparkles size={16} strokeWidth={1.5} />
            </div>
            <div className="chat-bubble chat-bubble-ai">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatPanel;
