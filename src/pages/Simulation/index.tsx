import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import useSimulationStore, { getEffectDisplayValue, MAX_HAND_SIZE, BASE_DRAW_COUNT, getAttributeTierInfo } from '../../stores/simulationStore';
import useBondStore from '../../stores/bondStore';

import {
  ERAS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_COLORS,
  ATTRIBUTE_DESCRIPTIONS,
  TAG_NAMES,
  HIDDEN_TAGS,
  CARD_TYPE_NAMES,
  CULTIVATION_REALM_NAMES,
  RARITY_NAMES,
  ATTRIBUTE_TIER_CARDS,
} from '../../data/simulationData';
import { IDENTITY_MAP } from '../../data/bondData';
import { calculateDamage } from '../../combat/combatEngine';
import Tooltip from '../../components/common/Tooltip';
import { useToast } from '../../components/common';
import FloatingDamage from '../../components/ui/FloatingDamage';
import BuffDebuffBadge from '../../components/ui/BuffDebuffBadge';
import LifeSummary from './LifeSummary';
import BondPanel from '../../components/bond/BondPanel';
import type { BirthYear, PlayerAttributes, GameEvent, AttributeThresholdBonus, LifeCard, CardEffect, StatusEffect, WonderRewardOption } from '../../types/simulation';

const EFFECT_LABELS: Record<string, string> = {
  damage: '伤害',
  block: '格挡',
  heal: '回复',
  draw: '抽',
  gain_energy: '+精力',
  gain_max_energy: '+最大精力',
  gain_attribute: '+属性',
  lose_attribute: '-属性',
  vulnerable: '脆弱',
  weak: '虚弱',
  poison: '中毒',
  cure: '净化',
  shield: '护盾',
  thorns: '荆棘',
  rage: '狂暴',
  stealth: '潜行',
  strength: '力量',
  dexterity: '敏捷',
  regen: '回复/回合',
  lifedrain: '吸取',
  lifesteal: '吸血',
  choice: '抉择',
};

const RELIC_EFFECT_LABELS: Record<string, string> = {
  max_health_bonus: '最大生命',
  energy_bonus: '精力',
  card_draw_bonus: '每回合抽牌',
  discount: '商店折扣',
  double_damage: '双倍伤害几率',
  heal_on_rest: '休息回血',
  extra_card_reward: '战斗后额外卡牌',
  card_type_bonus: '特定卡牌费用减免',
  attribute_scaling: '属性成长',
  lifespan_extend: '寿命延长',
  retention_bonus: '保留卡牌',
};

const ATTRIBUTE_NAMES_RELIC: Record<string, string> = {
  energy: '精力',
  physique: '体魄',
  health: '健康',
  iq: '智商',
  eq: '情商',
  wealth: '财富',
  network: '人脉',
  fame: '名望',
};

const formatRelicEffect = (effect: import('../../types/simulation').RelicEffect): string => {
  const label = RELIC_EFFECT_LABELS[effect.type] || effect.type;
  switch (effect.type) {
    case 'discount':
      return `${label} +${(effect.value * 100).toFixed(0)}%`;
    case 'double_damage':
      return `${label} +${(effect.value * 100).toFixed(0)}%`;
    case 'card_type_bonus':
      return `${label} -${(effect.value * 100).toFixed(0)}%`;
    case 'attribute_scaling':
      return `${ATTRIBUTE_NAMES_RELIC[effect.attribute || 'iq'] || effect.attribute}${label} +${(effect.value * 100).toFixed(0)}%`;
    case 'card_draw_bonus':
      return `${label} +${effect.value}张`;
    case 'extra_card_reward':
      return `${label} +${effect.value}张`;
    case 'heal_on_rest':
      return `${label} +${effect.value}`;
    case 'energy_bonus':
    case 'max_health_bonus':
      return `${label} +${effect.value}`;
    case 'lifespan_extend':
      return `${label} +${effect.value}年`;
    case 'retention_bonus':
      return `${label} +${effect.value}张`;
    default:
      return `${label} +${effect.value}`;
  }
};

const formatEffectLabel = (type: string, display: number): string => {
  const label = EFFECT_LABELS[type] || type;
  if (type === 'draw') return `抽${display}张`;
  if (type === 'heal') return `回复${display}`;
  if (type === 'cure') return '净化';
  if (type === 'stealth') return '潜行';
  if (type === 'regen') return `回复${display}/回合`;
  if (type === 'choice') return label;
  return `${label}${display}`;
};

interface CardDetailProps {
  card: LifeCard;
  activeBonuses?: AttributeThresholdBonus[];
  statusEffects?: StatusEffect[];
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  width?: number;
}

const CardDetail: React.FC<CardDetailProps> = ({ card, activeBonuses = [], statusEffects = [], onClick, disabled, width = 130 }) => {
  const colors = getCardTypeColor(card.type);
  const glow = getCardGlow(card.type);
  const damageBoost = 1 + activeBonuses.filter((b) => b.effect === 'damage_boost').reduce((sum, b) => sum + b.value, 0);

  const effectItems = card.effects.map((e: CardEffect, i: number) => {
    const displayValue = getEffectDisplayValue(e.value, e.type, statusEffects, damageBoost);
    const isModified = displayValue !== e.value;
    const isIncreased = displayValue > e.value;
    const formatted = formatEffectLabel(e.type, displayValue);
    if (isModified) {
      return <span key={i} className={isIncreased ? 'text-success' : 'text-danger'}>{formatted}</span>;
    }
    return <span key={i}>{formatted}</span>;
  });
  const effectNodes: React.ReactNode[] = [];
  effectItems.forEach((item, i) => {
    if (i > 0) effectNodes.push(<span key={`sep-${i}`} className="text-ink-faint"> · </span>);
    effectNodes.push(item);
  });

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative rounded-xl p-3 transition-all cursor-pointer ${glow} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-md'}`}
      style={{
        width: `${width}px`,
        background: 'var(--color-bg-elevated)',
        border: `2px solid ${colors.border}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-brand bg-brand-light">{card.cost}</span>
        <span className={`text-[9px] uppercase tracking-wide ${colors.label}`}>{CARD_TYPE_NAMES[card.type] || card.type}</span>
      </div>
      <div className="text-2xl mb-1.5 text-center">{card.icon}</div>
      <div className="text-xs font-medium mb-0.5 text-center text-ink">{card.name}</div>
      <p className="text-[10px] text-center leading-relaxed mb-2 text-ink-muted">{card.description}</p>
      <div className="text-center">
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${colors.label}`} style={{ background: colors.bg }}>
          {effectNodes}
        </span>
      </div>
    </button>
  );
};

const getCardTypeColor = (type: string) => {
  switch (type) {
    case 'attack': return { border: 'rgba(209,36,47,0.15)', label: 'text-danger', bg: 'rgba(209,36,47,0.08)' };
    case 'skill': return { border: 'rgba(45,123,185,0.15)', label: 'text-info', bg: 'rgba(45,123,185,0.08)' };
    case 'power': return { border: 'rgba(168,85,247,0.15)', label: 'text-[#a855f7]', bg: 'rgba(168,85,247,0.08)' };
    default: return { border: 'rgba(201,169,110,0.2)', label: 'text-gold', bg: 'rgba(201,169,110,0.08)' };
  }
};

const getCardGlow = (type: string) => {
  switch (type) {
    case 'attack': return 'hover:border-danger/30';
    case 'skill': return 'hover:border-info/30';
    case 'power': return 'hover:border-[#a855f7]/30';
    default: return 'hover:border-gold/30';
  }
};

const AttributeBar: React.FC<{ attr: keyof PlayerAttributes; value: number; showLabel?: boolean }> = ({ attr, value, showLabel = true }) => {
  const TIERS = [30, 50, 70, 90, 100];
  const tierInfo = getAttributeTierInfo(attr, value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-5 text-center">{ATTRIBUTE_ICONS[attr] || '•'}</span>
      {showLabel && <span className="text-xs text-ink-muted w-8">{ATTRIBUTE_NAMES[attr] || attr}</span>}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px] relative">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, backgroundColor: ATTRIBUTE_COLORS[attr] || '#6B7280' }} />
        {TIERS.map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full w-0.5"
            style={{
              left: `${t}%`,
              backgroundColor: value >= t ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-ink w-7 text-right">{Math.round(value)}</span>
      {tierInfo.currentTier > 0 && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium" title={tierInfo.currentTierName || ''}>
          {tierInfo.currentTier}阶
        </span>
      )}
    </div>
  );
};

const OPTION_ICONS: Record<string, string> = {
  combat: '⚔️', elite: '👹', event: '❓', wonder: '🌟', rest: '🛏️', shop: '🏪', boss: '💀',
};
const OPTION_NAMES: Record<string, string> = {
  combat: '战斗', elite: '精英战斗', event: '事件', wonder: '奇遇', rest: '休息', shop: '商店', boss: 'Boss',
};
const OPTION_DESCS: Record<string, string> = {
  combat: '与敌人战斗', elite: '强敌出现', event: '随机际遇', wonder: '纯奖励事件', rest: '恢复生命值', shop: '购买卡牌/遗物', boss: '时代终结者',
};

// ==========================================
// 模式 + 出生年选择
// ==========================================
const ModeSelectPhase: React.FC = () => {
  const [step, setStep] = useState<'mode' | 'year'>('mode');
  const [selectedYear, setSelectedYear] = useState<BirthYear | null>(null);
  const selectMode = useSimulationStore((s) => s.selectMode);
  const startGame = useSimulationStore((s) => s.startGame);
  const mode = useSimulationStore((s) => s.mode);
  const aiEnabled = useSimulationStore((s) => s.aiEnabled);
  const toggleAI = useSimulationStore((s) => s.toggleAI);
  const selectedEra = ERAS.find((e) => e.year === selectedYear);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleAiToggle = () => {
    toggleAI();
    if (!aiEnabled) {
      addToast({ type: 'success', message: '🤖 AI大模型模式已开启 - 事件将由AI动态生成' });
    } else {
      addToast({ type: 'info', message: '🔄 AI大模型模式已关闭' });
    }
  };

  if (step === 'mode') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <h1 className="text-3xl font-bold text-ink mb-3">🎮 模拟人生</h1>
        <p className="text-ink-muted text-sm mb-8">选择游戏模式</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <button onClick={() => { selectMode('normal'); setStep('year'); }} className="p-6 bg-white border border-border-subtle rounded-xl hover:border-brand transition-all text-left">
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="text-lg font-semibold text-ink mb-1">普通模式</h3>
            <p className="text-xs text-ink-muted">度过平凡而真实的一生</p>
          </button>
          <button onClick={() => { selectMode('endless'); setStep('year'); }} className="p-6 bg-white border border-border-subtle rounded-xl hover:border-brand transition-all text-left">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-lg font-semibold text-ink mb-1">修仙模式</h3>
            <p className="text-xs text-ink-muted">突破寿元极限，追求长生</p>
          </button>
        </div>
        <div className="mt-6 flex items-center gap-3 bg-white border border-border-subtle rounded-xl px-5 py-3">
          <span className="text-sm font-medium text-ink">🤖 开启AI大模型</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={handleAiToggle}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {aiEnabled && (
          <p className="mt-2 text-xs text-brand">
            ✨ AI将根据你的属性、年龄和经历动态生成专属事件
          </p>
        )}
        <button
          onClick={() => navigate('/thinktank')}
          className="mt-4 px-6 py-2.5 bg-white border border-border-subtle rounded-xl text-ink-muted hover:border-brand hover:text-brand transition-all flex items-center gap-2 text-sm"
        >
          <span>🏛️</span>
          <span>智库 - 查看所有卡牌</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-ink mb-2">选择你的出生年份</h2>
        <p className="text-ink-muted text-sm">{mode === 'endless' ? '修仙之路，始于足下' : '每个时代都有独特的挑战与机遇'}</p>
      </div>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 mb-6">
          {ERAS.map((era) => (
            <button key={era.year} onClick={() => setSelectedYear(era.year)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedYear === era.year ? 'bg-brand text-white shadow-md scale-105' : 'bg-white border border-border-subtle text-ink hover:border-brand hover:text-brand'}`}>
              {era.year}
            </button>
          ))}
        </div>
        {selectedEra && (
          <div className="bg-white rounded-xl border border-border-subtle p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🌟</span>
              <div><h3 className="font-semibold text-ink">{selectedEra.name}</h3><span className="text-xs text-ink-muted">{selectedEra.year}年代</span></div>
            </div>
            <p className="text-sm text-ink-muted mb-3">{selectedEra.description}</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><div className="text-ink-muted">预期寿命</div><div className="font-semibold text-ink">{selectedEra.baseLifeExpectancy}岁</div></div>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><div className="text-ink-muted">初始财富</div><div className="font-semibold text-ink">{selectedEra.initialWealthRange[0]}-{selectedEra.initialWealthRange[1]}</div></div>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"><div className="text-ink-muted">属性点</div><div className="font-semibold text-ink">{selectedEra.attributePoints}</div></div>
            </div>
          </div>
        )}
        <div className="text-center">
          <button onClick={() => selectedYear && startGame(selectedYear)} disabled={!selectedYear}
            className={`px-8 py-3 rounded-lg font-medium text-base transition-all ${selectedYear ? 'bg-brand text-white hover:bg-brand/90 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            开始人生 →
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 属性提示内容（含阶层信息）
// ==========================================
const AttributeTooltipContent: React.FC<{ attr: keyof PlayerAttributes }> = ({ attr }) => {
  const value = useSimulationStore((s) => s.attributes[attr]);
  const tierInfo = getAttributeTierInfo(attr, value);
  const attrCards = ATTRIBUTE_TIER_CARDS[attr] || [];
  const nextCard = attrCards.find((c) => {
    const bonus = tierInfo.nextBonuses.find((b) => b.cardId === c.id);
    return !!bonus;
  });
  const acquiredCards = attrCards.filter((c) => tierInfo.cardBonuses.some((b) => b.cardId === c.id));

  return (
    <div className="max-w-[260px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{ATTRIBUTE_ICONS[attr]}</span>
        <span className="font-semibold text-ink text-sm">{ATTRIBUTE_NAMES[attr]}</span>
        <span className="text-xs text-ink-muted ml-auto">{Math.round(value)}/100</span>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-muted mb-2">
        {ATTRIBUTE_DESCRIPTIONS[attr]}
      </p>

      {/* 已获得的卡牌 */}
      {acquiredCards.length > 0 && (
        <div className="mb-2 p-1.5 rounded bg-purple-50 border border-purple-200">
          <div className="text-[10px] text-purple-600 font-medium mb-1">🎴 已获得的卡牌</div>
          {acquiredCards.map((card) => (
            <div key={card.id} className="text-[10px] text-purple-700 mb-0.5">
              <span className="font-medium">{card.icon} {card.name}</span>
              <span className="text-purple-500 ml-1">- {card.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* 当前阶层 */}
      {tierInfo.currentTier > 0 && (
        <div className="mb-2 p-1.5 rounded bg-amber-50 border border-amber-200">
          <div className="text-[10px] text-amber-600 font-medium mb-0.5">
            🏆 当前阶层: {tierInfo.currentTierName} ({tierInfo.currentTier}/5阶)
          </div>
          <div className="text-[10px] text-amber-700">
            {tierInfo.passiveBonuses.length > 0 && (
              <div>✨ 被动: {tierInfo.passiveBonuses.map((b) => b.description).join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* 下一阶预览 */}
      {tierInfo.nextTier && tierInfo.nextTierName && (
        <div className="p-1.5 rounded bg-blue-50 border border-blue-200">
          <div className="text-[10px] text-blue-600 font-medium mb-0.5">
            🔓 下一阶 ({tierInfo.nextTier}点): {tierInfo.nextTierName}
          </div>
          <div className="text-[10px] text-blue-700">
            {tierInfo.nextBonuses[0]?.effect === 'card_reward' && nextCard ? (
              <div>🎴 获得卡牌: {nextCard.icon} {nextCard.name} - {nextCard.description}</div>
            ) : (
              <div>✨ 被动: {tierInfo.nextBonuses[0]?.description}</div>
            )}
          </div>
        </div>
      )}

      {!tierInfo.currentTier && (
        <div className="p-1.5 rounded bg-gray-50 border border-gray-200">
          <div className="text-[10px] text-gray-500">
            🔒 达到30点解锁第一阶奖励
          </div>
        </div>
      )}
    </div>
  );
};

const AllocatingPhase: React.FC = () => {
  const attributes = useSimulationStore((s) => s.attributes);
  const baseAttributes = useSimulationStore((s) => s.baseAttributes);
  const remainingPoints = useSimulationStore((s) => s.remainingAttributePoints);
  const allocateAttribute = useSimulationStore((s) => s.allocateAttribute);
  const confirmAllocation = useSimulationStore((s) => s.confirmAllocation);

  const TIERS = [30, 50, 70, 90, 100];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-8">
      <h2 className="text-xl font-semibold text-ink mb-2">分配属性点</h2>
      <p className="text-ink-muted text-sm mb-6">剩余点数：<span className="font-bold text-brand">{remainingPoints}</span></p>
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => {
          const tierInfo = getAttributeTierInfo(attr, attributes[attr]);
          const nextTier = tierInfo.nextTier;
          const hasReachedTier = tierInfo.currentTier > 0;
          return (
            <Tooltip key={attr} content={<AttributeTooltipContent attr={attr} />} position="top">
              <div className="bg-white rounded-lg border border-border-subtle p-4 cursor-help transition-all hover:border-brand/50 hover:shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{ATTRIBUTE_ICONS[attr]}</span>
                    <span className="text-sm font-medium text-ink">{ATTRIBUTE_NAMES[attr]}</span>
                    {hasReachedTier && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        {tierInfo.currentTierName}
                      </span>
                    )}
                  </div>
                  <span className="w-10 text-center font-mono font-bold text-brand">{attributes[attr]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); allocateAttribute(attr, attributes[attr] - 1); }}
                    disabled={attributes[attr] <= baseAttributes[attr]}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-xs flex-shrink-0"
                  >
                    -
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={baseAttributes[attr]}
                      max={Math.min(60, attributes[attr] + remainingPoints)}
                      value={attributes[attr]}
                      onChange={(e) => allocateAttribute(attr, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand w-full"
                    />
                    <div className="flex justify-between mt-1">
                      {TIERS.map((t) => {
                        const isReached = attributes[attr] >= t;
                        const isNext = nextTier === t;
                        return (
                          <div key={t} className="flex flex-col items-center">
                            <div className={`w-1.5 h-1.5 rounded-full ${isReached ? 'bg-amber-400' : isNext ? 'bg-blue-300' : 'bg-gray-200'}`} />
                            <span className={`text-[8px] ${isReached ? 'text-amber-600' : isNext ? 'text-blue-500' : 'text-gray-400'}`}>
                              {t}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); allocateAttribute(attr, attributes[attr] + 1); }}
                    disabled={remainingPoints <= 0 || attributes[attr] >= 60}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-xs flex-shrink-0"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-ink-muted mt-1">
                  <span>基础 {baseAttributes[attr]}</span>
                  {nextTier && (
                    <span className="text-blue-500">
                      下一阶 {nextTier} 点
                      {tierInfo.nextBonuses[0]?.effect === 'card_reward' && (
                        <span className="ml-1 text-purple-500">🎴</span>
                      )}
                    </span>
                  )}
                </div>
                {nextTier && tierInfo.nextBonuses[0]?.effect === 'card_reward' && (() => {
                  const nextCard = ATTRIBUTE_TIER_CARDS[attr]?.find((c) => c.id === tierInfo.nextBonuses[0]?.cardId);
                  return nextCard ? (
                    <div className="mt-1 p-1 rounded bg-purple-50 border border-purple-100 text-[9px] text-purple-600">
                      <span className="font-medium">{nextCard.icon} {nextCard.name}</span>: {nextCard.description}
                    </div>
                  ) : null;
                })()}
              </div>
            </Tooltip>
          );
        })}
      </div>
      <button onClick={confirmAllocation} disabled={remainingPoints > 0}
        className={`px-8 py-3 rounded-lg font-medium transition-all ${remainingPoints === 0 ? 'bg-brand text-white hover:bg-brand/90 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        确认分配 →
      </button>
    </div>
  );
};

// ==========================================
// 宏观地图弹窗
// ==========================================
const MacroMapModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const currentMap = useSimulationStore((s) => s.currentMap);
  if (!currentMap) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink">宏观地图</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl">&times;</button>
        </div>
        <p className="text-sm text-ink-muted mb-4">展示整个时代的路径结构</p>
        <div className="space-y-2">
          {currentMap.years.map((year) => (
            <div key={year.year} className={`flex items-center gap-3 p-3 rounded-lg border ${
              year.isCompleted ? 'bg-gray-50 border-gray-200' :
              year.year === currentMap.years[currentMap.currentYearIndex].year ? 'bg-brand/5 border-brand' :
              'border-border-subtle'
            }`}>
              <div className="w-16 text-sm font-medium text-ink text-right flex-shrink-0">{year.year}年</div>
              <div className="flex gap-2 flex-1">
                {(year.isCompleted && year.selectedOptionId
                  ? year.options.filter((opt) => opt.id === year.selectedOptionId)
                  : year.options
                ).map((opt) => (
                  <div key={opt.id} className={`flex-1 h-14 rounded-lg border text-xs flex flex-col items-center justify-center p-1 ${
                    year.isCompleted ? 'bg-gray-100 border-gray-200 text-gray-400' :
                    year.selectedOptionId === opt.id ? 'bg-brand/10 border-brand text-brand font-bold' :
                    'bg-white border-border-subtle text-ink'
                  }`}>
                    <span className="text-lg">{OPTION_ICONS[opt.type]}</span>
                    <span className="text-[10px] mt-0.5">{OPTION_NAMES[opt.type]}</span>
                  </div>
                ))}
              </div>
              {year.isCompleted && <span className="text-green-500 text-sm">✓</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand/20 border border-brand inline-block" /> 当前可选</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" /> 已完成</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 年度视图（三选一）
// ==========================================
const YearViewPhase: React.FC = () => {
  const currentMap = useSimulationStore((s) => s.currentMap);
  const selectOption = useSimulationStore((s) => s.selectOption);
  const enterOption = useSimulationStore((s) => s.enterOption);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const [showMacro, setShowMacro] = useState(false);

  if (!currentMap) return null;

  const year = currentMap.years[currentMap.currentYearIndex];
  const yearNum = (birthYear || 1950) + currentMap.era * 10 + currentMap.currentYearIndex;
  const selectedOpt = year.options.find((o) => o.id === year.selectedOptionId);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-ink mb-1">{yearNum}年</div>
        <div className="text-sm text-ink-muted">第{currentMap.currentYearIndex + 1}年 / 共10年</div>
        {year.isBossYear && <div className="mt-2 text-sm text-red-500 font-medium">⚠️ Boss年 - 无法跳过</div>}
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-sm mb-6">
        {year.options.map((opt, idx) => {
          const isSelected = year.selectedOptionId === opt.id;
          return (
            <React.Fragment key={opt.id}>
              <button
                onClick={() => !year.isCompleted && selectOption(opt.id)}
                disabled={year.isCompleted}
                className={`w-full max-w-[320px] p-5 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-brand bg-brand/5 shadow-md scale-[1.02]' :
                  year.isCompleted ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' :
                  'border-border-subtle bg-white hover:border-brand hover:shadow-md cursor-pointer'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{OPTION_ICONS[opt.type]}</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink">{OPTION_NAMES[opt.type]}</div>
                    <div className="text-xs text-ink-muted">{OPTION_DESCS[opt.type]}</div>
                  </div>
                  {isSelected && <span className="text-brand text-lg">✓</span>}
                </div>
              </button>
              {idx < year.options.length - 1 && (
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <div className="w-0.5 h-4 bg-gray-200" />
                  <span>或</span>
                  <div className="w-0.5 h-4 bg-gray-200" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 当前选择信息 */}
      {selectedOpt && (
        <div className="w-full max-w-md bg-white rounded-xl border border-border-subtle p-4 mb-4">
          <div className="text-sm text-ink-muted mb-2">当前选择</div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{OPTION_ICONS[selectedOpt.type]}</span>
            <span className="font-medium text-ink">{OPTION_NAMES[selectedOpt.type]}</span>
            {selectedOpt.type === 'boss' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ Boss战</span>}
          </div>
          <p className="text-xs text-ink-muted mt-1">{OPTION_DESCS[selectedOpt.type]}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setShowMacro(true)}
          className="px-5 py-2.5 bg-white border border-border-subtle rounded-lg text-sm hover:border-brand transition-colors">
          🗺️ 宏观地图
        </button>
        <button onClick={enterOption} disabled={!selectedOpt || year.isCompleted}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            selectedOpt && !year.isCompleted ? 'bg-brand text-white hover:bg-brand/90 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          进入 →
        </button>
      </div>

      {showMacro && <MacroMapModal onClose={() => setShowMacro(false)} />}
    </div>
  );
};

// ==========================================
// 事件阶段
// ==========================================
const EventPhase: React.FC<{ event: GameEvent }> = ({ event }) => {
  const makeChoice = useSimulationStore((s) => s.makeChoice);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const attributes = useSimulationStore((s) => s.attributes);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const choiceHistory = useSimulationStore((s) => s.choiceHistory);
  const getSuccessRate = useSimulationStore((s) => s.getSuccessRate);
  const aiLoading = useSimulationStore((s) => s.aiLoading);

  const getDisplayText = () => {
    let text = event.baseText;
    if (event.skinRule) {
      const skinText = event.skinRule(attributes, choiceHistory, hiddenTags);
      text = text.replace(/\{[^}]+\}/g, skinText);
    }
    return text;
  };

  const displayText = getDisplayText();

  if (aiLoading) {
    return (
      <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full mb-4" />
          <p className="text-ink-muted text-sm">🤖 AI正在为你生成专属事件...</p>
          <p className="text-ink-faint text-xs mt-2">请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm max-w-lg mx-auto">
      <h3 className="text-lg font-semibold text-ink mb-3">
        {event.title}
        {event.id.startsWith('ai_event_') && (
          <span className="ml-2 text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">AI生成</span>
        )}
      </h3>
      <p className="text-ink-muted text-sm leading-relaxed mb-6">{displayText}</p>
      <div className="space-y-3">
        {event.options.length === 0 ? (
          <button onClick={() => completeOption()}
            className="w-full text-left p-4 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand/5 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-ink">继续 →</span>
            </div>
          </button>
        ) : (
          event.options.map((option) => {
            const rate = getSuccessRate(option);
            return (
              <button key={option.id} onClick={() => makeChoice(event, option)}
                className="w-full text-left p-4 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand/5 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-ink">{option.text}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-ink-muted">{Math.round(rate * 100)}%</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ==========================================
// 事件遗物选择界面
// ==========================================
const EventRelicSelectionPhase: React.FC = () => {
  const eventRelicSelection = useSimulationStore((s) => s.eventRelicSelection);
  const selectEventRelic = useSimulationStore((s) => s.selectEventRelic);
  const skipEventRelic = useSimulationStore((s) => s.skipEventRelic);

  if (!eventRelicSelection) return null;

  const { relics, triggerCombatAfter } = eventRelicSelection;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'uncommon': return 'border-green-400 bg-green-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'boss': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'uncommon': return '优秀';
      case 'rare': return '稀有';
      case 'boss': return 'Boss';
      case 'legendary': return '传说';
      default: return '普通';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-ink mb-2">🎁 选择一件遗物</h3>
        <p className="text-ink-muted text-sm">
          {triggerCombatAfter ? '选择后即将进入战斗...' : '从以下遗物中挑选一件作为奖励'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {relics.map((relic) => (
          <button
            key={relic.id}
            onClick={() => selectEventRelic(relic.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-md hover:scale-[1.02] ${getRarityColor(relic.rarity)}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{relic.icon}</span>
              <div>
                <h4 className="font-medium text-ink text-sm">{relic.name}</h4>
                <span className="text-xs text-ink-muted">{getRarityName(relic.rarity)}</span>
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">{relic.description}</p>
            <div className="mt-2 space-y-1">
              {relic.effects.map((effect, idx) => (
                <div key={idx} className="text-xs text-brand">
                  • {effect.type === 'max_health_bonus' && `生命上限+${effect.value}`}
                  {effect.type === 'energy_bonus' && `精力+${effect.value}`}
                  {effect.type === 'card_draw_bonus' && `抽牌+${effect.value}`}
                  {effect.type === 'discount' && `折扣${Math.round(effect.value * 100)}%`}
                  {effect.type === 'double_damage' && `伤害加成${Math.round(effect.value * 100)}%`}
                  {effect.type === 'heal_on_rest' && `休息恢复+${effect.value}`}
                  {effect.type === 'extra_card_reward' && `额外抽牌奖励+${effect.value}`}
                  {effect.type === 'card_type_bonus' && `${effect.cardType}卡加成${Math.round(effect.value * 100)}%`}
                  {effect.type === 'attribute_scaling' && `${effect.attribute}成长+${Math.round(effect.value * 100)}%`}
                  {effect.type === 'lifespan_extend' && `寿命+${effect.value}`}
                  {effect.type === 'retention_bonus' && `保留加成+${effect.value}`}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={skipEventRelic}
        className="w-full px-4 py-2.5 border border-border-subtle text-ink-muted rounded-lg hover:border-brand hover:text-brand transition-all text-sm"
      >
        跳过（不选遗物）
      </button>
    </div>
  );
};

// ==========================================
// 战斗界面（浅色主题）
// ==========================================
const CombatPhaseView: React.FC = () => {
  const combat = useSimulationStore((s) => s.combat);
  const playCard = useSimulationStore((s) => s.playCard);
  const selectTarget = useSimulationStore((s) => s.selectTarget);
  const endTurn = useSimulationStore((s) => s.endTurn);
  const activateBonus = useSimulationStore((s) => s.activateBonus);
  const toggleDiscardSelection = useSimulationStore((s) => s.toggleDiscardSelection);
  const confirmDiscard = useSimulationStore((s) => s.confirmDiscard);
  const activeBonuses = useSimulationStore((s) => s.getActiveAttributeBonuses)() as AttributeThresholdBonus[];
  const remainingLife = useSimulationStore((s) => s.remainingLife);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const currentMap = useSimulationStore((s) => s.currentMap);
  const damageEventCounter = useSimulationStore((s) => s.damageEventCounter);
  const [showDeckPanel, setShowDeckPanel] = useState<'draw' | 'discard' | 'exhaust' | null>(null);
  const [showMacro, setShowMacro] = useState(false);
  const [showBurnLifeModal, setShowBurnLifeModal] = useState(false);

  const yearNum = (birthYear || 1950) + (currentMap?.era || 0) * 10 + (currentMap?.currentYearIndex || 0);

  const getIntentIcon = (intent: { type: string }) => {
    switch (intent.type) {
      case 'attack': return '⚔️';
      case 'defend': return '🛡️';
      case 'buff': return '🔮';
      case 'debuff': return '💀';
      default: return '❓';
    }
  };

  const getIntentColor = (intent: { type: string }) => {
    switch (intent.type) {
      case 'attack': return 'text-danger';
      case 'defend': return 'text-info';
      case 'buff': return 'text-warning';
      case 'debuff': return 'text-[#a855f7]';
      default: return 'text-ink-muted';
    }
  };

  return (
    <div className="p-4 md:p-5 space-y-4 max-w-6xl mx-auto">
      {/* 顶部状态栏 */}
      <header className="flex items-center justify-between bg-bg-elevated rounded-xl px-5 py-3 border border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="text-base">⚔️</span>
          <span className="text-serif font-semibold text-sm text-ink">战斗回合</span>
          <span className="text-xs text-ink-muted bg-bg-subtle px-2 py-0.5 rounded">第 {combat.currentTurn} 回合</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-ink-muted">
            <span className="text-gold">{yearNum}年</span> · 第{(currentMap?.currentYearIndex || 0) + 1}年/共10年
          </div>
          <button onClick={() => setShowMacro(true)} className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle text-ink-muted hover:border-brand hover:text-brand transition-colors">
            🗺️ 宏观地图
          </button>
        </div>
      </header>

      {/* 主体：左侧敌人区 + 右侧玩家状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧：敌人区域 (占3列) */}
        <div className="lg:col-span-3 space-y-4">
          {/* 敌人区 */}
          <section className="bg-bg-elevated rounded-xl p-5 border border-border-subtle relative group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">敌方</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-ink-faint">点击敌人选择攻击目标</span>
                <div className="flex gap-1.5">
                  {combat.enemies.filter(e => e.currentHealth > 0).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-danger animate-pulse-glow" style={{ animationDelay: `${i * 0.3}s` }} />
                  ))}
                </div>
              </div>
            </div>
            <FloatingDamage counter={damageEventCounter} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combat.enemies.map((enemy, idx) => {
                const isCurrent = idx === combat.currentEnemyIndex;
                const hpPercent = (enemy.currentHealth / enemy.maxHealth) * 100;
                const intent = enemy.intents[enemy.currentIntentIndex];
                const isTarget = isCurrent && enemy.currentHealth > 0;
                const isAlive = enemy.currentHealth > 0;

                return (
                  <div
                    key={enemy.id}
                    onClick={() => isAlive && selectTarget(idx)}
                    className={`relative rounded-xl p-4 transition-all ${isAlive ? 'cursor-pointer' : 'cursor-default opacity-40'} ${isTarget ? 'hover:shadow-md' : isAlive ? 'hover:border-danger/30 hover:shadow-sm' : ''}`}
                    style={{
                      background: isTarget ? 'linear-gradient(to bottom, rgba(209,36,47,0.06), rgba(209,36,47,0.03))' : 'var(--color-bg-elevated)',
                      border: `2px solid ${isTarget ? 'rgba(209,36,47,0.5)' : isAlive ? 'var(--color-border-subtle)' : 'transparent'}`,
                      boxShadow: isTarget ? '0 0 12px rgba(209,36,47,0.15), var(--shadow-md)' : 'none',
                    }}
                  >
                    {isTarget && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger text-white font-medium shadow-sm">🎯 目标</span>
                      </div>
                    )}
                    {!isTarget && isAlive && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-ink-muted border border-border-subtle">点击选择</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl animate-float" style={{ animationDelay: `${idx * 1}s` }}>{enemy.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-serif font-semibold text-sm text-ink">
                          {enemy.name}
                          {enemy.isBoss && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-danger-bg text-danger border border-danger/20">BOSS</span>}
                        </h3>
                        <p className="text-[11px] text-ink-muted mt-0.5">{enemy.description}</p>
                      </div>
                    </div>
                    {/* HP */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">❤️</span>
                          <span className="text-xs font-mono text-danger">{enemy.currentHealth}/{enemy.maxHealth}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${hpPercent}%`,
                            background: hpPercent > 50 ? 'linear-gradient(to right, #dc2626, #f87171)' : hpPercent > 25 ? 'linear-gradient(to right, #ea580c, #fb923c)' : 'linear-gradient(to right, #991b1b, #dc2626)',
                          }}
                        />
                      </div>
                    </div>
                    {/* 格挡 */}
                    {enemy.block > 0 && (
                      <div className="flex items-center justify-between rounded-lg px-3 py-1.5 mb-2 bg-info-light border border-info/20">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🛡️</span>
                          <span className="text-[10px] text-info">格挡</span>
                        </div>
                        <span className="text-sm font-bold text-info">{enemy.block}</span>
                      </div>
                    )}
                    {/* 意图 */}
                    {intent && enemy.currentHealth > 0 && (() => {
                       let actualDamage = 0;
                       let baseDamage = 0;
                       if (intent.type === 'attack') {
                         baseDamage = intent.damage;
                         const shield = enemy.mechanics?.includes('shield') ? 0.75 : 1;
                         actualDamage = calculateDamage(Math.floor(intent.damage * shield), enemy.statusEffects, combat.player.statusEffects);
                       }
                       const weakValue = enemy.statusEffects.find((x) => x.type === 'weak')?.value;
                       return (
                         <div className="rounded-lg px-3 py-2 bg-bg-subtle border border-border-subtle">
                           <div className="flex items-center gap-2">
                             <span className="text-sm">{getIntentIcon(intent)}</span>
                             <div>
                               <div className="text-[10px] text-ink-muted">下回合</div>
                               <div className={`text-xs font-medium ${getIntentColor(intent)}`}>
                                 {intent.type === 'attack' && (
                                   <>
                                     攻击 {actualDamage} 伤害
                                     {intent.hits && intent.hits > 1 && (
                                       <span className="text-[9px] text-ink-faint ml-1">×{intent.hits}</span>
                                     )}
                                     {baseDamage !== actualDamage && (
                                       <span className="text-[9px] text-ink-faint ml-1">({baseDamage}
                                         {enemy.statusEffects.find((x) => x.type === 'strength') && `+${enemy.statusEffects.find((x) => x.type === 'strength')!.value}`}
                                         {weakValue && `-${weakValue}`}
                                         {enemy.mechanics?.includes('shield') && '×0.75'})
                                       </span>
                                     )}
                                   </>
                                 )}
                                 {intent.type === 'defend' && `格挡 ${intent.block}`}
                                 {intent.type === 'buff' && `强化 +${intent.value}力量`}
                                 {intent.type === 'debuff' && `削弱`}
                                 {!['attack', 'defend', 'buff', 'debuff'].includes(intent.type) && intent.type}
                               </div>
                             </div>
                           </div>
                         </div>
                       );
                     })()}
                    {/* 状态 */}
                    {enemy.statusEffects.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {enemy.statusEffects.map((eff, i) => (
                          <BuffDebuffBadge key={i} buff={eff} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 手牌区 */}
          <section className="bg-bg-elevated rounded-xl p-5 border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                手牌 <span className="text-ink-faint">({combat.player.hand.length})</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {combat.player.hand.map((card) => {
                const canPlay = card.cost <= combat.player.energy;
                const isSelectedForDiscard = combat.selectedForDiscard.includes(card.id);
                const isDiscardPhase = combat.phase === 'discard_selection';

                const handleClick = () => {
                  if (isDiscardPhase) {
                    toggleDiscardSelection(card.id);
                  } else {
                    playCard(card.id);
                  }
                };

                return (
                  <div key={card.id} className="relative">
                    {isDiscardPhase && isSelectedForDiscard && (
                      <div className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-danger flex items-center justify-center shadow-md">
                        <span className="text-[8px] text-white font-bold">弃</span>
                      </div>
                    )}
                    <CardDetail
                      card={card}
                      activeBonuses={activeBonuses}
                      statusEffects={combat.player.statusEffects}
                      onClick={handleClick}
                      disabled={!isDiscardPhase && !canPlay}
                      width={130}
                    />
                  </div>
                );
              })}
            </div>

          </section>

          {/* 弃牌选择提示栏 */}
          {combat.phase === 'discard_selection' && (
            <div className="bg-bg-elevated rounded-xl p-4 border border-danger/30 border-l-4 border-l-danger">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-ink mb-0.5">🗑️ 手牌超出上限，请选择要弃掉的卡牌</div>
                  <div className="text-[10px] text-ink-muted">
                    需弃掉 {combat.requiredDiscardCount} 张 · 已选择 {combat.selectedForDiscard.length} 张 · 将保留 {combat.player.hand.length - combat.selectedForDiscard.length} 张
                  </div>
                </div>
                <button
                  onClick={confirmDiscard}
                  disabled={combat.selectedForDiscard.length !== combat.requiredDiscardCount}
                  className={`px-5 py-2 font-medium text-sm rounded-lg shadow-sm transition-all ${
                    combat.selectedForDiscard.length === combat.requiredDiscardCount
                      ? 'bg-brand text-white hover:shadow-md hover:bg-brand-hover'
                      : 'bg-bg-subtle text-ink-faint cursor-not-allowed'
                  }`}
                >
                  确认弃牌 →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：玩家状态 (占1列) */}
        <div className="space-y-4">
          {/* 玩家状态 */}
          <div className="bg-bg-elevated rounded-xl p-4 border border-border-subtle">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">你的状态</h3>
            {/* 生命值 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">❤️</span>
                  <span className="text-[10px] text-ink-muted">生命</span>
                </div>
                <span className="text-xs font-mono font-semibold text-success">
                  {combat.player.currentHealth}/{combat.player.maxHealth}
                </span>
              </div>
              <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(combat.player.currentHealth / combat.player.maxHealth) * 100}%`,
                    background: 'linear-gradient(to right, #16a34a, #4ade80)',
                  }}
                />
              </div>
            </div>
            {/* 精力 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">⚡</span>
                  <span className="text-[10px] text-ink-muted">精力</span>
                </div>
                <span className="text-xs font-mono font-semibold text-brand">
                  {combat.player.energy}/{combat.player.maxEnergy}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: combat.player.maxEnergy }).map((_, i) => (
                  <span
                    key={i}
                    className="flex-1 h-1.5 rounded-full"
                    style={{
                      background: i < combat.player.energy ? 'var(--color-brand)' : 'var(--color-bg-subtle)',
                      boxShadow: i < combat.player.energy ? '0 0 4px rgba(218,119,86,0.4)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            {/* 格挡 */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2 mb-3 bg-bg-subtle border border-border-subtle">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🛡️</span>
                <span className="text-[10px] text-ink-muted">格挡</span>
              </div>
              <span className="text-sm font-bold text-info">{combat.player.block}</span>
            </div>
            {/* 抽牌/手牌上限 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 rounded-lg bg-bg-subtle border border-border-subtle">
                <div className="text-[10px] text-ink-muted mb-0.5">抽牌数</div>
                <div className="text-sm font-bold text-brand">{BASE_DRAW_COUNT + activeBonuses.filter((b) => b.effect === 'extra_draw').reduce((sum, b) => sum + b.value, 0)}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-bg-subtle border border-border-subtle">
                <div className="text-[10px] text-ink-muted mb-0.5">手牌上限</div>
                <div className="text-sm font-bold text-brand">{MAX_HAND_SIZE}</div>
              </div>
            </div>
            {/* 当前目标 */}
            {(() => {
              const target = combat.enemies[combat.currentEnemyIndex];
              if (!target || target.currentHealth <= 0) return null;
              return (
                <div className="rounded-lg px-3 py-2 mb-3 bg-danger/5 border border-danger/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">🎯</span>
                    <span className="text-[10px] text-ink-muted">当前目标</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{target.icon}</span>
                    <span className="text-xs font-medium text-danger">{target.name}</span>
                    <span className="text-[10px] text-danger/70 ml-auto">{target.currentHealth}/{target.maxHealth}</span>
                  </div>
                </div>
              );
            })()}
            {/* 牌组 */}
            <div className="mb-3 pb-3 border-b border-border-subtle">
              <div className="flex items-center justify-between text-[10px] text-ink-muted mb-2">
                <span>🃏 牌组状态</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setShowDeckPanel(showDeckPanel === 'draw' ? null : 'draw')}
                  className={`text-center p-1.5 rounded-lg text-[10px] transition-all ${
                    showDeckPanel === 'draw' ? 'bg-brand/10 border border-brand text-brand' : 'bg-bg-subtle border border-border-subtle text-ink-muted hover:border-brand/30'
                  }`}
                >
                  <div className="font-bold text-sm">{combat.player.drawPile.length}</div>
                  <div>抽牌堆</div>
                </button>
                <button
                  onClick={() => setShowDeckPanel(showDeckPanel === 'discard' ? null : 'discard')}
                  className={`text-center p-1.5 rounded-lg text-[10px] transition-all ${
                    showDeckPanel === 'discard' ? 'bg-brand/10 border border-brand text-brand' : 'bg-bg-subtle border border-border-subtle text-ink-muted hover:border-brand/30'
                  }`}
                >
                  <div className="font-bold text-sm">{combat.player.discardPile.length}</div>
                  <div>弃牌堆</div>
                </button>
                <button
                  onClick={() => setShowDeckPanel(showDeckPanel === 'exhaust' ? null : 'exhaust')}
                  className={`text-center p-1.5 rounded-lg text-[10px] transition-all ${
                    showDeckPanel === 'exhaust' ? 'bg-brand/10 border border-brand text-brand' : 'bg-bg-subtle border border-border-subtle text-ink-muted hover:border-brand/30'
                  }`}
                >
                  <div className="font-bold text-sm">{combat.player.exhaustPile.length}</div>
                  <div>消耗堆</div>
                </button>
              </div>
            </div>

            {/* 牌组详情面板 */}
            {showDeckPanel && (
              <div className="mb-3 pb-3 border-b border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-ink">
                    {showDeckPanel === 'draw' ? '📥 抽牌堆剩余' : showDeckPanel === 'discard' ? '🗑️ 弃牌堆' : '💨 消耗堆'}
                  </span>
                  <button onClick={() => setShowDeckPanel(null)} className="text-[10px] text-ink-faint hover:text-ink">✕</button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {showDeckPanel === 'draw' && combat.player.drawPile.map((card) => (
                    <Tooltip key={card.id} content={<CardDetail card={card} width={130} />} position="right">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px] cursor-pointer hover:bg-bg-elevated">
                        <span className="text-sm">{card.icon}</span>
                        <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                        <span className="text-ink-faint">{card.cost}⚡</span>
                      </div>
                    </Tooltip>
                  ))}
                  {showDeckPanel === 'discard' && combat.player.discardPile.map((card) => (
                    <Tooltip key={card.id} content={<CardDetail card={card} width={130} />} position="right">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px] cursor-pointer hover:bg-bg-elevated">
                        <span className="text-sm">{card.icon}</span>
                        <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                        <span className="text-ink-faint">{card.cost}⚡</span>
                      </div>
                    </Tooltip>
                  ))}
                  {showDeckPanel === 'exhaust' && combat.player.exhaustPile.map((card) => (
                    <Tooltip key={card.id} content={<CardDetail card={card} width={130} />} position="right">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px] cursor-pointer hover:bg-bg-elevated">
                        <span className="text-sm">{card.icon}</span>
                        <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                        <span className="text-ink-faint">{card.cost}⚡</span>
                      </div>
                    </Tooltip>
                  ))}
                  {((showDeckPanel === 'draw' && combat.player.drawPile.length === 0) ||
                    (showDeckPanel === 'discard' && combat.player.discardPile.length === 0) ||
                    (showDeckPanel === 'exhaust' && combat.player.exhaustPile.length === 0)) && (
                    <div className="text-center text-[10px] text-ink-faint py-2">空</div>
                  )}
                </div>
              </div>
            )}

            {/* 属性加成 */}
            {activeBonuses.length > 0 && (
              <div>
                <div className="text-[10px] text-ink-muted mb-2">🌟 属性加成</div>
                <div className="flex flex-col gap-1.5">
                  {activeBonuses.map((b, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-1 rounded bg-gold-light border border-gold/20 text-gold"
                      title={b.description}
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* 状态效果 */}
            {combat.player.statusEffects.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] text-ink-muted mb-2">💫 状态效果</div>
                <div className="flex gap-1.5 flex-wrap">
                  {combat.player.statusEffects.map((eff, i) => (
                    <BuffDebuffBadge key={i} buff={eff} />
                  ))}
                </div>
              </div>
            )}
            {/* 战斗日志 */}
            {combat.log.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] text-ink-muted mb-2">📜 战斗日志</div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 bg-bg-subtle rounded-lg p-2">
                  {combat.log.slice(-10).map((entry, i) => (
                    <div
                      key={i}
                      className={`text-[10px] leading-tight ${
                        entry.actor === 'player' ? 'text-brand' :
                        entry.actor === 'system' ? 'text-ink-faint italic' :
                        'text-danger'
                      }`}
                    >
                      <span className="text-ink-faint mr-1">[T{entry.turn}]</span>
                      {entry.actor !== 'system' && entry.actor !== 'player' && (
                        <span className="font-medium">{entry.actor}: </span>
                      )}
                      {entry.action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 燃烧生命 */}
          {combat.availableBonuses.length > 0 && (
            <button
              onClick={() => !combat.burnLifeUsed && setShowBurnLifeModal(true)}
              disabled={combat.burnLifeUsed}
              className={`w-full py-3 font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                combat.burnLifeUsed
                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20'
              }`}
            >
              <span>{combat.burnLifeUsed ? '✓' : '🔥'}</span>
              <span>{combat.burnLifeUsed ? '已燃烧' : '燃烧生命'}</span>
              {!combat.burnLifeUsed && <span className="text-xs opacity-70">({combat.availableBonuses.length}个选项)</span>}
            </button>
          )}

          {/* 燃烧生命弹窗 */}
          {showBurnLifeModal && !combat.burnLifeUsed && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBurnLifeModal(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-ink">🔥 燃烧生命</h3>
                  <button onClick={() => setShowBurnLifeModal(false)} className="text-ink-muted hover:text-ink text-xl">&times;</button>
                </div>
                <p className="text-sm text-ink-muted mb-2">寿命上限: <span className="font-semibold text-danger">{Math.round(remainingLife)}年</span></p>
                <p className="text-xs text-warning mb-4">⚠️ 每场战斗只能选择一次</p>
                <div className="flex flex-col gap-3">
                  {combat.availableBonuses.map((bonus) => {
                    const canActivate = bonus.lifeCost < remainingLife;
                    return (
                      <button
                        key={bonus.id}
                        onClick={() => { activateBonus(bonus.id); setShowBurnLifeModal(false); }}
                        disabled={!canActivate}
                        className={`p-4 rounded-xl text-left transition-all ${canActivate ? 'hover:scale-[1.02] hover:shadow-md' : 'opacity-40 cursor-not-allowed'}`}
                        style={{
                          background: canActivate ? 'var(--color-brand-surface)' : 'var(--color-bg-subtle)',
                          border: `1px solid ${canActivate ? 'rgba(218,119,86,0.2)' : 'var(--color-border-subtle)'}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-ink">{bonus.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-danger-bg text-danger font-medium">-{bonus.lifeCost}年</span>
                        </div>
                        <p className="text-xs text-ink-muted">{bonus.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 结束回合按钮 */}
          {combat.phase !== 'discard_selection' && (
            <button
              onClick={endTurn}
              className="w-full py-3 bg-brand text-white font-medium text-sm rounded-xl shadow-sm hover:shadow-md hover:bg-brand-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              结束回合 →
            </button>
          )}
        </div>
      </div>
      {showMacro && <MacroMapModal onClose={() => setShowMacro(false)} />}
    </div>
  );
};

// ==========================================
// 战斗奖励/奇遇奖励
// ============================================================
const RewardPhase: React.FC = () => {
  const combat = useSimulationStore((s) => s.combat);
  const selectCardReward = useSimulationStore((s) => s.selectCardReward);
  const selectAttributeReward = useSimulationStore((s) => s.selectAttributeReward);
  const skipRewardWithGold = useSimulationStore((s) => s.skipRewardWithGold);
  const selectWonderOption = useSimulationStore((s) => s.selectWonderOption);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const [tab, setTab] = useState<'card' | 'attribute' | 'relic'>('card');

  const isWonderMode = combat.rewards.mode === 'wonder';
  const wonderOptions = combat.rewards.wonderOptions;

  const hasCards = combat.rewards.cards.length > 0;
  const hasAttribute = !!combat.rewards.attribute;
  const hasRelic = !!combat.rewards.relic;

  const getWonderOptionLabel = (option: WonderRewardOption) => {
    if (option.type === 'card' && option.card) return option.card.name;
    if (option.type === 'attribute' && option.attribute) {
      const entries = Object.entries(option.attribute).map(([k, v]) => `${ATTRIBUTE_NAMES[k] || k}+${v}`);
      return entries.join(', ');
    }
    if (option.type === 'gold' && option.gold) return `${option.gold} 金币`;
    if (option.type === 'relic' && option.relic) return option.relic.name;
    return '未知奖励';
  };

  const getWonderOptionIcon = (option: WonderRewardOption) => {
    if (option.type === 'card') return '🃏';
    if (option.type === 'attribute') return '📊';
    if (option.type === 'gold') return '💰';
    if (option.type === 'relic') return '🏺';
    return '❓';
  };

  const getWonderOptionDescription = (option: WonderRewardOption) => {
    if (option.type === 'card' && option.card) return option.card.description;
    if (option.type === 'attribute' && option.attribute) return '获得属性提升';
    if (option.type === 'gold' && option.gold) return '获得金币';
    if (option.type === 'relic' && option.relic) return option.relic.description;
    return '';
  };

  if (isWonderMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <h2 className="text-xl font-bold text-ink mb-2">🌟 奇遇奖励</h2>
        <p className="text-ink-muted text-sm mb-6">选择一项作为本次奇遇奖励</p>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {wonderOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => selectWonderOption(index)}
              className="bg-white rounded-xl border-2 border-border-subtle p-5 hover:border-brand hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{getWonderOptionIcon(option)}</span>
                <div>
                  <h3 className="font-semibold text-ink group-hover:text-brand transition-colors">{getWonderOptionLabel(option)}</h3>
                  <span className="text-xs text-ink-muted capitalize">{option.type === 'card' ? '卡牌' : option.type === 'attribute' ? '属性' : option.type === 'gold' ? '金币' : '遗物'}</span>
                </div>
              </div>
              <p className="text-sm text-ink-muted">{getWonderOptionDescription(option)}</p>
              {option.type === 'card' && option.card && (
                <div className="mt-3 pointer-events-none">
                  <CardDetail card={option.card} width={120} />
                </div>
              )}
              {option.type === 'relic' && option.relic && (
                <div className="mt-2 text-xs text-ink-muted">
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{RARITY_NAMES[option.relic.rarity] || option.relic.rarity}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={skipRewardWithGold}
          className="px-6 py-2.5 bg-gray-100 text-ink-muted rounded-lg font-medium hover:bg-gray-200 hover:text-ink transition-colors"
        >
          跳过奖励 → 💰+10
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h2 className="text-xl font-bold text-ink mb-2">🎉 选择奖励</h2>
      <p className="text-ink-muted text-sm mb-6">选择一项作为本次奖励</p>

      <div className="flex gap-2 mb-4">
        {hasCards && <button onClick={() => setTab('card')} className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === 'card' ? 'bg-brand text-white' : 'bg-gray-100 text-ink-muted'}`}>🃏 卡牌</button>}
        {hasAttribute && <button onClick={() => setTab('attribute')} className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === 'attribute' ? 'bg-brand text-white' : 'bg-gray-100 text-ink-muted'}`}>📊 属性</button>}
        {hasRelic && <button onClick={() => setTab('relic')} className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === 'relic' ? 'bg-brand text-white' : 'bg-gray-100 text-ink-muted'}`}>🏺 遗物</button>}
      </div>

      {tab === 'card' && hasCards && (
        <div className="w-full max-w-3xl mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {combat.rewards.cards.map((card) => (
              <div key={card.id} className="relative">
                <CardDetail
                  card={card}
                  onClick={() => selectCardReward(card.id)}
                  width={140}
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand text-white whitespace-nowrap">点击选择</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'attribute' && hasAttribute && (
        <div className="w-full max-w-md mb-6">
          <div className="space-y-3">
            {Object.entries(combat.rewards.attribute || {}).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg border border-border-subtle p-4 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-xl">{ATTRIBUTE_ICONS[key]}</span><span className="font-medium text-ink">{ATTRIBUTE_NAMES[key]}</span></div>
                <span className="text-lg font-bold text-green-500">+{value}</span>
              </div>
            ))}
          </div>
          <button onClick={selectAttributeReward} className="w-full mt-4 px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">选择属性奖励</button>
        </div>
      )}

      {tab === 'relic' && hasRelic && (
        <div className="w-full max-w-md mb-6">
          <div className="bg-white rounded-xl border border-border-subtle p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{combat.rewards.relic!.icon}</span>
              <div><h3 className="font-semibold text-ink">{combat.rewards.relic!.name}</h3><span className="text-xs text-ink-muted">{RARITY_NAMES[combat.rewards.relic!.rarity] || combat.rewards.relic!.rarity}</span></div>
            </div>
            <p className="text-sm text-ink-muted mb-3">{combat.rewards.relic!.description}</p>
            <button onClick={completeOption} className="w-full px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">收取遗物</button>
          </div>
        </div>
      )}

      {!hasCards && !hasAttribute && !hasRelic && (
        <button onClick={completeOption} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">继续</button>
      )}

      {(hasCards || hasAttribute || hasRelic) && (
        <button
          onClick={skipRewardWithGold}
          className="px-6 py-2.5 bg-gray-100 text-ink-muted rounded-lg font-medium hover:bg-gray-200 hover:text-ink transition-colors"
        >
          跳过奖励 → 💰+10
        </button>
      )}
    </div>
  );
};

// ==========================================
// 商店
// ==========================================
const ShopPhase: React.FC = () => {
  const shop = useSimulationStore((s) => s.shop);
  const gold = useSimulationStore((s) => s.gold);
  const deck = useSimulationStore((s) => s.deck);
  const cardRemovalCount = useSimulationStore((s) => s.cardRemovalCount);
  const buyShopItem = useSimulationStore((s) => s.buyShopItem);
  const removeCardFromDeck = useSimulationStore((s) => s.removeCardFromDeck);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const refreshShop = useSimulationStore((s) => s.refreshShop);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  if (!shop) return null;

  const removalCost = 50 + cardRemovalCount * 50;
  const canRemoveCard = !shop.cardRemovalUsed && gold >= removalCost && deck.length > 0;
  const refreshCost = shop.refreshCost + shop.refreshCount * 15;
  const canRefresh = gold >= refreshCost;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">🏪 商店</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm">💰 {gold} 金币</span>
          <button
            onClick={refreshShop}
            disabled={!canRefresh}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              canRefresh
                ? 'bg-brand text-white hover:bg-brand/90 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>🔄</span>
            <span>刷新</span>
            <span className="text-xs opacity-90">💰{refreshCost}</span>
          </button>
        </div>
      </div>
      {shop.refreshCount > 0 && (
        <div className="mb-3 text-xs text-ink-muted text-center">
          已刷新 {shop.refreshCount} 次 · 下次刷新费用递增
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {shop.items.map((item, idx) => {
          const rarity = item.card?.rarity || item.relic?.rarity;
          const rarityColors: Record<string, string> = {
            common: 'border-gray-300 bg-gray-50/50',
            uncommon: 'border-green-400 bg-green-50/50',
            rare: 'border-blue-400 bg-blue-50/50',
            legendary: 'border-yellow-400 bg-yellow-50/50',
            boss: 'border-purple-400 bg-purple-50/50',
          };
          const rarityLabels: Record<string, string> = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            legendary: '传说',
            boss: 'Boss',
          };
          const borderClass = rarityColors[rarity || 'common'] || rarityColors.common;

          return (
            <div key={idx} className={`p-4 rounded-lg border-2 ${item.isPurchased ? 'opacity-50 bg-gray-100 !border-gray-200' : borderClass}`}>
              <div className="flex items-center gap-2 mb-2">
                {item.card && <span className="text-2xl">{item.card.icon}</span>}
                {item.relic && <span className="text-2xl">{item.relic.icon}</span>}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.card?.name || item.relic?.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' : rarity === 'rare' ? 'bg-blue-200 text-blue-800' : rarity === 'uncommon' ? 'bg-green-200 text-green-800' : rarity === 'boss' ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-600'}`}>
                      {rarityLabels[rarity || 'common']}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted">{item.card?.description || item.relic?.description}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle/30">
                <span className="text-sm font-bold text-brand">💰 {item.price}</span>
                {!item.isPurchased ? (
                  <button onClick={() => buyShopItem(idx)} disabled={gold < item.price} className={`px-3 py-1 rounded text-sm ${gold >= item.price ? 'bg-brand text-white hover:bg-brand/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>购买</button>
                ) : <span className="text-xs text-gray-400">已购买</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 卡牌删除服务 */}
      <div className="mb-6 p-4 rounded-xl border border-border-subtle bg-bg-elevated">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗑️</span>
            <h3 className="font-semibold text-ink">删除卡牌</h3>
          </div>
          <span className="text-sm font-bold text-brand">💰 {removalCost}</span>
        </div>
        <p className="text-xs text-ink-muted mb-3">从卡组中永久移除一张卡牌（每次商店限用1次）</p>
        {shop.cardRemovalUsed ? (
          <div className="text-sm text-ink-muted text-center py-2 bg-gray-50 rounded-lg">已使用</div>
        ) : deck.length === 0 ? (
          <div className="text-sm text-ink-muted text-center py-2 bg-gray-50 rounded-lg">卡组为空</div>
        ) : (
          <button
            onClick={() => setShowRemoveModal(true)}
            disabled={!canRemoveCard}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
              canRemoveCard
                ? 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canRemoveCard ? '选择要删除的卡牌' : gold < removalCost ? '金币不足' : '无法删除'}
          </button>
        )}
      </div>

      <div className="text-center">
        <button onClick={completeOption} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">离开商店</button>
      </div>

      {/* 删除卡牌弹窗 */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRemoveModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">🗑️ 选择要删除的卡牌</h3>
              <button onClick={() => setShowRemoveModal(false)} className="text-ink-muted hover:text-ink text-xl">&times;</button>
            </div>
            <p className="text-sm text-ink-muted mb-2">删除费用：<span className="font-semibold text-danger">💰 {removalCost}</span></p>
            <p className="text-xs text-ink-muted mb-4">点击卡牌删除，删除后将从卡组中永久移除</p>
            {deck.length === 0 ? (
              <p className="text-ink-muted text-center py-8">卡组为空</p>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {deck.map((card) => (
                  <div key={card.id} className="relative group">
                    <div
                      onClick={() => {
                        removeCardFromDeck(card.id);
                        setShowRemoveModal(false);
                      }}
                      className="cursor-pointer"
                    >
                      <CardDetail
                        card={card}
                        width={140}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-danger/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-sm font-medium text-danger bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">点击删除</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 休息
// ==========================================
const RestPhase: React.FC = () => {
  const rest = useSimulationStore((s) => s.rest);
  const combat = useSimulationStore((s) => s.combat);
  const age = useSimulationStore((s) => s.age);
  const remainingLife = useSimulationStore((s) => s.remainingLife);
  const gold = useSimulationStore((s) => s.gold);
  const attributes = useSimulationStore((s) => s.attributes);

  const hpPercent = (combat.player.currentHealth / combat.player.maxHealth) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <span className="text-5xl mb-4">🛏️</span>
      <h2 className="text-xl font-bold text-ink mb-2">休息一下</h2>
      <p className="text-ink-muted text-sm mb-6 text-center max-w-md">休息可以恢复30%的生命值</p>

      {/* 玩家状态面板 */}
      <div className="w-full max-w-sm bg-white rounded-xl border border-border-subtle p-5 mb-6 shadow-sm">
        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>当前状态</span>
        </h3>

        {/* 生命值 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">❤️</span>
              <span className="text-xs text-ink-muted">生命值</span>
            </div>
            <span className="text-xs font-mono font-semibold text-success">
              {combat.player.currentHealth}/{combat.player.maxHealth}
            </span>
          </div>
          <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${hpPercent}%`,
                background: 'linear-gradient(to right, #16a34a, #4ade80)',
              }}
            />
          </div>
          <p className="text-[10px] text-ink-faint mt-1">休息后恢复至 {Math.min(combat.player.maxHealth, combat.player.currentHealth + Math.floor(combat.player.maxHealth * 0.3))}</p>
        </div>

        {/* 基本信息 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-bg-subtle border border-border-subtle">
            <div className="text-[10px] text-ink-muted mb-0.5">年龄</div>
            <div className="text-sm font-bold text-ink">{age}岁</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-bg-subtle border border-border-subtle">
            <div className="text-[10px] text-ink-muted mb-0.5">寿命</div>
            <div className="text-sm font-bold text-danger">{Math.round(remainingLife)}年</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-bg-subtle border border-border-subtle">
            <div className="text-[10px] text-ink-muted mb-0.5">金币</div>
            <div className="text-sm font-bold text-gold">💰 {gold}</div>
          </div>
        </div>

        {/* 属性概览 */}
        <div className="border-t border-border-subtle pt-3">
          <div className="text-xs text-ink-muted mb-2">属性概览</div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
              <div key={attr} className="text-center" title={`${ATTRIBUTE_NAMES[attr]}: ${attributes[attr]}`}>
                <span className="text-base">{ATTRIBUTE_ICONS[attr]}</span>
                <div className="text-[10px] font-mono text-ink">{attributes[attr]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={rest} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">休息恢复</button>
    </div>
  );
};

// ==========================================
// 修仙突破面板组件
// ==========================================
interface CultivationBreakthroughPanelProps {
  cultivation: {
    realm: string;
    maxLifespan: number;
    tribulationThreshold: number;
    realmBonus: Partial<Record<string, number>>;
  };
  age: number;
}

const CULTIVATION_REALM_ORDER = ['mortal', 'qi_refining', 'foundation', 'golden_core', 'nascent', 'spirit', 'void', 'integration', 'mahayana', 'tribulation'];

const CultivationBreakthroughPanel: React.FC<CultivationBreakthroughPanelProps> = ({ cultivation, age }) => {
  const attemptBreakthrough = useSimulationStore((s) => s.attemptBreakthrough);
  const attributes = useSimulationStore((s) => s.attributes);
  const { addToast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);

  const currentRealmIndex = CULTIVATION_REALM_ORDER.indexOf(cultivation.realm);
  const nextRealm = currentRealmIndex < CULTIVATION_REALM_ORDER.length - 1 ? CULTIVATION_REALM_ORDER[currentRealmIndex + 1] : null;
  const totalAttributes = Object.values(attributes).reduce((a, b) => a + b, 0);
  const requiredAttributes = 100 * (currentRealmIndex + 1);
  const canBreakthrough = totalAttributes >= requiredAttributes && age > 110;

  const realmNames: Record<string, string> = {
    mortal: '凡人',
    qi_refining: '炼气',
    foundation: '筑基',
    golden_core: '金丹',
    nascent: '元婴',
    spirit: '化神',
    void: '炼虚',
    integration: '合体',
    mahayana: '大乘',
    tribulation: '渡劫',
  };

  const handleBreakthrough = () => {
    if (!canBreakthrough) return;
    setIsAnimating(true);

    setTimeout(() => {
      const result = attemptBreakthrough();
      if (result?.success) {
        addToast({ type: 'success', message: result.message });
      } else {
        addToast({ type: 'error', message: result?.message || '突破失败' });
      }
      setIsAnimating(false);
    }, 1000);
  };

  if (!nextRealm) {
    return (
      <div className="text-sm text-ink-muted text-center py-2">
        已达最高境界
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-ink-muted">
        <div className="flex justify-between mb-1">
          <span>当前境界</span>
          <span className="text-brand font-medium">{realmNames[cultivation.realm] || cultivation.realm}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>下一境界</span>
          <span className="text-gold font-medium">{realmNames[nextRealm] || nextRealm}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>寿元</span>
          <span>{cultivation.maxLifespan}年</span>
        </div>
        <div className="flex justify-between">
          <span>属性需求</span>
          <span className={canBreakthrough ? 'text-green-600' : 'text-red-500'}>
            {totalAttributes} / {requiredAttributes}
          </span>
        </div>
      </div>

      {isAnimating && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
          <span className="ml-2 text-sm text-brand">突破中...</span>
        </div>
      )}

      <button
        onClick={handleBreakthrough}
        disabled={!canBreakthrough || isAnimating}
        className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
          canBreakthrough && !isAnimating
            ? 'bg-gradient-to-r from-brand to-purple-600 text-white hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {canBreakthrough ? '尝试突破' : age <= 110 ? '需110岁后突破' : '属性不足'}
      </button>

      {!canBreakthrough && age > 110 && (
        <p className="text-xs text-ink-muted text-center">
          还需 {requiredAttributes - totalAttributes} 点总属性
        </p>
      )}
    </div>
  );
};

// ==========================================
// 主页面组件
// ==========================================
const SimulationPage: React.FC = () => {
  const phase = useSimulationStore((s) => s.phase);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const age = useSimulationStore((s) => s.age);
  const remainingLife = useSimulationStore((s) => s.remainingLife);
  const attributes = useSimulationStore((s) => s.attributes);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const deck = useSimulationStore((s) => s.deck);
  const relics = useSimulationStore((s) => s.relics);
  const gold = useSimulationStore((s) => s.gold);
  const cultivation = useSimulationStore((s) => s.cultivation);
  const { addToast } = useToast();
  const resetGame = useSimulationStore((s) => s.resetGame);
  const loadGame = useSimulationStore((s) => s.loadGame);
  const hasSavedGame = useSimulationStore((s) => s.hasSavedGame);
  const deleteSave = useSimulationStore((s) => s.deleteSave);
  const saveGame = useSimulationStore((s) => s.saveGame);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const availableEvents = useSimulationStore(useShallow((s) => s.getAvailableEvents()));
  const pendingChoice = useSimulationStore((s) => s.pendingChoice);
  const resolveChoice = useSimulationStore((s) => s.resolveChoice);
  const [hasSave, setHasSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showBondPanel, setShowBondPanel] = useState(false);

  const bondNPCs = useBondStore((s) => s.npcs);
  const bondActiveGroups = useBondStore((s) => s.activeBondGroups);
  const bondActiveTiers = useBondStore((s) => s.activeBondTiers);

  useEffect(() => {
    const initGame = async () => {
      const saved = await hasSavedGame();
      setHasSave(saved);
      setIsLoading(false);
    };
    initGame();
  }, [hasSavedGame]);

  useEffect(() => {
    if (isLoading || gameLoaded) return;
    if (!hasSave) resetGame();
  }, [isLoading, hasSave, gameLoaded, resetGame]);

  useEffect(() => {
    if (phase === 'ended' && !isLoading) {
      deleteSave();
    }
  }, [phase, isLoading, deleteSave]);

  // 防止卡死：当 phase 是 event 但没有可用事件时，自动跳过
  useEffect(() => {
    if (phase === 'event' && availableEvents.length === 0) {
      completeOption();
    }
  }, [phase, availableEvents, completeOption]);

  // 禁用复制：右键菜单 + 键盘快捷键
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 拦截 Ctrl+C/X/A, Cmd+C/X/A, Ctrl+Insert, Shift+Insert
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'Insert')) {
        e.preventDefault();
        return false;
      }
      if (e.shiftKey && e.key === 'Insert') {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  const handleContinueGame = async () => {
    await loadGame();
    setGameLoaded(true);
  };

  const handleSave = async () => {
    await saveGame();
    addToast({ type: 'success', message: '💾 游戏已保存，下次进入可继续' });
  };

  const currentEvent = phase === 'event' && availableEvents.length > 0 ? availableEvents[0] : null;

  return (
    <div className="flex h-full simulation-page">
      <div className="flex-1 overflow-y-auto">
        {phase === 'setup' && <ModeSelectPhase />}
        {phase === 'allocating' && <AllocatingPhase />}
        {phase === 'year_view' && <YearViewPhase />}
        {phase === 'event' && currentEvent && <EventPhase event={currentEvent} />}
        {phase === 'event_relic_selection' && <EventRelicSelectionPhase />}
        {phase === 'combat' && <CombatPhaseView />}
        {phase === 'reward' && <RewardPhase />}
        {phase === 'shop' && <ShopPhase />}
        {phase === 'rest' && <RestPhase />}
        {phase === 'ended' && (
          <LifeSummary onRestart={resetGame} />
        )}
      </div>

      {phase !== 'ended' && (
        <div className="w-72 border-l border-border-subtle bg-gray-50 overflow-y-auto p-4 hidden lg:block">
          {phase === 'setup' ? (
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <h3 className="font-semibold text-ink mb-3">💾 存档</h3>
              {hasSave ? (
                <button
                  onClick={handleContinueGame}
                  className="w-full px-4 py-3 bg-gold text-white rounded-lg font-medium hover:bg-gold/90 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>💾</span>
                  <span>继续上次游戏</span>
                </button>
              ) : (
                <p className="text-sm text-ink-muted text-center">暂无存档</p>
              )}
            </div>
          ) : (
            <>
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <h3 className="font-semibold text-ink mb-3">📋 人生状态</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-muted">出生年</span><span className="font-medium">{birthYear}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">年龄</span><span className="font-medium">{age}岁</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">寿命上限</span><span className="font-medium">{Math.round(remainingLife)}年</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">金币</span><span className="font-medium">💰 {gold}</span></div>
                {cultivation && <div className="flex justify-between"><span className="text-ink-muted">境界</span><span className="font-medium text-brand">{CULTIVATION_REALM_NAMES[cultivation.realm] || cultivation.realm}</span></div>}
              </div>
            </div>

            {/* 羁绊模块入口 */}
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink">🔗 羁绊</h3>
                <button
                  onClick={() => setShowBondPanel(true)}
                  className="text-xs text-brand hover:text-brand-hover transition-colors"
                >
                  查看详情 →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-ink">{bondNPCs.length}</div>
                  <div className="text-[10px] text-ink-faint">NPC</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-brand">{bondActiveGroups.length}</div>
                  <div className="text-[10px] text-ink-faint">羁绊</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gold">{Object.values(bondActiveTiers).reduce((a: number, b: number) => a + b, 0)}</div>
                  <div className="text-[10px] text-ink-faint">等级</div>
                </div>
              </div>
              {bondNPCs.filter(n => n.isActive).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {bondNPCs.filter(n => n.isActive).slice(0, 4).map((npc) => {
                    const identity = IDENTITY_MAP[npc.identityId];
                    return (
                      <span
                        key={npc.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gold-light border border-gold/20 text-gold"
                        title={`${npc.name} - ${identity?.name || '未知身份'}`}
                      >
                        {npc.avatar} {npc.name}
                      </span>
                    );
                  })}
                  {bondNPCs.filter(n => n.isActive).length > 4 && (
                    <span className="text-[10px] text-ink-faint">
                      +{bondNPCs.filter(n => n.isActive).length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 修仙突破面板 */}
            {cultivation && cultivation.realm !== 'tribulation' && (
              <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
                <h3 className="font-semibold text-ink mb-3">☯️ 境界突破</h3>
                <CultivationBreakthroughPanel cultivation={cultivation} age={age} />
              </div>
            )}
            <button
              onClick={handleSave}
              className="w-full mb-4 px-4 py-2.5 bg-bg-elevated border border-border-subtle text-ink-muted font-medium text-sm rounded-xl hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>保存游戏</span>
            </button>
            </>
          )}
          {phase !== 'setup' && (
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3">📊 属性</h3>
            <div className="space-y-2.5">
              {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
                <Tooltip key={attr} content={<AttributeTooltipContent attr={attr} />} position="left">
                  <div className="cursor-help">
                    <AttributeBar attr={attr} value={attributes[attr]} />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
          )}
          {phase !== 'setup' && (() => {
            const allBonuses = (Object.keys(attributes) as (keyof PlayerAttributes)[]).flatMap((attr) =>
              getAttributeTierInfo(attr, attributes[attr]).bonuses.map((b) => ({ ...b, attrName: ATTRIBUTE_NAMES[attr] }))
            );
            return allBonuses.length > 0 ? (
              <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
                <h3 className="font-semibold text-ink mb-3">🌟 阶层效果</h3>
                <div className="space-y-1.5">
                  {allBonuses.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className="text-ink-faint w-8 flex-shrink-0">{b.attrName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium flex-shrink-0">{b.name}</span>
                      <span className="text-ink-muted truncate">{b.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          {phase !== 'setup' && (
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3">🃏 卡组 ({deck.length})</h3>
            <div 
              className="grid grid-cols-3 gap-1 cursor-pointer"
              onClick={() => setShowDeckModal(true)}
            >
              {deck.slice(0, 9).map((card) => (
                <div key={card.id} className="text-center p-1 bg-gray-50 rounded hover:bg-gray-100 transition-colors" title={card.name}>
                  <span className="text-lg">{card.icon}</span>
                </div>
              ))}
            </div>
            {deck.length > 9 && (
              <p className="text-xs text-ink-muted text-center mt-2">还有 {deck.length - 9} 张...</p>
            )}
            <p className="text-[10px] text-ink-faint text-center mt-1">点击查看详情</p>
          </div>
          )}
          {relics.length > 0 && phase !== 'setup' && (
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <h3 className="font-semibold text-ink mb-3">🏺 遗物 ({relics.length})</h3>
              <div className="grid grid-cols-3 gap-1">
                {relics.slice(0, 9).map((relic) => (
                  <Tooltip
                    key={relic.id}
                    content={
                      <div className="px-3 py-2 max-w-[220px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{relic.icon}</span>
                          <span className="font-semibold text-amber-900">{relic.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">{RARITY_NAMES[relic.rarity] || relic.rarity}</span>
                        </div>
                        <div className="text-amber-700 text-[11px] leading-relaxed mb-1.5">{relic.description}</div>
                        <div className="space-y-0.5">
                          {relic.effects.map((effect, i) => (
                            <div key={i} className="text-[11px] text-green-700">• {formatRelicEffect(effect)}</div>
                          ))}
                        </div>
                      </div>
                    }
                    position="top"
                  >
                    <div className="text-center p-1 bg-gray-50 rounded cursor-default hover:bg-amber-50 transition-colors">
                      <span className="text-lg">{relic.icon}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
          {hiddenTags.length > 0 && phase !== 'setup' && (
          <div className="bg-white rounded-xl border border-border-subtle p-4">
            <h3 className="font-semibold text-ink mb-3">🏷️ 标签</h3>
            <div className="flex flex-wrap gap-1">
              {hiddenTags.map((tag) => {
                const tagData = HIDDEN_TAGS.find((t) => t.id === tag);
                return (
                  <Tooltip
                    key={tag}
                    content={
                      <div className="px-3 py-2 max-w-[200px]">
                        <div className="font-semibold text-amber-900 mb-1">{TAG_NAMES[tag] || tag}</div>
                        <div className="text-amber-700 text-[11px] leading-relaxed">{tagData?.description || ''}</div>
                      </div>
                    }
                    position="top"
                  >
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs cursor-default hover:bg-amber-200 transition-colors">{TAG_NAMES[tag] || tag}</span>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
        </div>
      )}

      {/* 卡组详情弹窗 */}
      {showDeckModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeckModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">🃏 卡组详情 ({deck.length}张)</h3>
              <button onClick={() => setShowDeckModal(false)} className="text-ink-muted hover:text-ink text-xl">&times;</button>
            </div>
            {deck.length === 0 ? (
              <p className="text-ink-muted text-center py-8">卡组为空</p>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {deck.map((card) => (
                  <CardDetail
                    key={card.id}
                    card={card}
                    width={140}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 羁绊面板弹窗 */}
      {showBondPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBondPanel(false)}>
          <div className="bg-bg-elevated rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border-subtle" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="text-lg font-bold text-ink">🔗 羁绊系统</h3>
              <button onClick={() => setShowBondPanel(false)} className="text-ink-muted hover:text-ink text-xl">&times;</button>
            </div>
            <div className="h-[70vh] overflow-hidden">
              <BondPanel />
            </div>
          </div>
        </div>
      )}

      {/* 命运抉择弹窗 */}
      {pendingChoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-elevated rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border-subtle">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">💫</div>
              <h3 className="text-xl font-bold text-ink mb-2">{pendingChoice.cardName}</h3>
              <p className="text-sm text-ink-muted">在人生的十字路口，做出你的选择</p>
            </div>
            <div className="space-y-3">
              {pendingChoice.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => resolveChoice(option.id)}
                  className="w-full p-4 rounded-xl border border-border-subtle bg-bg-secondary hover:bg-bg-primary hover:border-brand transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-ink group-hover:text-brand transition-colors">{option.label}</div>
                      <div className="text-xs text-ink-muted">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
