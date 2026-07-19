import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type { DialogueSession, Message, Suggestion } from '../types';

interface DialogueState {
  /** 当前活跃会话 */
  activeSession: DialogueSession | null;
  /** 所有会话（key = chapterId || 'free'） */
  sessions: Record<string, DialogueSession>;
  /** 当前建议列表 */
  suggestions: Suggestion[];
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 侧边面板模式 */
  sidePanel: 'outline' | 'draft';
  /** 侧边面板是否展开 */
  sidePanelOpen: boolean;

  // Actions
  initSession: (chapterId: string | null) => Promise<void>;
  addMessage: (message: Message) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setIsGenerating: (val: boolean) => void;
  setSidePanel: (panel: 'outline' | 'draft') => void;
  toggleSidePanel: () => void;
  updateExtractStatus: (messageId: string, status: 'approved' | 'edited' | 'rejected', editedContent?: string) => void;
  updateLastMessage: (content: string, type?: 'text' | 'content_extract', extractedContent?: Message['extractedContent']) => void;
  deleteMessage: (messageId: string) => void;
  insertMessage: (index: number, message: Message) => void;
  saveSession: () => Promise<void>;
  cleanupOldSessions: (maxSessions?: number) => Promise<void>;
  restoreSessions: (sessions: Record<string, unknown>) => void;
  addTagToSession: (tag: string) => void;
  removeTagFromSession: (tag: string) => void;
  getAllTags: () => string[];
}

const storageService = StorageService.getInstance();
const SESSIONS_KEY = 'dialogue-sessions';

/** 单条消息的最大字符数（用于压缩） */
const MAX_MESSAGE_LENGTH = 5000;
/** 默认最大保留会话数 */
const DEFAULT_MAX_SESSIONS = 10;

function sessionKey(chapterId: string | null): string {
  return chapterId || 'free';
}

/** 压缩会话：限制每条消息长度和消息数量 */
function compressSession(session: DialogueSession): DialogueSession {
  const messages = session.messages;
  // 保留最近的消息，限制总数不超过50条
  const maxMessages = 50;
  const trimmedMessages = messages.slice(-maxMessages);

  // 限制每条消息的长度
  const compressedMessages = trimmedMessages.map((msg) => ({
    ...msg,
    content: msg.content.length > MAX_MESSAGE_LENGTH
      ? msg.content.slice(0, MAX_MESSAGE_LENGTH) + '...(已截断)'
      : msg.content,
  }));

  return {
    ...session,
    messages: compressedMessages,
  };
}

const useDialogueStore = create<DialogueState>((set, get) => ({
  activeSession: null,
  sessions: {},
  suggestions: [],
  isGenerating: false,
  sidePanel: 'outline',
  sidePanelOpen: true,

  initSession: async (chapterId: string | null) => {
    // 加载所有会话
    const allSessions = (await storageService.loadData<Record<string, DialogueSession>>(SESSIONS_KEY)) || {};
    const key = sessionKey(chapterId);

    let session = allSessions[key];
    if (!session) {
      session = {
        id: generateId(),
        chapterId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      allSessions[key] = session;
      await storageService.saveData(SESSIONS_KEY, allSessions);
    } else {
      // 修复从 localStorage 加载的 timestamp 字段（字符串转 Date）
      session = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    }

    set({
      activeSession: session,
      sessions: allSessions,
      suggestions: [],
    });
  },

  addMessage: (message: Message) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const updatedSession: DialogueSession = {
      ...activeSession,
      messages: [...activeSession.messages, message],
      updatedAt: new Date(),
    };

    const key = sessionKey(activeSession.chapterId);
    const updatedSessions = { ...sessions, [key]: updatedSession };

    set({
      activeSession: updatedSession,
      sessions: updatedSessions,
    });

    // 异步持久化
    storageService.saveData(SESSIONS_KEY, updatedSessions).catch((err) => {
      console.error('保存对话失败:', err);
    });
  },

  setSuggestions: (suggestions: Suggestion[]) => set({ suggestions }),

  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

  setSidePanel: (sidePanel: 'outline' | 'draft') => set({ sidePanel }),

  toggleSidePanel: () => set((state) => ({ sidePanelOpen: !state.sidePanelOpen })),

  updateExtractStatus: (messageId: string, status: 'approved' | 'edited' | 'rejected', editedContent?: string) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const messages = activeSession.messages.map((msg) => {
      if (msg.id !== messageId || !msg.extractedContent) return msg;
      return {
        ...msg,
        extractedContent: {
          ...msg.extractedContent,
          status,
          ...(editedContent !== undefined ? { editedContent } : {}),
        },
      };
    });

    const updatedSession = { ...activeSession, messages, updatedAt: new Date() };
    const key = sessionKey(activeSession.chapterId);
    const updatedSessions = { ...sessions, [key]: updatedSession };

    set({
      activeSession: updatedSession,
      sessions: updatedSessions,
    });

    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
  },

  updateLastMessage: (content: string, type: 'text' | 'content_extract' = 'text', extractedContent?: Message['extractedContent']) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const messages = [...activeSession.messages];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && !lastMessage.isUser) {
      messages[messages.length - 1] = {
        ...lastMessage,
        content,
        type,
        extractedContent: extractedContent || lastMessage.extractedContent,
      };
    }

    const updatedSession = { ...activeSession, messages, updatedAt: new Date() };
    const key = sessionKey(activeSession.chapterId);
    const updatedSessions = { ...sessions, [key]: updatedSession };

    set({
      activeSession: updatedSession,
      sessions: updatedSessions,
    });
  },

  deleteMessage: (messageId: string) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const messages = activeSession.messages.filter((msg) => msg.id !== messageId);
    const updatedSession = { ...activeSession, messages, updatedAt: new Date() };
    const key = sessionKey(activeSession.chapterId);
    const updatedSessions = { ...sessions, [key]: updatedSession };

    set({
      activeSession: updatedSession,
      sessions: updatedSessions,
    });

    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
  },

  insertMessage: (index: number, message: Message) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const messages = [...activeSession.messages];
    messages.splice(index, 0, message);

    const updatedSession = { ...activeSession, messages, updatedAt: new Date() };
    const key = sessionKey(activeSession.chapterId);
    const updatedSessions = { ...sessions, [key]: updatedSession };

    set({
      activeSession: updatedSession,
      sessions: updatedSessions,
    });

    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
  },

  saveSession: async () => {
    const { sessions } = get();
    await storageService.saveData(SESSIONS_KEY, sessions);
  },

  cleanupOldSessions: async (maxSessions = DEFAULT_MAX_SESSIONS) => {
    const { sessions: currentSessions } = get();
    const keys = Object.keys(currentSessions);

    if (keys.length <= maxSessions) return;

    // 按更新时间排序，保留最近的会话
    const sortedKeys = keys.sort((a, b) => {
      const dateA = new Date(currentSessions[a].updatedAt).getTime();
      const dateB = new Date(currentSessions[b].updatedAt).getTime();
      return dateB - dateA;
    });

    // 保留最近的会话，压缩旧的
    const sessionsToKeep: Record<string, DialogueSession> = {};
    sortedKeys.forEach((key, index) => {
      if (index < maxSessions) {
        sessionsToKeep[key] = currentSessions[key];
      } else {
        // 压缩要删除的会话数据（保留摘要）
        const compressed = compressSession(currentSessions[key]);
        // 只保留最近5条消息作为摘要
        const summarySession: DialogueSession = {
          ...compressed,
          messages: compressed.messages.slice(-5),
        };
        sessionsToKeep[key] = summarySession;
      }
    });

    set({ sessions: sessionsToKeep });
    await storageService.saveData(SESSIONS_KEY, sessionsToKeep);
  },

  restoreSessions: (sessions: Record<string, unknown>) => {
    set({ sessions: sessions as Record<string, DialogueSession> });
    storageService.saveData(SESSIONS_KEY, sessions).catch(console.error);
  },

  addTagToSession: (tag: string) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const normalizedTag = tag.trim();
    if (!normalizedTag) return;

    const existingTags = activeSession.tags || [];
    if (existingTags.includes(normalizedTag)) return;

    const updatedSession: DialogueSession = {
      ...activeSession,
      tags: [...existingTags, normalizedTag],
      updatedAt: new Date(),
    };

    const updatedSessions = {
      ...sessions,
      [sessionKey(activeSession.chapterId)]: updatedSession,
    };

    set({ activeSession: updatedSession, sessions: updatedSessions });
    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
  },

  removeTagFromSession: (tag: string) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;

    const existingTags = activeSession.tags || [];
    const updatedTags = existingTags.filter((t) => t !== tag);

    const updatedSession: DialogueSession = {
      ...activeSession,
      tags: updatedTags,
      updatedAt: new Date(),
    };

    const updatedSessions = {
      ...sessions,
      [sessionKey(activeSession.chapterId)]: updatedSession,
    };

    set({ activeSession: updatedSession, sessions: updatedSessions });
    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
  },

  getAllTags: () => {
    const { sessions } = get();
    const allTags = new Set<string>();

    Object.values(sessions).forEach((session) => {
      session.tags?.forEach((tag) => allTags.add(tag));
    });

    return Array.from(allTags);
  },
}));

export default useDialogueStore;
