import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { mkdir, writeTextFile, readTextFile, exists, remove, readDir, stat } from '@tauri-apps/plugin-fs';

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

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      if (this.isTauriEnvironment()) {
        await mkdir(dirPath, { recursive: true });
      } else {
        const storageKey = `__dir_${dirPath}`;
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, 'true');
        }
      }
    } catch (error) {
      console.error('创建目录失败:', error);
    }
  }

  async saveJson(filePath: string, data: unknown): Promise<void> {
    try {
      if (this.isTauriEnvironment()) {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));
        await mkdir(dirPath, { recursive: true });
        await writeTextFile(filePath, JSON.stringify(data, null, 2));
      } else {
        const storageKey = `__file_${filePath}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('保存JSON失败:', error);
      throw error;
    }
  }

  async loadJson<T>(filePath: string): Promise<T | null> {
    try {
      if (this.isTauriEnvironment()) {
        const fileExists = await exists(filePath);
        if (!fileExists) return null;
        const data = await readTextFile(filePath);
        return JSON.parse(data) as T;
      } else {
        const storageKey = `__file_${filePath}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('加载JSON失败:', error);
      return null;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (this.isTauriEnvironment()) {
        const fileExists = await exists(filePath);
        if (fileExists) {
          await remove(filePath);
        }
      } else {
        const storageKey = `__file_${filePath}`;
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      if (this.isTauriEnvironment()) {
        const dirExists = await exists(dirPath);
        if (!dirExists) return [];
        const entries = await readDir(dirPath);
        return entries.filter((e) => e.isFile).map((e) => e.name);
      } else {
        const prefix = `__file_${dirPath}/`;
        const files: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const fileName = key.replace(prefix, '');
            if (!fileName.includes('/')) {
              files.push(fileName);
            }
          }
        }
        return files;
      }
    } catch (error) {
      console.error('列出文件失败:', error);
      return [];
    }
  }

  async listDirectories(parentPath: string): Promise<string[]> {
    try {
      if (this.isTauriEnvironment()) {
        const dirExists = await exists(parentPath);
        if (!dirExists) return [];
        const entries = await readDir(parentPath);
        return entries.filter((e) => e.isDirectory).map((e) => e.name);
      } else {
        const prefix = `__dir_${parentPath}`;
        const dirs: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            dirs.push(key.replace('__dir_', ''));
          }
        }
        return dirs;
      }
    } catch (error) {
      console.error('列出目录失败:', error);
      return [];
    }
  }

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      if (this.isTauriEnvironment()) {
        return await exists(dirPath);
      } else {
        const storageKey = `__dir_${dirPath}`;
        return localStorage.getItem(storageKey) !== null;
      }
    } catch {
      return false;
    }
  }

  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      if (this.isTauriEnvironment()) {
        const dirExists = await exists(dirPath);
        if (!dirExists) return 0;
        const entries = await readDir(dirPath);
        let totalSize = 0;
        for (const entry of entries) {
          if (entry.isFile) {
            const filePath = `${dirPath}/${entry.name}`;
            const fileStat = await stat(filePath);
            totalSize += fileStat.size || 0;
          }
        }
        return totalSize;
      } else {
        let totalSize = 0;
        const prefix = `__file_${dirPath}`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const value = localStorage.getItem(key);
            if (value) totalSize += value.length * 2;
          }
        }
        return totalSize;
      }
    } catch {
      return 0;
    }
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    try {
      if (this.isTauriEnvironment()) {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));
        await mkdir(dirPath, { recursive: true });
        await writeTextFile(filePath, content);
      } else {
        const storageKey = `__file_${filePath}`;
        localStorage.setItem(storageKey, content);
      }
    } catch (error) {
      console.error('写入文件失败:', error);
      throw error;
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      if (this.isTauriEnvironment()) {
        const dirExists = await exists(dirPath);
        if (dirExists) {
          await remove(dirPath, { recursive: true });
        }
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith(`__dir_${dirPath}`) || key.startsWith(`__file_${dirPath}`))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('删除目录失败:', error);
    }
  }
}

export default FileStorageService;
