import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, MessageBubble, LoadingSpinner } from '../../components';
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
  const { apiKey, model } = useAIStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初始化欢迎消息
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
      const aiService = new AIService(apiKey, model);
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          对话式创作
        </h2>
        <p className="text-gray-600">
          与AI对话，逐步构建您的个人自传
        </p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <div className="bg-gray-200 rounded-lg px-4 py-2">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={setInputValue}
              placeholder="输入您的回答..."
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
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