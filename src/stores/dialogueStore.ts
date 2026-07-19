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
  saveSession: () => Promise<void>;
}

const storageService = StorageService.getInstance();
const SESSIONS_KEY = 'dialogue-sessions';

function sessionKey(chapterId: string | null): string {
  return chapterId || 'free';
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

  saveSession: async () => {
    const { sessions } = get();
    await storageService.saveData(SESSIONS_KEY, sessions);
  },
}));

export default useDialogueStore;
