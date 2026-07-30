import { create } from 'zustand';
import FileStorageService from '../services/storage/FileStorageService';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievementData';
import type {
  Achievement,
  AchievementProgress,
  AchievementState,
  AchievementCheckState,
  PlayerAttributes,
  CultivationRealm,
  GameState,
} from '../types/simulation';

const STORAGE_KEY = 'achievement_system_v1';
const storageService = FileStorageService.getInstance();

const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  energy: 0, physique: 0, health: 0, iq: 0, eq: 0, wealth: 0, network: 0, fame: 0
};

const initialState: AchievementState = {
  achievements: ACHIEVEMENTS,
  unlockedAchievements: [],
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  totalDeaths: 0,
  totalCombatsWon: 0,
  totalEventsCompleted: 0,
  totalCardsCollected: 0,
  totalRelicsCollected: 0,
  totalGoldEarned: 0,
  totalBreakthroughs: 0,
  highestAge: 0,
  highestAttributes: { ...DEFAULT_ATTRIBUTES },
  cultivationRealmsReached: [],
  bossesDefeated: [],
  choicesMade: 0,
  tagsUnlocked: [],
  npcRelationships: 0,
};

export interface NewAchievementNotification {
  achievementId: string;
  name: string;
  icon: string;
  rarity: string;
  unlockedAt: number;
}

interface AchievementStore extends AchievementState {
  newAchievements: NewAchievementNotification[];
  loadAchievements: () => Promise<void>;
  saveAchievements: () => Promise<void>;
  checkAchievements: (gameState?: GameState) => Achievement[];
  recordGameStart: () => void;
  recordGameEnd: (gameState: GameState, isVictory: boolean) => void;
  recordCombatWin: (enemyIds: string[], isBoss: boolean[]) => void;
  recordEventCompleted: () => void;
  recordChoiceMade: () => void;
  recordCardsCollected: (count: number) => void;
  recordRelicsCollected: (count: number) => void;
  recordGoldEarned: (amount: number) => void;
  recordBreakthrough: (realm: CultivationRealm) => void;
  recordTagUnlocked: (tagId: string) => void;
  recordNPCRelationship: () => void;
  clearNewAchievements: () => void;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
  getProgressForAchievement: (achievementId: string) => number;
  getMaxProgressForAchievement: (achievementId: string) => number;
  isAchievementUnlocked: (achievementId: string) => boolean;
  getCheckState: (gameState?: GameState) => AchievementCheckState;
}

const useAchievementStore = create<AchievementStore>((set, get) => ({
  ...initialState,
  newAchievements: [],

  loadAchievements: async () => {
    try {
      const data = await storageService.loadData<AchievementState>(STORAGE_KEY);
      if (data) {
        set({
          unlockedAchievements: data.unlockedAchievements || [],
          totalGamesPlayed: data.totalGamesPlayed || 0,
          totalGamesWon: data.totalGamesWon || 0,
          totalDeaths: data.totalDeaths || 0,
          totalCombatsWon: data.totalCombatsWon || 0,
          totalEventsCompleted: data.totalEventsCompleted || 0,
          totalCardsCollected: data.totalCardsCollected || 0,
          totalRelicsCollected: data.totalRelicsCollected || 0,
          totalGoldEarned: data.totalGoldEarned || 0,
          totalBreakthroughs: data.totalBreakthroughs || 0,
          highestAge: data.highestAge || 0,
          highestAttributes: data.highestAttributes || { ...DEFAULT_ATTRIBUTES },
          cultivationRealmsReached: data.cultivationRealmsReached || [],
          bossesDefeated: data.bossesDefeated || [],
          choicesMade: data.choicesMade || 0,
          tagsUnlocked: data.tagsUnlocked || [],
          npcRelationships: data.npcRelationships || 0,
        });
      }
    } catch (e) {
      console.error('加载成就数据失败:', e);
    }
  },

  saveAchievements: async () => {
    const s = get();
    try {
      await storageService.saveData(STORAGE_KEY, {
        unlockedAchievements: s.unlockedAchievements,
        totalGamesPlayed: s.totalGamesPlayed,
        totalGamesWon: s.totalGamesWon,
        totalDeaths: s.totalDeaths,
        totalCombatsWon: s.totalCombatsWon,
        totalEventsCompleted: s.totalEventsCompleted,
        totalCardsCollected: s.totalCardsCollected,
        totalRelicsCollected: s.totalRelicsCollected,
        totalGoldEarned: s.totalGoldEarned,
        totalBreakthroughs: s.totalBreakthroughs,
        highestAge: s.highestAge,
        highestAttributes: s.highestAttributes,
        cultivationRealmsReached: s.cultivationRealmsReached,
        bossesDefeated: s.bossesDefeated,
        choicesMade: s.choicesMade,
        tagsUnlocked: s.tagsUnlocked,
        npcRelationships: s.npcRelationships,
      });
    } catch (e) {
      console.error('保存成就数据失败:', e);
    }
  },

  getCheckState: (gameState?) => {
    const s = get();
    return {
      totalGamesPlayed: s.totalGamesPlayed,
      totalGamesWon: s.totalGamesWon,
      totalDeaths: s.totalDeaths,
      totalCombatsWon: s.totalCombatsWon,
      totalEventsCompleted: s.totalEventsCompleted,
      totalCardsCollected: s.totalCardsCollected,
      totalRelicsCollected: s.totalRelicsCollected,
      totalGoldEarned: s.totalGoldEarned,
      totalBreakthroughs: s.totalBreakthroughs,
      highestAge: s.highestAge,
      highestAttributes: s.highestAttributes,
      cultivationRealmsReached: s.cultivationRealmsReached,
      bossesDefeated: s.bossesDefeated,
      choicesMade: s.choicesMade,
      tagsUnlocked: s.tagsUnlocked,
      npcRelationships: s.npcRelationships,
      currentGameState: gameState || null,
    };
  },

  checkAchievements: (gameState?) => {
    const s = get();
    const checkState = s.getCheckState(gameState);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const alreadyUnlocked = s.unlockedAchievements.some(
        (ua) => ua.achievementId === achievement.id
      );
      if (alreadyUnlocked) continue;

      try {
        if (achievement.condition(checkState)) {
          newlyUnlocked.push(achievement);
        }
      } catch (e) {
        console.error(`检查成就 ${achievement.id} 失败:`, e);
      }
    }

    if (newlyUnlocked.length > 0) {
      const newProgress: AchievementProgress[] = newlyUnlocked.map((a) => ({
        achievementId: a.id,
        unlockedAt: new Date().toISOString(),
        progress: a.maxProgress || 1,
      }));

      const newNotifications: NewAchievementNotification[] = newlyUnlocked.map((a) => ({
        achievementId: a.id,
        name: a.name,
        icon: a.icon,
        rarity: a.rarity,
        unlockedAt: Date.now(),
      }));

      set({
        unlockedAchievements: [...s.unlockedAchievements, ...newProgress],
        newAchievements: [...s.newAchievements, ...newNotifications],
      });

      get().saveAchievements();
    }

    return newlyUnlocked;
  },

  recordGameStart: () => {
    set((s) => ({
      totalGamesPlayed: s.totalGamesPlayed + 1,
    }));
    get().saveAchievements();
  },

  recordGameEnd: (gameState, isVictory) => {
    const s = get();
    const newAge = gameState.age;
    const newHighestAge = Math.max(s.highestAge, newAge);

    const newHighestAttrs = { ...s.highestAttributes };
    for (const key of Object.keys(newHighestAttrs) as (keyof PlayerAttributes)[]) {
      newHighestAttrs[key] = Math.max(newHighestAttrs[key], gameState.attributes[key]);
    }

    const newTags = new Set(s.tagsUnlocked);
    for (const tag of gameState.hiddenTags) {
      newTags.add(tag);
    }

    set({
      totalGamesWon: isVictory ? s.totalGamesWon + 1 : s.totalGamesWon,
      totalDeaths: isVictory ? s.totalDeaths : s.totalDeaths + 1,
      highestAge: newHighestAge,
      highestAttributes: newHighestAttrs,
      tagsUnlocked: Array.from(newTags),
    });

    get().checkAchievements(gameState);
    get().saveAchievements();
  },

  recordCombatWin: (enemyIds, isBoss) => {
    const s = get();
    const newBosses = new Set(s.bossesDefeated);

    for (let i = 0; i < enemyIds.length; i++) {
      if (isBoss[i]) {
        newBosses.add(enemyIds[i]);
      }
    }

    set({
      totalCombatsWon: s.totalCombatsWon + 1,
      bossesDefeated: Array.from(newBosses),
    });

    get().checkAchievements();
    get().saveAchievements();
  },

  recordEventCompleted: () => {
    set((s) => ({
      totalEventsCompleted: s.totalEventsCompleted + 1,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  recordChoiceMade: () => {
    set((s) => ({
      choicesMade: s.choicesMade + 1,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  recordCardsCollected: (count) => {
    set((s) => ({
      totalCardsCollected: s.totalCardsCollected + count,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  recordRelicsCollected: (count) => {
    set((s) => ({
      totalRelicsCollected: s.totalRelicsCollected + count,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  recordGoldEarned: (amount) => {
    set((s) => ({
      totalGoldEarned: s.totalGoldEarned + amount,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  recordBreakthrough: (realm) => {
    const s = get();
    const newRealms = new Set(s.cultivationRealmsReached);
    newRealms.add(realm);

    set({
      totalBreakthroughs: s.totalBreakthroughs + 1,
      cultivationRealmsReached: Array.from(newRealms),
    });

    get().checkAchievements();
    get().saveAchievements();
  },

  recordTagUnlocked: (tagId) => {
    const s = get();
    if (s.tagsUnlocked.includes(tagId)) return;

    set({
      tagsUnlocked: [...s.tagsUnlocked, tagId],
    });
    get().checkAchievements();
    get().saveAchievements();
  },

  recordNPCRelationship: () => {
    set((s) => ({
      npcRelationships: s.npcRelationships + 1,
    }));
    get().checkAchievements();
    get().saveAchievements();
  },

  clearNewAchievements: () => {
    set({ newAchievements: [] });
  },

  getUnlockedCount: () => {
    return get().unlockedAchievements.length;
  },

  getTotalCount: () => {
    return ACHIEVEMENTS.length;
  },

  getProgressForAchievement: (achievementId) => {
    const s = get();
    const achievement = getAchievementById(achievementId);
    if (!achievement) return 0;

    const checkState = s.getCheckState();
    if (achievement.progress) {
      return achievement.progress(checkState);
    }
    return 0;
  },

  getMaxProgressForAchievement: (achievementId) => {
    const achievement = getAchievementById(achievementId);
    return achievement?.maxProgress || 1;
  },

  isAchievementUnlocked: (achievementId) => {
    const s = get();
    return s.unlockedAchievements.some((ua) => ua.achievementId === achievementId);
  },
}));

export default useAchievementStore;
export { ACHIEVEMENTS };
