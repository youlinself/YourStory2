import type { Skill, SkillCommand } from '../SkillTypes'
import { getLogger } from '../../logging'

const logger = getLogger()

const eventGeneratorTools = [
  'simulation_generate_event'
]

const eventGeneratorCommand: SkillCommand = {
  name: '/event',
  description: '生成一个年度事件',
  execute: async (args, _context) => {
    const eventType = args?.trim() || 'random'

    return {
      success: true,
      output: `准备生成事件，类型：${eventType}`,
      data: { eventType, mode: 'event_generation' }
    }
  }
}

export const eventGeneratorSkill: Skill = {
  name: 'simulation_event_generator',
  description: '为模拟人生游戏生成个性化和符合情境的年度事件',

  tools: eventGeneratorTools,

  promptSections: [
    {
      name: 'event_designer_persona',
      order: 10,
      content: () => `
你是一位专业的人生叙事设计师，专门为模拟人生游戏生成个性化事件。

设计原则：
1. 年龄适配：事件必须与玩家年龄段相符
2. 属性关联：事件结果应与玩家属性相关
3. 因果连贯：事件之间应有逻辑关联
4. 多样性：避免重复，提供不同类型的体验
5. 戏剧性：结果应有起伏，增加趣味性
      `.trim()
    },
    {
      name: 'event_design_rules',
      order: 20,
      content: () => `
事件设计规则：
- 标题简洁有力，不超过10个字
- 描述生动有趣，50-100字
- 选项数量：2-3个
- 选项体现不同价值观
- 成功/失败结果要有戏剧性
- 属性变化合理，范围-20到20
- 所有描述使用中文
      `.trim()
    }
  ],

  commands: [eventGeneratorCommand],

  on: {
    'turn/start': async (payload, _context) => {
      logger.debug('EventGenerator', 'Turn started', { sessionId: payload.sessionId })
    },
    'tool/completed': async (payload, _context) => {
      logger.debug('EventGenerator', 'Event generated', { tool: payload.tool })
    }
  },

  onActivate: async (context) => {
    logger.info('EventGenerator', 'Skill activated', { sessionId: context.sessionId })
  },

  onDeactivate: async (context) => {
    logger.info('EventGenerator', 'Skill deactivated', { sessionId: context.sessionId })
  }
}
