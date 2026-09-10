import { SessionManager, type StorageAdapter } from './session';
import { ToolRegistry } from './tools';
import { EventEmitter, SessionLog, MemoryEventStore } from './events';
import { SkillRegistry } from './skills';
import { getLogger } from './logging';
import { TokenBudgetManager } from './optimization/TokenBudget';
import { ContextCompressor, type CompressionOptions } from './optimization/ContextCompressor';
import type { UnifiedLLMService } from './llm/UnifiedLLMService';
import { PromptRegistry } from './prompts/PromptRegistry';
import type { LLMMessage } from './prompts/PromptRegistry';
import type { StreamCallback } from './llm/UnifiedLLMService';
import type { SkillContext } from './skills/SkillTypes';
import type { AutobiographySession, SessionContext, ConversationTurn } from './session/types';
import type { ToolDefinition, ToolResult, ToolExecutionContext } from './tools/ToolTypes';
import { TurnController } from './turn';
import { AgentHandle } from './handle';
import { SubagentManager } from './subagent';
import { WorkflowEngine } from './workflow';
import { GoalManager } from './goal';
import { CapabilityRegistry } from './capability';
import { AgentError, ErrorCode, SessionError, ToolError } from './errors';

const logger = getLogger();

export interface AgentConfig {
  llmService?: UnifiedLLMService;
  storage: StorageAdapter;
  promptRegistry?: PromptRegistry;
  contextCompression?: CompressionOptions;
}

export interface SendMessageOptions {
  generateFollowUpQuestions?: boolean;
  autoExtract?: boolean;
}

export interface SendMessageResult {
  extractedContent?: ToolResult;
  followUpQuestions?: ToolResult;
  response: string;
}

export class Agent {
  readonly sessionManager: SessionManager;
  readonly toolRegistry: ToolRegistry;
  readonly skillRegistry: SkillRegistry;
  readonly events: EventEmitter;
  readonly tokenBudgetManager: TokenBudgetManager;
  readonly contextCompressor: ContextCompressor | null;
  readonly turnController: TurnController;
  readonly subagentManager: SubagentManager;
  readonly workflowEngine: WorkflowEngine;
  readonly goalManager: GoalManager;
  readonly capabilityRegistry: CapabilityRegistry;
  readonly promptRegistry: PromptRegistry;

  private llmService: UnifiedLLMService | null = null;
  private sessionQueues: Map<string, Promise<void>> = new Map();
  private sessionLogs: Map<string, SessionLog> = new Map();
  private agentHandles: Map<string, AgentHandle> = new Map();
  private eventStore: MemoryEventStore;

  private static defaultPromptRegistry: PromptRegistry | null = null;
  private static defaultLLMService: UnifiedLLMService | null = null;

  static setDefaultPromptRegistry(registry: PromptRegistry): void {
    Agent.defaultPromptRegistry = registry;
  }

  static setDefaultLLMService(service: UnifiedLLMService): void {
    Agent.defaultLLMService = service;
  }

  constructor(config: AgentConfig) {
    this.eventStore = new MemoryEventStore();
    const sessionLog = new SessionLog();
    this.sessionManager = new SessionManager(config.storage);
    this.toolRegistry = new ToolRegistry();
    this.events = new EventEmitter(sessionLog, this.eventStore);
    this.skillRegistry = new SkillRegistry(this.toolRegistry, this.events);
    this.tokenBudgetManager = new TokenBudgetManager();
    this.llmService = config.llmService || Agent.defaultLLMService;
    this.promptRegistry = config.promptRegistry || Agent.defaultPromptRegistry || new PromptRegistry();
    this.turnController = new TurnController();
    this.subagentManager = new SubagentManager();
    this.workflowEngine = new WorkflowEngine();
    this.goalManager = new GoalManager();
    this.capabilityRegistry = new CapabilityRegistry();
    this.contextCompressor = null;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on('session/created', ({ sessionId, chapterId }) => {
      logger.info('Agent', 'Session created', { sessionId, chapterId });
    });

    this.events.on('session/paused', ({ sessionId }) => {
      logger.info('Agent', 'Session paused', { sessionId });
    });

    this.events.on('session/closed', ({ sessionId }) => {
      logger.info('Agent', 'Session closed', { sessionId });
      this.skillRegistry.cleanupSession(sessionId);
      this.toolRegistry.cleanupSession(sessionId);
    });

    this.events.on('tool/failed', ({ sessionId, tool, error }) => {
      logger.error('Agent', `Tool failed: ${tool}`, error, { sessionId });
    });

    this.events.on('session/closed', ({ sessionId }) => {
      this.tokenBudgetManager.cleanup(sessionId);
    });
  }

  getSessionLog(sessionId: string): SessionLog {
    let log = this.sessionLogs.get(sessionId);
    if (!log) {
      log = new SessionLog();
      this.sessionLogs.set(sessionId, log);
    }
    return log;
  }

  getHandle(sessionId: string): AgentHandle | undefined {
    return this.agentHandles.get(sessionId);
  }

  private createHandle(sessionId: string, session: AutobiographySession): AgentHandle {
    let handle = this.agentHandles.get(sessionId);
    if (!handle) {
      handle = new AgentHandle(sessionId, session);
      this.agentHandles.set(sessionId, handle);
    }
    return handle;
  }

  checkTokenBudget(sessionId: string): { canProceed: boolean; remaining: number } {
    const remaining = this.tokenBudgetManager.getRemaining(sessionId);
    const stats = this.tokenBudgetManager.getStats(sessionId);
    const canProceed = stats ? remaining > 1000 : true;
    return { canProceed, remaining };
  }

  recordTokenUsage(sessionId: string, tokens: number): void {
    this.tokenBudgetManager.recordUsage(sessionId, tokens);
    const stats = this.tokenBudgetManager.getStats(sessionId);
    if (stats) {
      logger.debug('Agent', 'Token usage recorded', { sessionId, tokens, totalUsed: stats.used });
    }
  }

  async createSession(businessId: string | null, context: SessionContext): Promise<AutobiographySession> {
    const session = await this.sessionManager.create(businessId, context);
    this.tokenBudgetManager.initSession(session.id);
    this.events.emit('session/created', { sessionId: session.id, chapterId: businessId });
    this.createHandle(session.id, session);
    return session;
  }

  async resumeSession(sessionId: string): Promise<AutobiographySession | null> {
    const session = await this.sessionManager.resume(sessionId);
    if (session) {
      this.events.emit('session/resumed', { sessionId });
      this.createHandle(sessionId, session);
    }
    return session;
  }

  async pauseSession(sessionId: string): Promise<void> {
    await this.sessionManager.pause(sessionId);
    this.events.emit('session/paused', { sessionId });
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.sessionManager.close(sessionId);
    this.events.emit('session/closed', { sessionId });
    this.agentHandles.delete(sessionId);
    this.sessionLogs.delete(sessionId);
  }

  registerTool(tool: ToolDefinition): () => void {
    return this.toolRegistry.register(tool);
  }

  registerTools(tools: ToolDefinition[]): () => void {
    return this.toolRegistry.registerAll(tools);
  }

  activateTools(sessionId: string, toolNames: string[]): void {
    this.toolRegistry.activateForSession(sessionId, toolNames);
  }

  deactivateTools(sessionId: string, toolNames: string[]): void {
    this.toolRegistry.deactivateForSession(sessionId, toolNames);
  }

  async activateSkill(sessionId: string, skillName: string): Promise<void> {
    const session = await this.sessionManager.resume(sessionId);
    if (!session) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false,
      });
    }

    const context: SkillContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      agent: this as any,
    };

    await this.skillRegistry.activate(sessionId, skillName, context);
  }

  async deactivateSkill(sessionId: string, skillName: string): Promise<void> {
    await this.skillRegistry.deactivate(sessionId, skillName);
  }

  getActiveSkills(sessionId: string): string[] {
    return this.skillRegistry.getActiveSkills(sessionId).map(as => as.skill.name);
  }

  async executeTool(
    sessionId: string,
    toolName: string,
    args: unknown,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      throw new ToolError(ErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, {
        toolName,
        recoverable: false,
      });
    }

    if (!this.toolRegistry.isAvailable(sessionId, toolName)) {
      throw new ToolError(ErrorCode.TOOL_NOT_AVAILABLE, `Tool not available for session: ${toolName}`, {
        sessionId,
        toolName,
        recoverable: true,
      });
    }

    const session = await this.sessionManager.resume(sessionId);
    if (!session) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false,
      });
    }

    const context: ToolExecutionContext = {
      sessionId,
      chapterId: session.chapterId,
      sessionContext: session.context,
      signal: signal || new AbortController().signal,
    };

    this.events.emit('tool/called', { sessionId, tool: toolName, args });

    try {
      const result = await tool.execute(args, context);
      this.events.emit('tool/completed', { sessionId, tool: toolName, result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const toolError = new ToolError(ErrorCode.TOOL_EXECUTION_FAILED, `Tool execution failed: ${toolName}`, {
        sessionId,
        toolName,
        recoverable: true,
        cause: err,
      });
      logger.error('Agent', `Tool execution failed: ${toolName}`, toolError, { sessionId });
      this.events.emit('tool/failed', { sessionId, tool: toolName, error: toolError });
      throw toolError;
    }
  }

  async callLLM(messages: LLMMessage[], callOptions?: { maxTokens?: number; temperature?: number }): Promise<string> {
    if (!this.llmService) {
      throw new AgentError(ErrorCode.AI_SERVICE_NOT_CONFIGURED, 'LLM service not configured', {
        recoverable: false,
      });
    }
    return this.llmService.sendRequest(messages as Array<{ role: string; content: string }>, callOptions);
  }

  async streamLLM(
    messages: LLMMessage[],
    callback: StreamCallback,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<void> {
    if (!this.llmService) {
      throw new AgentError(ErrorCode.AI_SERVICE_NOT_CONFIGURED, 'LLM service not configured', {
        recoverable: false,
      });
    }
    return this.llmService.streamRequest(messages as Array<{ role: string; content: string }>, callback, options);
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
    options?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    const existingQueue = this.sessionQueues.get(sessionId) || Promise.resolve();

    const newQueue = existingQueue.then(() => this._handleMessageInternal(sessionId, userMessage, options));

    this.sessionQueues.set(
      sessionId,
      newQueue.then(() => {}).catch(() => {}),
    );

    try {
      return await newQueue;
    } finally {
      if (this.sessionQueues.get(sessionId) === newQueue.then(() => {}).catch(() => {})) {
        this.sessionQueues.delete(sessionId);
      }
    }
  }

  async handleMessage(
    sessionId: string,
    userMessage: string,
    options?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    return this.sendMessage(sessionId, userMessage, options);
  }

  private async _handleMessageInternal(
    sessionId: string,
    userMessage: string,
    _options?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    const session = await this.sessionManager.resume(sessionId);
    if (!session) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, {
        sessionId,
        recoverable: false,
      });
    }

    const tokenCheck = this.checkTokenBudget(sessionId);
    if (!tokenCheck.canProceed) {
      throw new AgentError(ErrorCode.TOKEN_BUDGET_EXCEEDED, `Token budget exceeded. Remaining: ${tokenCheck.remaining}`, {
        sessionId,
        recoverable: false,
      });
    }

    const userTurn: ConversationTurn = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    await this.sessionManager.addTurn(sessionId, userTurn);

    const inputTokens = this.tokenBudgetManager.estimateTokens(userMessage);
    this.recordTokenUsage(sessionId, inputTokens);

    this.turnController.startTurn();
    this.events.emit('turn/start', { sessionId, userMessage });

    const result: SendMessageResult = {
      response: '',
    };

    try {
      const conversationHistory = session.history
        .slice(-10)
        .map((turn) => ({
          role: (turn.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: turn.content,
        }));

      const messages = [
        { role: 'system', content: '你是一位智能创作助手。' },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      if (!this.llmService) {
        throw new AgentError(ErrorCode.AI_SERVICE_NOT_CONFIGURED, 'LLM service not configured', {
          sessionId,
          recoverable: false,
        });
      }
      const aiResponse = await this.llmService.sendRequest(messages);
      result.response = aiResponse;

      const responseTokens = this.tokenBudgetManager.estimateTokens(aiResponse);
      this.recordTokenUsage(sessionId, responseTokens);

      const assistantTurn: ConversationTurn = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      await this.sessionManager.addTurn(sessionId, assistantTurn);
      this.turnController.endStep('model_done');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const agentError = new AgentError(ErrorCode.AI_GENERATION_FAILED, 'AI生成回复失败', {
        sessionId,
        recoverable: true,
        cause: err,
      });
      logger.error('Agent', 'AI generation failed', agentError, { sessionId });
      this.events.emit('turn/error', { sessionId, error: agentError });
      result.response = '抱歉，AI服务暂时不可用，请检查AI配置后重试。';
      this.turnController.endStep('interrupted');
    }

    this.turnController.endTurn('completed');

    const handle = this.agentHandles.get(sessionId);
    if (handle) {
      handle.setLastResponse(result.response);
    }

    this.events.emit('turn/complete', {
      sessionId,
      assistantResponse: result.response,
      tokensUsed: 0,
    });

    return result;
  }

  async addConversationTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    await this.sessionManager.addTurn(sessionId, turn);
  }

  getSession(sessionId: string): AutobiographySession | undefined {
    return this.sessionManager.get(sessionId);
  }

  getActiveSessions(): AutobiographySession[] {
    return this.sessionManager.getActiveSessions();
  }

  async cleanupSessions(maxAgeMs?: number): Promise<number> {
    return this.sessionManager.cleanup(maxAgeMs);
  }

  dispose(): void {
    this.events.removeAllListeners();
    this.subagentManager.cleanupAll();
    this.agentHandles.clear();
    this.sessionLogs.clear();
  }
}
