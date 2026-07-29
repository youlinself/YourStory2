import type { CardEffect, StatusEffect, EnemyIntent, CombatState, CombatLogEntry } from '../types/simulation';

export type { CombatState } from '../types/simulation';
export type PlayerState = CombatState['player'];
export type EnemyState = CombatState['enemies'][number];

function createLogEntry(turn: number, actor: string, action: string): CombatLogEntry {
  return {
    turn,
    actor,
    action,
    timestamp: Date.now(),
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculateDamage(base: number, attackerEffects: StatusEffect[], defenderEffects: StatusEffect[]): number {
  let dmg = base;
  const totalStrength = attackerEffects.filter((e) => e.type === 'strength').reduce((sum, e) => sum + e.value, 0);
  dmg += totalStrength;
  const weak = attackerEffects.find((e) => e.type === 'weak');
  if (weak) dmg = Math.floor(dmg * 0.75);
  const rage = attackerEffects.find((e) => e.type === 'rage');
  if (rage) dmg = Math.floor(dmg * (1 + rage.value * 0.1));
  const vulnerable = defenderEffects.find((e) => e.type === 'vulnerable');
  if (vulnerable) dmg = Math.floor(dmg * (1 + 0.25 * vulnerable.value));
  return Math.max(0, dmg);
}

export interface ApplyCardEffectResult {
  combat: CombatState;
  logs: CombatLogEntry[];
}

export function applyCardEffect(effect: CardEffect, combat: CombatState, targetIdx: number): ApplyCardEffectResult {
  const c: CombatState = {
    ...combat,
    log: [...combat.log],
    player: { ...combat.player, statusEffects: [...combat.player.statusEffects] },
    enemies: combat.enemies.map((e) => ({ ...e, statusEffects: [...e.statusEffects] })),
  };
  const logs: CombatLogEntry[] = [];
  const t = c.enemies[targetIdx];
  const turn = c.currentTurn;

  switch (effect.type) {
    case 'damage':
      if (t) {
        const damage = calculateDamage(effect.value, c.player.statusEffects, t.statusEffects);
        const d = Math.max(0, damage - t.block);
        t.block = Math.max(0, t.block - damage);
        t.currentHealth -= d;
        if (d > 0) {
          logs.push(createLogEntry(turn, 'player', `对 ${t.name} 造成 ${d} 点伤害`));
        }
      }
      break;
    case 'block':
      c.player.block += effect.value;
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点格挡`));
      break;
    case 'heal':
      c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + effect.value);
      logs.push(createLogEntry(turn, 'player', `回复 ${effect.value} 点生命`));
      break;
    case 'draw':
      for (let i = 0; i < effect.value; i++) {
        if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
      }
      logs.push(createLogEntry(turn, 'player', `抽取 ${effect.value} 张牌`));
      break;
    case 'gain_energy':
      c.player.energy += effect.value;
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点精力`));
      break;
    case 'gain_max_energy':
      c.player.maxEnergy += effect.value;
      logs.push(createLogEntry(turn, 'player', `增加 ${effect.value} 点最大精力`));
      break;
    case 'vulnerable':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'vulnerable');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'vulnerable', value: effect.value, duration: effect.duration || 2 });
        logs.push(createLogEntry(turn, 'player', `使 ${t.name} 获得 ${effect.value} 层脆弱`));
      }
      break;
    case 'weak':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'weak');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'weak', value: effect.value, duration: effect.duration || 2 });
        logs.push(createLogEntry(turn, 'player', `使 ${t.name} 获得 ${effect.value} 层虚弱`));
      }
      break;
    case 'poison':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'poison');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'poison', value: effect.value, duration: effect.duration || 3 });
        logs.push(createLogEntry(turn, 'player', `使 ${t.name} 获得 ${effect.value} 层中毒`));
      }
      break;
    case 'cure':
      c.player.statusEffects = c.player.statusEffects.filter((s) => s.type !== 'weak' && s.type !== 'vulnerable' && s.type !== 'poison');
      logs.push(createLogEntry(turn, 'player', `净化了所有负面状态`));
      break;
    case 'shield': {
      const existing = c.player.statusEffects.find((s) => s.type === 'shields');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'shields', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点护盾`));
      break;
    }
    case 'thorns': {
      const existing = c.player.statusEffects.find((s) => s.type === 'thorns');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'thorns', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点荆棘`));
      break;
    }
    case 'rage': {
      const existing = c.player.statusEffects.find((s) => s.type === 'rage');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'rage', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 层狂暴`));
      break;
    }
    case 'strength': {
      const existing = c.player.statusEffects.find((s) => s.type === 'strength');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'strength', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点力量`));
      break;
    }
    case 'dexterity': {
      const existing = c.player.statusEffects.find((s) => s.type === 'dexterity');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'dexterity', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点敏捷`));
      break;
    }
    case 'regen': {
      const existing = c.player.statusEffects.find((s) => s.type === 'regen');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'regen', value: effect.value, duration: effect.duration || Infinity });
      logs.push(createLogEntry(turn, 'player', `获得 ${effect.value} 点回复`));
      break;
    }
    case 'choice':
      logs.push(createLogEntry(turn, 'player', `触发抉择效果`));
      break;
  }
  c.log = [...c.log, ...logs];
  return { combat: c, logs };
}

export function executeEnemyTurn(combat: CombatState): CombatState {
  const c: CombatState = {
    ...combat,
    log: [...combat.log],
    player: {
      ...combat.player,
      hand: [...combat.player.hand],
      statusEffects: combat.player.statusEffects.map((e) => ({ ...e })),
      drawPile: [...combat.player.drawPile],
      discardPile: [...combat.player.discardPile],
    },
    enemies: combat.enemies.map((e) => ({ ...e, statusEffects: e.statusEffects.map((se) => ({ ...se })) })),
  };

  const turn = c.currentTurn;

  for (const e of c.enemies) {
    if (e.currentHealth <= 0) continue;
    e.block = 0;
    const intent = e.intents[e.currentIntentIndex % e.intents.length];

    if (intent.type === 'attack') {
      const hits = intent.hits || 1;
      let totalDmg = 0;
      for (let i = 0; i < hits; i++) {
        const dmg = calculateDamage(intent.damage, e.statusEffects, c.player.statusEffects);
        let remainingDmg = dmg;
        const shields = c.player.statusEffects.find((x) => x.type === 'shields');
        if (shields && shields.value > 0) {
          const absorb = Math.min(shields.value, remainingDmg);
          shields.value -= absorb;
          remainingDmg -= absorb;
        }
        const d = Math.max(0, remainingDmg - c.player.block);
        c.player.block = Math.max(0, c.player.block - remainingDmg);
        c.player.currentHealth -= d;
        totalDmg += d;
        const th = c.player.statusEffects.find((x) => x.type === 'thorns');
        if (th && e.currentHealth > 0) e.currentHealth -= th.value;
      }
      if (totalDmg > 0) {
        c.log.push(createLogEntry(turn, e.name, `攻击造成 ${totalDmg} 点伤害${hits > 1 ? ` (${hits}连击)` : ''}`));
      }
    } else if (intent.type === 'defend') {
      e.block += intent.block;
      c.log.push(createLogEntry(turn, e.name, `防御获得 ${intent.block} 点格挡`));
    } else if (intent.type === 'buff') {
      const existing = e.statusEffects.find((x) => x.type === intent.effect);
      if (existing) existing.value += intent.value;
      else e.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: Infinity });
      c.log.push(createLogEntry(turn, e.name, `强化自身 +${intent.value} ${intent.effect}`));
    } else if (intent.type === 'debuff') {
      c.player.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: 2 });
      c.log.push(createLogEntry(turn, e.name, `对你施加 ${intent.value} 层 ${intent.effect}`));
    } else if (intent.type === 'special') {
      c.log.push(createLogEntry(turn, e.name, `使用特殊技能: ${intent.name || '未知'}`));
    }
    e.currentIntentIndex = (e.currentIntentIndex + 1) % e.intents.length;
  }

  for (const eff of c.player.statusEffects) {
    if (eff.type === 'poison') {
      c.player.currentHealth -= eff.value;
      c.log.push(createLogEntry(turn, 'system', `中毒效果造成 ${eff.value} 点伤害`));
    } else if (eff.type === 'regen') {
      c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + eff.value);
      c.log.push(createLogEntry(turn, 'system', `回复效果恢复 ${eff.value} 点生命`));
    }
    eff.duration--;
  }
  c.player.statusEffects = c.player.statusEffects.filter((x) => x.duration > 0);

  return c;
}

export function startNewTurn(combat: CombatState, drawCount: number = 4): CombatState {
  const c: CombatState = {
    ...combat,
    log: [...combat.log],
    player: {
      ...combat.player,
      hand: [...combat.player.hand],
      drawPile: [...combat.player.drawPile],
      discardPile: [...combat.player.discardPile],
    },
  };
  c.currentTurn++;
  c.log.push(createLogEntry(c.currentTurn, 'system', `--- 第 ${c.currentTurn} 回合开始 ---`));
  c.player.energy = c.player.maxEnergy;
  c.player.drawPile = shuffle([...c.player.drawPile, ...c.player.discardPile]);
  c.player.discardPile = [];
  for (let i = 0; i < drawCount; i++) {
    if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
  }
  c.log.push(createLogEntry(c.currentTurn, 'system', `抽了 ${Math.min(drawCount, c.player.hand.length)} 张牌`));
  c.phase = 'player_turn';
  return c;
}

export function getIntentIcon(intent: EnemyIntent): string {
  switch (intent.type) {
    case 'attack': return '⚔️';
    case 'defend': return '🛡️';
    case 'buff': return '⬆️';
    case 'debuff': return '⬇️';
    case 'special': return '✨';
    default: return '❓';
  }
}

export function getIntentColor(intent: EnemyIntent): string {
  switch (intent.type) {
    case 'attack': return 'text-red-600';
    case 'defend': return 'text-blue-600';
    case 'buff': return 'text-green-600';
    case 'debuff': return 'text-purple-600';
    default: return 'text-ink';
  }
}

export function getIntentDescription(intent: EnemyIntent, enemy: EnemyState): string {
  const weakValue = enemy.statusEffects.find((x) => x.type === 'weak')?.value || 0;
  const totalStrengthValue = enemy.statusEffects.filter((x) => x.type === 'strength').reduce((sum, x) => sum + x.value, 0);
  switch (intent.type) {
    case 'attack': {
      let actualDmg = calculateDamage(intent.damage, enemy.statusEffects, []);
      if (totalStrengthValue > 0) actualDmg += totalStrengthValue;
      if (weakValue > 0) actualDmg = Math.floor(actualDmg * 0.75);
      return `攻击 ${actualDmg} 伤害${intent.hits ? ` ×${intent.hits}` : ''}`;
    }
    case 'defend': return `格挡 ${intent.block}`;
    case 'buff': return `强化 +${intent.value}力量`;
    case 'debuff': return `削弱`;
    case 'special': return intent.name || '特殊';
    default: return intent.type;
  }
}

export interface TribulationStage {
  stage: number;
  totalStages: number;
  stageName: string;
  damageMultiplier: number;
  specialEffect?: string;
}

export interface TribulationState {
  isActive: boolean;
  currentStage: number;
  totalStages: number;
  stages: TribulationStage[];
  playerDamageTaken: number;
  tribulationType: 'golden_core' | 'nascent' | 'ascension' | null;
}

export function createTribulationState(type: 'golden_core' | 'nascent' | 'ascension'): TribulationState {
  const stageConfigs: Record<string, { count: number; names: string[]; baseMultiplier: number }> = {
    golden_core: {
      count: 3,
      names: ['初劫', '重劫', '心魔劫'],
      baseMultiplier: 1.0,
    },
    nascent: {
      count: 5,
      names: ['风劫', '火劫', '雷劫', '心魔劫', '天罡劫'],
      baseMultiplier: 1.2,
    },
    ascension: {
      count: 9,
      names: ['一重雷劫', '二重雷劫', '三重雷劫', '四重雷劫', '五重雷劫', '六重雷劫', '七重雷劫', '八重雷劫', '九重天劫'],
      baseMultiplier: 1.5,
    },
  };

  const config = stageConfigs[type];
  const stages: TribulationStage[] = [];

  for (let i = 0; i < config.count; i++) {
    stages.push({
      stage: i + 1,
      totalStages: config.count,
      stageName: config.names[i] || `第${i + 1}劫`,
      damageMultiplier: config.baseMultiplier + (i * 0.15),
      specialEffect: i === config.count - 1 ? '最终劫：伤害翻倍' : undefined,
    });
  }

  return {
    isActive: true,
    currentStage: 1,
    totalStages: config.count,
    stages,
    playerDamageTaken: 0,
    tribulationType: type,
  };
}

export function executeTribulationStage(combat: CombatState, tribulation: TribulationStage): CombatState {
  const c: CombatState = {
    ...combat,
    player: {
      ...combat.player,
      statusEffects: combat.player.statusEffects.map((e) => ({ ...e })),
    },
    enemies: combat.enemies.map((e) => ({ ...e, statusEffects: e.statusEffects.map((se) => ({ ...se })) })),
  };

  const isFinalStage = tribulation.stage === tribulation.totalStages;
  const damageMult = isFinalStage ? tribulation.damageMultiplier * 2 : tribulation.damageMultiplier;

  for (const e of c.enemies) {
    if (e.currentHealth <= 0) continue;
    e.block = Math.floor(e.block * 0.5);

    for (const intent of e.intents) {
      if (intent.type === 'attack') {
        const baseDamage = Math.floor(intent.damage * damageMult);
        const hits = intent.hits || 1;
        for (let i = 0; i < hits; i++) {
          const dmg = calculateDamage(baseDamage, e.statusEffects, c.player.statusEffects);
          const d = Math.max(0, dmg - c.player.block);
          c.player.block = Math.max(0, c.player.block - dmg);
          c.player.currentHealth -= d;
        }
      } else if (intent.type === 'special') {
        if (intent.name === '天雷九重') {
          for (let i = 0; i < 3; i++) {
            const dmg = Math.floor(12 * damageMult);
            c.player.currentHealth -= dmg;
          }
        } else if (intent.name === '天劫降临') {
          const dmg = Math.floor(40 * damageMult);
          c.player.currentHealth -= dmg;
        } else if (intent.name === '九九雷劫') {
          for (let i = 0; i < 5; i++) {
            const dmg = Math.floor(20 * damageMult);
            c.player.currentHealth -= dmg;
          }
        } else if (intent.name === '尘缘尽了') {
          c.player.maxHealth = Math.floor(c.player.maxHealth * 0.9);
          c.player.currentHealth = Math.min(c.player.currentHealth, c.player.maxHealth);
        }
      } else if (intent.type === 'debuff') {
        c.player.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: 3 });
      } else if (intent.type === 'buff') {
        const existing = e.statusEffects.find((x) => x.type === intent.effect);
        if (existing) existing.value += intent.value;
        else e.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: Infinity });
      }
    }
  }

  return c;
}

export function getTribulationReward(tribulation: TribulationState): { gold: number; lifespanBonus: number } {
  const baseRewards: Record<string, { gold: number; lifespanBonus: number }> = {
    golden_core: { gold: 300, lifespanBonus: 30 },
    nascent: { gold: 600, lifespanBonus: 60 },
    ascension: { gold: 1500, lifespanBonus: 150 },
  };

  const base = baseRewards[tribulation.tribulationType || 'golden_core'];
  const stageBonus = tribulation.currentStage * 0.1;

  return {
    gold: Math.floor(base.gold * (1 + stageBonus)),
    lifespanBonus: Math.floor(base.lifespanBonus * (1 + stageBonus)),
  };
}
