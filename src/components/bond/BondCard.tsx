import React from 'react';
import type { BondCardDefinition } from '../../types/bond';
import { RARITY_CONFIG } from '../../data/bondCards';
import './BondCard.css';

interface BondCardProps {
  card: BondCardDefinition;
  isCollected?: boolean;
  isDuplicate?: boolean;
  isNew?: boolean;
  isSelecting?: boolean;
  starLevel?: 1 | 2 | 3;
  onClick?: () => void;
}

const BondCard: React.FC<BondCardProps> = ({
  card,
  isCollected = false,
  isDuplicate = false,
  isNew = false,
  isSelecting = false,
  starLevel = 1,
  onClick,
}) => {
  const rarityConfig = RARITY_CONFIG[card.rarity];

  const cardStyle = {
    '--rarity-color': rarityConfig.color,
    '--rarity-bg': rarityConfig.bgColor,
    '--rarity-glow': rarityConfig.glowColor,
  } as React.CSSProperties;

  const stars = '★'.repeat(starLevel) + '☆'.repeat(3 - starLevel);

  return (
    <div
      className={`bond-card ${isCollected ? 'collected' : ''} ${isDuplicate ? 'duplicate' : ''} ${isNew ? 'new' : ''} ${isSelecting ? 'selecting' : ''} rarity-${card.rarity} star-${starLevel}`}
      style={cardStyle}
      onClick={onClick}
    >
      <div className="bond-card-inner">
        <div className="bond-card-rarity-badge" style={{ backgroundColor: rarityConfig.bgColor, color: rarityConfig.color }}>
          {rarityConfig.label}
        </div>

        {starLevel > 1 && (
          <div className="bond-card-star-badge" style={{ color: starLevel === 3 ? '#fbbf24' : starLevel === 2 ? '#60a5fa' : '#9ca3af' }}>
            {stars}
          </div>
        )}

        {isDuplicate && (
          <div className="bond-card-duplicate-badge">
            重复
          </div>
        )}

        {isNew && (
          <div className="bond-card-new-badge">
            新
          </div>
        )}

        <div className="bond-card-icon">
          <span>{card.icon}</span>
        </div>

        <div className="bond-card-info">
          <h4 className="bond-card-name">{card.name}</h4>
          <p className="bond-card-desc">{card.description}</p>
        </div>

        <div className="bond-card-flavor">
          <p>"{card.flavorText}"</p>
        </div>

        {!isCollected && !isSelecting && (
          <div className="bond-card-locked">
            <span>🔒</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BondCard;
