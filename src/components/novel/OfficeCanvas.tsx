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

const WorkstationCard: React.FC<WorkstationProps & { padding: number }> = ({ member, index, isActive, currentTaskTitle, padding }) => {
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
        left: `${xOffset + padding}px`,
        top: `${row * 180 + padding}px`,
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

interface MinimapProps {
  contentWidth: number;
  contentHeight: number;
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (x: number, y: number) => void;
}

const Minimap: React.FC<MinimapProps> = ({
  contentWidth,
  contentHeight,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  onNavigate,
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minimapWidth = 160;
  const minimapHeight = 100;
  const scaleX = minimapWidth / contentWidth;
  const scaleY = minimapHeight / contentHeight;

  const minimapViewportX = viewportX * scaleX;
  const minimapViewportY = viewportY * scaleY;
  const minimapViewportWidth = Math.min(viewportWidth * scaleX, minimapWidth);
  const minimapViewportHeight = Math.min(viewportHeight * scaleY, minimapHeight);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const targetX = (x / scaleX) - viewportWidth / 2;
    const targetY = (y / scaleY) - viewportHeight / 2;
    onNavigate(targetX, targetY);
  }, [scaleX, scaleY, viewportWidth, viewportHeight, onNavigate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleClick(e);
  }, [handleClick]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!minimapRef.current) return;
      const rect = minimapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const targetX = (x / scaleX) - viewportWidth / 2;
      const targetY = (y / scaleY) - viewportHeight / 2;
      onNavigate(targetX, targetY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scaleX, scaleY, viewportWidth, viewportHeight, onNavigate]);

  return (
    <div
      ref={minimapRef}
      className="absolute bottom-3 right-3 rounded-lg border border-border-subtle bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden cursor-pointer z-10"
      style={{ width: minimapWidth, height: minimapHeight }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0eb 50%, #eae5de 100%)',
        }}
      />
      <div
        className="absolute border-2 border-brand bg-brand/20 rounded transition-all duration-75"
        style={{
          left: minimapViewportX,
          top: minimapViewportY,
          width: minimapViewportWidth,
          height: minimapViewportHeight,
        }}
      />
      <div className="absolute bottom-1 right-1 text-[8px] text-ink-faint font-medium">
        小地图
      </div>
    </div>
  );
};

const OfficeCanvas: React.FC = () => {
  const { members } = useThinkTankStore();
  const { currentTask, isRunning, subtasks } = useAIWorkshopStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
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

  const PADDING = 40;
  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 180;
  const COLS = 3;

  const contentWidth = useMemo(() => {
    const cols = Math.min(enabledMembers.length, COLS);
    return cols * CARD_WIDTH + PADDING * 2;
  }, [enabledMembers.length]);

  const contentHeight = useMemo(() => {
    const rows = Math.ceil(enabledMembers.length / COLS);
    return rows * CARD_HEIGHT + PADDING * 2 + 80;
  }, [enabledMembers.length]);

  const canvasHeight = useMemo(() => {
    return Math.max(320, Math.min(contentHeight, 500));
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
    if (target.closest('.workstation-card') || target.closest('.minimap-container')) return;
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

  const handleMinimapNavigate = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;
    const maxScrollX = contentWidth - containerRef.current.clientWidth;
    const maxScrollY = contentHeight - containerRef.current.clientHeight;
    containerRef.current.scrollLeft = Math.max(0, Math.min(x, maxScrollX));
    containerRef.current.scrollTop = Math.max(0, Math.min(y, maxScrollY));
  }, [contentWidth, contentHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const showMinimap = contentWidth > 680 || contentHeight > canvasHeight;

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
        ref={containerRef}
        className={`office-canvas-container relative overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: `${canvasHeight}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="office-canvas relative"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            minWidth: '100%',
            background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0eb 50%, #eae5de 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute w-24 h-16 rounded-lg bg-amber-100/50 border border-amber-200/30"
              style={{ top: PADDING, left: PADDING }}
            />
            <div
              className="absolute w-20 h-20 rounded-full bg-green-100/50 border border-green-200/30"
              style={{ top: PADDING, right: PADDING }}
            />
            <div
              className="absolute w-32 h-8 rounded bg-blue-100/30 border border-blue-200/20"
              style={{ bottom: PADDING, left: '33%' }}
            />
          </div>

          <div
            className="absolute px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border-subtle"
            style={{ top: PADDING, left: '50%', transform: 'translateX(-50%)' }}
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
                <span className="text-4xl mb-2 block opacity-50">🏢</span>
                <p className="text-sm text-ink-muted">暂无AI成员在岗</p>
                <p className="text-xs text-ink-faint mt-1">请前往「智囊团」添加AI成员</p>
              </div>
            </div>
          )}
        </div>

        {showMinimap && (
          <Minimap
            contentWidth={contentWidth}
            contentHeight={contentHeight}
            viewportX={scrollLeft}
            viewportY={scrollTop}
            viewportWidth={containerRef.current?.clientWidth || 680}
            viewportHeight={canvasHeight}
            onNavigate={handleMinimapNavigate}
          />
        )}
      </div>
    </div>
  );
};

export default OfficeCanvas;
