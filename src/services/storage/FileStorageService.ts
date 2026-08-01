import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { mkdir, writeTextFile, readTextFile, exists, remove } from '@tauri-apps/plugin-fs';

export type StorageType = 'localStorage' | 'file';

export interface StorageConfig {
  type: StorageType;
  filePath: string;
}

const STORAGE_CONFIG_KEY = 'storage_config';

class FileStorageService {
  private static instance: FileStorageService;
  private config: StorageConfig = { type: 'localStorage', filePath: '' };

  private constructor() {}

  static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  private isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  setConfig(config: StorageConfig): void {
    this.config = { ...config };
  }

  async loadConfig(): Promise<StorageConfig> {
    try {
      const data = this.loadFromLocalStorage<StorageConfig>(STORAGE_CONFIG_KEY);
      if (data) {
        this.config = data;
      }
    } catch {
      this.config = { type: 'localStorage', filePath: '' };
    }
    return this.config;
  }

  async saveConfig(): Promise<void> {
    this.saveToLocalStorage(STORAGE_CONFIG_KEY, this.config);
  }

  async selectDirectory(): Promise<string | null> {
    if (!this.isTauriEnvironment()) {
      return null;
    }

    try {
      const selected = await dialogOpen({
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
      this.saveToLocalStorage(key, data);
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      return this.loadFromFile<T>(key);
    } else {
      return this.loadFromLocalStorage<T>(key);
    }
  }

  async removeData(key: string): Promise<void> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      await this.removeFile(key);
    } else {
      try { localStorage.removeItem(key); } catch {}
    }
  }

  async clearAll(): Promise<void> {
    if (this.config.type === 'file' && this.isTauriEnvironment()) {
      await this.clearAllFiles();
    } else {
      try { localStorage.clear(); } catch {}
    }
  }

  private saveToLocalStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('localStorage保存失败:', error);
    }
  }

  private loadFromLocalStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getFilePath(key: string): string {
    const basePath = this.config.filePath || '';
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${basePath}\\${safeKey}.json`;
  }

  private async saveToFile(key: string, data: unknown): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));

      await mkdir(dirPath, { recursive: true });

      const serializedData = JSON.stringify(data, null, 2);
      await writeTextFile(filePath, serializedData);
    } catch (error) {
      console.error('文件保存失败:', error);
      throw error;
    }
  }

  private async loadFromFile<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);

      const fileExists = await exists(filePath);
      if (!fileExists) return null;

      const data = await readTextFile(filePath);
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('文件加载失败:', error);
      throw error;
    }
  }

  private async removeFile(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);

      const fileExists = await exists(filePath);
      if (fileExists) {
        await remove(filePath);
      }
    } catch (error) {
      console.error('文件删除失败:', error);
      throw error;
    }
  }

  async migrateFromLocalStorage(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        const data = this.loadFromLocalStorage<unknown>(key);
        if (data !== null) {
          await this.saveData(key, data);
          success.push(key);
        }
      } catch {
        failed.push(key);
      }
    }

    return { success, failed };
  }

  private async clearAllFiles(): Promise<void> {
    try {
      const basePath = this.config.filePath;

      if (basePath) {
        const dirExists = await exists(basePath);
        if (dirExists) {
          await remove(basePath, { recursive: true });
        }
      }
    } catch (error) {
      console.error('清空文件失败:', error);
      throw error;
    }
  }
}

export default FileStorageService;
