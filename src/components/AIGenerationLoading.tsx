import React, { useEffect, useState } from 'react';
import type { AIGenerationPhase } from '../types/simulation';

interface AIGenerationLoadingProps {
  isVisible: boolean;
  phase: AIGenerationPhase;
  progress: number;
  estimatedDuration: number;
  startTime: number;
}

const PHASE_LABELS: Record<AIGenerationPhase, string> = {
  idle: '准备中',
  preparing: '正在准备',
  generating_events: '生成事件',
  generating_monsters: '生成怪物',
  generating_boss: '生成Boss',
  generating_shop: '生成商店',
  finalizing: '完成中',
};

const PHASE_ICONS: Record<AIGenerationPhase, string> = {
  idle: '⏳',
  preparing: '🔧',
  generating_events: '📜',
  generating_monsters: '👹',
  generating_boss: '💀',
  generating_shop: '🏪',
  finalizing: '✨',
};

export const AIGenerationLoading: React.FC<AIGenerationLoadingProps> = ({
  isVisible,
  phase,
  progress,
  estimatedDuration,
  startTime,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, startTime]);

  useEffect(() => {
    if (!isVisible) return;

    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
  const remainingSeconds = Math.max(0, ((estimatedDuration - elapsedTime) / 1000)).toFixed(0);
  const displayProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          fontSize: '48px',
          textAlign: 'center',
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          {PHASE_ICONS[phase]}
        </div>

        <h2 style={{
          color: '#fff',
          textAlign: 'center',
          fontSize: '20px',
          margin: '0 0 10px 0',
          fontWeight: 600,
        }}>
          AI 正在生成内容{dots}
        </h2>

        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          fontSize: '14px',
          margin: '0 0 25px 0',
        }}>
          {PHASE_LABELS[phase]}{dots}
        </p>

        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}>
          <div style={{
            width: `${displayProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)',
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
        }}>
          <span>已用时间: {elapsedSeconds}s</span>
          <span>预计剩余: {remainingSeconds}s</span>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            margin: 0,
            textAlign: 'center',
          }}>
            💡 AI正在根据你的游戏表现智能调整难度
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default AIGenerationLoading;
