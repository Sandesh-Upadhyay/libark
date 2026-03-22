/**
 * 🚀 パフォーマンス監視プロバイダーテンプレート (Template)
 *
 * 責任:
 * - アプリケーション全体のパフォーマンス監視
 * - テンプレートレベルのプロバイダー機能
 * - Core Web Vitalsとカスタムメトリクスの監視
 * - 統一的なパフォーマンス測定システム
 *
 * 特徴:
 * - Next.jsページ遷移対応
 * - 開発環境でのデバッグ支援
 * - メモリ使用量監視
 * - 型安全なパフォーマンス測定
 */

'use client';

import React, { useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { startPerformanceMonitoring } from '@/lib/performance-monitor';

/**
 * PerformanceMonitor バリアント定義
 */
const performanceMonitorVariants = cva('', {
  variants: {
    mode: {
      default: '',
      debug: 'relative',
      development: 'relative',
      verbose: 'relative',
    },
  },
  defaultVariants: {
    mode: 'default',
  },
});

interface PerformanceMonitorProps extends VariantProps<typeof performanceMonitorVariants> {
  children: React.ReactNode;
  enableMemoryMonitoring?: boolean;
  memoryLogInterval?: number;
  className?: string;
}

interface PerformanceMetrics {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

/**
 * 🎯 パフォーマンスメトリクス取得 (Internal)
 */
function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !('performance' in window) || !window.performance) {
    return null;
  }

  try {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (!navigationEntries || navigationEntries.length === 0) {
      return null;
    }

    const navigation = navigationEntries[0] as PerformanceNavigationTiming;
    if (!navigation) {
      return null;
    }

    const firstPaintEntries = performance.getEntriesByName('first-paint');
    const firstContentfulPaintEntries = performance.getEntriesByName('first-contentful-paint');
    const largestContentfulPaintEntries = performance.getEntriesByName('largest-contentful-paint');

    return {
      url: window.location.href,
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint: firstPaintEntries && firstPaintEntries[0] ? firstPaintEntries[0].startTime : 0,
      firstContentfulPaint:
        firstContentfulPaintEntries && firstContentfulPaintEntries[0]
          ? firstContentfulPaintEntries[0].startTime
          : 0,
      largestContentfulPaint:
        largestContentfulPaintEntries && largestContentfulPaintEntries[0]
          ? largestContentfulPaintEntries[0].startTime
          : undefined,
      // CLS と FID は Web Vitals ライブラリで測定される
    };
  } catch (error) {
    console.warn('Failed to get performance metrics:', error);
    return null;
  }
}

/**
 * 🎯 メモリ使用量取得 (Internal)
 */
function getMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window) || !window.performance) {
    return null;
  }

  try {
    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    if (!memory) {
      return null;
    }

    return {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      usedBytes: memory.usedJSHeapSize,
      totalBytes: memory.totalJSHeapSize,
      limitBytes: memory.jsHeapSizeLimit,
    };
  } catch (error) {
    console.warn('Failed to get memory usage:', error);
    return null;
  }
}

/**
 * 🎯 パフォーマンス監視プロバイダーテンプレート (Template)
 *
 * 使用例:
 * ```tsx
 * <PerformanceMonitor>
 *   <App />
 * </PerformanceMonitor>
 *
 * <PerformanceMonitor
 *   mode="debug"
 *   enableMemoryMonitoring={true}
 *   memoryLogInterval={5000}
 * >
 *   <DevelopmentApp />
 * </PerformanceMonitor>
 * ```
 */
export function PerformanceMonitor({
  children,
  mode,
  enableMemoryMonitoring = true,
  memoryLogInterval = 10000,
  className,
}: PerformanceMonitorProps) {
  useEffect(() => {
    // パフォーマンス監視の初期化
    startPerformanceMonitoring();

    // 開発環境でのデバッグ情報（簡潔に・遅延実行）
    if (import.meta.env.DEV) {
      // 少し遅延させて他の初期化ログとの重複を避ける
      setTimeout(() => {
        console.log('🚀 PerformanceMonitor初期化完了');
      }, 700);
    }

    // ページ遷移時のパフォーマンス測定
    const handleRouteChange = () => {
      const metrics = getPerformanceMetrics();
      if (metrics) {
        // パフォーマンス問題がある場合のみログ出力
        if (
          mode === 'verbose' ||
          (import.meta.env.DEV &&
            (metrics.loadTime > 3000 || // 3秒以上
              metrics.firstContentfulPaint > 2000)) // FCP 2秒以上
        ) {
          console.log('📊 Page Navigation Performance:', metrics);
        }

        // パフォーマンスメトリクスを外部サービスに送信（本番環境）
        if (import.meta.env.PROD) {
          // Analytics サービスへの送信ロジックをここに追加
        }
      }
    };

    // ページ読み込み完了時に実行
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        handleRouteChange();
      } else {
        window.addEventListener('load', handleRouteChange);
      }
    }

    // クリーンアップ
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleRouteChange);
      }
    };
  }, [mode, memoryLogInterval]);

  // メモリ監視
  useEffect(() => {
    if (!enableMemoryMonitoring || process.env.NODE_ENV !== 'development') {
      return;
    }

    let lastLogTime = 0;
    let lastCriticalLogTime = 0;
    const LOG_INTERVAL_MS = 60000; // 60秒間隔に延長
    const CRITICAL_LOG_INTERVAL_MS = 15000; // クリティカルログは15秒間隔

    const logMemoryUsage = () => {
      const memory = getMemoryUsage();
      if (!memory) return;

      const now = Date.now();
      const usagePercentage = (memory.usedBytes / memory.limitBytes) * 100;

      // クリティカルレベル（85%以上）の場合、頻度制限あり
      if (usagePercentage > 85 && now - lastCriticalLogTime > CRITICAL_LOG_INTERVAL_MS) {
        console.warn('⚠️ Critical Memory Usage:', `${usagePercentage.toFixed(1)}%`);
        lastCriticalLogTime = now;
      }
      // 高使用量（75%以上）の場合、頻度制限あり
      else if (usagePercentage > 75 && now - lastLogTime > LOG_INTERVAL_MS) {
        console.log('🧠 High Memory Usage:', {
          used: `${(memory.usedBytes / (1024 * 1024)).toFixed(2)} MB`,
          total: `${(memory.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
          limit: `${(memory.limitBytes / (1024 * 1024)).toFixed(2)} MB`,
          usagePercentage: `${usagePercentage.toFixed(1)}%`,
        });
        lastLogTime = now;
      }
    };

    // メモリ監視間隔を長くして負荷を軽減（5分間隔）
    const interval = setInterval(logMemoryUsage, Math.max(memoryLogInterval * 30, 300000));

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring, memoryLogInterval]);

  // デバッグモードの場合は開発者向けインジケーターを表示
  if (mode === 'debug' || mode === 'development' || mode === 'verbose') {
    return (
      <div className={cn(performanceMonitorVariants({ mode }), className)}>
        {/* 開発環境でのデバッグインジケーター */}
        {process.env.NODE_ENV === 'development' && (
          <div className='fixed bottom-4 left-16 z-50 bg-yellow-500 text-black text-xs px-2 py-1 rounded opacity-50 pointer-events-none'>
            Perf: {enableMemoryMonitoring ? 'Monitoring' : 'Basic'}
          </div>
        )}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 🎯 パフォーマンス監視フック
 */
export function usePerformanceMonitor(options?: {
  enableMemoryLogging?: boolean;
  logInterval?: number;
}) {
  const { enableMemoryLogging = false, logInterval = 10000 } = options || {};

  useEffect(() => {
    if (!enableMemoryLogging || !import.meta.env.DEV) {
      return;
    }

    const logPerformanceInfo = () => {
      const memory = getMemoryUsage();
      if (memory) {
        console.log('🧠 Component Memory Usage:', memory);
      }
    };

    // 指定間隔でメモリ使用量をログ出力
    const interval = setInterval(logPerformanceInfo, logInterval);

    return () => clearInterval(interval);
  }, [enableMemoryLogging, logInterval]);
}

export { performanceMonitorVariants, getPerformanceMetrics, getMemoryUsage };
export type { PerformanceMonitorProps, PerformanceMetrics };
