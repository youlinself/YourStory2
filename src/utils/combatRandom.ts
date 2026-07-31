import type { Enemy, EnemyMechanic } from '../types/simulation';
import { getNormalMonsterVariant, getEliteMonsterVariant, getBossMonsterVariant, createMonsterFromVariant } from '../data/monsterMapping';
import { COMMON_ATTACK_CARDS, RARE_CARDS, LEGENDARY_CARDS } from '../data/simulationData';
import generateId from './generateId';

export type MonsterGroup = 'regular' | 'elite' | 'boss';

export interface MonsterGroupConfig {
  group: MonsterGroup;
  types: string[];
  countRange: [number, number];
  healthMultiplier: number;
  cardPool: typeof COMMON_ATTACK_CARDS;
  goldRange: [number, number];
}

const GROUP_CONFIGS: Record<MonsterGroup, MonsterGroupConfig> = {
  regular: {
    group: 'regular',
    types: ['slime', 'ghost', 'golem', 'wraith', 'beast', 'insect', 'undead', 'elemental'],
    countRange: [1, 3],
    healthMultiplier: 1.0,
    cardPool: COMMON_ATTACK_CARDS,
    goldRange: [5, 15],
  },
  elite: {
    group: 'elite',
    types: ['academic', 'burnout', 'authority', 'temptation', 'crisis', 'inner_demon'],
    countRange: [1, 2],
    healthMultiplier: 1.5,
    cardPool: RARE_CARDS,
    goldRange: [15, 30],
  },
  boss: {
    group: 'boss',
    types: ['life_boss', 'fate_boss', 'time_boss'],
    countRange: [1, 1],
    healthMultiplier: 2.0,
    cardPool: LEGENDARY_CARDS,
    goldRange: [50, 100],
  },
};

export interface CombatRandomState {
  recentGroups: MonsterGroup[];
  maxRecentSize: number;
}

export function createCombatRandomState(maxRecentSize: number = 3): CombatRandomState {
  return {
    recentGroups: [],
    maxRecentSize,
  };
}

export function selectMonsterGroup(state: CombatRandomState, _age?: number): MonsterGroup {
  const availableGroups: MonsterGroup[] = ['regular', 'elite', 'boss'];

  const filteredGroups = availableGroups.filter(g => !state.recentGroups.includes(g));

  const pool = filteredGroups.length > 0 ? filteredGroups : availableGroups;

  const weights = pool.map(g => {
    if (g === 'regular') return 0.6;
    if (g === 'elite') return 0.3;
    return 0.1;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      const selected = pool[i];
      state.recentGroups.push(selected);
      if (state.recentGroups.length > state.maxRecentSize) {
        state.recentGroups.shift();
      }
      return selected;
    }
  }

  const fallback = pool[0];
  state.recentGroups.push(fallback);
  if (state.recentGroups.length > state.maxRecentSize) {
    state.recentGroups.shift();
  }
  return fallback;
}

export function createEnemyFromGroup(
  group: MonsterGroup,
  age: number,
  baseMultiplier: number,
  rand: () => number = Math.random
): Enemy {
  const config = GROUP_CONFIGS[group];
  const typeIndex = Math.floor(rand() * config.types.length);
  const monsterType = config.types[typeIndex];

  let variant;
  switch (group) {
    case 'regular':
      variant = getNormalMonsterVariant(monsterType, age);
      break;
    case 'elite':
      variant = getEliteMonsterVariant(monsterType, age);
      break;
    case 'boss':
      variant = getBossMonsterVariant(monsterType, age);
      break;
  }

  const partial = createMonsterFromVariant(variant, monsterType, age, baseMultiplier * config.healthMultiplier);

  const cardCount = group === 'boss' ? 2 : group === 'elite' ? 1 : 1;
  const cards = [];
  for (let i = 0; i < cardCount; i++) {
    const cardIndex = Math.floor(rand() * config.cardPool.length);
    cards.push({ ...config.cardPool[cardIndex], id: generateId() });
  }

  const mechanics: EnemyMechanic[] = [];
  if (age >= 20) mechanics.push('double_attack');
  if (age >= 40) mechanics.push('shield');
  if (age >= 60) mechanics.push('regen');
  if (age >= 80) mechanics.push('rage');

  return {
    id: generateId(),
    name: variant.name,
    icon: variant.icon,
    description: variant.description,
    maxHealth: partial.maxHealth,
    currentHealth: partial.maxHealth,
    block: partial.block,
    intents: partial.intents,
    currentIntentIndex: 0,
    statusEffects: [],
    isBoss: group === 'boss',
    cardRewards: cards,
    goldReward: config.goldRange,
    mechanics: group === 'boss' ? ['boss_aura', ...mechanics] : mechanics,
    ageRange: [age, age],
  };
}

export function generateCombatEnemies(
  state: CombatRandomState,
  age: number,
  baseMultiplier: number,
  rand: () => number = Math.random
): Enemy[] {
  const group = selectMonsterGroup(state, age);
  const config = GROUP_CONFIGS[group];
  const [minCount, maxCount] = config.countRange;
  const count = minCount + Math.floor(rand() * (maxCount - minCount + 1));

  const enemies: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    enemies.push(createEnemyFromGroup(group, age, baseMultiplier, rand));
  }

  return enemies;
}

export { GROUP_CONFIGS };
