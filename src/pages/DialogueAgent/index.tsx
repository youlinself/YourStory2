import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Lightbulb,
  Save,
  Download,
  Settings,
  PanelRightOpen,
  PanelRightClose,
  CheckCircle,
} from 'lucide-react';
import { useAIStore, useAutobiographyStore } from '../../stores';
import { useAgentStore } from '../../stores/agentStore';
import ExportService from '../../services/export/ExportService';
import { useChatScroll } from '../../hooks/useChatScroll';
import { useToast } from '../../components/common';
import ChatPanel from '../../components/dialogue/ChatPanel';
import SidePanel from '../../components/dialogue/SidePanel';
import Modal from '../../components/ui/Modal';
import '../../styles/dialogue.css';

const SESSION_MAP_KEY = 'dialogue-session-map';
const FREE_DIALOGUE_KEY = 'free';

function getSessionMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SESSION_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setSessionMapEntry(chapterId: string | null, sessionId: string) {
  const map = getSessionMap();
  const key = chapterId || FREE_DIALOGUE_KEY;
  map[key] = sessionId;
  localStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
}

function getSessionIdForChapter(chapterId: string | null): string | null {
  const key = chapterId || FREE_DIALOGUE_KEY;
  return getSessionMap()[key] || null;
}

function removeSessionMapEntry(chapterId: string | null) {
  const map = getSessionMap();
  const key = chapterId || FREE_DIALOGUE_KEY;
  delete map[key];
  localStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
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
  const lastSavedHistoryLengthRef = useRef<number>(0);

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

  const messages = useMemo(() => {
    return currentSession?.history?.map((turn, index) => ({
      id: `msg-${index}-${turn.timestamp}`,
      content: turn.content,
      isUser: turn.role === 'user',
      timestamp: new Date(turn.timestamp),
      type: 'text' as const,
      extractedContent: undefined,
    })) || [];
  }, [currentSession?.history]);

  useChatScroll(messages);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadAutobiography();
      if (!agent) {
        await initialize('autobiography');
      }
    };
    init();
  }, [loadSettings, loadAutobiography, agent, initialize]);

  useEffect(() => {
    if (!agent) return;

    const existingSessionId = getSessionIdForChapter(chapterId || null);
    if (existingSessionId) {
      resumeSession(existingSessionId).then((success) => {
        if (!success) {
          removeSessionMapEntry(chapterId || null);
          createSession(chapterId || null);
        }
      }).catch(() => {
        createSession(chapterId || null);
      });
    } else {
      createSession(chapterId || null);
    }
  }, [agent, chapterId, createSession, resumeSession]);

  useEffect(() => {
    if (currentSession) {
      setSessionMapEntry(chapterId || null, currentSession.id);
      lastSavedHistoryLengthRef.current = currentSession.history.length;
      setHasUnsavedChanges(false);
    }
  }, [currentSession, chapterId]);

  useEffect(() => {
    if (!currentSession) return;
    if (currentSession.history.length > lastSavedHistoryLengthRef.current) {
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
      lastSavedHistoryLengthRef.current = currentSession.history.length;
      setHasUnsavedChanges(false);
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

  const handleSaveDraft = async () => {
    try {
      if (chapterId && currentSession && currentSession.history.length > 0) {
        const conversationText = currentSession.history
          .map((turn) => `${turn.role === 'user' ? '我' : 'AI'}: ${turn.content}`)
          .join('\n\n');
        await updateChapterDraft(chapterId, conversationText);
        lastSavedHistoryLengthRef.current = currentSession.history.length;
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
        lastSavedHistoryLengthRef.current = currentSession.history.length;
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

  const handleApproveExtract = async (_messageId: string) => {
    addToast({ type: 'success', message: '内容已确认写入' });
  };

  const handleRejectExtract = async (_messageId: string) => {
    addToast({ type: 'info', message: '内容已丢弃' });
  };

  const handleEditExtract = async (_messageId: string, _editedContent: string) => {
    addToast({ type: 'success', message: '内容已编辑' });
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

        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          hasHistory={!!currentSession?.history?.length}
          onApproveExtract={handleApproveExtract}
          onRejectExtract={handleRejectExtract}
          onEditExtract={handleEditExtract}
          onStartChapter={handleStartChapter}
        />

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
