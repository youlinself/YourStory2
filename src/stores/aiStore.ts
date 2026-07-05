import { create } from 'zustand';
import { StorageService } from '../services';

interface AIState {
  apiKey: string;
  model: string;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const storageService = StorageService.getInstance();

const useAIStore = create<AIState>((set, get) => ({
  apiKey: '',
  model: 'gpt-3.5-turbo',
  
  setApiKey: (apiKey: string) => set({ apiKey }),
  setModel: (model: string) => set({ model }),
  
  loadSettings: async () => {
    try {
      const settings = await storageService.loadData<{ apiKey: string; model: string }>('ai-settings');
      if (settings) {
        set({ apiKey: settings.apiKey, model: settings.model });
      }
    } catch (error) {
      console.error('加载AI设置失败:', error);
    }
  },
  
  saveSettings: async () => {
    try {
      const { apiKey, model } = get();
      await storageService.saveData('ai-settings', { apiKey, model });
    } catch (error) {
      console.error('保存AI设置失败:', error);
    }
  },
}));

export default useAIStore;