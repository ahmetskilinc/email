import { type MutableRefObject, useEffect, useRef, useState } from 'react';

type UsePullToRefreshOptions = {
  onRefresh: () => void | Promise<unknown>;
  isRefreshing: boolean;
  scrollOffsetRef: MutableRefObject<number>;
  enabled: boolean;
  container: HTMLElement | null;
  threshold?: number;
  maxPull?: number;
};

export function usePullToRefresh({
  onRefresh,
  isRefreshing,
  scrollOffsetRef,
  enabled,
  container,
  threshold = 60,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const isRefreshingRef = useRef(isRefreshing);
  const scrollRef = scrollOffsetRef;

  onRefreshRef.current = onRefresh;
  isRefreshingRef.current = isRefreshing;

  useEffect(() => {
    if (!enabled) {
      setPullDistance(0);
      pullDistanceRef.current = 0;
      return;
    }
    if (!container) return;

    const el = container;

    const touchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (scrollRef.current > 0) return;
      startYRef.current = e.touches[0]?.clientY ?? 0;
    };

    const touchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (scrollRef.current > 0) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startYRef.current;
      if (dy > 0) {
        e.preventDefault();
        const clamped = Math.min(dy * 0.5, maxPull);
        pullDistanceRef.current = clamped;
        setPullDistance(clamped);
        el.style.touchAction = 'pan-x';
      }
    };

    const touchEnd = () => {
      el.style.touchAction = '';
      const d = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (d >= threshold && !isRefreshingRef.current) {
        void onRefreshRef.current();
      }
    };

    el.addEventListener('touchstart', touchStart, { passive: true });
    el.addEventListener('touchmove', touchMove, { passive: false });
    el.addEventListener('touchend', touchEnd);
    el.addEventListener('touchcancel', touchEnd);
    return () => {
      el.removeEventListener('touchstart', touchStart);
      el.removeEventListener('touchmove', touchMove);
      el.removeEventListener('touchend', touchEnd);
      el.removeEventListener('touchcancel', touchEnd);
      el.style.touchAction = '';
    };
  }, [enabled, container, maxPull, threshold, scrollRef]);

  return pullDistance;
}
