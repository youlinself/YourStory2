import type { ToolRegistry } from '../tools/ToolRegistry';
import type { SkillRegistry } from '../skills/SkillRegistry';
import type { PromptRegistry } from '../prompts/PromptRegistry';
import type { BusinessExtension } from './BusinessExtension';
import { registerAutobiographyPrompts } from '../prompts/autobiography';

export class AutobiographyExtension implements BusinessExtension {
  readonly businessType = 'autobiography';
  readonly businessName = '自传创作';

  async registerTools(registry: ToolRegistry): Promise<() => void> {
    const { registerAutobiographyTools } = await import('../tools/autobiography');
    return registerAutobiographyTools(registry);
  }

  async registerSkills(registry: SkillRegistry): Promise<() => void> {
    const { registerAutobiographySkills } = await import('../skills/autobiography');
    return registerAutobiographySkills(registry);
  }

  registerPrompts(registry: PromptRegistry): () => void {
    return registerAutobiographyPrompts(registry);
  }
}
