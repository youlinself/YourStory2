import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createSecretaryAssistant, SecretaryMessage, SecretaryOption, SecretaryContext } from '../../services/secretaryAssistantService';
import useThinkTankStore from '../../stores/thinkTankStore';
import useAIStore from '../../stores/aiStore';

interface SecretaryAssistantProps {
  onClose?: () => void;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

const SecretaryAssistant: React.FC<SecretaryAssistantProps> = ({ onClose, onAction }) => {
  const { members, rolePresets } = useThinkTankStore();
  const { apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName } = useAIStore();
  const [messages, setMessages] = useState<SecretaryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef<ReturnType<typeof createSecretaryAssistant> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const hasApiKey = !!apiKey;
    setIsConfigured(hasApiKey);

    if (hasApiKey) {
      const context: SecretaryContext = {
        members,
        rolePresets,
        llmConfig: {
          apiKey,
          model,
          baseUrl,
          vendor,
          temperature,
          maxOutputTokens,
          customModelName,
        },
      };

      const assistant = createSecretaryAssistant(
        context,
        (message) => {
          setMessages((prev) => [...prev, message]);
        },
        (loading) => {
          setIsLoading(loading);
        }
      );

      assistantRef.current = assistant;
      assistant.startConversation();
    }
  }, [apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, customModelName, members, rolePresets]);

  useEffect(() => {
    if (assistantRef.current) {
      assistantRef.current.updateContext({ members, rolePresets });
    }
  }, [members, rolePresets]);

  const handleOptionClick = (option: SecretaryOption) => {
    if (assistantRef.current) {
      assistantRef.current.handleOptionSelect(option);
    }
  };

  const handleCustomInput = () => {
    if (!inputValue.trim() || isLoading) return;

    const customInput = inputValue.trim();
    setInputValue('');

    if (assistantRef.current) {
      assistantRef.current.sendMessage(customInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomInput();
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex flex-col h-full bg-bg-base rounded-xl border border-border-subtle shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand/10 to-brand/5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">秘书助手</h3>
              <p className="text-[10px] text-ink-faint">需要配置AI</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-subtle transition-colors"
            >
              <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">🔑</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-ink mb-2">需要配置AI</h4>
              <p className="text-sm text-ink-faint max-w-[240px]">
                秘书助手需要使用默认AI配置。请先在设置页面配置API Key。
              </p>
            </div>
            <button
              onClick={() => onAction?.('navigate_settings')}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              前往设置
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-base rounded-xl border border-border-subtle shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand/10 to-brand/5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="text-sm font-semibold text-ink">秘书助手</h3>
            <p className="text-[10px] text-ink-faint">
              {isLoading ? '正在思考...' : '随时为您服务'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-subtle transition-colors"
          >
            <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">📋</span>
                  <span className="text-[10px] text-ink-faint">秘书助手</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-brand text-white rounded-br-md'
                    : 'bg-bg-subtle text-ink rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>

              {message.options && message.options.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {message.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-base border border-border-subtle hover:border-brand/50 hover:bg-brand/5 transition-all text-left group disabled:opacity-50"
                    >
                      {option.icon && <span className="text-base">{option.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink group-hover:text-brand transition-colors">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-[10px] text-ink-faint truncate">{option.description}</div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-ink-faint group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-ink-faint mt-1 px-1">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">📋</span>
                <span className="text-[10px] text-ink-faint">秘书助手</span>
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-bg-subtle">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border-subtle bg-bg-subtle/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的需求..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg border border-border-subtle bg-bg-base text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleCustomInput}
            disabled={!inputValue.trim() || isLoading}
            className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretaryAssistant;
