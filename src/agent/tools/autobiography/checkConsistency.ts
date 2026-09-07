import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

type CheckItem = 'person' | 'tense' | 'tone' | 'vocabulary' | 'sentence_structure'

interface CheckConsistencyArgs {
  currentChapter: string
  otherChapters?: string[]
  checkItems?: CheckItem[]
}

interface ConsistencyDetail {
  score: number
  issues: string[]
}

interface ConsistencyResult {
  overall: number
  details: Record<string, ConsistencyDetail>
  suggestions: string[]
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    currentChapter: { type: 'string', description: '当前章节内容' },
    otherChapters: {
      type: 'array',
      items: { type: 'string', description: '章节内容' },
      description: '其他章节内容'
    },
    checkItems: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['person', 'tense', 'tone', 'vocabulary', 'sentence_structure'],
        description: '检查项'
      },
      description: '检查项目'
    }
  },
  required: ['currentChapter']
}

export const checkConsistencyTool: ToolDefinition = {
  name: 'check_consistency',
  description: '检查自传章节之间的写作风格、时态、人称一致性',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 20000,

  execute: async (args: CheckConsistencyArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { currentChapter, otherChapters, checkItems } = args

    if (!currentChapter || currentChapter.trim().length === 0) {
      return { success: false, error: 'currentChapter cannot be empty' }
    }

    const itemsToCheck = checkItems || ['person', 'tense', 'tone', 'vocabulary', 'sentence_structure']
    const chapters = otherChapters || []

    const result = analyzeConsistency(currentChapter, chapters, itemsToCheck)

    return {
      success: true,
      data: result
    }
  }
}

function analyzeConsistency(
  current: string,
  others: string[],
  items: CheckItem[]
): ConsistencyResult {
  const details: Record<string, ConsistencyDetail> = {}
  let totalScore = 0

  for (const item of items) {
    const detail = checkItem(current, others, item)
    details[item] = detail
    totalScore += detail.score
  }

  const overall = items.length > 0 ? totalScore / items.length : 1

  const suggestions = generateSuggestions(details)

  return {
    overall: Math.round(overall * 100) / 100,
    details,
    suggestions
  }
}

function checkItem(
  current: string,
  others: string[],
  item: CheckItem
): ConsistencyDetail {
  switch (item) {
    case 'person':
      return checkPersonConsistency(current, others)
    case 'tense':
      return checkTenseConsistency(current, others)
    case 'tone':
      return checkToneConsistency(current, others)
    case 'vocabulary':
      return checkVocabularyConsistency(current, others)
    case 'sentence_structure':
      return checkSentenceStructureConsistency(current, others)
    default:
      return { score: 1, issues: [] }
  }
}

function checkPersonConsistency(current: string, others: string[]): ConsistencyDetail {
  const currentPerson = detectPerson(current)
  const issues: string[] = []
  let score = 1

  for (const other of others) {
    const otherPerson = detectPerson(other)
    if (currentPerson !== otherPerson && currentPerson !== 'unknown' && otherPerson !== 'unknown') {
      issues.push(`人称不一致：当前使用${getPersonText(currentPerson)}，其他章节使用${getPersonText(otherPerson)}`)
      score -= 0.2
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

function detectPerson(text: string): 'first' | 'third' | 'unknown' {
  const firstPersonCount = (text.match(/我|我的|我们|我们的/g) || []).length
  const thirdPersonCount = (text.match(/他|她|他的|她的|他们|她们的/g) || []).length

  if (firstPersonCount > thirdPersonCount * 1.5) return 'first'
  if (thirdPersonCount > firstPersonCount * 1.5) return 'third'
  return 'unknown'
}

function getPersonText(person: 'first' | 'third' | 'unknown'): string {
  switch (person) {
    case 'first': return '第一人称'
    case 'third': return '第三人称'
    default: return '未知人称'
  }
}

function checkTenseConsistency(current: string, others: string[]): ConsistencyDetail {
  const currentTense = detectTense(current)
  const issues: string[] = []
  let score = 1

  for (const other of others) {
    const otherTense = detectTense(other)
    if (currentTense !== otherTense && currentTense !== 'unknown' && otherTense !== 'unknown') {
      issues.push(`时态不一致：当前使用${getTenseText(currentTense)}，其他章节使用${getTenseText(otherTense)}`)
      score -= 0.2
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

function detectTense(text: string): 'past' | 'present' | 'future' | 'unknown' {
  const pastCount = (text.match(/了|过|曾经|以前|当时|过去/g) || []).length
  const presentCount = (text.match(/现在|正在|目前|今天|此刻/g) || []).length
  const futureCount = (text.match(/将来|未来|以后|将要|计划/g) || []).length

  const max = Math.max(pastCount, presentCount, futureCount)
  if (max === 0) return 'unknown'

  if (max === pastCount) return 'past'
  if (max === presentCount) return 'present'
  return 'future'
}

function getTenseText(tense: 'past' | 'present' | 'future' | 'unknown'): string {
  switch (tense) {
    case 'past': return '过去时'
    case 'present': return '现在时'
    case 'future': return '将来时'
    default: return '未知时态'
  }
}

function checkToneConsistency(current: string, others: string[]): ConsistencyDetail {
  const currentTone = detectTone(current)
  const issues: string[] = []
  let score = 1

  for (const other of others) {
    const otherTone = detectTone(other)
    if (currentTone !== otherTone && currentTone !== 'neutral' && otherTone !== 'neutral') {
      issues.push(`语气不一致：当前为${currentTone}语气，其他章节为${otherTone}语气`)
      score -= 0.15
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

function detectTone(text: string): 'formal' | 'casual' | 'literary' | 'neutral' {
  const formalWords = ['因此', '然而', '此外', '综上所述', '由此可见']
  const casualWords = ['然后', '就是', '那个', '嗯', '哈哈', '呵呵']
  const literaryWords = ['宛如', '仿佛', '犹如', '似乎', '恰似']

  const formalCount = formalWords.filter(w => text.includes(w)).length
  const casualCount = casualWords.filter(w => text.includes(w)).length
  const literaryCount = literaryWords.filter(w => text.includes(w)).length

  const max = Math.max(formalCount, casualCount, literaryCount)
  if (max === 0) return 'neutral'

  if (max === formalCount) return 'formal'
  if (max === casualCount) return 'casual'
  return 'literary'
}

function checkVocabularyConsistency(current: string, others: string[]): ConsistencyDetail {
  const issues: string[] = []
  let score = 1

  const currentWords = extractSignificantWords(current)

  for (const other of others) {
    const otherWords = extractSignificantWords(other)
    const overlap = calculateOverlap(currentWords, otherWords)

    if (overlap < 0.1 && currentWords.size > 5 && otherWords.size > 5) {
      issues.push('词汇重叠度较低，可能存在用词风格差异')
      score -= 0.1
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

function extractSignificantWords(text: string): Set<string> {
  const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '有', '和', '与', '或', '但', '而', '就', '也', '都', '要', '能', '会', '可以'])
  const words = new Set<string>()

  for (const char of text) {
    if (!stopWords.has(char) && char.trim().length > 0) {
      words.add(char)
    }
  }

  return words
}

function calculateOverlap(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0

  let common = 0
  for (const item of setA) {
    if (setB.has(item)) {
      common++
    }
  }

  return common / Math.max(setA.size, setB.size)
}

function checkSentenceStructureConsistency(current: string, others: string[]): ConsistencyDetail {
  const issues: string[] = []
  let score = 1

  const currentAvgLength = calculateAverageSentenceLength(current)

  for (const other of others) {
    const otherAvgLength = calculateAverageSentenceLength(other)
    const ratio = currentAvgLength / otherAvgLength

    if (ratio > 2 || ratio < 0.5) {
      issues.push(`句子长度差异较大：当前平均${currentAvgLength.toFixed(0)}字，其他章节平均${otherAvgLength.toFixed(0)}字`)
      score -= 0.1
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

function calculateAverageSentenceLength(text: string): number {
  const sentences = text.split(/[。！？；\n]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 0

  const totalLength = sentences.reduce((sum, s) => sum + s.trim().length, 0)
  return totalLength / sentences.length
}

function generateSuggestions(details: Record<string, ConsistencyDetail>): string[] {
  const suggestions: string[] = []

  if (details.person && details.person.score < 0.8) {
    suggestions.push('建议统一使用相同的人称视角，自传通常使用第一人称')
  }

  if (details.tense && details.tense.score < 0.8) {
    suggestions.push('建议统一时态，回忆性自传通常使用过去时')
  }

  if (details.tone && details.tone.score < 0.8) {
    suggestions.push('建议保持一致的写作语气，避免在不同风格间跳跃')
  }

  if (details.vocabulary && details.vocabulary.score < 0.8) {
    suggestions.push('建议保持用词风格的一致性，避免词汇使用差异过大')
  }

  if (details.sentence_structure && details.sentence_structure.score < 0.8) {
    suggestions.push('建议保持句子长度和结构的一致性')
  }

  if (suggestions.length === 0) {
    suggestions.push('写作风格一致性良好，请继续保持')
  }

  return suggestions
}
