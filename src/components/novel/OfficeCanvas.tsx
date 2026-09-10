import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
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
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success-bg">
    <span className="w-1.5 h-1.5 rounded-full bg-success animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-success animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-success animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const ThinkingAnimation: React.FC = () => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning-bg">
    <span className="text-xs animate-pulse">💭</span>
    <span className="text-[10px] text-warning">思考中</span>
  </div>
);

const IdleAnimation: React.FC = () => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-bg-subtle">
    <span className="w-1.5 h-1.5 rounded-full bg-ink-faint" />
    <span className="text-[10px] text-ink-muted">待命中</span>
  </div>
);

const WorkstationCard: React.FC<WorkstationProps & { padding: number }> = ({ member, index, isActive, currentTaskTitle, padding }) => {
  const color = ROLE_COLORS[member.role] || '#95a5a6';
  const icon = ROLE_ICONS[member.role] || '🤖';
  const roles = ROLE_TASK_COMPATIBILITY[member.role] || [];

  const col = index % 3;
  const row = Math.floor(index / 3);
  const xOffset = col * 200 + (row % 2 === 1 ? 25 : 0);

  return (
    <div
      className={`absolute transition-all duration-500 ${isActive ? 'scale-105' : ''}`}
      style={{
        left: `${xOffset + padding}px`,
        top: `${row * 150 + padding}px`,
      }}
    >
      <div
        className={`relative w-[180px] rounded-xl border-2 p-3 transition-all duration-300 ${
          isActive
            ? 'bg-white border-brand/40 shadow-lg shadow-brand/10'
            : 'bg-white/80 border-border-subtle hover:border-border-emphasis hover:shadow-md'
        }`}
        style={{ borderTopColor: color, borderTopWidth: '3px' }}
      >
        {isActive && (
          <div className="absolute -top-1 -right-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 mb-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
              isActive ? 'animate-float' : ''
            }`}
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-ink truncate">{member.name}</h4>
            <p className="text-[10px] text-ink-muted truncate">{member.description || 'AI创作专家'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          {isActive ? (
            currentTaskTitle ? <TypingAnimation /> : <ThinkingAnimation />
          ) : (
            <IdleAnimation />
          )}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {roles.length} 专长
          </span>
        </div>

        {isActive && currentTaskTitle && (
          <div className="mt-2 p-1.5 rounded-lg bg-brand-surface border border-brand/10">
            <p className="text-[10px] text-brand font-medium truncate">
              📋 {currentTaskTitle}
            </p>
          </div>
        )}

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full" style={{ backgroundColor: color }} />
      </div>

      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5">
        <div className="w-12 h-6 rounded-b-lg bg-gradient-to-b from-bg-subtle to-white border border-t-0 border-border-subtle flex items-center justify-center">
          <div className="w-8 h-0.5 rounded bg-ink-faint/30" />
        </div>
      </div>
    </div>
  );
};

const OfficeCanvas: React.FC = () => {
  const { members } = useThinkTankStore();
  const { currentTask, isRunning, subtasks } = useAIWorkshopStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setScrollLeft] = useState(0);
  const [, setScrollTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  const enabledMembers = members.filter((m) => m.isEnabled && m.config.apiKey);

  const activeMemberIds = useMemo(() => {
    if (!isRunning) return new Set<string>();
    return new Set(
      subtasks
        .filter((st) => st.status === 'executing')
        .map((st) => st.memberId)
    );
  }, [isRunning, subtasks]);

  const currentTaskTitle = currentTask?.title;

  const PADDING = 30;
  const CARD_WIDTH = 180;
  const CARD_HEIGHT = 150;
  const COLS = 3;

  const contentWidth = useMemo(() => {
    const cols = Math.min(enabledMembers.length, COLS);
    return cols * CARD_WIDTH + PADDING * 2;
  }, [enabledMembers.length]);

  const contentHeight = useMemo(() => {
    const rows = Math.ceil(enabledMembers.length / COLS);
    return rows * CARD_HEIGHT + PADDING * 2 + 60;
  }, [enabledMembers.length]);

  const canvasHeight = useMemo(() => {
    return Math.max(280, Math.min(contentHeight, 420));
  }, [contentHeight]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.workstation-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({ x: containerRef.current?.scrollLeft || 0, y: containerRef.current?.scrollTop || 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = scrollStart.x - dx;
    containerRef.current.scrollTop = scrollStart.y - dy;
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="rounded-2xl border border-border-subtle overflow-hidden bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-brand/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center">
            <span className="text-sm">🏢</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">团队监控</h3>
            <p className="text-[10px] text-ink-muted">实时工作状态 · 俯视视角</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success-bg border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success">
              {enabledMembers.length} 人在岗
            </span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-light border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              <span className="text-[10px] text-brand font-medium">工作中</span>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: `${canvasHeight}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            minWidth: '100%',
            background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0eb 50%, #eae5de 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute w-20 h-12 rounded-lg bg-gold-light border border-gold/20"
              style={{ top: PADDING, left: PADDING }}
            />
            <div
              className="absolute w-16 h-16 rounded-full bg-sage-light border border-sage/20"
              style={{ top: PADDING, right: PADDING }}
            />
            <div
              className="absolute w-28 h-6 rounded bg-info-light border border-info/20"
              style={{ bottom: PADDING, left: '33%' }}
            />
          </div>

          <div
            className="absolute px-2 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-border-subtle"
            style={{ top: PADDING - 10, left: '50%', transform: 'translateX(-50%)' }}
          >
            <span className="text-[10px] text-ink-muted font-medium">✨ AI创作空间</span>
          </div>

          {enabledMembers.map((member, index) => (
            <WorkstationCard
              key={member.id}
              member={member}
              index={index}
              isActive={activeMemberIds.has(member.id)}
              currentTaskTitle={activeMemberIds.has(member.id) ? currentTaskTitle : undefined}
              padding={PADDING}
            />
          ))}

          {enabledMembers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-bg-subtle flex items-center justify-center border border-border-subtle">
                  <span className="text-3xl opacity-50">🏢</span>
                </div>
                <p className="text-sm text-ink font-medium">暂无AI成员在岗</p>
                <p className="text-xs text-ink-muted mt-1">请前往「智囊团」添加AI成员</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficeCanvas;
