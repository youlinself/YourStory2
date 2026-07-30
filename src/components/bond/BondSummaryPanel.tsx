import React from 'react';
import useBondStore from '../../stores/bondStore';
import { IDENTITY_MAP, BOND_GROUPS } from '../../data/bondData';
import type { BondGroupDefinition } from '../../types/bond';
import './BondSummaryPanel.css';

interface BondSummaryPanelProps {
  onOpenDetail: () => void;
}

const BondSummaryPanel: React.FC<BondSummaryPanelProps> = ({ onOpenDetail }) => {
  const npcs = useBondStore((s) => s.npcs);
  const activeBondGroups = useBondStore((s) => s.activeBondGroups);
  const activeBondTiers = useBondStore((s) => s.activeBondTiers);

  const activeNPCs = npcs.filter((n) => n.isActive && !n.isGone);
  const totalBondLevel = Object.values(activeBondTiers).reduce((a: number, b: number) => a + b, 0);

  const getBondGroupDef = (groupId: string): BondGroupDefinition | undefined => {
    return BOND_GROUPS.find((g) => g.id === groupId);
  };

  return (
    <div className="bond-summary-panel">
      <div className="bond-summary-header">
        <span className="bond-summary-title">🔗 羁绊</span>
        <button className="bond-summary-detail-btn" onClick={onOpenDetail}>
          详情
        </button>
      </div>

      <div className="bond-summary-stats">
        <div className="bond-stat-item">
          <span className="bond-stat-value">{npcs.length}</span>
          <span className="bond-stat-label">NPC</span>
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

      {activeNPCs.length > 0 && (
        <div className="bond-summary-npcs">
          <div className="bond-summary-npcs-title">已激活NPC</div>
          <div className="bond-summary-npc-list">
            {activeNPCs.slice(0, 5).map((npc) => {
              const identity = IDENTITY_MAP[npc.identityId];
              return (
                <div key={npc.id} className="bond-summary-npc-item" title={`${npc.name} · ${identity?.name || '未知身份'} (${npc.relationship})`}>
                  <span className="bond-summary-npc-avatar">{npc.avatar}</span>
                  <div className="bond-summary-npc-info">
                    <span className="bond-summary-npc-name">{npc.name}</span>
                    <div className="bond-summary-npc-rel">
                      <div className="bond-summary-npc-rel-bar">
                        <div
                          className="bond-summary-npc-rel-fill"
                          style={{ width: `${npc.relationship}%` }}
                        />
                      </div>
                      <span className="bond-summary-npc-rel-value">{npc.relationship}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeNPCs.length > 5 && (
              <div className="bond-summary-more">
                +{activeNPCs.length - 5} 更多
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
