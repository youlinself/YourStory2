import React, { useState } from 'react';
import useBondStore from '../../stores/bondStore';
import BondCard from './BondCard';
import './YearDrawModal.css';

const YearDrawModal: React.FC = () => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentDraw = useBondStore((s) => s.currentDraw);
  const collection = useBondStore((s) => s.collection);
  const selectCard = useBondStore((s) => s.selectCard);
  const cancelDraw = useBondStore((s) => s.cancelDraw);

  if (!currentDraw || !currentDraw.isSelecting) return null;

  const handleSelectCard = (cardId: string) => {
    if (isAnimating) return;
    setSelectedCardId(cardId);
  };

  const handleConfirm = () => {
    if (!selectedCardId || isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      selectCard(selectedCardId);
      setSelectedCardId(null);
      setIsAnimating(false);
    }, 500);
  };

  const handleCancel = () => {
    if (isAnimating) return;
    cancelDraw();
  };

  const isCardCollected = (cardId: string) => {
    return collection.some((c) => c.cardDefId === cardId);
  };

  return (
    <div className="year-draw-overlay">
      <div className={`year-draw-modal ${isAnimating ? 'animating' : ''}`}>
        <button className="year-draw-close" onClick={handleCancel} disabled={isAnimating}>
          ×
        </button>

        <div className="year-draw-header">
          <div className="year-draw-icon">🎴</div>
          <h2>{currentDraw.year}岁 - 羁绊抽卡</h2>
          <p className="year-draw-subtitle">
            从以下5张卡牌中选择1张加入你的羁绊收集
          </p>
        </div>

        <div className="year-draw-cards">
          {currentDraw.cards.map((card, index) => {
            const isCollected = isCardCollected(card.id);
            const isSelected = selectedCardId === card.id;

            return (
              <div
                key={card.id}
                className={`year-draw-card-wrapper ${isSelected ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BondCard
                  card={card}
                  isCollected={isCollected}
                  isDuplicate={isCollected}
                  isSelecting={true}
                  onClick={() => handleSelectCard(card.id)}
                />
                {isSelected && (
                  <div className="year-draw-selected-badge">
                    已选择
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="year-draw-actions">
          <button
            className="year-draw-btn secondary"
            onClick={handleCancel}
            disabled={isAnimating}
          >
            跳过今年
          </button>
          <button
            className="year-draw-btn primary"
            onClick={handleConfirm}
            disabled={!selectedCardId || isAnimating}
          >
            {isAnimating ? '选择中...' : '确认选择'}
          </button>
        </div>

        <div className="year-draw-hint">
          <p>💡 提示：重复的卡牌将转化为羁绊碎片，用于升级羁绊等级</p>
        </div>
      </div>
    </div>
  );
};

export default YearDrawModal;
