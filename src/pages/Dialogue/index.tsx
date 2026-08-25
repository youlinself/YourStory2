import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Home,
  MessageSquareText,
  BookOpen,
  Settings,
  Bell,
  Download,
  Sparkles,
  Send,
  Sun,
  GraduationCap,
  Briefcase,
  Heart,
  ChevronRight,
  PenLine,
} from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import MessageBubble from '@/components/common/MessageBubble';
import SuggestionBar from '@/components/dialogue/SuggestionBar';
import { CommandPanel } from '@/components/dialogue/CommandPanel';
import { SkillSwitcher } from '@/components/dialogue/SkillSwitcher';
import { useChatScroll, useRunTimer } from '@/hooks/useChatScroll';
import '../../styles/dialogue.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const DialoguePage: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    agent,
    currentSession,
    isLoading,
    error,
    initialize,
    createSession,
    sendMessage,
    activeSkills,
    pendingToolCalls
  } = useAgentStore();

  const suggestions = [
    { color: 'bg-brand', text: '聊聊童年' },
    { color: 'bg-gold', text: '校园时光' },
    { color: 'bg-sage', text: '工作经历' },
    { color: 'bg-info', text: '人生感悟' },
  ];

  const topicItems = [
    { icon: Sun, label: '童年趣事', color: 'text-amber-500' },
    { icon: GraduationCap, label: '学生时代', color: 'text-blue-500' },
    { icon: Briefcase, label: '工作生涯', color: 'text-emerald-500' },
    { icon: Heart, label: '婚姻家庭', color: 'text-rose-500' },
  ];

  const followupItems = [
    '童年最难忘的一件事是什么？',
    '小时候的家庭环境如何？',
    '童年时期对你影响最大的人是谁？',
  ];

  // 智能滚动管理
  const { listRef, columnRef, atBottom, scrollToBottom } = useChatScroll(messages);
  const { elapsedMs, formatDuration } = useRunTimer(isLoading ? Date.now() : null);

  useEffect(() => {
    if (!agent) {
      initialize();
    }
  }, [agent, initialize]);

  useEffect(() => {
    if (agent && chapterId && !currentSession) {
      createSession(chapterId);
    }
  }, [agent, chapterId, currentSession, createSession]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await sendMessage(userMessage);

      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `出错了: ${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  if (!currentSession) {
    return (
      <div className="main-area">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo-icon brand-gradient">
                <BookOpen size={16} strokeWidth={2.5} />
              </div>
              <span className="logo-text">YourStory</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" className="nav-link">
              <Home size={18} />
              <span>首页</span>
            </Link>
            <span className="nav-link active">
              <MessageSquareText size={18} className="text-brand" />
              <span>对话创作</span>
            </span>
            <Link to="/autobiography" className="nav-link">
              <BookOpen size={18} />
              <span>我的自传</span>
            </Link>
            <Link to="/settings" className="nav-link">
              <Settings size={18} />
              <span>设置</span>
            </Link>
          </nav>
        </aside>
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>正在初始化对话...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="main-area">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon brand-gradient">
              <BookOpen size={16} strokeWidth={2.5} />
            </div>
            <span className="logo-text">YourStory</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            <Home size={18} />
            <span>首页</span>
          </Link>
          <span className="nav-link active">
            <MessageSquareText size={18} className="text-brand" />
            <span>对话创作</span>
          </span>
          <Link to="/autobiography" className="nav-link">
            <BookOpen size={18} />
            <span>我的自传</span>
          </Link>
          <Link to="/settings" className="nav-link">
            <Settings size={18} />
            <span>设置</span>
          </Link>
        </nav>

        <div className="sidebar-chapter-card">
          <div className="chapter-card-header">
            <div className="chapter-icon">
              <PenLine size={14} className="text-white" />
            </div>
            <div className="chapter-info">
              <p className="chapter-title">当前章节</p>
              <p className="chapter-subtitle">会话 ID: {currentSession.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill in-progress" style={{ width: '50%' }} />
          </div>
          <p className="chapter-status">进行中</p>
        </div>

        <div className="sidebar-stats">
          <p className="stats-title">本次会话</p>
          <div className="stat-row">
            <span className="stat-label">对话轮次</span>
            <span className="stat-value">{messages.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">生成字数</span>
            <span className="stat-value">{messages.reduce((sum, m) => sum + m.content.length, 0)}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-title">技能</p>
          <SkillSwitcher />
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="app-header">
          <div className="header-left">
            <div className="avatar brand-gradient text-white">
              <Sparkles size={16} strokeWidth={2.5} />
            </div>
            <div className="header-info">
              <h2 className="header-title">章节对话</h2>
              <p className="header-subtitle">第 1 章 · 进行中</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="flex gap-2 mr-4">
              {activeSkills.map(skill => (
                <span
                  key={skill}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
            <button className="icon-button" title="通知">
              <Bell size={18} />
            </button>
            <button className="icon-button" title="导出">
              <Download size={18} />
            </button>
          </div>
        </header>

        {/* Tool Call Status */}
        {pendingToolCalls.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-500">
            {pendingToolCalls.map(call => (
              <span
                key={call.name}
                className={`mr-2 ${
                  call.status === 'running' ? 'text-yellow-600' :
                  call.status === 'completed' ? 'text-green-600' :
                  call.status === 'failed' ? 'text-red-600' : ''
                }`}
              >
                {call.name}: {call.status}
              </span>
            ))}
          </div>
        )}

        {/* Messages Area */}
        <div
          className="message-list"
          ref={listRef}
          data-conversation-scroll="true"
        >
          <div ref={columnRef}>
            {/* Initial AI Message */}
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="message-avatar">
                  <Sparkles size={16} strokeWidth={2.5} />
                </div>
                <div className="welcome-content">
                  <p className="welcome-sender">AI 创作助手</p>
                  <div className="chat-bubble chat-bubble-ai animate-fade-in">
                    <p>你好！我是你的 AI 创作助手。今天我们来聊聊你的人生故事。</p>
                    <p className="mt-2">你想从哪个话题开始呢？可以选择下方的话题，也可以直接告诉我你想聊的内容。</p>
                  </div>

                  <div className="topic-grid">
                    {topicItems.map((topic, index) => (
                      <button key={index} className="topic-card">
                        <span className={`topic-icon-wrapper ${topic.color}`}>
                          <topic.icon size={16} />
                        </span>
                        <span>{topic.label}</span>
                        <ChevronRight size={14} className="topic-arrow" />
                      </button>
                    ))}
                  </div>

                  <div className="followup-section">
                    <p className="followup-title">你可以这样问我：</p>
                    {followupItems.map((item, index) => (
                      <div key={index} className="followup-item">
                        <span className="followup-mark">Q:</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg.content}
                isUser={msg.role === 'user'}
                timestamp={new Date(msg.timestamp)}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="message-avatar">
                    <Sparkles size={16} strokeWidth={2.5} />
                  </div>
                  <div className="chat-bubble chat-bubble-ai">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Turn Status */}
            {isLoading && elapsedMs >= 15000 && (
              <div className="turn-status" role="status" aria-live="polite">
                <span>思考中...</span>
                <span className="turn-status-clock" aria-hidden>
                  {formatDuration(elapsedMs)}
                </span>
              </div>
            )}
          </div>

          {/* Scroll to Bottom Button */}
          {!atBottom && (
            <button
              className="scroll-to-bottom"
              aria-label="滚动到底部"
              onClick={scrollToBottom}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* Command Panel */}
        <div className="px-6 pb-2">
          <CommandPanel />
        </div>

        {/* Suggestion Bar */}
        <SuggestionBar
          suggestions={[]}
          onSuggestionClick={handleSuggestionClick}
          isLoading={isLoading}
        />

        {/* Input Area */}
        <div className="composer-area">
          <div className="suggestion-chips">
            {suggestions.map((chip, index) => (
              <button
                key={index}
                className="chip"
                onClick={() => handleSuggestionClick(chip.text)}
              >
                <span className={`chip-dot ${chip.color}`} />
                {chip.text}
              </button>
            ))}
          </div>
          <div className="composer-input-wrap">
            <div className="composer-prefix">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <textarea
              ref={textareaRef}
              className="composer-textarea"
              placeholder="聊聊你想记录的人生故事..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <button
              className="send-button"
              data-active={inputValue.trim() ? 'true' : undefined}
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="composer-footer">
            <p className="composer-hint">
              输入 <kbd>Enter</kbd> 发送，<kbd>Shift+Enter</kbd> 换行
            </p>
            {inputValue.length > 0 && (
              <span className="char-count">
                {inputValue.length} 字
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DialoguePage;
