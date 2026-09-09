import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanelRightOpen,
  PanelRightClose,
  BookOpen,
  PenLine,
  CheckCircle,
} from 'lucide-react';
import { useAIStore, useAutobiographyStore } from '../../stores';
import { useAgentStore } from '../../stores/agentStore';
import ExportService from '../../services/export/ExportService';
import { generateId } from '../../utils';
import { useChatScroll } from '../../hooks/useChatScroll';
import { useToast } from '../../components/common';
import SidePanel from '../../components/dialogue/SidePanel';
import MDEditor from '@uiw/react-md-editor';
import Modal from '../../components/ui/Modal';
import '../../styles/dialogue.css';

const SESSION_MAP_KEY = 'dialogue-session-map';

function getSessionMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SESSION_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setSessionMapEntry(chapterId: string, sessionId: string) {
  const map = getSessionMap();
  map[chapterId] = sessionId;
  localStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
}

function getSessionIdForChapter(chapterId: string): string | null {
  return getSessionMap()[chapterId] || null;
}

const DialogueAgent: React.FC = () => {
  const { chapterId } = useParams<{ chapterId?: string }>();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [sidePanelMode, setSidePanelMode] = useState<'outline' | 'draft'>('outline');

  const { loadSettings } = useAIStore();

  const {
    agent,
    currentSession,
    isLoading,
    error,
    activeSkills,
    initialize,
    createSession,
    resumeSession,
    handleMessage,
    approveContent,
  } = useAgentStore();

  const { addToast } = useToast();

  const {
    autobiography,
    load: loadAutobiography,
    updateChapterDraft,
    createChapter,
  } = useAutobiographyStore();

  const currentChapter = autobiography?.chapters.find((ch) => ch.id === chapterId) || null;

  const messages = currentSession?.history?.map((turn) => ({
    id: generateId(),
    content: turn.content,
    isUser: turn.role === 'user',
    timestamp: new Date(turn.timestamp),
    type: 'text' as const,
    extractedContent: undefined,
  })) || [];

  const { listRef, columnRef, atBottom, scrollToBottom } = useChatScroll(messages);

  const topicItems = [
    { icon: TreePine, label: '老家的环境', color: 'sage', description: '那条小河，那棵老槐树，那个宁静的小镇' },
    { icon: Users, label: '童年的玩伴们', color: 'gold', description: '一起长大的朋友，那些无忧无虑的时光' },
    { icon: Cake, label: '难忘的生日', color: 'brand', description: '那些特别的庆祝时刻，收到过的礼物' },
    { icon: School, label: '小学的时光', color: 'sage', description: '校园里的记忆，第一份友谊' },
  ];

  const suggestionChips = [
    { color: 'sage', text: '聊聊老家的环境', icon: TreePine },
    { color: 'gold', text: '童年的玩伴们', icon: Users },
    { color: 'brand', text: '难忘的生日', icon: Cake },
  ];

  useEffect(() => {
    loadSettings();
    loadAutobiography();
    if (!agent) {
      initialize();
    }
  }, [loadSettings, loadAutobiography, agent, initialize]);

  useEffect(() => {
    if (!agent || !chapterId) return;

    const existingSessionId = getSessionIdForChapter(chapterId);
    if (existingSessionId) {
      resumeSession(existingSessionId).catch(() => {
        createSession(chapterId);
      });
    } else {
      createSession(chapterId);
    }
  }, [agent, chapterId, createSession, resumeSession]);

  useEffect(() => {
    if (currentSession && chapterId) {
      setSessionMapEntry(chapterId, currentSession.id);
    }
  }, [currentSession, chapterId]);

  useEffect(() => {
    if (currentSession && currentSession.history.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [currentSession?.history.length]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentSession && currentSession.history.length > 0) {
        e.preventDefault();
        e.returnValue = '您有未保存的对话内容，确定要离开吗？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentSession]);

  const handleNavigateWithCheck = useCallback((path: string) => {
    if (hasUnsavedChanges && currentSession && currentSession.history.length > 0) {
      setPendingNavigationPath(path);
      setShowLeaveConfirm(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, currentSession, navigate]);

  const handleConfirmLeave = useCallback(async (save: boolean) => {
    if (save && chapterId && currentSession) {
      const conversationText = currentSession.history
        .map((turn) => `${turn.role === 'user' ? '我' : 'AI'}: ${turn.content}`)
        .join('\n\n');
      await updateChapterDraft(chapterId, conversationText);
    }
    setShowLeaveConfirm(false);
    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
      setPendingNavigationPath(null);
    }
  }, [chapterId, currentSession, updateChapterDraft, navigate, pendingNavigationPath]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isLoading || !currentSession) return;

    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await handleMessage(content, { generateFollowUpQuestions: false });
    } catch (error) {
      console.error('发送消息错误:', error);
      addToast({ type: 'error', message: '发送消息失败，请重试' });
    }
  };

  const handleTopicClick = (label: string) => {
    setInputValue(`我想先聊聊${label}`);
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  const handleSaveDraft = async () => {
    try {
      if (chapterId && currentSession && currentSession.history.length > 0) {
        const conversationText = currentSession.history
          .map((turn) => `${turn.role === 'user' ? '我' : 'AI'}: ${turn.content}`)
          .join('\n\n');
        await updateChapterDraft(chapterId, conversationText);
        setHasUnsavedChanges(false);
        addToast({
          type: 'success',
          message: '草稿已保存',
        });
      } else {
        addToast({
          type: 'warning',
          message: '暂无可保存的内容',
        });
      }
    } catch (err) {
      console.error('保存草稿失败:', err);
      addToast({ type: 'error', message: '保存失败，请重试' });
    }
  };

  const handleExportChapter = () => {
    const chapterContent = currentSession?.history
      ?.map((turn) => `${turn.role === 'user' ? '我' : 'AI'}: ${turn.content}`)
      .join('\n\n') || '';

    const filename = `对话记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
    const content = `# 对话记录\n\n> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n${chapterContent}`;

    ExportService.download(content, filename, 'text/markdown;charset=utf-8');
    addToast({ type: 'success', message: '章节已导出' });
  };

  const handleStartChapter = () => {
    setNewChapterTitle('');
    setShowCreateChapterModal(true);
  };

  const handleConfirmCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    let autobiographyData = autobiography;
    if (!autobiographyData) {
      await useAutobiographyStore.getState().create();
      autobiographyData = useAutobiographyStore.getState().autobiography;
    }
    const newChapterId = await createChapter(newChapterTitle.trim());
    if (newChapterId) {
      setShowCreateChapterModal(false);
      setNewChapterTitle('');
      handleNavigateWithCheck(`/dialogue/${newChapterId}`);
    }
  };

  const handleSwitchChapter = (targetChapterId: string | null) => {
    if (targetChapterId === null) {
      navigate('/dialogue');
    } else {
      handleNavigateWithCheck(`/dialogue/${targetChapterId}`);
    }
  };

  const handleApproveContent = async () => {
    if (chapterId && currentSession && currentSession.history.length > 0) {
      try {
        const conversationText = currentSession.history
          .map((turn) => `${turn.role === 'user' ? '我' : 'AI'}: ${turn.content}`)
          .join('\n\n');
        await updateChapterDraft(chapterId, conversationText);
        await approveContent(chapterId);
        setHasUnsavedChanges(false);
        addToast({ type: 'success', message: '内容已确认写入章节' });
      } catch (error) {
        addToast({ type: 'error', message: '确认失败，请重试' });
      }
    } else {
      addToast({ type: 'warning', message: '暂无可确认的内容' });
    }
  };

  const handleGenerateSummary = async () => {
    if (!currentSession || (!currentChapter?.content && !currentChapter?.draftContent)) {
      addToast({ type: 'warning', message: '暂无可生成摘要的内容' });
      return;
    }
    addToast({ type: 'info', message: '摘要生成功能开发中...' });
  };

  return (
    <div className="dialogue-page">
      <div className="dialogue-main">
        <header className="app-header">
          <div className="header-left">
            <div className="avatar brand-gradient text-white">
              <Sparkles size={16} strokeWidth={1.5} />
            </div>
            <div className="header-info">
              <div className="header-title-row">
                <span className="header-title">Story 助手</span>
                <span className="badge badge-success">在线</span>
                {activeSkills.length > 0 && (
                  <span className="badge badge-info">
                    {activeSkills.length} 技能激活
                  </span>
                )}
              </div>
              <p className="header-subtitle">
                {currentChapter ? `正在引导你完成 · ${currentChapter.title}` : '正在引导你完成创作'}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              title={isRightPanelOpen ? '收起面板' : '展开面板'}
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              {isRightPanelOpen ? <PanelRightClose size={18} strokeWidth={1.5} /> : <PanelRightOpen size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => window.location.reload()}>重试</button>
          </div>
        )}

        <div className="message-list" ref={listRef}>
          <div ref={columnRef}>
            {!currentSession?.history?.length && !isLoading && (
              <div className="welcome-hero">
                <div className="hero-icon">
                  <BookOpen size={32} strokeWidth={1.5} className="text-brand" />
                </div>
                <h1 className="hero-title">开始你的故事创作之旅</h1>
                <p className="hero-subtitle">
                  Story 助手将引导你通过对话的方式，把珍贵的记忆一一记录下来
                </p>

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

                <div className="hero-cta">
                  <button className="btn btn-primary btn-lg" onClick={handleStartChapter}>
                    <PenLine size={18} strokeWidth={2} />
                    开始第一章 · 童年记忆
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

          {!atBottom && (
            <button className="scroll-to-bottom" onClick={scrollToBottom}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </button>
          )}
        </div>

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

        <div className="composer-area">
          <div className="composer-input-wrap">
            <button className="composer-suggestion-btn" title="创作提示">
              <Lightbulb size={20} strokeWidth={1.5} />
            </button>
            <textarea
              ref={textareaRef}
              className="composer-textarea"
              placeholder="分享你的故事，AI 会帮你整理成自传..."
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
              disabled={isLoading || !inputValue.trim() || !currentSession}
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="composer-footer">
            <p className="composer-hint">
              按 <kbd>Enter</kbd> 发送，<kbd>Shift + Enter</kbd> 换行
            </p>
            <span className="char-count">
              已记录 {messages.filter((m) => !m.isUser).reduce((sum, m) => sum + m.content.length, 0).toLocaleString()} 字
              {currentChapter ? ` · 本章 ${currentChapter.content?.length || 0} 字` : ''}
            </span>
          </div>
        </div>
      </div>

      {isRightPanelOpen && (
        <aside className="right-panel">
          <SidePanel
            isOpen={isRightPanelOpen}
            mode={sidePanelMode}
            onModeChange={setSidePanelMode}
            onClose={() => setIsRightPanelOpen(false)}
            autobiography={autobiography}
            currentChapterId={chapterId || null}
            onSwitchChapter={handleSwitchChapter}
            onCreateChapter={handleStartChapter}
            currentChapter={currentChapter}
            pendingExtracts={[]}
            onConfirmDraft={handleApproveContent}
            onGenerateSummary={handleGenerateSummary}
          />
          <div className="quick-actions-panel shrink-0">
            <button className="quick-action-item" onClick={handleSaveDraft}>
              <Save size={16} strokeWidth={1.5} />
              <span>保存草稿</span>
            </button>
            <button className="quick-action-item" onClick={handleApproveContent}>
              <CheckCircle size={16} strokeWidth={1.5} />
              <span>确认内容</span>
            </button>
            <button className="quick-action-item" onClick={handleExportChapter}>
              <Download size={16} strokeWidth={1.5} />
              <span>导出章节</span>
            </button>
            <button className="quick-action-item" onClick={() => navigate('/settings')}>
              <Settings size={16} strokeWidth={1.5} />
              <span>设置</span>
            </button>
          </div>
        </aside>
      )}

      <Modal
        isOpen={showCreateChapterModal}
        onClose={() => setShowCreateChapterModal(false)}
        title="新建章节"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">
              章节标题 <span className="text-danger">*</span>
            </label>
            <input
              className="input"
              placeholder="例如：童年记忆、学生时代、职场生涯..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChapterTitle.trim()) {
                  handleConfirmCreateChapter();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              className="btn btn-ghost"
              onClick={() => setShowCreateChapterModal(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmCreateChapter}
              disabled={!newChapterTitle.trim()}
            >
              创建章节
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="离开确认"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            您有未保存的对话内容，离开后将会丢失。是否保存当前对话内容？
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowLeaveConfirm(false);
                setPendingNavigationPath(null);
              }}
            >
              取消
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => handleConfirmLeave(false)}
            >
              不保存
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleConfirmLeave(true)}
            >
              保存并离开
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DialogueAgent;
