import type { Autobiography } from '../../types';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useDialogueStore from '../../stores/dialogueStore';
import useSettingsStore from '../../stores/settingsStore';
import useAIStore from '../../stores/aiStore';

interface BackupData {
  version: string;
  timestamp: string;
  autobiography: Autobiography | null;
  sessions: Record<string, unknown>;
  settings: {
    autoSave: boolean;
    notifications: boolean;
  };
  aiConfig: {
    model: string;
    baseUrl: string;
    vendor: string;
    temperature: number;
  };
}

class BackupService {
  private readonly VERSION = '1.0.0';
  private readonly BACKUP_PREFIX = 'autobiography_backup_';
  private readonly MAX_BACKUPS = 5;

  /**
   * 创建完整备份
   */
  createBackup(): string {
    const autobiographyState = useAutobiographyStore.getState();
    const dialogueState = useDialogueStore.getState();
    const settingsState = useSettingsStore.getState();
    const aiState = useAIStore.getState();

    const backupData: BackupData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      autobiography: autobiographyState.autobiography,
      sessions: dialogueState.sessions,
      settings: {
        autoSave: settingsState.autoSave,
        notifications: settingsState.notifications,
      },
      aiConfig: {
        model: aiState.model,
        baseUrl: aiState.baseUrl,
        vendor: aiState.vendor,
        temperature: aiState.temperature,
      },
    };

    const content = JSON.stringify(backupData, null, 2);
    const filename = `我的自传备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;

    // 触发下载
    this.download(content, filename, 'application/json;charset=utf-8');

    return content;
  }

  /**
   * 恢复备份
   */
  async restoreBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // 验证备份格式
      if (!backupData.version || !backupData.autobiography) {
        throw new Error('无效的备份文件');
      }

      // 验证版本兼容性
      if (!this.isVersionCompatible(backupData.version)) {
        throw new Error(`备份版本 ${backupData.version} 与当前版本不兼容`);
      }

      // 恢复自传数据
      const autobiographyState = useAutobiographyStore.getState();
      if (backupData.autobiography) {
        autobiographyState.setAutobiography(backupData.autobiography);
      }

      // 恢复对话会话
      if (backupData.sessions) {
        const dialogueState = useDialogueStore.getState();
        dialogueState.restoreSessions(backupData.sessions);
      }

      // 恢复设置
      if (backupData.settings) {
        const settingsState = useSettingsStore.getState();
        if (backupData.settings.autoSave !== undefined) {
          settingsState.setAutoSave(backupData.settings.autoSave);
        }
        if (backupData.settings.notifications !== undefined) {
          settingsState.setNotifications(backupData.settings.notifications);
        }
        settingsState.saveSettings();
      }

      // 恢复AI配置（不包含API Key）
      if (backupData.aiConfig) {
        const aiState = useAIStore.getState();
        if (backupData.aiConfig.model) aiState.setModel(backupData.aiConfig.model);
        if (backupData.aiConfig.baseUrl) aiState.setBaseUrl(backupData.aiConfig.baseUrl);
        if (backupData.aiConfig.vendor) aiState.setVendor(backupData.aiConfig.vendor);
        if (backupData.aiConfig.temperature !== undefined) aiState.setTemperature(backupData.aiConfig.temperature);
        aiState.saveSettings();
      }

      return true;
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  /**
   * 导出为Markdown格式
   */
  exportAsMarkdown(): string {
    const { autobiography } = useAutobiographyStore.getState();
    if (!autobiography) return '';

    const parts: string[] = [];
    parts.push(`# ${autobiography.title}`);
    parts.push('');
    parts.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`);
    parts.push('');

    autobiography.chapters.forEach((chapter) => {
      parts.push(`## ${chapter.title}`);
      if (chapter.timeRange) {
        parts.push(`*${chapter.timeRange}*`);
      }
      parts.push('');
      if (chapter.content) {
        parts.push(chapter.content);
      }
      if (chapter.draftContent) {
        parts.push('---');
        parts.push('*草稿内容*');
        parts.push(chapter.draftContent);
      }
      parts.push('');
    });

    const content = parts.join('\n');
    const filename = `${autobiography.title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
    this.download(content, filename, 'text/markdown;charset=utf-8');

    return content;
  }

  /**
   * 创建本地备份（保存到localStorage）
   */
  createLocalBackup(): void {
    const { autobiography } = useAutobiographyStore.getState();
    if (!autobiography) return;

    const backupKey = this.BACKUP_PREFIX + Date.now();
    const backupData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      autobiography,
    };

    try {
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      this.cleanOldBackups();
    } catch (error) {
      console.error('本地备份失败:', error);
      throw new Error('存储空间不足，无法创建本地备份');
    }
  }

  /**
   * 获取所有本地备份
   */
  getLocalBackups(): Array<{ key: string; timestamp: string; title: string }> {
    const backups: Array<{ key: string; timestamp: string; title: string }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.BACKUP_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          backups.push({
            key,
            timestamp: data.timestamp,
            title: data.autobiography?.title || '未知标题',
          });
        } catch {
          // 忽略无效备份
        }
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 从本地备份恢复
   */
  restoreFromLocalBackup(backupKey: string): boolean {
    try {
      const data = JSON.parse(localStorage.getItem(backupKey) || '{}');
      if (!data.autobiography) {
        throw new Error('无效的备份数据');
      }

      const autobiographyState = useAutobiographyStore.getState();
      autobiographyState.setAutobiography(data.autobiography);

      return true;
    } catch (error) {
      console.error('从本地备份恢复失败:', error);
      throw error;
    }
  }

  /**
   * 删除本地备份
   */
  deleteLocalBackup(backupKey: string): void {
    localStorage.removeItem(backupKey);
  }

  private cleanOldBackups(): void {
    const backups = this.getLocalBackups();
    if (backups.length > this.MAX_BACKUPS) {
      const toDelete = backups.slice(this.MAX_BACKUPS);
      toDelete.forEach((backup) => {
        localStorage.removeItem(backup.key);
      });
    }
  }

  private isVersionCompatible(backupVersion: string): boolean {
    const [major] = backupVersion.split('.');
    const [currentMajor] = this.VERSION.split('.');
    return major === currentMajor;
  }

  private download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new BackupService();
