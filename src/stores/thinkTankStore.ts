import { create } from 'zustand';
import { StorageService } from '../services';
import { encrypt, decrypt } from '../utils/encryption';
import generateId from '../utils/generateId';
import type { ThinkTankMember, ThinkTankRolePreset } from '../types';

interface ThinkTankState {
  members: ThinkTankMember[];
  rolePresets: ThinkTankRolePreset[];
  addMember: (member: Omit<ThinkTankMember, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMember: (id: string, updates: Partial<ThinkTankMember>) => void;
  removeMember: (id: string) => void;
  toggleMemberEnabled: (id: string) => void;
  getMemberById: (id: string) => ThinkTankMember | undefined;
  getEnabledMembers: () => ThinkTankMember[];
  loadMembers: () => Promise<void>;
  saveMembers: () => Promise<void>;
}

const STORAGE_KEY = 'think-tank-members';

function getStorageService(): StorageService {
  return StorageService.getInstance();
}

const DEFAULT_ROLE_PRESETS: ThinkTankRolePreset[] = [
  {
    role: 'plot_writer',
    name: '情节写手',
    description: '擅长构思故事情节、设计剧情转折和悬念',
    icon: '📝',
    defaultPrompt: '你是一位专业的情节写手，擅长构思引人入胜的故事情节，设计悬念和转折。',
  },
  {
    role: 'character_designer',
    name: '角色设计师',
    description: '专注于人物塑造、性格设计和角色关系构建',
    icon: '👤',
    defaultPrompt: '你是一位角色设计师，擅长塑造立体的人物形象，设计复杂的性格特征和角色关系。',
  },
  {
    role: 'world_builder',
    name: '世界观架构师',
    description: '负责构建故事背景、设定世界观和规则体系',
    icon: '🌍',
    defaultPrompt: '你是一位世界观架构师，擅长构建完整的故事世界，设计独特的设定和规则体系。',
  },
  {
    role: 'dialogue_specialist',
    name: '对话专家',
    description: '专精于人物对话设计，使对话生动自然',
    icon: '💬',
    defaultPrompt: '你是一位对话专家，擅长设计生动自然的人物对话，通过对话展现人物性格和推动剧情。',
  },
  {
    role: 'style_polisher',
    name: '文风润色师',
    description: '专注于语言润色、修辞优化和风格统一',
    icon: '✨',
    defaultPrompt: '你是一位文风润色师，擅长润色文字、优化修辞，使文章更加优美流畅。',
  },
  {
    role: 'creative_consultant',
    name: '创意顾问',
    description: '提供创意建议、灵感启发和问题解决方案',
    icon: '💡',
    defaultPrompt: '你是一位创意顾问，擅长提供创意建议、激发灵感，帮助解决创作中的难题。',
  },
  {
    role: 'secretary_assistant',
    name: '秘书助手',
    description: '辅助用户招募员工、整理文档、对接系统级操作，遇到问题会询问用户并提供选项',
    icon: '📋',
    defaultPrompt: '你是一位专业的秘书助手，负责辅助用户处理各类事务。你的主要职责包括：\n1. 帮助用户招募和配置AI智囊团成员\n2. 整理和管理文档资料\n3. 对接系统级操作和设置\n\n工作方式：\n- 遇到不确定的情况时，会主动询问用户\n- 提供多个合适的选项供用户选择\n- 始终以用户需求为中心，提供高效、准确的服务',
  },
  {
    role: 'custom',
    name: '自定义',
    description: '自定义角色和职责',
    icon: '⚙️',
    defaultPrompt: '',
  },
];

const defaultConfig: ThinkTankMember['config'] = {
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  vendor: 'openai',
  temperature: 0.7,
  maxInputTokens: 4000,
  maxOutputTokens: 2000,
  customModelName: '',
  testUrl: '',
};

const useThinkTankStore = create<ThinkTankState>((set, get) => ({
  members: [],
  rolePresets: DEFAULT_ROLE_PRESETS,

  addMember: (memberData) => {
    const id = generateId();
    const now = new Date().toISOString();
    const newMember: ThinkTankMember = {
      ...memberData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      members: [...state.members, newMember],
    }));
    get().saveMembers();
    return id;
  },

  updateMember: (id, updates) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id
          ? { ...m, ...updates, updatedAt: new Date().toISOString() }
          : m
      ),
    }));
    get().saveMembers();
  },

  removeMember: (id) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    }));
    get().saveMembers();
  },

  toggleMemberEnabled: (id) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id
          ? { ...m, isEnabled: !m.isEnabled, updatedAt: new Date().toISOString() }
          : m
      ),
    }));
    get().saveMembers();
  },

  getMemberById: (id) => {
    return get().members.find((m) => m.id === id);
  },

  getEnabledMembers: () => {
    return get().members.filter((m) => m.isEnabled);
  },

  loadMembers: async () => {
    try {
      const data = await getStorageService().loadData<{
        members: ThinkTankMember[];
      }>(STORAGE_KEY);
      if (data?.members) {
        const members = data.members.map((m) => ({
          ...m,
          config: {
            ...m.config,
            apiKey: m.config.apiKey ? decrypt(m.config.apiKey) : '',
          },
        }));
        set({ members });
      }
    } catch (error) {
      console.error('加载AI智囊团成员失败:', error);
    }
  },

  saveMembers: async () => {
    try {
      const { members } = get();
      const dataToSave = {
        members: members.map((m) => ({
          ...m,
          config: {
            ...m.config,
            apiKey: m.config.apiKey ? encrypt(m.config.apiKey) : '',
          },
        })),
      };
      await getStorageService().saveData(STORAGE_KEY, dataToSave);
    } catch (error) {
      console.error('保存AI智囊团成员失败:', error);
    }
  },
}));

export default useThinkTankStore;
export { defaultConfig };
