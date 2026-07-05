interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async generateResponse(userInput: string, conversationHistory: Message[]): Promise<string> {
    const messages = this.buildMessages(userInput, conversationHistory);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI服务错误:', error);
      throw error;
    }
  }

  private buildMessages(userInput: string, conversationHistory: Message[]) {
    const systemMessage = {
      role: 'system',
      content: `你是一位专业的自传创作助手。你的任务是通过对话引导用户回忆和记录他们的人生故事。

请遵循以下原则：
1. 以友好、耐心的态度与用户交流
2. 通过开放式问题引导用户回忆重要时刻
3. 帮助用户整理时间线和重要事件
4. 鼓励用户分享细节和感受
5. 适时提供建议和总结
6. 保护用户隐私，不强迫分享不愿提及的内容

当前对话阶段：开始阶段
请从询问用户的基本信息和想从哪个时期开始记录开始。`,
    };

    const historyMessages = conversationHistory.map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content,
    }));

    return [systemMessage, ...historyMessages, { role: 'user', content: userInput }];
  }
}

export default AIService;