import { Agent } from './Agent';
import type { UnifiedLLMService } from './llm/UnifiedLLMService';
import type { BusinessExtension } from './extensions/BusinessExtension';
import type { PromptRegistry } from './prompts/PromptRegistry';
import { PromptRegistry as PromptRegistryImpl } from './prompts/PromptRegistry';
import { LocalStorageStorageAdapter } from './session/SessionManager';
import { BusinessStorageAdapter } from './storage/BusinessStorageAdapter';
import type { StorageAdapter } from './session/SessionManager';
import type { CompressionOptions } from './optimization/ContextCompressor';
import {
  AutobiographyExtension,
  NovelExtension,
  SimulationExtension,
} from './extensions';

export interface AgentFactoryConfig {
  llmService: UnifiedLLMService;
}

export interface CreateAgentOptions {
  businessType: string;
  storage?: StorageAdapter;
  contextCompression?: CompressionOptions;
}

export class AgentFactory {
  private llmService: UnifiedLLMService;
  private extensions: Map<string, BusinessExtension> = new Map();
  private promptRegistries: Map<string, PromptRegistry> = new Map();

  constructor(config: AgentFactoryConfig) {
    this.llmService = config.llmService;

    this.registerExtension(new AutobiographyExtension());
    this.registerExtension(new NovelExtension());
    this.registerExtension(new SimulationExtension());
  }

  registerExtension(extension: BusinessExtension): () => void {
    this.extensions.set(extension.businessType, extension);
    return () => this.extensions.delete(extension.businessType);
  }

  async createAgent(config: CreateAgentOptions): Promise<Agent> {
    const extension = this.extensions.get(config.businessType);
    if (!extension) {
      throw new Error(`Business extension not found: ${config.businessType}`);
    }

    const storage = config.storage || new BusinessStorageAdapter({
      businessType: config.businessType,
      storage: new LocalStorageStorageAdapter(),
    });

    let promptRegistry = this.promptRegistries.get(config.businessType);
    if (!promptRegistry) {
      promptRegistry = new PromptRegistryImpl();
      this.promptRegistries.set(config.businessType, promptRegistry);
    }

    const agent: Agent = new Agent({
      llmService: this.llmService,
      storage,
      promptRegistry,
      contextCompression: config.contextCompression,
    });

    await extension.registerTools(agent.toolRegistry);
    await extension.registerSkills(agent.skillRegistry);
    extension.registerPrompts(agent.promptRegistry);

    return agent;
  }

  getRegisteredBusinessTypes(): string[] {
    return Array.from(this.extensions.keys());
  }

  getPromptRegistry(businessType: string): PromptRegistry | undefined {
    return this.promptRegistries.get(businessType);
  }
}
