import React from 'react';
import Tooltip from '../common/Tooltip';
import {
  Dumbbell, TrendingDown, ShieldOff, Skull, Flame, HeartPulse, Shield,
  Flower2, Wind, Gem, Ghost, EyeOff, Droplet, Heart, type LucideIcon,
} from 'lucide-react';

export interface BuffDebuffInfo {
  type: string;
  value: number;
  duration: number;
}

interface BuffDebuffBadgeProps {
  buff: BuffDebuffInfo;
}

type BuffTone = 'danger' | 'info' | 'success' | 'warning' | 'power' | 'muted';

const TONE_CLASSES: Record<BuffTone, string> = {
  danger: 'text-danger bg-danger-bg border-danger/20',
  info: 'text-info bg-info-light border-info/20',
  success: 'text-success bg-success-bg border-success/20',
  warning: 'text-warning bg-warning-bg border-warning/20',
  power: 'text-power bg-power-light border-power/20',
  muted: 'text-ink-secondary bg-bg-subtle border-border',
};

const BUFF_DEBUFF_CONFIG: Record<string, { icon: LucideIcon; name: string; tone: BuffTone; description: (value: number, duration: number) => string }> = {
  strength: {
    icon: Dumbbell,
    name: '力量',
    tone: 'danger',
    description: (value, duration) => `攻击力 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  weak: {
    icon: TrendingDown,
    name: '虚弱',
    tone: 'power',
    description: (value, duration) => `攻击力降低 ${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  vulnerable: {
    icon: ShieldOff,
    name: '脆弱',
    tone: 'warning',
    description: (value, duration) => `受到伤害增加 ${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  poison: {
    icon: Skull,
    name: '中毒',
    tone: 'success',
    description: (value, duration) => `每回合损失 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  rage: {
    icon: Flame,
    name: '狂暴',
    tone: 'danger',
    description: (value, duration) => `攻击力 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  regen: {
    icon: HeartPulse,
    name: '回复',
    tone: 'success',
    description: (value, duration) => `每回合回复 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  shields: {
    icon: Shield,
    name: '护盾',
    tone: 'info',
    description: (value, duration) => `吸收 ${value} 点伤害${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  thorns: {
    icon: Flower2,
    name: '荆棘',
    tone: 'danger',
    description: (value, duration) => `反弹 ${value} 点伤害给攻击者${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  dexterity: {
    icon: Wind,
    name: '敏捷',
    tone: 'info',
    description: (value, duration) => `格挡获得 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  block: {
    icon: Shield,
    name: '格挡',
    tone: 'info',
    description: (value, _duration) => `当前格挡值 ${value}`,
  },
  artifact: {
    icon: Gem,
    name: '神器',
    tone: 'power',
    description: (value, duration) => `受到法术伤害减少 ${value} 点${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  intangible: {
    icon: Ghost,
    name: '虚无',
    tone: 'muted',
    description: (_value, duration) => `受到所有伤害减少为 1 点${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  stealth: {
    icon: EyeOff,
    name: '潜行',
    tone: 'muted',
    description: (_value, duration) => `无法被攻击${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  lifedrain: {
    icon: Droplet,
    name: '吸取',
    tone: 'danger',
    description: (value, duration) => `每次攻击吸取 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  lifesteal: {
    icon: Heart,
    name: '吸血',
    tone: 'danger',
    description: (value, duration) => `每次攻击回复 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
};

const BuffDebuffBadge: React.FC<BuffDebuffBadgeProps> = ({ buff }) => {
  const config = BUFF_DEBUFF_CONFIG[buff.type];

  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-border bg-bg-subtle px-1.5 py-0.5 text-[10px] text-ink-secondary">
        {buff.type}:{buff.value}
      </span>
    );
  }

  const Icon = config.icon;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Icon className="h-3.5 w-3.5" />
        {config.name}
      </div>
      <div className="text-[10px] opacity-80">
        {config.description(buff.value, buff.duration)}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <span className={`inline-flex cursor-help items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${TONE_CLASSES[config.tone]}`}>
        <Icon className="h-3 w-3" />
        <span className="font-medium">{buff.value}</span>
        <span className="text-[10px] opacity-70">{buff.duration === Infinity ? '∞' : buff.duration}</span>
      </span>
    </Tooltip>
  );
};

export default BuffDebuffBadge;
