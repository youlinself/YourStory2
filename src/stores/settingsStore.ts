import { create } from 'zustand';
import { StorageService } from '../services';

interface SettingsState {
  autoSave: boolean;
  darkMode: boolean;
  notifications: boolean;
  setAutoSave: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const storageService = StorageService.getInstance();
const STORAGE_KEY = 'app-settings';

const useSettingsStore = create<SettingsState>((set, get) => ({
  autoSave: true,
  darkMode: false,
  notifications: true,

  setAutoSave: (autoSave: boolean) => set({ autoSave }),
  setDarkMode: (darkMode: boolean) => set({ darkMode }),
  setNotifications: (notifications: boolean) => set({ notifications }),

  loadSettings: async () => {
    try {
      const settings = await storageService.loadData<Omit<SettingsState, 'setAutoSave' | 'setDarkMode' | 'setNotifications' | 'loadSettings' | 'saveSettings'>>(STORAGE_KEY);
      if (settings) {
        set({
          autoSave: settings.autoSave ?? true,
          darkMode: settings.darkMode ?? false,
          notifications: settings.notifications ?? true,
        });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { autoSave, darkMode, notifications } = get();
      await storageService.saveData(STORAGE_KEY, {
        autoSave,
        darkMode,
        notifications,
      });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },
}));

export default useSettingsStore;
