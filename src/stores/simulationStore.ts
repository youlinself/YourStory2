import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import type {
  GameState,
  BirthYear,
  PlayerAttributes,
  GameEvent,
  EventOption,
  ChoiceRecord,
  LifeRecord,
  WorldState,
  EraDefinition,
  GamePhase,
} from '../types/simulation';
import { ERAS, HIDDEN_TAGS } from '../data/simulationData';

// ------------------------------------------
// 初始状态
// ------------------------------------------
const storageService = StorageService.getInstance();
const STORAGE_KEY = 'simulation_game';

const initialWorldState: WorldState = {
  industryEvolution: {},
  socialClimate: 50,
  techProgress: 30,
  customEvents: [],
};

const initialAttributes: PlayerAttributes = {
  energy: 50,
  physique: 50,
  health: 50,
  iq: 50,
  eq: 50,
  wealth: 30,
  network: 30,
  fame: 10,
};

const initialState: GameState = {
  phase: 'setup',
  birthYear: null,
  currentYear: 1950,
  currentEra: 0,
  age: 0,
  remainingLife: 70,
  attributes: { ...initialAttributes },
  hiddenTags: [],
  npcs: [],
  choiceHistory: [],
  lifeRecords: [],
  availableEvents: [],
  worldState: { ...initialWorldState },
  seed: Date.now(),
};

// ------------------------------------------
// 辅助函数
// ------------------------------------------
function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ------------------------------------------
// Store 定义
// ------------------------------------------
interface SimulationState extends GameState {
  // 核心操作
  startGame: (birthYear: BirthYear) => void;
  makeChoice: (event: GameEvent, option: EventOption) => void;
  advanceEra: () => void;
  endGame: () => void;
  resetGame: () => void;

  // 数据持久化
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;

  // 计算属性
  getSuccessRate: (option: EventOption) => number;
  getAvailableEvents: () => GameEvent[];
  getEraDefinition: () => EraDefinition | undefined;
  checkHiddenTags: () => string[];
}

const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialState,

  // ------------------------------------------
  // 开始游戏
  // ------------------------------------------
  startGame: (birthYear: BirthYear) => {
    const era = ERAS.find((e) => e.year === birthYear);
    if (!era) return;

    const rand = seededRandom(Date.now());
    const [minWealth, maxWealth] = era.initialWealthRange;
    const [minNetwork, maxNetwork] = era.initialNetworkRange;

    const newAttributes: PlayerAttributes = {
      ...initialAttributes,
      wealth: Math.floor(minWealth + rand() * (maxWealth - minWealth)),
      network: Math.floor(minNetwork + rand() * (maxNetwork - minNetwork)),
      health: Math.floor(50 + rand() * 20),
      energy: Math.floor(60 + rand() * 20),
      physique: Math.floor(40 + rand() * 30),
      iq: Math.floor(40 + rand() * 30),
      eq: Math.floor(40 + rand() * 30),
    };

    set({
      phase: 'playing',
      birthYear,
      currentYear: birthYear,
      currentEra: 0,
      age: 0,
      remainingLife: era.baseLifeExpectancy,
      attributes: newAttributes,
      hiddenTags: [],
      npcs: [],
      choiceHistory: [],
      lifeRecords: [],
      availableEvents: [],
      worldState: { ...initialWorldState },
      seed: Date.now(),
    });

    get().saveGame();
  },

  // ------------------------------------------
  // 做出选择
  // ------------------------------------------
  makeChoice: (event: GameEvent, option: EventOption) => {
    const state = get();
    const successRate = state.getSuccessRate(option);
    const rand = Math.random();
    const isSuccess = rand <= successRate;

    const outcome = isSuccess ? option.successOutcome : option.failureOutcome;
    const newAttrs = { ...state.attributes };

    // 应用属性变化
    const attributeChanges: { attr: keyof PlayerAttributes; oldValue: number; newValue: number; reason: string; timestamp: number }[] = [];
    for (const [key, value] of Object.entries(outcome.attributeChanges)) {
      const attr = key as keyof PlayerAttributes;
      const oldValue = newAttrs[attr];
      const newValue = clamp(oldValue + (value || 0));
      newAttrs[attr] = newValue;
      attributeChanges.push({
        attr,
        oldValue,
        newValue,
        reason: outcome.description,
        timestamp: Date.now(),
      });
    }

    // 应用生命值消耗
    let newRemainingLife = state.remainingLife;
    if (outcome.lifeCost) {
      newRemainingLife = Math.max(0, newRemainingLife - outcome.lifeCost);
    }

    // 更新NPC关系
    const newNpcs = state.npcs.map((npc) => {
      const relChange = outcome.npcRelationshipChanges?.find((r) => r.npcId === npc.id);
      if (relChange) {
        return { ...npc, relationship: clamp(npc.relationship + relChange.delta, -100, 100) };
      }
      return npc;
    });

    // 记录选择
    const choiceRecord: ChoiceRecord = {
      era: state.currentEra,
      year: state.currentYear,
      eventId: event.id,
      optionId: option.id,
      success: isSuccess,
      timestamp: Date.now(),
      description: `${event.title} - ${option.text} (${isSuccess ? '成功' : '失败'})`,
    };

    // 记录人生
    const lifeRecord: LifeRecord = {
      id: generateId(),
      era: state.currentEra,
      year: state.currentYear,
      title: event.title,
      content: outcome.description,
      attributeChanges,
      timestamp: Date.now(),
    };

    // 更新世界状态
    const newWorldState = { ...state.worldState };
    if (event.isMilestone && isSuccess) {
      newWorldState.customEvents.push(outcome.description);
    }

    // 检查游戏是否结束
    let newPhase: GamePhase = state.phase;
    if (newRemainingLife <= 0 || newAttrs.health <= 0) {
      newPhase = 'ended';
    }

    set({
      attributes: newAttrs,
      remainingLife: newRemainingLife,
      npcs: newNpcs,
      choiceHistory: [...state.choiceHistory, choiceRecord],
      lifeRecords: [...state.lifeRecords, lifeRecord],
      worldState: newWorldState,
      phase: newPhase,
    });

    // 检查隐藏标签
    const newTags = state.checkHiddenTags();
    if (newTags.length > state.hiddenTags.length) {
      set({ hiddenTags: newTags });
    }

    get().saveGame();
  },

  // ------------------------------------------
  // 进入下一个时代
  // ------------------------------------------
  advanceEra: () => {
    const state = get();
    const nextEra = state.currentEra + 1;
    const nextYear = (state.birthYear || 1950) + nextEra * 10;

    // 年龄增长，生命值自然衰减
    const ageIncrease = 10;
    const lifeDecrease = Math.floor(5 + Math.random() * 5);

    set({
      currentEra: nextEra,
      currentYear: nextYear,
      age: state.age + ageIncrease,
      remainingLife: Math.max(0, state.remainingLife - lifeDecrease),
      phase: 'playing',
    });

    get().saveGame();
  },

  // ------------------------------------------
  // 结束游戏
  // ------------------------------------------
  endGame: () => {
    set({ phase: 'ended' });
    get().saveGame();
  },

  // ------------------------------------------
  // 重置游戏
  // ------------------------------------------
  resetGame: () => {
    set({ ...initialState });
    storageService.removeData(STORAGE_KEY);
  },

  // ------------------------------------------
  // 保存/加载
  // ------------------------------------------
  saveGame: async () => {
    const state = get();
    try {
      await storageService.saveData(STORAGE_KEY, {
        phase: state.phase,
        birthYear: state.birthYear,
        currentYear: state.currentYear,
        currentEra: state.currentEra,
        age: state.age,
        remainingLife: state.remainingLife,
        attributes: state.attributes,
        hiddenTags: state.hiddenTags,
        npcs: state.npcs,
        choiceHistory: state.choiceHistory,
        lifeRecords: state.lifeRecords,
        worldState: state.worldState,
        seed: state.seed,
      });
    } catch (error) {
      console.error('保存游戏失败:', error);
    }
  },

  loadGame: async () => {
    try {
      const data = await storageService.loadData<Partial<GameState>>(STORAGE_KEY);
      if (data && data.birthYear) {
        set({ ...data });
      }
    } catch (error) {
      console.error('加载游戏失败:', error);
    }
  },

  // ------------------------------------------
  // 计算成功率
  // ------------------------------------------
  getSuccessRate: (option: EventOption) => {
    const state = get();
    const weights = option.successRate;
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const attr = key as keyof PlayerAttributes;
      weightedSum += state.attributes[attr] * (weight || 0);
      totalWeight += weight || 0;
    }

    const baseRate = totalWeight > 0 ? weightedSum / totalWeight / 100 : 0.5;

    // 隐藏标签加成
    let tagBonus = 0;
    if (option.tagModifier && state.hiddenTags.includes(option.tagModifier.tag)) {
      tagBonus = option.tagModifier.rateBonus;
    }

    return clamp(baseRate + tagBonus, 0.05, 0.95);
  },

  // ------------------------------------------
  // 获取可用事件
  // ------------------------------------------
  getAvailableEvents: () => {
    const state = get();
    return state.availableEvents.filter(
      (event) => !event.triggerCondition || event.triggerCondition(state)
    );
  },

  // ------------------------------------------
  // 获取当前时代定义
  // ------------------------------------------
  getEraDefinition: () => {
    const state = get();
    return ERAS.find((e) => e.year === state.birthYear);
  },

  // ------------------------------------------
  // 检查隐藏标签
  // ------------------------------------------
  checkHiddenTags: () => {
    const state = get();
    const currentTags = new Set(state.hiddenTags);

    for (const tag of HIDDEN_TAGS) {
      if (!currentTags.has(tag.id) && tag.condition(state)) {
        currentTags.add(tag.id);
      }
    }

    return Array.from(currentTags);
  },
}));

export default useSimulationStore;
