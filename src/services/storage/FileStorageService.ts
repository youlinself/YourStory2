import StorageService from './StorageService';

export type StorageType = 'localStorage' | 'file';

export interface StorageConfig {
  type: StorageType;
  filePath: string;
}

const STORAGE_CONFIG_KEY = 'storage_config_v1';

class FileStorageService {
  private static instance: FileStorageService;
  private config: StorageConfig = { type: 'localStorage', filePath: '' };
  private localStorageAdapter: StorageService;
  private fsModule: any = null;
  private pathModule: any = null;
  private dialogModule: any = null;

  private constructor() {
    this.localStorageAdapter = StorageService.getInstance();
  }

  static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  private isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  private async getFsModule() {
    if (!this.fsModule) {
      try {
        const moduleName = '@tauri-apps/api/fs';
        const module = await import(/* @vite-ignore */ moduleName);
        this.fsModule = module.fs;
      } catch {
        throw new Error('Tauri fs 模块不可用');
      }
    }
    return this.fsModule;
  }

  private async getPathModule() {
    if (!this.pathModule) {
      try {
        const moduleName = '@tauri-apps/api/path';
        const module = await import(/* @vite-ignore */ moduleName);
        this.pathModule = module.path;
      } catch {
        throw new Error('Tauri path 模块不可用');
      }
    }
    return this.pathModule;
  }

  private async getDialogModule() {
    if (!this.dialogModule) {
      try {
        const moduleName = '@tauri-apps/api/dialog';
        const module = await import(/* @vite-ignore */ moduleName);
        this.dialogModule = module;
      } catch {
        throw new Error('Tauri dialog 模块不可用');
      }
    }
    return this.dialogModule;
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  setConfig(config: StorageConfig): void {
    this.config = { ...config };
  }

  async loadConfig(): Promise<StorageConfig> {
    try {
      const data = await this.localStorageAdapter.loadData<StorageConfig>(STORAGE_CONFIG_KEY);
      if (data) {
        this.config = data;
      } else {
        const { path } = await this.getPathModule();
        const appDataDir = await path.appDataDir();
        this.config = { type: 'file', filePath: appDataDir };
        await this.saveConfig();
      }
    } catch {
      this.config = { type: 'localStorage', filePath: '' };
    }
    return this.config;
  }

  async saveConfig(): Promise<void> {
    await this.localStorageAdapter.saveData(STORAGE_CONFIG_KEY, this.config);
  }

  async selectDirectory(): Promise<string | null> {
    if (!this.isTauriEnvironment()) {
      return null;
    }

    try {
      const dialog = await this.getDialogModule();
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: '选择数据存储位置',
        defaultPath: this.config.filePath || undefined,
      });
      return selected as string | null;
    } catch (error) {
      console.error('选择目录失败:', error);
      return null;
    }
  }

  async saveData(key: string, data: unknown): Promise<void> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      await this.saveToFile(key, data);
    } else {
      await this.localStorageAdapter.saveData(key, data);
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      return this.loadFromFile<T>(key);
    } else {
      return this.localStorageAdapter.loadData<T>(key);
    }
  }

  async removeData(key: string): Promise<void> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      await this.removeFile(key);
    } else {
      await this.localStorageAdapter.removeData(key);
    }
  }

  async clearAll(): Promise<void> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      await this.clearAllFiles();
    } else {
      await this.localStorageAdapter.clearAll();
    }
  }

  private getFilePath(key: string): string {
    const basePath = this.config.filePath || '';
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${basePath}\\${safeKey}.json`;
  }

  private async saveToFile(key: string, data: unknown): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const filePath = this.getFilePath(key);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));

      await fs.createDir(dirPath, { recursive: true });

      const serializedData = JSON.stringify(data, null, 2);
      await fs.writeTextFile(filePath, serializedData);
    } catch (error) {
      console.error('文件保存失败:', error);
      throw error;
    }
  }

  private async loadFromFile<T>(key: string): Promise<T | null> {
    try {
      const fs = await this.getFsModule();
      const filePath = this.getFilePath(key);

      const exists = await fs.exists(filePath);
      if (!exists) return null;

      const data = await fs.readTextFile(filePath);
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('文件加载失败:', error);
      throw error;
    }
  }

  private async removeFile(key: string): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const filePath = this.getFilePath(key);

      const exists = await fs.exists(filePath);
      if (exists) {
        await fs.removeFile(filePath);
      }
    } catch (error) {
      console.error('文件删除失败:', error);
      throw error;
    }
  }

  private async clearAllFiles(): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const basePath = this.config.filePath;

      if (basePath) {
        const exists = await fs.exists(basePath);
        if (exists) {
          await fs.removeDir(basePath, { recursive: true });
        }
      }
    } catch (error) {
      console.error('清空文件失败:', error);
      throw error;
    }
  }

  async migrateFromLocalStorage(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        const data = await this.localStorageAdapter.loadData(key);
        if (data) {
          await this.saveData(key, data);
          success.push(key);
        }
      } catch (error) {
        console.error(`迁移 ${key} 失败:`, error);
        failed.push(key);
      }
    }

    return { success, failed };
  }

  async migrateToFile(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    if (this.config.type !== 'file') {
      return { success: [], failed: keys };
    }

    return this.migrateFromLocalStorage(keys);
  }
}

export default FileStorageService;
