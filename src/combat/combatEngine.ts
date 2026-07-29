import type { CardEffect, StatusEffect, EnemyIntent, CombatState } from '../types/simulation';

export type { CombatState } from '../types/simulation';
export type PlayerState = CombatState['player'];
export type EnemyState = CombatState['enemies'][number];

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

export function applyCardEffect(effect: CardEffect, combat: CombatState, targetIdx: number): CombatState {
  const c: CombatState = {
    ...combat,
    player: { ...combat.player, statusEffects: [...combat.player.statusEffects] },
    enemies: combat.enemies.map((e) => ({ ...e, statusEffects: [...e.statusEffects] })),
  };
  const t = c.enemies[targetIdx];

  switch (effect.type) {
    case 'damage':
      if (t) {
        const damage = calculateDamage(effect.value, c.player.statusEffects, t.statusEffects);
        const d = Math.max(0, damage - t.block);
        t.block = Math.max(0, t.block - damage);
        t.currentHealth -= d;
      }
      break;
    case 'block': c.player.block += effect.value; break;
    case 'heal': c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + effect.value); break;
    case 'draw':
      for (let i = 0; i < effect.value; i++) {
        if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
      }
      break;
    case 'gain_energy': c.player.energy += effect.value; break;
    case 'gain_max_energy': c.player.maxEnergy += effect.value; break;
    case 'vulnerable':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'vulnerable');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'vulnerable', value: effect.value, duration: effect.duration || 2 });
      }
      break;
    case 'weak':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'weak');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'weak', value: effect.value, duration: effect.duration || 2 });
      }
      break;
    case 'poison':
      if (t) {
        const e = t.statusEffects.find((s) => s.type === 'poison');
        if (e) e.value += effect.value;
        else t.statusEffects.push({ type: 'poison', value: effect.value, duration: effect.duration || 3 });
      }
      break;
    case 'cure':
      c.player.statusEffects = c.player.statusEffects.filter((s) => s.type !== 'weak' && s.type !== 'vulnerable' && s.type !== 'poison');
      break;
    case 'shield': {
      const existing = c.player.statusEffects.find((s) => s.type === 'shields');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'shields', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'thorns': {
      const existing = c.player.statusEffects.find((s) => s.type === 'thorns');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'thorns', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'rage': {
      const existing = c.player.statusEffects.find((s) => s.type === 'rage');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'rage', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'strength': {
      const existing = c.player.statusEffects.find((s) => s.type === 'strength');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'strength', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'dexterity': {
      const existing = c.player.statusEffects.find((s) => s.type === 'dexterity');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'dexterity', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'regen': {
      const existing = c.player.statusEffects.find((s) => s.type === 'regen');
      if (existing) existing.value += effect.value;
      else c.player.statusEffects.push({ type: 'regen', value: effect.value, duration: effect.duration || Infinity });
      break;
    }
    case 'choice':
      // choice 效果由调用方处理（显示抉择弹窗）
      break;
  }
  return c;
}

export function executeEnemyTurn(combat: CombatState): CombatState {
  const c: CombatState = {
    ...combat,
    player: {
      ...combat.player,
      hand: [...combat.player.hand],
      statusEffects: combat.player.statusEffects.map((e) => ({ ...e })),
      drawPile: [...combat.player.drawPile],
      discardPile: [...combat.player.discardPile],
    },
    enemies: combat.enemies.map((e) => ({ ...e, statusEffects: e.statusEffects.map((se) => ({ ...se })) })),
  };

  for (const e of c.enemies) {
    if (e.currentHealth <= 0) continue;
    e.block = 0;
    const intent = e.intents[e.currentIntentIndex % e.intents.length];

    if (intent.type === 'attack') {
      const hits = intent.hits || 1;
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
        const th = c.player.statusEffects.find((x) => x.type === 'thorns');
        if (th && e.currentHealth > 0) e.currentHealth -= th.value;
      }
    } else if (intent.type === 'defend') {
      e.block += intent.block;
    } else if (intent.type === 'buff') {
      const existing = e.statusEffects.find((x) => x.type === intent.effect);
      if (existing) existing.value += intent.value;
      else e.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: Infinity });
    } else if (intent.type === 'debuff') {
      c.player.statusEffects.push({ type: intent.effect as StatusEffect['type'], value: intent.value, duration: 2 });
    }
    e.currentIntentIndex = (e.currentIntentIndex + 1) % e.intents.length;
  }

  for (const eff of c.player.statusEffects) {
    if (eff.type === 'poison') c.player.currentHealth -= eff.value;
    else if (eff.type === 'regen') c.player.currentHealth = Math.min(c.player.maxHealth, c.player.currentHealth + eff.value);
    eff.duration--;
  }
  c.player.statusEffects = c.player.statusEffects.filter((x) => x.duration > 0);

  return c;
}

export function startNewTurn(combat: CombatState, drawCount: number = 4): CombatState {
  const c: CombatState = {
    ...combat,
    player: {
      ...combat.player,
      hand: [...combat.player.hand],
      drawPile: [...combat.player.drawPile],
      discardPile: [...combat.player.discardPile],
    },
  };
  c.currentTurn++;
  c.player.energy = c.player.maxEnergy;
  c.player.drawPile = shuffle([...c.player.drawPile, ...c.player.discardPile]);
  c.player.discardPile = [];
  for (let i = 0; i < drawCount; i++) {
    if (c.player.drawPile.length > 0) c.player.hand.push(c.player.drawPile.shift()!);
  }
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
