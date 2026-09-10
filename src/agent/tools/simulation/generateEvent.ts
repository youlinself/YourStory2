import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'
import type { PlayerAttributes, ChoiceRecord } from '@/types/simulation'

interface GenerateEventArgs {
  age: number
  birthYear: number
  attributes: PlayerAttributes
  choiceHistory: ChoiceRecord[]
  era: number
  eventType?: 'combat' | 'elite' | 'event' | 'wonder' | 'rest' | 'shop' | 'boss' | 'random'
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    age: {
      type: 'number',
      description: '玩家当前年龄'
    },
    birthYear: {
      type: 'number',
      description: '出生年份'
    },
    attributes: {
      type: 'object',
      description: '玩家当前属性值'
    },
    choiceHistory: {
      type: 'array',
      description: '历史选择记录'
    },
    era: {
      type: 'number',
      description: '时代索引'
    },
    eventType: {
      type: 'string',
      enum: ['combat', 'elite', 'event', 'wonder', 'rest', 'shop', 'boss', 'random'],
      description: '事件类型，不指定则随机'
    }
  },
  required: ['age', 'birthYear', 'attributes', 'era']
}

export const generateEventTool: ToolDefinition = {
  name: 'simulation_generate_event',
  description: '为模拟人生游戏生成个性化年度事件',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: GenerateEventArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { age, birthYear, attributes, choiceHistory, era, eventType } = args

    if (age === undefined || age < 0 || age > 150) {
      return {
        success: false,
        error: 'Invalid age. Must be between 0 and 150.'
      }
    }

    if (!attributes) {
      return {
        success: false,
        error: 'attributes is required'
      }
    }

    const validAttrs = ['energy', 'physique', 'health', 'iq', 'eq', 'wealth', 'network', 'fame']
    const sanitizedAttrs: Record<string, number> = {}

    for (const key of validAttrs) {
      const value = attributes[key as keyof PlayerAttributes]
      if (typeof value === 'number') {
        sanitizedAttrs[key] = Math.max(0, Math.min(999, value))
      }
    }

    return {
      success: true,
      data: {
        prompt: {
          age,
          birthYear,
          attributes: sanitizedAttrs,
          choiceHistory: choiceHistory || [],
          era,
          eventType: eventType || 'random'
        }
      }
    }
  }
}
