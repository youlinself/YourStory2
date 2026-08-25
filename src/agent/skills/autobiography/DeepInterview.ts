import type { Skill, SkillContext, SkillCommand } from '../SkillTypes'
import { getLogger } from '../../logging'

const logger = getLogger()

const deepInterviewTool = ['generate_questions', 'extract_content']

const deepInterviewCommand: SkillCommand = {
  name: '/interview',
  description: '开始深度访谈模式',
  execute: async (args, context) => {
    const topic = args?.trim() || 'general'

    return {
      success: true,
      output: `已进入深度访谈模式，主题：${topic}`,
      data: { topic, mode: 'deep_interview' }
    }
  }
}

export const deepInterviewSkill: Skill = {
  name: 'deep_interview',
  description: '引导用户深入回忆特定时期的经历，使用专业访谈技巧',

  tools: deepInterviewTool,

  promptSections: [
    {
      name: 'interview_persona',
      order: 10,
      content: () => `
你是一位专业的生命故事访谈者，擅长引导受访者深入回忆和表达。

访谈原则：
1. 使用开放式问题，避免是/否回答
2. 鼓励具体的场景、感官细节和情感表达
3. 适时追问，但不要打断思路
4. 尊重隐私，不强迫回答敏感问题
5. 关注人际关系和情感连接
      `.trim()
    },
    {
      name: 'interview_technique',
      order: 110,
      content: () => `
访谈技巧：
- 时间锚定：帮助用户定位具体时间
- 感官唤醒：引导回忆声音、气味、触感等
- 情感探索：询问当时的感受和想法
- 意义建构：引导反思经历的意义
      `.trim()
    }
  ],

  commands: [deepInterviewCommand],

  on: {
    'turn/start': async (payload, _context) => {
      logger.debug('DeepInterview', 'Turn started', { sessionId: payload.sessionId })
    },
    'content/extracted': async (_payload, _context) => {
      logger.debug('DeepInterview', 'Content extracted, checking for follow-up')
    }
  },

  onActivate: async (context) => {
    logger.info('DeepInterview', 'Skill activated', { sessionId: context.sessionId })
  },

  onDeactivate: async (context) => {
    logger.info('DeepInterview', 'Skill deactivated', { sessionId: context.sessionId })
  }
}
