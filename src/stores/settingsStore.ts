import { create } from 'zustand';
import { StorageService } from '../services';
import FileStorageService, { StorageType } from '../services/storage/FileStorageService';

interface SettingsState {
  autoSave: boolean;
  darkMode: boolean;
  notifications: boolean;
  storageType: StorageType;
  storageFilePath: string;
  setAutoSave: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  setStorageType: (val: StorageType) => void;
  setStorageFilePath: (val: string) => void;
  selectStorageDirectory: () => Promise<string | null>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const storageService = StorageService.getInstance();
const fileStorageService = FileStorageService.getInstance();
const STORAGE_KEY = 'app-settings';

const useSettingsStore = create<SettingsState>((set, get) => ({
  autoSave: true,
  darkMode: false,
  notifications: true,
  storageType: 'localStorage',
  storageFilePath: '',

  setAutoSave: (autoSave: boolean) => set({ autoSave }),
  setDarkMode: (darkMode: boolean) => set({ darkMode }),
  setNotifications: (notifications: boolean) => set({ notifications }),
  setStorageType: (storageType: StorageType) => set({ storageType }),
  setStorageFilePath: (storageFilePath: string) => set({ storageFilePath }),

  selectStorageDirectory: async () => {
    const path = await fileStorageService.selectDirectory();
    if (path) {
      set({ storageFilePath: path });
    }
    return path;
  },

  loadSettings: async () => {
    try {
      const settings = await storageService.loadData<Omit<SettingsState, 'setAutoSave' | 'setDarkMode' | 'setNotifications' | 'setStorageType' | 'setStorageFilePath' | 'selectStorageDirectory' | 'loadSettings' | 'saveSettings'>>(STORAGE_KEY);
      if (settings) {
        set({
          autoSave: settings.autoSave ?? true,
          darkMode: settings.darkMode ?? false,
          notifications: settings.notifications ?? true,
          storageType: settings.storageType ?? 'localStorage',
          storageFilePath: settings.storageFilePath ?? '',
        });
      }
      await fileStorageService.loadConfig();
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { autoSave, darkMode, notifications, storageType, storageFilePath } = get();
      await storageService.saveData(STORAGE_KEY, {
        autoSave,
        darkMode,
        notifications,
        storageType,
        storageFilePath,
      });
      fileStorageService.setConfig({ type: storageType, filePath: storageFilePath });
      await fileStorageService.saveConfig();
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },
}));

export default useSettingsStore;
