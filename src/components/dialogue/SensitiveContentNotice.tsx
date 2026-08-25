import React, { useState } from 'react';
import { AlertTriangle, Shield, SkipForward, Eye, EyeOff, X } from 'lucide-react';

interface SensitiveContentNoticeProps {
  onSkip: () => void;
  onMarkSensitive: () => void;
  onContinueAnyway: () => void;
  onWriteFactOnly: () => void;
}

export const SensitiveContentNotice: React.FC<SensitiveContentNoticeProps> = ({
  onSkip,
  onMarkSensitive,
  onContinueAnyway,
  onWriteFactOnly,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="sensitive-notice">
      <div className="sensitive-notice-header">
        <div className="sensitive-notice-icon">
          <AlertTriangle size={18} strokeWidth={1.5} />
        </div>
        <div className="sensitive-notice-text">
          <p className="sensitive-notice-title">你似乎写到了比较沉重的经历</p>
          <p className="sensitive-notice-desc">我们理解这可能不容易。你可以选择以下方式继续：</p>
        </div>
        <button
          className="sensitive-notice-close"
          onClick={() => setIsDismissed(true)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="sensitive-notice-actions">
        <button className="sensitive-action-btn" onClick={onSkip}>
          <SkipForward size={14} />
          <span>暂时跳过，先写别的</span>
        </button>
        <button className="sensitive-action-btn" onClick={onWriteFactOnly}>
          <Eye size={14} />
          <span>只写事实，不写感受</span>
        </button>
        <button className="sensitive-action-btn sensitive-action-btn-primary" onClick={onMarkSensitive}>
          <Shield size={14} />
          <span>标记为敏感，不再深挖</span>
        </button>
        <button className="sensitive-action-btn sensitive-action-btn-ghost" onClick={onContinueAnyway}>
          <EyeOff size={14} />
          <span>继续书写</span>
        </button>
      </div>
    </div>
  );
};

interface PositiveReinforcementProps {
  message: string;
  type?: 'success' | 'encouragement' | 'milestone';
}

export const PositiveReinforcement: React.FC<PositiveReinforcementProps> = ({
  message,
  type = 'encouragement',
}) => {
  const icons = {
    success: '✨',
    encouragement: '💛',
    milestone: '🎉',
  };

  return (
    <div className={`positive-reinforcement positive-reinforcement-${type}`}>
      <span className="positive-reinforcement-icon">{icons[type]}</span>
      <span className="positive-reinforcement-text">{message}</span>
    </div>
  );
};

export default SensitiveContentNotice;
