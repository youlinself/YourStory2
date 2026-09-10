import type { ToolDefinition } from '../ToolTypes'
import type { ToolRegistry } from '../ToolRegistry'
import { generateEventTool } from './generateEvent'
import { analyzeLifeTool } from './analyzeLife'

export const simulationTools: ToolDefinition[] = [
  generateEventTool,
  analyzeLifeTool
]

export function registerSimulationTools(registry: ToolRegistry): () => void {
  const disposers = simulationTools.map(tool => registry.register(tool))
  return () => disposers.forEach(d => d())
}

export { generateEventTool } from './generateEvent'
export { analyzeLifeTool } from './analyzeLife'
