import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble, SuggestionBar } from '../../components';
import { useAIStore, useDialogueStore } from '../../stores';
import { AIService } from '../../services';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const SUGGESTIONS = [
  '我想从童年开始记录',
  '请帮我回忆学生时代',
  '聊聊我的职业生涯',
  '记录一段难忘的旅行',
];

const Dialogue: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { apiKey, model, baseUrl, vendor, temperature, maxInputTokens, maxOutputTokens, loadSettings } = useAIStore();
  const { suggestions, setSuggestions, isGenerating, setIsGenerating } = useDialogueStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: '您好！我是您的自传创作助手。让我们一起记录您的人生故事吧。首先，请告诉我您的名字，以及您想从人生的哪个阶段开始记录？',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleGenerateSuggestions = async () => {
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsGenerating(true);
    setIsSuggestionsVisible(true);

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxInputTokens, maxOutputTokens });
      const newSuggestions = await aiService.generateSuggestions(null, null, messages);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('生成建议失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
    setIsSuggestionsVisible(false);
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isLoading) return;

    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxInputTokens, maxOutputTokens });
      const response = await aiService.generateResponse(content, messages);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI响应错误:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，处理您的消息时出现错误。请检查您的API配置或稍后再试。',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-display-md">
          对话式创作
        </h1>
        <p className="text-body text-ink-secondary mt-1.5">
          与AI对话，逐步构建您的个人自传
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden flex flex-col shadow-sm">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
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

        {/* Suggestions - only show when few messages */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSendMessage(suggestion)}
                className="suggestion-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Suggestions Bar */}
        {isSuggestionsVisible && (
          <SuggestionBar
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoading={isGenerating}
          />
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="输入您的回答... (Shift+Enter 换行)"
              disabled={isLoading}
              rows={1}
              className="chat-textarea flex-1"
            />
            <button
              onClick={handleGenerateSuggestions}
              disabled={isLoading || isGenerating}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border-subtle text-ink-secondary hover:bg-bg-secondary hover:text-ink-primary hover:shadow-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="获取提示"
              title="获取创作提示"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
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
  );
};

export default Dialogue;
