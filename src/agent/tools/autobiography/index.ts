import type { ToolDefinition } from '../ToolTypes'
import type { ToolRegistry } from '../ToolRegistry'
import { extractContentTool } from './extractContent'
import { mergeDraftTool } from './mergeDraft'
import { generateQuestionsTool } from './generateQuestions'
import { checkConsistencyTool } from './checkConsistency'
import { timelineAnalyzeTool } from './timelineAnalyze'

export const autobiographyTools: ToolDefinition[] = [
  extractContentTool,
  mergeDraftTool,
  generateQuestionsTool,
  checkConsistencyTool,
  timelineAnalyzeTool
]

export function registerAutobiographyTools(registry: ToolRegistry): () => void {
  const disposers = autobiographyTools.map(tool => registry.register(tool))
  return () => disposers.forEach(d => d())
}

export { extractContentTool } from './extractContent'
export { mergeDraftTool } from './mergeDraft'
export { generateQuestionsTool } from './generateQuestions'
export { checkConsistencyTool } from './checkConsistency'
export { timelineAnalyzeTool } from './timelineAnalyze'
