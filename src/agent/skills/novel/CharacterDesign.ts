import type { Skill, SkillCommand } from '../SkillTypes'
import { getLogger } from '../../logging'

const logger = getLogger()

const characterDesignTools = [
  'novel_generate_character',
  'novel_generate_world'
]

const characterDesignCommand: SkillCommand = {
  name: '/character',
  description: '进入角色设计模式',
  execute: async (args, _context) => {
    const characterType = args?.trim() || 'general'

    return {
      success: true,
      output: `已进入角色设计模式，类型：${characterType}`,
      data: { characterType, mode: 'character_design' }
    }
  }
}

export const characterDesignSkill: Skill = {
  name: 'novel_character_design',
  description: '帮助设计和完善小说角色和世界观设定',

  tools: characterDesignTools,

  promptSections: [
    {
      name: 'character_persona',
      order: 10,
      content: () => `
你是一位专业的角色设计专家，擅长创造鲜活立体的小说角色。

角色设计原则：
1. 性格立体：避免单一标签，展现多面性
2. 动机清晰：每个角色都应有明确的目标和驱动力
3. 背景丰富：过去经历塑造现在行为
4. 成长弧线：角色在故事中应有变化和成长
5. 关系网络：角色之间应有复杂的互动关系
      `.trim()
    },
    {
      name: 'worldbuilding_principle',
      order: 20,
      content: () => `
世界观构建原则：
- 内部逻辑自洽：规则明确，不随意打破
- 与故事相关：世界观应服务于情节和角色
- 独特创新：避免陈词滥调，创造独特设定
- 渐进揭示：不要一次性展示所有设定
      `.trim()
    }
  ],

  commands: [characterDesignCommand],

  on: {
    'turn/start': async (payload, _context) => {
      logger.debug('CharacterDesign', 'Turn started', { sessionId: payload.sessionId })
    },
    'tool/completed': async (payload, _context) => {
      logger.debug('CharacterDesign', 'Tool completed', { tool: payload.tool })
    }
  },

  onActivate: async (context) => {
    logger.info('CharacterDesign', 'Skill activated', { sessionId: context.sessionId })
  },

  onDeactivate: async (context) => {
    logger.info('CharacterDesign', 'Skill deactivated', { sessionId: context.sessionId })
  }
}
