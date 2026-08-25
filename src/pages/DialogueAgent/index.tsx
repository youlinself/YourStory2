import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Users,
  TreePine,
  Cake,
  School,
  Lightbulb,
  Save,
  Download,
  Settings,
  Clock,
  Target,
  PencilLine,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
  BookOpen,
  PenLine,
  Quote,
  Award,
  GraduationCap,
  Layers,
  Maximize2,
  Minimize2,
  PlusCircle,
  CheckCircle,
  FileText,
  FileOutput,
  Code,
  ArrowLeft,
  Eye,
  Share2,
  BookOpenText,
} from 'lucide-react';
import { useAIStore, useDialogueStore, useAutobiographyStore } from '../../stores';
import { AIService } from '../../services';
import { generateId, parseExtract } from '../../utils';
import { useChatScroll, useRunTimer } from '../../hooks/useChatScroll';
import type { Message, ChapterContext, ExtractedContent } from '../../types';
import '../../styles/dialogue.css';

const DialogueAgent: React.FC = () => {
  const { chapterId } = useParams<{ chapterId?: string }>();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isChapterSelectModalOpen, setIsChapterSelectModalOpen] = useState(false);
  const [pendingExtract, setPendingExtract] = useState<{ messageId: string; content: string; isEdit: boolean } | null>(null);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const { apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName, loadSettings } = useAIStore();

  const {
    activeSession,
    suggestions,
    isGenerating,
    initSession,
    addMessage,
    updateLastMessage,
    deleteMessage,
    insertMessage,
    setSuggestions,
    setIsGenerating,
    updateExtractStatus,
    addTagToSession,
    removeTagFromSession,
    saveSession,
  } = useDialogueStore();

  const {
    autobiography,
    load: loadAutobiography,
    createChapter,
    updateChapterDraft,
    confirmChapterDraft,
  } = useAutobiographyStore();

  const messages = activeSession?.messages || [];
  const currentChapter = autobiography?.chapters.find((ch) => ch.id === chapterId) || null;

  const { listRef, columnRef, atBottom, scrollToBottom } = useChatScroll(messages);
  const { elapsedMs, formatDuration } = useRunTimer(isGenerating ? Date.now() : null);

  // Topic items for welcome state
  const topicItems = [
    { icon: TreePine, label: '老家的环境', color: 'sage', description: '那条小河，那棵老槐树，那个宁静的小镇' },
    { icon: Users, label: '童年的玩伴们', color: 'gold', description: '一起长大的朋友，那些无忧无虑的时光' },
    { icon: Cake, label: '难忘的生日', color: 'brand', description: '那些特别的庆祝时刻，收到过的礼物' },
    { icon: School, label: '小学的时光', color: 'sage', description: '校园里的记忆，第一份友谊' },
  ];

  // Outline items
  const outlineItems = [
    { title: '老家的环境', status: '进行中', words: 780, color: 'brand' },
    { title: '童年的玩伴', status: '待探索', words: 0, color: 'gold' },
    { title: '难忘的生日', status: '待探索', words: 0, color: 'muted' },
    { title: '小学的时光', status: '待探索', words: 0, color: 'muted' },
  ];

  // Suggestions
  const suggestionChips = [
    { color: 'sage', text: '聊聊老家的环境', icon: TreePine },
    { color: 'gold', text: '童年的玩伴们', icon: Users },
    { color: 'brand', text: '难忘的生日', icon: Cake },
  ];

  useEffect(() => {
    loadSettings();
    loadAutobiography();
  }, [loadSettings, loadAutobiography]);

  useEffect(() => {
    initSession(chapterId || null);
  }, [chapterId, initSession]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const generateAIResponse = async (userContent: string) => {
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);

    const aiMessageId = generateId();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      type: 'text',
    };
    addMessage(aiMessage);

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName });

      let chapterContext: ChapterContext | undefined;
      if (chapterId && currentChapter) {
        chapterContext = {
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title,
          existingContent: currentChapter.content || '',
          timeRange: currentChapter.timeRange,
        };
      }

      const currentMessages = useDialogueStore.getState().activeSession?.messages || [];
      let fullResponse = '';

      await aiService.generateStreamingResponse(
        userContent,
        currentMessages.slice(0, -1),
        (chunk) => {
          if (!chunk.done) {
            fullResponse += chunk.content;
            updateLastMessage(fullResponse, 'text');
          }
        },
        chapterContext
      );

      const { text: cleanText, extract } = parseExtract(fullResponse);
      updateLastMessage(cleanText, extract ? 'content_extract' : 'text', extract || undefined);

      const updatedMessages = useDialogueStore.getState().activeSession?.messages || [];
      if (updatedMessages.length % 3 === 0 || extract) {
        aiService.generateSuggestions(autobiography, chapterId || null, updatedMessages)
          .then((newSuggestions) => {
            if (newSuggestions.length > 0) setSuggestions(newSuggestions);
          })
          .catch(() => {});
      }
    } catch (error) {
      console.error('AI响应错误:', error);
      updateLastMessage('抱歉，处理您的消息时出现错误。请检查您的API配置或稍后再试。', 'text');
    } finally {
      setIsGenerating(false);
      saveSession();
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isGenerating) return;

    const userMessage: Message = {
      id: generateId(),
      content,
      isUser: true,
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(userMessage);
    setInputValue('');
    setIsGenerating(true);
    setSuggestions([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await generateAIResponse(content);
  };

  const handleTopicClick = (label: string) => {
    setInputValue(`我想先聊聊${label}`);
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  return (
    <div className="dialogue-page">
      {/* ==================== 主内容区 ==================== */}
      <div className="dialogue-main">
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
            <button className="icon-button" title="收起面板" onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}>
              {rightPanelCollapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
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
                className={`message-row ${msg.isUser ? 'message-row-user' : 'message-row-ai'}`}
              >
                {!msg.isUser && (
                  <div className="avatar brand-gradient text-white">
                    <Sparkles size={16} strokeWidth={1.5} />
                  </div>
                )}
                <div className={`chat-bubble ${msg.isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.isUser && (
                  <div className="avatar avatar-user">
                    <Users size={16} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isGenerating && (
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
          {suggestionChips.map((chip, index) => (
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
                  handleSendMessage();
                }
              }}
              rows={1}
            />
            <button
              className="send-button"
              data-active={inputValue.trim() ? 'true' : undefined}
              onClick={() => handleSendMessage()}
              disabled={isGenerating || !inputValue.trim()}
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="composer-footer">
            <p className="composer-hint">
              按 <kbd>Enter</kbd> 发送，<kbd>Shift + Enter</kbd> 换行
            </p>
            <span className="char-count">
              已记录 {messages.filter(m => !m.isUser).reduce((sum, m) => sum + m.content.length, 0).toLocaleString()} 字 · 本章 780 字
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 右侧面板 ==================== */}
      {!rightPanelCollapsed && (
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
                <span className="stat-value tabular-nums">
                  {messages.filter(m => !m.isUser).reduce((sum, m) => sum + m.content.length, 0).toLocaleString()}
                </span>
              </div>
              <div className="stat-row">
                <div className="stat-label-with-icon">
                  <MessagesSquare size={14} strokeWidth={1.5} className="text-sage" />
                  <span>对话轮次</span>
                </div>
                <span className="stat-value tabular-nums">{messages.filter(m => m.isUser).length}</span>
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
      )}
    </div>
  );
};

export default DialogueAgent;
