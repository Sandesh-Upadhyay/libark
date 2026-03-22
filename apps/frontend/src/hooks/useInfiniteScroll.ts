'use client';

import { useEffect } from 'react';

import { useIntersectionObserver } from './useIntersectionObserver';

export function useInfiniteScroll({
  loadMore,
  hasNextPage,
  isLoading,
  disabled = false,
  rootMargin = '100px',
}: {
  loadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  disabled?: boolean;
  rootMargin?: string;
}) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    triggerOnce: false,
  });

  const shouldLoad = !disabled && !isLoading && hasNextPage && isVisible;

  useEffect(() => {
    if (shouldLoad) loadMore();
  }, [shouldLoad, loadMore]);

  return { ref };
}
