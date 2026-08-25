import React, { useState } from 'react';
import {
  Heart,
  Star,
  AlertTriangle,
  GitBranch,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Trash2,
} from 'lucide-react';
import type { NarrativeNode, EventType } from '@/types';

interface NarrativeNodeCardProps {
  node: NarrativeNode;
  onEdit?: (nodeId: string, content: string) => void;
  onDelete?: (nodeId: string) => void;
  onMarkDecision?: (nodeId: string) => void;
  onTagEmotion?: (nodeId: string, tags: string[]) => void;
  onToggleSensitive?: (nodeId: string) => void;
  compact?: boolean;
}

const eventTypeConfig: Record<EventType, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  active_choice: {
    label: '主动选择',
    color: 'text-brand',
    bgColor: 'bg-brand-light',
    icon: <Star size={12} />,
  },
  passive_event: {
    label: '被动事件',
    color: 'text-sage',
    bgColor: 'bg-sage-light',
    icon: <GitBranch size={12} />,
  },
  emotional_turning: {
    label: '情感转折',
    color: 'text-gold',
    bgColor: 'bg-gold-light',
    icon: <Heart size={12} />,
  },
  regret_node: {
    label: '遗憾节点',
    color: 'text-danger',
    bgColor: 'bg-danger-bg',
    icon: <AlertTriangle size={12} />,
  },
};

const emotionOptions = [
  '遗憾', '感恩', '释然', '愤怒', '怀念', '庆幸', '后悔', '自豪', '困惑', '温暖',
];

const stageLabels: Record<string, string> = {
  childhood: '童年',
  school: '求学',
  work: '工作',
  marriage: '婚姻',
  parenthood: '为人父母',
  retirement: '退休',
  other: '其他',
};

export const NarrativeNodeCard: React.FC<NarrativeNodeCardProps> = ({
  node,
  onEdit,
  onDelete,
  onMarkDecision,
  onTagEmotion,
  onToggleSensitive,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);

  const typeConfig = eventTypeConfig[node.type];

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(node.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleToggleEmotionTag = (tag: string) => {
    const newTags = node.emotionTags.includes(tag)
      ? node.emotionTags.filter((t) => t !== tag)
      : [...node.emotionTags, tag];
    if (onTagEmotion) {
      onTagEmotion(node.id, newTags);
    }
  };

  if (compact) {
    return (
      <div className="node-card node-card-compact">
        <div className="node-card-compact-header">
          <span className={`node-type-badge ${typeConfig.bgColor} ${typeConfig.color}`}>
            {typeConfig.icon}
            <span>{typeConfig.label}</span>
          </span>
          {node.isSensitive && <Lock size={12} className="text-ink-muted" />}
        </div>
        <p className="node-card-compact-content">{node.content.slice(0, 60)}...</p>
        <div className="node-card-compact-footer">
          <span className="node-word-count">{node.wordCount} 字</span>
          {node.isDecisionPoint && (
            <span className="node-decision-badge">
              <GitBranch size={10} />
              抉择点
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`node-card ${node.isDecisionPoint ? 'node-card-decision' : ''} ${node.isSensitive ? 'node-card-sensitive' : ''}`}>
      {/* Header */}
      <div className="node-card-header">
        <div className="node-card-header-left">
          <span className={`node-type-badge ${typeConfig.bgColor} ${typeConfig.color}`}>
            {typeConfig.icon}
            <span>{typeConfig.label}</span>
          </span>
          <span className="node-stage-badge">{stageLabels[node.stage]}</span>
          {node.isDecisionPoint && (
            <span className="node-decision-badge">
              <GitBranch size={10} />
              抉择点
            </span>
          )}
          {node.isSensitive && (
            <span className="node-sensitive-badge">
              <Lock size={10} />
              敏感
            </span>
          )}
        </div>
        <div className="node-card-header-right">
          <button
            className="node-card-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '收起' : '展开'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="node-card-title">{node.title}</h4>

      {/* Content */}
      {isExpanded && (
        <div className="node-card-body">
          {isEditing ? (
            <div className="node-card-edit">
              <textarea
                className="node-card-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
              <div className="node-card-edit-actions">
                <button className="btn btn-sm btn-primary" onClick={handleSaveEdit}>
                  <Check size={14} />
                  保存
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setEditContent(node.content);
                    setIsEditing(false);
                  }}
                >
                  <X size={14} />
                  取消
                </button>
              </div>
            </div>
          ) : (
            <p className="node-card-content">{node.content}</p>
          )}

          {/* Emotion Tags */}
          {node.emotionTags.length > 0 && (
            <div className="node-emotion-tags">
              {node.emotionTags.map((tag) => (
                <span key={tag} className="emotion-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Reason for decision */}
          {node.reason && (
            <div className="node-reason">
              <span className="node-reason-label">选择原因：</span>
              <span className="node-reason-text">{node.reason}</span>
            </div>
          )}

          {/* Emotion Note */}
          {node.emotionNote && (
            <div className="node-emotion-note">
              <Heart size={12} className="text-gold" />
              <span>{node.emotionNote}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="node-card-footer">
            <div className="node-card-footer-left">
              <button
                className="node-action-btn"
                onClick={() => setIsEditing(true)}
                title="编辑"
              >
                <Edit3 size={14} />
                <span>编辑</span>
              </button>
              <button
                className="node-action-btn"
                onClick={() => setShowEmotionPicker(!showEmotionPicker)}
                title="情感标签"
              >
                <Heart size={14} />
                <span>情感</span>
              </button>
              {!node.isDecisionPoint && onMarkDecision && (
                <button
                  className="node-action-btn"
                  onClick={() => onMarkDecision(node.id)}
                  title="标记为抉择点"
                >
                  <GitBranch size={14} />
                  <span>抉择</span>
                </button>
              )}
              {onToggleSensitive && (
                <button
                  className="node-action-btn"
                  onClick={() => onToggleSensitive(node.id)}
                  title={node.isSensitive ? '取消敏感标记' : '标记为敏感'}
                >
                  <Lock size={14} />
                  <span>{node.isSensitive ? '取消敏感' : '敏感'}</span>
                </button>
              )}
            </div>
            <div className="node-card-footer-right">
              <span className="node-word-count">{node.wordCount} 字</span>
              {onDelete && (
                <button
                  className="node-action-btn node-action-btn-danger"
                  onClick={() => onDelete(node.id)}
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Emotion Picker */}
          {showEmotionPicker && (
            <div className="emotion-picker">
              <p className="emotion-picker-title">选择情感标签（可多选）</p>
              <div className="emotion-picker-tags">
                {emotionOptions.map((tag) => (
                  <button
                    key={tag}
                    className={`emotion-picker-tag ${node.emotionTags.includes(tag) ? 'emotion-picker-tag-active' : ''}`}
                    onClick={() => handleToggleEmotionTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NarrativeNodeCard;
