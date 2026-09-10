import type { Skill } from '../SkillTypes'
import type { SkillRegistry } from '../SkillRegistry'
import { eventGeneratorSkill } from './EventGenerator'

export const simulationSkills: Skill[] = [
  eventGeneratorSkill
]

export function registerSimulationSkills(registry: SkillRegistry): () => void {
  const disposers = simulationSkills.map(skill => registry.register(skill))
  return () => disposers.forEach(d => d())
}

export { eventGeneratorSkill } from './EventGenerator'
