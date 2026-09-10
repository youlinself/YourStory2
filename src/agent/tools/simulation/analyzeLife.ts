import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'
import type { ChoiceRecord, LifeRecord } from '@/types/simulation'

interface AnalyzeLifeArgs {
  lifeRecords: LifeRecord[]
  choiceHistory: ChoiceRecord[]
  finalAttributes: Record<string, number>
  lifespan: number
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    lifeRecords: {
      type: 'array',
      description: '人生阶段记录'
    },
    choiceHistory: {
      type: 'array',
      description: '所有选择记录'
    },
    finalAttributes: {
      type: 'object',
      description: '最终属性值'
    },
    lifespan: {
      type: 'number',
      description: '寿命（年）'
    }
  },
  required: ['lifeRecords', 'choiceHistory', 'finalAttributes', 'lifespan']
}

export const analyzeLifeTool: ToolDefinition = {
  name: 'simulation_analyze_life',
  description: '分析玩家的人生历程，生成总结报告',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: AnalyzeLifeArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { lifeRecords, choiceHistory, finalAttributes, lifespan } = args

    if (!lifeRecords || lifeRecords.length === 0) {
      return {
        success: false,
        error: 'lifeRecords is required and cannot be empty'
      }
    }

    const totalChoices = choiceHistory?.length || 0
    const successChoices = choiceHistory?.filter(c => c.success).length || 0
    const successRate = totalChoices > 0 ? (successChoices / totalChoices * 100).toFixed(1) : '0'

    const peakAttributes = Object.entries(finalAttributes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => ({ attribute: key, value }))

    const eraGroups: Record<number, number> = {}
    for (const record of lifeRecords) {
      const era = record.era
      if (eraGroups[era] === undefined) {
        eraGroups[era] = 0
      }
      eraGroups[era]++
    }

    return {
      success: true,
      data: {
        analysis: {
          lifespan,
          totalChoices,
          successRate: `${successRate}%`,
          peakAttributes,
          lifeStages: lifeRecords.length,
          eraDistribution: eraGroups
        }
      }
    }
  }
}
