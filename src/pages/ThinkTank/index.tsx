import React, { useState, useMemo } from 'react';
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
  STARTER_DECK,
  CARD_TYPE_NAMES,
  RARITY_NAMES,
  ATTRIBUTE_NAMES,
} from '../../data/simulationData';
import type { LifeCard, CardEffect } from '../../types/simulation';
import SimBattle from './SimBattle';

type ThinkTankTab = 'cards' | 'battle';

const EFFECT_LABELS: Record<string, string> = {
  damage: '伤害',
  block: '格挡',
  heal: '回复',
  draw: '抽牌',
  gain_energy: '精力',
  gain_max_energy: '最大精力',
  gain_attribute: '属性提升',
  lose_attribute: '属性降低',
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

interface StyleSet {
  bg: string;
  text: string;
  border: string;
}

const RARITY_COLORS: Record<string, StyleSet> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  uncommon: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  legendary: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

const CARD_TYPE_COLORS: Record<string, StyleSet> = {
  attack: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  skill: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  power: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  curse: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300' },
};

interface CardCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  cards: LifeCard[];
}

const ThinkTankPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ThinkTankTab>('cards');

  if (activeTab === 'battle') {
    return <SimBattle onBack={() => setActiveTab('cards')} />;
  }

  return <CardsLibrary onSwitchToBattle={() => setActiveTab('battle')} />;
};

const CardDetailModal: React.FC<{ card: LifeCard; onClose: () => void }> = ({ card, onClose }) => {
  const rarityStyle = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
  const typeStyle = CARD_TYPE_COLORS[card.type] || CARD_TYPE_COLORS.skill;

  const formatEffect = (effect: CardEffect) => {
    const label = EFFECT_LABELS[effect.type] || effect.type;
    const value = effect.value;
    const duration = effect.duration ? ` (持续${effect.duration}回合)` : '';
    const attr = effect.attribute ? ` [${ATTRIBUTE_NAMES[effect.attribute] || effect.attribute}]` : '';

    switch (effect.type) {
      case 'damage':
        return `造成 ${value} 点伤害${duration}`;
      case 'block':
        return `获得 ${value} 点格挡${duration}`;
      case 'heal':
        return `回复 ${value} 点生命${duration}`;
      case 'draw':
        return `抽 ${value} 张牌`;
      case 'gain_energy':
        return `获得 ${value} 点精力`;
      case 'gain_max_energy':
        return `最大精力 +${value}`;
      case 'gain_attribute':
        return `${attr} +${value}`;
      case 'lose_attribute':
        return `${attr} -${value}${duration ? ` (持续${duration}回合)` : ''}`;
      case 'vulnerable':
        return `使目标脆弱 ${value} 层${duration}`;
      case 'weak':
        return `使目标虚弱 ${value} 层${duration}`;
      case 'poison':
        return `使目标中毒 ${value} 层${duration}`;
      case 'cure':
        return value >= 99 ? '移除所有负面效果' : `移除 ${value} 个负面效果`;
      case 'shield':
        return `获得 ${value} 点护盾${duration}`;
      case 'thorns':
        return `荆棘 ${value}${duration ? ` (持续${duration}回合)` : ''}`;
      case 'rage':
        return `攻击伤害 +${value * 10}%${duration}`;
      case 'strength':
        return `力量 +${value}${duration}`;
      case 'dexterity':
        return `敏捷 +${value}${duration}`;
      case 'regen':
        return `每回合回复 ${value} 点生命${duration}`;
      case 'lifesteal':
        return `造成伤害的 ${value * 100}% 转化为生命`;
      case 'choice':
        return '触发抉择效果';
      default:
        return `${label}: ${value}${duration}${attr}`;
    }
  };

  const ageRestriction = card.ageRange
    ? `${card.ageRange[0]}-${card.ageRange[1]}岁可用`
    : '全年龄段可用';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{card.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-ink">{card.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
                  {CARD_TYPE_NAMES[card.type]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${rarityStyle.bg} ${rarityStyle.text}`}>
                  {RARITY_NAMES[card.rarity]}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-ink-muted mb-4 leading-relaxed">{card.description}</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-ink-muted mb-1">费用</div>
            <div className="text-lg font-bold text-brand">{card.cost} ⚡</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-ink-muted mb-1">目标</div>
            <div className="text-sm font-medium text-ink">
              {card.target === 'enemy' ? '敌人' : card.target === 'self' ? '自己' : card.target === 'all' ? '全体' : '无'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-ink-muted mb-1">年龄段</div>
            <div className="text-sm font-medium text-ink">{ageRestriction}</div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-ink mb-2">使用效果</h4>
          <div className="space-y-2">
            {card.effects.map((effect, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-brand/5 to-transparent border border-brand/10"
              >
                <span className="text-brand">▸</span>
                <span className="text-sm text-ink">{formatEffect(effect)}</span>
              </div>
            ))}
          </div>
        </div>

        {card.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-ink mb-2">标签</h4>
            <div className="flex flex-wrap gap-2">
              {card.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CardCard: React.FC<{ card: LifeCard; onClick: () => void }> = ({ card, onClick }) => {
  const typeStyle = CARD_TYPE_COLORS[card.type] || CARD_TYPE_COLORS.skill;

  const getEffectSummary = () => {
    return card.effects.slice(0, 2).map((e) => {
      const label = EFFECT_LABELS[e.type] || e.type;
      if (e.type === 'draw') return `抽${e.value}张`;
      if (e.type === 'heal') return `回复${e.value}`;
      if (e.type === 'cure') return '净化';
      return `${label}${e.value}`;
    }).join(' · ');
  };

  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg border bg-white"
      style={{ borderColor: 'var(--color-border-subtle)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
          {card.cost} ⚡
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
          {CARD_TYPE_NAMES[card.type]}
        </span>
      </div>
      <div className="text-3xl mb-2">{card.icon}</div>
      <div className="text-sm font-semibold text-ink mb-1 group-hover:text-brand transition-colors">
        {card.name}
      </div>
      <p className="text-xs text-ink-muted leading-relaxed mb-2 line-clamp-2">{card.description}</p>
      <div className="text-xs text-brand/70 font-mono">{getEffectSummary()}</div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] px-2 py-1 rounded bg-brand text-white">查看详情</span>
      </div>
    </button>
  );
};

const CardsLibrary: React.FC<{ onSwitchToBattle: () => void }> = ({ onSwitchToBattle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<LifeCard | null>(null);

  const categories: CardCategory[] = useMemo(() => [
    { id: 'all', name: '全部卡牌', icon: '📚', description: '查看所有已设计的卡牌', cards: [] },
    { id: 'starter', name: '初始卡组', icon: '🎴', description: '游戏开始时获得的卡牌', cards: STARTER_DECK },
    { id: 'common_attack', name: '普通攻击', icon: '⚔️', description: '基础攻击卡牌', cards: COMMON_ATTACK_CARDS },
    { id: 'common_skill', name: '普通技能', icon: '🛡️', description: '基础技能卡牌', cards: COMMON_SKILL_CARDS },
    { id: 'rare', name: '稀有卡牌', icon: '💎', description: '稀有强力卡牌', cards: RARE_CARDS },
    { id: 'legendary', name: '传说卡牌', icon: '👑', description: '传说级卡牌', cards: LEGENDARY_CARDS },
    { id: 'curse', name: '诅咒卡牌', icon: '💀', description: '负面效果卡牌', cards: CURSE_CARDS },
    { id: 'childhood', name: '童年专属', icon: '🧒', description: '童年阶段专属卡牌', cards: CHILDHOOD_CARDS },
    { id: 'adolescent', name: '少年专属', icon: '📚', description: '少年阶段专属卡牌', cards: ADOLESCENT_CARDS },
    { id: 'youth', name: '青年专属', icon: '🚀', description: '青年阶段专属卡牌', cards: YOUTH_CARDS },
    { id: 'prime', name: '壮年专属', icon: '💼', description: '壮年阶段专属卡牌', cards: PRIME_CARDS },
    { id: 'middle_age', name: '中年专属', icon: '🧘', description: '中年阶段专属卡牌', cards: MIDDLE_AGE_CARDS },
    { id: 'elderly', name: '老年专属', icon: '👴', description: '老年阶段专属卡牌', cards: ELDERLY_CARDS },
    { id: 'energy', name: '精力卡牌', icon: '⚡', description: '精力属性阶层卡牌', cards: ENERGY_TIER_CARDS },
    { id: 'physique', name: '体魄卡牌', icon: '💪', description: '体魄属性阶层卡牌', cards: PHYSIQUE_TIER_CARDS },
    { id: 'health', name: '健康卡牌', icon: '❤️', description: '健康属性阶层卡牌', cards: HEALTH_TIER_CARDS },
    { id: 'iq', name: '智商卡牌', icon: '🧠', description: '智商属性阶层卡牌', cards: IQ_TIER_CARDS },
    { id: 'eq', name: '情商卡牌', icon: '💬', description: '情商属性阶层卡牌', cards: EQ_TIER_CARDS },
    { id: 'wealth', name: '财富卡牌', icon: '💰', description: '财富属性阶层卡牌', cards: WEALTH_TIER_CARDS },
    { id: 'network', name: '人脉卡牌', icon: '🤝', description: '人脉属性阶层卡牌', cards: NETWORK_TIER_CARDS },
    { id: 'fame', name: '名望卡牌', icon: '⭐', description: '名望属性阶层卡牌', cards: FAME_TIER_CARDS },
    { id: 'cultivation', name: '修仙卡牌', icon: '☯️', description: '修仙模式专属卡牌', cards: [...CULTIVATION_CARDS, ...CULTIVATION_CARDS_HIGH] },
  ], []);

  const filteredCards = useMemo(() => {
    let cards: LifeCard[] = [];

    if (selectedCategory === 'all') {
      const cardMap = new Map<string, LifeCard>();
      categories.forEach((cat) => {
        if (cat.id !== 'all') {
          cat.cards.forEach((card) => {
            if (!cardMap.has(card.id)) {
              cardMap.set(card.id, card);
            }
          });
        }
      });
      cards = Array.from(cardMap.values());
    } else {
      const category = categories.find((c) => c.id === selectedCategory);
      cards = category ? [...category.cards] : [];
    }

    if (selectedType !== 'all') {
      cards = cards.filter((card) => card.type === selectedType);
    }

    if (selectedRarity !== 'all') {
      cards = cards.filter((card) => card.rarity === selectedRarity);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.name.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query) ||
          card.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return cards;
  }, [selectedCategory, selectedType, selectedRarity, searchQuery, categories]);

  const totalCards = useMemo(() => {
    const cardMap = new Map<string, LifeCard>();
    categories.forEach((cat) => {
      if (cat.id !== 'all') {
        cat.cards.forEach((card) => {
          if (!cardMap.has(card.id)) {
            cardMap.set(card.id, card);
          }
        });
      }
    });
    return cardMap.size;
  }, [categories]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border-subtle bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-2xl font-bold text-ink">智库</h1>
              <p className="text-sm text-ink-muted">探索所有已设计的卡牌及其使用效果</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white transition-all"
          >
            📚 卡牌库
          </button>
          <button
            onClick={onSwitchToBattle}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:bg-gray-100 transition-all"
          >
            ⚔️ 模拟战斗
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/10">
            <span className="text-brand font-bold">{totalCards}</span>
            <span className="text-ink-muted">张卡牌</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50">
            <span className="text-purple-600 font-bold">{categories.length - 1}</span>
            <span className="text-ink-muted">个分类</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-border-subtle bg-gray-50 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-ink mb-3">分类浏览</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-muted hover:bg-white hover:text-ink'
                }`}
              >
                <span>{category.icon}</span>
                <span className="truncate">{category.name}</span>
                {category.id !== 'all' && (
                  <span className={`ml-auto text-xs ${selectedCategory === category.id ? 'text-white/80' : 'text-ink-faint'}`}>
                    {category.cards.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索卡牌名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">类型:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand"
              >
                <option value="all">全部</option>
                <option value="attack">攻击</option>
                <option value="skill">技能</option>
                <option value="power">能力</option>
                <option value="curse">诅咒</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">稀有度:</span>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand"
              >
                <option value="all">全部</option>
                <option value="common">普通</option>
                <option value="uncommon">优秀</option>
                <option value="rare">稀有</option>
                <option value="legendary">传说</option>
              </select>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">
              {categories.find((c) => c.id === selectedCategory)?.name || '全部卡牌'}
            </h2>
            <span className="text-sm text-ink-muted">{filteredCards.length} 张卡牌</span>
          </div>

          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-ink-muted">没有找到匹配的卡牌</p>
              <p className="text-sm text-ink-faint mt-1">尝试调整筛选条件或搜索关键词</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCards.map((card, index) => (
                <CardCard
                  key={`${card.id}-${index}`}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default ThinkTankPage;
