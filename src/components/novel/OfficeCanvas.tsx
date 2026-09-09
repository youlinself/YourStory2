import React, { useMemo } from 'react';
import useThinkTankStore from '../../stores/thinkTankStore';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import type { ThinkTankMember } from '../../types/writing';
import { ROLE_TASK_COMPATIBILITY } from '../../agent/workshop/types';

interface WorkstationProps {
  member: ThinkTankMember;
  index: number;
  isActive: boolean;
  currentTaskTitle?: string;
}

const ROLE_ICONS: Record<string, string> = {
  plot_writer: '📝',
  character_designer: '👤',
  world_builder: '🌍',
  dialogue_specialist: '💬',
  style_polisher: '✨',
  creative_consultant: '💡',
  custom: '⚙️',
};

const ROLE_COLORS: Record<string, string> = {
  plot_writer: '#da7756',
  character_designer: '#2d7bb9',
  world_builder: '#7a9e7e',
  dialogue_specialist: '#c9a96e',
  style_polisher: '#9b59b6',
  creative_consultant: '#e67e22',
  custom: '#95a5a6',
};

const TypingAnimation: React.FC = () => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10">
    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const ThinkingAnimation: React.FC = () => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100">
    <span className="text-xs animate-pulse">💭</span>
    <span className="text-[10px] text-amber-700">思考中</span>
  </div>
);

const IdleAnimation: React.FC = () => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    <span className="text-[10px] text-gray-500">待命中</span>
  </div>
);

const WorkstationCard: React.FC<WorkstationProps> = ({ member, index, isActive, currentTaskTitle }) => {
  const color = ROLE_COLORS[member.role] || '#95a5a6';
  const icon = ROLE_ICONS[member.role] || '🤖';
  const roles = ROLE_TASK_COMPATIBILITY[member.role] || [];

  const col = index % 3;
  const row = Math.floor(index / 3);
  const xOffset = col * 220 + (row % 2 === 1 ? 30 : 0);

  return (
    <div
      className={`workstation-card absolute transition-all duration-500 ${isActive ? 'workstation-active' : ''}`}
      style={{
        left: `${xOffset}px`,
        top: `${row * 180}px`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        className={`relative w-[200px] rounded-xl border-2 p-3 transition-all duration-300 ${
          isActive
            ? 'border-brand bg-white shadow-lg shadow-brand/20 scale-105'
            : 'border-border-subtle bg-white/80 hover:border-border-emphasis hover:shadow-md'
        }`}
        style={{ borderTopColor: color, borderTopWidth: '3px' }}
      >
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand animate-ping" />
        )}

        <div className="flex items-start gap-2 mb-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
              isActive ? 'animate-float' : ''
            }`}
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-ink truncate">{member.name}</h4>
            <p className="text-[10px] text-ink-muted truncate">{member.description || 'AI创作专家'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          {isActive ? (
            currentTaskTitle ? <TypingAnimation /> : <ThinkingAnimation />
          ) : (
            <IdleAnimation />
          )}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {roles.length} 项专长
          </span>
        </div>

        {isActive && currentTaskTitle && (
          <div className="mt-2 p-2 rounded-lg bg-brand/5 border border-brand/10">
            <p className="text-[10px] text-brand font-medium truncate">
              📋 {currentTaskTitle}
            </p>
          </div>
        )}

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full" style={{ backgroundColor: color }} />
      </div>

      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1">
        <div className="w-16 h-8 rounded-b-lg bg-gradient-to-b from-gray-200 to-gray-100 border border-t-0 border-gray-300 flex items-center justify-center">
          <div className="w-10 h-1 rounded bg-gray-300" />
        </div>
      </div>
    </div>
  );
};

const OfficeCanvas: React.FC = () => {
  const { members } = useThinkTankStore();
  const { currentTask, isRunning, subtasks } = useAIWorkshopStore();

  const enabledMembers = members.filter((m) => m.isEnabled);

  const activeMemberIds = useMemo(() => {
    if (!isRunning) return new Set<string>();
    return new Set(
      subtasks
        .filter((st) => st.status === 'executing')
        .map((st) => st.memberId)
    );
  }, [isRunning, subtasks]);

  const currentTaskTitle = currentTask?.title;

  const canvasHeight = useMemo(() => {
    const rows = Math.ceil(enabledMembers.length / 3);
    return Math.max(rows * 180 + 100, 280);
  }, [enabledMembers.length]);

  return (
    <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏢</span>
          <div>
            <h3 className="text-sm font-semibold text-ink">AI办公室</h3>
            <p className="text-[10px] text-ink-muted">实时工作状态监控</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-ink-muted">
              {enabledMembers.length} 人在岗
            </span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand/10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              <span className="text-[10px] text-brand font-medium">工作中</span>
            </div>
          )}
        </div>
      </div>

      <div
        className="office-canvas-container relative overflow-x-auto overflow-y-hidden"
        style={{ height: `${canvasHeight}px` }}
      >
        <div
          className="office-canvas relative w-full h-full min-w-[680px]"
          style={{
            background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0eb 50%, #eae5de 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-4 w-24 h-16 rounded-lg bg-amber-100/50 border border-amber-200/30" />
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-green-100/50 border border-green-200/30" />
            <div className="absolute bottom-4 left-1/3 w-32 h-8 rounded bg-blue-100/30 border border-blue-200/20" />
          </div>

          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border-subtle">
            <span className="text-[10px] text-ink-muted font-medium">✨ AI创作空间</span>
          </div>

          {enabledMembers.map((member, index) => (
            <WorkstationCard
              key={member.id}
              member={member}
              index={index}
              isActive={activeMemberIds.has(member.id)}
              currentTaskTitle={activeMemberIds.has(member.id) ? currentTaskTitle : undefined}
            />
          ))}

          {enabledMembers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-2 block opacity-50">🏢</span>
                <p className="text-sm text-ink-muted">暂无AI成员在岗</p>
                <p className="text-xs text-ink-faint mt-1">请前往「智囊团」添加AI成员</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficeCanvas;
