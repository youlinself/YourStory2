import type { Skill } from '../SkillTypes'
import type { SkillRegistry } from '../SkillRegistry'
import { writingAssistantSkill } from './WritingAssistant'
import { characterDesignSkill } from './CharacterDesign'

export const novelSkills: Skill[] = [
  writingAssistantSkill,
  characterDesignSkill
]

export function registerNovelSkills(registry: SkillRegistry): () => void {
  const disposers = novelSkills.map(skill => registry.register(skill))
  return () => disposers.forEach(d => d())
}

export { writingAssistantSkill } from './WritingAssistant'
export { characterDesignSkill } from './CharacterDesign'
