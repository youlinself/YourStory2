import React from 'react';
import useBondStore from '../../stores/bondStore';
import { BOND_CARDS, BOND_GROUPS } from '../../data/bondCards';
import type { BondGroupDefinition } from '../../types/bond';
import './BondSummaryPanel.css';

interface BondSummaryPanelProps {
  onOpenDetail: () => void;
}

const BondSummaryPanel: React.FC<BondSummaryPanelProps> = ({ onOpenDetail }) => {
  const collection = useBondStore((s) => s.collection);
  const activeBondGroups = useBondStore((s) => s.activeBondGroups);
  const activeBondTiers = useBondStore((s) => s.activeBondTiers);
  const getCollectionStats = useBondStore((s) => s.getCollectionStats);

  const stats = getCollectionStats();
  const totalBondLevel = Object.values(activeBondTiers).reduce((a: number, b: number) => a + b, 0);

  const collectedCards = BOND_CARDS.filter((card) =>
    collection.some((c) => c.cardDefId === card.id)
  );

  const getBondGroupDef = (groupId: string): BondGroupDefinition | undefined => {
    return BOND_GROUPS.find((g) => g.id === groupId);
  };

  return (
    <div className="bond-summary-panel">
      <div className="bond-summary-header">
        <span className="bond-summary-title">🎴 羁绊</span>
        <button className="bond-summary-detail-btn" onClick={onOpenDetail}>
          详情
        </button>
      </div>

      <div className="bond-summary-stats">
        <div className="bond-stat-item">
          <span className="bond-stat-value">{stats.unique}</span>
          <span className="bond-stat-label">收集</span>
        </div>
        <div className="bond-stat-divider" />
        <div className="bond-stat-item">
          <span className="bond-stat-value bond-stat-highlight">{activeBondGroups.length}</span>
          <span className="bond-stat-label">羁绊</span>
        </div>
        <div className="bond-stat-divider" />
        <div className="bond-stat-item">
          <span className="bond-stat-value bond-stat-gold">{totalBondLevel}</span>
          <span className="bond-stat-label">等级</span>
        </div>
      </div>

      {collectedCards.length > 0 && (
        <div className="bond-summary-npcs">
          <div className="bond-summary-npcs-title">已收集卡牌</div>
          <div className="bond-summary-npc-list">
            {collectedCards.slice(0, 5).map((card) => (
              <div key={card.id} className="bond-summary-npc-item" title={`${card.name} · ${card.description}`}>
                <span className="bond-summary-npc-avatar">{card.icon}</span>
                <div className="bond-summary-npc-info">
                  <span className="bond-summary-npc-name">{card.name}</span>
                  <span className="bond-summary-npc-desc">{card.category}</span>
                </div>
              </div>
            ))}
            {collectedCards.length > 5 && (
              <div className="bond-summary-more">
                +{collectedCards.length - 5} 更多
              </div>
            )}
          </div>
        </div>
      )}

      {activeBondGroups.length > 0 && (
        <div className="bond-summary-bonds">
          <div className="bond-summary-bonds-title">已激活羁绊</div>
          <div className="bond-summary-bond-list">
            {activeBondGroups.slice(0, 3).map((groupId) => {
              const tier = activeBondTiers[groupId] || 0;
              const groupDef = getBondGroupDef(groupId);
              return (
                <div key={groupId} className="bond-summary-bond-item">
                  <span className="bond-summary-bond-icon">{groupDef?.icon || '🔗'}</span>
                  <span className="bond-summary-bond-name">{groupDef?.name || groupId}</span>
                  {tier > 0 && <span className="bond-summary-bond-tier">T{tier}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BondSummaryPanel;
