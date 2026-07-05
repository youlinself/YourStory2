import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageBubble } from '../../components';
import { ContentExtractCard, SuggestionBar, SidePanel } from '../../components/dialogue';
import { useAIStore, useDialogueStore, useAutobiographyStore } from '../../stores';
import { AIService } from '../../services';
import { generateId, parseExtract } from '../../utils';
import type { Message, ChapterContext, ExtractedContent } from '../../types';

const DialogueAgent: React.FC = () => {
  const { chapterId } = useParams<{ chapterId?: string }>();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens, loadSettings } = useAIStore();

  const {
    activeSession,
    suggestions,
    isGenerating,
    sidePanel,
    sidePanelOpen,
    initSession,
    addMessage,
    setSuggestions,
    setIsGenerating,
    setSidePanel,
    toggleSidePanel,
    updateExtractStatus,
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

  // 初始化
  useEffect(() => {
    loadSettings();
    loadAutobiography();
  }, [loadSettings, loadAutobiography]);

  useEffect(() => {
    initSession(chapterId || null);
  }, [chapterId, initSession]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 首次欢迎消息
  useEffect(() => {
    if (activeSession && messages.length === 0) {
      const welcomeText = chapterId && currentChapter
        ? `您好！我们来继续创作「${currentChapter.title}」这一章吧。${currentChapter.content ? '之前已经有一些内容了，我们可以在此基础上继续补充。' : '这是全新的一章，让我们从头开始。'}请告诉我您想从哪里开始回忆？`
        : '您好！我是您的自传创作助手。让我们一起记录您的人生故事吧。首先，请告诉我您的名字，以及您想从人生的哪个阶段开始记录？';

      const welcomeMessage: Message = {
        id: generateId(),
        content: welcomeText,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(welcomeMessage);
    }
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 生成初始建议
  useEffect(() => {
    if (messages.length <= 1 && suggestions.length === 0) {
      generateInitialSuggestions();
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateInitialSuggestions = useCallback(async () => {
    if (!apiKey) return;
    try {
      const aiService = new AIService({ apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens });
      const newSuggestions = await aiService.generateSuggestions(autobiography, chapterId || null, messages);
      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }, [apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens, autobiography, chapterId, messages, setSuggestions]);

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isGenerating) return;

    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

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

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens });

      // 构建章节上下文
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
      const response = await aiService.generateResponse(content, currentMessages, chapterContext);

      // 解析 EXTRACT 标记
      const { text: cleanText, extract } = parseExtract(response);

      const aiMessage: Message = {
        id: generateId(),
        content: cleanText,
        isUser: false,
        timestamp: new Date(),
        type: extract ? 'content_extract' : 'text',
        extractedContent: extract || undefined,
      };

      addMessage(aiMessage);

      // 异步生成建议（每3轮对话或有提取内容时）
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
      const errorMessage: Message = {
        id: generateId(),
        content: '抱歉，处理您的消息时出现错误。请检查您的API配置或稍后再试。',
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  // 内容提取操作
  const handleApproveExtract = (messageId: string, extract: ExtractedContent) => {
    if (!chapterId) return;
    updateExtractStatus(messageId, 'approved');
    const contentToWrite = extract.paragraphs.join('\n\n');
    updateChapterDraft(chapterId, contentToWrite);
  };

  const handleEditExtract = (messageId: string, editedContent: string) => {
    if (!chapterId) return;
    updateExtractStatus(messageId, 'edited', editedContent);
    updateChapterDraft(chapterId, editedContent);
  };

  const handleRejectExtract = (messageId: string) => {
    updateExtractStatus(messageId, 'rejected');
  };

  // 章节操作
  const handleSwitchChapter = (newChapterId: string | null) => {
    if (newChapterId) {
      navigate(`/dialogue/${newChapterId}`);
    } else {
      navigate('/dialogue');
    }
  };

  const handleCreateChapter = async () => {
    const title = prompt('请输入新章节标题：');
    if (!title?.trim()) return;
    const newId = await createChapter(title.trim());
    if (newId) {
      navigate(`/dialogue/${newId}`);
    }
  };

  const handleConfirmDraft = async () => {
    if (!chapterId) return;
    await confirmChapterDraft(chapterId);
  };

  const handleGenerateSummary = async () => {
    if (!apiKey || !chapterId || !currentChapter) return;
    setIsGenerating(true);
    try {
      const aiService = new AIService({ apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens });
      const dialogueContent = messages
        .map((m) => `${m.isUser ? '用户' : 'AI'}: ${m.content}`)
        .join('\n');
      const summary = await aiService.generateChapterSummary(currentChapter.title, dialogueContent);
      await updateChapterDraft(chapterId, summary);
    } catch (error) {
      console.error('生成摘要失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 待确认的提取内容
  const pendingExtracts = messages
    .filter((m) => m.extractedContent?.status === 'pending')
    .map((m) => m.extractedContent!);

  // 页面标题
  const pageTitle = chapterId && currentChapter
    ? `创作：${currentChapter.title}`
    : '对话式创作';

  const pageSubtitle = chapterId && currentChapter
    ? '在对话中回忆和记录，AI 会自动提取内容到章节草稿'
    : '与AI对话，逐步构建您的个人自传';

  return (
    <div className="flex h-[calc(100vh-7.5rem)] animate-fade-in">
      {/* 左侧聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-display-md">{pageTitle}</h1>
            <p className="text-body text-ink-secondary mt-1">{pageSubtitle}</p>
          </div>
          <button
            onClick={toggleSidePanel}
            className="p-2 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-bg-secondary transition-colors"
            title={sidePanelOpen ? '收起面板' : '展开面板'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden flex flex-col shadow-sm">
          {/* 章节上下文提示 */}
          {chapterId && currentChapter && (
            <div className="px-6 py-2.5 bg-brand-primary-subtle border-b border-brand-primary/10 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-xs text-brand-primary font-medium">
                正在创作：{currentChapter.title}
              </span>
              {currentChapter.timeRange && (
                <span className="text-xs text-ink-muted">({currentChapter.timeRange})</span>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble
                  message={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
                {/* 内容提取卡片 */}
                {message.type === 'content_extract' && message.extractedContent && (
                  <div className="flex justify-start">
                    <div className="ml-11 max-w-[70%]">
                      <ContentExtractCard
                        extract={message.extractedContent}
                        onApprove={() => handleApproveExtract(message.id, message.extractedContent!)}
                        onReject={() => handleRejectExtract(message.id)}
                        onEdit={(edited) => handleEditExtract(message.id, edited)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="chat-bubble-ai">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <SuggestionBar
            suggestions={suggestions}
            onSuggestionClick={handleSendMessage}
            isLoading={isGenerating && suggestions.length === 0}
          />

          {/* Input Area */}
          <div className="chat-input-area">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={chapterId ? `记录关于「${currentChapter?.title || ''}」的故事...` : '输入您的回答... (Shift+Enter 换行)'}
                disabled={isGenerating}
                rows={1}
                className="chat-textarea flex-1"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isGenerating}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover hover:shadow-md transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="发送消息"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-fine-print text-ink-faint">
                输入 <kbd className="px-1 py-0.5 bg-bg-secondary rounded text-[0.6875rem] font-mono">Enter</kbd> 发送，<kbd className="px-1 py-0.5 bg-bg-secondary rounded text-[0.6875rem] font-mono">Shift+Enter</kbd> 换行
              </p>
              {inputValue.length > 0 && (
                <span className="text-fine-print text-ink-faint">
                  {inputValue.length} 字
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧边面板 */}
      <div className="ml-4">
        <SidePanel
          isOpen={sidePanelOpen}
          mode={sidePanel}
          onModeChange={setSidePanel}
          onClose={toggleSidePanel}
          autobiography={autobiography}
          currentChapterId={chapterId || null}
          onSwitchChapter={handleSwitchChapter}
          onCreateChapter={handleCreateChapter}
          currentChapter={currentChapter}
          pendingExtracts={pendingExtracts}
          onConfirmDraft={handleConfirmDraft}
          onGenerateSummary={handleGenerateSummary}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};

export default DialogueAgent;
