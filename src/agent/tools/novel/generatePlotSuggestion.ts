import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'
import type { NovelChapter } from '@/types/novel'

interface GeneratePlotSuggestionArgs {
  currentChapter: NovelChapter
  synopsis: string
  previousChapters?: NovelChapter[]
  count?: number
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    currentChapter: {
      type: 'object',
      description: '当前章节信息'
    },
    synopsis: {
      type: 'string',
      description: '小说简介'
    },
    previousChapters: {
      type: 'array',
      description: '前文章节列表（可选）'
    },
    count: {
      type: 'number',
      description: '建议数量（3-5个）'
    }
  },
  required: ['currentChapter', 'synopsis']
}

export const generatePlotSuggestionTool: ToolDefinition = {
  name: 'novel_plot_suggestion',
  description: '根据当前章节内容提供后续情节建议',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: GeneratePlotSuggestionArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { currentChapter, synopsis, previousChapters, count = 5 } = args

    if (!currentChapter || !synopsis) {
      return {
        success: false,
        error: 'currentChapter and synopsis are required'
      }
    }

    const clampedCount = Math.max(3, Math.min(5, count))

    return {
      success: true,
      data: {
        prompt: {
          currentChapter,
          synopsis,
          previousChapters: previousChapters || [],
          suggestionCount: clampedCount
        }
      }
    }
  }
}
