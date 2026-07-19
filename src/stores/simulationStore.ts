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
  GameMode,
  GamePhase,
  LifeCard,
  LifeRelic,
  Enemy,
  CombatState,
  EraMap,
  MapNode,
  CultivationState,
  CultivationRealm,
  ShopState,
  AttributeChange,
} from '../types/simulation';
import {
  ERAS,
  HIDDEN_TAGS,
  STARTER_DECK,
  COMMON_ENEMIES,
  ELITE_ENEMIES,
  BOSS_ENEMIES,
  CULTIVATION_BOSSES,
  COMMON_RELICS,
  RARE_RELICS,
  LEGENDARY_CARDS,
  SCRIPT_1950_EVENTS,
} from '../data/simulationData';

// ------------------------------------------
// 常量
// ------------------------------------------
const storageService = StorageService.getInstance();
const STORAGE_KEY = 'simulation_game_v2';

const MAX_HAND_SIZE = 10;
const BASE_DRAW_COUNT = 5;
const BASE_ENERGY = 3;
const NODES_PER_ERA = 10;
const BRANCH_COUNT = 3;

// ------------------------------------------
// 初始状态
// ------------------------------------------
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

const initialCombatState: CombatState = {
  isInCombat: false,
  phase: 'player_turn',
  currentTurn: 0,
  player: {
    currentHealth: 50,
    maxHealth: 50,
    block: 0,
    energy: BASE_ENERGY,
    maxEnergy: BASE_ENERGY,
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    statusEffects: [],
  },
  enemies: [],
  currentEnemyIndex: 0,
  rewards: { cards: [], gold: 0 },
  log: [],
};

const initialCultivationState: CultivationState = {
  realm: 'mortal',
  maxLifespan: 70,
  tribulationThreshold: 0,
  realmBonus: {},
};

const initialState: GameState = {
  phase: 'setup',
  mode: 'normal',
  birthYear: null,
  currentYear: 1950,
  currentEra: 0,
  age: 0,
  maxLifespan: 70,
  remainingLife: 70,
  attributes: { ...initialAttributes },
  remainingAttributePoints: 15,
  hiddenTags: [],
  npcs: [],
  choiceHistory: [],
  lifeRecords: [],
  deck: [],
  relics: [],
  gold: 30,
  combat: { ...initialCombatState },
  currentMap: null,
  shop: null,
  cultivation: null,
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

function shuffle<T>(array: T[], rand: () => number = Math.random): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomItem<T>(array: T[], rand: () => number = Math.random): T {
  return array[Math.floor(rand() * array.length)];
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function applyCardEffect(
  effect: { type: string; value: number; duration?: number; attribute?: keyof PlayerAttributes },
  combat: CombatState,
  targetIndex: number
): CombatState {
  const newCombat = { ...combat };
  newCombat.player = { ...combat.player };
  newCombat.enemies = combat.enemies.map((e) => ({ ...e, statusEffects: [...e.statusEffects] }));

  const target = newCombat.enemies[targetIndex];

  switch (effect.type) {
    case 'damage': {
      if (target) {
        const damage = effect.value;
        const actualDamage = Math.max(0, damage - target.block);
        target.block = Math.max(0, target.block - damage);
        target.currentHealth -= actualDamage;
      }
      break;
    }
    case 'block':
      newCombat.player.block += effect.value;
      break;
    case 'heal':
      newCombat.player.currentHealth = Math.min(
        newCombat.player.maxHealth,
        newCombat.player.currentHealth + effect.value
      );
      break;
    case 'draw':
      for (let i = 0; i < effect.value; i++) {
        if (newCombat.player.drawPile.length > 0 && newCombat.player.hand.length < MAX_HAND_SIZE) {
          newCombat.player.hand.push(newCombat.player.drawPile.shift()!);
        }
      }
      break;
    case 'gain_energy':
      newCombat.player.energy += effect.value;
      break;
    case 'vulnerable':
      if (target) {
        const existing = target.statusEffects.find((s) => s.type === 'vulnerable');
        if (existing) existing.value += effect.value;
        else target.statusEffects.push({ type: 'vulnerable', value: effect.value, duration: effect.duration || 2 });
      }
      break;
    case 'weak':
      if (target) {
        const existing = target.statusEffects.find((s) => s.type === 'weak');
        if (existing) existing.value += effect.value;
        else target.statusEffects.push({ type: 'weak', value: effect.value, duration: effect.duration || 2 });
      }
      break;
    case 'poison':
      if (target) {
        const existing = target.statusEffects.find((s) => s.type === 'poison');
        if (existing) existing.value += effect.value;
        else target.statusEffects.push({ type: 'poison', value: effect.value, duration: effect.duration || 3 });
      }
      break;
    case 'cure':
      newCombat.player.statusEffects = newCombat.player.statusEffects.filter(
        (s) => s.type !== 'weak' && s.type !== 'vulnerable' && s.type !== 'poison'
      );
      break;
    case 'shield':
      newCombat.player.statusEffects.push({ type: 'shields', value: effect.value, duration: 99 });
      break;
    case 'thorns':
      newCombat.player.statusEffects.push({ type: 'thorns', value: effect.value, duration: effect.duration || 99 });
      break;
    case 'rage':
      newCombat.player.statusEffects.push({ type: 'rage', value: effect.value, duration: effect.duration || 99 });
      break;
    case 'strength':
      newCombat.player.statusEffects.push({ type: 'strength', value: effect.value, duration: effect.duration || 99 });
      break;
    case 'dexterity':
      newCombat.player.statusEffects.push({ type: 'dexterity', value: effect.value, duration: effect.duration || 99 });
      break;
    case 'regen':
      newCombat.player.statusEffects.push({ type: 'regen', value: effect.value, duration: effect.duration || 99 });
      break;
    case 'lifesteal':
      if (target && effect.value) {
        newCombat.player.currentHealth = Math.min(
          newCombat.player.maxHealth,
          newCombat.player.currentHealth + Math.floor(effect.value * 0.5)
        );
      }
      break;
  }

  return newCombat;
}

// ------------------------------------------
// Store 定义
// ------------------------------------------
interface SimulationState extends GameState {
  // 游戏流程
  selectMode: (mode: GameMode) => void;
  startGame: (birthYear: BirthYear) => void;
  allocateAttribute: (attr: keyof PlayerAttributes, value: number) => void;
  confirmAllocation: () => void;
  generateMap: () => void;
  moveToNode: (nodeId: string) => void;
  enterNode: () => void;
  completeNode: () => void;
  advanceEra: () => void;
  endGame: () => void;
  resetGame: () => void;

  // 战斗
  startCombat: (enemies: Enemy[]) => void;
  playCard: (cardId: string, targetIndex?: number) => void;
  endTurn: () => void;
  selectCardReward: (cardId: string) => void;
  endCombat: (victory: boolean) => void;

  // 事件
  makeChoice: (event: GameEvent, option: EventOption) => void;

  // 商店
  generateShop: () => void;
  buyShopItem: (index: number) => void;
  refreshShop: () => void;

  // 休息
  rest: () => void;

  // 宝藏
  collectTreasure: (node: MapNode) => void;

  // 修仙
  attemptBreakthrough: () => void;

  // 存档
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;

  // 计算属性
  getSuccessRate: (option: EventOption) => number;
  getAvailableEvents: () => GameEvent[];
  getEraDefinition: () => (typeof ERAS)[number] | undefined;
  checkHiddenTags: () => string[];
  getEffectiveMaxHealth: () => number;
  getDrawCount: () => number;
  getEnergy: () => number;
  getShopDiscount: () => number;
  getEnemiesForNode: (node: MapNode) => Enemy[];
}

const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialState,

  // ==========================================
  // 游戏流程
  // ==========================================

  selectMode: (mode: GameMode) => {
    set({ mode, phase: 'setup' });
  },

  startGame: (birthYear: BirthYear) => {
    const era = ERAS.find((e) => e.year === birthYear);
    if (!era) return;

    const mode = get().mode;
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

    const starterDeck = STARTER_DECK.map((card) => ({ ...card, id: generateId() }));

    const state: Partial<GameState> = {
      phase: 'allocating',
      birthYear,
      currentYear: birthYear,
      currentEra: 0,
      age: 0,
      maxLifespan: era.baseLifeExpectancy,
      remainingLife: era.baseLifeExpectancy,
      attributes: newAttributes,
      remainingAttributePoints: era.attributePoints,
      hiddenTags: [],
      npcs: [],
      choiceHistory: [],
      lifeRecords: [],
      deck: starterDeck,
      relics: [],
      gold: 30,
      worldState: { ...initialWorldState },
      seed: Date.now(),
    };

    if (mode === 'endless') {
      state.cultivation = { ...initialCultivationState, maxLifespan: era.baseLifeExpectancy };
    }

    set(state as GameState);
    get().saveGame();
  },

  allocateAttribute: (attr: keyof PlayerAttributes, value: number) => {
    const state = get();
    const diff = value - state.attributes[attr];
    if (diff > state.remainingAttributePoints) return;
    if (value < 10 || value > 99) return;

    set({
      attributes: { ...state.attributes, [attr]: value },
      remainingAttributePoints: state.remainingAttributePoints - diff,
    });
  },

  confirmAllocation: () => {
    const state = get();
    if (state.remainingAttributePoints > 0) return;
    set({ phase: 'map_view' });
    get().generateMap();
  },

  // ==========================================
  // 地图生成
  // ==========================================

  generateMap: () => {
    const state = get();
    const era = state.currentEra;
    const rand = seededRandom(state.seed + era);

    const nodes: MapNode[] = [];

    for (let x = 0; x < NODES_PER_ERA; x++) {
      for (let y = 0; y < BRANCH_COUNT; y++) {
        const id = `node_${era}_${x}_${y}`;
        let type: MapNode['type'];

        if (x === 0) {
          type = 'start';
        } else if (x === NODES_PER_ERA - 1) {
          type = 'boss';
        } else {
          const roll = rand();
          if (roll < 0.3) type = 'combat';
          else if (roll < 0.45) type = 'elite';
          else if (roll < 0.55) type = 'event';
          else if (roll < 0.65) type = 'rest';
          else if (roll < 0.75) type = 'shop';
          else if (roll < 0.85) type = 'treasure';
          else type = 'mystery';
        }

        const connections: string[] = [];
        if (x < NODES_PER_ERA - 1) {
          const connCount = Math.floor(rand() * 3) + 1;
          const targets = [0, 1, 2].sort(() => rand() - 0.5).slice(0, connCount);
          targets.forEach((ty) => connections.push(`node_${era}_${x + 1}_${ty}`));
        }

        nodes.push({
          id,
          type,
          x,
          y,
          connections,
          isVisited: false,
          isAccessible: x === 0,
        });
      }
    }

    for (const node of nodes) {
      if (node.type === 'combat') {
        const enemyPool = [...COMMON_ENEMIES];
        if (era >= 1) enemyPool.push(...ELITE_ENEMIES.slice(0, 1));
        const enemy = deepClone(getRandomItem(enemyPool, rand));
        enemy.id = generateId();
        enemy.currentHealth = enemy.maxHealth;
        node.data = { enemyIds: [enemy.id] };
      } else if (node.type === 'elite') {
        const enemyPool = ELITE_ENEMIES.length > 0 ? ELITE_ENEMIES : COMMON_ENEMIES.slice(2);
        const enemy = deepClone(getRandomItem(enemyPool, rand));
        enemy.id = generateId();
        enemy.currentHealth = enemy.maxHealth;
        node.data = { enemyIds: [enemy.id] };
      } else if (node.type === 'boss') {
        const bossPool = state.mode === 'endless' ? [...BOSS_ENEMIES, ...CULTIVATION_BOSSES] : BOSS_ENEMIES;
        const boss = deepClone(getRandomItem(bossPool, rand));
        boss.id = generateId();
        boss.currentHealth = boss.maxHealth;
        node.data = { enemyIds: [boss.id] };
      } else if (node.type === 'event') {
        node.data = { eventId: `event_${era}_${node.x}` };
      } else if (node.type === 'treasure') {
        node.data = { relicId: getRandomItem(COMMON_RELICS, rand).id };
      }
    }

    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode) {
      startNode.isVisited = true;
      startNode.isAccessible = true;
      nodes.filter((n) => n.x === 1).forEach((n) => (n.isAccessible = true));
    }

    const map: EraMap = {
      era,
      nodes,
      currentNodeId: startNode?.id || nodes[0].id,
      completed: false,
    };

    set({ currentMap: map });
  },

  moveToNode: (nodeId: string) => {
    const state = get();
    if (!state.currentMap) return;

    const node = state.currentMap.nodes.find((n) => n.id === nodeId);
    if (!node || !node.isAccessible) return;

    set({
      currentMap: {
        ...state.currentMap,
        currentNodeId: nodeId,
      },
    });
  },

  enterNode: () => {
    const state = get();
    if (!state.currentMap) return;

    const node = state.currentMap.nodes.find((n) => n.id === state.currentMap!.currentNodeId);
    if (!node) return;

    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss': {
        const enemies = get().getEnemiesForNode(node);
        if (enemies.length > 0) {
          get().startCombat(enemies);
        }
        break;
      }
      case 'event':
        set({ phase: 'event' });
        break;
      case 'shop':
        get().generateShop();
        break;
      case 'rest':
        set({ phase: 'rest' });
        break;
      case 'treasure':
        get().collectTreasure(node);
        break;
      default:
        break;
    }
  },

  getEnemiesForNode: (node: MapNode): Enemy[] => {
    const state = get();
    const enemies: Enemy[] = [];

    if (node.data?.enemyIds) {
      for (const enemyId of node.data.enemyIds) {
        const enemy = state.combat.enemies.find((e) => e.id === enemyId);
        if (enemy) enemies.push(deepClone(enemy));
      }
    }

    return enemies;
  },

  completeNode: () => {
    const state = get();
    if (!state.currentMap) return;

    const nodeIndex = state.currentMap.nodes.findIndex((n) => n.id === state.currentMap!.currentNodeId);
    if (nodeIndex === -1) return;

    const node = state.currentMap.nodes[nodeIndex];
    node.isVisited = true;

    if (node.connections.length > 0) {
      for (const connId of node.connections) {
        const connNode = state.currentMap.nodes.find((n) => n.id === connId);
        if (connNode) {
          connNode.isAccessible = true;
        }
      }
    }

    if (node.type === 'boss') {
      state.currentMap.completed = true;
    }

    set({
      currentMap: { ...state.currentMap },
      phase: 'map_view',
    });
  },

  collectTreasure: (_node: MapNode) => {
    const state = get();
    const rand = seededRandom(state.seed + Date.now());

    const goldFound = Math.floor(20 + rand() * 50);

    const relicRoll = rand();
    let relic: LifeRelic | undefined;
    if (relicRoll < 0.5) relic = deepClone(getRandomItem(COMMON_RELICS, rand));
    else if (relicRoll < 0.8) relic = deepClone(getRandomItem(RARE_RELICS, rand));
    else relic = deepClone(getRandomItem(LEGENDARY_CARDS as unknown as LifeRelic[], rand));

    if (relic) relic.id = generateId();

    const newRelics = [...state.relics];
    if (relic) newRelics.push(relic);

    set({ gold: state.gold + goldFound, relics: newRelics });
    get().completeNode();
  },

  advanceEra: () => {
    const state = get();
    const nextEra = state.currentEra + 1;
    const nextYear = (state.birthYear || 1950) + nextEra * 10;
    const lifeDecrease = Math.floor(5 + Math.random() * 5);

    const newTags = get().checkHiddenTags();
    let newLife = Math.max(0, state.remainingLife - lifeDecrease);
    let newPhase: GamePhase = 'map_view';

    if (newLife <= 0 || state.attributes.health <= 0) {
      newPhase = 'ended';
    }

    set({
      currentEra: nextEra,
      currentYear: nextYear,
      age: state.age + 10,
      remainingLife: newLife,
      hiddenTags: newTags,
      phase: newPhase,
      currentMap: null,
      combat: { ...initialCombatState },
      shop: null,
    });

    if (newPhase === 'map_view') {
      get().generateMap();
    }
  },

  endGame: () => {
    set({ phase: 'ended' });
    get().saveGame();
  },

  resetGame: () => {
    set({ ...initialState });
    storageService.removeData(STORAGE_KEY);
  },

  // ==========================================
  // 战斗系统
  // ==========================================

  startCombat: (enemies: Enemy[]) => {
    const state = get();
    const maxHealth = get().getEffectiveMaxHealth();

    const drawPile = shuffle(state.deck);
    const initialHand = drawPile.splice(0, Math.min(BASE_DRAW_COUNT + get().getDrawCount(), drawPile.length));

    const combatState: CombatState = {
      isInCombat: true,
      phase: 'player_turn',
      currentTurn: 1,
      player: {
        currentHealth: state.combat.isInCombat ? state.combat.player.currentHealth : maxHealth,
        maxHealth,
        block: 0,
        energy: get().getEnergy(),
        maxEnergy: get().getEnergy(),
        hand: initialHand,
        drawPile,
        discardPile: [],
        exhaustPile: [],
        statusEffects: [],
      },
      enemies: enemies.map((e) => ({
        ...e,
        id: generateId(),
        currentHealth: e.maxHealth,
        block: 0,
        statusEffects: [],
        currentIntentIndex: 0,
      })),
      currentEnemyIndex: 0,
      rewards: { cards: [], gold: 0 },
      log: [],
    };

    set({ combat: combatState, phase: 'combat' });
  },

  playCard: (cardId: string, targetIndex: number = 0) => {
    const state = get();
    const { combat } = state;
    if (combat.phase !== 'player_turn') return;

    const cardIndex = combat.player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = combat.player.hand[cardIndex];
    if (card.cost > combat.player.energy) return;

    let newCombat = { ...combat };
    newCombat.player = { ...combat.player };
    newCombat.player.hand = [...combat.player.hand];
    newCombat.player.hand.splice(cardIndex, 1);
    newCombat.player.energy -= card.cost;

    if (newCombat.player.drawPile.length < newCombat.player.hand.length + 5) {
      newCombat.player.drawPile = shuffle([
        ...newCombat.player.drawPile,
        ...newCombat.player.discardPile,
      ]);
      newCombat.player.discardPile = [];
    }

    for (const effect of card.effects) {
      newCombat = applyCardEffect(effect, newCombat, targetIndex);
    }

    newCombat.player.discardPile.push(card);

    set({ combat: newCombat });
  },

  endTurn: () => {
    const state = get();
    let { combat } = state;
    if (combat.phase !== 'player_turn') return;

    combat.player.block = 0;
    combat.player.energy = combat.player.maxEnergy;

    combat.player.discardPile.push(...combat.player.hand);
    combat.player.hand = [];

    for (const enemy of combat.enemies) {
      if (enemy.currentHealth <= 0) continue;

      const intent = enemy.intents[enemy.currentIntentIndex % enemy.intents.length];

      if (intent.type === 'attack') {
        let damage = intent.damage;
        const hits = intent.hits || 1;

        const strength = enemy.statusEffects.find((s) => s.type === 'strength');
        if (strength) damage += strength.value;

        const weak = enemy.statusEffects.find((s) => s.type === 'weak');
        if (weak) damage = Math.floor(damage * 0.75);

        for (let i = 0; i < hits; i++) {
          const totalDamage = Math.max(0, damage - combat.player.block);
          combat.player.block = Math.max(0, combat.player.block - damage);
          combat.player.currentHealth -= totalDamage;

          const thorns = combat.player.statusEffects.find((s) => s.type === 'thorns');
          if (thorns && enemy.currentHealth > 0) {
            enemy.currentHealth -= thorns.value;
          }

          const shields = combat.player.statusEffects.find((s) => s.type === 'shields');
          if (shields && shields.value > 0) {
            const absorb = Math.min(shields.value, totalDamage);
            shields.value -= absorb;
            combat.player.currentHealth += absorb;
          }
        }
      } else if (intent.type === 'defend') {
        enemy.block += intent.block;
      } else if (intent.type === 'buff') {
        const existing = enemy.statusEffects.find((s) => s.type === intent.effect);
        if (existing) existing.value += intent.value;
        else enemy.statusEffects.push({ type: intent.effect as any, value: intent.value, duration: 99 });
      } else if (intent.type === 'debuff') {
        combat.player.statusEffects.push({
          type: intent.effect as any,
          value: intent.value,
          duration: 2,
        });
      }

      enemy.currentIntentIndex = (enemy.currentIntentIndex + 1) % enemy.intents.length;
    }

    for (const effect of combat.player.statusEffects) {
      if (effect.type === 'poison') {
        combat.player.currentHealth -= effect.value;
      } else if (effect.type === 'regen') {
        combat.player.currentHealth = Math.min(combat.player.maxHealth, combat.player.currentHealth + effect.value);
      }
      effect.duration--;
    }
    combat.player.statusEffects = combat.player.statusEffects.filter((s) => s.duration > 0);

    if (combat.player.currentHealth <= 0) {
      combat.phase = 'defeat';
      set({ combat, phase: 'ended' });
      return;
    }

    if (combat.enemies.every((e) => e.currentHealth <= 0)) {
      combat.phase = 'victory';
      const totalGold = combat.enemies.reduce((sum, e) => {
        const [min, max] = e.goldReward;
        return sum + Math.floor(min + Math.random() * (max - min));
      }, 0);

      const rewardCards: LifeCard[] = combat.enemies.flatMap((e) => e.cardRewards).filter(Boolean);
      const relicReward = combat.enemies.find((e) => e.isBoss)?.relicReward;

      combat.rewards = {
        cards: rewardCards,
        gold: totalGold,
        relic: relicReward ? deepClone(relicReward) : undefined,
      };

      set({ combat, phase: 'reward' });
      return;
    }

    combat.currentTurn++;
    combat.phase = 'player_turn';

    const drawCount = BASE_DRAW_COUNT + get().getDrawCount();
    for (let i = 0; i < drawCount; i++) {
      if (combat.player.drawPile.length === 0) {
        combat.player.drawPile = shuffle(combat.player.discardPile);
        combat.player.discardPile = [];
      }
      if (combat.player.drawPile.length > 0 && combat.player.hand.length < MAX_HAND_SIZE) {
        combat.player.hand.push(combat.player.drawPile.shift()!);
      }
    }

    set({ combat });
  },

  endCombat: (victory: boolean) => {
    const state = get();

    if (victory) {
      const goldEarned = state.combat.rewards.gold;
      const relicReward = state.combat.rewards.relic;

      const newRelics = [...state.relics];
      if (relicReward) newRelics.push(relicReward);

      set({
        gold: state.gold + goldEarned,
        relics: newRelics,
      });

      if (state.combat.rewards.cards.length > 0) {
        set({ phase: 'reward' });
      } else {
        get().completeNode();
      }
    } else {
      set({ phase: 'ended' });
    }
  },

  selectCardReward: (cardId: string) => {
    const state = get();
    const card = state.combat.rewards.cards.find((c) => c.id === cardId);
    if (card) {
      const newCard = { ...deepClone(card), id: generateId() };
      set({ deck: [...state.deck, newCard] });
    }
    get().completeNode();
  },

  // ==========================================
  // 事件系统
  // ==========================================

  makeChoice: (event: GameEvent, option: EventOption) => {
    const state = get();
    const successRate = get().getSuccessRate(option);
    const rand = Math.random();
    const isSuccess = rand <= successRate;

    const outcome = isSuccess ? option.successOutcome : option.failureOutcome;
    const newAttrs = { ...state.attributes };
    const attributeChanges: AttributeChange[] = [];

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

    let newRemainingLife = state.remainingLife;
    if (outcome.lifeCost) newRemainingLife = Math.max(0, newRemainingLife - outcome.lifeCost);

    let newGold = state.gold;
    if (outcome.goldReward) newGold += outcome.goldReward;

    let newDeck = [...state.deck];
    if (outcome.cardRewards) {
      for (const card of outcome.cardRewards) {
        newDeck.push({ ...deepClone(card), id: generateId() });
      }
    }

    let newRelics = [...state.relics];
    if (outcome.relicRewards) {
      for (const relic of outcome.relicRewards) {
        newRelics.push(deepClone(relic));
      }
    }

    const choiceRecord: ChoiceRecord = {
      era: state.currentEra,
      year: state.currentYear,
      eventId: event.id,
      optionId: option.id,
      success: isSuccess,
      timestamp: Date.now(),
      description: `${event.title} - ${option.text} (${isSuccess ? '成功' : '失败'})`,
    };

    const lifeRecord: LifeRecord = {
      id: generateId(),
      era: state.currentEra,
      year: state.currentYear,
      title: event.title,
      content: outcome.description,
      attributeChanges,
      timestamp: Date.now(),
    };

    const newWorldState = { ...state.worldState };
    if (event.isMilestone && isSuccess) {
      newWorldState.customEvents.push(outcome.description);
    }

    let newPhase = state.phase;
    if (newRemainingLife <= 0 || newAttrs.health <= 0) {
      newPhase = 'ended';
    }

    set({
      attributes: newAttrs,
      remainingLife: newRemainingLife,
      gold: newGold,
      deck: newDeck,
      relics: newRelics,
      choiceHistory: [...state.choiceHistory, choiceRecord],
      lifeRecords: [...state.lifeRecords, lifeRecord],
      worldState: newWorldState,
      phase: newPhase,
    });

    const newTags = get().checkHiddenTags();
    if (newTags.length > state.hiddenTags.length) set({ hiddenTags: newTags });

    if (newPhase !== 'ended') get().completeNode();
  },

  // ==========================================
  // 商店系统
  // ==========================================

  generateShop: () => {
    const state = get();
    const discount = get().getShopDiscount();
    const rand = seededRandom(state.seed + state.currentEra * 1000 + Date.now());

    const items: { card?: LifeCard; relic?: LifeRelic; price: number }[] = [];

    for (let i = 0; i < 3 + Math.floor(rand() * 2); i++) {
      const rarityRoll = rand();
      let pool: LifeCard[];
      if (rarityRoll < 0.6) pool = [...COMMON_ENEMIES.map((e) => e.cardRewards[0]).filter(Boolean) as LifeCard[]].slice(0, 5);
      else if (rarityRoll < 0.85) pool = [] as LifeCard[]; // rare cards placeholder
      else pool = LEGENDARY_CARDS;

      if (pool.length === 0) pool = LEGENDARY_CARDS;
      const card = deepClone(getRandomItem(pool, rand));
      card.id = generateId();
      const price = clamp(card.rarity === 'legendary' ? 99 : card.rarity === 'rare' ? 50 : 25, 10, 999);
      items.push({ card, price });
    }

    for (let i = 0; i < 1 + Math.floor(rand() * 2); i++) {
      const pool = rand() < 0.7 ? COMMON_RELICS : RARE_RELICS;
      const relic = deepClone(getRandomItem(pool, rand));
      relic.id = generateId();
      const price = clamp(relic.rarity === 'rare' ? 150 : 80, 20, 999);
      items.push({ relic, price });
    }

    const shop: ShopState = {
      items: items.map((item) => ({
        ...item,
        price: Math.floor(item.price * (1 - discount)),
        isPurchased: false,
      })),
      refreshCost: 25,
      era: state.currentEra,
    };

    set({ shop, phase: 'shop' });
  },

  buyShopItem: (index: number) => {
    const state = get();
    if (!state.shop) return;

    const item = state.shop.items[index];
    if (!item || item.isPurchased) return;
    if (state.gold < item.price) return;

    let newDeck = [...state.deck];
    let newRelics = [...state.relics];

    if (item.card) {
      newDeck.push({ ...deepClone(item.card), id: generateId() });
    }
    if (item.relic) {
      newRelics.push({ ...deepClone(item.relic), id: generateId() });
    }

    const newItems = [...state.shop.items];
    newItems[index] = { ...item, isPurchased: true };

    set({
      gold: state.gold - item.price,
      deck: newDeck,
      relics: newRelics,
      shop: { ...state.shop, items: newItems },
    });
  },

  refreshShop: () => {
    const state = get();
    if (!state.shop || state.gold < state.shop.refreshCost) return;
    set({ gold: state.gold - state.shop.refreshCost });
    get().generateShop();
  },

  // ==========================================
  // 休息
  // ==========================================

  rest: () => {
    const state = get();
    set({
      combat: {
        ...state.combat,
        player: {
          ...state.combat.player,
          currentHealth: Math.min(
            state.combat.player.maxHealth,
            state.combat.player.currentHealth + Math.floor(state.combat.player.maxHealth * 0.3)
          ),
        },
      },
      remainingLife: Math.max(0, state.remainingLife - 1),
    });
    get().completeNode();
  },

  // ==========================================
  // 修仙系统
  // ==========================================

  attemptBreakthrough: () => {
    const state = get();
    if (!state.cultivation) return;

    const current = state.cultivation.realm;
    const realms: CultivationRealm[] = [
      'mortal', 'qi_refining', 'foundation', 'golden_core', 'nascent',
      'spirit', 'void', 'integration', 'mahayana', 'tribulation',
    ];
    const currentIndex = realms.indexOf(current);
    if (currentIndex >= realms.length - 1) return;

    const nextRealm = realms[currentIndex + 1];
    const totalAttrs = Object.values(state.attributes).reduce((a, b) => a + b, 0);

    if (totalAttrs < 100 * (currentIndex + 1)) {
      return;
    }

    const nextBoss = CULTIVATION_BOSSES.find((b) => b.id === nextRealm);
    if (nextBoss) {
      const boss = deepClone(nextBoss);
      boss.id = generateId();
      boss.currentHealth = boss.maxHealth;
      get().startCombat([boss]);
      set({
        cultivation: {
          ...state.cultivation,
          realm: nextRealm,
          maxLifespan: state.maxLifespan + 20,
          tribulationThreshold: 100 * (currentIndex + 2),
          realmBonus: {
            iq: (state.cultivation.realmBonus.iq || 0) + 5,
            physique: (state.cultivation.realmBonus.physique || 0) + 5,
          },
        },
      });
    }
  },

  // ==========================================
  // 存档系统
  // ==========================================

  saveGame: async () => {
    const state = get();
    try {
      const saveData = {
        id: generateId(),
        gameState: {
          phase: state.phase,
          mode: state.mode,
          birthYear: state.birthYear,
          currentYear: state.currentYear,
          currentEra: state.currentEra,
          age: state.age,
          maxLifespan: state.maxLifespan,
          remainingLife: state.remainingLife,
          attributes: state.attributes,
          remainingAttributePoints: state.remainingAttributePoints,
          hiddenTags: state.hiddenTags,
          npcs: state.npcs,
          choiceHistory: state.choiceHistory,
          lifeRecords: state.lifeRecords,
          deck: state.deck,
          relics: state.relics,
          gold: state.gold,
          worldState: state.worldState,
          seed: state.seed,
          cultivation: state.cultivation,
        },
        updatedAt: new Date().toISOString(),
        isDead: false,
      };
      await storageService.saveData(STORAGE_KEY, saveData);
    } catch (error) {
      console.error('保存失败:', error);
    }
  },

  loadGame: async () => {
    try {
      const saveData = await storageService.loadData<any>(STORAGE_KEY);
      if (saveData && saveData.gameState && !saveData.isDead) {
        set(saveData.gameState);
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
  },

  // ==========================================
  // 计算属性
  // ==========================================

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
    let tagBonus = 0;
    if (option.tagModifier && state.hiddenTags.includes(option.tagModifier.tag)) {
      tagBonus = option.tagModifier.rateBonus;
    }

    return clamp(baseRate + tagBonus, 0.05, 0.95);
  },

  getAvailableEvents: () => {
    return SCRIPT_1950_EVENTS;
  },

  getEraDefinition: () => {
    const state = get();
    return ERAS.find((e) => e.year === state.birthYear);
  },

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

  getEffectiveMaxHealth: () => {
    const state = get();
    let maxHealth = state.attributes.health;
    for (const relic of state.relics) {
      for (const effect of relic.effects) {
        if (effect.type === 'max_health_bonus') maxHealth += effect.value;
      }
    }
    if (state.cultivation) {
      maxHealth += (state.cultivation.realmBonus.physique || 0) * 2;
    }
    return Math.max(30, maxHealth);
  },

  getDrawCount: () => {
    const state = get();
    let bonus = 0;
    for (const relic of state.relics) {
      for (const effect of relic.effects) {
        if (effect.type === 'card_draw_bonus') bonus += effect.value;
      }
    }
    return bonus;
  },

  getEnergy: () => {
    const state = get();
    let energy = BASE_ENERGY;
    for (const relic of state.relics) {
      for (const effect of relic.effects) {
        if (effect.type === 'energy_bonus') energy += effect.value;
      }
    }
    if (state.cultivation && state.cultivation.realm !== 'mortal') energy += 1;
    return energy;
  },

  getShopDiscount: () => {
    const state = get();
    let discount = 0;
    for (const relic of state.relics) {
      for (const effect of relic.effects) {
        if (effect.type === 'discount') discount += effect.value;
      }
    }
    return Math.min(0.5, discount);
  },
}));

export default useSimulationStore;
