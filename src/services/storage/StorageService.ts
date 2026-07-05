class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async saveData(key: string, data: any): Promise<void> {
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

export default StorageService;