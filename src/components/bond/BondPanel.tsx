import React, { useState } from 'react';
import useBondStore from '../../stores/bondStore';
import { BOND_GROUPS, IDENTITY_MAP } from '../../data/bondData';
import NPCCard from './NPCCard';
import BondGroupCard from './BondGroupCard';
import './BondPanel.css';

type TabType = 'npcs' | 'bonds' | 'rewards';

const BondPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('npcs');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const npcs = useBondStore((s) => s.npcs);
  const activeBondGroups = useBondStore((s) => s.activeBondGroups);
  const claimedRewards = useBondStore((s) => s.claimedRewards);

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'family', name: '家人', icon: '👨‍👩‍👧' },
    { id: 'friendship', name: '友谊', icon: '🤝' },
    { id: 'education', name: '学业', icon: '📚' },
    { id: 'career', name: '事业', icon: '💼' },
    { id: 'romance', name: '爱情', icon: '💕' },
  ];

  const filteredNPCs = selectedCategory === 'all'
    ? npcs
    : npcs.filter((n) => IDENTITY_MAP[n.identityId]?.category === selectedCategory);

  const activeNPCs = npcs.filter((n) => n.isActive && !n.isGone);
  const inactiveNPCs = npcs.filter((n) => !n.isActive && !n.isGone);
  const goneNPCs = npcs.filter((n) => n.isGone);

  return (
    <div className="bond-panel">
      <div className="bond-header">
        <h2>羁绊系统</h2>
        <div className="bond-stats">
          <span className="stat">
            <span className="stat-icon">👥</span>
            {npcs.length} 位NPC
          </span>
          <span className="stat">
            <span className="stat-icon">✨</span>
            {activeBondGroups.length} 个羁绊
          </span>
        </div>
      </div>

      <div className="bond-tabs">
        <button
          className={`tab ${activeTab === 'npcs' ? 'active' : ''}`}
          onClick={() => setActiveTab('npcs')}
        >
          <span className="tab-icon">👥</span>
          NPC
        </button>
        <button
          className={`tab ${activeTab === 'bonds' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonds')}
        >
          <span className="tab-icon">🔗</span>
          羁绊
        </button>
        <button
          className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <span className="tab-icon">🎁</span>
          奖励
        </button>
      </div>

      {activeTab === 'npcs' && (
        <div className="npc-tab">
          <div className="category-filter">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {filteredNPCs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <p>还没有遇到任何NPC</p>
              <p className="empty-hint">随着游戏进行，你会遇到各种各样的人</p>
            </div>
          ) : (
            <div className="npc-list">
              {activeNPCs.length > 0 && (
                <div className="npc-section">
                  <h3 className="section-title">
                    <span className="section-icon">💚</span>
                    已激活 ({activeNPCs.length})
                  </h3>
                  <div className="npc-grid">
                    {activeNPCs.map((npc) => (
                      <NPCCard key={npc.id} npc={npc} />
                    ))}
                  </div>
                </div>
              )}

              {inactiveNPCs.length > 0 && (
                <div className="npc-section">
                  <h3 className="section-title">
                    <span className="section-icon">💛</span>
                    未激活 ({inactiveNPCs.length})
                  </h3>
                  <div className="npc-grid">
                    {inactiveNPCs.map((npc) => (
                      <NPCCard key={npc.id} npc={npc} />
                    ))}
                  </div>
                </div>
              )}

              {goneNPCs.length > 0 && (
                <div className="npc-section">
                  <h3 className="section-title">
                    <span className="section-icon">👻</span>
                    已离开 ({goneNPCs.length})
                  </h3>
                  <div className="npc-grid">
                    {goneNPCs.map((npc) => (
                      <NPCCard key={npc.id} npc={npc} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bonds' && (
        <div className="bonds-tab">
          {BOND_GROUPS.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔗</span>
              <p>暂无可激活的羁绊</p>
            </div>
          ) : (
            <div className="bond-group-list">
              {BOND_GROUPS.map((group) => (
                <BondGroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="rewards-tab">
          <div className="rewards-summary">
            <h3>已获得的奖励</h3>
            {claimedRewards.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🎁</span>
                <p>还没有获得任何羁绊奖励</p>
                <p className="empty-hint">激活羁绊组合后可以获得奖励</p>
              </div>
            ) : (
              <div className="claimed-rewards-list">
                {claimedRewards.map((key) => {
                  const [groupId, tierStr] = key.split('_tier');
                  const tier = parseInt(tierStr);
                  const group = BOND_GROUPS.find((g) => g.id === groupId);
                  if (!group) return null;

                  const tierData = group.tiers?.find((t) => t.tier === tier);
                  const rewardName = tierData?.name || group.name;

                  return (
                    <div key={key} className="claimed-reward-item">
                      <span className="reward-icon">{group.icon}</span>
                      <div className="reward-info">
                        <span className="reward-name">{rewardName}</span>
                        <span className="reward-tier">Tier {tier}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BondPanel;
