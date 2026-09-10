import type { Skill, SkillCommand } from '../SkillTypes'
import { getLogger } from '../../logging'

const logger = getLogger()

const writingAssistantTools = [
  'novel_continue',
  'novel_polish',
  'novel_plot_suggestion'
]

const writingAssistantCommand: SkillCommand = {
  name: '/write',
  description: '进入写作助手模式',
  execute: async (args, _context) => {
    const topic = args?.trim() || 'general'

    return {
      success: true,
      output: `已进入写作助手模式，主题：${topic}`,
      data: { topic, mode: 'writing_assistant' }
    }
  }
}

export const writingAssistantSkill: Skill = {
  name: 'novel_writing_assistant',
  description: '提供小说写作辅助，包括续写、润色和情节建议',

  tools: writingAssistantTools,

  promptSections: [
    {
      name: 'writing_persona',
      order: 10,
      content: () => `
你是一位专业的小说创作助手，擅长帮助用户进行小说创作。

写作原则：
1. 保持与原文风格一致
2. 推动情节自然发展
3. 保持角色性格一致
4. 注重画面感和节奏感
5. 尊重作者的创作意图
      `.trim()
    },
    {
      name: 'writing_technique',
      order: 20,
      content: () => `
写作技巧：
- 场景构建：通过五感描写营造沉浸感
- 对话设计：展现角色性格，推动情节
- 节奏控制：张弛有度，高潮迭起
- 伏笔埋设：前后呼应，逻辑自洽
      `.trim()
    }
  ],

  commands: [writingAssistantCommand],

  on: {
    'turn/start': async (payload, _context) => {
      logger.debug('WritingAssistant', 'Turn started', { sessionId: payload.sessionId })
    },
    'tool/completed': async (payload, _context) => {
      logger.debug('WritingAssistant', 'Tool completed', { tool: payload.tool })
    }
  },

  onActivate: async (context) => {
    logger.info('WritingAssistant', 'Skill activated', { sessionId: context.sessionId })
  },

  onDeactivate: async (context) => {
    logger.info('WritingAssistant', 'Skill deactivated', { sessionId: context.sessionId })
  }
}
