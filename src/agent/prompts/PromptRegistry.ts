export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PromptInput {
  [key: string]: unknown;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  buildMessages: (input: PromptInput) => Array<{ role: string; content: string }>;
}

export class PromptRegistry {
  private prompts: Map<string, PromptTemplate> = new Map();

  register(template: PromptTemplate): () => void {
    this.prompts.set(template.id, template);
    return () => this.prompts.delete(template.id);
  }

  get(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  buildMessages(id: string, input: PromptInput): Array<{ role: string; content: string }> {
    const template = this.prompts.get(id);
    if (!template) throw new Error(`Prompt template not found: ${id}`);
    return template.buildMessages(input);
  }

  has(id: string): boolean {
    return this.prompts.has(id);
  }

  getAllIds(): string[] {
    return Array.from(this.prompts.keys());
  }
}
