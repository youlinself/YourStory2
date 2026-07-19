import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  style: React.CSSProperties;
}

interface UseVirtualListReturn<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions,
): UseVirtualListReturn<T> {
  const { itemHeight, overscan = 5, containerHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  const { visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length - 1, start + visibleCount + overscan);

    const visibleItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }

    return { visibleItems };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight],
  );

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    virtualItems: visibleItems,
    totalHeight,
    scrollToIndex,
    containerRef,
    onScroll,
  };
}

/** 自动滚动到底部的 Hook */
export function useAutoScrollToBottom<T>(
  items: T[],
  options: { containerRef: React.RefObject<HTMLDivElement | null>; enabled?: boolean },
) {
  const { containerRef, enabled = true } = options;
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (enabled && isAtBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items, enabled, isAtBottom, containerRef]);

  const checkIfAtBottom = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const threshold = 50;
      const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
      setIsAtBottom(atBottom);
    },
    [],
  );

  return { isAtBottom, checkIfAtBottom };
}
