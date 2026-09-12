import React, { useEffect, useState } from 'react';
import type { AIGenerationPhase } from '../types/simulation';
import {
  Hourglass, Wrench, ScrollText, Ghost, Swords, Layers, Heart, Skull,
  Puzzle, CircleCheck, CircleX, Lightbulb, type LucideIcon,
} from 'lucide-react';

interface AIGenerationLoadingProps {
  isVisible: boolean;
  phase: AIGenerationPhase;
  progress: number;
  estimatedDuration: number;
  startTime: number;
  currentStep?: number;
  totalSteps?: number;
  message?: string;
}

const PHASE_LABELS: Record<AIGenerationPhase, string> = {
  idle: '准备中',
  preparing: '正在准备',
  generating_events: '生成事件',
  generating_enemies: '生成普通怪物',
  generating_elites: '生成精英怪物',
  generating_shop_cards: '生成商店卡牌',
  generating_bond_cards: '生成羁绊卡片',
  generating_boss: '生成Boss',
  assembling: '组装内容',
  complete: '生成完成',
  error: '生成失败',
};

const PHASE_ICONS: Record<AIGenerationPhase, LucideIcon> = {
  idle: Hourglass,
  preparing: Wrench,
  generating_events: ScrollText,
  generating_enemies: Ghost,
  generating_elites: Swords,
  generating_shop_cards: Layers,
  generating_bond_cards: Heart,
  generating_boss: Skull,
  assembling: Puzzle,
  complete: CircleCheck,
  error: CircleX,
};

export const AIGenerationLoading: React.FC<AIGenerationLoadingProps> = ({
  isVisible,
  phase,
  progress,
  estimatedDuration,
  startTime,
  currentStep = 0,
  totalSteps = 0,
  message = '',
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
  const PhaseIcon = PHASE_ICONS[phase];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="mx-4 w-[90%] max-w-[400px] rounded-2xl border border-border-subtle bg-bg-elevated p-10 shadow-lg">
        <div className="mb-5 flex justify-center">
          <PhaseIcon className="h-12 w-12 text-brand" strokeWidth={1.5} />
        </div>

        <h2 className="mb-2.5 text-center text-xl font-semibold text-ink">
          AI 正在生成内容{dots}
        </h2>

        <p className="mb-2.5 text-center text-sm text-ink-secondary">
          {PHASE_LABELS[phase]}{dots}
        </p>

        {message && (
          <p className="mb-4 text-center text-xs text-ink-tertiary">
            {message}
          </p>
        )}

        {totalSteps > 0 && (
          <p className="mb-4 text-center text-[11px] text-ink-muted">
            步骤 {currentStep} / {totalSteps}
          </p>
        )}

        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-ink-muted">
          <span>已用时间: {elapsedSeconds}s</span>
          <span>预计剩余: {remainingSeconds}s</span>
        </div>

        <div className="mt-5 rounded-lg border border-brand-light bg-brand-surface p-3">
          <p className="m-0 flex items-center justify-center gap-1.5 text-center text-xs text-ink-tertiary">
            <Lightbulb className="h-3.5 w-3.5 text-gold" />
            AI正在根据你的游戏表现智能调整难度
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationLoading;
