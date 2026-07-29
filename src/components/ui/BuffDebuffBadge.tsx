import React from 'react';
import Tooltip from '../common/Tooltip';

export interface BuffDebuffInfo {
  type: string;
  value: number;
  duration: number;
}

interface BuffDebuffBadgeProps {
  buff: BuffDebuffInfo;
}

const BUFF_DEBUFF_CONFIG: Record<string, { icon: string; name: string; color: string; bgColor: string; borderColor: string; description: (value: number, duration: number) => string }> = {
  strength: {
    icon: '💪',
    name: '力量',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: (value, duration) => `攻击力 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  weak: {
    icon: '😰',
    name: '虚弱',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: (value, duration) => `攻击力降低 ${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  vulnerable: {
    icon: '💔',
    name: '脆弱',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: (value, duration) => `受到伤害增加 ${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  poison: {
    icon: '☠️',
    name: '中毒',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: (value, duration) => `每回合损失 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  rage: {
    icon: '😡',
    name: '狂暴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: (value, duration) => `攻击力 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  regen: {
    icon: '💚',
    name: '回复',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: (value, duration) => `每回合回复 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  shields: {
    icon: '🛡️',
    name: '护盾',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: (value, duration) => `吸收 ${value} 点伤害${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  thorns: {
    icon: '🌹',
    name: '荆棘',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: (value, duration) => `反弹 ${value} 点伤害给攻击者${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  dexterity: {
    icon: '🏃',
    name: '敏捷',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: (value, duration) => `格挡获得 +${value}${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  block: {
    icon: '🛡️',
    name: '格挡',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: (value, _duration) => `当前格挡值 ${value}`,
  },
  artifact: {
    icon: '🔮',
    name: '神器',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: (value, duration) => `受到法术伤害减少 ${value} 点${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  intangible: {
    icon: '👻',
    name: '虚无',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: (_value, duration) => `受到所有伤害减少为 1 点${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  stealth: {
    icon: '🌑',
    name: '潜行',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: (_value, duration) => `无法被攻击${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  lifedrain: {
    icon: '🩸',
    name: '吸取',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: (value, duration) => `每次攻击吸取 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
  lifesteal: {
    icon: '🧛',
    name: '吸血',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: (value, duration) => `每次攻击回复 ${value} 点生命${duration === Infinity ? '，永久' : `，持续 ${duration} 回合`}`,
  },
};

const BuffDebuffBadge: React.FC<BuffDebuffBadgeProps> = ({ buff }) => {
  const config = BUFF_DEBUFF_CONFIG[buff.type];
  
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 border border-gray-200 text-gray-600">
        {buff.type}:{buff.value}
      </span>
    );
  }

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold text-xs">
        {config.icon} {config.name}
      </div>
      <div className="text-[10px] text-gray-300">
        {config.description(buff.value, buff.duration)}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${config.bgColor} ${config.borderColor} ${config.color} border cursor-help`}>
        <span>{config.icon}</span>
        <span className="font-medium">{buff.value}</span>
        <span className="text-[9px] opacity-70">{buff.duration === Infinity ? '∞' : buff.duration}</span>
      </span>
    </Tooltip>
  );
};

export default BuffDebuffBadge;
