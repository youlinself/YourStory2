import type { ToolRegistry } from '../tools/ToolRegistry';
import type { SkillRegistry } from '../skills/SkillRegistry';
import type { PromptRegistry } from '../prompts/PromptRegistry';

export interface BusinessExtension {
  readonly businessType: string;
  readonly businessName: string;

  registerTools(registry: ToolRegistry): (() => void) | Promise<() => void>;

  registerSkills(registry: SkillRegistry): (() => void) | Promise<() => void>;

  registerPrompts(registry: PromptRegistry): () => void;
}
