import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Home,
  MessageSquareText,
  BookOpen,
  Settings,
  Sparkles,
  Send,
  PenLine,
  TreePine,
  Users,
  Cake,
  School,
  Lightbulb,
  List,
  Info,
  MoreHorizontal,
  Save,
  Download,
  CheckCircle,
  Clock,
  Target,
  PencilLine,
  MessagesSquare,
  Bookmark,
} from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
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
  } = useAgentStore();

  const topicItems = [
    { icon: TreePine, label: '老家的环境', color: 'sage', description: '那条小河，那棵老槐树，那个宁静的小镇' },
    { icon: Users, label: '童年的玩伴们', color: 'gold', description: '一起长大的朋友，那些无忧无虑的时光' },
    { icon: Cake, label: '难忘的生日', color: 'brand', description: '那些特别的庆祝时刻，收到过的礼物' },
    { icon: School, label: '小学的时光', color: 'sage', description: '校园里的记忆，第一份友谊' },
  ];

  const followupItems = [
    '那条小河里，你和小伙伴们有没有一起玩耍的回忆？比如捉鱼、戏水？',
    '老槐树下发生过什么令你难忘的事情吗？夏天的树荫下，一定藏着许多故事。',
    '这个小镇给你的整体感觉是什么？它和你后来生活的城市有什么不同？',
  ];

  const suggestions = [
    { color: 'sage', text: '聊聊老家的环境', icon: TreePine },
    { color: 'gold', text: '童年的玩伴们', icon: Users },
    { color: 'brand', text: '难忘的生日', icon: Cake },
  ];

  const outlineItems = [
    { title: '老家的环境', status: '进行中', words: 780, color: 'brand' },
    { title: '童年的玩伴', status: '待探索', words: 0, color: 'gold' },
    { title: '难忘的生日', status: '待探索', words: 0, color: 'muted' },
    { title: '小学的时光', status: '待探索', words: 0, color: 'muted' },
  ];

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

  const handleTopicClick = (label: string) => {
    setInputValue(`我想先聊聊${label}`);
  };

  if (!currentSession) {
    return (
      <div className="main-area">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo-icon brand-gradient">
                <BookOpen size={18} strokeWidth={1.5} />
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
              <MessageSquareText size={18} />
              <span>对话创作</span>
            </span>
            <Link to="/autobiography" className="nav-link">
              <BookOpen size={18} />
              <span>我的自传</span>
            </Link>
            <div className="nav-section">
              <span className="nav-section-title">设置</span>
            </div>
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
      {/* ==================== 左侧 Sidebar ==================== */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon brand-gradient">
              <BookOpen size={18} strokeWidth={1.5} />
            </div>
            <span className="logo-text">YourStory</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            <Home size={18} />
            <span>首页</span>
          </Link>
          <span className="nav-link active">
            <MessageSquareText size={18} />
            <span>对话创作</span>
          </span>
          <Link to="/autobiography" className="nav-link">
            <BookOpen size={18} />
            <span>我的自传</span>
          </Link>
          <div className="nav-section">
            <span className="nav-section-title">设置</span>
          </div>
          <Link to="/settings" className="nav-link">
            <Settings size={18} />
            <span>设置</span>
          </Link>
        </nav>

        {/* Current Chapter Info */}
        <div className="sidebar-chapter-card">
          <div className="chapter-card-header">
            <Bookmark size={14} className="text-brand" />
            <span className="chapter-card-title">当前章节</span>
          </div>
          <p className="chapter-name">第一章 · 童年记忆</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '42%' }} />
          </div>
          <p className="chapter-status">进度 42% · 已完成 5 个话题</p>
        </div>

        {/* Session Stats */}
        <div className="sidebar-stats">
          <p className="stats-title">会话统计</p>
          <div className="stat-row">
            <span className="stat-label">消息数量</span>
            <span className="stat-value">{messages.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">已记录字数</span>
            <span className="stat-value">
              {messages.reduce((sum, m) => sum + m.content.length, 0).toLocaleString()}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">本次时长</span>
            <span className="stat-value">15 分钟</span>
          </div>
        </div>
      </aside>

      {/* ==================== 主内容区 ==================== */}
      <div className="center-column">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <div className="avatar brand-gradient text-white">
              <Sparkles size={16} strokeWidth={1.5} />
            </div>
            <div className="header-info">
              <div className="header-title-row">
                <span className="header-title">Story 助手</span>
                <span className="badge badge-success">在线</span>
              </div>
              <p className="header-subtitle">正在引导你完成第一章 · 童年记忆</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" title="大纲">
              <List size={18} strokeWidth={1.5} />
            </button>
            <button className="icon-button" title="信息">
              <Info size={18} strokeWidth={1.5} />
            </button>
            <button className="icon-button" title="更多">
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Message List */}
        <div className="message-list" ref={listRef}>
          <div ref={columnRef}>
            {/* Welcome Hero - shown when no messages */}
            {messages.length === 0 && (
              <div className="welcome-hero">
                <div className="hero-icon">
                  <BookOpen size={32} strokeWidth={1.5} className="text-brand" />
                </div>
                <h1 className="hero-title">开始你的故事创作之旅</h1>
                <p className="hero-subtitle">
                  Story 助手将引导你通过对话的方式，把珍贵的记忆一一记录下来
                </p>

                {/* Topic Suggestion Cards */}
                <div className="topic-grid">
                  {topicItems.map((topic, index) => (
                    <button
                      key={index}
                      className={`topic-card topic-card-${topic.color}`}
                      onClick={() => handleTopicClick(topic.label)}
                    >
                      <div className={`topic-icon-wrapper bg-${topic.color}-light`}>
                        <topic.icon size={20} strokeWidth={1.5} className={`text-${topic.color}`} />
                      </div>
                      <span className="topic-label">{topic.label}</span>
                      <p className="topic-description">{topic.description}</p>
                    </button>
                  ))}
                </div>

                {/* Primary CTA */}
                <div className="hero-cta">
                  <button className="btn btn-primary btn-lg">
                    <PenLine size={18} strokeWidth={2} />
                    开始第一章 · 童年记忆
                  </button>
                  <p className="cta-hint">选择一个话题开始，或直接点击按钮开启创作</p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-ai'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="avatar brand-gradient text-white">
                    <Sparkles size={16} strokeWidth={1.5} />
                  </div>
                )}
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <div className="avatar avatar-user">
                    <Users size={16} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
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

          {/* Scroll to Bottom Button */}
          {!atBottom && (
            <button className="scroll-to-bottom" onClick={scrollToBottom}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="suggestion-chips-row">
          {suggestions.map((chip, index) => (
            <button
              key={index}
              className="chip"
              onClick={() => handleSuggestionClick(chip.text)}
            >
              <chip.icon size={14} strokeWidth={1.5} className={`text-${chip.color}`} style={{ marginRight: 6 }} />
              {chip.text}
            </button>
          ))}
        </div>

        {/* Bottom Input Area */}
        <div className="composer-area">
          <div className="composer-input-wrap">
            <button className="composer-suggestion-btn" title="创作提示">
              <Lightbulb size={20} strokeWidth={1.5} />
            </button>
            <textarea
              ref={textareaRef}
              className="composer-textarea"
              placeholder="关于这个问题，你还想补充些什么呢？"
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
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="composer-footer">
            <p className="composer-hint">
              按 <kbd>Enter</kbd> 发送，<kbd>Shift + Enter</kbd> 换行
            </p>
            <span className="char-count">
              已记录 {messages.reduce((sum, m) => sum + m.content.length, 0).toLocaleString()} 字 · 本章 780 字
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 右侧面板 ==================== */}
      <aside className="right-panel">
        {/* 章节大纲 */}
        <section className="panel-section">
          <h3 className="panel-section-title">章节大纲</h3>
          <div className="card">
            {outlineItems.map((item, index) => (
              <div
                key={index}
                className={`outline-item ${item.status === '进行中' ? 'outline-item-active' : ''}`}
              >
                <div className={`timeline-dot bg-${item.color}`} />
                <div className="outline-item-content">
                  <p className={`outline-item-title ${item.status === '进行中' ? 'text-brand' : ''}`}>
                    {index + 1}. {item.title}
                  </p>
                  <p className="outline-item-status">
                    {item.status === '进行中' ? `进行中 · ${item.words} 字` : item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 写作统计 */}
        <section className="panel-section">
          <h3 className="panel-section-title">写作统计</h3>
          <div className="card card-p-1">
            <div className="stat-row">
              <div className="stat-label-with-icon">
                <PencilLine size={14} strokeWidth={1.5} className="text-brand" />
                <span>已记录字数</span>
              </div>
              <span className="stat-value tabular-nums">2,156</span>
            </div>
            <div className="stat-row">
              <div className="stat-label-with-icon">
                <MessagesSquare size={14} strokeWidth={1.5} className="text-sage" />
                <span>对话轮次</span>
              </div>
              <span className="stat-value tabular-nums">{messages.length}</span>
            </div>
            <div className="stat-row">
              <div className="stat-label-with-icon">
                <Clock size={14} strokeWidth={1.5} className="text-gold" />
                <span>本次时长</span>
              </div>
              <span className="stat-value tabular-nums">15 分钟</span>
            </div>
            <div className="stat-row">
              <div className="stat-label-with-icon">
                <Target size={14} strokeWidth={1.5} className="text-brand" />
                <span>完成话题</span>
              </div>
              <span className="stat-value tabular-nums">5 / 8</span>
            </div>
          </div>
        </section>

        {/* 话题建议 */}
        <section className="panel-section">
          <h3 className="panel-section-title">话题建议</h3>
          <div className="topic-suggestions">
            <button className="topic-suggestion-item">
              <Users size={14} strokeWidth={1.5} className="text-gold" />
              <div className="topic-suggestion-content">
                <span className="topic-suggestion-title">童年的玩伴们</span>
                <span className="topic-suggestion-desc">聊聊那些一起长大的朋友</span>
              </div>
            </button>
            <button className="topic-suggestion-item">
              <Cake size={14} strokeWidth={1.5} className="text-brand" />
              <div className="topic-suggestion-content">
                <span className="topic-suggestion-title">难忘的生日</span>
                <span className="topic-suggestion-desc">那些特别的庆祝时刻</span>
              </div>
            </button>
            <button className="topic-suggestion-item">
              <School size={14} strokeWidth={1.5} className="text-sage" />
              <div className="topic-suggestion-content">
                <span className="topic-suggestion-title">小学的时光</span>
                <span className="topic-suggestion-desc">校园里的记忆与故事</span>
              </div>
            </button>
          </div>
        </section>

        {/* 快捷操作 */}
        <section className="panel-section">
          <h3 className="panel-section-title">快捷操作</h3>
          <div className="quick-actions">
            <button className="quick-action-item">
              <Save size={16} strokeWidth={1.5} />
              <span>保存草稿</span>
            </button>
            <button className="quick-action-item">
              <Download size={16} strokeWidth={1.5} />
              <span>导出章节</span>
            </button>
            <button className="quick-action-item">
              <Settings size={16} strokeWidth={1.5} />
              <span>对话设置</span>
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
};

export default DialoguePage;
