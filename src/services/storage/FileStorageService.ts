import StorageService from './StorageService';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { mkdir, writeTextFile, readTextFile, exists, remove } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

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
