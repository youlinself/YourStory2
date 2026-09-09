import { create } from 'zustand';
import { AIWorkshop } from '../agent/workshop/AIWorkshop';
import type { Task, SubTask, WorkshopLog, WorkshopMember } from '../agent/workshop/types';
import { generateId } from '../utils';
import useThinkTankStore from './thinkTankStore';

interface AIWorkshopState {
  workshop: AIWorkshop | null;
  currentTask: Task | null;
  taskQueue: Task[];
  completedTasks: Task[];
  subtasks: SubTask[];
  logs: WorkshopLog[];
  availableMembers: WorkshopMember[];
  isInitialized: boolean;
  isRunning: boolean;

  initialize: () => void;
  submitTask: (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'requirements'>) => Promise<void>;
  cancelCurrentTask: () => void;
  clearQueue: () => void;
  clearLogs: () => void;
  refreshMembers: () => void;
  getTaskById: (id: string) => Task | undefined;
  getSubtasksByTaskId: (taskId: string) => SubTask[];
  getLogsByTaskId: (taskId: string) => WorkshopLog[];
}

const useAIWorkshopStore = create<AIWorkshopState>((set, get) => ({
  workshop: null,
  currentTask: null,
  taskQueue: [],
  completedTasks: [],
  subtasks: [],
  logs: [],
  availableMembers: [],
  isInitialized: false,
  isRunning: false,

  initialize: () => {
    const thinkTankStore = useThinkTankStore.getState();
    const { members, rolePresets } = thinkTankStore;

    const workshop = new AIWorkshop(members, rolePresets, {
      onLog: (log) => {
        set((state) => ({
          logs: [...state.logs, log],
        }));
      },
      onTaskUpdate: (task) => {
        set((state) => {
          const existingTaskIdx = state.taskQueue.findIndex((t) => t.id === task.id);
          if (existingTaskIdx >= 0) {
            const newQueue = [...state.taskQueue];
            newQueue[existingTaskIdx] = task;
            return { taskQueue: newQueue, currentTask: task };
          }
          if (state.currentTask?.id === task.id) {
            return { currentTask: task };
          }
          return { currentTask: task };
        });
      },
      onSubtaskUpdate: (subtask) => {
        set((state) => {
          const existingIdx = state.subtasks.findIndex((st) => st.id === subtask.id);
          if (existingIdx >= 0) {
            const newSubtasks = [...state.subtasks];
            newSubtasks[existingIdx] = subtask;
            return { subtasks: newSubtasks };
          }
          return { subtasks: [...state.subtasks, subtask] };
        });
      },
      onComplete: (task) => {
        set((state) => ({
          completedTasks: [...state.completedTasks, task],
          currentTask: null,
          isRunning: false,
        }));
      },
    });

    set({
      workshop,
      isInitialized: true,
      availableMembers: workshop.getAvailableMembers(),
    });
  },

  submitTask: async (taskData) => {
    const { workshop } = get();
    if (!workshop) {
      get().initialize();
    }

    const workshopInstance = get().workshop;
    if (!workshopInstance) {
      throw new Error('Workshop not initialized');
    }

    const id = generateId();
    const now = new Date().toISOString();

    const task: Task = {
      ...taskData,
      id,
      status: 'pending',
      requirements: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      taskQueue: [...state.taskQueue, task],
      isRunning: true,
    }));

    await workshopInstance.submitTask(task);

    set({
      availableMembers: workshopInstance.getAvailableMembers(),
      isRunning: workshopInstance.isRunning,
    });
  },

  cancelCurrentTask: () => {
    const { workshop } = get();
    workshop?.cancelCurrentTask();
    set({ isRunning: false });
  },

  clearQueue: () => {
    const { workshop } = get();
    workshop?.clearQueue();
    set({ taskQueue: [], currentTask: null });
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  refreshMembers: () => {
    const thinkTankStore = useThinkTankStore.getState();
    const { members } = thinkTankStore;
    const { workshop } = get();

    workshop?.updateMembers(members);
    set({
      availableMembers: workshop?.getAvailableMembers() || [],
    });
  },

  getTaskById: (id) => {
    const { taskQueue, completedTasks, currentTask } = get();
    if (currentTask?.id === id) return currentTask;
    return taskQueue.find((t) => t.id === id) || completedTasks.find((t) => t.id === id);
  },

  getSubtasksByTaskId: (taskId) => {
    return get().subtasks.filter((st) => st.taskId === taskId);
  },

  getLogsByTaskId: (taskId) => {
    return get().logs.filter((log) => log.taskId === taskId);
  },
}));

export default useAIWorkshopStore;
