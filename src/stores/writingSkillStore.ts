import { create } from 'zustand';
import { StorageService } from '../services';
import type { CustomWritingSkill, AIExtensionConfig, WritingStylePreset } from '../types/writing';
import { generateId } from '../utils';

interface WritingSkillState {
  skills: CustomWritingSkill[];
  extensionConfig: AIExtensionConfig;
  addSkill: (skill: Omit<CustomWritingSkill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSkill: (id: string, updates: Partial<CustomWritingSkill>) => void;
  deleteSkill: (id: string) => void;
  toggleSkill: (id: string) => void;
  addStylePreset: (preset: Omit<WritingStylePreset, 'id'>) => void;
  updateStylePreset: (id: string, updates: Partial<WritingStylePreset>) => void;
  deleteStylePreset: (id: string) => void;
  setDefaultStylePreset: (id: string) => void;
  updateExtensionConfig: (updates: Partial<AIExtensionConfig>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const STORAGE_KEY = 'writing-skills-config';

function getStorageService(): StorageService {
  return StorageService.getInstance();
}

const DEFAULT_EXTENSION_CONFIG: AIExtensionConfig = {
  customSystemPrompt: '',
  writingStylePresets: [
    {
      id: 'default-literary',
      name: '文学性风格',
      description: '富有文学色彩的描写，注重意象与修辞',
      stylePrompt: '请用文学性的语言进行写作，注重意象的营造、修辞的运用，语言优美流畅，富有感染力。',
      exampleText: '月光如流水一般，静静地泻在这一片叶子和花上。薄薄的青雾浮起在荷塘里。',
      params: {
        continue: { length: 'medium', style: 'literary', direction: '', temperature: 0.8 },
      },
      isDefault: true,
    },
    {
      id: 'default-concise',
      name: '简洁明快',
      description: '语言简洁有力，节奏明快',
      stylePrompt: '请用简洁明了的语言进行写作，避免冗长的描写，节奏明快，直击要点。',
      exampleText: '他推开门，屋里没人。桌上放着一杯还冒着热气的茶。',
      params: {
        continue: { length: 'medium', style: 'original', direction: '', temperature: 0.5 },
      },
      isDefault: false,
    },
    {
      id: 'default-colloquial',
      name: '口语化风格',
      description: '贴近生活的口语化表达，自然流畅',
      stylePrompt: '请用自然口语化的风格进行写作，贴近日常对话，让读者感到亲切自然。',
      exampleText: '"你来了？"她抬起头，手里还抓着那把瓜子，"坐吧，别站着。"',
      params: {
        continue: { length: 'medium', style: 'colloquial', direction: '', temperature: 0.7 },
      },
      isDefault: false,
    },
  ],
  autoTriggerSkills: true,
  skillSuggestionThreshold: 0.6,
};

const useWritingSkillStore = create<WritingSkillState>((set, get) => ({
  skills: [],
  extensionConfig: DEFAULT_EXTENSION_CONFIG,

  addSkill: (skill) => {
    const newSkill: CustomWritingSkill = {
      ...skill,
      id: `skill_${generateId()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ skills: [...state.skills, newSkill] }));
    get().saveSettings();
  },

  updateSkill: (id, updates) => {
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
    get().saveSettings();
  },

  deleteSkill: (id) => {
    set((state) => ({ skills: state.skills.filter((s) => s.id !== id) }));
    get().saveSettings();
  },

  toggleSkill: (id) => {
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, isEnabled: !s.isEnabled, updatedAt: new Date().toISOString() } : s
      ),
    }));
    get().saveSettings();
  },

  addStylePreset: (preset) => {
    const newPreset: WritingStylePreset = {
      ...preset,
      id: `style_${generateId()}`,
    };
    set((state) => ({
      extensionConfig: {
        ...state.extensionConfig,
        writingStylePresets: [...state.extensionConfig.writingStylePresets, newPreset],
      },
    }));
    get().saveSettings();
  },

  updateStylePreset: (id, updates) => {
    set((state) => ({
      extensionConfig: {
        ...state.extensionConfig,
        writingStylePresets: state.extensionConfig.writingStylePresets.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    }));
    get().saveSettings();
  },

  deleteStylePreset: (id) => {
    set((state) => ({
      extensionConfig: {
        ...state.extensionConfig,
        writingStylePresets: state.extensionConfig.writingStylePresets.filter((p) => p.id !== id),
      },
    }));
    get().saveSettings();
  },

  setDefaultStylePreset: (id) => {
    set((state) => ({
      extensionConfig: {
        ...state.extensionConfig,
        writingStylePresets: state.extensionConfig.writingStylePresets.map((p) => ({
          ...p,
          isDefault: p.id === id,
        })),
      },
    }));
    get().saveSettings();
  },

  updateExtensionConfig: (updates) => {
    set((state) => ({
      extensionConfig: { ...state.extensionConfig, ...updates },
    }));
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const data = await getStorageService().loadData<{
        skills?: CustomWritingSkill[];
        extensionConfig?: AIExtensionConfig;
      }>(STORAGE_KEY);
      if (data) {
        set({
          skills: data.skills || [],
          extensionConfig: data.extensionConfig || DEFAULT_EXTENSION_CONFIG,
        });
      }
    } catch (error) {
      console.error('加载写作技能配置失败:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { skills, extensionConfig } = get();
      await getStorageService().saveData(STORAGE_KEY, { skills, extensionConfig });
    } catch (error) {
      console.error('保存写作技能配置失败:', error);
    }
  },
}));

export default useWritingSkillStore;
