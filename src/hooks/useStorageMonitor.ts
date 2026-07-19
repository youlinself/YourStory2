import { useState, useEffect, useCallback } from 'react';

interface StorageInfo {
  used: number;
  remaining: number;
  total: number;
  percentUsed: number;
  isNearLimit: boolean;
}

interface UseStorageMonitorReturn {
  storageInfo: StorageInfo;
  checkStorage: () => StorageInfo;
}

const DEFAULT_TOTAL = 5 * 1024 * 1024; // 5MB (typical localStorage limit)
const WARNING_THRESHOLD = 0.8; // 80%

/** 获取当前 localStorage 使用情况 */
function getStorageInfo(): StorageInfo {
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += (key.length + (value?.length || 0)) * 2; // UTF-16 字符占2字节
      }
    }
  } catch {
    // localStorage 不可用时忽略
  }

  const total = DEFAULT_TOTAL;
  const remaining = Math.max(0, total - used);
  const percentUsed = total > 0 ? used / total : 0;

  return {
    used,
    remaining,
    total,
    percentUsed,
    isNearLimit: percentUsed >= WARNING_THRESHOLD,
  };
}

export function useStorageMonitor(): UseStorageMonitorReturn {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(getStorageInfo);

  const checkStorage = useCallback(() => {
    const info = getStorageInfo();
    setStorageInfo(info);
    return info;
  }, []);

  useEffect(() => {
    // 定期检查存储使用情况
    const interval = setInterval(checkStorage, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, [checkStorage]);

  return { storageInfo, checkStorage };
}

/** 格式化字节数为可读字符串 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
