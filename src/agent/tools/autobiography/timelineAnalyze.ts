import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

interface Chapter {
  id: string
  title: string
  content: string
  timeRange?: string
}

interface TimelineAnalyzeArgs {
  chapters: Chapter[]
  birthYear?: number
  currentYear?: number
}

interface TimePoint {
  chapterId: string
  title: string
  startYear: number
  endYear: number
  source: 'timeRange' | 'content'
}

interface TimeGap {
  startYear: number
  endYear: number
  duration: number
  suggestion: string
}

interface TimeConflict {
  chapterId1: string
  chapterId2: string
  description: string
  suggestion: string
}

interface TimelineAnalysis {
  timeline: TimePoint[]
  gaps: TimeGap[]
  conflicts: TimeConflict[]
  coverage: number
  suggestions: string[]
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '章节ID' },
          title: { type: 'string', description: '章节标题' },
          content: { type: 'string', description: '章节内容' },
          timeRange: { type: 'string', description: '时间范围' }
        },
        description: '章节信息'
      },
      description: '所有章节'
    },
    birthYear: { type: 'number', description: '出生年份' },
    currentYear: { type: 'number', description: '当前年份' }
  },
  required: ['chapters']
}

export const timelineAnalyzeTool: ToolDefinition = {
  name: 'timeline_analyze',
  description: '分析自传章节的时间线，检测缺失时段和时间冲突',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 20000,

  execute: async (args: TimelineAnalyzeArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { chapters, birthYear, currentYear = new Date().getFullYear() } = args

    if (!chapters || chapters.length === 0) {
      return { success: false, error: 'chapters cannot be empty' }
    }

    const analysis = analyzeTimeline(chapters, birthYear, currentYear)

    return {
      success: true,
      data: analysis
    }
  }
}

function analyzeTimeline(
  chapters: Chapter[],
  birthYear: number | undefined,
  currentYear: number
): TimelineAnalysis {
  const timePoints = extractTimePoints(chapters)
  const sortedPoints = sortTimePoints(timePoints)

  const gaps = findTimeGaps(sortedPoints, birthYear, currentYear)
  const conflicts = findTimeConflicts(sortedPoints)
  const coverage = calculateCoverage(sortedPoints, birthYear, currentYear)
  const suggestions = generateTimelineSuggestions(gaps, conflicts, coverage)

  return {
    timeline: sortedPoints,
    gaps,
    conflicts,
    coverage,
    suggestions
  }
}

function extractTimePoints(chapters: Chapter[]): TimePoint[] {
  const points: TimePoint[] = []

  for (const chapter of chapters) {
    const range = extractTimeRange(chapter)
    if (range) {
      points.push({
        chapterId: chapter.id,
        title: chapter.title,
        startYear: range.start,
        endYear: range.end,
        source: range.source
      })
    }
  }

  return points
}

function extractTimeRange(chapter: Chapter): { start: number; end: number; source: 'timeRange' | 'content' } | null {
  if (chapter.timeRange) {
    const range = parseTimeRange(chapter.timeRange)
    if (range) {
      return { ...range, source: 'timeRange' }
    }
  }

  if (chapter.content) {
    const range = extractYearsFromContent(chapter.content)
    if (range) {
      return { ...range, source: 'content' }
    }
  }

  return null
}

function parseTimeRange(timeRange: string): { start: number; end: number } | null {
  const patterns = [
    /(\d{4})\s*[-–]\s*(\d{4})/,
    /(\d{4})\s*年?\s*[-–]\s*(\d{4})\s*年?/,
    /(\d{4})\s*[-–]\s*至今/,
    /(\d{4})\s*[-–]\s*现在/
  ]

  for (const pattern of patterns) {
    const match = timeRange.match(pattern)
    if (match) {
      const start = parseInt(match[1], 10)
      const end = match[2] ? parseInt(match[2], 10) : new Date().getFullYear()
      return { start, end }
    }
  }

  const singleYear = timeRange.match(/(\d{4})/)
  if (singleYear) {
    const year = parseInt(singleYear[1], 10)
    return { start: year, end: year }
  }

  return null
}

function extractYearsFromContent(content: string): { start: number; end: number } | null {
  const yearPattern = /(\d{4})年?/g
  const years: number[] = []

  let match
  while ((match = yearPattern.exec(content)) !== null) {
    const year = parseInt(match[1], 10)
    if (year > 1900 && year < 2100) {
      years.push(year)
    }
  }

  if (years.length === 0) return null

  years.sort((a, b) => a - b)
  return {
    start: years[0],
    end: years[years.length - 1]
  }
}

function sortTimePoints(points: TimePoint[]): TimePoint[] {
  return [...points].sort((a, b) => a.startYear - b.startYear)
}

function findTimeGaps(
  points: TimePoint[],
  birthYear: number | undefined,
  currentYear: number
): TimeGap[] {
  const gaps: TimeGap[] = []

  if (points.length === 0) {
    if (birthYear) {
      gaps.push({
        startYear: birthYear,
        endYear: currentYear,
        duration: currentYear - birthYear,
        suggestion: '尚未记录任何时间段，建议从童年开始'
      })
    }
    return gaps
  }

  const effectiveStart = birthYear ?? points[0].startYear
  const effectiveEnd = currentYear

  if (points[0].startYear > effectiveStart) {
    const duration = points[0].startYear - effectiveStart
    if (duration > 2) {
      gaps.push({
        startYear: effectiveStart,
        endYear: points[0].startYear,
        duration,
        suggestion: `缺失${effectiveStart}年至${points[0].startYear}年的记录`
      })
    }
  }

  for (let i = 0; i < points.length - 1; i++) {
    const currentEnd = points[i].endYear
    const nextStart = points[i + 1].startYear
    const gap = nextStart - currentEnd

    if (gap > 2) {
      gaps.push({
        startYear: currentEnd,
        endYear: nextStart,
        duration: gap,
        suggestion: `缺失${currentEnd}年至${nextStart}年的记录，约${gap}年`
      })
    }
  }

  const lastPoint = points[points.length - 1]
  if (lastPoint.endYear < effectiveEnd) {
    const duration = effectiveEnd - lastPoint.endYear
    if (duration > 2) {
      gaps.push({
        startYear: lastPoint.endYear,
        endYear: effectiveEnd,
        duration,
        suggestion: `缺失${lastPoint.endYear}年至今的记录`
      })
    }
  }

  return gaps
}

function findTimeConflicts(points: TimePoint[]): TimeConflict[] {
  const conflicts: TimeConflict[] = []

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i]
      const b = points[j]

      if (hasOverlap(a, b)) {
        conflicts.push({
          chapterId1: a.chapterId,
          chapterId2: b.chapterId,
          description: `"${a.title}"(${a.startYear}-${a.endYear}) 与 "${b.title}"(${b.startYear}-${b.endYear}) 时间范围重叠`,
          suggestion: '建议检查时间范围设置，确保各章节时间不重叠'
        })
      }
    }
  }

  return conflicts
}

function hasOverlap(a: TimePoint, b: TimePoint): boolean {
  return a.startYear <= b.endYear && b.startYear <= a.endYear
}

function calculateCoverage(
  points: TimePoint[],
  birthYear: number | undefined,
  currentYear: number
): number {
  if (points.length === 0) {
    return birthYear ? 0 : 0
  }

  const effectiveStart = birthYear ?? points[0].startYear
  const effectiveEnd = currentYear
  const totalSpan = effectiveEnd - effectiveStart

  if (totalSpan <= 0) return 1

  const coveredSpans: Array<{ start: number; end: number }> = []

  for (const point of points) {
    const start = Math.max(point.startYear, effectiveStart)
    const end = Math.min(point.endYear, effectiveEnd)
    if (start < end) {
      coveredSpans.push({ start, end })
    }
  }

  if (coveredSpans.length === 0) return 0

  coveredSpans.sort((a, b) => a.start - b.start)

  let mergedEnd = coveredSpans[0].end
  let totalCovered = 0

  for (let i = 0; i < coveredSpans.length; i++) {
    const span = coveredSpans[i]
    if (span.start > mergedEnd) {
      totalCovered += mergedEnd - (i > 0 ? coveredSpans[i - 1].start : coveredSpans[0].start)
      mergedEnd = span.end
    } else {
      mergedEnd = Math.max(mergedEnd, span.end)
    }
  }

  totalCovered += mergedEnd - coveredSpans[0].start

  return Math.min(1, totalCovered / totalSpan)
}

function generateTimelineSuggestions(
  gaps: TimeGap[],
  conflicts: TimeConflict[],
  coverage: number
): string[] {
  const suggestions: string[] = []

  if (gaps.length > 0) {
    suggestions.push(`发现 ${gaps.length} 个时间段缺失，建议补充相关章节`)
  }

  if (conflicts.length > 0) {
    suggestions.push(`发现 ${conflicts.length} 个时间冲突，建议检查章节时间范围`)
  }

  if (coverage < 0.5) {
    suggestions.push(`时间覆盖率较低(${(coverage * 100).toFixed(0)}%)，建议补充更多时期的记录`)
  } else if (coverage < 0.8) {
    suggestions.push(`时间覆盖率为${(coverage * 100).toFixed(0)}%，可以考虑补充更多时期的记录`)
  } else {
    suggestions.push(`时间覆盖率良好(${(coverage * 100).toFixed(0)}%)`)
  }

  if (gaps.length > 0) {
    const longestGap = gaps.reduce((max, gap) => gap.duration > max.duration ? gap : max, gaps[0])
    if (longestGap) {
      suggestions.push(`最长的缺失时段为 ${longestGap.startYear}-${longestGap.endYear}（${longestGap.duration}年），建议优先补充`)
    }
  }

  return suggestions
}
