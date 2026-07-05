import React, { useState, useRef, useEffect } from 'react';
import { Button, MessageBubble } from '../../components';
import { useAIStore } from '../../stores';
import { AIService } from '../../services';

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
  const { apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens, loadSettings } = useAIStore();

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiService = new AIService({ apiKey, model, baseUrl, temperature, maxInputTokens, maxOutputTokens });
      const response = await aiService.generateResponse(inputValue, messages);

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-display-md">
          对话式创作
        </h1>
        <p className="text-body text-ink-secondary mt-1">
          与AI对话，逐步构建您的个人自传
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="chat-bubble-ai">
                <div className="flex gap-1.5 py-1">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border-subtle p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的回答..."
                disabled={isLoading}
                rows={1}
                className="input-base resize-none min-h-[44px] max-h-[120px]"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="md"
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
