import type { Autobiography, Chapter } from '../../types';
import ExportService from '../export/ExportService';

interface ShareOptions {
  title: string;
  content: string;
  timeRange?: string;
  author?: string;
}

interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  chapterTitle: string;
}

class ShareService {
  private readonly STORAGE_KEY = 'shared-chapters';
  private readonly LINK_TTL_HOURS = 72; // 链接有效期72小时

  /**
   * 生成分享链接
   * 注意：这是一个本地模拟实现，实际应用中需要后端支持
   */
  async createShareLink(options: ShareOptions): Promise<ShareLink> {
    const id = this.generateId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.LINK_TTL_HOURS);

    // 将分享内容存储到 localStorage（实际应用中应上传到服务器）
    const shareData = {
      id,
      ...options,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    try {
      const existingShares = this.getStoredShares();
      existingShares[id] = shareData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingShares));
    } catch (error) {
      console.error('Failed to save share data:', error);
      throw new Error('存储空间不足，无法创建分享链接');
    }

    // 生成模拟的分享URL
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}#/share/${id}`;

    return {
      id,
      url,
      expiresAt,
      chapterTitle: options.title,
    };
  }

  /**
   * 获取分享内容
   */
  getShareContent(shareId: string): ShareOptions | null {
    const shares = this.getStoredShares();
    const share = shares[shareId];

    if (!share) return null;

    // 检查是否过期
    if (new Date(share.expiresAt) < new Date()) {
      delete shares[shareId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shares));
      return null;
    }

    return {
      title: share.title,
      content: share.content,
      timeRange: share.timeRange,
      author: share.author,
    };
  }

  /**
   * 分享单个章节
   */
  async shareChapter(chapter: Chapter): Promise<ShareLink> {
    const content = chapter.content || chapter.draftContent || '';
    if (!content) {
      throw new Error('章节内容为空，无法分享');
    }

    return this.createShareLink({
      title: chapter.title,
      content,
      timeRange: chapter.timeRange,
    });
  }

  /**
   * 分享整个自传
   */
  async shareAutobiography(autobiography: Autobiography): Promise<ShareLink> {
    const content = ExportService.export(autobiography, {
      format: 'markdown',
      includeDrafts: false,
    });

    if (!content) {
      throw new Error('自传内容为空，无法分享');
    }

    return this.createShareLink({
      title: autobiography.title,
      content,
    });
  }

  /**
   * 复制分享链接到剪贴板
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  /**
   * 获取用户创建的所有分享
   */
  getMyShares(): Array<{ id: string; chapterTitle: string; url: string; expiresAt: string }> {
    const shares = this.getStoredShares();
    return Object.values(shares).map((share) => ({
      id: share.id,
      chapterTitle: share.title,
      url: `${window.location.origin}${window.location.pathname}#/share/${share.id}`,
      expiresAt: share.expiresAt,
    }));
  }

  /**
   * 删除分享
   */
  deleteShare(shareId: string): void {
    const shares = this.getStoredShares();
    delete shares[shareId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shares));
  }

  private getStoredShares(): Record<string, { id: string; title: string; content: string; timeRange?: string; author?: string; createdAt: string; expiresAt: string }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private generateId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export default new ShareService();
