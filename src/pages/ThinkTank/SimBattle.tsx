import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COMMON_ATTACK_CARDS,
  COMMON_SKILL_CARDS,
  RARE_CARDS,
  LEGENDARY_CARDS,
  CURSE_CARDS,
  CHILDHOOD_CARDS,
  ADOLESCENT_CARDS,
  YOUTH_CARDS,
  PRIME_CARDS,
  MIDDLE_AGE_CARDS,
  ELDERLY_CARDS,
  CULTIVATION_CARDS,
  CULTIVATION_CARDS_HIGH,
  ENERGY_TIER_CARDS,
  PHYSIQUE_TIER_CARDS,
  HEALTH_TIER_CARDS,
  IQ_TIER_CARDS,
  EQ_TIER_CARDS,
  WEALTH_TIER_CARDS,
  NETWORK_TIER_CARDS,
  FAME_TIER_CARDS,
  CARD_TYPE_NAMES,
  RARITY_NAMES,
  COMMON_ENEMIES,
  ELITE_ENEMIES,
  BOSS_ENEMIES,
} from '../../data/simulationData';
import type { LifeCard, Enemy, ChoiceOption } from '../../types/simulation';
import {
  CombatState,
  generateId,
  shuffle,
  applyCardEffect,
  executeEnemyTurn,
  startNewTurn,
  getIntentIcon,
  getIntentColor,
  getIntentDescription,
} from '../../combat/combatEngine';

// 待处理抉择状态
interface PendingChoice {
  cardId: string;
  cardName: string;
  cardIcon: string;
  options: ChoiceOption[];
}

type Difficulty = 'easy' | 'normal' | 'hard' | 'elite' | 'boss';

const DIFFICULTY_CONFIG: Record<Difficulty, {
  name: string;
  icon: string;
  description: string;
  playerHealth: number;
  enemyPool: Enemy[];
  enemyCount: [number, number];
  multiplier: number;
}> = {
  easy: {
    name: '简单',
    icon: '🌱',
    description: '适合测试卡组强度',
    playerHealth: 60,
    enemyPool: COMMON_ENEMIES,
    enemyCount: [1, 1],
    multiplier: 0.7,
  },
  normal: {
    name: '普通',
    icon: '⚔️',
    description: '标准战斗体验',
    playerHealth: 50,
    enemyPool: COMMON_ENEMIES,
    enemyCount: [1, 2],
    multiplier: 1.0,
  },
  hard: {
    name: '困难',
    icon: '🔥',
    description: '需要合理搭配卡牌',
    playerHealth: 45,
    enemyPool: [...COMMON_ENEMIES, ...ELITE_ENEMIES],
    enemyCount: [1, 3],
    multiplier: 1.3,
  },
  elite: {
    name: '精英',
    icon: '💀',
    description: '精英敌人，极具挑战',
    playerHealth: 40,
    enemyPool: ELITE_ENEMIES,
    enemyCount: [1, 2],
    multiplier: 1.5,
  },
  boss: {
    name: 'BOSS',
    icon: '👑',
    description: '强大的Boss级敌人',
    playerHealth: 50,
    enemyPool: BOSS_ENEMIES,
    enemyCount: [1, 1],
    multiplier: 2.0,
  },
};

const SimBattle: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'difficulty' | 'combat' | 'result'>('select');
  const [selectedCards, setSelectedCards] = useState<LifeCard[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);

  // 返回智库
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate('/thinktank');
    }
  }, [onBack, navigate]);

  const allCards = useMemo(() => {
    const cardMap = new Map<string, LifeCard>();
    const allCardArrays = [
      COMMON_ATTACK_CARDS, COMMON_SKILL_CARDS, RARE_CARDS, LEGENDARY_CARDS,
      CURSE_CARDS, CHILDHOOD_CARDS, ADOLESCENT_CARDS, YOUTH_CARDS,
      PRIME_CARDS, MIDDLE_AGE_CARDS, ELDERLY_CARDS,
      ENERGY_TIER_CARDS, PHYSIQUE_TIER_CARDS, HEALTH_TIER_CARDS,
      IQ_TIER_CARDS, EQ_TIER_CARDS, WEALTH_TIER_CARDS,
      NETWORK_TIER_CARDS, FAME_TIER_CARDS,
      CULTIVATION_CARDS, CULTIVATION_CARDS_HIGH,
    ];
    allCardArrays.forEach((arr) => {
      arr.forEach((card) => {
        if (!cardMap.has(card.id)) {
          cardMap.set(card.id, card);
        }
      });
    });
    return Array.from(cardMap.values());
  }, []);

  const addCard = useCallback((card: LifeCard) => {
    if (selectedCards.length >= 8) return;
    setSelectedCards((prev) => [...prev, { ...card, id: generateId() }]);
  }, [selectedCards.length]);

  const removeCard = useCallback((index: number) => {
    setSelectedCards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const randomDifficulty = useCallback(() => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard', 'elite', 'boss'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }, []);

  const startCombat = useCallback(() => {
    if (selectedCards.length === 0) return;
    const diff = difficulty || randomDifficulty();
    setDifficulty(diff);
    const config = DIFFICULTY_CONFIG[diff];

    const numEnemies = config.enemyCount[0] + Math.floor(Math.random() * (config.enemyCount[1] - config.enemyCount[0] + 1));
    const enemies: CombatState['enemies'] = [];
    for (let i = 0; i < numEnemies; i++) {
      const template = config.enemyPool[Math.floor(Math.random() * config.enemyPool.length)];
      const health = Math.floor(template.maxHealth * config.multiplier);
      enemies.push({
        ...template,
        id: generateId(),
        maxHealth: health,
        currentHealth: health,
        block: 0,
        statusEffects: [],
        currentIntentIndex: 0,
        intents: template.intents.map((intent) => ({
          ...intent,
          damage: intent.type === 'attack' ? Math.floor((intent.damage || 0) * config.multiplier) : (intent as any).damage,
          block: intent.type === 'defend' ? Math.floor((intent.block || 0) * config.multiplier) : (intent as any).block,
        })),
      });
    }

    const drawPile = shuffle(selectedCards.map((c) => ({ ...c, id: generateId() })));
    const hand = drawPile.splice(0, Math.min(4, drawPile.length));

    const newCombat: CombatState = {
      isInCombat: true,
      phase: 'player_turn',
      currentTurn: 1,
      player: {
        currentHealth: config.playerHealth,
        maxHealth: config.playerHealth,
        block: 0,
        energy: 3,
        maxEnergy: 3,
        hand,
        drawPile,
        discardPile: [],
        exhaustPile: [],
        statusEffects: [],
      },
      enemies: enemies as any,
      currentEnemyIndex: 0,
      rewards: { mode: 'battle', cards: [], wonderOptions: [] },
      availableBonuses: [],
      log: [],
      burnLifeUsed: false,
      selectedForDiscard: [],
      requiredDiscardCount: 0,
    };

    setCombat(newCombat);
    setStep('combat');
  }, [selectedCards, difficulty, randomDifficulty]);

  const playCard = useCallback((cardId: string) => {
    if (!combat || combat.phase !== 'player_turn') return;
    const idx = combat.player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const card = combat.player.hand[idx];
    if (card.cost > combat.player.energy) return;

    let c = { ...combat };
    c.player.hand.splice(idx, 1);
    c.player.energy -= card.cost;

    // 检查是否有抉择效果
    const choiceEff = card.effects.find((e) => e.type === 'choice');
    const otherEffects = card.effects.filter((e) => e.type !== 'choice');

    if (choiceEff) {
      const choices = choiceEff.choices || [];
      if (choices.length > 0) {
        setPendingChoice({
          cardId: card.id,
          cardName: card.name,
          cardIcon: card.icon,
          options: choices,
        });
        c.player.discardPile.push(card);
        setCombat(c);
        return;
      }
    }

    const targetIdx = selectedTarget;
    for (const eff of otherEffects) {
      c = applyCardEffect(eff, c, targetIdx);
    }
    c.player.discardPile.push(card);

    if (c.enemies.every((e) => e.currentHealth <= 0)) {
      c.phase = 'victory';
      c.log = [...c.log, { turn: c.currentTurn, actor: 'system', action: '🎉 胜利！', timestamp: Date.now() }];
      setPendingChoice(null);
    }

    setCombat(c);
  }, [combat, selectedTarget]);

  // 处理抉择结果
  const resolveChoice = useCallback((choiceId: string) => {
    if (!combat || !pendingChoice) return;
    let c = { ...combat, player: { ...combat.player, statusEffects: [...combat.player.statusEffects] } };
    const selectedOption = pendingChoice.options.find((o) => o.id === choiceId);
    if (selectedOption) {
      for (const eff of selectedOption.effects) {
        c = applyCardEffect(eff, c, c.currentEnemyIndex);
      }
      c.log = [...c.log, { turn: c.currentTurn, actor: 'player', action: `选择：${selectedOption.label}`, timestamp: Date.now() }];
    }
    setPendingChoice(null);
    setCombat(c);
  }, [combat, pendingChoice]);

  const endTurn = useCallback(() => {
    if (!combat || combat.phase !== 'player_turn') return;
    let c = { ...combat };

    c.player.discardPile.push(...c.player.hand);
    c.player.hand = [];

    c = executeEnemyTurn(c);

    if (c.player.currentHealth <= 0) {
      c.phase = 'defeat';
      c.log = [...c.log, { turn: c.currentTurn, actor: 'system', action: '💀 失败...', timestamp: Date.now() }];
      setPendingChoice(null);
      setCombat(c);
      setStep('result');
      return;
    }

    if (c.enemies.every((e) => e.currentHealth <= 0)) {
      c.phase = 'victory';
      c.log = [...c.log, { turn: c.currentTurn, actor: 'system', action: '🎉 胜利！', timestamp: Date.now() }];
      setPendingChoice(null);
      setCombat(c);
      setStep('result');
      return;
    }

    c = startNewTurn(c, 4);
    setCombat(c);
  }, [combat]);

  const restart = useCallback(() => {
    setStep('select');
    setSelectedCards([]);
    setDifficulty(null);
    setCombat(null);
  }, []);

  // 渲染：选牌界面
  if (step === 'select') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border-subtle bg-white">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={handleBack} className="text-ink-muted hover:text-ink">
              ← 返回智库
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <div>
              <h1 className="text-2xl font-bold text-ink">模拟战斗</h1>
              <p className="text-sm text-ink-muted">选择8张卡牌组成你的卡组，然后进入战斗</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-80 border-r border-border-subtle bg-gray-50 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">
              我的卡组 ({selectedCards.length}/8)
            </h3>
            <div className="space-y-2 mb-4">
              {selectedCards.length === 0 ? (
                <div className="text-center py-8 text-ink-faint text-sm">
                  点击右侧卡牌添加到卡组
                </div>
              ) : (
                selectedCards.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border-subtle group"
                  >
                    <span className="text-lg">{card.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ink truncate">{card.name}</div>
                      <div className="text-[10px] text-ink-faint">{card.cost}⚡ · {CARD_TYPE_NAMES[card.type]}</div>
                    </div>
                    <button
                      onClick={() => removeCard(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            {selectedCards.length > 0 && (
              <button
                onClick={() => setStep('difficulty')}
                className="w-full py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-all"
              >
                选择难度 →
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">选择卡牌</h3>
              <span className="text-xs text-ink-muted">点击添加 · 最多8张 · 可重复</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => addCard(card)}
                  disabled={selectedCards.length >= 8}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedCards.length >= 8 ? 'bg-gray-50' : 'bg-white hover:border-brand'
                  }`}
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-brand">{card.cost}⚡</span>
                    <span className="text-[10px] text-ink-faint">{RARITY_NAMES[card.rarity]}</span>
                  </div>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-xs font-medium text-ink truncate">{card.name}</div>
                  <div className="text-[10px] text-ink-faint line-clamp-2 mt-0.5">{card.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 渲染：难度选择
  if (step === 'difficulty') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <h2 className="text-2xl font-bold text-ink mb-2">选择难度</h2>
        <p className="text-ink-muted text-sm mb-8">或随机一个难度开始战斗</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mb-6">
          {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { setDifficulty(key); setStep('combat'); startCombat(); }}
              className="p-5 bg-white border border-border-subtle rounded-xl hover:border-brand hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{config.icon}</span>
                <div>
                  <h3 className="font-semibold text-ink">{config.name}</h3>
                  <p className="text-xs text-ink-muted">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-faint">
                <span>❤️ {config.playerHealth}HP</span>
                <span>×{config.multiplier}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => { setDifficulty(randomDifficulty()); setStep('combat'); startCombat(); }}
          className="px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-hover transition-all flex items-center gap-2"
        >
          <span>🎲</span>
          <span>随机难度</span>
        </button>

        <button
          onClick={() => setStep('select')}
          className="mt-4 text-sm text-ink-muted hover:text-ink"
        >
          ← 返回选牌
        </button>
      </div>
    );
  }

  // 渲染：战斗界面（排除有抉择弹窗的情况）
  if (step === 'combat' && combat && !pendingChoice) {
    const aliveEnemies = combat.enemies.filter((e) => e.currentHealth > 0);

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border-subtle bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={restart} className="text-ink-muted hover:text-ink text-sm">
              ← 退出
            </button>
            <span className="text-sm font-medium text-ink">
              第 {combat.currentTurn} 回合
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              combat.phase === 'player_turn' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {combat.phase === 'player_turn' ? '你的回合' : '敌人回合'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-muted">
              难度: {difficulty ? DIFFICULTY_CONFIG[difficulty].name : '随机'}
            </span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                敌人 ({aliveEnemies.length}/{combat.enemies.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {combat.enemies.map((enemy, idx) => {
                  const isTarget = idx === selectedTarget && enemy.currentHealth > 0;
                  const isAlive = enemy.currentHealth > 0;
                  const hpPercent = (enemy.currentHealth / enemy.maxHealth) * 100;
                  const intent = enemy.intents[enemy.currentIntentIndex % enemy.intents.length];

                  return (
                    <div
                      key={enemy.id}
                      onClick={() => isAlive && setSelectedTarget(idx)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isTarget ? 'border-brand bg-brand/5' : 'border-border-subtle bg-white'
                      } ${!isAlive ? 'opacity-40' : 'hover:border-brand/50'}`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">{enemy.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-ink">
                            {enemy.name}
                            {enemy.isBoss && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-600">BOSS</span>}
                          </h4>
                          <p className="text-[10px] text-ink-muted">{enemy.description}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-red-500">❤️ {enemy.currentHealth}/{enemy.maxHealth}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${hpPercent}%`,
                              background: hpPercent > 50 ? '#dc2626' : hpPercent > 25 ? '#ea580c' : '#991b1b',
                            }}
                          />
                        </div>
                      </div>
                      {enemy.block > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 mb-1">
                          <span>🛡️</span>
                          <span>{enemy.block}</span>
                        </div>
                      )}
                      {isAlive && (
                        <div className={`text-xs ${getIntentColor(intent)}`}>
                          {getIntentIcon(intent)} {getIntentDescription(intent, enemy)}
                        </div>
                      )}
                      {enemy.statusEffects.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {enemy.statusEffects.map((eff, i) => (
                            <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                              {eff.type}:{eff.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-6 p-4 bg-white rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted">你的状态</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600">🛡️ {combat.player.block}</span>
                  <span className="text-yellow-600">⚡ {combat.player.energy}/{combat.player.maxEnergy}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">❤️</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-green-600">{combat.player.currentHealth}/{combat.player.maxHealth}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(combat.player.currentHealth / combat.player.maxHealth) * 100}%`,
                        background: 'linear-gradient(to right, #16a34a, #4ade80)',
                      }}
                    />
                  </div>
                </div>
              </div>
              {combat.player.statusEffects.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {combat.player.statusEffects.map((eff, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                      {eff.type}:{eff.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                手牌 ({combat.player.hand.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {combat.player.hand.map((card) => {
                  const canPlay = card.cost <= combat.player.energy;
                  return (
                    <button
                      key={card.id}
                      onClick={() => canPlay && playCard(card.id)}
                      disabled={!canPlay}
                      className={`w-28 p-3 rounded-xl border text-left transition-all ${
                        canPlay
                          ? 'bg-white border-border-subtle hover:border-brand hover:shadow-md hover:scale-[1.02]'
                          : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-brand">{card.cost}⚡</span>
                        <span className="text-[9px] text-ink-faint">{CARD_TYPE_NAMES[card.type]}</span>
                      </div>
                      <div className="text-xl mb-1">{card.icon}</div>
                      <div className="text-[10px] font-medium text-ink truncate">{card.name}</div>
                      <div className="text-[9px] text-ink-faint line-clamp-2 mt-0.5">{card.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-64 border-l border-border-subtle bg-gray-50 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">战斗日志</h3>
            <div className="space-y-1">
              {combat.log.slice(-10).map((msg, i) => (
                <div key={i} className="text-[10px] text-ink-muted">{msg.action}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-subtle bg-white flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span>抽牌堆: {combat.player.drawPile.length}</span>
            <span>弃牌堆: {combat.player.discardPile.length}</span>
          </div>
          {combat.phase === 'player_turn' && (
            <button
              onClick={endTurn}
              className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-all"
            >
              结束回合 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // 渲染：抉择弹窗
  if (step === 'combat' && combat && pendingChoice) {
    return (
      <div className="flex flex-col h-full">
        {/* 战斗背景 */}
        <div className="flex-1 overflow-y-auto p-6 opacity-50 pointer-events-none">
          <div className="mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
              敌人 ({combat.enemies.filter((e) => e.currentHealth > 0).length}/{combat.enemies.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combat.enemies.map((enemy) => (
                <div key={enemy.id} className="p-4 rounded-xl border-2 border-border-subtle bg-white">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-3xl">{enemy.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm text-ink">{enemy.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 抉择弹窗 */}
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border-subtle">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{pendingChoice.cardIcon}</span>
              <div>
                <h3 className="text-xl font-bold text-ink">{pendingChoice.cardName}</h3>
                <p className="text-sm text-ink-muted">做出你的选择</p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingChoice.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => resolveChoice(option.id)}
                  className="w-full p-4 bg-gray-50 border border-border-subtle rounded-xl hover:border-brand hover:bg-brand/5 transition-all text-left flex items-center gap-3"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-semibold text-ink">{option.label}</div>
                    <div className="text-xs text-ink-muted">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 渲染：结果界面
  if (step === 'result' && combat) {
    const isVictory = combat.phase === 'victory';
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-6xl mb-4">{isVictory ? '🎉' : '💀'}</div>
        <h2 className="text-2xl font-bold text-ink mb-2">
          {isVictory ? '胜利！' : '失败...'}
        </h2>
        <p className="text-ink-muted text-sm mb-2">
          {isVictory
            ? `你击败了所有敌人！共用了 ${combat.currentTurn} 回合`
            : `你坚持了 ${combat.currentTurn} 回合`
          }
        </p>
        <p className="text-xs text-ink-faint mb-6">
          难度: {difficulty ? DIFFICULTY_CONFIG[difficulty].name : '随机'}
        </p>

        <div className="flex items-center gap-4 mb-6 text-sm">
          <div className="px-4 py-2 rounded-lg bg-white border border-border-subtle">
            <span className="text-ink-muted">剩余生命: </span>
            <span className={`font-bold ${isVictory ? 'text-green-600' : 'text-red-600'}`}>
              {combat.player.currentHealth}/{combat.player.maxHealth}
            </span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white border border-border-subtle">
            <span className="text-ink-muted">击败敌人: </span>
            <span className="font-bold text-ink">
              {combat.enemies.filter((e) => e.currentHealth <= 0).length}/{combat.enemies.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={restart}
            className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-all"
          >
            再来一局
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-2.5 bg-white border border-border-subtle rounded-lg text-ink-muted hover:border-brand hover:text-brand transition-all"
          >
            返回智库
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SimBattle;
