import type { ToolDefinition } from '../ToolTypes'
import type { ToolRegistry } from '../ToolRegistry'
import { continueNovelTool } from './continueNovel'
import { polishTextTool } from './polishText'
import { generateCharacterTool } from './generateCharacter'
import { generateWorldBuildingTool } from './generateWorldBuilding'
import { generatePlotSuggestionTool } from './generatePlotSuggestion'

export const novelTools: ToolDefinition[] = [
  continueNovelTool,
  polishTextTool,
  generateCharacterTool,
  generateWorldBuildingTool,
  generatePlotSuggestionTool
]

export function registerNovelTools(registry: ToolRegistry): () => void {
  const disposers = novelTools.map(tool => registry.register(tool))
  return () => disposers.forEach(d => d())
}

export { continueNovelTool } from './continueNovel'
export { polishTextTool } from './polishText'
export { generateCharacterTool } from './generateCharacter'
export { generateWorldBuildingTool } from './generateWorldBuilding'
export { generatePlotSuggestionTool } from './generatePlotSuggestion'
