import { create } from 'zustand';
import { StorageService } from '../services';
import { generateId } from '../utils';
import {
  ERAS, STARTER_DECK, SCRIPT_1950_EVENTS, HIDDEN_TAGS,
  COMMON_ATTACK_CARDS, COMMON_SKILL_CARDS, RARE_CARDS, LEGENDARY_CARDS,
  WONDER_REWARD_POOL, ATTRIBUTE_TIER_CARDS,
} from '../data/simulationData';
import {
  getAgeStage,
  getNormalMonsterVariant,
  getEliteMonsterVariant,
  createAnnualBoss,
  createMonsterFromVariant,
} from '../data/monsterMapping';
import type {
  GameState, BirthYear, PlayerAttributes, GameEvent, EventOption,
  ChoiceRecord, LifeRecord, WorldState, GameMode, GamePhase,
  LifeCard, LifeRelic, Enemy, CombatState, StatusEffect,
  YearOption, YearNode, OptionType, CultivationState, CultivationRealm, AttributeChange,
  AttributeThresholdBonus, EnemyMechanic, CombatBonus, WonderRewardOption, WonderRewardType,
} from '../types/simulation';

const STORAGE_KEY = 'simulation_game_v3';
const storageService = StorageService.getInstance();

const MAX_HAND_SIZE = 5;
const BASE_DRAW_COUNT = 4;
const BASE_ENERGY = 3;
const YEARS_PER_ERA = 10;
const OPTION_WEIGHTS: Record<OptionType, number> = {
  combat: 41,
  elite: 20,
  event: 15,
  wonder: 8,
  rest: 7,
  shop: 9,
  boss: 0,
};

function pickWeightedType(rand: () => number): OptionType {
  const totalWeight = Object.values(OPTION_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = rand() * totalWeight;
  for (const [type, weight] of Object.entries(OPTION_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return type as OptionType;
  }
  return 'combat';
}

export { MAX_HAND_SIZE, BASE_DRAW_COUNT };

const ATTRIBUTE_BONUSES: AttributeThresholdBonus[] = [
  // ========== 精力 (energy) ==========
  // 30点: 卡牌奖励 - 精力充沛
  { attribute: 'energy', threshold: 30, name: '精力充沛', description: '获得卡牌【精力充沛】- 抽2张牌', effect: 'card_reward', value: 0, cardId: 'energy_tier1' },
  // 50点: 被动 - 初始精力+1
  { attribute: 'energy', threshold: 50, name: '精力充沛', description: '初始精力+1', effect: 'energy_bonus', value: 1 },
  // 70点: 卡牌奖励 - 活力爆发
  { attribute: 'energy', threshold: 70, name: '活力爆发', description: '获得卡牌【活力爆发】- 获得3点精力', effect: 'card_reward', value: 0, cardId: 'energy_tier3' },
  // 90点: 被动 - 初始精力+1
  { attribute: 'energy', threshold: 90, name: '神采奕奕', description: '初始精力+1', effect: 'energy_bonus', value: 1 },
  // 100点: 卡牌奖励 - 超凡入圣
  { attribute: 'energy', threshold: 100, name: '超凡入圣', description: '获得卡牌【超凡入圣】- 最大精力+1', effect: 'card_reward', value: 0, cardId: 'energy_tier5' },

  // ========== 体魄 (physique) ==========
  // 30点: 卡牌奖励 - 强壮一击
  { attribute: 'physique', threshold: 30, name: '强壮一击', description: '获得卡牌【强壮一击】- 造成12伤害+2力量', effect: 'card_reward', value: 0, cardId: 'physique_tier1' },
  // 50点: 被动 - 伤害+10%
  { attribute: 'physique', threshold: 50, name: '强壮', description: '攻击卡伤害+10%', effect: 'damage_boost', value: 0.10 },
  // 70点: 卡牌奖励 - 威猛
  { attribute: 'physique', threshold: 70, name: '威猛', description: '获得卡牌【威猛】- 10格挡+3力量', effect: 'card_reward', value: 0, cardId: 'physique_tier3' },
  // 90点: 被动 - 伤害+10%
  { attribute: 'physique', threshold: 90, name: '勇猛', description: '攻击卡伤害+10%', effect: 'damage_boost', value: 0.10 },
  // 100点: 卡牌奖励 - 勇猛
  { attribute: 'physique', threshold: 100, name: '勇猛', description: '获得卡牌【勇猛】- 攻击伤害+30%', effect: 'card_reward', value: 0, cardId: 'physique_tier5' },

  // ========== 健康 (health) ==========
  // 30点: 卡牌奖励 - 生命恢复
  { attribute: 'health', threshold: 30, name: '生命恢复', description: '获得卡牌【生命恢复】- 回复6生命', effect: 'card_reward', value: 0, cardId: 'health_tier1' },
  // 50点: 被动 - 生命+10
  { attribute: 'health', threshold: 50, name: '健壮', description: '最大生命值+10', effect: 'max_health_bonus', value: 10 },
  // 70点: 卡牌奖励 - 坚韧
  { attribute: 'health', threshold: 70, name: '坚韧', description: '获得卡牌【坚韧】- 12格挡+回复8生命', effect: 'card_reward', value: 0, cardId: 'health_tier3' },
  // 90点: 被动 - 生命+15
  { attribute: 'health', threshold: 90, name: '强健', description: '最大生命值+15', effect: 'max_health_bonus', value: 15 },
  // 100点: 卡牌奖励 - 钢铁之躯
  { attribute: 'health', threshold: 100, name: '钢铁之躯', description: '获得卡牌【钢铁之躯】- 每回合回复2生命', effect: 'card_reward', value: 0, cardId: 'health_tier5' },

  // ========== 智商 (iq) ==========
  // 30点: 卡牌奖励 - 灵光一闪
  { attribute: 'iq', threshold: 30, name: '灵光一闪', description: '获得卡牌【灵光一闪】- 抽3张牌', effect: 'card_reward', value: 0, cardId: 'iq_tier1' },
  // 50点: 被动 - 抽+1卡
  { attribute: 'iq', threshold: 50, name: '聪明', description: '每回合额外抽1张卡', effect: 'extra_draw', value: 1 },
  // 70点: 卡牌奖励 - 聪颖
  { attribute: 'iq', threshold: 70, name: '聪颖', description: '获得卡牌【聪颖】- 抽2牌+1精力', effect: 'card_reward', value: 0, cardId: 'iq_tier3' },
  // 90点: 被动 - 抽+1卡
  { attribute: 'iq', threshold: 90, name: '睿智', description: '每回合额外抽1张卡', effect: 'extra_draw', value: 1 },
  // 100点: 卡牌奖励 - 睿智
  { attribute: 'iq', threshold: 100, name: '睿智', description: '获得卡牌【睿智】- 最大精力+1', effect: 'card_reward', value: 0, cardId: 'iq_tier5' },

  // ========== 情商 (eq) ==========
  // 30点: 卡牌奖励 - 友善
  { attribute: 'eq', threshold: 30, name: '友善', description: '获得卡牌【友善】- 6格挡+净化', effect: 'card_reward', value: 0, cardId: 'eq_tier1' },
  // 50点: 被动 - 格挡+3
  { attribute: 'eq', threshold: 50, name: '亲和', description: '战斗开始获得3点格挡', effect: 'start_block', value: 3 },
  // 70点: 卡牌奖励 - 亲和
  { attribute: 'eq', threshold: 70, name: '亲和', description: '获得卡牌【亲和】- 12格挡+净化', effect: 'card_reward', value: 0, cardId: 'eq_tier3' },
  // 90点: 被动 - 格挡+5
  { attribute: 'eq', threshold: 90, name: '睿智', description: '战斗开始获得5点格挡', effect: 'start_block', value: 5 },
  // 100点: 卡牌奖励 - 沉稳
  { attribute: 'eq', threshold: 100, name: '沉稳', description: '获得卡牌【沉稳】- 每回合+2格挡', effect: 'card_reward', value: 0, cardId: 'eq_tier5' },

  // ========== 财富 (wealth) ==========
  // 30点: 卡牌奖励 - 小富
  { attribute: 'wealth', threshold: 30, name: '小富', description: '获得卡牌【小富】- 1精力+抽1牌', effect: 'card_reward', value: 0, cardId: 'wealth_tier1' },
  // 50点: 被动 - 折扣5%
  { attribute: 'wealth', threshold: 50, name: '殷实', description: '商店折扣5%', effect: 'shop_discount', value: 0.05 },
  // 70点: 卡牌奖励 - 富贵
  { attribute: 'wealth', threshold: 70, name: '富贵', description: '获得卡牌【富贵】- 2精力+抽1牌', effect: 'card_reward', value: 0, cardId: 'wealth_tier3' },
  // 90点: 被动 - 折扣10%
  { attribute: 'wealth', threshold: 90, name: '豪富', description: '商店折扣10%', effect: 'shop_discount', value: 0.10 },
  // 100点: 卡牌奖励 - 豪富
  { attribute: 'wealth', threshold: 100, name: '豪富', description: '获得卡牌【豪富】- 最大精力+1', effect: 'card_reward', value: 0, cardId: 'wealth_tier5' },

  // ========== 人脉 (network) ==========
  // 30点: 卡牌奖励 - 熟人
  { attribute: 'network', threshold: 30, name: '熟人', description: '获得卡牌【熟人】- 8格挡', effect: 'card_reward', value: 0, cardId: 'network_tier1' },
  // 50点: 被动 - 格挡+3
  { attribute: 'network', threshold: 50, name: '朋友', description: '战斗开始获得3点格挡', effect: 'start_block', value: 3 },
  // 70点: 卡牌奖励 - 人脉
  { attribute: 'network', threshold: 70, name: '人脉', description: '获得卡牌【人脉】- 15格挡+抽1牌', effect: 'card_reward', value: 0, cardId: 'network_tier3' },
  // 90点: 被动 - 格挡+8
  { attribute: 'network', threshold: 90, name: '广交', description: '战斗开始获得8点格挡', effect: 'start_block', value: 8 },
  // 100点: 卡牌奖励 - 四通八达
  { attribute: 'network', threshold: 100, name: '四通八达', description: '获得卡牌【四通八达】- 每回合+10护盾', effect: 'card_reward', value: 0, cardId: 'network_tier5' },

  // ========== 名望 (fame) ==========
  // 30点: 卡牌奖励 - 小有名气
  { attribute: 'fame', threshold: 30, name: '小有名气', description: '获得卡牌【小有名气】- 10伤害+虚弱', effect: 'card_reward', value: 0, cardId: 'fame_tier1' },
  // 50点: 被动 - 打断10%
  { attribute: 'fame', threshold: 50, name: '知名', description: '10%概率打断敌人攻击', effect: 'interrupt_chance', value: 0.10 },
  // 70点: 卡牌奖励 - 威名
  { attribute: 'fame', threshold: 70, name: '威名', description: '获得卡牌【威名】- 18伤害+脆弱', effect: 'card_reward', value: 0, cardId: 'fame_tier3' },
  // 90点: 被动 - 打断25%
  { attribute: 'fame', threshold: 90, name: '盛名', description: '25%概率打断敌人攻击', effect: 'interrupt_chance', value: 0.25 },
  // 100点: 卡牌奖励 - 传奇
  { attribute: 'fame', threshold: 100, name: '传奇', description: '获得卡牌【传奇】- 反伤3点', effect: 'card_reward', value: 0, cardId: 'fame_tier5' },
];

const TIER_THRESHOLDS = [30, 50, 70, 90, 100];

export interface AttributeTierInfo {
  currentTier: number;
  nextTier: number | null;
  currentTierName: string | null;
  nextTierName: string | null;
  bonuses: AttributeThresholdBonus[];
  nextBonuses: AttributeThresholdBonus[];
  cardBonuses: AttributeThresholdBonus[];
  passiveBonuses: AttributeThresholdBonus[];
}

export function getAttributeTierInfo(attr: keyof PlayerAttributes, value: number): AttributeTierInfo {
  const bonuses = ATTRIBUTE_BONUSES.filter((b) => b.attribute === attr && value >= b.threshold);
  const nextBonuses = ATTRIBUTE_BONUSES.filter((b) => b.attribute === attr && value < b.threshold);
  const currentTier = bonuses.length;
  const nextTier = nextBonuses.length > 0 ? nextBonuses[0].threshold : null;

  const currentTierBonus = bonuses.length > 0 ? bonuses[bonuses.length - 1] : null;
  const nextTierBonus = nextBonuses.length > 0 ? nextBonuses[0] : null;

  const cardBonuses = bonuses.filter((b) => b.effect === 'card_reward');
  const passiveBonuses = bonuses.filter((b) => b.effect !== 'card_reward');

  return {
    currentTier,
    nextTier,
    currentTierName: currentTierBonus?.name || null,
    nextTierName: nextTierBonus?.name || null,
    bonuses,
    nextBonuses: nextTierBonus ? [nextTierBonus] : [],
    cardBonuses,
    passiveBonuses,
  };
}

function getActiveBonuses(attrs: PlayerAttributes): AttributeThresholdBonus[] {
  return ATTRIBUTE_BONUSES.filter((b) => attrs[b.attribute] >= b.threshold);
}

function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function seededRandom(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; }
function shuffle<T>(arr: T[], rand = Math.random) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickRandom<T>(arr: T[], count: number, rand = Math.random): T[] { return shuffle(arr, rand).slice(0, Math.min(count, arr.length)); }
function generateWonderOptions(): WonderRewardOption[] {
  const pool = WONDER_REWARD_POOL;
  const types: WonderRewardType[] = ['card', 'card', 'card', 'card', 'attribute', 'attribute', 'attribute', 'relic', 'relic', 'gold'];
  const result: WonderRewardOption[] = [];
  const usedCardIds = new Set<string>();
  const usedRelicIds = new Set<string>();
  while (result.length < 3) {
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'card') {
      const available = pool.cards.filter(c => !usedCardIds.has(c.id));
      if (available.length === 0) continue;
      const card = available[Math.floor(Math.random() * available.length)];
      usedCardIds.add(card.id);
      result.push({ type: 'card', card: { ...card, id: generateId() } });
    } else if (type === 'attribute') {
      const attr = pool.attributes[Math.floor(Math.random() * pool.attributes.length)];
      result.push({ type: 'attribute', attribute: { ...attr } });
    } else if (type === 'relic') {
      const available = pool.relics.filter(r => !usedRelicIds.has(r.id));
      if (available.length === 0) continue;
      const relic = available[Math.floor(Math.random() * available.length)];
      usedRelicIds.add(relic.id);
      result.push({ type: 'relic', relic: { ...relic, id: generateId() } });
    } else {
      const gold = pool.gold[Math.floor(Math.random() * pool.gold.length)];
      result.push({ type: 'gold', gold });
    }
  }
  return result;
}
function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

function applyCardEffect(effect: { type: string; value: number; duration?: number }, combat: CombatState, targetIdx: number): CombatState {
  const c = { ...combat, player: { ...combat.player, statusEffects: [...combat.player.statusEffects] }, enemies: combat.enemies.map((e) => ({ ...e, statusEffects: [...e.statusEffects] })) };
  const t = c.enemies[targetIdx];
  switch (effect.type) {
    case 'damage': if (t) { const d = Math.max(0, effect.value - t.block); t.block = Math.max(0, t.block - effect.value); t.currentHealth -= d; } break;
    case 'block': c.player.block += effect.value; break;
    case 'heal': c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + effect.value); break;
    case 'draw': for (let i = 0; i < effect.value; i++) { if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!); } break;
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
    case 'lifesteal':
      break;
  }
  return c;
}

function getEnemyPool(type: OptionType, era: number, yearInEra: number, rand: () => number, age?: number, currentYear?: number): Enemy[] {
  const totalYears = era * 10 + yearInEra;
  const multiplier = 1 + Math.floor(totalYears / 5) * 0.3;
  const mechanics: EnemyMechanic[] = [];
  if (totalYears >= 10) mechanics.push('double_attack');
  if (totalYears >= 20) mechanics.push('shield');
  if (totalYears >= 30) mechanics.push('regen');
  if (totalYears >= 40) mechanics.push('rage');

  // 获取年龄段信息用于怪物名称映射
  const resolvedAge = age ?? totalYears;
  const resolvedYear = currentYear ?? (1950 + totalYears);
  const ageStage = getAgeStage(resolvedAge);
  void ageStage; // 保留供调试和日志使用

  const numEnemies = type === 'elite' || type === 'boss' ? 1 : rand() < 0.3 ? 2 : 1;
  const enemies: Enemy[] = [];

  // 使用年龄映射获取怪物变体
  const slimeVariant = getNormalMonsterVariant('slime', resolvedAge);
  const ghostVariant = getNormalMonsterVariant('ghost', resolvedAge);
  const golemVariant = getNormalMonsterVariant('golem', resolvedAge);
  const wraithVariant = getNormalMonsterVariant('wraith', resolvedAge);
  const academicVariant = getEliteMonsterVariant('academic', resolvedAge);
  const burnoutVariant = getEliteMonsterVariant('burnout', resolvedAge);

  const enemyTemplates: Record<string, () => Enemy> = {
    slime: () => {
      const partial = createMonsterFromVariant(slimeVariant, 'slime', resolvedAge, multiplier);
      return {
        id: '',
        name: slimeVariant.name,
        icon: slimeVariant.icon,
        description: slimeVariant.description,
        maxHealth: partial.maxHealth || Math.floor(20 * multiplier),
        currentHealth: partial.currentHealth || Math.floor(20 * multiplier),
        block: partial.block || 0,
        intents: partial.intents || [{ type: 'attack', damage: Math.floor(4 * multiplier) }, { type: 'defend', block: 3 }, { type: 'attack', damage: Math.floor(6 * multiplier) }],
        currentIntentIndex: 0,
        statusEffects: [],
        isBoss: false,
        cardRewards: pickRandom(COMMON_ATTACK_CARDS, 1, rand).concat(pickRandom(COMMON_SKILL_CARDS, 1, rand)),
        goldReward: [5, 15],
        mechanics: [...mechanics],
      };
    },
    ghost: () => {
      const partial = createMonsterFromVariant(ghostVariant, 'ghost', resolvedAge, multiplier);
      return {
        id: '',
        name: ghostVariant.name,
        icon: ghostVariant.icon,
        description: ghostVariant.description,
        maxHealth: partial.maxHealth || Math.floor(25 * multiplier),
        currentHealth: partial.currentHealth || Math.floor(25 * multiplier),
        block: partial.block || 0,
        intents: partial.intents || [{ type: 'attack', damage: Math.floor(3 * multiplier), hits: 2 }, { type: 'buff', effect: 'strength', value: 1 }, { type: 'attack', damage: Math.floor(8 * multiplier) }],
        currentIntentIndex: 0,
        statusEffects: [],
        isBoss: false,
        cardRewards: pickRandom(COMMON_SKILL_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)),
        goldReward: [8, 20],
        mechanics: [...mechanics],
      };
    },
    golem: () => {
      const partial = createMonsterFromVariant(golemVariant, 'golem', resolvedAge, multiplier);
      return {
        id: '',
        name: golemVariant.name,
        icon: golemVariant.icon,
        description: golemVariant.description,
        maxHealth: partial.maxHealth || Math.floor(35 * multiplier),
        currentHealth: partial.currentHealth || Math.floor(35 * multiplier),
        block: partial.block || 5,
        intents: partial.intents || [{ type: 'defend', block: 8 }, { type: 'attack', damage: Math.floor(10 * multiplier) }, { type: 'attack', damage: Math.floor(6 * multiplier) }],
        currentIntentIndex: 0,
        statusEffects: [{ type: 'block', value: 5, duration: 99 }],
        isBoss: false,
        cardRewards: pickRandom(COMMON_ATTACK_CARDS, 1, rand).concat(pickRandom(COMMON_SKILL_CARDS, 1, rand)).concat(pickRandom(RARE_CARDS, 1, rand)),
        goldReward: [10, 25],
        mechanics: [...mechanics],
      };
    },
    wraith: () => {
      const partial = createMonsterFromVariant(wraithVariant, 'wraith', resolvedAge, multiplier);
      return {
        id: '',
        name: wraithVariant.name,
        icon: wraithVariant.icon,
        description: wraithVariant.description,
        maxHealth: partial.maxHealth || Math.floor(18 * multiplier),
        currentHealth: partial.currentHealth || Math.floor(18 * multiplier),
        block: partial.block || 0,
        intents: partial.intents || [{ type: 'debuff', effect: 'weak', value: 2 }, { type: 'attack', damage: Math.floor(5 * multiplier) }, { type: 'debuff', effect: 'vulnerable', value: 2 }],
        currentIntentIndex: 0,
        statusEffects: [],
        isBoss: false,
        cardRewards: pickRandom(COMMON_SKILL_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)),
        goldReward: [5, 15],
        mechanics: [...mechanics],
      };
    },
    academic: () => {
      const ageMultiplier = 1 + (resolvedAge < 20 ? 0.8 : resolvedAge < 40 ? 1.0 : 1.2);
      return {
        id: '',
        name: academicVariant.name,
        icon: academicVariant.icon,
        description: academicVariant.description,
        maxHealth: Math.floor(80 * multiplier * ageMultiplier),
        currentHealth: Math.floor(80 * multiplier * ageMultiplier),
        block: 0,
        intents: [
          { type: 'attack', damage: Math.floor(15 * multiplier) },
          { type: 'buff', effect: 'strength', value: 2 },
          { type: 'attack', damage: Math.floor(10 * multiplier), hits: 2 },
        ],
        currentIntentIndex: 0,
        statusEffects: [],
        isBoss: false,
        cardRewards: pickRandom(RARE_CARDS, 2, rand).concat(pickRandom(LEGENDARY_CARDS, 1, rand)),
        goldReward: [25, 50],
        mechanics: [...mechanics],
      };
    },
    burnout: () => {
      const ageMultiplier = 1 + (resolvedAge < 20 ? 0.8 : resolvedAge < 40 ? 1.0 : 1.2);
      return {
        id: '',
        name: burnoutVariant.name,
        icon: burnoutVariant.icon,
        description: burnoutVariant.description,
        maxHealth: Math.floor(65 * multiplier * ageMultiplier),
        currentHealth: Math.floor(65 * multiplier * ageMultiplier),
        block: 0,
        intents: [
          { type: 'attack', damage: Math.floor(12 * multiplier) },
          { type: 'debuff', effect: 'weak', value: 3 },
          { type: 'attack', damage: Math.floor(8 * multiplier), hits: 2 },
        ],
        currentIntentIndex: 0,
        statusEffects: [{ type: 'strength', value: 1, duration: 99 }],
        isBoss: false,
        cardRewards: pickRandom(RARE_CARDS, 2, rand).concat(pickRandom(LEGENDARY_CARDS, 1, rand)),
        goldReward: [30, 60],
        mechanics: [...mechanics],
      };
    },
    boss: () => {
      // 使用年度Boss映射 - 根据年龄和年份生成不同的Boss
      const bossPartial = createAnnualBoss(resolvedAge, resolvedYear, multiplier);
      return {
        id: '',
        name: bossPartial.name || '时代终结者',
        icon: bossPartial.icon || '💀',
        description: bossPartial.description || '回顾你的一生',
        maxHealth: bossPartial.maxHealth || Math.floor(150 * multiplier),
        currentHealth: bossPartial.currentHealth || Math.floor(150 * multiplier),
        block: bossPartial.block || 10,
        intents: bossPartial.intents || [
          { type: 'attack', damage: Math.floor(20 * multiplier) },
          { type: 'special', name: '审判', description: '造成巨额固定伤害' },
          { type: 'debuff', effect: 'weak', value: 3 },
        ],
        currentIntentIndex: 0,
        statusEffects: [{ type: 'block', value: 10, duration: 99 }],
        isBoss: true,
        cardRewards: pickRandom(LEGENDARY_CARDS, 2, rand).concat(pickRandom(RARE_CARDS, 1, rand)),
        goldReward: [80, 150],
        mechanics: [...(bossPartial.mechanics || mechanics), 'boss_aura'] as EnemyMechanic[],
      };
    },
  };

  if (type === 'boss') {
    enemies.push(enemyTemplates.boss());
  } else if (type === 'elite') {
    enemies.push(rand() < 0.5 ? enemyTemplates.academic() : enemyTemplates.burnout());
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
const initialAttributes: PlayerAttributes = { energy: 18, physique: 18, health: 18, iq: 18, eq: 18, wealth: 16, network: 16, fame: 16 };

const initialCombatState: CombatState = {
  isInCombat: false, phase: 'player_turn', currentTurn: 0,
  player: { currentHealth: 50, maxHealth: 50, block: 0, energy: BASE_ENERGY, maxEnergy: BASE_ENERGY, hand: [], drawPile: [], discardPile: [], exhaustPile: [], statusEffects: [] },
  enemies: [], currentEnemyIndex: 0, rewards: { mode: 'battle', cards: [], attribute: undefined, relic: undefined, wonderOptions: [] }, availableBonuses: [], log: [], burnLifeUsed: false, selectedForDiscard: [], requiredDiscardCount: 0,
};

const initialCultivationState: CultivationState = { realm: 'mortal', maxLifespan: 70, tribulationThreshold: 0, realmBonus: {} };

export interface DamageEvent {
  id: string;
  value: number;
  targetId: string;
  x: number;
  y: number;
  isHeal?: boolean;
}

let damageEvents: DamageEvent[] = [];
let damageEventId = 0;

export function triggerDamageEvent(value: number, targetId: string, isHeal = false) {
  const event: DamageEvent = {
    id: `dmg_${++damageEventId}`,
    value,
    targetId,
    x: Math.random() * 40 + 30,
    y: Math.random() * 20 + 10,
    isHeal,
  };
  damageEvents = [...damageEvents, event];
  setTimeout(() => {
    damageEvents = damageEvents.filter(e => e.id !== event.id);
  }, 1200);
}

export function getDamageEvents(): DamageEvent[] {
  return damageEvents;
}

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
  baseAttributes: { ...initialAttributes },
  remainingAttributePoints: 35,
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
  damageEventCounter: 0,
  lastCombatEnemies: [],
  attributeCardsGranted: false,
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
  selectTarget: (index: number) => void;
  endTurn: () => void;
  activateBonus: (bonusId: string) => void;
  selectCardReward: (cardId: string) => void;
  selectAttributeReward: () => void;
  selectWonderOption: (index: number) => void;
  endCombat: (victory: boolean) => void;
  makeChoice: (event: GameEvent, option: EventOption) => void;
  generateShop: () => void;
  buyShopItem: (index: number) => void;
  rest: () => void;
  attemptBreakthrough: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  deleteSave: () => Promise<void>;
  hasSavedGame: () => Promise<boolean>;
  getSuccessRate: (option: EventOption) => number;
  getAvailableEvents: () => GameEvent[];
  checkHiddenTags: () => string[];
  getEffectiveMaxHealth: () => number;
  getDrawCount: () => number;
  getEnergy: () => number;
  getShopDiscount: () => number;
  getActiveAttributeBonuses: () => AttributeThresholdBonus[];
  getAttributeTierInfo: (attr: keyof PlayerAttributes, value: number) => AttributeTierInfo;
  toggleDiscardSelection: (cardId: string) => void;
  confirmDiscard: () => void;
  exileCard: (cardId: string) => void;
}

const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialState,

  selectMode: (mode) => set({ mode, phase: 'setup' }),

  startGame: (birthYear) => {
    const era = ERAS.find((e) => e.year === birthYear);
    if (!era) return;
    const mode = get().mode;
    const rand = seededRandom(Date.now());

    // 基础属性总值140点，随机分配给8项属性
    const TOTAL_BASE_POINTS = 140;
    const MIN_ATTR_VALUE = 5; // 每项属性最低5点
    const MAX_ATTR_VALUE = 30; // 每项属性最高30点

    // 生成8个随机权重
    const rawWeights = Array.from({ length: 8 }, () => 0.3 + rand() * 0.7);
    const weightSum = rawWeights.reduce((a, b) => a + b, 0);
    const portions = rawWeights.map((w) => w / weightSum);

    // 先按比例分配，再应用上下限
    const rawAttrs = portions.map((p) => Math.round(p * TOTAL_BASE_POINTS));
    const attrs: PlayerAttributes = {
      energy: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[0])),
      physique: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[1])),
      health: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[2])),
      iq: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[3])),
      eq: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[4])),
      wealth: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[5])),
      network: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[6])),
      fame: Math.max(MIN_ATTR_VALUE, Math.min(MAX_ATTR_VALUE, rawAttrs[7])),
    };

    // 调整使总和为140（处理上限截断后的差值）
    let currentSum = Object.values(attrs).reduce((a, b) => a + b, 0);
    let diff = TOTAL_BASE_POINTS - currentSum;
    let attempts = 0;
    while (diff !== 0 && attempts < 100) {
      const adjustable = (Object.keys(attrs) as (keyof PlayerAttributes)[]).filter((k) =>
        diff > 0 ? attrs[k] < MAX_ATTR_VALUE : attrs[k] > MIN_ATTR_VALUE
      );
      if (adjustable.length === 0) break;
      const attr = adjustable[Math.floor(rand() * adjustable.length)];
      const adjust = diff > 0 ? 1 : -1;
      attrs[attr] += adjust;
      diff -= adjust;
      attempts++;
    }

    const deck = STARTER_DECK.map((c) => ({ ...c, id: generateId() }));
    const state: Partial<GameState> = {
      phase: 'allocating', birthYear, currentYear: birthYear, currentEra: 0, age: 0,
      maxLifespan: era.baseLifeExpectancy, remainingLife: era.baseLifeExpectancy,
      attributes: attrs, baseAttributes: { ...attrs }, remainingAttributePoints: era.attributePoints,
      hiddenTags: [], npcs: [], choiceHistory: [], lifeRecords: [],
      deck, relics: [], gold: 30, worldState: { ...initialWorldState }, seed: Date.now(),
      attributeCardsGranted: false,
    };
    if (mode === 'endless') state.cultivation = { ...initialCultivationState, maxLifespan: era.baseLifeExpectancy };
    set(state as GameState);
    storageService.removeData(STORAGE_KEY);
  },

  allocateAttribute: (attr, value) => {
    const s = get();
    const diff = value - s.attributes[attr];
    const baseValue = s.baseAttributes[attr];
    if (value < baseValue || value > 99) return;
    if (diff > s.remainingAttributePoints) return;
    set({ attributes: { ...s.attributes, [attr]: value }, remainingAttributePoints: s.remainingAttributePoints - diff });
  },

  confirmAllocation: () => {
    const s = get();
    if (s.remainingAttributePoints > 0) return;

    // 发放属性阶层卡牌
    if (!s.attributeCardsGranted) {
      const cardsToAdd: LifeCard[] = [];
      const allBonuses = getActiveBonuses(s.attributes);
      for (const bonus of allBonuses) {
        if (bonus.effect === 'card_reward' && bonus.cardId) {
          const attrCards = ATTRIBUTE_TIER_CARDS[bonus.attribute];
          const card = attrCards?.find((c) => c.id === bonus.cardId);
          if (card) {
            cardsToAdd.push({ ...card, id: generateId() });
          }
        }
      }
      if (cardsToAdd.length > 0) {
        set({ deck: [...s.deck, ...cardsToAdd], attributeCardsGranted: true });
      }
    }

    set({ phase: 'year_view' });
    get().generateMap();
  },

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
          const type = pickWeightedType(rand);
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
        const enemies = getEnemyPool(opt.type, s.currentEra, year.eraIndex, rand, s.age, s.currentYear).map((e) => ({ ...e, id: generateId(), currentHealth: e.maxHealth }));
        if (enemies.length > 0) get().startCombat(enemies);
        break;
      }
      case 'event': {
        // 检查当前年龄是否有可用事件
        const availableEvents = get().getAvailableEvents();
        const currentEvent = availableEvents.find(e => e.options.length > 0);
        if (currentEvent) {
          set({ phase: 'event' });
        } else {
          // 没有可用事件，自动跳过
          get().completeOption();
        }
        break;
      }
      case 'wonder': {
        const s = get();
        const wonderOptions = generateWonderOptions();
        set({
          combat: {
            ...s.combat,
            rewards: { mode: 'wonder', cards: [], attribute: undefined, relic: undefined, wonderOptions },
          },
          phase: 'reward',
        });
        break;
      }
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
    const nextYearIndex = completed ? yearIdx : nextIdx;
    const newCurrentYear = (s.birthYear || 1950) + s.currentEra * 10 + nextYearIndex;
    const newAge = newCurrentYear - (s.birthYear || 1950);
    set({ currentMap: { ...s.currentMap, years: newYears, currentYearIndex: nextYearIndex, completed }, currentYear: newCurrentYear, age: newAge, phase: completed ? 'era_transition' : 'year_view' });
    if (completed) get().advanceEra();
  },

  advanceEra: () => {
    const s = get();
    const nextEra = s.currentEra + 1;
    const nextYear = (s.birthYear || 1950) + nextEra * 10;
    const newAge = nextYear - (s.birthYear || 1950);
    const lifeDec = Math.floor(5 + Math.random() * 5);
    const newTags = get().checkHiddenTags();
    const newLife = Math.max(0, s.remainingLife - lifeDec);
    const newPhase: GamePhase = (newLife <= 0 || s.attributes.health <= 0) ? 'ended' : 'year_view';
    set({ currentEra: nextEra, currentYear: nextYear, age: newAge, remainingLife: newLife, hiddenTags: newTags, phase: newPhase, currentMap: null, combat: { ...initialCombatState }, shop: null });
    if (newPhase === 'year_view') get().generateMap();
  },

  endGame: () => { set({ phase: 'ended' }); },
  resetGame: () => { set({ ...initialState, phase: 'setup' }); storageService.removeData(STORAGE_KEY); },

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
        currentEnemyIndex: 0, rewards: { mode: 'battle', cards: [], attribute: undefined, relic: undefined, wonderOptions: [] }, availableBonuses: combatBonuses, log: [], burnLifeUsed: false, selectedForDiscard: [], requiredDiscardCount: 0,
      },
      phase: 'combat',
      lastCombatEnemies: enemies,
    });
  },

  playCard: (cardId, targetIdx) => {
    const s = get();
    if (s.combat.phase !== 'player_turn') return;
    const idx = s.combat.player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const card = s.combat.player.hand[idx];
    if (card.cost > s.combat.player.energy) return;
    const bonuses = getActiveBonuses(s.attributes);
    const damageBoost = 1 + bonuses.filter((b) => b.effect === 'damage_boost').reduce((sum, b) => sum + b.value, 0);

    let c = { ...s.combat, player: { ...s.combat.player, hand: [...s.combat.player.hand], statusEffects: [...s.combat.player.statusEffects] } };
    c.player.hand.splice(idx, 1);
    c.player.energy -= card.cost;

    const beforeHealth = c.enemies.map(e => e.currentHealth);
    const beforeBlock = c.player.block;
    const enemyBlocksBefore = c.enemies.map(e => e.block);
    const effectiveTargetIdx = targetIdx !== undefined ? targetIdx : c.currentEnemyIndex;
    const lifestealEff = card.effects.find((e) => e.type === 'lifesteal');
    const otherEffects = card.effects.filter((e) => e.type !== 'lifesteal');
    for (const eff of otherEffects) {
      const modifiedEff = eff.type === 'damage' ? { ...eff, value: Math.floor(eff.value * damageBoost) } : eff;
      c = applyCardEffect(modifiedEff, c, effectiveTargetIdx);
    }
    if (lifestealEff && lifestealEff.value > 0) {
      const totalDamage = beforeHealth.reduce((sum, h, i) => sum + Math.max(0, h - c.enemies[i].currentHealth), 0);
      const healAmount = Math.floor(totalDamage * lifestealEff.value);
      if (healAmount > 0) {
        c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + healAmount);
      }
    }
    c.player.discardPile.push(card);

    c.enemies.forEach((enemy, i) => {
      const dmg = beforeHealth[i] - enemy.currentHealth;
      const blockUsed = enemyBlocksBefore[i] - enemy.block;
      if (blockUsed > 0) {
        triggerDamageEvent(blockUsed, `enemy_block_${enemy.id}`, true);
      }
      if (dmg > 0) {
        triggerDamageEvent(dmg, enemy.id);
      }
    });

    const blockGained = c.player.block - beforeBlock;
    if (blockGained > 0) {
      triggerDamageEvent(blockGained, 'player_block_gained', true);
    }
    set({ damageEventCounter: get().damageEventCounter + 1 });

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
      set({ combat: { ...c, phase: 'victory', rewards: { mode: 'battle', cards: cardRewards, attribute: undefined, relic: relicReward, wonderOptions: [] } }, phase: 'reward' });
      return;
    }

    const nextAliveIdx = c.enemies.findIndex((e) => e.currentHealth > 0);
    if (nextAliveIdx >= 0 && c.enemies[c.currentEnemyIndex]?.currentHealth <= 0) {
      c.currentEnemyIndex = nextAliveIdx;
    }

    set({ combat: c });
  },

  selectTarget: (index: number) => {
    const s = get();
    if (s.combat.phase !== 'player_turn') return;
    if (index < 0 || index >= s.combat.enemies.length) return;
    if (s.combat.enemies[index].currentHealth <= 0) return;
    set({ combat: { ...s.combat, currentEnemyIndex: index } });
  },

  activateBonus: (bonusId) => {
    const s = get();
    if (s.combat.burnLifeUsed) return;
    const bonus = s.combat.availableBonuses.find((b) => b.id === bonusId);
    if (!bonus || s.remainingLife <= bonus.lifeCost) return;

    let c = { ...s.combat, player: { ...s.combat.player } };
    switch (bonus.effect) {
      case 'draw':
        for (let i = 0; i < bonus.value; i++) {
          if (c.player.drawPile.length === 0) { c.player.drawPile = shuffle(c.player.discardPile); c.player.discardPile = []; }
          if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
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
          if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
        }
        break;
      case 'extra_energy':
        c.player.energy += bonus.value;
        break;
    }

    c.burnLifeUsed = true;
    set({ combat: c, remainingLife: s.remainingLife - bonus.lifeCost });
  },

  toggleDiscardSelection: (cardId: string) => {
    const s = get();
    if (s.combat.phase !== 'discard_selection') return;
    const card = s.combat.player.hand.find((c) => c.id === cardId);
    if (!card) return;
    const selected = s.combat.selectedForDiscard;
    const idx = selected.indexOf(cardId);
    if (idx >= 0) {
      set({ combat: { ...s.combat, selectedForDiscard: selected.filter((id) => id !== cardId) } });
    } else {
      set({ combat: { ...s.combat, selectedForDiscard: [...selected, cardId] } });
    }
  },

  confirmDiscard: () => {
    const s = get();
    let c = deepClone(s.combat);

    let retainedCards: LifeCard[] = [];
    if (c.phase === 'discard_selection') {
      const selectedIds = c.selectedForDiscard;
      const toDiscard: LifeCard[] = [];
      for (const card of c.player.hand) {
        if (selectedIds.includes(card.id)) {
          toDiscard.push(card);
        } else {
          retainedCards.push(card);
        }
      }
      c.player.discardPile.push(...toDiscard);
      c.player.hand = [];
      c.selectedForDiscard = [];
      c.requiredDiscardCount = 0;
    } else {
      retainedCards = [...c.player.hand];
      c.player.hand = [];
    }

    c.player.energy = c.player.maxEnergy;

    const bonuses = getActiveBonuses(s.attributes);
    const interruptChance = bonuses.filter((b) => b.effect === 'interrupt_chance').reduce((sum, b) => sum + b.value, 0);

    for (const e of c.enemies) {
      if (e.currentHealth <= 0) continue;
      e.block = 0;
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
          const blocked = Math.min(c.player.block, dmg);
          const d = Math.max(0, dmg - c.player.block);
          c.player.block = Math.max(0, c.player.block - dmg);
          c.player.currentHealth -= d;
          if (blocked > 0) {
            triggerDamageEvent(blocked, 'player_block', true);
          }
          if (d > 0) {
            triggerDamageEvent(d, 'player');
          }
          const sh = c.player.statusEffects.find((x) => x.type === 'shields');
          if (sh && sh.value > 0) { const ab = Math.min(sh.value, d); sh.value -= ab; c.player.currentHealth += ab; if (ab > 0) triggerDamageEvent(ab, 'player_heal', true); }
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
        const debuffRed = bonuses.filter((b) => b.effect === 'debuff_reduction').reduce((sum, b) => sum + b.value, 0);
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

    if (c.player.currentHealth <= 0) {
      set({ combat: { ...c, phase: 'defeat' }, phase: 'ended' });
      set({ damageEventCounter: get().damageEventCounter + 1 });
      return;
    }
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
      set({ combat: { ...c, phase: 'victory', rewards: { mode: 'battle', cards: cardRewards, attribute: undefined, relic: relicReward, wonderOptions: [] } }, phase: 'reward' });
      set({ damageEventCounter: get().damageEventCounter + 1 });
      return;
    }

    const nextAliveIdx2 = c.enemies.findIndex((e) => e.currentHealth > 0);
    if (nextAliveIdx2 >= 0 && c.enemies[c.currentEnemyIndex]?.currentHealth <= 0) {
      c.currentEnemyIndex = nextAliveIdx2;
    }

    c.player.block = 0;
    c.currentTurn++;
    c.phase = 'player_turn';

    c.player.hand = [...retainedCards];

    const drawBonus = bonuses.filter((b) => b.effect === 'extra_draw').reduce((sum, b) => sum + b.value, 0);
    const draw = BASE_DRAW_COUNT + drawBonus;
    for (let i = 0; i < draw; i++) {
      if (c.player.drawPile.length === 0) { c.player.drawPile = shuffle(c.player.discardPile); c.player.discardPile = []; }
      if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
    }
    set({ combat: c });
    set({ damageEventCounter: get().damageEventCounter + 1 });
  },

  endTurn: () => {
    const s = get();
    if (s.combat.phase !== 'player_turn') return;
    const excess = s.combat.player.hand.length - MAX_HAND_SIZE;
    if (excess > 0) {
      set({ combat: { ...s.combat, phase: 'discard_selection', selectedForDiscard: [], requiredDiscardCount: excess } });
    } else {
      get().confirmDiscard();
    }
  },

  exileCard: (cardId: string) => {
    const s = get();
    if (!s.combat.isInCombat) return;
    const handIdx = s.combat.player.hand.findIndex((c) => c.id === cardId);
    if (handIdx >= 0) {
      const card = s.combat.player.hand[handIdx];
      const newHand = [...s.combat.player.hand];
      newHand.splice(handIdx, 1);
      set({ combat: { ...s.combat, player: { ...s.combat.player, hand: newHand, exhaustPile: [...s.combat.player.exhaustPile, card] }, selectedForDiscard: s.combat.selectedForDiscard.filter((id) => id !== cardId) } });
      return;
    }
    const drawIdx = s.combat.player.drawPile.findIndex((c) => c.id === cardId);
    if (drawIdx >= 0) {
      const card = s.combat.player.drawPile[drawIdx];
      const newDrawPile = [...s.combat.player.drawPile];
      newDrawPile.splice(drawIdx, 1);
      set({ combat: { ...s.combat, player: { ...s.combat.player, drawPile: newDrawPile, exhaustPile: [...s.combat.player.exhaustPile, card] } } });
      return;
    }
    const discardIdx = s.combat.player.discardPile.findIndex((c) => c.id === cardId);
    if (discardIdx >= 0) {
      const card = s.combat.player.discardPile[discardIdx];
      const newDiscardPile = [...s.combat.player.discardPile];
      newDiscardPile.splice(discardIdx, 1);
      set({ combat: { ...s.combat, player: { ...s.combat.player, discardPile: newDiscardPile, exhaustPile: [...s.combat.player.exhaustPile, card] } } });
    }
  },

  endCombat: (victory) => {
    const s = get();
    if (victory) {
      const hasBattleRewards = s.combat.rewards.cards.length > 0 || s.combat.rewards.attribute || s.combat.rewards.relic;
      const hasWonderRewards = s.combat.rewards.wonderOptions.length > 0;
      if (hasBattleRewards || hasWonderRewards) set({ phase: 'reward' });
      else get().completeOption();
    } else {
      set({ phase: 'ended' });
    }
  },

  selectCardReward: (cardId) => { const s = get(); const card = s.combat.rewards.cards.find((c) => c.id === cardId); if (card) set({ deck: [...s.deck, { ...deepClone(card), id: generateId() }] }); get().completeOption(); },
  selectAttributeReward: () => { const s = get(); if (s.combat.rewards.attribute) { const newAttrs = { ...s.attributes }; for (const [k, v] of Object.entries(s.combat.rewards.attribute)) { newAttrs[k as keyof PlayerAttributes] = clamp(newAttrs[k as keyof PlayerAttributes] + (v || 0)); } set({ attributes: newAttrs }); } get().completeOption(); },
  selectWonderOption: (index) => {
    const s = get();
    const option = s.combat.rewards.wonderOptions[index];
    if (!option) { get().completeOption(); return; }
    if (option.type === 'card' && option.card) {
      set({ deck: [...s.deck, { ...deepClone(option.card), id: generateId() }] });
    } else if (option.type === 'attribute' && option.attribute) {
      const newAttrs = { ...s.attributes };
      for (const [k, v] of Object.entries(option.attribute)) {
        newAttrs[k as keyof PlayerAttributes] = clamp(newAttrs[k as keyof PlayerAttributes] + (v || 0));
      }
      set({ attributes: newAttrs });
    } else if (option.type === 'gold' && option.gold) {
      set({ gold: s.gold + option.gold });
    } else if (option.type === 'relic' && option.relic) {
      set({ relics: [...s.relics, { ...deepClone(option.relic), id: generateId() }] });
    }
    get().completeOption();
  },

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
        id: generateId(), gameState: {
          phase: s.phase, mode: s.mode, birthYear: s.birthYear, currentYear: s.currentYear,
          currentEra: s.currentEra, age: s.age, maxLifespan: s.maxLifespan, remainingLife: s.remainingLife,
          attributes: s.attributes, baseAttributes: s.baseAttributes, remainingAttributePoints: s.remainingAttributePoints,
          hiddenTags: s.hiddenTags, npcs: s.npcs, choiceHistory: s.choiceHistory, lifeRecords: s.lifeRecords,
          deck: s.deck, relics: s.relics, gold: s.gold, combat: s.combat, currentMap: s.currentMap,
          shop: s.shop, cultivation: s.cultivation, worldState: s.worldState, seed: s.seed,
          damageEventCounter: s.damageEventCounter, lastCombatEnemies: s.lastCombatEnemies,
        }, updatedAt: new Date().toISOString(), isDead: false,
      });
    } catch (e) { console.error('保存失败:', e); }
  },

  loadGame: async () => {
    try {
      const d = await storageService.loadData<any>(STORAGE_KEY);
      if (d?.gameState && !d.isDead) {
        set(d.gameState);
        // 确保属性阶层卡牌已发放
        const s = get();
        if (!s.attributeCardsGranted && s.phase !== 'setup' && s.phase !== 'allocating') {
          const cardsToAdd: LifeCard[] = [];
          const allBonuses = getActiveBonuses(s.attributes);
          for (const bonus of allBonuses) {
            if (bonus.effect === 'card_reward' && bonus.cardId) {
              const attrCards = ATTRIBUTE_TIER_CARDS[bonus.attribute];
              const card = attrCards?.find((c) => c.id === bonus.cardId);
              if (card) {
                cardsToAdd.push({ ...card, id: generateId() });
              }
            }
          }
          if (cardsToAdd.length > 0) {
            set({ deck: [...get().deck, ...cardsToAdd], attributeCardsGranted: true });
          }
        }
      }
    } catch (e) { console.error('加载失败:', e); }
  },

  deleteSave: async () => {
    try { await storageService.removeData(STORAGE_KEY); } catch (e) { console.error('删除存档失败:', e); }
  },

  hasSavedGame: async (): Promise<boolean> => {
    try { const d = await storageService.loadData<any>(STORAGE_KEY); return !!(d?.gameState && !d.isDead); } catch { return false; }
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

  getAvailableEvents: () => {
    const s = get();
    return SCRIPT_1950_EVENTS.filter((event) => {
      if (!event.ageRange) return true;
      const [minAge, maxAge] = event.ageRange;
      return s.age >= minAge && s.age <= maxAge;
    });
  },
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
  getAttributeTierInfo: (attr, value) => getAttributeTierInfo(attr, value),
}));

export function getEffectDisplayValue(
  baseValue: number,
  effectType: string,
  playerStatusEffects: StatusEffect[],
  damageBoost: number = 1
): number {
  if (effectType === 'damage') {
    let value = Math.floor(baseValue * damageBoost);
    const strength = playerStatusEffects.find((s) => s.type === 'strength');
    if (strength) value += strength.value;
    const weak = playerStatusEffects.find((s) => s.type === 'weak');
    if (weak) value = Math.floor(value * 0.75);
    return Math.max(0, value);
  }
  if (effectType === 'block') {
    let value = baseValue;
    const dexterity = playerStatusEffects.find((s) => s.type === 'dexterity');
    if (dexterity) value += dexterity.value;
    return Math.max(0, value);
  }
  return baseValue;
}

export default useSimulationStore;
export { TIER_THRESHOLDS };
