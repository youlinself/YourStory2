import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'
import type { NovelChapter, Character, WorldBuilding } from '@/types/novel'

interface ContinueNovelArgs {
  chapter: NovelChapter
  characters: Character[]
  worldBuilding: WorldBuilding | null
  length?: 'short' | 'medium' | 'long'
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    chapter: {
      type: 'object',
      description: '当前章节信息，包含标题和内容'
    },
    characters: {
      type: 'array',
      description: '小说角色列表'
    },
    worldBuilding: {
      type: 'object',
      description: '世界观设定'
    },
    length: {
      type: 'string',
      enum: ['short', 'medium', 'long'],
      description: '续写长度：short(200-300字), medium(300-500字), long(500-800字)'
    }
  },
  required: ['chapter']
}

export const continueNovelTool: ToolDefinition = {
  name: 'novel_continue',
  description: '根据章节内容和角色信息续写小说',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 60000,

  execute: async (args: ContinueNovelArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { chapter, characters, worldBuilding, length = 'medium' } = args

    if (!chapter) {
      return {
        success: false,
        error: 'chapter is required'
      }
    }

    const lengthGuide = {
      short: '200-300字',
      medium: '300-500字',
      long: '500-800字'
    }

    const characterInfo = characters?.length
      ? characters.map(c => `${c.name}（${c.role}）：${c.personality}`).join('\n')
      : '暂无角色信息'

    const worldInfo = worldBuilding
      ? `世界设定：${worldBuilding.setting}\n时代：${worldBuilding.era}\n地点：${worldBuilding.location}`
      : '无特殊世界设定'

    return {
      success: true,
      data: {
        prompt: {
          characterInfo,
          worldInfo,
          chapterTitle: chapter.title,
          previousContent: chapter.content || '（这是章节开头，请开始写作）',
          targetLength: lengthGuide[length]
        }
      }
    }
  }
}
