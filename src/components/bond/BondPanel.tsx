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
  const activeBondTiers = useBondStore((s) => s.activeBondTiers);

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'family', name: '家人', icon: '👨‍👩‍👧' },
    { id: 'friendship', name: '友谊', icon: '🤝' },
    { id: 'education', name: '学业', icon: '📚' },
    { id: 'career', name: '事业', icon: '💼' },
    { id: 'romance', name: '爱情', icon: '💕' },
    { id: 'rival', name: '对手', icon: '⚔️' },
  ];

  const filteredNPCs = selectedCategory === 'all'
    ? npcs
    : npcs.filter((n) => IDENTITY_MAP[n.identityId]?.category === selectedCategory);

  const filteredActiveNPCs = filteredNPCs.filter((n) => n.isActive && !n.isGone);
  const filteredInactiveNPCs = filteredNPCs.filter((n) => !n.isActive && !n.isGone);
  const filteredGoneNPCs = filteredNPCs.filter((n) => n.isGone);

  const totalBondLevels = Object.values(activeBondTiers).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="bond-panel">
      <div className="bond-panel-header">
        <div className="bond-panel-title-row">
          <div className="bond-panel-icon">
            <span>🔗</span>
          </div>
          <div className="bond-panel-title-text">
            <h2>羁绊系统</h2>
            <p className="bond-panel-subtitle">珍惜每一段缘分</p>
          </div>
        </div>
        <div className="bond-panel-stats">
          <div className="bond-stat-card">
            <div className="bond-stat-icon">👥</div>
            <div className="bond-stat-content">
              <span className="bond-stat-number">{npcs.length}</span>
              <span className="bond-stat-label">位NPC</span>
            </div>
          </div>
          <div className="bond-stat-card">
            <div className="bond-stat-icon">✨</div>
            <div className="bond-stat-content">
              <span className="bond-stat-number bond-stat-accent">{activeBondGroups.length}</span>
              <span className="bond-stat-label">个羁绊</span>
            </div>
          </div>
          <div className="bond-stat-card">
            <div className="bond-stat-icon">⭐</div>
            <div className="bond-stat-content">
              <span className="bond-stat-number bond-stat-gold">{totalBondLevels}</span>
              <span className="bond-stat-label">总等级</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bond-panel-tabs">
        <button
          className={`bond-tab ${activeTab === 'npcs' ? 'active' : ''}`}
          onClick={() => setActiveTab('npcs')}
        >
          <span className="bond-tab-icon">👥</span>
          <span>NPC</span>
        </button>
        <button
          className={`bond-tab ${activeTab === 'bonds' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonds')}
        >
          <span className="bond-tab-icon">🔗</span>
          <span>羁绊</span>
        </button>
        <button
          className={`bond-tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <span className="bond-tab-icon">🎁</span>
          <span>奖励</span>
        </button>
      </div>

      <div className="bond-panel-body">
        {activeTab === 'npcs' && (
          <div className="bond-tab-content">
            <div className="bond-category-filter">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`bond-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="bond-category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {filteredNPCs.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">🌱</div>
                <h3>还没有遇到任何NPC</h3>
                <p>随着游戏进行，你会遇到各种各样的人</p>
              </div>
            ) : (
              <div className="bond-npc-sections">
                {filteredActiveNPCs.length > 0 && (
                  <div className="bond-section">
                    <div className="bond-section-header">
                      <span className="bond-section-dot bond-section-dot-active" />
                      <h3 className="bond-section-title">已激活 ({filteredActiveNPCs.length})</h3>
                    </div>
                    <div className="bond-npc-grid">
                      {filteredActiveNPCs.map((npc) => (
                        <NPCCard key={npc.id} npc={npc} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredInactiveNPCs.length > 0 && (
                  <div className="bond-section">
                    <div className="bond-section-header">
                      <span className="bond-section-dot bond-section-dot-inactive" />
                      <h3 className="bond-section-title">未激活 ({filteredInactiveNPCs.length})</h3>
                    </div>
                    <div className="bond-npc-grid">
                      {filteredInactiveNPCs.map((npc) => (
                        <NPCCard key={npc.id} npc={npc} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredGoneNPCs.length > 0 && (
                  <div className="bond-section">
                    <div className="bond-section-header">
                      <span className="bond-section-dot bond-section-dot-gone" />
                      <h3 className="bond-section-title">已离开 ({filteredGoneNPCs.length})</h3>
                    </div>
                    <div className="bond-npc-grid">
                      {filteredGoneNPCs.map((npc) => (
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
          <div className="bond-tab-content">
            {BOND_GROUPS.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">🔗</div>
                <h3>暂无可激活的羁绊</h3>
                <p>结交更多朋友，解锁羁绊组合</p>
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
          <div className="bond-tab-content">
            <div className="bond-rewards-header">
              <h3>已获得的奖励</h3>
              <span className="bond-rewards-count">{claimedRewards.length} 项</span>
            </div>
            {claimedRewards.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">🎁</div>
                <h3>还没有获得任何羁绊奖励</h3>
                <p>激活羁绊组合后可以获得奖励</p>
              </div>
            ) : (
              <div className="bond-rewards-list">
                {claimedRewards.map((key) => {
                  const [groupId, tierStr] = key.split('_tier');
                  const tier = parseInt(tierStr);
                  const group = BOND_GROUPS.find((g) => g.id === groupId);
                  if (!group) return null;

                  const tierData = group.tiers?.find((t) => t.tier === tier);
                  const rewardName = tierData?.name || group.name;

                  return (
                    <div key={key} className="bond-reward-item">
                      <div className="bond-reward-icon-wrap">
                        <span className="bond-reward-icon">{group.icon}</span>
                      </div>
                      <div className="bond-reward-info">
                        <span className="bond-reward-name">{rewardName}</span>
                        <span className="bond-reward-tier">等级 {tier}</span>
                      </div>
                      <div className="bond-reward-check">✓</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BondPanel;
