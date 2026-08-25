import React, { useState } from 'react';
import {
  GitBranch,
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  ArrowLeftRight,
  Eye,
  Trash2,
  Star,
} from 'lucide-react';
import type { DecisionPoint, RebirthExperience, NarrativeNode } from '@/types';

interface RebirthPanelProps {
  decisionPoints: DecisionPoint[];
  rebirthExperiences: RebirthExperience[];
  nodes: NarrativeNode[];
  onSelectForkPoint: (nodeId: string) => void;
  onCreateRebirth: (decisionPointId: string) => void;
  onCompareRebirth: (rebirthId: string) => void;
  onDeleteRebirth: (rebirthId: string) => void;
  isCreatingRebirth: boolean;
}

const regretLevelStars = (level: number) => {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
};

export const RebirthPanel: React.FC<RebirthPanelProps> = ({
  decisionPoints,
  rebirthExperiences,
  nodes,
  onSelectForkPoint,
  onCreateRebirth,
  onCompareRebirth,
  onDeleteRebirth,
  isCreatingRebirth,
}) => {
  const [activeTab, setActiveTab] = useState<'forks' | 'rebirths'>('forks');
  const [selectedForkNodeId, setSelectedForkNodeId] = useState<string | null>(null);

  const getNodeTitle = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.title || '未知节点';
  };

  const forkablePoints = decisionPoints.filter((dp) => dp.forkable);
  const regretPoints = forkablePoints.filter((dp) => dp.regretLevel >= 3);

  return (
    <div className="rebirth-panel">
      {/* Header */}
      <div className="rebirth-panel-header">
        <div className="rebirth-panel-icon">
          <Sparkles size={20} strokeWidth={1.5} className="text-brand" />
        </div>
        <div>
          <h3 className="rebirth-panel-title">重生体验</h3>
          <p className="rebirth-panel-subtitle">探索人生的另一种可能</p>
        </div>
      </div>

      {/* Stats */}
      <div className="rebirth-stats">
        <div className="rebirth-stat">
          <span className="rebirth-stat-value">{forkablePoints.length}</span>
          <span className="rebirth-stat-label">可分叉点</span>
        </div>
        <div className="rebirth-stat">
          <span className="rebirth-stat-value">{regretPoints.length}</span>
          <span className="rebirth-stat-label">遗憾节点</span>
        </div>
        <div className="rebirth-stat">
          <span className="rebirth-stat-value">{rebirthExperiences.length}</span>
          <span className="rebirth-stat-label">重生版本</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="rebirth-tabs">
        <button
          className={`rebirth-tab ${activeTab === 'forks' ? 'rebirth-tab-active' : ''}`}
          onClick={() => setActiveTab('forks')}
        >
          <GitBranch size={14} />
          <span>分叉点</span>
        </button>
        <button
          className={`rebirth-tab ${activeTab === 'rebirths' ? 'rebirth-tab-active' : ''}`}
          onClick={() => setActiveTab('rebirths')}
        >
          <Sparkles size={14} />
          <span>重生版本</span>
        </button>
      </div>

      {/* Content */}
      <div className="rebirth-panel-content">
        {activeTab === 'forks' ? (
          <div className="fork-points-list">
            {forkablePoints.length === 0 ? (
              <div className="rebirth-empty">
                <GitBranch size={32} strokeWidth={1} className="text-ink-faint" />
                <p className="rebirth-empty-text">
                  还没有可分叉的抉择点
                </p>
                <p className="rebirth-empty-hint">
                  在对话中标记抉择点后，就可以在这里开始重生体验
                </p>
              </div>
            ) : (
              <>
                {/* Recommended (High Regret) */}
                {regretPoints.length > 0 && (
                  <div className="fork-section">
                    <p className="fork-section-title">
                      <Star size={12} className="text-gold" />
                      推荐：遗憾度较高
                    </p>
                    {regretPoints.map((dp) => (
                      <ForkPointCard
                        key={dp.id}
                        decisionPoint={dp}
                        nodeTitle={getNodeTitle(dp.nodeId)}
                        isSelected={selectedForkNodeId === dp.nodeId}
                        onSelect={() => {
                          setSelectedForkNodeId(dp.nodeId);
                          onSelectForkPoint(dp.nodeId);
                        }}
                        onCreateRebirth={() => onCreateRebirth(dp.id)}
                        isCreating={isCreatingRebirth}
                      />
                    ))}
                  </div>
                )}

                {/* All Forkable Points */}
                <div className="fork-section">
                  {regretPoints.length > 0 && (
                    <p className="fork-section-title">所有可分叉点</p>
                  )}
                  {forkablePoints
                    .filter((dp) => dp.regretLevel < 3)
                    .map((dp) => (
                      <ForkPointCard
                        key={dp.id}
                        decisionPoint={dp}
                        nodeTitle={getNodeTitle(dp.nodeId)}
                        isSelected={selectedForkNodeId === dp.nodeId}
                        onSelect={() => {
                          setSelectedForkNodeId(dp.nodeId);
                          onSelectForkPoint(dp.nodeId);
                        }}
                        onCreateRebirth={() => onCreateRebirth(dp.id)}
                        isCreating={isCreatingRebirth}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rebirths-list">
            {rebirthExperiences.length === 0 ? (
              <div className="rebirth-empty">
                <Sparkles size={32} strokeWidth={1} className="text-ink-faint" />
                <p className="rebirth-empty-text">还没有重生版本</p>
                <p className="rebirth-empty-hint">
                  选择一个分叉点，开始创作你的平行人生
                </p>
              </div>
            ) : (
              rebirthExperiences.map((rebirth) => (
                <RebirthCard
                  key={rebirth.id}
                  rebirth={rebirth}
                  forkNodeTitle={getNodeTitle(rebirth.forkNodeId)}
                  onCompare={() => onCompareRebirth(rebirth.id)}
                  onDelete={() => onDeleteRebirth(rebirth.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ForkPointCardProps {
  decisionPoint: DecisionPoint;
  nodeTitle: string;
  isSelected: boolean;
  onSelect: () => void;
  onCreateRebirth: () => void;
  isCreating: boolean;
}

const ForkPointCard: React.FC<ForkPointCardProps> = ({
  decisionPoint,
  nodeTitle,
  isSelected,
  onSelect,
  onCreateRebirth,
  isCreating,
}) => {
  return (
    <div
      className={`fork-point-card ${isSelected ? 'fork-point-card-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="fork-point-header">
        <span className="fork-point-title">{nodeTitle}</span>
        <span className="fork-point-regret" title="遗憾度">
          {regretLevelStars(decisionPoint.regretLevel)}
        </span>
      </div>
      <p className="fork-point-content">
        "{decisionPoint.originalChoice.slice(0, 40)}..."
      </p>
      <div className="fork-point-footer">
        <span className="fork-point-rebirth-count">
          已重生 {decisionPoint.rebirthCount} 次
        </span>
        <button
          className="fork-point-create-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCreateRebirth();
          }}
          disabled={isCreating}
        >
          <Plus size={12} />
          <span>开始重生</span>
        </button>
      </div>
    </div>
  );
};

interface RebirthCardProps {
  rebirth: RebirthExperience;
  forkNodeTitle: string;
  onCompare: () => void;
  onDelete: () => void;
}

const RebirthCard: React.FC<RebirthCardProps> = ({
  rebirth,
  forkNodeTitle,
  onCompare,
  onDelete,
}) => {
  return (
    <div className="rebirth-card">
      <div className="rebirth-card-header">
        <span className="rebirth-card-title">{rebirth.title}</span>
        <button
          className="rebirth-card-delete"
          onClick={onDelete}
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="rebirth-card-meta">
        <span className="rebirth-card-fork">
          <GitBranch size={12} />
          从 "{forkNodeTitle}" 分叉
        </span>
        <span className="rebirth-card-date">
          <Clock size={12} />
          {new Date(rebirth.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
      <p className="rebirth-card-summary">{rebirth.diffSummary}</p>
      <div className="rebirth-card-footer">
        <span className="rebirth-card-nodes">
          {rebirth.nodes.length} 个节点
        </span>
        <div className="rebirth-card-actions">
          <button className="rebirth-card-action" onClick={onCompare}>
            <ArrowLeftRight size={12} />
            对比
          </button>
          <button className="rebirth-card-action">
            <Eye size={12} />
            查看
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RebirthPanel;
