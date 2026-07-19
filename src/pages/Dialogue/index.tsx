import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAIStore, useDialogueStore } from '../../stores';
import { AIService } from '../../services';
import { useToast } from '../../components';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const Dialogue: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, loadSettings } = useAIStore();
  useDialogueStore();
  const { addToast } = useToast();

  const [activeNav, setActiveNav] = useState('dialogue');

  const navItems = [
    { id: 'home', label: '首页', path: '/' },
    { id: 'dialogue', label: '对话创作', path: '/dialogue' },
    { id: 'autobiography', label: '我的自传', path: '/autobiography' },
    { id: 'settings', label: '设置', path: '/settings' },
  ];

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
          content: '你好！我是你的故事创作助手。让我们一起走进你的童年记忆，把那些珍贵的片段一一记录下来。\n\n你想先从哪个方面开始聊起呢？这里有几个方向供你参考：',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || isLoading) return;

    if (!apiKey) {
      addToast({
        type: 'warning',
        message: '请先在设置页面配置AI API Key',
        duration: 4000,
      });
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
      const aiService = new AIService({ apiKey, model, baseUrl, vendor, temperature, maxOutputTokens });
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
      addToast({
        type: 'error',
        message: '发送失败，请检查网络连接',
        duration: 5000,
      });
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

  const suggestionChips = [
    { color: 'before:bg-sage', label: '聊聊老家的环境' },
    { color: 'before:bg-gold', label: '童年的玩伴们' },
    { color: 'before:bg-brand', label: '难忘的生日' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[240px] bg-bg-elevated border-r border-border-subtle flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-brand">
            <span className="text-white font-bold text-sm">YS</span>
          </div>
          <span className="font-semibold text-ink text-[0.9375rem] text-serif">YourStory</span>
        </div>

        <nav className="px-3 py-4 flex-1">
          <div className="mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>创作</span>
          </div>
          <ul className="space-y-1">
            {navItems.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`nav-link ${item.id === activeNav ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>设置</span>
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                to="/settings"
                className="nav-link"
              >
                设置
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mx-3 mb-3 p-3 rounded-md bg-brand-surface border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <span className="text-[0.8125rem] font-medium text-brand">当前章节</span>
          </div>
          <p className="text-[0.875rem] font-medium text-ink">第一章 · 童年记忆</p>
          <div className="mt-2 h-1 rounded-full bg-bg-subtle overflow-hidden">
            <div className="h-full rounded-full bg-brand" style={{ width: '35%' }} />
          </div>
          <p className="text-[0.6875rem] mt-1.5 text-ink-muted">进度 35% · 已完成 4 个话题</p>
        </div>

        <div className="mx-3 mb-4 p-3 rounded-md border border-border-subtle">
          <p className="text-[0.6875rem] font-medium uppercase text-ink-faint mb-2" style={{ letterSpacing: '0.05em' }}>会话统计</p>
          <div className="flex items-center justify-between py-2">
            <span className="text-[0.8125rem] text-ink-secondary">消息数量</span>
            <span className="text-[0.8125rem] font-medium text-ink">28</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border-subtle">
            <span className="text-[0.8125rem] text-ink-secondary">已记录字数</span>
            <span className="text-[0.8125rem] font-medium text-ink">1,842</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border-subtle">
            <span className="text-[0.8125rem] text-ink-secondary">本次时长</span>
            <span className="text-[0.8125rem] font-medium text-ink">12 分钟</span>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden bg-bg">
        <header className="app-header">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-brand shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-success" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.9375rem] font-medium text-ink">Story 助手</span>
                <span className="badge bg-success-bg text-success">在线</span>
              </div>
              <p className="text-[0.75rem] text-ink-muted">正在引导你完成第一章 · 童年记忆</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center rounded-md text-ink-muted hover:bg-bg-hover hover:text-ink transition-colors bg-transparent border-none cursor-pointer" title="大纲">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-md text-ink-muted hover:bg-bg-hover hover:text-ink transition-colors bg-transparent border-none cursor-pointer" title="信息">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-md text-ink-muted hover:bg-bg-hover hover:text-ink transition-colors bg-transparent border-none cursor-pointer" title="更多">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in ${index > 0 ? 'mt-6' : ''}`}>
              {message.isUser ? (
                <div className="flex flex-col items-end gap-1.5 max-w-[75%]">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="avatar bg-bg-subtle">
                      <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div className="chat-bubble chat-bubble-user text-[0.9375rem] text-ink">
                      {message.content}
                    </div>
                  </div>
                  <span className="text-[0.6875rem] text-ink-faint px-1">
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="avatar bg-brand">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="chat-bubble chat-bubble-ai text-ink">
                      {message.content}
                    </div>
                    <span className="text-[0.6875rem] text-ink-faint px-1">
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in mt-6">
              <div className="flex gap-3">
                <div className="avatar bg-brand">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="chat-bubble bg-bg-elevated border border-border-subtle flex items-center gap-1 py-3">
                  <span className="dot" />
                  <span className="dot" style={{ animationDelay: '0.2s' }} />
                  <span className="dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-8 pb-3">
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((chip, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(chip.label)}
                className={`chip bg-bg-elevated text-ink-tertiary ${chip.color} pl-6 relative before:content-[''] before:absolute before:left-2.5 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-5">
          <div className="flex gap-3 items-end">
            <button
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-border text-ink-muted shrink-0 transition-all hover:bg-bg-subtle hover:text-brand hover:border-brand bg-transparent cursor-pointer"
              title="创作提示"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="关于这个问题，你还想补充些什么呢？"
              disabled={isLoading}
              rows={1}
              className="flex-1 px-4 py-3 text-[0.9375rem] leading-relaxed text-ink bg-bg border border-border rounded-xl outline-none resize-none min-h-[44px] max-h-[160px] transition-all duration-200 placeholder:text-ink-faint focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-light)] focus:bg-bg-elevated"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-white shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand hover:bg-brand-hover border-none cursor-pointer"
              title="发送"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[0.75rem] text-ink-faint">
              按 <kbd className="px-1.5 py-0.5 bg-bg-subtle rounded text-[0.6875rem] border border-border">Enter</kbd> 发送，<kbd className="px-1.5 py-0.5 bg-bg-subtle rounded text-[0.6875rem] border border-border">Shift + Enter</kbd> 换行
            </p>
            <span className="text-[0.75rem] text-ink-faint">已记录 1,842 字 · 本章 620 字</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
