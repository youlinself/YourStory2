import React, { useState } from 'react';
import type { BondGroupDefinition } from '../../types/bond';
import { BOND_CARD_MAP, ATTRIBUTE_NAMES } from '../../data/bondCards';
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
  const collection = useBondStore((s) => s.collection);
  const activateBondGroup = useBondStore((s) => s.activateBondGroup);
  const claimReward = useBondStore((s) => s.claimReward);
  const canUpgradeTier = useBondStore((s) => s.canUpgradeTier);
  const upgradeTier = useBondStore((s) => s.upgradeTier);
  const getBondGroupStatus = useBondStore((s) => s.getBondGroupStatus);

  const isActive = activeBondGroups.includes(group.id);
  const currentTier = activeBondTiers[group.id] || 0;
  const maxTier = group.tiers?.length || 1;

  const collectedCardIds = [...new Set(collection.map((c) => c.cardDefId))];

  const requiredCardsStatus = group.requiredCards.map((id) => ({
    id,
    card: BOND_CARD_MAP[id],
    isCollected: collectedCardIds.includes(id),
  }));

  const allRequiredCollected = group.requireAll
    ? requiredCardsStatus.every((r) => r.isCollected)
    : requiredCardsStatus.some((r) => r.isCollected);

  const collectedCount = requiredCardsStatus.filter((r) => r.isCollected).length;
  const requiredCount = group.requiredCards.length;

  const status = getBondGroupStatus(group.id);
  const canUpgrade = canUpgradeTier(group.id);

  const getNextTier = () => {
    if (!group.tiers) return null;
    return group.tiers.find((t) => t.tier > currentTier);
  };

  const nextTier = getNextTier();

  const handleActivate = () => {
    if (!isActive && allRequiredCollected) {
      activateBondGroup(group.id);
      claimReward(group.id, 0);
    }
  };

  const handleUpgrade = () => {
    if (canUpgrade && nextTier) {
      upgradeTier(group.id);
      claimReward(group.id, nextTier.tier);
    }
  };

  const getRewardSummary = (rewards: BondGroupDefinition['rewards']): string => {
    const parts: string[] = [];
    for (const r of rewards) {
      if (r.attributeBonus) {
        const attrs = Object.entries(r.attributeBonus)
          .map(([k, v]) => `${ATTRIBUTE_NAMES[k] || k}+${v}`)
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
            ) : allRequiredCollected ? (
              <button className="activate-btn" onClick={handleActivate}>
                激活
              </button>
            ) : (
              <span className="status-badge locked">未满足</span>
            )}
          </div>
        </div>

        <div className="bond-group-requirements">
          <span className="requirements-label">需要卡牌:</span>
          <div className="requirements-list">
            {requiredCardsStatus.map((req, i) => (
              <span
                key={i}
                className={`requirement-tag ${req.isCollected ? 'present' : 'missing'}`}
              >
                {req.card?.icon || '❓'} {req.card?.name || '未知'}
                {req.isCollected ? ' ✓' : ' ✗'}
              </span>
            ))}
          </div>
        </div>

        <div className="bond-group-progress">
          <div className="progress-text">
            收集进度: {collectedCount}/{requiredCount}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(collectedCount / requiredCount) * 100}%` }}
            />
          </div>
        </div>

        {isActive && group.tiers && group.tiers.length > 0 && (
          <div className="bond-group-tiers">
            <div className="tier-progress">
              <span className="current-tier">
                当前等级: {currentTier} / {maxTier}
              </span>
              {nextTier && (
                <span className="next-tier">
                  下一级需要: {status.duplicateCount}/{nextTier.duplicateCardsRequired} 羁绊碎片
                </span>
              )}
            </div>
            {nextTier && (
              <div className="tier-progress-bar">
                <div
                  className="tier-progress-fill"
                  style={{
                    width: `${Math.min(100, (status.duplicateCount / nextTier.duplicateCardsRequired) * 100)}%`,
                  }}
                />
              </div>
            )}
            {canUpgrade && (
              <button className="upgrade-btn" onClick={handleUpgrade}>
                升级到等级 {nextTier!.tier}
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
                <h4>所需卡牌</h4>
                <div className="detail-requirements">
                  {requiredCardsStatus.map((req, i) => (
                    <div key={i} className={`detail-requirement ${req.isCollected ? 'present' : 'missing'}`}>
                      <span className="req-icon">{req.card?.icon || '❓'}</span>
                      <div className="req-info">
                        <span className="req-name">{req.card?.name || '未知'}</span>
                        <span className="req-desc">{req.card?.description || ''}</span>
                      </div>
                      <span className="req-status">{req.isCollected ? '✓' : '✗'}</span>
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
                            <span className="tier-level">等级 {tier.tier}</span>
                            <span className="tier-name">{tier.name}</span>
                            <span className="tier-requirement">
                              需要 {tier.duplicateCardsRequired} 羁绊碎片
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
