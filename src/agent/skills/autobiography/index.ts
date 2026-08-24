import type { Skill } from '../SkillTypes'
import type { SkillRegistry } from '../SkillRegistry'
import { deepInterviewSkill } from './DeepInterview'
import { timelineOrganizeSkill } from './TimelineOrganize'
import { styleCheckSkill } from './StyleCheck'
import { guidedQuestioningSkill } from './GuidedQuestioning'

export const autobiographySkills: Skill[] = [
  deepInterviewSkill,
  timelineOrganizeSkill,
  styleCheckSkill,
  guidedQuestioningSkill
]

export function registerAutobiographySkills(registry: SkillRegistry): () => void {
  const disposers = autobiographySkills.map(skill => registry.register(skill))
  return () => disposers.forEach(d => d())
}

export { deepInterviewSkill } from './DeepInterview'
export { timelineOrganizeSkill } from './TimelineOrganize'
export { styleCheckSkill } from './StyleCheck'
export { guidedQuestioningSkill } from './GuidedQuestioning'
