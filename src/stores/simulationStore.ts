import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import {
  ERAS, STARTER_DECK, SCRIPT_1950_EVENTS, HIDDEN_TAGS,
  COMMON_ATTACK_CARDS, COMMON_SKILL_CARDS, RARE_CARDS, LEGENDARY_CARDS,
} from '../data/simulationData';
import type {
  GameState, BirthYear, PlayerAttributes, GameEvent, EventOption,
  ChoiceRecord, LifeRecord, WorldState, GameMode, GamePhase,
  LifeCard, LifeRelic, Enemy, CombatState,
  YearOption, YearNode, OptionType, CultivationState, CultivationRealm, AttributeChange,
  AttributeThresholdBonus, EnemyMechanic, CombatBonus,
} from '../types/simulation';

const STORAGE_KEY = 'simulation_game_v3';
const storageService = StorageService.getInstance();

const MAX_HAND_SIZE = 10;
const BASE_DRAW_COUNT = 5;
const BASE_ENERGY = 3;
const YEARS_PER_ERA = 10;
const OPTION_TYPES: OptionType[] = ['combat', 'elite', 'event', 'wonder', 'rest', 'shop'];

const ATTRIBUTE_BONUSES: AttributeThresholdBonus[] = [
  { attribute: 'physique', threshold: 70, name: '强壮', description: '攻击卡伤害+25%', effect: 'damage_boost', value: 0.25 },
  { attribute: 'iq', threshold: 70, name: '聪颖', description: '每回合额外抽1张卡', effect: 'extra_draw', value: 1 },
  { attribute: 'eq', threshold: 70, name: '沉稳', description: '受到debuff持续时间-1回合', effect: 'debuff_reduction', value: 1 },
  { attribute: 'health', threshold: 70, name: '坚韧', description: '最大生命值+20', effect: 'max_health_bonus', value: 20 },
  { attribute: 'energy', threshold: 70, name: '活力', description: '初始精力+1', effect: 'energy_bonus', value: 1 },
  { attribute: 'wealth', threshold: 70, name: '富贵', description: '商店折扣10%', effect: 'shop_discount', value: 0.1 },
  { attribute: 'network', threshold: 70, name: '人脉', description: '战斗开始获得5点格挡', effect: 'start_block', value: 5 },
  { attribute: 'fame', threshold: 70, name: '威名', description: '20%概率打断敌人攻击', effect: 'interrupt_chance', value: 0.2 },
];

function getActiveBonuses(attrs: PlayerAttributes): AttributeThresholdBonus[] {
  return ATTRIBUTE_BONUSES.filter((b) => attrs[b.attribute] >= b.threshold);
}

function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function seededRandom(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; }
function shuffle<T>(arr: T[], rand = Math.random) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickRandom<T>(arr: T[], count: number, rand = Math.random): T[] { return shuffle(arr, rand).slice(0, Math.min(count, arr.length)); }
function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

function applyCardEffect(effect: { type: string; value: number; duration?: number }, combat: CombatState, targetIdx: number): CombatState {
  const c = { ...combat, player: { ...combat.player }, enemies: combat.enemies.map((e) => ({ ...e, statusEffects: [...e.statusEffects] })) };
  const t = c.enemies[targetIdx];
  switch (effect.type) {
    case 'damage': if (t) { const d = Math.max(0, effect.value - t.block); t.block = Math.max(0, t.block - effect.value); t.currentHealth -= d; } break;
    case 'block': c.player.block += effect.value; break;
    case 'heal': c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + effect.value); break;
    case 'draw': for (let i = 0; i < effect.value; i++) { if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!); } break;
    case 'gain_energy': c.player.energy += effect.value; break;
    case 'vulnerable': if (t) { const e = t.statusEffects.find((s) => s.type === 'vulnerable'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'vulnerable', value: effect.value, duration: effect.duration || 2 }); } break;
    case 'weak': if (t) { const e = t.statusEffects.find((s) => s.type === 'weak'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'weak', value: effect.value, duration: effect.duration || 2 }); } break;
    case 'poison': if (t) { const e = t.statusEffects.find((s) => s.type === 'poison'); if (e) e.value += effect.value; else t.statusEffects.push({ type: 'poison', value: effect.value, duration: effect.duration || 3 }); } break;
    case 'cure': c.player.statusEffects = c.player.statusEffects.filter((s) => s.type !== 'weak' && s.type !== 'vulnerable' && s.type !== 'poison'); break;
    case 'shield': c.player.statusEffects.push({ type: 'shields', value: effect.value, duration: 99 }); break;
    case 'thorns': c.player.statusEffects.push({ type: 'thorns', value: effect.value, duration: effect.duration || 99 }); break;
    case 'rage': c.player.statusEffects.push({ type: 'rage', value: effect.value, duration: effect.duration || 99 }); break;
    case 'strength': c.player.statusEffects.push({ type: 'strength', value: effect.value, duration: effect.duration || 99 }); break;
    case 'dexterity': c.player.statusEffects.push({ type: 'dexterity', value: effect.value, duration: effect.duration || 99 }); break;
    case 'regen': c.player.statusEffects.push({ type: 'regen', value: effect.value, duration: effect.duration || 99 }); break;
    case 'lifesteal': if (t && effect.value) { const dmg = Math.max(0, effect.value - t.block); t.currentHealth -= dmg; c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + Math.floor(dmg * 0.5)); } break;
  }
  return c;
}

function getEnemyPool(type: OptionType, era: number, yearInEra: number, rand: () => number): Enemy[] {
  const totalYears = era * 10 + yearInEra;
  const multiplier = 1 + Math.floor(totalYears / 5) * 0.3;
  const mechanics: EnemyMechanic[] = [];
  if (totalYears >= 10) mechanics.push('double_attack');
  if (totalYears >= 20) mechanics.push('shield');
  if (totalYears >= 30) mechanics.push('regen');
  if (totalYears >= 40) mechanics.push('rage');

  const numEnemies = type === 'elite' || type === 'boss' ? 1 : rand() < 0.3 ? 2 : 1;
  const enemies: Enemy[] = [];

  const enemyTemplates: Record<string, () => Enemy> = {
    slime: () => ({ id: '', name: '拖延史莱姆', maxHealth: Math.floor(20 * multiplier), currentHealth: Math.floor(20 * multiplier), block: 0, intents: [{ type: 'attack', damage: Math.floor(4 * multiplier) }, { type: 'defend', block: 3 }, { type: 'attack', damage: Math.floor(6 * multiplier) }], currentIntentIndex: 0, statusEffects: [], icon: '🟢', isBoss: false, cardRewards: pickRandom(COMMON_ATTACK_CARDS, 1, rand).concat(pickRandom(COMMON_SKILL_CARDS, 1, rand)), goldReward: [5, 15], description: '拖延是时间最大的小偷', mechanics: [...mechanics] }),
    ghost: () => ({ id: '', name: '焦虑幽灵', maxHealth: Math.floor(25 * multiplier), currentHealth: Math.floor(25 * multiplier), block: 0, intents: [{ type: 'attack', damage: Math.floor(3 * multiplier), hits: 2 }, { type: 'buff', effect: 'strength', value: 1 }, { type: 'attack', damage: Math.floor(8 * multiplier) }], currentIntentIndex: 0, statusEffects: [], icon: '👻', isBoss: false, cardRewards: pickRandom(COMMON_SKILL_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)), goldReward: [8, 20], description: '焦虑让你无法集中注意力', mechanics: [...mechanics] }),
    golem: () => ({ id: '', name: '责任傀儡', maxHealth: Math.floor(35 * multiplier), currentHealth: Math.floor(35 * multiplier), block: 5, intents: [{ type: 'defend', block: 8 }, { type: 'attack', damage: Math.floor(10 * multiplier) }, { type: 'attack', damage: Math.floor(6 * multiplier) }], currentIntentIndex: 0, statusEffects: [{ type: 'block', value: 5, duration: 99 }], icon: '🗿', isBoss: false, cardRewards: pickRandom(COMMON_ATTACK_CARDS, 1, rand).concat(pickRandom(COMMON_SKILL_CARDS, 1, rand)).concat(pickRandom(RARE_CARDS, 1, rand)), goldReward: [10, 25], description: '家庭、工作、社会责任...', mechanics: [...mechanics] }),
    wraith: () => ({ id: '', name: '自我怀疑', maxHealth: Math.floor(18 * multiplier), currentHealth: Math.floor(18 * multiplier), block: 0, intents: [{ type: 'debuff', effect: 'weak', value: 2 }, { type: 'attack', damage: Math.floor(5 * multiplier) }, { type: 'debuff', effect: 'vulnerable', value: 2 }], currentIntentIndex: 0, statusEffects: [], icon: '👤', isBoss: false, cardRewards: pickRandom(COMMON_SKILL_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)), goldReward: [5, 15], description: '内心的声音在质疑你', mechanics: [...mechanics] }),
    midlife: () => ({ id: '', name: '中年危机', maxHealth: Math.floor(80 * multiplier), currentHealth: Math.floor(80 * multiplier), block: 0, intents: [{ type: 'attack', damage: Math.floor(15 * multiplier) }, { type: 'buff', effect: 'strength', value: 2 }, { type: 'attack', damage: Math.floor(10 * multiplier), hits: 2 }], currentIntentIndex: 0, statusEffects: [], icon: '👔', isBoss: false, cardRewards: pickRandom(RARE_CARDS, 2, rand).concat(pickRandom(LEGENDARY_CARDS, 1, rand)), goldReward: [25, 50], description: '上有老下有小', mechanics: [...mechanics] }),
    burnout: () => ({ id: '', name: '过劳恶魔', maxHealth: Math.floor(65 * multiplier), currentHealth: Math.floor(65 * multiplier), block: 0, intents: [{ type: 'attack', damage: Math.floor(12 * multiplier) }, { type: 'debuff', effect: 'weak', value: 3 }, { type: 'attack', damage: Math.floor(8 * multiplier), hits: 2 }], currentIntentIndex: 0, statusEffects: [{ type: 'strength', value: 1, duration: 99 }], icon: '😈', isBoss: false, cardRewards: pickRandom(RARE_CARDS, 2, rand).concat(pickRandom(LEGENDARY_CARDS, 1, rand)), goldReward: [30, 60], description: '996的阴影笼罩着你', mechanics: [...mechanics] }),
    boss: () => ({ id: '', name: '时代终结者', maxHealth: Math.floor(150 * multiplier), currentHealth: Math.floor(150 * multiplier), block: 10, intents: [{ type: 'attack', damage: Math.floor(20 * multiplier) }, { type: 'special', name: '审判', description: '造成巨额固定伤害' }, { type: 'debuff', effect: 'weak', value: 3 }], currentIntentIndex: 0, statusEffects: [{ type: 'block', value: 10, duration: 99 }], icon: '💀', isBoss: true, cardRewards: pickRandom(LEGENDARY_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)), goldReward: [80, 150], description: '回顾你的一生', mechanics: [...mechanics, 'boss_aura'] as EnemyMechanic[] }),
  };

  if (type === 'boss') {
    enemies.push(enemyTemplates.boss());
  } else if (type === 'elite') {
    enemies.push(rand() < 0.5 ? enemyTemplates.midlife() : enemyTemplates.burnout());
  } else {
    const pool = [enemyTemplates.slime, enemyTemplates.ghost, enemyTemplates.golem, enemyTemplates.wraith];
    for (let i = 0; i < numEnemies; i++) {
      const template = pool[Math.floor(rand() * pool.length)];
      enemies.push(template());
    }
  }

  return enemies;
}

function generateCombatBonuses(remainingLife: number): CombatBonus[] {
  const bonuses: CombatBonus[] = [
    { id: 'draw2', name: '灵感迸发', description: '立刻抽2张卡', lifeCost: 1, effect: 'draw', value: 2 },
    { id: 'damage_double', name: '怒火中烧', description: '下一张攻击卡伤害翻倍', lifeCost: 2, effect: 'damage_boost', value: 2 },
    { id: 'heal20', name: '顽强意志', description: '恢复20%最大生命值', lifeCost: 3, effect: 'heal', value: 0.2 },
    { id: 'skip_enemy', name: '时间静止', description: '跳过本回合敌人行动', lifeCost: 5, effect: 'skip_enemy', value: 1 },
    { id: 'extra_energy', name: '肾上腺素', description: '本回合获得2点额外精力', lifeCost: 2, effect: 'extra_energy', value: 2 },
  ];
  return bonuses.filter((b) => b.lifeCost < remainingLife);
}

const initialWorldState: WorldState = { industryEvolution: {}, socialClimate: 50, techProgress: 30, customEvents: [] };
const initialAttributes: PlayerAttributes = { energy: 50, physique: 50, health: 50, iq: 50, eq: 50, wealth: 30, network: 30, fame: 10 };

const initialCombatState: CombatState = {
  isInCombat: false, phase: 'player_turn', currentTurn: 0,
  player: { currentHealth: 50, maxHealth: 50, block: 0, energy: BASE_ENERGY, maxEnergy: BASE_ENERGY, hand: [], drawPile: [], discardPile: [], exhaustPile: [], statusEffects: [] },
  enemies: [], currentEnemyIndex: 0, rewards: { cards: [], attribute: undefined }, availableBonuses: [], log: [],
};

const initialCultivationState: CultivationState = { realm: 'mortal', maxLifespan: 70, tribulationThreshold: 0, realmBonus: {} };

const initialState: GameState = {
  phase: 'setup', mode: 'normal', birthYear: null, currentYear: 1950, currentEra: 0, age: 0,
  maxLifespan: 70, remainingLife: 70, attributes: { ...initialAttributes }, remainingAttributePoints: 15,
  hiddenTags: [], npcs: [], choiceHistory: [], lifeRecords: [], deck: [], relics: [], gold: 30,
  combat: { ...initialCombatState }, currentMap: null, shop: null, cultivation: null,
  worldState: { ...initialWorldState }, seed: Date.now(),
};

interface SimulationState extends GameState {
  selectMode: (mode: GameMode) => void;
  startGame: (birthYear: BirthYear) => void;
  allocateAttribute: (attr: keyof PlayerAttributes, value: number) => void;
  confirmAllocation: () => void;
  generateMap: () => void;
  selectOption: (optionId: string) => void;
  enterOption: () => void;
  completeOption: () => void;
  advanceEra: () => void;
  endGame: () => void;
  resetGame: () => void;
  startCombat: (enemies: Enemy[]) => void;
  playCard: (cardId: string, targetIndex?: number) => void;
  endTurn: () => void;
  activateBonus: (bonusId: string) => void;
  selectCardReward: (cardId: string) => void;
  selectAttributeReward: () => void;
  endCombat: (victory: boolean) => void;
  makeChoice: (event: GameEvent, option: EventOption) => void;
  generateShop: () => void;
  buyShopItem: (index: number) => void;
  rest: () => void;
  attemptBreakthrough: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  getSuccessRate: (option: EventOption) => number;
  getAvailableEvents: () => GameEvent[];
  checkHiddenTags: () => string[];
  getEffectiveMaxHealth: () => number;
  getDrawCount: () => number;
  getEnergy: () => number;
  getShopDiscount: () => number;
  getActiveAttributeBonuses: () => AttributeThresholdBonus[];
}

const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialState,

  selectMode: (mode) => set({ mode, phase: 'setup' }),

  startGame: (birthYear) => {
    const era = ERAS.find((e) => e.year === birthYear);
    if (!era) return;
    const mode = get().mode;
    const rand = seededRandom(Date.now());
    const [minW, maxW] = era.initialWealthRange;
    const [minN, maxN] = era.initialNetworkRange;
    const attrs: PlayerAttributes = {
      ...initialAttributes,
      wealth: Math.floor(minW + rand() * (maxW - minW)),
      network: Math.floor(minN + rand() * (maxN - minN)),
      health: Math.floor(50 + rand() * 20),
      energy: Math.floor(60 + rand() * 20),
      physique: Math.floor(40 + rand() * 30),
      iq: Math.floor(40 + rand() * 30),
      eq: Math.floor(40 + rand() * 30),
    };
    const deck = STARTER_DECK.map((c) => ({ ...c, id: generateId() }));
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

  confirmAllocation: () => { if (get().remainingAttributePoints > 0) return; set({ phase: 'year_view' }); get().generateMap(); },

  generateMap: () => {
    const s = get();
    const era = s.currentEra;
    const rand = seededRandom(s.seed + era);
    const years: YearNode[] = [];
    for (let i = 0; i < YEARS_PER_ERA; i++) {
      const year = (s.birthYear || 1950) + era * 10 + i;
      const isBossYear = i === YEARS_PER_ERA - 1;
      let options: YearOption[];
      if (isBossYear) {
        options = [{ id: generateId(), type: 'boss', data: { enemyIds: [`boss_${era}`] } }];
      } else {
        options = [];
        for (let j = 0; j < 3; j++) {
          const type = OPTION_TYPES[Math.floor(rand() * OPTION_TYPES.length)];
          const opt: YearOption = { id: generateId(), type };
          options.push(opt);
        }
      }
      years.push({ year, eraIndex: i, isBossYear, options, selectedOptionId: null, isCompleted: false });
    }
    set({ currentMap: { era, birthYear: s.birthYear || 1950, years, currentYearIndex: 0, completed: false } });
  },

  selectOption: (optionId) => {
    const s = get();
    if (!s.currentMap) return;
    const yearIdx = s.currentMap.currentYearIndex;
    const year = s.currentMap.years[yearIdx];
    if (year.isCompleted) return;
    const opt = year.options.find((o) => o.id === optionId);
    if (!opt) return;
    const newYears = [...s.currentMap.years];
    newYears[yearIdx] = { ...year, selectedOptionId: optionId };
    set({ currentMap: { ...s.currentMap, years: newYears } });
  },

  enterOption: () => {
    const s = get();
    if (!s.currentMap) return;
    const year = s.currentMap.years[s.currentMap.currentYearIndex];
    const opt = year.options.find((o) => o.id === year.selectedOptionId);
    if (!opt) return;
    switch (opt.type) {
      case 'combat': case 'elite': case 'boss': {
        const rand = seededRandom(s.seed + s.currentEra * 100 + s.currentMap.currentYearIndex * 10 + Date.now() % 100);
        const enemies = getEnemyPool(opt.type, s.currentEra, year.eraIndex, rand).map((e) => ({ ...e, id: generateId(), currentHealth: e.maxHealth }));
        if (enemies.length > 0) get().startCombat(enemies);
        break;
      }
      case 'event': set({ phase: 'event' }); break;
      case 'wonder': set({ phase: 'reward' }); break;
      case 'shop': get().generateShop(); break;
      case 'rest': set({ phase: 'rest' }); break;
    }
  },

  completeOption: () => {
    const s = get();
    if (!s.currentMap) return;
    const yearIdx = s.currentMap.currentYearIndex;
    const newYears = [...s.currentMap.years];
    newYears[yearIdx] = { ...newYears[yearIdx], isCompleted: true };
    const nextIdx = yearIdx + 1;
    const completed = nextIdx >= YEARS_PER_ERA;
    set({ currentMap: { ...s.currentMap, years: newYears, currentYearIndex: completed ? yearIdx : nextIdx, completed }, phase: completed ? 'era_transition' : 'year_view' });
    if (completed) get().advanceEra();
  },

  advanceEra: () => {
    const s = get();
    const nextEra = s.currentEra + 1;
    const nextYear = (s.birthYear || 1950) + nextEra * 10;
    const lifeDec = Math.floor(5 + Math.random() * 5);
    const newTags = get().checkHiddenTags();
    const newLife = Math.max(0, s.remainingLife - lifeDec);
    const newPhase: GamePhase = (newLife <= 0 || s.attributes.health <= 0) ? 'ended' : 'year_view';
    set({ currentEra: nextEra, currentYear: nextYear, age: s.age + 10, remainingLife: newLife, hiddenTags: newTags, phase: newPhase, currentMap: null, combat: { ...initialCombatState }, shop: null });
    if (newPhase === 'year_view') get().generateMap();
  },

  endGame: () => { set({ phase: 'ended' }); get().saveGame(); },
  resetGame: () => { set({ ...initialState }); storageService.removeData(STORAGE_KEY); },

  startCombat: (enemies) => {
    const s = get();
    const bonuses = getActiveBonuses(s.attributes);
    const maxHealth = s.attributes.health + bonuses.filter((b) => b.effect === 'max_health_bonus').reduce((sum, b) => sum + b.value, 0) + s.relics.reduce((sum, r) => sum + r.effects.filter((e) => e.type === 'max_health_bonus').reduce((a, e) => a + e.value, 0), 0);
    const energy = BASE_ENERGY + bonuses.filter((b) => b.effect === 'energy_bonus').reduce((sum, b) => sum + b.value, 0);
    const drawBonus = bonuses.filter((b) => b.effect === 'extra_draw').reduce((sum, b) => sum + b.value, 0) + s.relics.reduce((sum, r) => sum + r.effects.filter((e) => e.type === 'card_draw_bonus').reduce((a, e) => a + e.value, 0), 0);
    const startBlock = bonuses.filter((b) => b.effect === 'start_block').reduce((sum, b) => sum + b.value, 0);

    const drawPile = shuffle(s.deck);
    const hand = drawPile.splice(0, Math.min(BASE_DRAW_COUNT + drawBonus, drawPile.length));
    const combatBonuses = generateCombatBonuses(s.remainingLife);

    set({
      combat: {
        isInCombat: true, phase: 'player_turn', currentTurn: 1,
        player: {
          currentHealth: s.combat.isInCombat ? s.combat.player.currentHealth : maxHealth,
          maxHealth, block: startBlock, energy, maxEnergy: energy,
          hand, drawPile, discardPile: [], exhaustPile: [], statusEffects: [],
        },
        enemies: enemies.map((e) => ({ ...e, id: generateId(), currentHealth: e.maxHealth, block: 0, statusEffects: [], currentIntentIndex: 0 })),
        currentEnemyIndex: 0, rewards: { cards: [], attribute: undefined }, availableBonuses: combatBonuses, log: [],
      },
      phase: 'combat',
    });
  },

  playCard: (cardId, targetIdx = 0) => {
    const s = get();
    if (s.combat.phase !== 'player_turn') return;
    const idx = s.combat.player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const card = s.combat.player.hand[idx];
    if (card.cost > s.combat.player.energy) return;
    const bonuses = getActiveBonuses(s.attributes);
    const damageBoost = 1 + bonuses.filter((b) => b.effect === 'damage_boost').reduce((sum, b) => sum + b.value, 0);

    let c = { ...s.combat, player: { ...s.combat.player, hand: [...s.combat.player.hand] } };
    c.player.hand.splice(idx, 1);
    c.player.energy -= card.cost;

    if (c.player.drawPile.length < c.player.hand.length + 5) {
      c.player.drawPile = shuffle([...c.player.drawPile, ...c.player.discardPile]);
      c.player.discardPile = [];
    }

    for (const eff of card.effects) {
      const modifiedEff = eff.type === 'damage' ? { ...eff, value: Math.floor(eff.value * damageBoost) } : eff;
      c = applyCardEffect(modifiedEff, c, targetIdx);
    }
    c.player.discardPile.push(card);

    if (c.enemies.every((e) => e.currentHealth <= 0)) {
      const gold = c.enemies.reduce((sum, e) => { const [a, b] = e.goldReward; return sum + Math.floor(a + Math.random() * (b - a)); }, 0);
      const cardRewards: LifeCard[] = [];
      let relicReward: LifeRelic | undefined;
      for (const e of c.enemies) {
        for (const crd of e.cardRewards) cardRewards.push({ ...crd, id: generateId() });
        if (e.relicReward && !relicReward) relicReward = { ...e.relicReward, id: generateId() };
      }
      const newRelics = relicReward ? [...s.relics, relicReward] : s.relics;
      set({ gold: s.gold + gold, relics: newRelics });
      set({ combat: { ...c, phase: 'victory', rewards: { cards: cardRewards, attribute: undefined, relic: relicReward } }, phase: 'reward' });
      return;
    }

    set({ combat: c });
  },

  activateBonus: (bonusId) => {
    const s = get();
    const bonus = s.combat.availableBonuses.find((b) => b.id === bonusId);
    if (!bonus || s.remainingLife <= bonus.lifeCost) return;

    let c = { ...s.combat, player: { ...s.combat.player } };
    switch (bonus.effect) {
      case 'draw':
        for (let i = 0; i < bonus.value; i++) {
          if (c.player.drawPile.length === 0) { c.player.drawPile = shuffle(c.player.discardPile); c.player.discardPile = []; }
          if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!);
        }
        break;
      case 'damage_boost':
        c.player.statusEffects.push({ type: 'rage', value: bonus.value, duration: 1 });
        break;
      case 'heal':
        c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + Math.floor(c.player.maxHealth * bonus.value));
        break;
      case 'skip_enemy':
        c.phase = 'player_turn';
        c.currentTurn++;
        c.player.energy = c.player.maxEnergy;
        c.player.drawPile = shuffle([...c.player.drawPile, ...c.player.discardPile]);
        c.player.discardPile = [];
        for (let i = 0; i < BASE_DRAW_COUNT; i++) {
          if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!);
        }
        break;
      case 'extra_energy':
        c.player.energy += bonus.value;
        break;
    }

    set({ combat: c, remainingLife: s.remainingLife - bonus.lifeCost });
  },

  endTurn: () => {
    const s = get();
    let c = s.combat;
    if (c.phase !== 'player_turn') return;

    c.player.block = 0;
    c.player.energy = c.player.maxEnergy;
    c.player.discardPile.push(...c.player.hand);
    c.player.hand = [];

    const bonuses = getActiveBonuses(s.attributes);
    const interruptChance = bonuses.filter((b) => b.effect === 'interrupt_chance').reduce((sum, b) => sum + b.value, 0);

    for (const e of c.enemies) {
      if (e.currentHealth <= 0) continue;
      if (e.currentHealth < e.maxHealth * 0.5 && e.mechanics.includes('rage')) {
        const existing = e.statusEffects.find((x) => x.type === 'rage');
        if (!existing) e.statusEffects.push({ type: 'strength', value: 2, duration: 99 });
      }
      if (e.mechanics.includes('regen')) {
        e.currentHealth = Math.min(e.maxHealth, e.currentHealth + 5);
      }

      const intent = e.intents[e.currentIntentIndex % e.intents.length];
      if (intent.type === 'attack') {
        if (Math.random() < interruptChance) { e.currentIntentIndex = (e.currentIntentIndex + 1) % e.intents.length; continue; }
        let dmg = intent.damage;
        const hits = intent.hits || (e.mechanics.includes('double_attack') ? 2 : 1);
        const str = e.statusEffects.find((x) => x.type === 'strength');
        if (str) dmg += str.value;
        const wk = e.statusEffects.find((x) => x.type === 'weak');
        if (wk) dmg = Math.floor(dmg * 0.75);
        const shield = e.mechanics.includes('shield') ? 0.75 : 1;
        dmg = Math.floor(dmg * shield);
        for (let i = 0; i < hits; i++) {
          const d = Math.max(0, dmg - c.player.block);
          c.player.block = Math.max(0, c.player.block - dmg);
          c.player.currentHealth -= d;
          const sh = c.player.statusEffects.find((x) => x.type === 'shields');
          if (sh && sh.value > 0) { const ab = Math.min(sh.value, d); sh.value -= ab; c.player.currentHealth += ab; }
          const th = c.player.statusEffects.find((x) => x.type === 'thorns');
          if (th && e.currentHealth > 0) e.currentHealth -= th.value;
        }
      } else if (intent.type === 'defend') {
        e.block += intent.block;
      } else if (intent.type === 'buff') {
        const existing = e.statusEffects.find((x) => x.type === intent.effect);
        if (existing) existing.value += intent.value;
        else e.statusEffects.push({ type: intent.effect as any, value: intent.value, duration: 99 });
      } else if (intent.type === 'debuff') {
        const debuffRed = bonuses.filter((b) => b.effect === 'debuff_reduction').length;
        c.player.statusEffects.push({ type: intent.effect as any, value: intent.value, duration: Math.max(1, 2 - debuffRed) });
      }
      e.currentIntentIndex = (e.currentIntentIndex + 1) % e.intents.length;
    }

    for (const eff of c.player.statusEffects) {
      if (eff.type === 'poison') c.player.currentHealth -= eff.value;
      else if (eff.type === 'regen') c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + eff.value);
      eff.duration--;
    }
    c.player.statusEffects = c.player.statusEffects.filter((x) => x.duration > 0);

    if (c.player.currentHealth <= 0) { set({ combat: { ...c, phase: 'defeat' }, phase: 'ended' }); return; }
    if (c.enemies.every((e) => e.currentHealth <= 0)) {
      const gold = c.enemies.reduce((sum, e) => { const [a, b] = e.goldReward; return sum + Math.floor(a + Math.random() * (b - a)); }, 0);
      const cardRewards: LifeCard[] = [];
      let relicReward: LifeRelic | undefined;
      for (const e of c.enemies) {
        for (const card of e.cardRewards) cardRewards.push({ ...card, id: generateId() });
        if (e.relicReward && !relicReward) relicReward = { ...e.relicReward, id: generateId() };
      }
      const newRelics = relicReward ? [...s.relics, relicReward] : s.relics;
      set({ gold: s.gold + gold, relics: newRelics });
      set({ combat: { ...c, phase: 'victory', rewards: { cards: cardRewards, attribute: undefined, relic: relicReward } }, phase: 'reward' });
      return;
    }

    c.currentTurn++;
    c.phase = 'player_turn';
    const drawBonus = bonuses.filter((b) => b.effect === 'extra_draw').reduce((sum, b) => sum + b.value, 0);
    const draw = BASE_DRAW_COUNT + drawBonus;
    for (let i = 0; i < draw; i++) {
      if (c.player.drawPile.length === 0) { c.player.drawPile = shuffle(c.player.discardPile); c.player.discardPile = []; }
      if (c.player.drawPile.length > 0 && c.player.hand.length < MAX_HAND_SIZE) c.player.hand.push(c.player.drawPile.shift()!);
    }
    set({ combat: c });
  },

  endCombat: (victory) => {
    const s = get();
    if (victory) {
      if (s.combat.rewards.cards.length > 0 || s.combat.rewards.attribute || s.combat.rewards.relic) set({ phase: 'reward' });
      else get().completeOption();
    } else {
      set({ phase: 'ended' });
    }
  },

  selectCardReward: (cardId) => { const s = get(); const card = s.combat.rewards.cards.find((c) => c.id === cardId); if (card) set({ deck: [...s.deck, { ...deepClone(card), id: generateId() }] }); get().completeOption(); },
  selectAttributeReward: () => { const s = get(); if (s.combat.rewards.attribute) { const newAttrs = { ...s.attributes }; for (const [k, v] of Object.entries(s.combat.rewards.attribute)) { newAttrs[k as keyof PlayerAttributes] = clamp(newAttrs[k as keyof PlayerAttributes] + (v || 0)); } set({ attributes: newAttrs }); } get().completeOption(); },

  makeChoice: (event, option) => {
    const s = get();
    const rate = get().getSuccessRate(option);
    const success = Math.random() <= rate;
    const outcome = success ? option.successOutcome : option.failureOutcome;
    const attrs = { ...s.attributes };
    const changes: AttributeChange[] = [];
    for (const [k, v] of Object.entries(outcome.attributeChanges)) {
      const a = k as keyof PlayerAttributes;
      const old = attrs[a];
      const nv = clamp(old + (v || 0));
      attrs[a] = nv;
      changes.push({ attr: a, oldValue: old, newValue: nv, reason: outcome.description, timestamp: Date.now() });
    }
    let life = s.remainingLife;
    if (outcome.lifeCost) life = Math.max(0, life - outcome.lifeCost);
    let gold = s.gold;
    if (outcome.goldReward) gold += outcome.goldReward;
    let deck = [...s.deck];
    if (outcome.cardRewards) for (const c of outcome.cardRewards) deck.push({ ...deepClone(c), id: generateId() });
    let relics = [...s.relics];
    if (outcome.relicRewards) for (const r of outcome.relicRewards) relics.push(deepClone(r));
    const rec: ChoiceRecord = { era: s.currentEra, year: s.currentYear, eventId: event.id, optionId: option.id, success, timestamp: Date.now(), description: `${event.title} - ${option.text} (${success ? '成功' : '失败'})` };
    const lr: LifeRecord = { id: generateId(), era: s.currentEra, year: s.currentYear, title: event.title, content: outcome.description, attributeChanges: changes, timestamp: Date.now() };
    const ws = { ...s.worldState };
    if (event.isMilestone && success) ws.customEvents.push(outcome.description);
    let ph = s.phase;
    if (life <= 0 || attrs.health <= 0) ph = 'ended';
    set({ attributes: attrs, remainingLife: life, gold, deck, relics, choiceHistory: [...s.choiceHistory, rec], lifeRecords: [...s.lifeRecords, lr], worldState: ws, phase: ph });
    const tags = get().checkHiddenTags();
    if (tags.length > s.hiddenTags.length) set({ hiddenTags: tags });
    if (ph !== 'ended') get().completeOption();
  },

  generateShop: () => {
    const s = get();
    const discount = get().getShopDiscount();
    const rand = seededRandom(s.seed + s.currentEra * 1000 + Date.now());
    const items: { card?: LifeCard; relic?: LifeRelic; price: number }[] = [];
    for (let i = 0; i < 3 + Math.floor(rand() * 2); i++) {
      const card: LifeCard = { id: generateId(), name: '战斗卡牌', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ type: 'damage', value: 6 }], description: '造成6点伤害', icon: '⚔️', tags: ['攻击'] };
      items.push({ card, price: 25 });
    }
    set({ shop: { items: items.map((it) => ({ ...it, price: Math.floor(it.price * (1 - discount)), isPurchased: false })), refreshCost: 25, era: s.currentEra }, phase: 'shop' });
  },

  buyShopItem: (idx) => {
    const s = get();
    if (!s.shop) return;
    const item = s.shop.items[idx];
    if (!item || item.isPurchased || s.gold < item.price) return;
    const deck = item.card ? [...s.deck, { ...deepClone(item.card), id: generateId() }] : [...s.deck];
    const relics = item.relic ? [...s.relics, { ...deepClone(item.relic), id: generateId() }] : [...s.relics];
    const items = [...s.shop.items];
    items[idx] = { ...item, isPurchased: true };
    set({ gold: s.gold - item.price, deck, relics, shop: { ...s.shop, items } });
  },

  rest: () => {
    const s = get();
    set({
      combat: { ...s.combat, player: { ...s.combat.player, currentHealth: Math.min(s.combat.player.maxHealth, s.combat.player.currentHealth + Math.floor(s.combat.player.maxHealth * 0.3)) } },
      remainingLife: Math.max(0, s.remainingLife - 1),
    });
    get().completeOption();
  },

  attemptBreakthrough: () => {
    const s = get();
    if (!s.cultivation) return;
    const realms: CultivationRealm[] = ['mortal', 'qi_refining', 'foundation', 'golden_core', 'nascent', 'spirit', 'void', 'integration', 'mahayana', 'tribulation'];
    const ci = realms.indexOf(s.cultivation.realm);
    if (ci >= realms.length - 1) return;
    if (Object.values(s.attributes).reduce((a, b) => a + b, 0) < 100 * (ci + 1)) return;
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
    const s = get();
    const w = option.successRate;
    let tw = 0, ws = 0;
    for (const [k, v] of Object.entries(w)) { ws += s.attributes[k as keyof PlayerAttributes] * (v || 0); tw += v || 0; }
    const base = tw > 0 ? ws / tw / 100 : 0.5;
    let bonus = 0;
    if (option.tagModifier && s.hiddenTags.includes(option.tagModifier.tag)) bonus = option.tagModifier.rateBonus;
    return clamp(base + bonus, 0.05, 0.95);
  },

  getAvailableEvents: () => SCRIPT_1950_EVENTS,
  checkHiddenTags: () => { const s = get(); const tags = new Set(s.hiddenTags); for (const t of HIDDEN_TAGS) if (!tags.has(t.id) && t.condition(s)) tags.add(t.id); return Array.from(tags); },

  getEffectiveMaxHealth: () => {
    const s = get();
    let h = s.attributes.health;
    const bonuses = getActiveBonuses(s.attributes);
    for (const b of bonuses) if (b.effect === 'max_health_bonus') h += b.value;
    for (const r of s.relics) for (const e of r.effects) if (e.type === 'max_health_bonus') h += e.value;
    if (s.cultivation) h += (s.cultivation.realmBonus.physique || 0) * 2;
    return Math.max(30, h);
  },

  getDrawCount: () => { const s = get(); let b = 0; for (const r of s.relics) for (const e of r.effects) if (e.type === 'card_draw_bonus') b += e.value; return b; },

  getEnergy: () => {
    const s = get();
    let e = BASE_ENERGY;
    const bonuses = getActiveBonuses(s.attributes);
    for (const b of bonuses) if (b.effect === 'energy_bonus') e += b.value;
    for (const r of s.relics) for (const ef of r.effects) if (ef.type === 'energy_bonus') e += ef.value;
    if (s.cultivation && s.cultivation.realm !== 'mortal') e += 1;
    return e;
  },

  getShopDiscount: () => {
    const s = get();
    let d = 0;
    const bonuses = getActiveBonuses(s.attributes);
    for (const b of bonuses) if (b.effect === 'shop_discount') d += b.value;
    for (const r of s.relics) for (const e of r.effects) if (e.type === 'discount') d += e.value;
    return Math.min(0.5, d);
  },

  getActiveAttributeBonuses: () => getActiveBonuses(get().attributes),
}));

export default useSimulationStore;
