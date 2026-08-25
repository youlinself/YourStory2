import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const FOLLOW_THRESHOLD = 24;

/**
 * 智能滚动管理 Hook
 * 参考 deepseek-harness 的 ChatView 滚动机制：
 * - 自动底部跟随（当用户未主动滚动时）
 * - 滚动锚点记忆（加载历史消息时保持位置）
 * - 滚动到底按钮显示/隐藏
 */
export function useChatScroll<T extends { id: string }>(items: T[]) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const observedTopRef = useRef(0);
  const anchorRef = useRef<{ key: string; top: number } | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  const lastKey = items.length > 0 ? items[items.length - 1].id : null;

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    observedTopRef.current = el.scrollTop;
    atBottomRef.current = true;
    setAtBottom(true);
    anchorRef.current = null;
  }, []);

  // 初始滚动 & 新消息自动跟随
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const appendedUser = lastKey !== lastKeyRef.current;
    lastKeyRef.current = lastKey;

    if (appendedUser || atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      observedTopRef.current = el.scrollTop;
      atBottomRef.current = true;
      setAtBottom(true);
    }
  }, [lastKey]);

  // 滚动事件处理
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      const floor = Math.max(0, el.scrollHeight - el.clientHeight);
      const movedByReader = Math.abs(el.scrollTop - Math.min(observedTopRef.current, floor)) > 0.5;
      const isAtBottom = movedByReader
        ? floor - el.scrollTop <= FOLLOW_THRESHOLD + 1
        : atBottomRef.current;

      if (!movedByReader && isAtBottom) {
        el.scrollTop = el.scrollHeight;
        observedTopRef.current = el.scrollTop;
        atBottomRef.current = true;
        setAtBottom(true);
        return;
      }

      atBottomRef.current = isAtBottom;
      setAtBottom(isAtBottom);
      observedTopRef.current = el.scrollTop;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // ResizeObserver 监听内容变化
  useEffect(() => {
    const column = columnRef.current;
    const local = listRef.current;
    if (!column || !local || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) {
        local.scrollTop = local.scrollHeight;
        observedTopRef.current = local.scrollTop;
      }
    });

    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  return {
    listRef,
    columnRef,
    atBottom,
    scrollToBottom,
  };
}

/**
 * 运行计时器 Hook
 * 参考 deepseek-harness 的 TurnStatus 组件
 */
export function useRunTimer(startTime: number | null) {
  const anchor = startTime ?? Date.now();
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - anchor));

  useEffect(() => {
    const tick = () => setElapsedMs(Math.max(0, Date.now() - anchor));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [anchor]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return { elapsedMs, formatDuration };
}
