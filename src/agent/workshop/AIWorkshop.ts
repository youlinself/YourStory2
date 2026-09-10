import type { ThinkTankMember, ThinkTankRolePreset } from '../../types/writing';
import type { Task, SubTask, WorkshopLog, WorkshopMember, TaskPlan, ExecutionResult } from './types';
import { TaskDispatcher } from './TaskDispatcher';
import { generateId } from '../../utils';
import { UnifiedLLMService } from '../llm/UnifiedLLMService';

export interface AIWorkshopConfig {
  onLog?: (log: WorkshopLog) => void;
  onTaskUpdate?: (task: Task) => void;
  onSubtaskUpdate?: (subtask: SubTask) => void;
  onComplete?: (task: Task) => void;
}

export class AIWorkshop {
  private dispatcher: TaskDispatcher;
  private members: ThinkTankMember[] = [];
  private rolePresets: ThinkTankRolePreset[] = [];
  private config: AIWorkshopConfig;
  private taskQueue: Task[] = [];
  private isProcessing = false;
  private abortController: AbortController | null = null;

  constructor(members: ThinkTankMember[], rolePresets: ThinkTankRolePreset[], config: AIWorkshopConfig = {}) {
    this.members = members;
    this.rolePresets = rolePresets;
    this.config = config;
    this.dispatcher = new TaskDispatcher(members);
  }

  updateMembers(members: ThinkTankMember[]): void {
    this.members = members;
    this.dispatcher.syncMembers(members);
  }

  getAvailableMembers(): WorkshopMember[] {
    return this.dispatcher.getAvailableMembers();
  }

  async submitTask(task: Task): Promise<boolean> {
    this.taskQueue.push(task);
    this.log(task.id, 'info', `任务「${task.title}」已提交到队列`);

    if (!this.isProcessing) {
      this.processQueue();
    }
    return true;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;
    this.abortController = new AbortController();

    while (this.taskQueue.length > 0 && !this.abortController.signal.aborted) {
      const task = this.taskQueue.shift()!;
      await this.executeTask(task);
    }

    this.isProcessing = false;
    this.abortController = null;
  }

  private async executeTask(task: Task): Promise<void> {
    task.status = 'analyzing';
    task.updatedAt = new Date().toISOString();
    this.config.onTaskUpdate?.(task);

    this.log(task.id, 'info', `开始分析任务「${task.title}」`);

    const dispatchResult = this.dispatcher.dispatch(task);

    if (!dispatchResult.success || !dispatchResult.plan) {
      task.status = 'failed';
      task.updatedAt = new Date().toISOString();
      this.config.onTaskUpdate?.(task);
      this.log(task.id, 'error', `任务分配失败：${dispatchResult.errors.join(', ')}`);
      return;
    }

    if (dispatchResult.warnings.length > 0) {
      for (const warning of dispatchResult.warnings) {
        this.log(task.id, 'warn', warning);
      }
    }

    if (dispatchResult.fallbackRoles.length > 0) {
      for (const fb of dispatchResult.fallbackRoles) {
        this.log(task.id, 'info', `将使用${this.getRoleName(fb.fallback)}替代${this.getRoleName(fb.original)}`);
      }
    }

    task.status = 'assigning';
    this.config.onTaskUpdate?.(task);
    this.log(task.id, 'success', dispatchResult.plan.analysis);

    const subtasks = this.createSubtasks(task, dispatchResult.plan);
    task.status = 'executing';
    this.config.onTaskUpdate?.(task);

    const results: ExecutionResult[] = [];

    for (const batch of dispatchResult.plan.executionOrder) {
      if (this.abortController?.signal.aborted) {
        task.status = 'failed';
        this.config.onTaskUpdate?.(task);
        this.log(task.id, 'warn', '任务被用户取消');
        return;
      }

      const batchPromises = batch.map(async (key) => {
        const subtaskIndex = this.parseSubtaskIndex(key);
        const subtask = subtasks[subtaskIndex];
        if (!subtask) return null;

        if (subtask.status === 'skipped') {
          return {
            subtaskId: subtask.id,
            success: true,
            result: `[跳过] ${subtask.skipReason || '无可用成员'}`,
            tokensUsed: 0,
          };
        }

        return this.executeSubtask(task, subtask);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r): r is ExecutionResult => r !== null));
    }

    task.status = 'reviewing';
    this.config.onTaskUpdate?.(task);
    this.log(task.id, 'info', '所有子任务执行完成，正在整合结果...');

    const successfulCount = results.filter((r) => r.success).length;
    const totalCount = results.length;
    const successRate = totalCount > 0 ? successfulCount / totalCount : 0;

    if (successfulCount === totalCount) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      this.log(task.id, 'success', `任务「${task.title}」已完成！`);
    } else if (successRate >= 0.5) {
      task.status = 'partially_completed';
      task.completedAt = new Date().toISOString();
      const failedCount = totalCount - successfulCount;
      this.log(task.id, 'warn', `任务「${task.title}」部分完成（${successfulCount}/${totalCount}），${failedCount} 个子任务失败或跳过`);
    } else {
      task.status = 'failed';
      const failedCount = totalCount - successfulCount;
      this.log(task.id, 'error', `任务「${task.title}」失败，${failedCount}/${totalCount} 个子任务执行失败`);
    }

    task.updatedAt = new Date().toISOString();
    this.config.onTaskUpdate?.(task);
    this.config.onComplete?.(task);
  }

  private createSubtasks(task: Task, plan: TaskPlan): SubTask[] {
    return plan.subtasks.map((sub) => {
      const member = sub.memberId ? this.members.find((m) => m.id === sub.memberId) : null;
      const memberName = member?.name || '未分配';
      const role = sub.role;

      const isSkipped = !sub.memberId;
      const isFallback = sub.isFallback;

      return {
        id: generateId(),
        taskId: task.id,
        memberId: sub.memberId || '',
        memberName,
        role,
        description: sub.description,
        status: isSkipped ? 'skipped' : 'pending',
        tokensUsed: 0,
        isFallback,
        skipReason: isSkipped ? `无${this.getRoleName(role)}可用` : undefined,
      };
    });
  }

  private parseSubtaskIndex(key: string): number {
    const parts = key.split('_');
    return parseInt(parts[parts.length - 1], 10);
  }

  private async executeSubtask(task: Task, subtask: SubTask): Promise<ExecutionResult> {
    subtask.status = 'executing';
    subtask.startedAt = new Date().toISOString();
    this.config.onSubtaskUpdate?.(subtask);

    const fallbackTag = subtask.isFallback ? '（替代执行）' : '';
    this.log(task.id, 'info', `「${subtask.memberName}」开始执行${fallbackTag}：${subtask.description}`, subtask.memberId);

    try {
      const member = this.members.find((m) => m.id === subtask.memberId);
      if (!member) {
        throw new Error('未找到对应的AI成员');
      }

      if (!member.config.apiKey) {
        throw new Error(`AI成员「${member.name}」未配置API Key，请在智囊团设置中配置`);
      }

      const llmService = new UnifiedLLMService({
        apiKey: member.config.apiKey,
        model: member.config.model,
        baseUrl: member.config.baseUrl,
        vendor: member.config.vendor,
        temperature: member.config.temperature,
        maxOutputTokens: member.config.maxOutputTokens ?? 2000,
        customModelName: member.config.customModelName,
      });

      const systemPrompt = this.buildSystemPrompt(subtask.role, member.name, subtask.isFallback);
      const userPrompt = this.buildUserPrompt(task, subtask);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const result = await llmService.sendCustomMessages(messages);

      subtask.status = 'completed';
      subtask.result = result;
      subtask.tokensUsed = Math.ceil(result.length / 2);
      subtask.completedAt = new Date().toISOString();
      this.config.onSubtaskUpdate?.(subtask);

      this.dispatcher.releaseMemberLoad(subtask.memberId);

      this.log(task.id, 'success', `「${subtask.memberName}」完成：${subtask.description}`, subtask.memberId);

      return {
        subtaskId: subtask.id,
        success: true,
        result,
        tokensUsed: subtask.tokensUsed,
      };
    } catch (error) {
      subtask.status = 'failed';
      subtask.error = error instanceof Error ? error.message : '执行失败';
      subtask.completedAt = new Date().toISOString();
      this.config.onSubtaskUpdate?.(subtask);

      this.dispatcher.releaseMemberLoad(subtask.memberId);

      this.log(task.id, 'error', `「${subtask.memberName}」执行失败：${subtask.error}`, subtask.memberId);

      return {
        subtaskId: subtask.id,
        success: false,
        error: subtask.error,
        tokensUsed: 0,
      };
    }
  }

  private buildSystemPrompt(role: ThinkTankMember['role'], memberName: string, isFallback?: boolean): string {
    const preset = this.rolePresets.find((p) => p.role === role);
    const basePrompt = preset?.defaultPrompt || '你是一位专业的创作助手。';

    const fallbackInstruction = isFallback
      ? '\n\n注意：你正在替代执行其他角色的任务，请尽力发挥你的专业能力完成。'
      : '';

    return `${basePrompt}

你的名字是「${memberName}」。
你正在一个AI创作工作室中工作，与其他AI专家协作完成创作任务。
请发挥你的专业能力，高质量完成分配给你的任务。

输出要求：
1. 使用中文回复
2. 内容要有创意和专业性
3. 结构清晰，便于后续整合${fallbackInstruction}`;
  }

  private buildUserPrompt(task: Task, subtask: SubTask): string {
    const fallbackNote = subtask.isFallback
      ? '\n\n[系统提示：你正在替代执行此角色的任务，请根据你的专业能力尽力完成]'
      : '';

    return `## 主任务：${task.title}

${task.description}

## 你的任务
${subtask.description}

## 上下文
- 任务类型：${task.category}
- 你的角色：${subtask.role}${fallbackNote}

请根据以上信息完成你的专业任务，输出高质量的内容。`;
  }

  private log(taskId: string, level: WorkshopLog['level'], message: string, memberId?: string): void {
    const log: WorkshopLog = {
      id: generateId(),
      taskId,
      timestamp: new Date().toISOString(),
      level,
      message,
      memberId,
    };
    this.config.onLog?.(log);
  }

  private getRoleName(role: string): string {
    const roleNames: Record<string, string> = {
      plot_writer: '情节写手',
      character_designer: '角色设计师',
      world_builder: '世界观架构师',
      dialogue_specialist: '对话专家',
      style_polisher: '文风润色师',
      creative_consultant: '创意顾问',
      custom: '自定义角色',
    };
    return roleNames[role] || role;
  }

  cancelCurrentTask(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  clearQueue(): void {
    this.taskQueue = [];
  }

  get isRunning(): boolean {
    return this.isProcessing;
  }

  get queueLength(): number {
    return this.taskQueue.length;
  }
}
