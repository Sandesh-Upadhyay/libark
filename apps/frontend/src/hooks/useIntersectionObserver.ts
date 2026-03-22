'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export function useIntersectionObserver<T extends Element>({
  root = null,
  rootMargin = '100px',
  threshold = 0.1,
  triggerOnce = false,
  initialVisible = false,
}: {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  initialVisible?: boolean;
} = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;

    // Intersection Observer APIがサポートされていない場合は即座に表示
    if (!window.IntersectionObserver) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (triggerOnce) observer.disconnect();
        } else {
          setVisible(false);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, triggerOnce]);

  return [ref, visible];
}
