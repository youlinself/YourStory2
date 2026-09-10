import type { ToolRegistry } from '../tools/ToolRegistry'
import type { SkillRegistry } from '../skills/SkillRegistry'
import type { PromptRegistry } from '../prompts/PromptRegistry'
import type { BusinessExtension } from './BusinessExtension'
import { registerNovelPrompts } from '../prompts/novel'

export class NovelExtension implements BusinessExtension {
  readonly businessType = 'novel'
  readonly businessName = '小说创作'

  async registerTools(registry: ToolRegistry): Promise<() => void> {
    const { registerNovelTools } = await import('../tools/novel')
    return registerNovelTools(registry)
  }

  async registerSkills(registry: SkillRegistry): Promise<() => void> {
    const { registerNovelSkills } = await import('../skills/novel')
    return registerNovelSkills(registry)
  }

  registerPrompts(registry: PromptRegistry): () => void {
    return registerNovelPrompts(registry)
  }
}
