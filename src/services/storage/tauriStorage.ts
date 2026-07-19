/**
 * Tauri 文件系统存储适配器
 * 当运行在 Tauri 环境中时使用文件系统存储数据
 * 否则回退到 localStorage
 */

/** 检查是否在 Tauri 环境中 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Tauri 存储接口 */
interface TauriStorageInterface {
  saveData(key: string, data: unknown): Promise<void>;
  loadData<T>(key: string): Promise<T | null>;
  removeData(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

/** localStorage 实现 */
class LocalStorageAdapter implements TauriStorageInterface {
  async saveData(key: string, data: unknown): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error('保存数据失败:', error);
      throw error;
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('加载数据失败:', error);
      throw error;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除数据失败:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空数据失败:', error);
      throw error;
    }
  }
}

/** Tauri 文件系统实现 */
class TauriFileSystemAdapter implements TauriStorageInterface {
  private fs: any = null;
  private pathModule: any = null;

  private async getFsModule() {
    if (!this.fs) {
      try {
        // 使用动态导入避免 TypeScript 检查
        const moduleName = '@tauri-apps/api/fs';
        const module = await import(/* @vite-ignore */ moduleName);
        this.fs = module.fs;
      } catch {
        throw new Error('Tauri fs 模块不可用');
      }
    }
    return this.fs;
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

  private async getDataDir(): Promise<string> {
    const { path } = await this.getPathModule();
    const dataDir = await path.appDataDir();
    return dataDir;
  }

  async saveData(key: string, data: unknown): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const dataDir = await this.getDataDir();
      const filePath = `${dataDir}${key}.json`;

      // 确保目录存在
      await fs.createDir(dataDir, { recursive: true });

      const serializedData = JSON.stringify(data, null, 2);
      await fs.writeTextFile(filePath, serializedData);
    } catch (error) {
      console.error('Tauri保存数据失败:', error);
      throw error;
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    try {
      const fs = await this.getFsModule();
      const dataDir = await this.getDataDir();
      const filePath = `${dataDir}${key}.json`;

      // 检查文件是否存在
      const exists = await fs.exists(filePath);
      if (!exists) return null;

      const data = await fs.readTextFile(filePath);
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Tauri加载数据失败:', error);
      throw error;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const dataDir = await this.getDataDir();
      const filePath = `${dataDir}${key}.json`;

      const exists = await fs.exists(filePath);
      if (exists) {
        await fs.removeFile(filePath);
      }
    } catch (error) {
      console.error('Tauri删除数据失败:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const fs = await this.getFsModule();
      const dataDir = await this.getDataDir();

      const exists = await fs.exists(dataDir);
      if (exists) {
        await fs.removeDir(dataDir, { recursive: true });
      }
    } catch (error) {
      console.error('Tauri清空数据失败:', error);
      throw error;
    }
  }

  /**
   * 从 localStorage 迁移数据到 Tauri 文件系统
   */
  async migrateFromLocalStorage(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          await this.saveData(key, JSON.parse(data));
          success.push(key);
        }
      } catch (error) {
        console.error(`迁移 ${key} 失败:`, error);
        failed.push(key);
      }
    }

    return { success, failed };
  }
}

/** 存储适配器单例 */
let storageInstance: TauriStorageInterface | null = null;

/** 获取存储实例 */
export function getStorage(): TauriStorageInterface {
  if (storageInstance) return storageInstance;

  if (isTauriEnvironment()) {
    storageInstance = new TauriFileSystemAdapter();
    console.log('使用 Tauri 文件系统存储');
  } else {
    storageInstance = new LocalStorageAdapter();
    console.log('使用 localStorage 存储');
  }

  return storageInstance;
}

/** 数据迁移工具 */
export async function migrateToTauriStorage(
  keys: string[],
): Promise<{ success: string[]; failed: string[] }> {
  if (!isTauriEnvironment()) {
    return { success: [], failed: keys };
  }

  const tauriStorage = new TauriFileSystemAdapter();
  return tauriStorage.migrateFromLocalStorage(keys);
}
