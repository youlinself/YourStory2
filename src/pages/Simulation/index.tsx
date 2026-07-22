import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useSimulationStore, { getEffectDisplayValue, MAX_HAND_SIZE, BASE_DRAW_COUNT } from '../../stores/simulationStore';

import {
  ERAS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_COLORS,
  ATTRIBUTE_DESCRIPTIONS,
  TAG_NAMES,
  CARD_TYPE_NAMES,
  CULTIVATION_REALM_NAMES,
  RARITY_NAMES,
} from '../../data/simulationData';
import Tooltip from '../../components/common/Tooltip';
import FloatingDamage from '../../components/ui/FloatingDamage';
import BuffDebuffBadge from '../../components/ui/BuffDebuffBadge';
import type { BirthYear, PlayerAttributes, GameEvent, AttributeThresholdBonus, LifeCard, CardEffect, StatusEffect } from '../../types/simulation';

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
};

const formatEffectLabel = (type: string, display: number): string => {
  const label = EFFECT_LABELS[type] || type;
  if (type === 'draw') return `抽${display}张`;
  if (type === 'heal') return `回复${display}`;
  if (type === 'cure') return '净化';
  if (type === 'stealth') return '潜行';
  if (type === 'regen') return `回复${display}/回合`;
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

const AttributeBar: React.FC<{ attr: keyof PlayerAttributes; value: number; showLabel?: boolean }> = ({ attr, value, showLabel = true }) => (
  <div className="flex items-center gap-2">
    <span className="text-base w-5 text-center">{ATTRIBUTE_ICONS[attr] || '•'}</span>
    {showLabel && <span className="text-xs text-ink-muted w-8">{ATTRIBUTE_NAMES[attr] || attr}</span>}
    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, backgroundColor: ATTRIBUTE_COLORS[attr] || '#6B7280' }} />
    </div>
    <span className="text-xs font-mono text-ink w-7 text-right">{Math.round(value)}</span>
  </div>
);

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
  const selectedEra = ERAS.find((e) => e.year === selectedYear);

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
// 属性分配
// ==========================================
const AttributeTooltipContent: React.FC<{ attr: keyof PlayerAttributes }> = ({ attr }) => (
  <div className="max-w-[220px]">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-sm">{ATTRIBUTE_ICONS[attr]}</span>
      <span className="font-semibold text-white text-sm">{ATTRIBUTE_NAMES[attr]}</span>
    </div>
    <p className="text-[11px] leading-relaxed text-white/80 whitespace-normal">
      {ATTRIBUTE_DESCRIPTIONS[attr]}
    </p>
  </div>
);

const AllocatingPhase: React.FC = () => {
  const attributes = useSimulationStore((s) => s.attributes);
  const baseAttributes = useSimulationStore((s) => s.baseAttributes);
  const remainingPoints = useSimulationStore((s) => s.remainingAttributePoints);
  const allocateAttribute = useSimulationStore((s) => s.allocateAttribute);
  const confirmAllocation = useSimulationStore((s) => s.confirmAllocation);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-8">
      <h2 className="text-xl font-semibold text-ink mb-2">分配属性点</h2>
      <p className="text-ink-muted text-sm mb-6">剩余点数：<span className="font-bold text-brand">{remainingPoints}</span></p>
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 mb-8">
        {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
          <Tooltip key={attr} content={<AttributeTooltipContent attr={attr} />} position="top">
            <div className="bg-white rounded-lg border border-border-subtle p-4 cursor-help transition-all hover:border-brand/50 hover:shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{ATTRIBUTE_ICONS[attr]}</span>
                  <span className="text-sm font-medium text-ink">{ATTRIBUTE_NAMES[attr]}</span>
                </div>
                <span className="w-10 text-center font-mono font-bold text-brand">{attributes[attr]}</span>
              </div>
              <input
                type="range"
                min={baseAttributes[attr]}
                max={Math.min(99, attributes[attr] + remainingPoints)}
                value={attributes[attr]}
                onChange={(e) => allocateAttribute(attr, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-[10px] text-ink-muted mt-1">
                <span>{baseAttributes[attr]}</span>
                <span>{Math.min(99, attributes[attr] + remainingPoints)}</span>
              </div>
            </div>
          </Tooltip>
        ))}
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

  const getDisplayText = () => {
    let text = event.baseText;
    if (event.skinRule) {
      const skinText = event.skinRule(attributes, choiceHistory, hiddenTags);
      text = text.replace(/\{[^}]+\}/g, skinText);
    }
    return text;
  };

  const displayText = getDisplayText();

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm max-w-lg mx-auto">
      <h3 className="text-lg font-semibold text-ink mb-3">{event.title}</h3>
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
          <button className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle text-ink-muted hover:border-brand hover:text-brand transition-colors">
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
                         actualDamage = intent.damage;
                         const str = enemy.statusEffects.find((x) => x.type === 'strength');
                         if (str) actualDamage += str.value;
                         const wk = enemy.statusEffects.find((x) => x.type === 'weak');
                         if (wk) actualDamage = Math.floor(actualDamage * 0.75);
                         const shield = enemy.mechanics?.includes('shield') ? 0.75 : 1;
                         actualDamage = Math.floor(actualDamage * shield);
                       }
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
                                     {baseDamage !== actualDamage && (
                                       <span className="text-[9px] text-ink-faint ml-1">({baseDamage}
                                         {enemy.statusEffects.find((x) => x.type === 'strength') && `+${enemy.statusEffects.find((x) => x.type === 'strength')!.value}`}
                                         {enemy.statusEffects.find((x) => x.type === 'weak') && '×0.75'}
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
                  <div className="text-sm font-bold text-ink mb-0.5">🗑️ 请选择要弃掉的卡牌</div>
                  <div className="text-[10px] text-ink-muted">
                    已选择弃掉 {combat.selectedForDiscard.length} 张 · 将保留 {combat.player.hand.length - combat.selectedForDiscard.length} 张
                  </div>
                </div>
                <button
                  onClick={confirmDiscard}
                  className="px-5 py-2 bg-brand text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md hover:bg-brand-hover transition-all"
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
                    <div key={card.id} className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px]">
                      <span className="text-sm">{card.icon}</span>
                      <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                      <span className="text-ink-faint">{card.cost}⚡</span>
                    </div>
                  ))}
                  {showDeckPanel === 'discard' && combat.player.discardPile.map((card) => (
                    <div key={card.id} className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px]">
                      <span className="text-sm">{card.icon}</span>
                      <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                      <span className="text-ink-faint">{card.cost}⚡</span>
                    </div>
                  ))}
                  {showDeckPanel === 'exhaust' && combat.player.exhaustPile.map((card) => (
                    <div key={card.id} className="flex items-center gap-2 px-2 py-1 rounded bg-bg-subtle text-[10px]">
                      <span className="text-sm">{card.icon}</span>
                      <span className="font-medium text-ink flex-1 truncate">{card.name}</span>
                      <span className="text-ink-faint">{card.cost}⚡</span>
                    </div>
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
          </div>

          {/* 燃烧生命 */}
          {combat.availableBonuses.length > 0 && (
            <div className="bg-bg-elevated rounded-xl p-4 border border-border-subtle">
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">🔥 燃烧生命</h3>
              <p className="text-[10px] text-ink-faint mb-3">寿命上限: {Math.round(remainingLife)}年</p>
              <div className="flex flex-col gap-2">
                {combat.availableBonuses.map((bonus) => {
                  const canActivate = bonus.lifeCost < remainingLife;
                  return (
                    <button
                      key={bonus.id}
                      onClick={() => activateBonus(bonus.id)}
                      disabled={!canActivate}
                      className={`p-2.5 rounded-lg text-left transition-all ${canActivate ? 'hover:scale-[1.02] hover:shadow-sm' : 'opacity-40 cursor-not-allowed'}`}
                      style={{
                        background: canActivate ? 'var(--color-brand-surface)' : 'var(--color-bg-subtle)',
                        border: `1px solid ${canActivate ? 'rgba(218,119,86,0.2)' : 'var(--color-border-subtle)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-ink">{bonus.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-bg text-danger">-{bonus.lifeCost}年</span>
                      </div>
                      <p className="text-[10px] text-ink-muted">{bonus.description}</p>
                    </button>
                  );
                })}
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
    </div>
  );
};

// ==========================================
// 战斗奖励/奇遇奖励
// ==========================================
const RewardPhase: React.FC = () => {
  const combat = useSimulationStore((s) => s.combat);
  const selectCardReward = useSimulationStore((s) => s.selectCardReward);
  const selectAttributeReward = useSimulationStore((s) => s.selectAttributeReward);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const [tab, setTab] = useState<'card' | 'attribute' | 'relic'>('card');

  const hasCards = combat.rewards.cards.length > 0;
  const hasAttribute = !!combat.rewards.attribute;
  const hasRelic = !!combat.rewards.relic;

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
    </div>
  );
};

// ==========================================
// 商店
// ==========================================
const ShopPhase: React.FC = () => {
  const shop = useSimulationStore((s) => s.shop);
  const gold = useSimulationStore((s) => s.gold);
  const buyShopItem = useSimulationStore((s) => s.buyShopItem);
  const completeOption = useSimulationStore((s) => s.completeOption);
  if (!shop) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">🏪 商店</h2>
        <span className="text-sm">💰 {gold} 金币</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {shop.items.map((item, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${item.isPurchased ? 'opacity-50 bg-gray-50' : 'border-border-subtle'}`}>
            <div className="flex items-center gap-2 mb-2">
              {item.card && <span className="text-2xl">{item.card.icon}</span>}
              {item.relic && <span className="text-2xl">{item.relic.icon}</span>}
              <div><div className="font-medium text-sm">{item.card?.name || item.relic?.name}</div><div className="text-xs text-ink-muted">{item.card?.description || item.relic?.description}</div></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand">💰 {item.price}</span>
              {!item.isPurchased ? (
                <button onClick={() => buyShopItem(idx)} disabled={gold < item.price} className={`px-3 py-1 rounded text-sm ${gold >= item.price ? 'bg-brand text-white hover:bg-brand/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>购买</button>
              ) : <span className="text-xs text-gray-400">已购买</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button onClick={completeOption} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">离开商店</button>
      </div>
    </div>
  );
};

// ==========================================
// 休息
// ==========================================
const RestPhase: React.FC = () => {
  const rest = useSimulationStore((s) => s.rest);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <span className="text-5xl mb-4">🛏️</span>
      <h2 className="text-xl font-bold text-ink mb-2">休息一下</h2>
      <p className="text-ink-muted text-sm mb-6 text-center max-w-md">休息可以恢复30%的生命值，但会消耗1年寿命</p>
      <button onClick={rest} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">休息恢复</button>
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
  const resetGame = useSimulationStore((s) => s.resetGame);
  const completeOption = useSimulationStore((s) => s.completeOption);
  const availableEvents = useSimulationStore(useShallow((s) => s.getAvailableEvents()));

  useEffect(() => { resetGame(); }, [resetGame]);

  // 防止卡死：当 phase 是 event 但没有可用事件时，自动跳过
  useEffect(() => {
    if (phase === 'event' && availableEvents.length === 0) {
      completeOption();
    }
  }, [phase, availableEvents, completeOption]);

  const currentEvent = phase === 'event' && availableEvents.length > 0 ? availableEvents[0] : null;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {phase === 'setup' && <ModeSelectPhase />}
        {phase === 'allocating' && <AllocatingPhase />}
        {phase === 'year_view' && <YearViewPhase />}
        {phase === 'event' && currentEvent && <EventPhase event={currentEvent} />}
        {phase === 'combat' && <CombatPhaseView />}
        {phase === 'reward' && <RewardPhase />}
        {phase === 'shop' && <ShopPhase />}
        {phase === 'rest' && <RestPhase />}
        {phase === 'ended' && (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-ink mb-2">🕯️ 游戏结束</h2>
            <p className="text-ink-muted mb-4">你活了 {age} 岁</p>
            <p className="text-sm text-ink-muted mb-6">卡牌数: {deck.length} | 遗物数: {relics.length}</p>
            {cultivation && <p className="text-sm text-brand">境界: {CULTIVATION_REALM_NAMES[cultivation.realm] || cultivation.realm}</p>}
          </div>
        )}
      </div>

      {phase !== 'setup' && phase !== 'ended' && (
        <div className="w-72 border-l border-border-subtle bg-gray-50 overflow-y-auto p-4 hidden lg:block">
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
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3">🃏 卡组 ({deck.length})</h3>
            <div className="grid grid-cols-3 gap-1">
              {deck.slice(0, 9).map((card) => (
                <div key={card.id} className="text-center p-1 bg-gray-50 rounded" title={card.name}><span className="text-lg">{card.icon}</span></div>
              ))}
            </div>
          </div>
          {relics.length > 0 && (
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <h3 className="font-semibold text-ink mb-3">🏺 遗物 ({relics.length})</h3>
              <div className="grid grid-cols-3 gap-1">
                {relics.slice(0, 9).map((relic) => (
                  <div key={relic.id} className="text-center p-1 bg-gray-50 rounded" title={relic.name}><span className="text-lg">{relic.icon}</span>
                </div>))}
              </div>
            </div>
          )}
          {hiddenTags.length > 0 && (
            <div className="bg-white rounded-xl border border-border-subtle p-4">
              <h3 className="font-semibold text-ink mb-3">🏷️ 标签</h3>
              <div className="flex flex-wrap gap-1">
                {hiddenTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">{TAG_NAMES[tag] || tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
