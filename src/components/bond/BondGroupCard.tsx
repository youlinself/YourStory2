import React, { useState } from 'react';
import type { BondGroupDefinition } from '../../types/bond';
import { IDENTITY_MAP } from '../../data/bondData';
import useBondStore from '../../stores/bondStore';
import './BondGroupCard.css';

interface BondGroupCardProps {
  group: BondGroupDefinition;
}

const BondGroupCard: React.FC<BondGroupCardProps> = ({ group }) => {
  const [showDetail, setShowDetail] = useState(false);

  const activeBondGroups = useBondStore((s) => s.activeBondGroups);
  const activeBondTiers = useBondStore((s) => s.activeBondTiers);
  const claimedRewards = useBondStore((s) => s.claimedRewards);
  const npcs = useBondStore((s) => s.npcs);
  const activateBondGroup = useBondStore((s) => s.activateBondGroup);
  const claimReward = useBondStore((s) => s.claimReward);

  const isActive = activeBondGroups.includes(group.id);
  const currentTier = activeBondTiers[group.id] || 0;
  const maxTier = group.tiers?.length || 1;

  const activeNPCs = npcs.filter((n) => n.isActive && !n.isGone);
  const activeIdentityIds = activeNPCs.map((n) => n.identityId);

  const requiredIdentitiesStatus = group.requiredIdentities.map((id) => ({
    id,
    identity: IDENTITY_MAP[id],
    isPresent: activeIdentityIds.includes(id),
  }));

  const allRequiredPresent = group.requireAllActive
    ? requiredIdentitiesStatus.every((r) => r.isPresent)
    : requiredIdentitiesStatus.some((r) => r.isPresent);

  const relevantNPCs = npcs.filter((n) =>
    group.requiredIdentities.includes(n.identityId) && !n.isGone
  );
  const totalRelationship = relevantNPCs.reduce((sum, n) => sum + n.relationship, 0);

  const getNextTier = () => {
    if (!group.tiers) return null;
    return group.tiers.find((t) => t.tier > currentTier);
  };

  const nextTier = getNextTier();
  const canUpgrade = nextTier && totalRelationship >= nextTier.totalRelationshipRequired;

  const handleActivate = () => {
    if (!isActive && allRequiredPresent) {
      activateBondGroup(group.id);
      claimReward(group.id, 0);
    }
  };

  const handleUpgrade = () => {
    if (canUpgrade && nextTier) {
      claimReward(group.id, nextTier.tier);
    }
  };

  const getRewardSummary = (rewards: BondGroupDefinition['rewards']): string => {
    const parts: string[] = [];
    for (const r of rewards) {
      if (r.attributeBonus) {
        const attrs = Object.entries(r.attributeBonus)
          .map(([k, v]) => `${k}+${v}`)
          .join(', ');
        parts.push(`属性: ${attrs}`);
      }
      if (r.cardReward) parts.push(`卡牌: ${r.cardReward.name}`);
      if (r.relicReward) parts.push(`遗物: ${r.relicReward.name}`);
      if (r.passiveDescription) parts.push(`被动: ${r.passiveDescription}`);
    }
    return parts.join(' | ');
  };

  return (
    <>
      <div className={`bond-group-card ${isActive ? 'active' : 'inactive'}`}>
        <div className="bond-group-header">
          <div className="bond-group-icon">{group.icon}</div>
          <div className="bond-group-title">
            <h4>{group.name}</h4>
            <p className="bond-group-desc">{group.description}</p>
          </div>
          <div className="bond-group-status">
            {isActive ? (
              <span className="status-badge active">已激活</span>
            ) : allRequiredPresent ? (
              <button className="activate-btn" onClick={handleActivate}>
                激活
              </button>
            ) : (
              <span className="status-badge locked">未满足</span>
            )}
          </div>
        </div>

        <div className="bond-group-requirements">
          <span className="requirements-label">需要身份:</span>
          <div className="requirements-list">
            {requiredIdentitiesStatus.map((req, i) => (
              <span
                key={i}
                className={`requirement-tag ${req.isPresent ? 'present' : 'missing'}`}
              >
                {req.identity?.icon} {req.identity?.name || req.id}
                {req.isPresent ? ' ✓' : ' ✗'}
              </span>
            ))}
          </div>
        </div>

        {isActive && group.tiers && group.tiers.length > 0 && (
          <div className="bond-group-tiers">
            <div className="tier-progress">
              <span className="current-tier">
                当前等级: Tier {currentTier} / {maxTier}
              </span>
              {nextTier && (
                <span className="next-tier">
                  下一级需要: {totalRelationship}/{nextTier.totalRelationshipRequired} 关系值
                </span>
              )}
            </div>
            {nextTier && (
              <div className="tier-progress-bar">
                <div
                  className="tier-progress-fill"
                  style={{
                    width: `${Math.min(100, (totalRelationship / nextTier.totalRelationshipRequired) * 100)}%`,
                  }}
                />
              </div>
            )}
            {canUpgrade && (
              <button className="upgrade-btn" onClick={handleUpgrade}>
                升级到 Tier {nextTier!.tier}
              </button>
            )}
          </div>
        )}

        <button className="detail-toggle" onClick={() => setShowDetail(true)}>
          查看详情
        </button>
      </div>

      {showDetail && (
        <div className="bond-detail-overlay" onClick={() => setShowDetail(false)}>
          <div className="bond-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>

            <div className="bond-detail-header">
              <span className="bond-detail-icon">{group.icon}</span>
              <h3>{group.name}</h3>
              <p className="bond-detail-desc">{group.description}</p>
            </div>

            <div className="bond-detail-body">
              <div className="detail-section">
                <h4>所需身份</h4>
                <div className="detail-requirements">
                  {requiredIdentitiesStatus.map((req, i) => (
                    <div key={i} className={`detail-requirement ${req.isPresent ? 'present' : 'missing'}`}>
                      <span className="req-icon">{req.identity?.icon || '❓'}</span>
                      <div className="req-info">
                        <span className="req-name">{req.identity?.name || req.id}</span>
                        <span className="req-desc">{req.identity?.description || ''}</span>
                      </div>
                      <span className="req-status">{req.isPresent ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {group.tiers && group.tiers.length > 0 && (
                <div className="detail-section">
                  <h4>羁绊等级</h4>
                  <div className="tier-list">
                    {group.tiers.map((tier) => {
                      const isUnlocked = tier.tier <= currentTier;
                      const isClaimed = claimedRewards.includes(`${group.id}_tier${tier.tier}`);
                      return (
                        <div key={tier.tier} className={`tier-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                          <div className="tier-header">
                            <span className="tier-level">Tier {tier.tier}</span>
                            <span className="tier-name">{tier.name}</span>
                            <span className="tier-requirement">
                              需要 {tier.totalRelationshipRequired} 关系值
                            </span>
                          </div>
                          <p className="tier-desc">{tier.description}</p>
                          <div className="tier-reward">
                            <span className="reward-label">奖励:</span>
                            <span className="reward-summary">{getRewardSummary(tier.rewards)}</span>
                          </div>
                          {isClaimed && <span className="claimed-badge">已领取</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {group.rewards && group.rewards.length > 0 && !group.tiers && (
                <div className="detail-section">
                  <h4>基础奖励</h4>
                  <p className="reward-summary">{getRewardSummary(group.rewards)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BondGroupCard;
