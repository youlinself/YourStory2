import { getMaxOutputTokens } from '../../ai_config';
import type { NovelChapter, Character, WorldBuilding, NovelGenre, CharacterRole, CharacterGender } from '../../types/novel';

export interface NovelAIServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor?: string;
  temperature?: number;
  maxOutputTokens?: number;
  customModelName?: string;
}

interface StreamChunk {
  content: string;
  done: boolean;
}

type StreamCallback = (chunk: StreamChunk) => void;

const DEFAULT_CONFIG: Partial<NovelAIServiceConfig> = {
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.7,
  maxOutputTokens: 3000,
};

class NovelAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private vendor: string;
  private temperature: number;
  private maxOutputTokens: number;
  private customModelName: string;

  constructor(config: NovelAIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_CONFIG.model!;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl!).replace(/\/+$/, '');
    this.vendor = config.vendor || 'openai';
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature!;
    this.maxOutputTokens = config.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens!;
    this.customModelName = config.customModelName || '';
  }

  private async sendRequest(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const vendorLimit = getMaxOutputTokens(this.vendor);
    const maxTokens = Math.min(this.maxOutputTokens, vendorLimit);
    const activeModel = this.customModelName || this.model;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          max_tokens: maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('NovelAI服务错误:', error);
      throw error;
    }
  }

  private async streamRequest(
    messages: Array<{ role: string; content: string }>,
    callback: StreamCallback,
  ): Promise<void> {
    const vendorLimit = getMaxOutputTokens(this.vendor);
    const maxTokens = Math.min(this.maxOutputTokens, vendorLimit);
    const activeModel = this.customModelName || this.model;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          max_tokens: maxTokens,
          temperature: this.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `API请求失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const readChunk = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          callback({ content: '', done: true });
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            callback({ content: '', done: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              callback({ content, done: false });
            }
          } catch {
          }
        }

        return readChunk();
      };

      await readChunk();
    } catch (error) {
      console.error('NovelAI流式响应错误:', error);
      throw error;
    }
  }

  async continueWriting(
    chapter: NovelChapter,
    characters: Character[],
    worldBuilding: WorldBuilding | null,
    callback?: StreamCallback,
  ): Promise<string> {
    const characterInfo = characters
      .map((c) => `${c.name}（${c.role}）：${c.personality}。背景：${c.background || '无'}`)
      .join('\n');

    const worldInfo = worldBuilding
      ? `世界设定：${worldBuilding.setting}\n时代：${worldBuilding.era}\n地点：${worldBuilding.location}\n力量体系：${worldBuilding.magicSystem || '无'}`
      : '无特殊世界设定';

    const messages = [
      {
        role: 'system',
        content: `你是一位专业的小说创作助手。你的任务是帮助用户续写小说。

【写作原则】
- 保持与原文风格一致
- 推动情节自然发展
- 保持角色性格一致
- 注重画面感和节奏感
- 每次续写约300-500字

【角色信息】
${characterInfo || '暂无角色信息'}

【世界观】
${worldInfo}

请直接输出续写内容，不要添加任何解释或标记。`,
      },
      {
        role: 'user',
        content: `【章节标题】${chapter.title}

【前文内容】
${chapter.content.slice(-2000) || '（这是章节开头，请开始写作）'}

请续写接下来的内容：`,
      },
    ];

    if (callback) {
      return new Promise((resolve, reject) => {
        let result = '';
        this.streamRequest(messages, (chunk) => {
          result += chunk.content;
          callback(chunk);
          if (chunk.done) {
            resolve(result);
          }
        }).catch(reject);
      });
    }

    return this.sendRequest(messages);
  }

  async polishText(
    originalText: string,
    style: string = '',
  ): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `你是一位专业的文学编辑。你的任务是对用户提供的文本进行润色。

【润色原则】
- 保持原意不变
- 提升语句流畅度和文学性
- 增强画面感和表现力
- 保持原有风格${style ? `，特别注重${style}风格` : ''}
- 不要添加新的情节或信息

请直接输出润色后的文本，不要添加任何解释。`,
      },
      {
        role: 'user',
        content: `【原文】
${originalText}

请对以上文本进行润色：`,
      },
    ];

    return this.sendRequest(messages);
  }

  async expandText(
    originalText: string,
    direction: string = '',
  ): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `你是一位富有想象力的小说创作助手。你的任务是将简短的文本扩展为更丰富的描述。

【扩写原则】
- 保持原文核心意思
- 增加细节描写（环境、动作、心理等）
- 丰富感官体验
- 保持节奏感，避免冗长
- 扩写后的长度约为原文的2-3倍`,
      },
      {
        role: 'user',
        content: `【原文】
${originalText}

${direction ? `【扩写方向】${direction}` : ''}

请将以上文本扩写：`,
      },
    ];

    return this.sendRequest(messages);
  }

  async generatePlotSuggestions(
    chapters: NovelChapter[],
    synopsis: string,
  ): Promise<string[]> {
    const chapterSummary = chapters
      .slice(-5)
      .map((ch, i) => `第${i + 1}章《${ch.title}》：${ch.summary || ch.content.slice(0, 100)}`)
      .join('\n');

    const messages = [
      {
        role: 'system',
        content: `你是一位富有创意的小说策划。请根据已有情节，提供3-5个合理的后续情节发展方向。

【输出格式】
请输出JSON格式，包含一个suggestions数组，每个元素是一个情节建议字符串。
例如：{"suggestions": ["建议1", "建议2", "建议3"]}`,
      },
      {
        role: 'user',
        content: `【作品简介】
${synopsis || '暂无简介'}

【已有章节】
${chapterSummary || '暂无已有章节'}

请提供后续情节建议：`,
      },
    ];

    try {
      const response = await this.sendRequest(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  async generateNameSuggestions(
    type: 'character' | 'location' | 'skill' | 'item',
    description: string,
    count: number = 5,
  ): Promise<string[]> {
    const typeMap = {
      character: '角色名',
      location: '地点名',
      skill: '技能/功法名',
      item: '物品名',
    };

    const messages = [
      {
        role: 'system',
        content: `你是一位富有创意的命名专家。请根据描述生成${count}个${typeMap[type]}。

【命名原则】
- 符合中文语言习惯
- 有文化内涵和美感
- 与描述的特征相符
- 避免过于常见或奇怪的名字

请直接输出名字列表，每行一个。`,
      },
      {
        role: 'user',
        content: `【类型】${typeMap[type]}
【描述】${description || '无特定要求'}

请生成${count}个名字：`,
      },
    ];

    try {
      const response = await this.sendRequest(messages);
      return response
        .split('\n')
        .map((line) => line.replace(/^\d+[\.\、\)\】]\s*/, '').trim())
        .filter((line) => line.length > 0)
        .slice(0, count);
    } catch {
      return [];
    }
  }

  async generateCharacterProfile(
    description: string,
  ): Promise<Partial<Character> | null> {
    const messages = [
      {
        role: 'system',
        content: `你是一位角色设计专家。请根据用户的描述，生成完整的角色设定。

【输出格式】
请输出JSON格式：
{
  "name": "角色名",
  "gender": "male/female/unknown",
  "age": 年龄数字,
  "appearance": "外貌描写",
  "personality": "性格特点",
  "background": "背景故事",
  "goals": "目标/动机"
}`,
      },
      {
        role: 'user',
        content: `【描述】${description}

请生成角色设定：`,
      },
    ];

    try {
      const response = await this.sendRequest(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          name: parsed.name || '未命名',
          gender: parsed.gender || 'unknown',
          age: parsed.age || 20,
          appearance: parsed.appearance || '',
          personality: parsed.personality || '',
          background: parsed.background || '',
          goals: parsed.goals || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async generateWorldBuilding(
    description: string,
  ): Promise<Partial<WorldBuilding> | null> {
    const messages = [
      {
        role: 'system',
        content: `你是一位世界观设计专家。请根据用户的描述，生成详细的世界观设定。

【输出格式】
请输出JSON格式：
{
  "setting": "世界设定概述",
  "era": "时代背景",
  "location": "主要地点",
  "magicSystem": "力量体系",
  "factions": ["势力1", "势力2"],
  "rules": ["规则1", "规则2"]
}`,
      },
      {
        role: 'user',
        content: `【描述】${description}

请生成世界观设定：`,
      },
    ];

    try {
      const response = await this.sendRequest(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          setting: parsed.setting || '',
          era: parsed.era || '',
          location: parsed.location || '',
          magicSystem: parsed.magicSystem || '',
          factions: parsed.factions || [],
          rules: parsed.rules || [],
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async generateNovelBlueprint(
    idea: string,
  ): Promise<{
    title: string;
    genre: NovelGenre | string;
    synopsis: string;
    outline: Array<{ title: string; summary: string }>;
    characters: Array<{
      name: string;
      role: CharacterRole | string;
      gender: CharacterGender | string;
      age: number;
      appearance: string;
      personality: string;
      background: string;
      goals: string;
    }>;
    worldBuilding: {
      setting: string;
      era: string;
      location: string;
      magicSystem: string;
      factions: string[];
      rules: string[];
    };
  } | null> {
    const messages = [
      {
        role: 'system',
        content: `你是一位专业的小说策划大师。用户会提供一个想法，你需要根据这个想法生成完整的小说蓝图。

【输出格式】
请输出JSON格式，不要包含任何其他文字：
{
  "title": "小说标题",
  "genre": "fantasy/romance/sci-fi/mystery/historical/modern/wuxia/urban/horror/other",
  "synopsis": "小说简介（100-200字，包含核心冲突和看点）",
  "outline": [
    { "title": "第一章标题", "summary": "本章内容概要（50-100字）" },
    { "title": "第二章标题", "summary": "本章内容概要（50-100字）" }
  ],
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist/supporting/antagonist/extra",
      "gender": "male/female/unknown",
      "age": 年龄数字,
      "appearance": "外貌描写",
      "personality": "性格特点",
      "background": "背景故事",
      "goals": "目标/动机"
    }
  ],
  "worldBuilding": {
    "setting": "世界设定概述",
    "era": "时代背景",
    "location": "主要地点",
    "magicSystem": "力量体系",
    "factions": ["势力1", "势力2"],
    "rules": ["世界规则1", "世界规则2"]
  }
}

【创作要求】
1. 标题：简洁有力，有吸引力，符合题材风格
2. 简介：包含主角、核心冲突、故事卖点，引人入胜
3. 大纲：5-8章，每章有明确的标题和概要，情节递进合理
4. 角色：3-5个主要角色，包含主角、配角、反派，性格鲜明
5. 世界观：与题材匹配，设定合理，有独特之处

【题材说明】
- fantasy: 玄幻/修仙
- romance: 言情/爱情
- sci-fi: 科幻/未来
- mystery: 悬疑/推理
- historical: 历史/古代
- modern: 现代/现实
- wuxia: 武侠/江湖
- urban: 都市/职场
- horror: 恐怖/惊悚
- other: 其他`,
      },
      {
        role: 'user',
        content: `【用户想法】
${idea}

请根据以上想法生成完整的小说蓝图：`,
      },
    ];

    try {
      const response = await this.sendRequest(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || '未命名小说',
          genre: parsed.genre || 'fantasy',
          synopsis: parsed.synopsis || '',
          outline: parsed.outline || [],
          characters: parsed.characters || [],
          worldBuilding: {
            setting: parsed.worldBuilding?.setting || '',
            era: parsed.worldBuilding?.era || '',
            location: parsed.worldBuilding?.location || '',
            magicSystem: parsed.worldBuilding?.magicSystem || '',
            factions: parsed.worldBuilding?.factions || [],
            rules: parsed.worldBuilding?.rules || [],
          },
        };
      }
      return null;
    } catch (error) {
      console.error('生成小说蓝图失败:', error);
      return null;
    }
  }

  async generateCoverImage(
    prompt: string,
    style: 'realistic' | 'anime' | 'watercolor' | 'oil_painting' | 'sketch' = 'anime',
  ): Promise<string | null> {
    const stylePrompts: Record<string, string> = {
      realistic: 'realistic, detailed, cinematic lighting, high quality',
      anime: 'anime style, vibrant colors, clean lines, manga illustration',
      watercolor: 'watercolor painting, soft colors, artistic, flowing',
      oil_painting: 'oil painting, classical art style, rich textures, masterpiece',
      sketch: 'pencil sketch, hand-drawn, artistic, detailed linework',
    };

    const enhancedPrompt = `Book cover illustration: ${prompt}. Style: ${stylePrompts[style]}. Professional novel cover design, vertical composition, no text.`;

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1792',
          quality: 'hd',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `图片生成失败: ${response.status}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`,
        );
      }

      const data = await response.json();
      return data.data?.[0]?.url || null;
    } catch (error) {
      console.error('生成封面图片失败:', error);
      throw error;
    }
  }

  async generateInspiration(
    type: 'plot' | 'character' | 'scene' | 'dialogue' | 'theme',
  ): Promise<string> {
    const typePrompts = {
      plot: '生成一个情节灵感，包含一个有趣的转折点、冲突或悬念',
      character: '生成一个角色灵感，包含独特的性格特点或背景故事',
      scene: '生成一个场景灵感，包含生动的环境描写或氛围设定',
      dialogue: '生成一个对话灵感，展现角色性格或推动情节的对话片段',
      theme: '生成一个主题灵感，关于故事可以探讨的深层主题或意义',
    };

    const messages = [
      {
        role: 'system',
        content: `你是一位富有创意的小说灵感生成器。请${typePrompts[type]}。

【输出要求】
- 简洁有力，一两句话
- 富有画面感和想象力
- 能激发创作欲望
- 适合各种题材`,
      },
      {
        role: 'user',
        content: `请生成一个${type === 'plot' ? '情节' : type === 'character' ? '角色' : type === 'scene' ? '场景' : type === 'dialogue' ? '对话' : '主题'}灵感：`,
      },
    ];

    try {
      return await this.sendRequest(messages);
    } catch {
      return '';
    }
  }
}

export default NovelAIService;
