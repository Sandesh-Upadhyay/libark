/**
 * 🎯 パフォーマンス監視ユーティリティ
 *
 * INP、レイアウトシフト、その他のCore Web Vitalsを監視
 */

interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
  sources?: LayoutShiftSource[];
}

interface LayoutShiftSource {
  node: Element;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

// パフォーマンス閾値の定義
export const PERFORMANCE_THRESHOLDS = {
  INP: {
    GOOD: 200,
    NEEDS_IMPROVEMENT: 500,
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
  },
} as const;

// パフォーマンス測定結果の型
export interface PerformanceMetrics {
  inp?: number;
  cls?: number;
  lcp?: number;
  timestamp: number;
}

/**
 * INP（Interaction to Next Paint）を測定
 */
export function measureINP(): Promise<number | null> {
  return new Promise(resolve => {
    if (!('PerformanceObserver' in window)) {
      resolve(null);
      return;
    }

    let maxINP = 0;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'event') {
          const eventEntry = entry as PerformanceEventTiming;
          const inp =
            eventEntry.processingStart -
            eventEntry.startTime +
            eventEntry.duration -
            (eventEntry.processingEnd - eventEntry.processingStart);
          maxINP = Math.max(maxINP, inp);
        }
      }
    });

    observer.observe({ type: 'event', buffered: true });

    // 5秒後に測定を停止
    setTimeout(() => {
      observer.disconnect();
      resolve(maxINP || null);
    }, 5000);
  });
}

/**
 * CLS（Cumulative Layout Shift）を測定
 */
export function measureCLS(): Promise<number | null> {
  return new Promise(resolve => {
    if (!('PerformanceObserver' in window)) {
      resolve(null);
      return;
    }

    let clsValue = 0;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // 5秒後に測定を停止
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 5000);
  });
}

/**
 * パフォーマンス評価を取得
 */
export function getPerformanceRating(
  metric: 'inp' | 'cls' | 'lcp',
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds =
    PERFORMANCE_THRESHOLDS[metric.toUpperCase() as keyof typeof PERFORMANCE_THRESHOLDS];

  if (value <= thresholds.GOOD) return 'good';
  if (value <= thresholds.NEEDS_IMPROVEMENT) return 'needs-improvement';
  return 'poor';
}

/**
 * パフォーマンス監視を開始（最適化版）
 */
export function startPerformanceMonitoring() {
  if (import.meta.env.DEV) {
    console.log('🚀 パフォーマンス監視開始');

    // 初期化時のメモリ使用量（100MB以上の場合のみ警告）
    if ('memory' in performance) {
      const memory = (
        performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
        }
      ).memory;
      const memoryMB = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
      if (memoryMB > 100) {
        console.warn(`💾 高メモリ使用量: ${memoryMB.toFixed(2)}MB`);
      } else {
        console.log(`💾 初期メモリ使用量: ${memoryMB.toFixed(2)}MB`);
      }
    }

    // INP測定（非同期、結果は後で表示）
    measureINP().then(inp => {
      if (inp !== null) {
        const rating = getPerformanceRating('inp', inp);
        console.log(`📊 INP: ${inp.toFixed(2)}ms (${rating})`);

        if (rating === 'poor') {
          console.warn(
            '⚠️ INPが基準値を超えています。アニメーション処理の最適化を検討してください。'
          );
        }
      }
    });

    // CLS測定（非同期、結果は後で表示）
    measureCLS().then(cls => {
      if (cls !== null) {
        const rating = getPerformanceRating('cls', cls);
        console.log(`📊 CLS: ${cls.toFixed(3)} (${rating})`);

        if (rating === 'poor') {
          console.warn('⚠️ CLSが基準値を超えています。レイアウトシフトの原因を調査してください。');
        }
      }
    });

    // 重いアニメーション検出を開始
    detectHeavyAnimations();

    // レイアウトシフト監視を開始
    monitorLayoutShifts();
  }
}

/**
 * 重いアニメーションを検出
 */
export function detectHeavyAnimations() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'measure' && entry.duration > 16) {
        console.warn(`🐌 重いアニメーション検出: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
      }
    }
  });

  observer.observe({ type: 'measure', buffered: true });
}

/**
 * レイアウトシフトの詳細を監視（最適化版）
 */
export function monitorLayoutShifts() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'layout-shift' && !(entry as LayoutShift).hadRecentInput) {
        const layoutShiftEntry = entry as LayoutShift;
        // 0.1以上の場合のみ警告（軽微なシフトは無視）
        if (layoutShiftEntry.value >= 0.1) {
          console.warn('📐 レイアウトシフト検出:', {
            value: layoutShiftEntry.value,
            sources: layoutShiftEntry.sources?.map((source: LayoutShiftSource) => ({
              node: source.node,
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
}
