import { useVirtualList } from '../../hooks/useVirtualList';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageBubble, Modal } from '../../components';
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
  const [isChapterSelectModalOpen, setIsChapterSelectModalOpen] = useState(false);
  const [pendingExtract, setPendingExtract] = useState<{ messageId: string; content: string; isEdit: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [messagesContainerHeight, setMessagesContainerHeight] = useState(600);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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
      // Ctrl/Cmd + K: 聚焦搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Escape: 关闭搜索
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 首次欢迎消息 - 调用AI生成个性化引导
  useEffect(() => {
    if (activeSession && messages.length === 0 && apiKey) {
      generateWelcomeGuide();
    }
  }, [activeSession?.id, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 监听消息容器高度变化
  useEffect(() => {
    const updateHeight = () => {
      if (messagesContainerRef.current) {
        setMessagesContainerHeight(messagesContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 处理滚动
  const handleScroll = useCallback(() => {
    // 虚拟列表的滚动由 useVirtualList 处理
  }, []);

  const generateWelcomeGuide = useCallback(async () => {
    if (!apiKey) return;

    setIsGenerating(true);
    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName });
      const guide = await aiService.generateWelcomeGuide(autobiography, chapterId || null);

      if (guide) {
        // 组装欢迎消息
        let welcomeContent = guide.welcome;
        if (guide.guide) {
          welcomeContent += '\n\n' + guide.guide;
        }
        if (guide.tips) {
          welcomeContent += '\n\n💡 ' + guide.tips;
        }

        const welcomeMessage: Message = {
          id: generateId(),
          content: welcomeContent,
          isUser: false,
          timestamp: new Date(),
          type: 'text',
        };
        addMessage(welcomeMessage);

        // 将starters转换为建议词
        if (guide.starters && guide.starters.length > 0) {
          const starterSuggestions = guide.starters.map((text, index) => ({
            id: `starter-${Date.now()}-${index}`,
            text,
            type: 'guide_question' as const,
          }));
          setSuggestions(starterSuggestions);
        }
      } else {
        // AI生成失败，使用默认欢迎消息
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

  /** 生成AI响应（不添加用户消息） */
  const generateAIResponse = async (userContent: string) => {
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);

    // 创建空的AI消息用于流式更新
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

      // 解析 EXTRACT 标记
      const { text: cleanText, extract } = parseExtract(fullResponse);
      updateLastMessage(cleanText, extract ? 'content_extract' : 'text', extract || undefined);

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

    // 删除该消息之后的所有消息并重新生成
    const messagesAfter = messages.slice(messageIndex + 1);
    messagesAfter.forEach((m) => deleteMessage(m.id));

    // 重新生成AI响应（不添加用户消息）
    generateAIResponse(newContent);
  };

  const handleRegenerateMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message.isUser) return;

    // 找到对应的用户消息
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && !messages[userMessageIndex].isUser) {
      userMessageIndex--;
    }
    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex];

    // 删除AI消息及之后的所有消息
    const messagesToDelete = messages.slice(userMessageIndex + 1);
    messagesToDelete.forEach((m) => deleteMessage(m.id));

    // 重新生成AI响应（不添加用户消息）
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

  // 内容提取操作
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
    
    // 找到选中的章节标题用于提示
    const selectedChapter = autobiography?.chapters.find(ch => ch.id === selectedChapterId);
    const chapterTitle = selectedChapter?.title || '未知章节';
    
    try {
      // 更新提取状态
      updateExtractStatus(
        pendingExtract.messageId, 
        pendingExtract.isEdit ? 'edited' : 'approved', 
        pendingExtract.isEdit ? pendingExtract.content : undefined
      );
      
      // 写入章节草稿
      await updateChapterDraft(selectedChapterId, pendingExtract.content);
      
      // 关闭弹窗并清理状态
      setIsChapterSelectModalOpen(false);
      setPendingExtract(null);
      
      // 显示成功提示
      alert(`✅ 内容已成功写入「${chapterTitle}」章节！\n\n正在跳转到该章节...`);
      
      // 延迟跳转，让用户看到提示
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

  // 待确认的提取内容
  const pendingExtracts = messages
    .filter((m) => m.extractedContent?.status === 'pending')
    .map((m) => m.extractedContent!);

  // 筛选后的消息
  const filteredMessages: Message[] = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  /** 虚拟列表配置 */
  const VIRTUAL_LIST_THRESHOLD = 30;
  const MESSAGE_ITEM_HEIGHT = 120;
  const useVirtualization = messages.length > VIRTUAL_LIST_THRESHOLD;

  const virtualList = useVirtualList(filteredMessages, {
    itemHeight: MESSAGE_ITEM_HEIGHT,
    overscan: 5,
    containerHeight: messagesContainerHeight,
  });

  // 高亮搜索词
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    const lowerQuery = searchQuery.toLowerCase();
    return parts.map((part, i) =>
      part.toLowerCase() === lowerQuery ? (
        <mark key={i} className="bg-warning/30 text-ink rounded px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  };

  // 页面标题
  const pageTitle = chapterId && currentChapter
    ? `创作：${currentChapter.title}`
    : '对话式创作';

  const pageSubtitle = chapterId && currentChapter
    ? '在对话中回忆和记录，AI 会自动提取内容到章节草稿'
    : '与AI对话，逐步构建您的个人自传';

  return (
    <div className="flex h-[calc(100vh-9rem)] animate-fade-in">
      {/* 左侧聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-display-md">{pageTitle}</h1>
            <p className="text-body text-ink-secondary mt-2">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2.5 rounded-xl transition-colors ${
                showSearch ? 'text-brand bg-brand-surface' : 'text-ink-muted hover:text-ink-secondary hover:bg-bg-secondary'
              }`}
              title="搜索对话"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <button
              onClick={toggleSidePanel}
              className="p-2.5 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-bg-secondary transition-colors"
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
          <div className="mb-4 px-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border-subtle bg-bg-elevated text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="搜索对话内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-ink-faint mt-2 px-1">
                找到 {filteredMessages.length} 条匹配消息
              </p>
            )}
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden flex flex-col shadow-sm">
          {/* 章节上下文提示 */}
          {chapterId && currentChapter && (
            <div className="px-6 lg:px-8 py-3 bg-brand-primary-subtle border-b border-brand-primary/10 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-sm text-brand-primary font-medium">
                正在创作：{currentChapter.title}
              </span>
              {currentChapter.timeRange && (
                <span className="text-sm text-ink-muted">({currentChapter.timeRange})</span>
              )}
            </div>
          )}

          {/* 会话标签 */}
          <div className="px-6 lg:px-8 py-2 border-b border-border-subtle flex items-center gap-2 flex-wrap">
            <svg className="w-4 h-4 text-ink-faint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {activeSession?.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-surface text-brand text-xs font-medium"
                >
                  {tag}
                  <button
                    onClick={() => removeTagFromSession(tag)}
                    className="hover:text-brand-primary transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <div className="relative">
                <input
                  type="text"
                  placeholder="添加标签..."
                  className="w-24 px-2 py-0.5 text-xs rounded-full border border-transparent hover:border-border-subtle focus:border-brand focus:outline-none bg-transparent"
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
          </div>

          {/* Messages Area - 虚拟列表 */}
          <div
            className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 lg:py-8"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
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
              <div className="space-y-6">
                {filteredMessages.map((message: Message, index: number) => {
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
                })}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-12 h-12 text-ink-faint mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-ink-muted text-sm">没有找到匹配的消息</p>
                <p className="text-ink-faint text-xs mt-1">尝试使用其他关键词</p>
              </div>
            ) : null}
            {isGenerating && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="chat-bubble-ai">
                    <div className="flex items-center gap-1.5 py-1">
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
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover hover:shadow-md transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="发送消息"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-fine-print text-ink-faint">
                输入 <kbd className="px-1.5 py-0.5 bg-bg-secondary rounded text-[0.6875rem] font-mono border border-border-subtle">Enter</kbd> 发送，<kbd className="px-1.5 py-0.5 bg-bg-secondary rounded text-[0.6875rem] font-mono border border-border-subtle">Shift+Enter</kbd> 换行
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
