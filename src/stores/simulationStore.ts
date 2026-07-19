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
  MapNode,
  CultivationState,
  CultivationRealm,
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

const storageService = StorageService.getInstance();
const STORAGE_KEY = 'simulation_game_v2';

const MAX_HAND_SIZE = 10;
const BASE_DRAW_COUNT = 5;
const BASE_ENERGY = 3;
const LAYERS_PER_ERA = 10;
const BRANCH_COUNT = 3;

const initialWorldState: WorldState = {
  industryEvolution: {},
  socialClimate: 50,
  techProgress: 30,
  customEvents: [],
};

const initialAttributes: PlayerAttributes = {
  energy: 50, physique: 50, health: 50, iq: 50,
  eq: 50, wealth: 30, network: 30, fame: 10,
};

const initialCombatState: CombatState = {
  isInCombat: false, phase: 'player_turn', currentTurn: 0,
  player: {
    currentHealth: 50, maxHealth: 50, block: 0,
    energy: BASE_ENERGY, maxEnergy: BASE_ENERGY,
    hand: [], drawPile: [], discardPile: [], exhaustPile: [], statusEffects: [],
  },
  enemies: [], currentEnemyIndex: 0,
  rewards: { cards: [], gold: 0 }, log: [],
};

const initialCultivationState: CultivationState = {
  realm: 'mortal', maxLifespan: 70, tribulationThreshold: 0, realmBonus: {},
};

const initialState: GameState = {
  phase: 'setup', mode: 'normal', birthYear: null, currentYear: 1950,
  currentEra: 0, age: 0, maxLifespan: 70, remainingLife: 70,
  attributes: { ...initialAttributes }, remainingAttributePoints: 15,
  hiddenTags: [], npcs: [], choiceHistory: [], lifeRecords: [],
  deck: [], relics: [], gold: 30,
  combat: { ...initialCombatState }, currentMap: null, shop: null,
  cultivation: null, worldState: { ...initialWorldState }, seed: Date.now(),
};

function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function shuffle<T>(arr: T[], rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pick<T>(arr: T[], rand = Math.random) { return arr[Math.floor(rand() * arr.length)]; }
function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

function applyEffect(effect: { type: string; value: number; duration?: number }, combat: CombatState, targetIdx: number): CombatState {
  const c = { ...combat, player: { ...combat.player }, enemies: combat.enemies.map(e => ({ ...e, statusEffects: [...e.statusEffects] })) };
  const t = c.enemies[targetIdx];
  switch (effect.type) {
    case 'damage': if (t) { const d = Math.max(0, effect.value - t.block); t.block = Math.max(0, t.block - effect.value); t.currentHealth -= d; } break;
    case 'block': c.player.block += effect.value; break;
    case 'heal': c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + effect.value); break;
    case 'draw': for (let i = 0; i < effect.value; i++) { if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!); } break;
    case 'gain_energy': c.player.energy += effect.value; break;
    case 'vulnerable': if (t) { const e = t.statusEffects.find(s => s.type === 'vulnerable'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'vulnerable', value: effect.value, duration: effect.duration || 2 }); } break;
    case 'weak': if (t) { const e = t.statusEffects.find(s => s.type === 'weak'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'weak', value: effect.value, duration: effect.duration || 2 }); } break;
    case 'poison': if (t) { const e = t.statusEffects.find(s => s.type === 'poison'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'poison', value: effect.value, duration: effect.duration || 3 }); } break;
    case 'cure': c.player.statusEffects = c.player.statusEffects.filter(s => s.type !== 'weak' && s.type !== 'vulnerable' && s.type !== 'poison'); break;
    case 'shield': c.player.statusEffects.push({ type: 'shields', value: effect.value, duration: 99 }); break;
    case 'thorns': c.player.statusEffects.push({ type: 'thorns', value: effect.value, duration: effect.duration || 99 }); break;
    case 'rage': c.player.statusEffects.push({ type: 'rage', value: effect.value, duration: effect.duration || 99 }); break;
    case 'strength': c.player.statusEffects.push({ type: 'strength', value: effect.value, duration: effect.duration || 99 }); break;
    case 'dexterity': c.player.statusEffects.push({ type: 'dexterity', value: effect.value, duration: effect.duration || 99 }); break;
    case 'regen': c.player.statusEffects.push({ type: 'regen', value: effect.value, duration: effect.duration || 99 }); break;
    case 'lifesteal': if (t && effect.value) c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + Math.floor(effect.value * 0.5)); break;
  }
  return c;
}

interface SimulationState extends GameState {
  selectMode: (mode: GameMode) => void;
  startGame: (birthYear: BirthYear) => void;
  allocateAttribute: (attr: keyof PlayerAttributes, value: number) => void;
  confirmAllocation: () => void;
  generateMap: () => void;
  selectNode: (nodeId: string) => void;
  enterNode: () => void;
  completeNode: () => void;
  advanceEra: () => void;
  endGame: () => void;
  resetGame: () => void;
  startCombat: (enemies: Enemy[]) => void;
  playCard: (cardId: string, targetIndex?: number) => void;
  endTurn: () => void;
  selectCardReward: (cardId: string) => void;
  endCombat: (victory: boolean) => void;
  makeChoice: (event: GameEvent, option: EventOption) => void;
  generateShop: () => void;
  buyShopItem: (index: number) => void;
  refreshShop: () => void;
  rest: () => void;
  collectTreasure: () => void;
  attemptBreakthrough: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
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

  selectMode: (mode) => set({ mode, phase: 'setup' }),

  startGame: (birthYear) => {
    const era = ERAS.find(e => e.year === birthYear);
    if (!era) return;
    const mode = get().mode;
    const rand = seededRandom(Date.now());
    const [minW, maxW] = era.initialWealthRange;
    const [minN, maxN] = era.initialNetworkRange;
    const attrs: PlayerAttributes = {
      ...initialAttributes,
      wealth: Math.floor(minW + rand() * (maxW - minW)),
      network: Math.floor(minN + rand() * (maxN - minN)),
      health: Math.floor(50 + rand() * 20), energy: Math.floor(60 + rand() * 20),
      physique: Math.floor(40 + rand() * 30), iq: Math.floor(40 + rand() * 30), eq: Math.floor(40 + rand() * 30),
    };
    const deck = STARTER_DECK.map(c => ({ ...c, id: generateId() }));
    const state: Partial<GameState> = {
      phase: 'allocating', birthYear, currentYear: birthYear, currentEra: 0, age: 0,
      maxLifespan: era.baseLifeExpectancy, remainingLife: era.baseLifeExpectancy,
      attributes: attrs, remainingAttributePoints: era.attributePoints,
      hiddenTags: [], npcs: [], choiceHistory: [], lifeRecords: [],
      deck, relics: [], gold: 30, worldState: { ...initialWorldState }, seed: Date.now(),
    };
    if (mode === 'endless') state.cultivation = { ...initialCultivationState, maxLifespan: era.baseLifeExpectancy };
    set(state as GameState);
    get().saveGame();
  },

  allocateAttribute: (attr, value) => {
    const s = get();
    const diff = value - s.attributes[attr];
    if (diff > s.remainingAttributePoints || value < 10 || value > 99) return;
    set({ attributes: { ...s.attributes, [attr]: value }, remainingAttributePoints: s.remainingAttributePoints - diff });
  },

  confirmAllocation: () => {
    if (get().remainingAttributePoints > 0) return;
    set({ phase: 'map_view' });
    get().generateMap();
  },

  // ========== 地图生成 ==========
  generateMap: () => {
    const s = get();
    const era = s.currentEra;
    const rand = seededRandom(s.seed + era);
    const nodes: MapNode[] = [];

    for (let x = 0; x < LAYERS_PER_ERA; x++) {
      for (let y = 0; y < BRANCH_COUNT; y++) {
        const id = `node_${era}_${x}_${y}`;
        let type: MapNode['type'];
        if (x === 0) type = 'start';
        else if (x === LAYERS_PER_ERA - 1) type = 'boss';
        else {
          const r = rand();
          if (r < 0.3) type = 'combat';
          else if (r < 0.45) type = 'elite';
          else if (r < 0.55) type = 'event';
          else if (r < 0.65) type = 'rest';
          else if (r < 0.75) type = 'shop';
          else if (r < 0.85) type = 'treasure';
          else type = 'mystery';
        }
        const connections: string[] = [];
        if (x < LAYERS_PER_ERA - 1) {
          for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny >= 0 && ny < BRANCH_COUNT) connections.push(`node_${era}_${x + 1}_${ny}`);
          }
        }
        nodes.push({ id, type, x, y, connections, isVisited: false, isAccessible: x === 0, isCurrent: false });
      }
    }

    for (const node of nodes) {
      if (node.type === 'combat') {
        const pool = [...COMMON_ENEMIES]; if (era >= 1) pool.push(...ELITE_ENEMIES.slice(0, 1));
        const e = deepClone(pick(pool, rand)); e.id = generateId(); e.currentHealth = e.maxHealth;
        node.data = { enemyIds: [e.id] };
      } else if (node.type === 'elite') {
        const pool = ELITE_ENEMIES.length > 0 ? ELITE_ENEMIES : COMMON_ENEMIES.slice(2);
        const e = deepClone(pick(pool, rand)); e.id = generateId(); e.currentHealth = e.maxHealth;
        node.data = { enemyIds: [e.id] };
      } else if (node.type === 'boss') {
        const pool = s.mode === 'endless' ? [...BOSS_ENEMIES, ...CULTIVATION_BOSSES] : BOSS_ENEMIES;
        const e = deepClone(pick(pool, rand)); e.id = generateId(); e.currentHealth = e.maxHealth;
        node.data = { enemyIds: [e.id] };
      } else if (node.type === 'event') {
        node.data = { eventId: `event_${era}_${node.x}` };
      } else if (node.type === 'treasure') {
        node.data = { relicId: pick(COMMON_RELICS, rand).id };
      }
    }

    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) { startNode.isVisited = true; startNode.isAccessible = true; startNode.isCurrent = true; }

    set({ currentMap: { era, nodes, currentNodeId: startNode?.id || nodes[0].id, currentLayer: 0, maxAccessibleLayer: 0, completed: false } });
  },

  // ========== 选择节点（限制只能选当前层）==========
  selectNode: (nodeId) => {
    const s = get();
    if (!s.currentMap) return;
    const node = s.currentMap.nodes.find(n => n.id === nodeId);
    if (!node || !node.isAccessible || node.isVisited) return;
    if (node.x !== s.currentMap.currentLayer) return;

    const newNodes = s.currentMap.nodes.map(n => ({
      ...n,
      isCurrent: n.id === nodeId,
    }));
    set({ currentMap: { ...s.currentMap, currentNodeId: nodeId, nodes: newNodes } });
  },

  enterNode: () => {
    const s = get();
    if (!s.currentMap) return;
    const node = s.currentMap.nodes.find(n => n.id === s.currentMap!.currentNodeId);
    if (!node) return;
    switch (node.type) {
      case 'combat': case 'elite': case 'boss': {
        const enemies = get().getEnemiesForNode(node);
        if (enemies.length > 0) get().startCombat(enemies);
        break;
      }
      case 'event': set({ phase: 'event' }); break;
      case 'shop': get().generateShop(); break;
      case 'rest': set({ phase: 'rest' }); break;
      case 'treasure': get().collectTreasure(); break;
      default: break;
    }
  },

  completeNode: () => {
    const s = get();
    if (!s.currentMap) return;
    const node = s.currentMap.nodes.find(n => n.id === s.currentMap!.currentNodeId);
    if (!node) return;

    const newNodes = s.currentMap.nodes.map(n => {
      if (n.id === node.id) return { ...n, isVisited: true, isCurrent: false };
      return n;
    });

    const nextLayer = node.x + 1;
    const isBoss = node.type === 'boss';
    const completed = isBoss || nextLayer >= LAYERS_PER_ERA;

    if (!completed) {
      for (const connId of node.connections) {
        const connNode = newNodes.find(n => n.id === connId);
        if (connNode) { connNode.isAccessible = true; connNode.isCurrent = true; }
      }
    }

    set({
      currentMap: {
        ...s.currentMap,
        nodes: newNodes,
        currentLayer: completed ? s.currentMap.currentLayer : nextLayer,
        maxAccessibleLayer: completed ? s.currentMap.maxAccessibleLayer : nextLayer,
        completed,
      },
      phase: completed ? 'era_transition' : 'map_view',
    });

    if (completed) get().advanceEra();
  },

  collectTreasure: () => {
    const s = get();
    const rand = seededRandom(s.seed + Date.now());
    const goldFound = Math.floor(20 + rand() * 50);
    const r = rand();
    let relic: LifeRelic | undefined;
    if (r < 0.5) relic = deepClone(pick(COMMON_RELICS, rand));
    else if (r < 0.8) relic = deepClone(pick(RARE_RELICS, rand));
    else relic = deepClone(pick(LEGENDARY_CARDS as unknown as LifeRelic[], rand));
    if (relic) relic.id = generateId();
    set({ gold: s.gold + goldFound, relics: relic ? [...s.relics, relic] : s.relics });
    get().completeNode();
  },

  advanceEra: () => {
    const s = get();
    const nextEra = s.currentEra + 1;
    const nextYear = (s.birthYear || 1950) + nextEra * 10;
    const lifeDec = Math.floor(5 + Math.random() * 5);
    const newTags = get().checkHiddenTags();
    const newLife = Math.max(0, s.remainingLife - lifeDec);
    const newPhase: GamePhase = newLife <= 0 || s.attributes.health <= 0 ? 'ended' : 'map_view';
    set({
      currentEra: nextEra, currentYear: nextYear, age: s.age + 10,
      remainingLife: newLife, hiddenTags: newTags, phase: newPhase,
      currentMap: null, combat: { ...initialCombatState }, shop: null,
    });
    if (newPhase === 'map_view') get().generateMap();
  },

  endGame: () => { set({ phase: 'ended' }); get().saveGame(); },
  resetGame: () => { set({ ...initialState }); storageService.removeData(STORAGE_KEY); },

  // ========== 战斗 ==========
  startCombat: (enemies) => {
    const s = get();
    const maxH = get().getEffectiveMaxHealth();
    const drawPile = shuffle(s.deck);
    const hand = drawPile.splice(0, Math.min(BASE_DRAW_COUNT + get().getDrawCount(), drawPile.length));
    set({
      combat: {
        isInCombat: true, phase: 'player_turn', currentTurn: 1,
        player: {
          currentHealth: s.combat.isInCombat ? s.combat.player.currentHealth : maxH,
          maxHealth: maxH, block: 0, energy: get().getEnergy(), maxEnergy: get().getEnergy(),
          hand, drawPile, discardPile: [], exhaustPile: [], statusEffects: [],
        },
        enemies: enemies.map(e => ({ ...e, id: generateId(), currentHealth: e.maxHealth, block: 0, statusEffects: [], currentIntentIndex: 0 })),
        currentEnemyIndex: 0, rewards: { cards: [], gold: 0 }, log: [],
      },
      phase: 'combat',
    });
  },

  playCard: (cardId, targetIdx = 0) => {
    const s = get();
    if (s.combat.phase !== 'player_turn') return;
    const idx = s.combat.player.hand.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const card = s.combat.player.hand[idx];
    if (card.cost > s.combat.player.energy) return;
    let c = { ...s.combat, player: { ...s.combat.player, hand: [...s.combat.player.hand] } };
    c.player.hand.splice(idx, 1);
    c.player.energy -= card.cost;
    if (c.player.drawPile.length < c.player.hand.length + 5) { c.player.drawPile = shuffle([...c.player.drawPile, ...c.player.discardPile]); c.player.discardPile = []; }
    for (const eff of card.effects) c = applyEffect(eff, c, targetIdx);
    c.player.discardPile.push(card);
    set({ combat: c });
  },

  endTurn: () => {
    const s = get();
    let c = s.combat;
    if (c.phase !== 'player_turn') return;
    c.player.block = 0; c.player.energy = c.player.maxEnergy;
    c.player.discardPile.push(...c.player.hand); c.player.hand = [];

    for (const e of c.enemies) {
      if (e.currentHealth <= 0) continue;
      const intent = e.intents[e.currentIntentIndex % e.intents.length];
      if (intent.type === 'attack') {
        let dmg = intent.damage; const hits = intent.hits || 1;
        const str = e.statusEffects.find(x => x.type === 'strength'); if (str) dmg += str.value;
        const wk = e.statusEffects.find(x => x.type === 'weak'); if (wk) dmg = Math.floor(dmg * 0.75);
        for (let i = 0; i < hits; i++) {
          const d = Math.max(0, dmg - c.player.block); c.player.block = Math.max(0, c.player.block - dmg); c.player.currentHealth -= d;
          const th = c.player.statusEffects.find(x => x.type === 'thorns'); if (th && e.currentHealth > 0) e.currentHealth -= th.value;
          const sh = c.player.statusEffects.find(x => x.type === 'shields'); if (sh && sh.value > 0) { const ab = Math.min(sh.value, d); sh.value -= ab; c.player.currentHealth += ab; }
        }
      } else if (intent.type === 'defend') { e.block += intent.block; }
      else if (intent.type === 'buff') { const ex = e.statusEffects.find(x => x.type === intent.effect); if (ex) ex.value += intent.value; else e.statusEffects.push({ type: intent.effect as any, value: intent.value, duration: 99 }); }
      else if (intent.type === 'debuff') { c.player.statusEffects.push({ type: intent.effect as any, value: intent.value, duration: 2 }); }
      e.currentIntentIndex = (e.currentIntentIndex + 1) % e.intents.length;
    }

    for (const eff of c.player.statusEffects) {
      if (eff.type === 'poison') c.player.currentHealth -= eff.value;
      else if (eff.type === 'regen') c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + eff.value);
      eff.duration--;
    }
    c.player.statusEffects = c.player.statusEffects.filter(x => x.duration > 0);

    if (c.player.currentHealth <= 0) { set({ combat: { ...c, phase: 'defeat' }, phase: 'ended' }); return; }
    if (c.enemies.every(e => e.currentHealth <= 0)) {
      const gold = c.enemies.reduce((sum, e) => { const [a, b] = e.goldReward; return sum + Math.floor(a + Math.random() * (b - a)); }, 0);
      const cards = c.enemies.flatMap(e => e.cardRewards).filter(Boolean);
      const relic = c.enemies.find(e => e.isBoss)?.relicReward;
      set({ combat: { ...c, phase: 'victory', rewards: { cards, gold, relic: relic ? deepClone(relic) : undefined } }, phase: 'reward' });
      return;
    }
    c.currentTurn++; c.phase = 'player_turn';
    const draw = BASE_DRAW_COUNT + get().getDrawCount();
    for (let i = 0; i < draw; i++) {
      if (c.player.drawPile.length === 0) { c.player.drawPile = shuffle(c.player.discardPile); c.player.discardPile = []; }
      if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!);
    }
    set({ combat: c });
  },

  endCombat: (victory) => {
    const s = get();
    if (victory) {
      const gold = s.combat.rewards.gold; const relic = s.combat.rewards.relic;
      set({ gold: s.gold + gold, relics: relic ? [...s.relics, relic] : s.relics });
      if (s.combat.rewards.cards.length > 0) set({ phase: 'reward' });
      else get().completeNode();
    } else {
      set({ phase: 'ended' });
    }
  },

  selectCardReward: (cardId) => {
    const s = get();
    const card = s.combat.rewards.cards.find(c => c.id === cardId);
    if (card) set({ deck: [...s.deck, { ...deepClone(card), id: generateId() }] });
    get().completeNode();
  },

  // ========== 事件 ==========
  makeChoice: (event, option) => {
    const s = get();
    const rate = get().getSuccessRate(option);
    const success = Math.random() <= rate;
    const outcome = success ? option.successOutcome : option.failureOutcome;
    const attrs = { ...s.attributes };
    const changes: AttributeChange[] = [];
    for (const [k, v] of Object.entries(outcome.attributeChanges)) {
      const a = k as keyof PlayerAttributes;
      const old = attrs[a]; const nv = clamp(old + (v || 0));
      attrs[a] = nv; changes.push({ attr: a, oldValue: old, newValue: nv, reason: outcome.description, timestamp: Date.now() });
    }
    let life = s.remainingLife; if (outcome.lifeCost) life = Math.max(0, life - outcome.lifeCost);
    let gold = s.gold; if (outcome.goldReward) gold += outcome.goldReward;
    let deck = [...s.deck]; if (outcome.cardRewards) for (const c of outcome.cardRewards) deck.push({ ...deepClone(c), id: generateId() });
    let relics = [...s.relics]; if (outcome.relicRewards) for (const r of outcome.relicRewards) relics.push(deepClone(r));
    const rec: ChoiceRecord = { era: s.currentEra, year: s.currentYear, eventId: event.id, optionId: option.id, success, timestamp: Date.now(), description: `${event.title} - ${option.text} (${success ? '成功' : '失败'})` };
    const lr: LifeRecord = { id: generateId(), era: s.currentEra, year: s.currentYear, title: event.title, content: outcome.description, attributeChanges: changes, timestamp: Date.now() };
    const ws = { ...s.worldState }; if (event.isMilestone && success) ws.customEvents.push(outcome.description);
    let ph = s.phase; if (life <= 0 || attrs.health <= 0) ph = 'ended';
    set({ attributes: attrs, remainingLife: life, gold, deck, relics, choiceHistory: [...s.choiceHistory, rec], lifeRecords: [...s.lifeRecords, lr], worldState: ws, phase: ph });
    const tags = get().checkHiddenTags(); if (tags.length > s.hiddenTags.length) set({ hiddenTags: tags });
    if (ph !== 'ended') get().completeNode();
  },

  // ========== 商店 ==========
  generateShop: () => {
    const s = get();
    const discount = get().getShopDiscount();
    const rand = seededRandom(s.seed + s.currentEra * 1000 + Date.now());
    const items: { card?: LifeCard; relic?: LifeRelic; price: number }[] = [];
    for (let i = 0; i < 3 + Math.floor(rand() * 2); i++) {
      const r = rand(); let pool: LifeCard[];
      if (r < 0.6) pool = [...COMMON_ENEMIES.map(e => e.cardRewards[0]).filter(Boolean) as LifeCard[]].slice(0, 5);
      else if (r < 0.85) pool = [] as LifeCard[];
      else pool = LEGENDARY_CARDS;
      if (pool.length === 0) pool = LEGENDARY_CARDS;
      const card = deepClone(pick(pool, rand)); card.id = generateId();
      items.push({ card, price: clamp(card.rarity === 'legendary' ? 99 : card.rarity === 'rare' ? 50 : 25, 10, 999) });
    }
    for (let i = 0; i < 1 + Math.floor(rand() * 2); i++) {
      const pool = rand() < 0.7 ? COMMON_RELICS : RARE_RELICS;
      const relic = deepClone(pick(pool, rand)); relic.id = generateId();
      items.push({ relic, price: clamp(relic.rarity === 'rare' ? 150 : 80, 20, 999) });
    }
    set({ shop: { items: items.map(it => ({ ...it, price: Math.floor(it.price * (1 - discount)), isPurchased: false })), refreshCost: 25, era: s.currentEra }, phase: 'shop' });
  },

  buyShopItem: (idx) => {
    const s = get(); if (!s.shop) return;
    const item = s.shop.items[idx]; if (!item || item.isPurchased || s.gold < item.price) return;
    const deck = item.card ? [...s.deck, { ...deepClone(item.card), id: generateId() }] : [...s.deck];
    const relics = item.relic ? [...s.relics, { ...deepClone(item.relic), id: generateId() }] : [...s.relics];
    const items = [...s.shop.items]; items[idx] = { ...item, isPurchased: true };
    set({ gold: s.gold - item.price, deck, relics, shop: { ...s.shop, items } });
  },

  refreshShop: () => {
    const s = get(); if (!s.shop || s.gold < s.shop.refreshCost) return;
    set({ gold: s.gold - s.shop.refreshCost }); get().generateShop();
  },

  rest: () => {
    const s = get();
    set({
      combat: { ...s.combat, player: { ...s.combat.player, currentHealth: Math.min(s.combat.player.maxHealth, s.combat.player.currentHealth + Math.floor(s.combat.player.maxHealth * 0.3)) } },
      remainingLife: Math.max(0, s.remainingLife - 1),
    });
    get().completeNode();
  },

  attemptBreakthrough: () => {
    const s = get(); if (!s.cultivation) return;
    const realms: CultivationRealm[] = ['mortal', 'qi_refining', 'foundation', 'golden_core', 'nascent', 'spirit', 'void', 'integration', 'mahayana', 'tribulation'];
    const ci = realms.indexOf(s.cultivation.realm);
    if (ci >= realms.length - 1) return;
    const next = realms[ci + 1];
    if (Object.values(s.attributes).reduce((a, b) => a + b, 0) < 100 * (ci + 1)) return;
    const boss = CULTIVATION_BOSSES.find(b => b.id === next);
    if (boss) { const b = deepClone(boss); b.id = generateId(); b.currentHealth = b.maxHealth; get().startCombat([b]); }
  },

  saveGame: async () => {
    const s = get();
    try {
      await storageService.saveData(STORAGE_KEY, {
        id: generateId(), gameState: { phase: s.phase, mode: s.mode, birthYear: s.birthYear, currentYear: s.currentYear, currentEra: s.currentEra, age: s.age, maxLifespan: s.maxLifespan, remainingLife: s.remainingLife, attributes: s.attributes, remainingAttributePoints: s.remainingAttributePoints, hiddenTags: s.hiddenTags, npcs: s.npcs, choiceHistory: s.choiceHistory, lifeRecords: s.lifeRecords, deck: s.deck, relics: s.relics, gold: s.gold, worldState: s.worldState, seed: s.seed, cultivation: s.cultivation }, updatedAt: new Date().toISOString(), isDead: false,
      });
    } catch (e) { console.error('保存失败:', e); }
  },

  loadGame: async () => {
    try { const d = await storageService.loadData<any>(STORAGE_KEY); if (d?.gameState && !d.isDead) set(d.gameState); }
    catch (e) { console.error('加载失败:', e); }
  },

  getSuccessRate: (option) => {
    const s = get(); const w = option.successRate; let tw = 0, ws = 0;
    for (const [k, v] of Object.entries(w)) { ws += s.attributes[k as keyof PlayerAttributes] * (v || 0); tw += v || 0; }
    const base = tw > 0 ? ws / tw / 100 : 0.5;
    let bonus = 0; if (option.tagModifier && s.hiddenTags.includes(option.tagModifier.tag)) bonus = option.tagModifier.rateBonus;
    return clamp(base + bonus, 0.05, 0.95);
  },

  getAvailableEvents: () => SCRIPT_1950_EVENTS,
  getEraDefinition: () => ERAS.find(e => e.year === get().birthYear),

  checkHiddenTags: () => {
    const s = get(); const tags = new Set(s.hiddenTags);
    for (const t of HIDDEN_TAGS) if (!tags.has(t.id) && t.condition(s)) tags.add(t.id);
    return Array.from(tags);
  },

  getEffectiveMaxHealth: () => {
    const s = get(); let h = s.attributes.health;
    for (const r of s.relics) for (const e of r.effects) if (e.type === 'max_health_bonus') h += e.value;
    if (s.cultivation) h += (s.cultivation.realmBonus.physique || 0) * 2;
    return Math.max(30, h);
  },

  getDrawCount: () => { const s = get(); let b = 0; for (const r of s.relics) for (const e of r.effects) if (e.type === 'card_draw_bonus') b += e.value; return b; },

  getEnergy: () => {
    const s = get(); let e = BASE_ENERGY;
    for (const r of s.relics) for (const ef of r.effects) if (ef.type === 'energy_bonus') e += ef.value;
    if (s.cultivation && s.cultivation.realm !== 'mortal') e += 1;
    return e;
  },

  getShopDiscount: () => { const s = get(); let d = 0; for (const r of s.relics) for (const e of r.effects) if (e.type === 'discount') d += e.value; return Math.min(0.5, d); },

  getEnemiesForNode: (node) => {
    const s = get(); const enemies: Enemy[] = [];
    if (node.data?.enemyIds) for (const id of node.data.enemyIds) { const e = s.combat.enemies.find(en => en.id === id); if (e) enemies.push(deepClone(e)); }
    return enemies;
  },
}));

export default useSimulationStore;
