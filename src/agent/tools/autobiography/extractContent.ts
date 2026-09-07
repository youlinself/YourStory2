import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'
import type { ExtractedContent } from '@/types'

interface ExtractContentArgs {
  conversationSegments: string[]
  extractOptions?: {
    includeTimeTag?: boolean
    includeEmotions?: boolean
    includePeople?: boolean
    narrativeStyle?: 'first_person' | 'third_person' | 'auto'
  }
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    conversationSegments: {
      type: 'array',
      items: { type: 'string', description: '对话片段' },
      description: '要提取的对话片段'
    },
    extractOptions: {
      type: 'object',
      description: '提取选项',
      properties: {
        includeTimeTag: { type: 'boolean', description: '是否提取时间标签' },
        includeEmotions: { type: 'boolean', description: '是否提取情感标签' },
        includePeople: { type: 'boolean', description: '是否提取人物' },
        narrativeStyle: {
          type: 'string',
          enum: ['first_person', 'third_person', 'auto'],
          description: '叙事风格'
        }
      }
    }
  },
  required: ['conversationSegments']
}

export const extractContentTool: ToolDefinition = {
  name: 'extract_content',
  description: '从对话内容中提取结构化的叙事内容，将口语化的对话转化为自传叙事',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 30000,

  execute: async (args: ExtractContentArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { conversationSegments, extractOptions } = args

    if (!conversationSegments || conversationSegments.length === 0) {
      return {
        success: false,
        error: 'conversationSegments is required and cannot be empty'
      }
    }

    const originalLength = conversationSegments.join('').length

    const paragraphs = conversationSegments.map(segment => {
      let processed = segment
      if (extractOptions?.narrativeStyle === 'first_person') {
        processed = convertToFirstPerson(processed)
      } else if (extractOptions?.narrativeStyle === 'third_person') {
        processed = convertToThirdPerson(processed)
      }
      return processed
    })

    const extracted: ExtractedContent = {
      paragraphs,
      status: 'pending',
      timeTag: extractOptions?.includeTimeTag ? extractTimeTag(conversationSegments) : undefined,
      emotionTags: extractOptions?.includeEmotions ? extractEmotions(conversationSegments) : [],
      people: extractOptions?.includePeople ? extractPeople(conversationSegments) : []
    }

    return {
      success: true,
      data: {
        ...extracted,
        confidence: calculateConfidence(conversationSegments, paragraphs),
        originalLength,
        extractedLength: paragraphs.join('').length
      }
    }
  }
}

function convertToFirstPerson(text: string): string {
  return text.replace(/你/g, '我').replace(/您的/g, '我的')
}

function convertToThirdPerson(text: string): string {
  return text.replace(/我/g, '他').replace(/我的/g, '他的')
}

function extractTimeTag(segments: string[]): string | undefined {
  const timePattern = /(\d{4}年|\d{2}年代|春|夏|秋|冬)/g
  const text = segments.join(' ')
  const matches = text.match(timePattern)
  return matches ? matches[0] : undefined
}

function extractEmotions(segments: string[]): string[] {
  const emotionKeywords: Record<string, string[]> = {
    '温馨': ['温暖', '幸福', '快乐', '开心', '甜蜜'],
    '艰辛': ['辛苦', '艰难', '困难', '累', '苦'],
    '激动': ['兴奋', '感动', '震撼', '惊讶', '惊喜'],
    '怀念': ['想念', '思念', '回忆', '追忆', '难忘']
  }

  const text = segments.join(' ')
  const detectedEmotions: string[] = []

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detectedEmotions.push(emotion)
    }
  }

  return detectedEmotions
}

function extractPeople(segments: string[]): string[] {
  const peoplePattern = /(妈妈|爸爸|父亲|母亲|爷爷|奶奶|外公|外婆|老师|朋友|同学|哥哥|姐姐|弟弟|妹妹|丈夫|妻子|儿子|女儿)/g
  const text = segments.join(' ')
  const matches = text.match(peoplePattern)
  return matches ? [...new Set(matches)] : []
}

function calculateConfidence(original: string[], extracted: string[]): number {
  const originalLength = original.join('').length
  const extractedLength = extracted.join('').length

  if (originalLength === 0) return 0

  const ratio = extractedLength / originalLength
  const confidence = Math.min(0.95, Math.max(0.5, ratio))
  return Math.round(confidence * 100) / 100
}
