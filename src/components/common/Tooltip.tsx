import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

type Position = 'top' | 'bottom' | 'left' | 'right';

const GAP = 12; // 与宿主元素的间距

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<Position>(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 先测量 Tooltip 实际尺寸
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 220;
    const tooltipHeight = tooltipEl?.offsetHeight || 60;

    // 计算各个方向的可用空间
    const spaceTop = rect.top;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // 判断指定方向是否有足够空间（留出 GAP 间隙）
    const canShowTop = spaceTop >= tooltipHeight + GAP;
    const canShowBottom = spaceBottom >= tooltipHeight + GAP;
    const canShowLeft = spaceLeft >= tooltipWidth + GAP;
    const canShowRight = spaceRight >= tooltipWidth + GAP;

    let finalPosition = position;
    let x = 0, y = 0;

    // 根据指定方向及可用空间，选择最佳位置
    switch (position) {
      case 'top':
        if (canShowTop) {
          finalPosition = 'top';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - GAP;
        } else if (canShowBottom) {
          finalPosition = 'bottom';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + GAP;
        } else {
          // 上下都不够，选择空间更大的一侧
          finalPosition = spaceTop >= spaceBottom ? 'top' : 'bottom';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = finalPosition === 'top'
            ? rect.top - tooltipHeight - GAP
            : rect.bottom + GAP;
        }
        break;

      case 'bottom':
        if (canShowBottom) {
          finalPosition = 'bottom';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + GAP;
        } else if (canShowTop) {
          finalPosition = 'top';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - GAP;
        } else {
          finalPosition = spaceBottom >= spaceTop ? 'bottom' : 'top';
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = finalPosition === 'bottom'
            ? rect.bottom + GAP
            : rect.top - tooltipHeight - GAP;
        }
        break;

      case 'left':
        if (canShowLeft) {
          finalPosition = 'left';
          x = rect.left - tooltipWidth - GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else if (canShowRight) {
          finalPosition = 'right';
          x = rect.right + GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else {
          finalPosition = spaceLeft >= spaceRight ? 'left' : 'right';
          x = finalPosition === 'left'
            ? rect.left - tooltipWidth - GAP
            : rect.right + GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        }
        break;

      case 'right':
        if (canShowRight) {
          finalPosition = 'right';
          x = rect.right + GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else if (canShowLeft) {
          finalPosition = 'left';
          x = rect.left - tooltipWidth - GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else {
          finalPosition = spaceRight >= spaceLeft ? 'right' : 'left';
          x = finalPosition === 'right'
            ? rect.right + GAP
            : rect.left - tooltipWidth - GAP;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
        }
        break;
    }

    // 边界限制：确保 Tooltip 不超出视口
    x = Math.max(8, Math.min(x, viewportWidth - tooltipWidth - 8));
    y = Math.max(8, Math.min(y, viewportHeight - tooltipHeight - 8));

    setActualPosition(finalPosition);
    setCoords({ x, y });
  }, [position]);

  // 显示后重新计算位置（确保 Tooltip 已渲染，尺寸准确）
  useEffect(() => {
    if (show) {
      // 延迟一帧，确保 Tooltip 已渲染到 DOM
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [show, calculatePosition]);

  const arrowClass: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && createPortal(
        <div
          ref={tooltipRef}
          className="fixed rounded-lg bg-white/90 backdrop-blur-sm text-ink text-xs shadow-lg border border-border-subtle simulation-no-copy"
          style={{ left: coords.x, top: coords.y, zIndex: 99999 }}
        >
          {content}
          <span className={`absolute w-0 h-0 border-4 ${arrowClass[actualPosition]}`} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
