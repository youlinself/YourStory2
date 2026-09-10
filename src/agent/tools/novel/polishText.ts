import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

interface PolishTextArgs {
  originalText: string
  style?: string
  focusAreas?: string[]
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    originalText: {
      type: 'string',
      description: '需要润色的原始文本'
    },
    style: {
      type: 'string',
      description: '目标风格（如：文学性、简洁、古风等）'
    },
    focusAreas: {
      type: 'array',
      description: '重点关注领域（如：流畅度、画面感、节奏等）',
      items: { type: 'string', description: '关注领域名称' }
    }
  },
  required: ['originalText']
}

export const polishTextTool: ToolDefinition = {
  name: 'novel_polish',
  description: '对小说文本进行润色，提升文学性和流畅度',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: PolishTextArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { originalText, style, focusAreas } = args

    if (!originalText || originalText.trim().length === 0) {
      return {
        success: false,
        error: 'originalText is required and cannot be empty'
      }
    }

    if (originalText.length > 10000) {
      return {
        success: false,
        error: 'Text too long. Maximum 10000 characters allowed.'
      }
    }

    return {
      success: true,
      data: {
        prompt: {
          originalText,
          style: style || '保持原风格',
          focusAreas: focusAreas || ['流畅度', '画面感']
        }
      }
    }
  }
}
