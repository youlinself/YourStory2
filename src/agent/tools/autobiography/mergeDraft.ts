import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

interface MergeDraftArgs {
  chapterId: string
  existingDraft: string
  newContent: string[]
  mergeOptions?: {
    insertPosition?: 'beginning' | 'end' | 'chronological' | 'smart'
    deduplicate?: boolean
    preserveStyle?: boolean
  }
}

interface MergeResult {
  chapterId: string
  mergedContent: string
  changes: Array<{ type: string; count: number; position?: number }>
  stats: {
    originalLength: number
    addedLength: number
    finalLength: number
  }
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    chapterId: { type: 'string', description: '章节ID' },
    existingDraft: { type: 'string', description: '现有草稿内容' },
    newContent: {
      type: 'array',
      items: { type: 'string', description: '内容段落' },
      description: '新内容段落'
    },
    mergeOptions: {
      type: 'object',
      description: '合并选项',
      properties: {
        insertPosition: {
          type: 'string',
          enum: ['beginning', 'end', 'chronological', 'smart'],
          description: '插入位置'
        },
        deduplicate: { type: 'boolean', description: '是否去重' },
        preserveStyle: { type: 'boolean', description: '是否保留写作风格' }
      }
    }
  },
  required: ['chapterId', 'existingDraft', 'newContent']
}

export const mergeDraftTool: ToolDefinition = {
  name: 'merge_draft',
  description: '将提取的内容智能合并到章节草稿中，支持去重和风格保持',
  parameters,
  isConcurrencySafe: () => false,
  timeoutMs: 30000,

  execute: async (args: MergeDraftArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { chapterId, existingDraft, newContent, mergeOptions } = args

    if (!chapterId) {
      return { success: false, error: 'chapterId is required' }
    }

    if (!newContent || newContent.length === 0) {
      return { success: false, error: 'newContent cannot be empty' }
    }

    const analysis = analyzeDraft(existingDraft)

    let processedContent = newContent
    if (mergeOptions?.deduplicate) {
      processedContent = deduplicateContent(newContent, existingDraft)
    }

    const merged = smartMerge(existingDraft, processedContent, {
      insertPosition: mergeOptions?.insertPosition || 'smart',
      preserveStyle: mergeOptions?.preserveStyle !== false,
      analysis
    })

    const result: MergeResult = {
      chapterId,
      mergedContent: merged.content,
      changes: merged.changes,
      stats: {
        originalLength: existingDraft.length,
        addedLength: processedContent.join('').length,
        finalLength: merged.content.length
      }
    }

    return {
      success: true,
      data: result
    }
  }
}

interface DraftAnalysis {
  timeMentions: string[]
  themes: string[]
  style: {
    person: 'first' | 'third' | 'unknown'
    tense: 'past' | 'present' | 'unknown'
    formality: 'formal' | 'casual' | 'unknown'
  }
}

function analyzeDraft(draft: string): DraftAnalysis {
  return {
    timeMentions: extractTimeMentions(draft),
    themes: extractThemes(draft),
    style: analyzeStyle(draft)
  }
}

function extractTimeMentions(text: string): string[] {
  const timePattern = /\d{4}年|\d{2}年代|春|夏|秋|冬/g
  return text.match(timePattern) || []
}

function extractThemes(text: string): string[] {
  const themeKeywords = ['童年', '学校', '工作', '家庭', '旅行', '友情', '爱情', '成长', '梦想']
  return themeKeywords.filter(theme => text.includes(theme))
}

function analyzeStyle(text: string): DraftAnalysis['style'] {
  const firstPersonCount = (text.match(/我|我的/g) || []).length
  const thirdPersonCount = (text.match(/他|她|他的|她的/g) || []).length

  const person: 'first' | 'third' | 'unknown' =
    firstPersonCount > thirdPersonCount ? 'first' :
    thirdPersonCount > firstPersonCount ? 'third' : 'unknown'

  const pastTenseCount = (text.match(/了|过|曾经|以前/g) || []).length
  const presentTenseCount = (text.match(/现在|正在|目前|今天/g) || []).length

  const tense: 'past' | 'present' | 'unknown' =
    pastTenseCount > presentTenseCount ? 'past' :
    presentTenseCount > pastTenseCount ? 'present' : 'unknown'

  const formalWords = ['因此', '然而', '此外', '综上所述']
  const casualWords = ['然后', '就是', '那个', '嗯']

  const formalCount = formalWords.filter(w => text.includes(w)).length
  const casualCount = casualWords.filter(w => text.includes(w)).length

  const formality: 'formal' | 'casual' | 'unknown' =
    formalCount > casualCount ? 'formal' :
    casualCount > formalCount ? 'casual' : 'unknown'

  return { person, tense, formality }
}

function deduplicateContent(newContent: string[], existingDraft: string): string[] {
  return newContent.filter(paragraph => {
    return !isSimilarToExisting(paragraph, existingDraft)
  })
}

function isSimilarToExisting(paragraph: string, draft: string): boolean {
  const threshold = 0.8

  if (draft.includes(paragraph)) {
    return true
  }

  const paragraphWords = new Set(paragraph.split(''))
  const draftWords = new Set(draft.split(''))

  let commonCount = 0
  for (const word of paragraphWords) {
    if (draftWords.has(word)) {
      commonCount++
    }
  }

  const similarity = commonCount / Math.max(paragraphWords.size, 1)
  return similarity >= threshold
}

interface MergeOptions {
  insertPosition: 'beginning' | 'end' | 'chronological' | 'smart'
  preserveStyle: boolean
  analysis: DraftAnalysis
}

interface SmartMergeResult {
  content: string
  changes: Array<{ type: string; count: number; position?: number }>
}

function smartMerge(
  existing: string,
  newContent: string[],
  options: MergeOptions
): SmartMergeResult {
  const changes: Array<{ type: string; count: number; position?: number }> = []

  if (options.insertPosition === 'beginning') {
    changes.push({ type: 'prepend', count: newContent.length })
    return {
      content: [...newContent, existing].join('\n\n'),
      changes
    }
  }

  if (options.insertPosition === 'end') {
    changes.push({ type: 'append', count: newContent.length })
    return {
      content: [existing, ...newContent].join('\n\n'),
      changes
    }
  }

  if (options.insertPosition === 'chronological') {
    const sections = splitIntoSections(existing)
    const mergedSections = insertChronologically(sections, newContent, options.analysis!)
    changes.push({ type: 'chronological_insert', count: newContent.length })
    return {
      content: mergedSections.join('\n\n'),
      changes
    }
  }

  const sections = splitIntoSections(existing)
  const mergedSections = insertSmart(sections, newContent, options)
  changes.push({ type: 'smart_insert', count: newContent.length })

  return {
    content: mergedSections.join('\n\n'),
    changes
  }
}

function splitIntoSections(content: string): string[] {
  return content.split(/\n\n+/).filter(s => s.trim().length > 0)
}

function insertChronologically(
  sections: string[],
  newContent: string[],
  _analysis: DraftAnalysis
): string[] {
  const allSections = [...sections, ...newContent]
  return allSections.sort((a, b) => {
    const yearA = extractYear(a)
    const yearB = extractYear(b)
    if (yearA && yearB) return yearA - yearB
    if (yearA) return -1
    if (yearB) return 1
    return 0
  })
}

function extractYear(text: string): number | null {
  const match = text.match(/(\d{4})年/)
  return match ? parseInt(match[1], 10) : null
}

function insertSmart(
  sections: string[],
  newContent: string[],
  options: MergeOptions
): string[] {
  const result = [...sections]

  for (const paragraph of newContent) {
    let bestPosition = result.length
    let bestScore = -1

    for (let i = 0; i <= result.length; i++) {
      const score = calculateInsertScore(paragraph, result, i, options)
      if (score > bestScore) {
        bestScore = score
        bestPosition = i
      }
    }

    result.splice(bestPosition, 0, paragraph)
  }

  return result
}

function calculateInsertScore(
  paragraph: string,
  sections: string[],
  position: number,
  options: MergeOptions
): number {
  let score = 0

  if (position > 0) {
    const prevSection = sections[position - 1]
    if (hasCommonThemes(paragraph, prevSection)) {
      score += 2
    }
  }

  if (position < sections.length) {
    const nextSection = sections[position]
    if (hasCommonThemes(paragraph, nextSection)) {
      score += 2
    }
  }

  if (options.preserveStyle) {
    const paragraphStyle = analyzeStyle(paragraph)
    if (paragraphStyle.person === options.analysis.style.person) {
      score += 1
    }
  }

  return score
}

function hasCommonThemes(a: string, b: string): boolean {
  const themes = ['童年', '学校', '工作', '家庭', '旅行', '友情', '爱情', '成长', '梦想']
  return themes.some(theme => a.includes(theme) && b.includes(theme))
}
