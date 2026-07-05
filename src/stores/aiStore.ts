import { create } from 'zustand';
import { StorageService } from '../services';
import { getDefaultBaseUrl, getDefaultModel } from '../ai_config';
import type { AISettings } from '../types';

interface AIState extends AISettings {
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setVendor: (vendor: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxInputTokens: (maxInputTokens: number) => void;
  setMaxOutputTokens: (maxOutputTokens: number) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const storageService = StorageService.getInstance();

const STORAGE_KEY = 'ai-settings';

const useAIStore = create<AIState>((set, get) => ({
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  vendor: 'openai',
  temperature: 0.7,
  maxInputTokens: 4000,
  maxOutputTokens: 2000,

  setApiKey: (apiKey: string) => set({ apiKey }),
  setModel: (model: string) => set({ model }),
  setBaseUrl: (baseUrl: string) => set({ baseUrl }),
  setVendor: (vendor: string) => {
    const updates: Partial<AIState> = { vendor };
    // 切换供应商时自动更新 baseUrl 和 model
    const newBaseUrl = getDefaultBaseUrl(vendor);
    const newModel = getDefaultModel(vendor);
    if (newBaseUrl) updates.baseUrl = newBaseUrl;
    if (newModel) updates.model = newModel;
    set(updates);
  },
  setTemperature: (temperature: number) => set({ temperature }),
  setMaxInputTokens: (maxInputTokens: number) => set({ maxInputTokens }),
  setMaxOutputTokens: (maxOutputTokens: number) => set({ maxOutputTokens }),

  loadSettings: async () => {
    try {
      const settings = await storageService.loadData<AISettings>(STORAGE_KEY);
      if (settings) {
        set({
          apiKey: settings.apiKey ?? '',
          model: settings.model ?? 'gpt-4o-mini',
          baseUrl: settings.baseUrl ?? 'https://api.openai.com/v1',
          vendor: settings.vendor ?? 'openai',
          temperature: settings.temperature ?? 0.7,
          maxInputTokens: settings.maxInputTokens ?? 4000,
          maxOutputTokens: settings.maxOutputTokens ?? 2000,
        });
      }
    } catch (error) {
      console.error('加载AI设置失败:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { apiKey, model, baseUrl, vendor, temperature, maxInputTokens, maxOutputTokens } = get();
      await storageService.saveData(STORAGE_KEY, {
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature,
        maxInputTokens,
        maxOutputTokens,
      });
    } catch (error) {
      console.error('保存AI设置失败:', error);
    }
  },
}));

export default useAIStore;
