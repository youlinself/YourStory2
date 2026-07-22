import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const DialoguePage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

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
          <a className="nav-link active">
            <MessageSquareText size={18} className="text-brand" />
            <span>对话创作</span>
          </a>
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
              <p className="chapter-title">童年趣事</p>
              <p className="chapter-subtitle">当前章节</p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill complete" style={{ width: '100%' }} />
          </div>
          <p className="chapter-status">已完成</p>
        </div>

        <div className="sidebar-stats">
          <p className="stats-title">本次会话</p>
          <div className="stat-row">
            <span className="stat-label">对话轮次</span>
            <span className="stat-value">12</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">生成字数</span>
            <span className="stat-value">2,580</span>
          </div>
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
              <h2 className="header-title">童年趣事</h2>
              <p className="header-subtitle">第 1 章 · 已完成</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" title="通知">
              <Bell size={18} />
            </button>
            <button className="icon-button" title="导出">
              <Download size={18} />
            </button>
          </div>
        </header>

        <div className="message-list">
          <div className="message-group">
            <div className="avatar brand-gradient text-white">
              <Sparkles size={16} strokeWidth={2.5} />
            </div>
            <div className="message-content">
              <p className="message-sender">AI 创作助手</p>
              <div className="chat-bubble chat-bubble-ai animate-fade-in">
                <p>你好李华！我是你的 AI 创作助手。今天我们来聊聊你的人生故事。</p>
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
        </div>

        <div className="input-area">
          <div className="suggestion-chips">
            {suggestions.map((chip, index) => (
              <button key={index} className="chip">
                <span className={`chip-dot ${chip.color}`} />
                {chip.text}
              </button>
            ))}
          </div>
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="聊聊你想记录的人生故事..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={1}
            />
            <button className={`send-button ${inputValue.trim() ? 'active' : ''}`}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DialoguePage;
