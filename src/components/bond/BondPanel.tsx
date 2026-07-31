import React, { useState } from 'react';
import useBondStore from '../../stores/bondStore';
import { BOND_CARDS, BOND_GROUPS } from '../../data/bondCards';
import BondCard from './BondCard';
import BondGroupCard from './BondGroupCard';
import YearDrawModal from './YearDrawModal';
import './BondPanel.css';

type TabType = 'collection' | 'bonds' | 'history';

const BondPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDrawModal, setShowDrawModal] = useState(false);

  const collection = useBondStore((s) => s.collection);
  const activeBondGroups = useBondStore((s) => s.activeBondGroups);
  const drawHistory = useBondStore((s) => s.drawHistory);
  const currentDraw = useBondStore((s) => s.currentDraw);
  const drawChances = useBondStore((s) => s.drawChances);
  const getCollectionStats = useBondStore((s) => s.getCollectionStats);
  const performYearDraw = useBondStore((s) => s.performYearDraw);
  const getCardStarCounts = useBondStore((s) => s.getCardStarCounts);
  const getBestStarLevel = useBondStore((s) => s.getBestStarLevel);
  const canUpgradeCardStar = useBondStore((s) => s.canUpgradeCardStar);
  const upgradeCardStar = useBondStore((s) => s.upgradeCardStar);

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'family', name: '家人', icon: '👨‍👩‍👧' },
    { id: 'friendship', name: '友谊', icon: '🤝' },
    { id: 'education', name: '学业', icon: '📚' },
    { id: 'career', name: '事业', icon: '💼' },
    { id: 'romance', name: '爱情', icon: '💕' },
    { id: 'rival', name: '对手', icon: '⚔️' },
  ];

  const activeBondTiers = useBondStore((s) => s.activeBondTiers);
  const stats = getCollectionStats();
  const totalLevels = Object.values(activeBondTiers as Record<string, number>).reduce((a: number, b: number) => a + b, 0);

  const filteredCards = selectedCategory === 'all'
    ? BOND_CARDS
    : BOND_CARDS.filter((c) => c.category === selectedCategory);

  const isCardCollected = (cardId: string) => {
    return collection.some((c) => c.cardDefId === cardId);
  };

  const getDuplicateCount = (cardId: string) => {
    return collection.filter((c) => c.cardDefId === cardId).length;
  };

  const handleStartDraw = () => {
    if (drawChances <= 0) return;
    const currentYear = drawHistory.length > 0
      ? drawHistory[drawHistory.length - 1].year + 1
      : 1;
    const success = performYearDraw(currentYear);
    if (success) {
      setShowDrawModal(true);
    }
  };

  return (
    <div className="bond-panel">
      <div className="bond-panel-header">
        <div className="bond-panel-title-row">
          <div className="bond-panel-icon">
            <span>🎴</span>
          </div>
          <div className="bond-panel-title-text">
            <h2>羁绊卡牌</h2>
            <p className="bond-panel-subtitle">收集人生中的每一段缘分</p>
          </div>
        </div>
        <div className="bond-panel-stats">
          <div className="bond-stat-card">
            <div className="bond-stat-icon">🎴</div>
            <div className="bond-stat-content">
              <span className="bond-stat-number">{stats.unique}</span>
              <span className="bond-stat-label">/{BOND_CARDS.length} 收集</span>
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
              <span className="bond-stat-number bond-stat-gold">{totalLevels}</span>
              <span className="bond-stat-label">总等级</span>
            </div>
          </div>
        </div>

        <div className="bond-panel-progress">
          <div className="bond-progress-bar">
            <div
              className="bond-progress-fill"
              style={{ width: `${stats.completionRate * 100}%` }}
            />
          </div>
          <span className="bond-progress-text">收集完成度 {(stats.completionRate * 100).toFixed(1)}%</span>
        </div>

        <button
          className="bond-draw-btn"
          onClick={handleStartDraw}
          disabled={!!currentDraw || drawChances <= 0}
        >
          <span>🎲</span> 年度抽卡 {drawChances > 0 && `(${drawChances})`}
        </button>
      </div>

      <div className="bond-panel-tabs">
        <button
          className={`bond-tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <span className="bond-tab-icon">🎴</span>
          <span>收集图鉴</span>
        </button>
        <button
          className={`bond-tab ${activeTab === 'bonds' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonds')}
        >
          <span className="bond-tab-icon">🔗</span>
          <span>羁绊组合</span>
        </button>
        <button
          className={`bond-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="bond-tab-icon">📜</span>
          <span>抽卡记录</span>
        </button>
      </div>

      <div className="bond-panel-body">
        {activeTab === 'collection' && (
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

            {filteredCards.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">🎴</div>
                <h3>该分类暂无卡牌</h3>
              </div>
            ) : (
              <div className="bond-collection-grid">
                {filteredCards.map((card) => {
                  const collected = isCardCollected(card.id);
                  const duplicateCount = getDuplicateCount(card.id);
                  const starCounts = getCardStarCounts(card.id);
                  const bestStar = getBestStarLevel(card.id);
                  const canUpgrade1 = canUpgradeCardStar(card.id, 1);
                  const canUpgrade2 = canUpgradeCardStar(card.id, 2);

                  const handleUpgrade = (e: React.MouseEvent, fromStar: 1 | 2) => {
                    e.stopPropagation();
                    upgradeCardStar(card.id, fromStar);
                  };

                  return (
                    <div key={card.id} className="bond-collection-item">
                      <BondCard
                        card={card}
                        isCollected={collected}
                        starLevel={bestStar}
                      />
                      {duplicateCount > 1 && (
                        <div className="bond-duplicate-indicator">
                          ×{duplicateCount}
                        </div>
                      )}
                      {collected && (
                        <div className="bond-star-upgrade">
                          <div className="star-counts">
                            <span className="star-count">{starCounts[1]}★</span>
                            {starCounts[2] > 0 && <span className="star-count">{starCounts[2]}★★</span>}
                            {starCounts[3] > 0 && <span className="star-count gold">{starCounts[3]}★★★</span>}
                          </div>
                          <div className="upgrade-buttons">
                            {canUpgrade1 && (
                              <button
                                className="upgrade-btn from-1"
                                onClick={(e) => handleUpgrade(e, 1)}
                                title="3张1星合成1张2星"
                              >
                                3★→★★
                              </button>
                            )}
                            {canUpgrade2 && (
                              <button
                                className="upgrade-btn from-2"
                                onClick={(e) => handleUpgrade(e, 2)}
                                title="3张2星合成1张3星"
                              >
                                3★★→★★★
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bonds' && (
          <div className="bond-tab-content">
            {BOND_GROUPS.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">🔗</div>
                <h3>暂无羁绊组合</h3>
                <p>收集更多卡牌来解锁羁绊</p>
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

        {activeTab === 'history' && (
          <div className="bond-tab-content">
            <div className="bond-rewards-header">
              <h3>抽卡历史</h3>
              <span className="bond-rewards-count">{drawHistory.length} 次</span>
            </div>
            {drawHistory.length === 0 ? (
              <div className="bond-empty-state">
                <div className="bond-empty-icon">📜</div>
                <h3>还没有抽卡记录</h3>
                <p>完成每年操作后可以抽取羁绊卡牌</p>
              </div>
            ) : (
              <div className="bond-history-list">
                {[...drawHistory].reverse().map((record) => {
                  const selectedCard = BOND_CARDS.find((c) => c.id === record.selectedCardId);
                  return (
                    <div key={`${record.year}-${record.selectedCardId}`} className="bond-history-item">
                      <div className="bond-history-year">
                        <span>{record.year}岁</span>
                      </div>
                      <div className="bond-history-card">
                        <span className="bond-history-icon">{selectedCard?.icon || '❓'}</span>
                        <span className="bond-history-name">{selectedCard?.name || '未知'}</span>
                      </div>
                      <div className="bond-history-discarded">
                        丢弃 {record.discardedCards.length} 张
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showDrawModal && currentDraw && <YearDrawModal />}
    </div>
  );
};

export default BondPanel;
