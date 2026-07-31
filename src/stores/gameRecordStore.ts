import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type { GameRecord, GameState, PlayerAttributes, CultivationRealm } from '../types/simulation';
import useBondStore from './bondStore';

const STORAGE_KEY = 'game_records_v1';
const storageService = StorageService.getInstance();

interface GameRecordState {
  records: GameRecord[];
  isLoading: boolean;
  loadRecords: () => Promise<void>;
  saveRecord: (gameState: GameState) => Promise<GameRecord>;
  deleteRecord: (id: string) => Promise<void>;
  clearAllRecords: () => Promise<void>;
  getRecord: (id: string) => GameRecord | undefined;
}

function calculateLifeEvaluation(
  attributes: PlayerAttributes,
  age: number,
  cultivation: GameState['cultivation'],
  gold: number,
  relicsCount: number,
  successRate: number,
  totalChoices: number
): { score: number; title: string; titleIcon: string; evaluations: string[] } {
  let score = 0;
  const evaluations: string[] = [];

  const totalAttrs = Object.values(attributes).reduce((a, b) => a + b, 0);

  if (totalAttrs >= 500) {
    score += 30;
    evaluations.push('属性超群');
  } else if (totalAttrs >= 400) {
    score += 20;
    evaluations.push('属性优秀');
  } else if (totalAttrs >= 300) {
    score += 10;
    evaluations.push('属性良好');
  }

  if (age >= 100) {
    score += 30;
    evaluations.push('百岁人瑞');
  } else if (age >= 80) {
    score += 20;
    evaluations.push('长寿安康');
  } else if (age >= 60) {
    score += 10;
    evaluations.push('安享天年');
  }

  if (cultivation) {
    const realmScores: Record<string, number> = {
      mortal: 0,
      qi_refining: 5,
      foundation: 10,
      golden_core: 15,
      nascent: 20,
      spirit: 25,
      void: 30,
      integration: 35,
      mahayana: 40,
      tribulation: 50,
    };
    const realmScore = realmScores[cultivation.realm] || 0;
    score += realmScore;
    if (realmScore > 0) {
      evaluations.push(`修仙${cultivation.realm}`);
    }
  }

  if (successRate >= 80 && totalChoices >= 10) {
    score += 15;
    evaluations.push('顺风顺水');
  }

  if (gold >= 500) {
    score += 10;
    evaluations.push('富甲一方');
  } else if (gold >= 200) {
    score += 5;
    evaluations.push('小有积蓄');
  }

  if (relicsCount >= 10) {
    score += 10;
    evaluations.push('收藏家');
  }

  let title = '平凡一生';
  let titleIcon = '🌱';
  if (score >= 100) {
    title = '传奇人生';
    titleIcon = '👑';
  } else if (score >= 80) {
    title = '辉煌人生';
    titleIcon = '⭐';
  } else if (score >= 60) {
    title = '精彩人生';
    titleIcon = '🌟';
  } else if (score >= 40) {
    title = '充实人生';
    titleIcon = '✨';
  } else if (score >= 20) {
    title = '普通人生';
    titleIcon = '📖';
  }

  return { score, title, titleIcon, evaluations };
}

const useGameRecordStore = create<GameRecordState>((set, get) => ({
  records: [],
  isLoading: false,

  loadRecords: async () => {
    set({ isLoading: true });
    try {
      const data = await storageService.loadData<GameRecord[]>(STORAGE_KEY);
      if (data) {
        const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        set({ records: sorted });
      }
    } catch (e) {
      console.error('加载游戏记录失败:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveRecord: async (gameState: GameState) => {
    const bondStore = useBondStore.getState();
    const bondActiveGroups = bondStore.activeBondGroups;
    const bondActiveTiers = bondStore.activeBondTiers;
    const bondStats = bondStore.getCollectionStats();

    const successChoices = gameState.choiceHistory.filter((c) => c.success).length;
    const totalChoices = gameState.choiceHistory.length;
    const successRate = totalChoices > 0 ? Math.round((successChoices / totalChoices) * 100) : 0;

    const totalAttributeGain = Object.keys(gameState.attributes).reduce((sum, key) => {
      const attr = key as keyof PlayerAttributes;
      return sum + Math.max(0, gameState.attributes[attr] - gameState.baseAttributes[attr]);
    }, 0);

    const evaluation = calculateLifeEvaluation(
      gameState.attributes,
      gameState.age,
      gameState.cultivation,
      gameState.gold,
      gameState.relics.length,
      successRate,
      totalChoices
    );

    const record: GameRecord = {
      id: generateId(),
      birthYear: gameState.birthYear || 1950,
      deathYear: (gameState.birthYear || 1950) + gameState.age,
      age: gameState.age,
      maxLifespan: gameState.maxLifespan,
      mode: gameState.mode,
      cultivationRealm: gameState.cultivation?.realm as CultivationRealm | undefined,
      finalAttributes: { ...gameState.attributes },
      baseAttributes: { ...gameState.baseAttributes },
      totalAttributeGain,
      deckSize: gameState.deck.length,
      relicsCount: gameState.relics.length,
      gold: gameState.gold,
      totalChoices,
      successChoices,
      successRate,
      title: evaluation.title,
      titleIcon: evaluation.titleIcon,
      score: evaluation.score,
      evaluations: evaluation.evaluations,
      bondCardCount: bondStats.unique,
      bondGroupCount: bondActiveGroups.length,
      bondTotalTier: Object.values(bondActiveTiers).reduce((a: number, b: number) => a + b, 0),
      createdAt: new Date().toISOString(),
      gameState: { ...gameState },
    };

    const currentRecords = get().records;
    const newRecords = [record, ...currentRecords];
    set({ records: newRecords });

    try {
      await storageService.saveData(STORAGE_KEY, newRecords);
    } catch (e) {
      console.error('保存游戏记录失败:', e);
    }

    return record;
  },

  deleteRecord: async (id: string) => {
    const currentRecords = get().records;
    const newRecords = currentRecords.filter((r) => r.id !== id);
    set({ records: newRecords });

    try {
      await storageService.saveData(STORAGE_KEY, newRecords);
    } catch (e) {
      console.error('删除游戏记录失败:', e);
    }
  },

  clearAllRecords: async () => {
    set({ records: [] });
    try {
      await storageService.removeData(STORAGE_KEY);
    } catch (e) {
      console.error('清空游戏记录失败:', e);
    }
  },

  getRecord: (id: string) => {
    return get().records.find((r) => r.id === id);
  },
}));

export default useGameRecordStore;
