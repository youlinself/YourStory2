import type { StorageAdapter } from '../session/SessionManager';

export interface BusinessStorageConfig {
  businessType: string;
  storage: StorageAdapter;
}

export class BusinessStorageAdapter implements StorageAdapter {
  private businessType: string;
  private storage: StorageAdapter;

  constructor(config: BusinessStorageConfig) {
    this.businessType = config.businessType;
    this.storage = config.storage;
  }

  private getKey(key: string): string {
    return `${this.businessType}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.storage.get<T>(this.getKey(key));
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set(this.getKey(key), value);
  }

  async remove(key: string): Promise<void> {
    await this.storage.remove(this.getKey(key));
  }

  getBusinessType(): string {
    return this.businessType;
  }
}
