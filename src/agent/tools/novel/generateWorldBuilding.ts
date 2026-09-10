import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

interface GenerateWorldBuildingArgs {
  description: string
  genre?: string
  complexity?: 'simple' | 'medium' | 'complex'
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: '世界观描述或灵感'
    },
    genre: {
      type: 'string',
      description: '小说类型（如：玄幻、科幻、都市等）'
    },
    complexity: {
      type: 'string',
      enum: ['simple', 'medium', 'complex'],
      description: '世界观复杂度'
    }
  },
  required: ['description']
}

export const generateWorldBuildingTool: ToolDefinition = {
  name: 'novel_generate_world',
  description: '生成详细的世界观设定',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: GenerateWorldBuildingArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { description, genre, complexity = 'medium' } = args

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: 'description is required'
      }
    }

    const complexityGuide = {
      simple: '简洁明了，核心设定3-5个要素',
      medium: '适中详细，包含地理、历史、力量体系等',
      complex: '详尽完整，包含多个势力、复杂规则和细节'
    }

    return {
      success: true,
      data: {
        prompt: {
          description,
          genre: genre || '不限',
          complexityGuide: complexityGuide[complexity]
        }
      }
    }
  }
}
