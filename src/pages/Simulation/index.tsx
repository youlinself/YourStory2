import React, { useEffect, useState } from 'react';
import useSimulationStore from '../../stores/simulationStore';
import {
  ERAS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_COLORS,
} from '../../data/simulationData';
import type { BirthYear, PlayerAttributes, GameEvent } from '../../types/simulation';

const AttributeBar: React.FC<{ attr: keyof PlayerAttributes; value: number; showLabel?: boolean }> = ({ attr, value, showLabel = true }) => (
  <div className="flex items-center gap-2">
    <span className="text-base w-5 text-center">{ATTRIBUTE_ICONS[attr] || '•'}</span>
    {showLabel && <span className="text-xs text-ink-muted w-8">{ATTRIBUTE_NAMES[attr] || attr}</span>}
    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: ATTRIBUTE_COLORS[attr] || '#6B7280' }} />
    </div>
    <span className="text-xs font-mono text-ink w-7 text-right">{Math.round(value)}</span>
  </div>
);

const NODE_ICONS: Record<string, string> = {
  start: '🏁', combat: '⚔️', elite: '👹', boss: '💀',
  event: '❓', rest: '🛏️', shop: '🏪', treasure: '💎', mystery: '❔',
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

  const selectedEra = ERAS.find((e) => e.year === selectedYear);

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
              <div>
                <h3 className="font-semibold text-ink">{selectedEra.name}</h3>
                <span className="text-xs text-ink-muted">{selectedEra.year}年代</span>
              </div>
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
const AllocatingPhase: React.FC = () => {
  const attributes = useSimulationStore((s) => s.attributes);
  const remainingPoints = useSimulationStore((s) => s.remainingAttributePoints);
  const allocateAttribute = useSimulationStore((s) => s.allocateAttribute);
  const confirmAllocation = useSimulationStore((s) => s.confirmAllocation);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <h2 className="text-xl font-semibold text-ink mb-2">分配属性点</h2>
      <p className="text-ink-muted text-sm mb-6">剩余点数：<span className="font-bold text-brand">{remainingPoints}</span></p>
      <div className="w-full max-w-md space-y-4 mb-8">
        {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
          <div key={attr} className="bg-white rounded-lg border border-border-subtle p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{ATTRIBUTE_ICONS[attr]}</span>
                <span className="text-sm font-medium text-ink">{ATTRIBUTE_NAMES[attr]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => allocateAttribute(attr, attributes[attr] - 1)} disabled={attributes[attr] <= 10} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm">-</button>
                <span className="w-10 text-center font-mono font-bold">{attributes[attr]}</span>
                <button onClick={() => allocateAttribute(attr, attributes[attr] + 1)} disabled={remainingPoints <= 0 || attributes[attr] >= 99} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm">+</button>
              </div>
            </div>
            <AttributeBar attr={attr} value={attributes[attr]} showLabel={false} />
          </div>
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
  const birthYear = useSimulationStore((s) => s.birthYear);

  if (!currentMap) return null;

  const layers = Array.from(new Set(currentMap.nodes.map((n) => n.x))).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink">宏观地图</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl">&times;</button>
        </div>
        <p className="text-sm text-ink-muted mb-4">每层代表一年，展示整个时代的路径结构</p>
        <div className="space-y-3">
          {layers.map((layer) => {
            const nodes = currentMap.nodes.filter((n) => n.x === layer).sort((a, b) => a.y - b.y);
            const year = (birthYear || 1950) + layer;
            return (
              <div key={layer} className="flex items-center gap-3">
                <div className="w-16 text-xs text-ink-muted text-right flex-shrink-0">{year}年</div>
                <div className="flex gap-2 flex-1">
                  {nodes.map((node) => (
                    <div key={node.id}
                      className={`flex-1 h-12 rounded-lg border text-xs flex flex-col items-center justify-center p-1 transition-all ${
                        node.isVisited ? 'bg-gray-100 border-gray-300 text-gray-400' :
                        node.isCurrent ? 'bg-brand/10 border-brand text-brand scale-105 shadow-sm' :
                        node.isAccessible ? 'bg-white border-border-subtle text-ink' :
                        'bg-gray-50 border-gray-100 text-gray-300'
                      }`}>
                      <span className="text-base">{NODE_ICONS[node.type] || '•'}</span>
                      <span className="text-[10px] mt-0.5 capitalize">{node.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand/20 border border-brand inline-block" /> 当前可选</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" /> 已完成</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-100 inline-block" /> 未解锁</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 纵向地图视图（仅当前层）
// ==========================================
const MapViewPhase: React.FC = () => {
  const currentMap = useSimulationStore((s) => s.currentMap);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const selectNode = useSimulationStore((s) => s.selectNode);
  const enterNode = useSimulationStore((s) => s.enterNode);
  const [showMacro, setShowMacro] = useState(false);

  if (!currentMap) return null;

  const currentLayerNodes = currentMap.nodes
    .filter((n) => n.x === currentMap.currentLayer)
    .sort((a, b) => a.y - b.y);

  const currentYear = (birthYear || 1950) + currentMap.currentLayer;
  const selectedNode = currentLayerNodes.find((n) => n.id === currentMap.currentNodeId);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* 年份标题 */}
      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-ink mb-1">{currentYear}年</div>
        <div className="text-sm text-ink-muted">第{currentMap.currentLayer + 1}层 / 共10层</div>
      </div>

      {/* 纵向节点列表 */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm mb-8">
        {currentLayerNodes.map((node, idx) => {
          const isSelected = node.id === currentMap.currentNodeId;
          const isAccessible = node.isAccessible && !node.isVisited;
          return (
            <React.Fragment key={node.id}>
              <button
                onClick={() => isAccessible ? selectNode(node.id) : undefined}
                disabled={!isAccessible}
                className={`w-full max-w-[280px] p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-brand bg-brand/5 shadow-md scale-[1.02]' :
                  isAccessible ? 'border-border-subtle bg-white hover:border-brand hover:shadow-md cursor-pointer' :
                  node.isVisited ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' :
                  'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{NODE_ICONS[node.type] || '•'}</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink capitalize">{node.type}</div>
                    <div className="text-xs text-ink-muted">
                      {node.type === 'combat' && '与敌人战斗'}
                      {node.type === 'elite' && '强敌出现'}
                      {node.type === 'boss' && '时代终结者'}
                      {node.type === 'event' && '随机际遇'}
                      {node.type === 'shop' && '商店'}
                      {node.type === 'rest' && '休息恢复'}
                      {node.type === 'treasure' && '宝藏奖励'}
                      {node.type === 'mystery' && '神秘事件'}
                      {node.type === 'start' && '起点'}
                    </div>
                  </div>
                  {isSelected && <span className="text-brand">✓</span>}
                  {node.isVisited && <span className="text-gray-400 text-xs">已完成</span>}
                </div>
              </button>
              {idx < currentLayerNodes.length - 1 && (
                <div className="w-0.5 h-4 bg-gray-200" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 当前选中节点信息 */}
      {selectedNode && (
        <div className="w-full max-w-md bg-white rounded-xl border border-border-subtle p-4 mb-4">
          <div className="text-sm text-ink-muted mb-2">当前选择</div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{NODE_ICONS[selectedNode.type]}</span>
            <span className="font-medium text-ink capitalize">{selectedNode.type}</span>
            {selectedNode.type === 'boss' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ Boss</span>}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button onClick={() => setShowMacro(true)}
          className="px-5 py-2.5 bg-white border border-border-subtle rounded-lg text-sm hover:border-brand transition-colors">
          🗺️ 宏观地图
        </button>
        <button onClick={enterNode} disabled={!selectedNode || !selectedNode.isAccessible}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            selectedNode?.isAccessible ? 'bg-brand text-white hover:bg-brand/90 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          进入节点 →
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
  const attributes = useSimulationStore((s) => s.attributes);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const choiceHistory = useSimulationStore((s) => s.choiceHistory);
  const getSuccessRate = useSimulationStore((s) => s.getSuccessRate);

  const displayText = event.skinRule ? event.skinRule(attributes, choiceHistory, hiddenTags) : event.baseText;

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm max-w-lg mx-auto">
      <h3 className="text-lg font-semibold text-ink mb-3">{event.title}</h3>
      <p className="text-ink-muted text-sm leading-relaxed mb-6">{displayText}</p>
      <div className="space-y-3">
        {event.options.map((option) => {
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
        })}
      </div>
    </div>
  );
};

// ==========================================
// 战斗界面
// ==========================================
const CombatPhaseView: React.FC = () => {
  const combat = useSimulationStore((s) => s.combat);
  const playCard = useSimulationStore((s) => s.playCard);
  const endTurn = useSimulationStore((s) => s.endTurn);
  const currentEnemy = combat.enemies[combat.currentEnemyIndex];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">{currentEnemy?.name || '战斗'} {currentEnemy?.isBoss && <span className="ml-2 text-xs text-red-500">👑 BOSS</span>}</h3>
          <span className="text-xs text-ink-muted">回合 {combat.currentTurn}</span>
        </div>
        {combat.enemies.map((enemy, idx) => (
          <div key={enemy.id} className={`mb-3 ${idx === combat.currentEnemyIndex ? 'ring-2 ring-red-300 rounded-lg p-2' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{enemy.icon}</span>
              <span className="text-sm font-medium">{enemy.name}</span>
              <span className="ml-auto text-xs text-ink-muted">{enemy.currentHealth}/{enemy.maxHealth} HP</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${(enemy.currentHealth / enemy.maxHealth) * 100}%` }} />
            </div>
            {idx === combat.currentEnemyIndex && enemy.intents[enemy.currentIntentIndex] && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-yellow-500">⚡</span>
                <span className="text-ink-muted">意图: {JSON.stringify(enemy.intents[enemy.currentIntentIndex])}</span>
              </div>
            )}
            {enemy.statusEffects.length > 0 && (
              <div className="mt-1 flex gap-1 flex-wrap">
                {enemy.statusEffects.map((eff, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{eff.type}:{eff.value}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ink">你的状态</h3>
          <span className="text-sm text-ink-muted">❤️ {combat.player.currentHealth}/{combat.player.maxHealth}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-50 rounded p-2 text-center"><div className="text-xs text-ink-muted">精力</div><div className="font-bold text-brand">{combat.player.energy}/{combat.player.maxEnergy}</div></div>
          <div className="bg-gray-50 rounded p-2 text-center"><div className="text-xs text-ink-muted">格挡</div><div className="font-bold text-blue-500">{combat.player.block}</div></div>
          <div className="bg-gray-50 rounded p-2 text-center"><div className="text-xs text-ink-muted">牌组</div><div className="font-bold text-ink">{combat.player.drawPile.length}/{combat.player.discardPile.length}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-subtle p-4">
        <h3 className="font-semibold text-ink mb-3">手牌</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {combat.player.hand.map((card) => (
            <button key={card.id} onClick={() => playCard(card.id)} disabled={card.cost > combat.player.energy}
              className={`p-3 rounded-lg border text-left transition-all ${card.cost <= combat.player.energy ? 'border-border-subtle hover:border-brand hover:bg-brand/5' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{card.icon}</span>
                <span className="text-sm font-medium truncate">{card.name}</span>
              </div>
              <div className="text-xs text-ink-muted mb-1">{card.description}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{card.cost} 能量</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${card.type === 'attack' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{card.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button onClick={endTurn} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">结束回合</button>
      </div>
    </div>
  );
};

// ==========================================
// 战斗奖励
// ==========================================
const RewardPhase: React.FC = () => {
  const combat = useSimulationStore((s) => s.combat);
  const selectCardReward = useSimulationStore((s) => s.selectCardReward);
  const completeNode = useSimulationStore((s) => s.completeNode);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h2 className="text-xl font-bold text-ink mb-2">🎉 战斗胜利</h2>
      <p className="text-ink-muted text-sm mb-6">获得金币: {combat.rewards.gold}</p>
      {combat.rewards.cards.length > 0 && (
        <div className="w-full max-w-2xl mb-6">
          <h3 className="text-sm font-medium text-ink mb-3">选择一张卡牌加入卡组</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {combat.rewards.cards.map((card) => (
              <button key={card.id} onClick={() => setSelectedCard(card.id)}
                className={`p-4 rounded-lg border text-left transition-all ${selectedCard === card.id ? 'border-brand bg-brand/5 ring-2 ring-brand/20' : 'border-border-subtle hover:border-brand'}`}>
                <div className="flex items-center gap-2 mb-1"><span className="text-2xl">{card.icon}</span><span className="font-medium">{card.name}</span></div>
                <p className="text-xs text-ink-muted">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => { if (selectedCard) selectCardReward(selectedCard); else completeNode(); }}
        className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">确认</button>
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
  const completeNode = useSimulationStore((s) => s.completeNode);
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
        <button onClick={completeNode} className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">离开商店</button>
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
  const loadGame = useSimulationStore((s) => s.loadGame);
  const availableEvents = useSimulationStore((s) => s.getAvailableEvents());

  useEffect(() => { loadGame(); }, [loadGame]);

  const currentEvent = phase === 'event' ? availableEvents[0] : null;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {phase === 'setup' && <ModeSelectPhase />}
        {phase === 'allocating' && <AllocatingPhase />}
        {phase === 'map_view' && <MapViewPhase />}
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
            {cultivation && <p className="text-sm text-brand">境界: {cultivation.realm}</p>}
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
              <div className="flex justify-between"><span className="text-ink-muted">剩余寿命</span><span className="font-medium">{Math.round(remainingLife)}年</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">金币</span><span className="font-medium">💰 {gold}</span></div>
              {cultivation && <div className="flex justify-between"><span className="text-ink-muted">境界</span><span className="font-medium text-brand">{cultivation.realm}</span></div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3">📊 属性</h3>
            <div className="space-y-2.5">
              {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
                <AttributeBar key={attr} attr={attr} value={attributes[attr]} />
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
                  <div key={relic.id} className="text-center p-1 bg-gray-50 rounded" title={relic.name}><span className="text-lg">{relic.icon}</span></div>
                ))}
              </div>
            </div>
          )}
          {hiddenTags.length > 0 && (
            <div className="bg-white rounded-xl border border-border-subtle p-4">
              <h3 className="font-semibold text-ink mb-3">🏷️ 标签</h3>
              <div className="flex flex-wrap gap-1">
                {hiddenTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">{tag}</span>
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
