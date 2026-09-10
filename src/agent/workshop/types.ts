import type { ThinkTankMember, ThinkTankRole } from '../../types/writing';

export type TaskStatus = 'pending' | 'analyzing' | 'assigning' | 'executing' | 'reviewing' | 'completed' | 'partially_completed' | 'failed';
export type SubTaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 'plot' | 'character' | 'worldbuilding' | 'dialogue' | 'polish' | 'brainstorm' | 'full_project';

export interface TaskRequirement {
  role: ThinkTankRole;
  description: string;
  estimatedTokens: number;
  dependencies?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  requirements: TaskRequirement[];
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  memberId: string;
  memberName: string;
  role: ThinkTankRole;
  originalRole?: ThinkTankRole;
  description: string;
  status: SubTaskStatus;
  result?: string;
  tokensUsed: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  isFallback?: boolean;
  skipReason?: string;
}

export interface TaskPlan {
  taskId: string;
  analysis: string;
  subtasks: Array<{
    role: ThinkTankRole;
    description: string;
    memberId?: string;
    dependencies: string[];
    estimatedTokens: number;
    isFallback?: boolean;
  }>;
  executionOrder: string[][];
  estimatedTotalTokens: number;
}

export interface WorkshopMember extends ThinkTankMember {
  currentLoad: number;
  maxLoad: number;
  completedTasks: number;
  isAvailable: boolean;
}

export interface WorkshopState {
  isRunning: boolean;
  currentTask: Task | null;
  taskQueue: Task[];
  completedTasks: Task[];
  members: WorkshopMember[];
  subtasks: SubTask[];
  logs: WorkshopLog[];
}

export interface WorkshopLog {
  id: string;
  taskId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  memberId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskDispatchResult {
  success: boolean;
  plan: TaskPlan | null;
  assignedMembers: string[];
  errors: string[];
  warnings: string[];
  fallbackRoles: Array<{ original: ThinkTankRole; fallback: ThinkTankRole }>;
  skippedRoles: ThinkTankRole[];
}

export interface ExecutionResult {
  subtaskId: string;
  success: boolean;
  result?: string;
  tokensUsed: number;
  error?: string;
}

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  plot: '情节创作',
  character: '角色设计',
  worldbuilding: '世界观构建',
  dialogue: '对话设计',
  polish: '文风润色',
  brainstorm: '创意头脑风暴',
  full_project: '完整项目',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待处理',
  analyzing: '分析中',
  assigning: '分配中',
  executing: '执行中',
  reviewing: '审核中',
  completed: '已完成',
  partially_completed: '部分完成',
  failed: '失败',
};

export const SUBTASK_STATUS_LABELS: Record<SubTaskStatus, string> = {
  pending: '待处理',
  executing: '执行中',
  completed: '已完成',
  failed: '失败',
  skipped: '已跳过',
};

export const ROLE_TASK_COMPATIBILITY: Record<ThinkTankRole, TaskCategory[]> = {
  plot_writer: ['plot', 'brainstorm', 'full_project'],
  character_designer: ['character', 'brainstorm', 'full_project'],
  world_builder: ['worldbuilding', 'brainstorm', 'full_project'],
  dialogue_specialist: ['dialogue', 'full_project'],
  style_polisher: ['polish', 'full_project'],
  creative_consultant: ['brainstorm', 'plot', 'character', 'worldbuilding', 'full_project'],
  secretary_assistant: ['plot', 'character', 'worldbuilding', 'dialogue', 'polish', 'brainstorm', 'full_project'],
  custom: ['plot', 'character', 'worldbuilding', 'dialogue', 'polish', 'brainstorm', 'full_project'],
};

export const ROLE_FALLBACK_MAP: Record<ThinkTankRole, ThinkTankRole[]> = {
  plot_writer: ['creative_consultant', 'secretary_assistant', 'custom'],
  character_designer: ['creative_consultant', 'secretary_assistant', 'custom'],
  world_builder: ['creative_consultant', 'secretary_assistant', 'custom'],
  dialogue_specialist: ['style_polisher', 'creative_consultant', 'secretary_assistant', 'custom'],
  style_polisher: ['dialogue_specialist', 'creative_consultant', 'secretary_assistant', 'custom'],
  creative_consultant: ['plot_writer', 'character_designer', 'world_builder', 'secretary_assistant', 'custom'],
  secretary_assistant: ['creative_consultant', 'custom'],
  custom: [],
};
