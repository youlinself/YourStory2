import { generateId } from '../../utils';

export interface ChapterLock {
  chapterId: string;
  userId: string;
  userName: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface EditHistoryEntry {
  id: string;
  chapterId: string;
  userId: string;
  userName: string;
  action: 'edit' | 'lock' | 'unlock' | 'comment';
  timestamp: string;
  details?: string;
}

export interface Comment {
  id: string;
  chapterId: string;
  userId: string;
  userName: string;
  content: string;
  position?: { start: number; end: number };
  createdAt: string;
  resolved: boolean;
}

export interface CollaborationState {
  chapterLocks: Map<string, ChapterLock>;
  editHistory: EditHistoryEntry[];
  comments: Map<string, Comment[]>;
}

const LOCK_DURATION_MS = 5 * 60 * 1000;

const CollaborationService = {
  state: {
    chapterLocks: new Map<string, ChapterLock>(),
    editHistory: [],
    comments: new Map<string, Comment[]>(),
  } as CollaborationState,

  acquireLock(chapterId: string, userId: string, userName: string): { success: boolean; lock?: ChapterLock; error?: string } {
    const existingLock = this.state.chapterLocks.get(chapterId);

    if (existingLock) {
      if (existingLock.userId === userId) {
        existingLock.expiresAt = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
        return { success: true, lock: existingLock };
      }

      if (new Date(existingLock.expiresAt) > new Date()) {
        return {
          success: false,
          error: `${existingLock.userName} 正在编辑此章节`,
        };
      }
    }

    const newLock: ChapterLock = {
      chapterId,
      userId,
      userName,
      acquiredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
    };

    this.state.chapterLocks.set(chapterId, newLock);
    this.addHistoryEntry(chapterId, userId, userName, 'lock', '锁定章节进行编辑');

    return { success: true, lock: newLock };
  },

  releaseLock(chapterId: string, userId: string): boolean {
    const lock = this.state.chapterLocks.get(chapterId);
    if (!lock || lock.userId !== userId) return false;

    this.state.chapterLocks.delete(chapterId);
    this.addHistoryEntry(chapterId, userId, lock.userName, 'unlock', '解锁章节');
    return true;
  },

  isChapterLocked(chapterId: string): { locked: boolean; lockedBy?: string; expiresAt?: string } {
    const lock = this.state.chapterLocks.get(chapterId);
    if (!lock) return { locked: false };

    if (new Date(lock.expiresAt) < new Date()) {
      this.state.chapterLocks.delete(chapterId);
      return { locked: false };
    }

    return { locked: true, lockedBy: lock.userName, expiresAt: lock.expiresAt };
  },

  addComment(chapterId: string, userId: string, userName: string, content: string, position?: { start: number; end: number }): Comment {
    const comment: Comment = {
      id: generateId(),
      chapterId,
      userId,
      userName,
      content,
      position,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    const comments = this.state.comments.get(chapterId) || [];
    comments.push(comment);
    this.state.comments.set(chapterId, comments);

    this.addHistoryEntry(chapterId, userId, userName, 'comment', content.slice(0, 50));
    return comment;
  },

  resolveComment(chapterId: string, commentId: string): boolean {
    const comments = this.state.comments.get(chapterId);
    if (!comments) return false;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return false;

    comment.resolved = true;
    return true;
  },

  deleteComment(chapterId: string, commentId: string): boolean {
    const comments = this.state.comments.get(chapterId);
    if (!comments) return false;

    const index = comments.findIndex((c) => c.id === commentId);
    if (index < 0) return false;

    comments.splice(index, 1);
    return true;
  },

  getComments(chapterId: string): Comment[] {
    return this.state.comments.get(chapterId) || [];
  },

  addHistoryEntry(chapterId: string, userId: string, userName: string, action: EditHistoryEntry['action'], details?: string): void {
    const entry: EditHistoryEntry = {
      id: generateId(),
      chapterId,
      userId,
      userName,
      action,
      timestamp: new Date().toISOString(),
      details,
    };

    this.state.editHistory.unshift(entry);
    if (this.state.editHistory.length > 100) {
      this.state.editHistory.pop();
    }
  },

  getEditHistory(chapterId: string): EditHistoryEntry[] {
    return this.state.editHistory.filter((e) => e.chapterId === chapterId);
  },

  cleanupExpiredLocks(): void {
    const now = new Date();
    for (const [chapterId, lock] of this.state.chapterLocks) {
      if (new Date(lock.expiresAt) < now) {
        this.state.chapterLocks.delete(chapterId);
      }
    }
  },

  getCollaborationStats(chapterId: string): {
    lockStatus: { locked: boolean; lockedBy?: string };
    commentCount: number;
    unresolvedComments: number;
    recentEdits: number;
  } {
    const lockStatus = this.isChapterLocked(chapterId);
    const comments = this.getComments(chapterId);
    const recentEdits = this.getEditHistory(chapterId).filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      lockStatus,
      commentCount: comments.length,
      unresolvedComments: comments.filter((c) => !c.resolved).length,
      recentEdits,
    };
  },
};

setInterval(() => {
  CollaborationService.cleanupExpiredLocks();
}, 60 * 1000);

export default CollaborationService;
