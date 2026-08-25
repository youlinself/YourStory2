import { useVirtualList } from '../../hooks/useVirtualList';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageBubble, Modal } from '../../components';
import { ContentExtractCard, SuggestionBar, SidePanel } from '../../components/dialogue';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName, loadSettings } = useAIStore();

  const {
    activeSession,
    suggestions,
    isGenerating,
    sidePanel,
    sidePanelOpen,
    initSession,
    addMessage,
    updateLastMessage,
    deleteMessage,
    insertMessage,
    setSuggestions,
    setIsGenerating,
    setSidePanel,
    toggleSidePanel,
    updateExtractStatus,
    addTagToSession,
    removeTagFromSession,
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

  // 智能滚动管理
  const { listRef, columnRef, atBottom, scrollToBottom } = useChatScroll(messages);
  const { elapsedMs, formatDuration } = useRunTimer(isGenerating ? Date.now() : null);

  // 初始化
  useEffect(() => {
    loadSettings();
    loadAutobiography();
  }, [loadSettings, loadAutobiography]);

  useEffect(() => {
    initSession(chapterId || null);
  }, [chapterId, initSession]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // 首次欢迎消息
  useEffect(() => {
    if (activeSession && messages.length === 0 && apiKey) {
      generateWelcomeGuide();
    }
  }, [activeSession?.id, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateWelcomeGuide = useCallback(async () => {
    if (!apiKey) return;

    setIsGenerating(true);
    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName });
      const guide = await aiService.generateWelcomeGuide(autobiography, chapterId || null);

      if (guide) {
        let welcomeContent = guide.welcome;
        if (guide.guide) welcomeContent += '\n\n' + guide.guide;
        if (guide.tips) welcomeContent += '\n\n💡 ' + guide.tips;

        const welcomeMessage: Message = {
          id: generateId(),
          content: welcomeContent,
          isUser: false,
          timestamp: new Date(),
          type: 'text',
        };
        addMessage(welcomeMessage);

        if (guide.starters && guide.starters.length > 0) {
          const starterSuggestions = guide.starters.map((text, index) => ({
            id: `starter-${Date.now()}-${index}`,
            text,
            type: 'guide_question' as const,
          }));
          setSuggestions(starterSuggestions);
        }
      } else {
        fallbackWelcome();
      }
    } catch (error) {
      console.error('生成欢迎引导失败:', error);
      fallbackWelcome();
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, autobiography, chapterId, setIsGenerating, addMessage, setSuggestions]);

  const fallbackWelcome = () => {
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
  };

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

  const handleEditMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || !message.isUser) return;

    const newContent = prompt('编辑消息内容：', message.content);
    if (!newContent || newContent === message.content) return;

    const updatedMessage: Message = { ...message, content: newContent };
    deleteMessage(message.id);
    insertMessage(messageIndex, updatedMessage);

    const messagesAfter = messages.slice(messageIndex + 1);
    messagesAfter.forEach((m) => deleteMessage(m.id));

    generateAIResponse(newContent);
  };

  const handleRegenerateMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message.isUser) return;

    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && !messages[userMessageIndex].isUser) {
      userMessageIndex--;
    }
    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex];
    const messagesToDelete = messages.slice(userMessageIndex + 1);
    messagesToDelete.forEach((m) => deleteMessage(m.id));

    generateAIResponse(userMessage.content);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('确定要删除这条消息吗？')) {
      deleteMessage(messageId);
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

  const handleApproveExtract = (messageId: string, extract: ExtractedContent) => {
    const contentToWrite = extract.paragraphs.join('\n\n');
    if (!chapterId) {
      setPendingExtract({ messageId, content: contentToWrite, isEdit: false });
      setIsChapterSelectModalOpen(true);
      return;
    }
    updateExtractStatus(messageId, 'approved');
    updateChapterDraft(chapterId, contentToWrite);
  };

  const handleEditExtract = (messageId: string, editedContent: string) => {
    if (!chapterId) {
      setPendingExtract({ messageId, content: editedContent, isEdit: true });
      setIsChapterSelectModalOpen(true);
      return;
    }
    updateExtractStatus(messageId, 'edited', editedContent);
    updateChapterDraft(chapterId, editedContent);
  };

  const handleConfirmWriteToChapter = async (selectedChapterId: string) => {
    if (!pendingExtract) return;

    const selectedChapter = autobiography?.chapters.find(ch => ch.id === selectedChapterId);
    const chapterTitle = selectedChapter?.title || '未知章节';

    try {
      updateExtractStatus(
        pendingExtract.messageId,
        pendingExtract.isEdit ? 'edited' : 'approved',
        pendingExtract.isEdit ? pendingExtract.content : undefined
      );

      await updateChapterDraft(selectedChapterId, pendingExtract.content);

      setIsChapterSelectModalOpen(false);
      setPendingExtract(null);

      alert(`✅ 内容已成功写入「${chapterTitle}」章节！\n\n正在跳转到该章节...`);

      setTimeout(() => {
        navigate(`/dialogue/${selectedChapterId}`);
      }, 300);
    } catch (error) {
      console.error('写入章节失败:', error);
      alert('❌ 写入章节失败，请重试');
    }
  };

  const handleRejectExtract = (messageId: string) => {
    updateExtractStatus(messageId, 'rejected');
  };

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
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName });
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

  const pendingExtracts = messages
    .filter((m) => m.extractedContent?.status === 'pending')
    .map((m) => m.extractedContent!);

  const filteredMessages: Message[] = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    const lowerQuery = searchQuery.toLowerCase();
    return parts.map((part, i) =>
      part.toLowerCase() === lowerQuery ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const VIRTUAL_LIST_THRESHOLD = 30;
  const MESSAGE_ITEM_HEIGHT = 120;
  const useVirtualization = messages.length > VIRTUAL_LIST_THRESHOLD;

  const virtualList = useVirtualList(filteredMessages, {
    itemHeight: MESSAGE_ITEM_HEIGHT,
    overscan: 5,
    containerHeight: listRef.current?.clientHeight || 600,
  });

  const pageTitle = chapterId && currentChapter
    ? `创作：${currentChapter.title}`
    : '对话式创作';

  const pageSubtitle = chapterId && currentChapter
    ? '在对话中回忆和记录，AI 会自动提取内容到章节草稿'
    : '与AI对话，逐步构建您的个人自传';

  return (
    <div className="flex h-[calc(100vh-9rem)] animate-fade-in" style={{ padding: '10px' }}>
      {/* 左侧聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-title">
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <div className="page-header-actions">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`header-icon-button ${showSearch ? 'text-brand bg-brand-surface' : ''}`}
              title="搜索对话 (Ctrl+K)"
              data-active={showSearch || undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <button
              onClick={toggleSidePanel}
              className="header-icon-button"
              title={sidePanelOpen ? '收起面板' : '展开面板'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="search-bar">
            <div className="search-input-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="搜索对话内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="search-clear"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="search-results-count">
                找到 {filteredMessages.length} 条匹配消息
              </p>
            )}
          </div>
        )}

        {/* Chat Container */}
        <div className="chat-container">
          {/* 章节上下文提示 */}
          {chapterId && currentChapter && (
            <div className="chapter-context-bar">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>正在创作：{currentChapter.title}</span>
              {currentChapter.timeRange && (
                <span style={{ color: 'var(--alias-label-muted)' }}>({currentChapter.timeRange})</span>
              )}
            </div>
          )}

          {/* 会话标签 */}
          <div className="tags-row">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {activeSession?.tags?.map((tag) => (
                <span key={tag} className="tag-item">
                  {tag}
                  <button
                    onClick={() => removeTagFromSession(tag)}
                    className="hover:text-brand-primary transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="添加标签..."
                className="tag-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      addTagToSession(input.value.trim());
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="messages-scroll"
            ref={listRef}
            data-conversation-scroll="true"
          >
            <div ref={columnRef} className="messages-column">
              {useVirtualization && filteredMessages.length > VIRTUAL_LIST_THRESHOLD ? (
                <div style={{ height: virtualList.totalHeight, position: 'relative' }}>
                  {virtualList.virtualItems.map(({ item: message, style, index }) => {
                    const isLastMessage = index === filteredMessages.length - 1;
                    const isLastAiMessage = isLastMessage && !message.isUser;
                    const originalIndex = messages.indexOf(message);
                    return (
                      <div key={message.id} style={{ ...style, padding: '12px 0' }}>
                        <MessageBubble
                          message={highlightText(message.content)}
                          isUser={message.isUser}
                          timestamp={message.timestamp}
                          isStreaming={isGenerating && isLastAiMessage}
                          onEdit={message.isUser && !isGenerating ? () => handleEditMessage(originalIndex) : undefined}
                          onRegenerate={!message.isUser && !isGenerating ? () => handleRegenerateMessage(originalIndex) : undefined}
                          onDelete={!isGenerating ? () => handleDeleteMessage(message.id) : undefined}
                        />
                        {message.type === 'content_extract' && message.extractedContent && (
                          <div className="flex justify-start">
                            <div className="ml-12 max-w-[70%]">
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
                    );
                  })}
                </div>
              ) : filteredMessages.length > 0 ? (
                filteredMessages.map((message: Message, index: number) => {
                  const isLastMessage = index === filteredMessages.length - 1;
                  const isLastAiMessage = isLastMessage && !message.isUser;
                  const originalIndex = messages.indexOf(message);
                  return (
                    <div key={message.id}>
                      <MessageBubble
                        message={highlightText(message.content)}
                        isUser={message.isUser}
                        timestamp={message.timestamp}
                        isStreaming={isGenerating && isLastAiMessage}
                        onEdit={message.isUser && !isGenerating ? () => handleEditMessage(originalIndex) : undefined}
                        onRegenerate={!message.isUser && !isGenerating ? () => handleRegenerateMessage(originalIndex) : undefined}
                        onDelete={!isGenerating ? () => handleDeleteMessage(message.id) : undefined}
                      />
                      {message.type === 'content_extract' && message.extractedContent && (
                        <div className="flex justify-start">
                          <div className="ml-12 max-w-[70%]">
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
                  );
                })
              ) : searchQuery ? (
                <div className="empty-state">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p>没有找到匹配的消息</p>
                  <p className="empty-hint">尝试使用其他关键词</p>
                </div>
              ) : null}

              {/* Turn Status (Deep diving...) */}
              {isGenerating && (
                <div className="turn-status" role="status" aria-live="polite">
                  <span>思考中...</span>
                  {elapsedMs >= 15000 && (
                    <span className="turn-status-clock" aria-hidden>
                      {formatDuration(elapsedMs)}
                    </span>
                  )}
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

          {/* Suggestions */}
          <SuggestionBar
            suggestions={suggestions}
            onSuggestionClick={handleSendMessage}
            isLoading={isGenerating && suggestions.length === 0}
          />

          {/* Input Area */}
          <div className="composer-area">
            <div className="composer-input-wrap">
              <div className="composer-prefix">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={chapterId ? `记录关于「${currentChapter?.title || ''}」的故事...` : '输入您的回答... (Shift+Enter 换行)'}
                disabled={isGenerating}
                rows={1}
                className="composer-textarea"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isGenerating}
                className="send-button"
                data-active={inputValue.trim() ? 'true' : undefined}
                aria-label="发送消息"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
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
        </div>
      </div>

      {/* 右侧边面板 */}
      {sidePanelOpen && (
        <div className="ml-6">
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
      )}

      {/* 章节选择弹窗 */}
      <Modal
        isOpen={isChapterSelectModalOpen}
        onClose={() => {
          setIsChapterSelectModalOpen(false);
          setPendingExtract(null);
        }}
        title="选择要写入的章节"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            请选择要将内容写入的章节：
          </p>
          {autobiography?.chapters && autobiography.chapters.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {autobiography.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleConfirmWriteToChapter(chapter.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border-subtle hover:border-brand-primary hover:bg-brand-primary-subtle transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink-primary">{chapter.title}</span>
                    {chapter.status === 'completed' && (
                      <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">已完成</span>
                    )}
                    {chapter.status === 'draft' && (
                      <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">草稿</span>
                    )}
                  </div>
                  {chapter.timeRange && (
                    <p className="text-xs text-ink-muted mt-1">{chapter.timeRange}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-ink-muted mb-4">还没有创建任何章节</p>
              <button
                onClick={() => {
                  setIsChapterSelectModalOpen(false);
                  handleCreateChapter();
                }}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
              >
                创建新章节
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DialogueAgent;
