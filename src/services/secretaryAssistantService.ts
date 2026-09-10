import { generateId } from '../utils';
import type { ThinkTankMember, ThinkTankRolePreset } from '../types/writing';
import { UnifiedLLMService, LLMServiceConfig } from '../agent/llm/UnifiedLLMService';

export interface SecretaryMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  options?: SecretaryOption[];
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
  isLoading?: boolean;
}

export interface SecretaryOption {
  id: string;
  label: string;
  description?: string;
  action: string;
  icon?: string;
  payload?: Record<string, unknown>;
}

export interface SecretarySkill {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<SkillResult>;
}

export interface SkillResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  askUser?: {
    question: string;
    options?: Array<{ label: string; value: string }>;
    allowCustomInput?: boolean;
    fieldName: string;
  };
}

export interface SecretaryContext {
  members: ThinkTankMember[];
  rolePresets: ThinkTankRolePreset[];
  llmConfig: LLMServiceConfig;
}

export interface SecretaryConfig {
  systemPrompt?: string;
  maxHistoryLength?: number;
}

type MessageHandler = (message: SecretaryMessage) => void;
type LoadingHandler = (isLoading: boolean) => void;

const DEFAULT_SYSTEM_PROMPT = `你是一位专业的秘书助手，负责辅助用户处理AI智囊团相关的各类事务。

## 你的能力
1. **招募员工** - 帮助用户创建和配置AI智囊团成员
2. **管理成员** - 查看、编辑、启用/禁用、移除现有成员
3. **整理文档** - 帮助用户管理和整理项目文档
4. **系统设置** - 协助配置系统级参数

## 可用角色类型
{{ROLE_PRESETS}}

## 工作方式
- 当用户提出需求时，优先使用合适的技能（skill）来完成任务
- 如果执行技能需要额外信息（如API Key、模型选择等），主动询问用户
- 询问时提供合适的选项，并允许用户自定义输入
- 操作完成后，清晰地告知用户结果

## 当前状态
- 现有成员数量：{{MEMBER_COUNT}}
- 可用角色预设：{{AVAILABLE_ROLES}}

## 输出要求
- 使用中文回复
- 简洁明了，不要过度解释
- 需要询问用户时，提供2-4个合适选项
- 操作成功后给出简要总结`;

export class SecretaryAssistantService {
  private messages: SecretaryMessage[] = [];
  private context: SecretaryContext;
  private config: SecretaryConfig;
  private llmService: UnifiedLLMService;
  private onMessage: MessageHandler;
  private onLoading: LoadingHandler;
  private skills: Map<string, SecretarySkill> = new Map();
  private pendingAction: { skill: string; params: Record<string, unknown> } | null = null;

  constructor(
    context: SecretaryContext,
    onMessage: MessageHandler,
    onLoading: LoadingHandler,
    config: SecretaryConfig = {}
  ) {
    this.context = context;
    this.config = {
      maxHistoryLength: 20,
      ...config,
    };
    this.onMessage = onMessage;
    this.onLoading = onLoading;
    this.llmService = new UnifiedLLMService(context.llmConfig);

    this.registerDefaultSkills();
  }

  updateContext(context: Partial<SecretaryContext>): void {
    this.context = { ...this.context, ...context };
    if (context.llmConfig) {
      this.llmService = new UnifiedLLMService(context.llmConfig);
    }
  }

  updateLLMConfig(config: Partial<LLMServiceConfig>): void {
    this.llmService.updateConfig(config);
  }

  private registerDefaultSkills(): void {
    this.registerSkill({
      name: 'create_member',
      description: '创建新的AI智囊团成员',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '成员名称' },
          role: { type: 'string', description: '成员角色类型' },
          description: { type: 'string', description: '成员描述（可选）' },
        },
        required: ['name', 'role'],
      },
      execute: async (params) => {
        return this.executeCreateMember(params);
      },
    });

    this.registerSkill({
      name: 'list_members',
      description: '列出所有AI智囊团成员',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        const members = this.context.members;
        if (members.length === 0) {
          return {
            success: true,
            message: '当前还没有AI智囊团成员。您需要我帮您招募新员工吗？',
            data: { members: [] },
          };
        }
        const memberList = members.map((m, idx) => {
          const preset = this.context.rolePresets.find((p) => p.role === m.role);
          const status = m.isEnabled ? '✅' : '⏸️';
          return `${idx + 1}. ${status} ${m.name} (${preset?.name || m.role})`;
        }).join('\n');
        return {
          success: true,
          message: `当前AI智囊团共有 ${members.length} 名成员：\n\n${memberList}`,
          data: { members },
        };
      },
    });

    this.registerSkill({
      name: 'update_member',
      description: '更新现有成员信息',
      parameters: {
        type: 'object',
        properties: {
          memberId: { type: 'string', description: '成员ID' },
          name: { type: 'string', description: '新的名称（可选）' },
          isEnabled: { type: 'boolean', description: '是否启用（可选）' },
        },
        required: ['memberId'],
      },
      execute: async (params) => {
        const member = this.context.members.find((m) => m.id === params.memberId);
        if (!member) {
          return { success: false, message: '未找到指定的成员' };
        }
        return {
          success: true,
          message: `已更新成员「${member.name}」的信息`,
          data: { memberId: params.memberId, updates: params },
        };
      },
    });

    this.registerSkill({
      name: 'delete_member',
      description: '移除AI智囊团成员',
      parameters: {
        type: 'object',
        properties: {
          memberId: { type: 'string', description: '要移除的成员ID' },
        },
        required: ['memberId'],
      },
      execute: async (params) => {
        const member = this.context.members.find((m) => m.id === params.memberId);
        if (!member) {
          return { success: false, message: '未找到指定的成员' };
        }
        return {
          success: true,
          message: `已移除成员「${member.name}」`,
          data: { memberId: params.memberId, memberName: member.name },
        };
      },
    });

    this.registerSkill({
      name: 'get_role_presets',
      description: '获取可用的角色预设列表',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        const presets = this.context.rolePresets;
        const presetList = presets
          .filter((p) => p.role !== 'custom')
          .map((p) => `- ${p.icon} **${p.name}**：${p.description}`)
          .join('\n');
        return {
          success: true,
          message: `可用的角色类型：\n\n${presetList}`,
          data: { presets },
        };
      },
    });
  }

  registerSkill(skill: SecretarySkill): void {
    this.skills.set(skill.name, skill);
  }

  private async executeCreateMember(params: Record<string, unknown>): Promise<SkillResult> {
    const { name, role, description } = params;

    if (!name || !role) {
      return {
        success: false,
        message: '创建成员需要名称和角色类型',
      };
    }

    const rolePresets = this.context.rolePresets.filter((p) => p.role !== 'custom');
    const preset = rolePresets.find((p) => p.role === role || p.name === role);

    if (!preset && role !== 'custom') {
      return {
        success: false,
        message: `未知的角色类型：${role}。可用的角色有：${rolePresets.map((p) => p.name).join('、')}`,
        askUser: {
          question: '请选择要创建的角色类型：',
          options: rolePresets.map((p) => ({ label: `${p.icon} ${p.name}`, value: p.role })),
          allowCustomInput: true,
          fieldName: 'role',
        },
      };
    }

    return {
      success: true,
      message: `准备创建成员「${name}」，角色为「${preset?.name || '自定义'}」`,
      data: {
        name,
        role: preset?.role || 'custom',
        description: description || '',
        preset,
      },
    };
  }

  private buildSystemPrompt(): string {
    const rolePresetsText = this.context.rolePresets
      .filter((p) => p.role !== 'custom')
      .map((p) => `- ${p.icon} **${p.name}**（${p.role}）：${p.description}`)
      .join('\n');

    const availableRoles = this.context.rolePresets
      .filter((p) => p.role !== 'custom')
      .map((p) => p.name)
      .join('、');

    return (this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT)
      .replace('{{ROLE_PRESETS}}', rolePresetsText)
      .replace('{{MEMBER_COUNT}}', String(this.context.members.length))
      .replace('{{AVAILABLE_ROLES}}', availableRoles);
  }

  private buildSkillsDescription(): string {
    return Array.from(this.skills.entries())
      .map(([name, skill]) => {
        const params = Object.entries(skill.parameters.properties)
          .map(([key, prop]) => `  - ${key} (${prop.type}): ${prop.description}`)
          .join('\n');
        return `**${name}**: ${skill.description}\n参数:\n${params}`;
      })
      .join('\n\n');
  }

  async startConversation(): Promise<void> {
    const welcomeMessage: SecretaryMessage = {
      id: generateId(),
      role: 'assistant',
      content: '您好！我是您的秘书助手 📋\n\n我可以帮您：\n• 招募和配置AI智囊团成员\n• 管理现有成员\n• 整理文档和系统设置\n\n请问有什么可以帮您的？',
      timestamp: new Date().toISOString(),
      allowCustomInput: true,
      customInputPlaceholder: '例如：帮我添加一个新成员...',
    };

    this.messages.push(welcomeMessage);
    this.onMessage(welcomeMessage);
  }

  async sendMessage(content: string): Promise<void> {
    const userMessage: SecretaryMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(userMessage);
    this.onMessage(userMessage);

    this.onLoading(true);

    try {
      await this.processUserMessage(content);
    } catch (error) {
      const errorMessage: SecretaryMessage = {
        id: generateId(),
        role: 'assistant',
        content: `抱歉，处理您的请求时出现了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString(),
        allowCustomInput: true,
      };
      this.messages.push(errorMessage);
      this.onMessage(errorMessage);
    } finally {
      this.onLoading(false);
    }
  }

  private async processUserMessage(_content: string): Promise<void> {
    const systemPrompt = this.buildSystemPrompt();
    const skillsDesc = this.buildSkillsDescription();

    const messages = [
      { role: 'system', content: `${systemPrompt}\n\n## 可用技能\n${skillsDesc}\n\n## 技能调用格式\n当需要调用技能时，请回复 JSON 格式：\n{"skill": "技能名", "params": {"参数名": "参数值"}}\n\n如果不需要调用技能，直接回复用户即可。` },
      ...this.getRecentMessages().map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await this.llmService.sendCustomMessages(messages);

    const skillCall = this.parseSkillCall(response);
    if (skillCall) {
      await this.executeSkill(skillCall.skill, skillCall.params);
    } else {
      const aiMessage: SecretaryMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        allowCustomInput: true,
        customInputPlaceholder: '请输入您的需求...',
      };
      this.messages.push(aiMessage);
      this.onMessage(aiMessage);
    }
  }

  private parseSkillCall(response: string): { skill: string; params: Record<string, unknown> } | null {
    const jsonMatch = response.match(/\{[\s\S]*"skill"[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.skill && this.skills.has(parsed.skill)) {
        return { skill: parsed.skill, params: parsed.params || {} };
      }
    } catch {
      return null;
    }
    return null;
  }

  private async executeSkill(skillName: string, params: Record<string, unknown>): Promise<void> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      const errorMessage: SecretaryMessage = {
        id: generateId(),
        role: 'assistant',
        content: `未找到技能：${skillName}`,
        timestamp: new Date().toISOString(),
        allowCustomInput: true,
      };
      this.messages.push(errorMessage);
      this.onMessage(errorMessage);
      return;
    }

    const result = await skill.execute(params);

    if (result.askUser) {
      this.pendingAction = { skill: skillName, params };
      const askMessage: SecretaryMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
        options: result.askUser.options?.map((opt, idx) => ({
          id: String(idx),
          label: opt.label,
          action: 'select_option',
          payload: { field: result.askUser!.fieldName, value: opt.value },
        })),
        allowCustomInput: result.askUser.allowCustomInput,
        customInputPlaceholder: '或者输入自定义值...',
      };
      this.messages.push(askMessage);
      this.onMessage(askMessage);
      return;
    }

    const resultMessage: SecretaryMessage = {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
      allowCustomInput: true,
    };
    this.messages.push(resultMessage);
    this.onMessage(resultMessage);
  }

  async handleOptionSelect(option: SecretaryOption, customValue?: string): Promise<void> {
    const value = customValue || option.payload?.value as string;

    if (option.action === 'select_option' && this.pendingAction) {
      const { skill, params } = this.pendingAction;
      const field = option.payload?.field as string;
      this.pendingAction = null;

      await this.executeSkill(skill, { ...params, [field]: value });
    } else {
      await this.sendMessage(value);
    }
  }

  private getRecentMessages(): SecretaryMessage[] {
    const maxLen = this.config.maxHistoryLength || 20;
    return this.messages.slice(-maxLen);
  }

  getMessages(): SecretaryMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
  }
}

export const createSecretaryAssistant = (
  context: SecretaryContext,
  onMessage: MessageHandler,
  onLoading: LoadingHandler,
  config?: SecretaryConfig
): SecretaryAssistantService => {
  return new SecretaryAssistantService(context, onMessage, onLoading, config);
};
