import type { PromptInput, PromptTemplate } from '../PromptRegistry';
import type { PromptRegistry } from '../PromptRegistry';
import type { NovelChapter, Character, WorldBuilding } from '../../../types/novel';

export interface ContinueNovelInput extends PromptInput {
  chapter: NovelChapter;
  characters: Character[];
  worldBuilding: WorldBuilding | null;
}

export interface PolishInput extends PromptInput {
  originalText: string;
  style?: string;
}

export interface ExpandInput extends PromptInput {
  originalText: string;
  direction?: string;
}

export interface PlotSuggestionInput extends PromptInput {
  currentChapter: NovelChapter;
  synopsis: string;
}

export interface NameSuggestionInput extends PromptInput {
  type: 'character' | 'location' | 'skill' | 'item';
  description: string;
  count?: number;
}

export interface CharacterProfileInput extends PromptInput {
  description: string;
}

export interface WorldBuildingInput extends PromptInput {
  description: string;
}

export interface NovelBlueprintInput extends PromptInput {
  idea: string;
}

export interface InspirationInput extends PromptInput {
  type: 'plot' | 'character' | 'scene' | 'dialogue' | 'theme';
}

export interface WritingSkillsInput extends PromptInput {
  description: string;
  genre?: string;
}

export interface StylePresetInput extends PromptInput {
  description: string;
  exampleText?: string;
}

export interface EnhanceSkillPromptInput extends PromptInput {
  currentPrompt: string;
  requirement: string;
}

const continueTemplate: PromptTemplate = {
  id: 'novel/continue',
  name: '小说续写',
  description: '根据前文续写小说内容',
  buildMessages: (input: PromptInput) => {
    const { chapter, characters, worldBuilding } = input as ContinueNovelInput;
    const characterInfo = characters
      .map((c) => `${c.name}（${c.role}）：${c.personality}。背景：${c.background || '无'}`)
      .join('\n');

    const worldInfo = worldBuilding
      ? `世界设定：${worldBuilding.setting}\n时代：${worldBuilding.era}\n地点：${worldBuilding.location}\n力量体系：${worldBuilding.magicSystem || '无'}`
      : '无特殊世界设定';

    return [
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
${chapter.content || '（这是章节开头，请开始写作）'}

请续写接下来的内容：`,
      },
    ];
  },
};

const polishTemplate: PromptTemplate = {
  id: 'novel/polish',
  name: '文本润色',
  description: '润色小说文本',
  buildMessages: (input: PromptInput) => {
    const { originalText, style } = input as PolishInput;
    return [
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
  },
};

const expandTemplate: PromptTemplate = {
  id: 'novel/expand',
  name: '文本扩写',
  description: '将简短文本扩展为更丰富的描述',
  buildMessages: (input: PromptInput) => {
    const { originalText, direction } = input as ExpandInput;
    return [
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
  },
};

const plotSuggestionTemplate: PromptTemplate = {
  id: 'novel/plot_suggestion',
  name: '情节建议',
  description: '根据当前章节内容提供后续情节建议',
  buildMessages: (input: PromptInput) => {
    const { currentChapter, synopsis } = input as PlotSuggestionInput;
    const chapterSummary = `《${currentChapter.title}》\n${currentChapter.summary || '暂无摘要'}\n\n【章节内容】\n${currentChapter.content || ''}`;

    return [
      {
        role: 'system',
        content: `你是一位富有创意的小说策划。请根据当前章节内容，提供3-5个合理的后续情节发展方向。

【输出格式】
请输出JSON格式，包含一个suggestions数组，每个元素是一个情节建议字符串。
例如：{"suggestions": ["建议1", "建议2", "建议3"]}`,
      },
      {
        role: 'user',
        content: `【作品简介】
${synopsis || '暂无简介'}

【当前章节】
${chapterSummary}

请基于当前章节的情节发展，提供后续情节建议：`,
      },
    ];
  },
};

const nameSuggestionTemplate: PromptTemplate = {
  id: 'novel/name_suggestion',
  name: '命名建议',
  description: '生成角色名/地名/技能名/物品名',
  buildMessages: (input: PromptInput) => {
    const { type, description, count } = input as NameSuggestionInput;
    const typeMap = {
      character: '角色名',
      location: '地点名',
      skill: '技能/功法名',
      item: '物品名',
    };

    return [
      {
        role: 'system',
        content: `你是一位富有创意的命名专家。请根据描述生成${count || 5}个${typeMap[type]}。

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

请生成${count || 5}个名字：`,
      },
    ];
  },
};

const characterProfileTemplate: PromptTemplate = {
  id: 'novel/character_profile',
  name: '角色生成',
  description: '生成完整的角色设定',
  buildMessages: (input: PromptInput) => {
    const { description } = input as CharacterProfileInput;
    return [
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
  },
};

const worldBuildingTemplate: PromptTemplate = {
  id: 'novel/world_building',
  name: '世界观生成',
  description: '生成详细的世界观设定',
  buildMessages: (input: PromptInput) => {
    const { description } = input as WorldBuildingInput;
    return [
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
  },
};

const novelBlueprintTemplate: PromptTemplate = {
  id: 'novel/blueprint',
  name: '小说蓝图',
  description: '根据想法生成完整的小说蓝图',
  buildMessages: (input: PromptInput) => {
    const { idea } = input as NovelBlueprintInput;
    return [
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
  },
};

const inspirationTemplate: PromptTemplate = {
  id: 'novel/inspiration',
  name: '灵感生成',
  description: '生成小说创作灵感',
  buildMessages: (input: PromptInput) => {
    const { type } = input as InspirationInput;
    const typePrompts = {
      plot: '生成一个情节灵感，包含一个有趣的转折点、冲突或悬念',
      character: '生成一个角色灵感，包含独特的性格特点或背景故事',
      scene: '生成一个场景灵感，包含生动的环境描写或氛围设定',
      dialogue: '生成一个对话灵感，展现角色性格或推动情节的对话片段',
      theme: '生成一个主题灵感，关于故事可以探讨的深层主题或意义',
    };
    const typeNames = {
      plot: '情节',
      character: '角色',
      scene: '场景',
      dialogue: '对话',
      theme: '主题',
    };

    return [
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
        content: `请生成一个${typeNames[type]}灵感：`,
      },
    ];
  },
};

const writingSkillsTemplate: PromptTemplate = {
  id: 'novel/writing_skills',
  name: '写作技能',
  description: '生成自定义写作技能',
  buildMessages: (input: PromptInput) => {
    const { description, genre } = input as WritingSkillsInput;
    const genreText = genre ? `小说类型：${genre}\n` : '';

    return [
      {
        role: 'system',
        content: `你是一位专业的小说写作教学专家。根据用户的需求和小说类型，生成3-5个实用的自定义写作技能。

【技能分类】
- writing: 写作辅助（如描写技巧、对话写作、场景构建等）
- analysis: 内容分析（如节奏分析、情感分析、逻辑检查等）
- generation: 内容生成（如情节生成、角色生成、世界观生成等）
- organization: 整理归纳（如大纲整理、伏笔管理、时间线梳理等）
- custom: 自定义（其他特殊技能）

【输出格式】
请输出JSON格式，不要包含任何其他文字：
{
  "skills": [
    {
      "name": "技能名称（简洁明了）",
      "description": "技能描述（50字以内）",
      "category": "writing/analysis/generation/organization/custom",
      "promptTemplate": "提示词模板（可使用 {selection} 表示选中文本，{context} 表示章节上下文）",
      "triggerWords": ["触发词1", "触发词2", "触发词3"]
    }
  ]
}

【创作要求】
1. 技能名称：简洁有力，4-8个字为佳
2. 提示词模板：实用、可操作，包含具体的写作指导
3. 触发词：简短易记，2-4个字，便于快速调用
4. 技能应与用户需求高度相关，避免泛泛而谈`,
      },
      {
        role: 'user',
        content: `${genreText}【用户需求】${description}

请根据以上需求生成适合的写作技能：`,
      },
    ];
  },
};

const stylePresetTemplate: PromptTemplate = {
  id: 'novel/style_preset',
  name: '风格预设',
  description: '生成写作风格预设',
  buildMessages: (input: PromptInput) => {
    const { description, exampleText } = input as StylePresetInput;
    const exampleTextPrompt = exampleText ? `\n【参考文本】\n${exampleText}\n请根据这段文本的风格特征生成风格预设。` : '';

    return [
      {
        role: 'system',
        content: `你是一位专业的文学风格分析专家。根据用户的描述，生成一个独特的写作风格预设。

【风格类型参考】
- 文学性风格：注重意象、修辞，语言优美
- 简洁明快风格：语言精练，节奏快
- 口语化风格：自然流畅，贴近生活
- 古风文言风格：古典雅致，文言韵味
- 悬疑紧凑风格：节奏紧凑，悬念迭起
- 抒情散文风格：情感细腻，意境深远
- 幽默诙谐风格：轻松幽默，妙趣横生

【输出格式】
请输出JSON格式，不要包含任何其他文字：
{
  "name": "风格名称（4-8个字）",
  "description": "风格描述（50字以内）",
  "stylePrompt": "风格提示词（描述AI应如何调整写作风格，50-100字）",
  "exampleText": "示例文本（80-150字，体现该风格的典型段落）",
  "params": {
    "continue": {
      "length": "medium",
      "style": "original/literary/colloquial/custom",
      "direction": "",
      "temperature": 0.7
    }
  }
}

【创作要求】
1. 风格名称：独特、有吸引力，能准确概括风格特点
2. 风格提示词：具体可操作，包含语言特点、句式偏好、用词倾向等
3. 示例文本：原创、精彩，能充分体现该风格
4. temperature取值：精确风格0.3-0.5，平衡风格0.5-0.7，创意风格0.7-0.9`,
      },
      {
        role: 'user',
        content: `【风格描述】${description}${exampleTextPrompt}

请生成一个写作风格预设：`,
      },
    ];
  },
};

const enhanceSkillPromptTemplate: PromptTemplate = {
  id: 'novel/enhance_skill_prompt',
  name: '技能提示词优化',
  description: '优化AI提示词模板',
  buildMessages: (input: PromptInput) => {
    const { currentPrompt, requirement } = input as EnhanceSkillPromptInput;
    return [
      {
        role: 'system',
        content: `你是一位AI提示词优化专家。用户会提供一个当前的提示词模板和优化需求，你需要根据需求优化提示词。

【优化原则】
1. 保留原有核心意图
2. 根据需求增强或调整
3. 使提示词更具体、更有效
4. 保持格式清晰，便于AI理解

请直接输出优化后的提示词，不要添加任何解释。`,
      },
      {
        role: 'user',
        content: `【当前提示词】
${currentPrompt}

【优化需求】${requirement}

请优化以上提示词：`,
      },
    ];
  },
};

export function registerNovelPrompts(registry: PromptRegistry): () => void {
  const disposers = [
    registry.register(continueTemplate),
    registry.register(polishTemplate),
    registry.register(expandTemplate),
    registry.register(plotSuggestionTemplate),
    registry.register(nameSuggestionTemplate),
    registry.register(characterProfileTemplate),
    registry.register(worldBuildingTemplate),
    registry.register(novelBlueprintTemplate),
    registry.register(inspirationTemplate),
    registry.register(writingSkillsTemplate),
    registry.register(stylePresetTemplate),
    registry.register(enhanceSkillPromptTemplate),
  ];

  return () => disposers.forEach(d => d());
}
