import type { ThinkTankMember, ThinkTankRole } from '../../types/writing';
import type { Task, TaskPlan, TaskRequirement, WorkshopMember, TaskDispatchResult } from './types';
import { ROLE_FALLBACK_MAP } from './types';

interface AssignmentResult {
  assignment: Map<string, string>;
  fallbackRoles: Array<{ original: ThinkTankRole; fallback: ThinkTankRole }>;
  skippedRoles: ThinkTankRole[];
  warnings: string[];
}

export class TaskDispatcher {
  private members: Map<string, WorkshopMember> = new Map();

  constructor(members: ThinkTankMember[] = []) {
    this.syncMembers(members);
  }

  syncMembers(members: ThinkTankMember[]): void {
    const enabledMembers = members.filter((m) => m.isEnabled && m.config.apiKey);
    this.members.clear();
    enabledMembers.forEach((m) => {
      this.members.set(m.id, {
        ...m,
        currentLoad: 0,
        maxLoad: 3,
        completedTasks: 0,
        isAvailable: true,
      });
    });
  }

  analyzeTask(task: Task): TaskRequirement[] {
    const requirements: TaskRequirement[] = [];

    switch (task.category) {
      case 'plot':
        requirements.push({
          role: 'plot_writer',
          description: '构思核心情节和故事走向',
          estimatedTokens: 1500,
        });
        requirements.push({
          role: 'creative_consultant',
          description: '提供创意建议和情节优化',
          estimatedTokens: 800,
          dependencies: [requirements[0]?.role || ''],
        });
        break;

      case 'character':
        requirements.push({
          role: 'character_designer',
          description: '设计角色形象和性格特征',
          estimatedTokens: 1200,
        });
        requirements.push({
          role: 'creative_consultant',
          description: '提供角色关系建议',
          estimatedTokens: 600,
        });
        break;

      case 'worldbuilding':
        requirements.push({
          role: 'world_builder',
          description: '构建世界观和背景设定',
          estimatedTokens: 2000,
        });
        break;

      case 'dialogue':
        requirements.push({
          role: 'dialogue_specialist',
          description: '设计人物对话',
          estimatedTokens: 1000,
        });
        break;

      case 'polish':
        requirements.push({
          role: 'style_polisher',
          description: '润色文字和优化文风',
          estimatedTokens: 800,
        });
        break;

      case 'brainstorm':
        requirements.push({
          role: 'creative_consultant',
          description: '主导创意头脑风暴',
          estimatedTokens: 1500,
        });
        requirements.push({
          role: 'plot_writer',
          description: '提供情节方向建议',
          estimatedTokens: 800,
        });
        requirements.push({
          role: 'character_designer',
          description: '提供角色创意',
          estimatedTokens: 800,
        });
        break;

      case 'full_project':
        requirements.push({
          role: 'creative_consultant',
          description: '分析项目需求，制定创作方向',
          estimatedTokens: 1000,
        });
        requirements.push({
          role: 'world_builder',
          description: '构建故事世界观',
          estimatedTokens: 1500,
          dependencies: ['creative_consultant'],
        });
        requirements.push({
          role: 'character_designer',
          description: '设计主要角色',
          estimatedTokens: 1200,
          dependencies: ['creative_consultant'],
        });
        requirements.push({
          role: 'plot_writer',
          description: '构思故事情节',
          estimatedTokens: 1500,
          dependencies: ['world_builder', 'character_designer'],
        });
        requirements.push({
          role: 'dialogue_specialist',
          description: '设计关键场景对话',
          estimatedTokens: 1000,
          dependencies: ['plot_writer', 'character_designer'],
        });
        requirements.push({
          role: 'style_polisher',
          description: '统一文风和润色',
          estimatedTokens: 800,
          dependencies: ['plot_writer', 'dialogue_specialist'],
        });
        break;
    }

    return requirements;
  }

  assignMembers(requirements: TaskRequirement[]): AssignmentResult {
    const assignment = new Map<string, string>();
    const roleCount = new Map<ThinkTankRole, number>();
    const fallbackRoles: Array<{ original: ThinkTankRole; fallback: ThinkTankRole }> = [];
    const skippedRoles: ThinkTankRole[] = [];
    const warnings: string[] = [];

    for (const req of requirements) {
      const currentCount = roleCount.get(req.role) || 0;
      roleCount.set(req.role, currentCount + 1);

      const candidate = this.findBestCandidate(req.role, assignment);
      if (candidate) {
        const key = `${req.role}_${currentCount}`;
        assignment.set(key, candidate.id);
        const member = this.members.get(candidate.id);
        if (member) {
          member.currentLoad++;
          if (candidate.role !== req.role) {
            fallbackRoles.push({ original: req.role, fallback: candidate.role });
            warnings.push(
              `角色「${this.getRoleName(req.role)}」缺失，使用「${candidate.name}」（${this.getRoleName(candidate.role)}）替代`
            );
          }
        }
      } else {
        skippedRoles.push(req.role);
        warnings.push(
          `角色「${this.getRoleName(req.role)}」无可用成员，该步骤将被跳过`
        );
      }
    }

    return { assignment, fallbackRoles, skippedRoles, warnings };
  }

  private findBestCandidate(
    role: ThinkTankRole,
    currentAssignment: Map<string, string>
  ): WorkshopMember | null {
    const assignedIds = new Set(currentAssignment.values());

    let candidates = this.getAvailableCandidates(role, assignedIds);

    if (candidates.length === 0) {
      const fallbackRoles = ROLE_FALLBACK_MAP[role] || [];
      for (const fallbackRole of fallbackRoles) {
        candidates = this.getAvailableCandidates(fallbackRole, assignedIds);
        if (candidates.length > 0) {
          break;
        }
      }
    }

    if (candidates.length === 0) {
      const anyCandidates = Array.from(this.members.values()).filter((m) => {
        if (assignedIds.has(m.id)) return false;
        if (!m.isAvailable) return false;
        if (m.currentLoad >= m.maxLoad) return false;
        return m.role === 'custom';
      });
      if (anyCandidates.length > 0) {
        candidates = anyCandidates;
      }
    }

    candidates.sort((a, b) => {
      if (a.role === role && b.role !== role) return -1;
      if (a.role !== role && b.role === role) return 1;
      return a.currentLoad - b.currentLoad;
    });

    return candidates[0] || null;
  }

  private getAvailableCandidates(role: ThinkTankRole, assignedIds: Set<string>): WorkshopMember[] {
    return Array.from(this.members.values()).filter((m) => {
      if (assignedIds.has(m.id)) return false;
      if (!m.isAvailable) return false;
      if (m.currentLoad >= m.maxLoad) return false;
      return m.role === role;
    });
  }

  createExecutionPlan(requirements: TaskRequirement[], assignment: Map<string, string>): string[][] {
    const plan: string[][] = [];
    const completed = new Set<string>();
    const remaining = new Set(requirements.map((_, i) => i));
    const assignedKeys = new Set(assignment.keys());

    while (remaining.size > 0) {
      const batch: string[] = [];

      for (const idx of remaining) {
        const req = requirements[idx];
        const key = `${req.role}_${idx}`;

        if (!assignedKeys.has(key)) {
          remaining.delete(idx);
          continue;
        }

        const deps = req.dependencies || [];
        const allDepsMet = deps.every((d) => completed.has(d));

        if (allDepsMet) {
          batch.push(key);
          completed.add(req.role);
          remaining.delete(idx);
        }
      }

      if (batch.length === 0) {
        const idx = remaining.values().next().value;
        if (idx !== undefined) {
          const req = requirements[idx];
          const key = `${req.role}_${idx}`;
          if (assignedKeys.has(key)) {
            batch.push(key);
            completed.add(req.role);
          }
          remaining.delete(idx);
        }
      }

      if (batch.length > 0) {
        plan.push(batch);
      }
    }

    return plan;
  }

  dispatch(task: Task): TaskDispatchResult {
    const errors: string[] = [];
    const assignedMembers: string[] = [];

    try {
      const requirements = this.analyzeTask(task);

      if (requirements.length === 0) {
        return {
          success: false,
          plan: null,
          assignedMembers: [],
          errors: ['无法分析任务需求'],
          warnings: [],
          fallbackRoles: [],
          skippedRoles: [],
        };
      }

      const { assignment, fallbackRoles, skippedRoles, warnings } = this.assignMembers(requirements);

      if (assignment.size === 0) {
        return {
          success: false,
          plan: null,
          assignedMembers: [],
          errors: ['没有可用的AI成员来执行此任务，请确保智囊团中有已启用的成员'],
          warnings: [],
          fallbackRoles: [],
          skippedRoles: [],
        };
      }

      const executionOrder = this.createExecutionPlan(requirements, assignment);

      let totalTokens = 0;
      const subtasks = requirements.map((req, idx) => {
        const key = `${req.role}_${idx}`;
        const memberId = assignment.get(key);
        const member = memberId ? this.members.get(memberId) : null;
        totalTokens += req.estimatedTokens;

        if (member) {
          assignedMembers.push(memberId!);
        }

        const isFallback = fallbackRoles.some((f) => f.original === req.role);

        return {
          role: req.role,
          description: req.description,
          memberId: memberId,
          dependencies: req.dependencies || [],
          estimatedTokens: req.estimatedTokens,
          isFallback,
        };
      });

      const plan: TaskPlan = {
        taskId: task.id,
        analysis: this.generateTaskAnalysis(task, requirements, skippedRoles),
        subtasks,
        executionOrder,
        estimatedTotalTokens: totalTokens,
      };

      return {
        success: true,
        plan,
        assignedMembers: [...new Set(assignedMembers)],
        errors,
        warnings,
        fallbackRoles,
        skippedRoles,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : '任务分配失败');
      return {
        success: false,
        plan: null,
        assignedMembers: [],
        errors,
        warnings: [],
        fallbackRoles: [],
        skippedRoles: [],
      };
    }
  }

  private generateTaskAnalysis(
    task: Task,
    requirements: TaskRequirement[],
    skippedRoles: ThinkTankRole[]
  ): string {
    const roleNames: Record<ThinkTankRole, string> = {
      plot_writer: '情节写手',
      character_designer: '角色设计师',
      world_builder: '世界观架构师',
      dialogue_specialist: '对话专家',
      style_polisher: '文风润色师',
      creative_consultant: '创意顾问',
      custom: '自定义角色',
    };

    const roleList = requirements.map((r) => roleNames[r.role]).join('、');
    const totalTokens = requirements.reduce((sum, r) => sum + r.estimatedTokens, 0);

    let analysis = `任务「${task.title}」已分析完成，需要 ${requirements.length} 个步骤，涉及角色：${roleList}。预计总Token消耗：${totalTokens}`;

    if (skippedRoles.length > 0) {
      const skippedNames = skippedRoles.map((r) => roleNames[r]).join('、');
      analysis += `\n⚠️ 以下角色缺失，对应步骤将被跳过：${skippedNames}`;
    }

    return analysis;
  }

  private getRoleName(role: ThinkTankRole): string {
    const roleNames: Record<ThinkTankRole, string> = {
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

  releaseMemberLoad(memberId: string): void {
    const member = this.members.get(memberId);
    if (member && member.currentLoad > 0) {
      member.currentLoad--;
      member.completedTasks++;
    }
  }

  getAvailableMembers(): WorkshopMember[] {
    return Array.from(this.members.values()).filter((m) => m.isAvailable && m.currentLoad < m.maxLoad);
  }

  getMemberLoad(memberId: string): { current: number; max: number } | null {
    const member = this.members.get(memberId);
    if (!member) return null;
    return { current: member.currentLoad, max: member.maxLoad };
  }
}
