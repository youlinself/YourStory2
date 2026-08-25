import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type { DialogueSession, Message, Suggestion, NarrativeNode, DecisionPoint, RebirthExperience } from '../types';

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
  sidePanel: 'outline' | 'draft' | 'nodes' | 'rebirth';
  /** 侧边面板是否展开 */
  sidePanelOpen: boolean;
  /** 叙事节点列表 */
  narrativeNodes: NarrativeNode[];
  /** 抉择点列表 */
  decisionPoints: DecisionPoint[];
  /** 重生体验列表 */
  rebirthExperiences: RebirthExperience[];
  /** 是否显示敏感内容提示 */
  showSensitiveNotice: boolean;
  /** 当前选中的分叉节点ID */
  selectedForkNodeId: string | null;
  /** 是否处于重生创作模式 */
  isRebirthMode: boolean;
  /** 重生创作时的原故事上下文 */
  rebirthContext: { forkNodeId: string; forkContent: string } | null;

  // Actions
  initSession: (chapterId: string | null) => Promise<void>;
  addMessage: (message: Message) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setIsGenerating: (val: boolean) => void;
  setSidePanel: (panel: 'outline' | 'draft' | 'nodes' | 'rebirth') => void;
  toggleSidePanel: () => void;
  updateExtractStatus: (messageId: string, status: 'approved' | 'edited' | 'rejected', editedContent?: string) => void;
  updateLastMessage: (content: string, type?: 'text' | 'content_extract' | 'node_created' | 'decision_marked' | 'emotion_tagged', extractedContent?: Message['extractedContent']) => void;
  deleteMessage: (messageId: string) => void;
  insertMessage: (index: number, message: Message) => void;
  saveSession: () => Promise<void>;
  cleanupOldSessions: (maxSessions?: number) => Promise<void>;
  restoreSessions: (sessions: Record<string, unknown>) => void;
  addTagToSession: (tag: string) => void;
  removeTagFromSession: (tag: string) => void;
  getAllTags: () => string[];

  // Node Actions
  addNarrativeNode: (node: Omit<NarrativeNode, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => NarrativeNode;
  updateNarrativeNode: (nodeId: string, updates: Partial<NarrativeNode>) => void;
  deleteNarrativeNode: (nodeId: string) => void;
  markAsDecisionPoint: (nodeId: string, description?: string) => void;
  updateNodeEmotions: (nodeId: string, tags: string[]) => void;
  toggleNodeSensitive: (nodeId: string) => void;

  // Decision Point Actions
  createDecisionPoint: (nodeId: string, originalChoice: string) => DecisionPoint;
  updateDecisionPoint: (dpId: string, updates: Partial<DecisionPoint>) => void;

  // Rebirth Actions
  createRebirthExperience: (forkNodeId: string, title: string) => RebirthExperience;
  updateRebirthExperience: (rebirthId: string, updates: Partial<RebirthExperience>) => void;
  deleteRebirthExperience: (rebirthId: string) => void;
  enterRebirthMode: (forkNodeId: string) => void;
  exitRebirthMode: () => void;
  setSelectedForkNode: (nodeId: string | null) => void;

  // Sensitive Content Actions
  setShowSensitiveNotice: (show: boolean) => void;
  detectSensitiveContent: (content: string) => boolean;

  // Persistence
  saveNodesData: () => Promise<void>;
  loadNodesData: () => Promise<void>;
}

const storageService = StorageService.getInstance();
const SESSIONS_KEY = 'dialogue-sessions';
const NODES_KEY = 'dialogue-nodes';
const DECISION_POINTS_KEY = 'dialogue-decision-points';
const REBIRTH_EXPERIENCES_KEY = 'dialogue-rebirth-experiences';

/** 单条消息的最大字符数（用于压缩） */
const MAX_MESSAGE_LENGTH = 5000;
/** 默认最大保留会话数 */
const DEFAULT_MAX_SESSIONS = 10;

/** 敏感关键词列表 */
const SENSITIVE_KEYWORDS = [
  '死亡', '去世', '自杀', '离婚', '背叛', '虐待', '暴力',
  '性侵', '强奸', '车祸', '癌症', '绝症', '跳楼', '割腕',
  '自杀', '轻生', '绝望', '活不下去', '想死', 'kill myself',
  'suicide', 'die', 'death', 'abuse', 'rape'
];

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

/** 检测内容是否包含敏感关键词 */
function checkSensitiveContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

const useDialogueStore = create<DialogueState>((set, get) => ({
  activeSession: null,
  sessions: {},
  suggestions: [],
  isGenerating: false,
  sidePanel: 'outline',
  sidePanelOpen: true,
  narrativeNodes: [],
  decisionPoints: [],
  rebirthExperiences: [],
  showSensitiveNotice: false,
  selectedForkNodeId: null,
  isRebirthMode: false,
  rebirthContext: null,

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

  setSidePanel: (sidePanel: 'outline' | 'draft' | 'nodes' | 'rebirth') => set({ sidePanel }),

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

  updateLastMessage: (content: string, type: 'text' | 'content_extract' | 'node_created' | 'decision_marked' | 'emotion_tagged' = 'text', extractedContent?: Message['extractedContent']) => {
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

    storageService.saveData(SESSIONS_KEY, updatedSessions).catch(console.error);
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

  // ==================== Node Actions ====================

  addNarrativeNode: (nodeData: Omit<NarrativeNode, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => {
    const newNode: NarrativeNode = {
      ...nodeData,
      id: generateId(),
      wordCount: nodeData.content.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      narrativeNodes: [...state.narrativeNodes, newNode],
    }));

    // Async save
    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);

    return newNode;
  },

  updateNarrativeNode: (nodeId: string, updates: Partial<NarrativeNode>) => {
    set((state) => ({
      narrativeNodes: state.narrativeNodes.map((node) =>
        node.id === nodeId
          ? { ...node, ...updates, updatedAt: new Date(), wordCount: updates.content?.length ?? node.wordCount }
          : node
      ),
    }));

    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);
  },

  deleteNarrativeNode: (nodeId: string) => {
    set((state) => ({
      narrativeNodes: state.narrativeNodes.filter((node) => node.id !== nodeId),
    }));

    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);
  },

  markAsDecisionPoint: (nodeId: string, description?: string) => {
    set((state) => ({
      narrativeNodes: state.narrativeNodes.map((node) =>
        node.id === nodeId
          ? { ...node, isDecisionPoint: true, decisionDescription: description, updatedAt: new Date() }
          : node
      ),
    }));

    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);
  },

  updateNodeEmotions: (nodeId: string, tags: string[]) => {
    set((state) => ({
      narrativeNodes: state.narrativeNodes.map((node) =>
        node.id === nodeId
          ? { ...node, emotionTags: tags, updatedAt: new Date() }
          : node
      ),
    }));

    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);
  },

  toggleNodeSensitive: (nodeId: string) => {
    set((state) => ({
      narrativeNodes: state.narrativeNodes.map((node) =>
        node.id === nodeId
          ? { ...node, isSensitive: !node.isSensitive, updatedAt: new Date() }
          : node
      ),
    }));

    const { narrativeNodes } = get();
    storageService.saveData(NODES_KEY, narrativeNodes).catch(console.error);
  },

  // ==================== Decision Point Actions ====================

  createDecisionPoint: (nodeId: string, originalChoice: string) => {
    const newDP: DecisionPoint = {
      id: generateId(),
      nodeId,
      originalChoice,
      forkable: true,
      rebirthCount: 0,
      regretLevel: 3,
    };

    set((state) => ({
      decisionPoints: [...state.decisionPoints, newDP],
    }));

    const { decisionPoints } = get();
    storageService.saveData(DECISION_POINTS_KEY, decisionPoints).catch(console.error);

    return newDP;
  },

  updateDecisionPoint: (dpId: string, updates: Partial<DecisionPoint>) => {
    set((state) => ({
      decisionPoints: state.decisionPoints.map((dp) =>
        dp.id === dpId ? { ...dp, ...updates } : dp
      ),
    }));

    const { decisionPoints } = get();
    storageService.saveData(DECISION_POINTS_KEY, decisionPoints).catch(console.error);
  },

  // ==================== Rebirth Actions ====================

  createRebirthExperience: (forkNodeId: string, title: string) => {
    const { narrativeNodes } = get();
    const forkNode = narrativeNodes.find((n) => n.id === forkNodeId);

    const newRebirth: RebirthExperience = {
      id: generateId(),
      autobiographyId: '',
      forkNodeId,
      forkContext: forkNode?.content || '',
      title,
      nodes: [],
      diffSummary: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      rebirthExperiences: [...state.rebirthExperiences, newRebirth],
    }));

    const { rebirthExperiences } = get();
    storageService.saveData(REBIRTH_EXPERIENCES_KEY, rebirthExperiences).catch(console.error);

    return newRebirth;
  },

  updateRebirthExperience: (rebirthId: string, updates: Partial<RebirthExperience>) => {
    set((state) => ({
      rebirthExperiences: state.rebirthExperiences.map((r) =>
        r.id === rebirthId ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));

    const { rebirthExperiences } = get();
    storageService.saveData(REBIRTH_EXPERIENCES_KEY, rebirthExperiences).catch(console.error);
  },

  deleteRebirthExperience: (rebirthId: string) => {
    set((state) => ({
      rebirthExperiences: state.rebirthExperiences.filter((r) => r.id !== rebirthId),
    }));

    const { rebirthExperiences } = get();
    storageService.saveData(REBIRTH_EXPERIENCES_KEY, rebirthExperiences).catch(console.error);
  },

  enterRebirthMode: (forkNodeId: string) => {
    const { narrativeNodes } = get();
    const forkNode = narrativeNodes.find((n) => n.id === forkNodeId);

    set({
      isRebirthMode: true,
      selectedForkNodeId: forkNodeId,
      rebirthContext: {
        forkNodeId,
        forkContent: forkNode?.content || '',
      },
    });
  },

  exitRebirthMode: () => {
    set({
      isRebirthMode: false,
      selectedForkNodeId: null,
      rebirthContext: null,
    });
  },

  setSelectedForkNode: (nodeId: string | null) => {
    set({ selectedForkNodeId: nodeId });
  },

  // ==================== Sensitive Content Actions ====================

  setShowSensitiveNotice: (show: boolean) => set({ showSensitiveNotice: show }),

  detectSensitiveContent: (content: string) => {
    const isSensitive = checkSensitiveContent(content);
    if (isSensitive) {
      set({ showSensitiveNotice: true });
    }
    return isSensitive;
  },

  // ==================== Persistence ====================

  saveNodesData: async () => {
    const { narrativeNodes, decisionPoints, rebirthExperiences } = get();
    await Promise.all([
      storageService.saveData(NODES_KEY, narrativeNodes),
      storageService.saveData(DECISION_POINTS_KEY, decisionPoints),
      storageService.saveData(REBIRTH_EXPERIENCES_KEY, rebirthExperiences),
    ]);
  },

  loadNodesData: async () => {
    const [nodes, dps, rebirths] = await Promise.all([
      storageService.loadData<NarrativeNode[]>(NODES_KEY),
      storageService.loadData<DecisionPoint[]>(DECISION_POINTS_KEY),
      storageService.loadData<RebirthExperience[]>(REBIRTH_EXPERIENCES_KEY),
    ]);

    set({
      narrativeNodes: nodes || [],
      decisionPoints: dps || [],
      rebirthExperiences: rebirths || [],
    });
  },
}));

export default useDialogueStore;
