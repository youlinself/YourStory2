import React, { useState } from 'react';
import type { NPCBond } from '../../types/bond';
import { IDENTITY_MAP } from '../../data/bondData';
import useBondStore from '../../stores/bondStore';
import './NPCCard.css';

interface NPCCardProps {
  npc: NPCBond;
}

const NPCCard: React.FC<NPCCardProps> = ({ npc }) => {
  const [showDetail, setShowDetail] = useState(false);
  const updateRelationship = useBondStore((s) => s.updateRelationship);

  const identity = IDENTITY_MAP[npc.identityId];
  const relationshipPercent = Math.min(100, npc.relationship);

  const getRelationshipLevel = (value: number): string => {
    if (value >= 80) return '至交';
    if (value >= 60) return '亲密';
    if (value >= 40) return '友好';
    if (value >= 20) return '熟悉';
    return '初识';
  };

  const getRelationshipColor = (value: number): string => {
    if (value >= 80) return '#ff6b9d';
    if (value >= 60) return '#c084fc';
    if (value >= 40) return '#60a5fa';
    if (value >= 20) return '#34d399';
    return '#9ca3af';
  };

  const handleInteraction = (delta: number) => {
    updateRelationship(npc.id, delta);
  };

  return (
    <>
      <div
        className={`npc-card ${npc.isActive ? 'active' : 'inactive'} ${npc.isGone ? 'gone' : ''}`}
        onClick={() => setShowDetail(true)}
      >
        <div className="npc-avatar">
          <span className="avatar-icon">{npc.avatar}</span>
          {npc.isActive && <span className="active-badge">✓</span>}
        </div>
        <div className="npc-info">
          <div className="npc-name-row">
            <span className="npc-name">{npc.name}</span>
            <span className="npc-identity">{identity?.name || '未知身份'}</span>
          </div>
          <div className="npc-traits">
            {npc.traits.slice(0, 2).map((trait, i) => (
              <span key={i} className="trait-tag">{trait}</span>
            ))}
          </div>
          <div className="relationship-bar-container">
            <div className="relationship-bar">
              <div
                className="relationship-fill"
                style={{
                  width: `${relationshipPercent}%`,
                  backgroundColor: getRelationshipColor(npc.relationship),
                }}
              />
            </div>
            <span className="relationship-value" style={{ color: getRelationshipColor(npc.relationship) }}>
              {getRelationshipLevel(npc.relationship)} ({npc.relationship})
            </span>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="npc-detail-overlay" onClick={() => setShowDetail(false)}>
          <div className="npc-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>

            <div className="detail-header">
              <div className="detail-avatar">
                <span className="detail-avatar-icon">{npc.avatar}</span>
              </div>
              <div className="detail-title">
                <h3>{npc.name}</h3>
                <span className="detail-identity">{identity?.name || '未知身份'}</span>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-section">
                <h4>身份信息</h4>
                <p className="detail-description">{identity?.description || '暂无描述'}</p>
              </div>

              <div className="detail-section">
                <h4>个人特质</h4>
                <div className="detail-traits">
                  {npc.traits.map((trait, i) => (
                    <span key={i} className="detail-trait-tag">{trait}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>关系进度</h4>
                <div className="detail-relationship">
                  <div className="detail-relationship-bar">
                    <div
                      className="detail-relationship-fill"
                      style={{
                        width: `${relationshipPercent}%`,
                        backgroundColor: getRelationshipColor(npc.relationship),
                      }}
                    />
                  </div>
                  <span className="detail-relationship-text">
                    {getRelationshipLevel(npc.relationship)} - {npc.relationship}/100
                  </span>
                </div>
                <p className="detail-hint">
                  {npc.isActive
                    ? '已激活，可以参与羁绊组合'
                    : `还需 ${npc.activationThreshold - npc.relationship} 点关系值激活`}
                </p>
              </div>

              <div className="detail-section">
                <h4>互动</h4>
                <div className="interaction-buttons">
                  <button
                    className="interaction-btn positive"
                    onClick={() => handleInteraction(5)}
                  >
                    <span>💬</span> 交流 (+5)
                  </button>
                  <button
                    className="interaction-btn positive"
                    onClick={() => handleInteraction(10)}
                  >
                    <span>🎁</span> 送礼 (+10)
                  </button>
                  <button
                    className="interaction-btn positive"
                    onClick={() => handleInteraction(15)}
                  >
                    <span>🤝</span> 帮助 (+15)
                  </button>
                  <button
                    className="interaction-btn negative"
                    onClick={() => handleInteraction(-5)}
                  >
                    <span>😤</span> 争执 (-5)
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4>相遇信息</h4>
                <p className="detail-met-age">在 {npc.metAge} 岁时相遇</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NPCCard;
