import type { ToolRegistry } from '../tools/ToolRegistry'
import type { SkillRegistry } from '../skills/SkillRegistry'
import type { PromptRegistry } from '../prompts/PromptRegistry'
import type { BusinessExtension } from './BusinessExtension'
import { registerSimulationPrompts } from '../prompts/simulation'

export class SimulationExtension implements BusinessExtension {
  readonly businessType = 'simulation'
  readonly businessName = '模拟人生'

  async registerTools(registry: ToolRegistry): Promise<() => void> {
    const { registerSimulationTools } = await import('../tools/simulation')
    return registerSimulationTools(registry)
  }

  async registerSkills(registry: SkillRegistry): Promise<() => void> {
    const { registerSimulationSkills } = await import('../skills/simulation')
    return registerSimulationSkills(registry)
  }

  registerPrompts(registry: PromptRegistry): () => void {
    return registerSimulationPrompts(registry)
  }
}
