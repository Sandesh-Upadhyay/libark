'use client';

import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * スクロールトップ制御のオプション
 */
export interface UseScrollToTopOptions {
  /** スクロール制御を有効にするかどうか（デフォルト: true） */
  enabled?: boolean;
  /** スクロール実行の遅延時間（ミリ秒、デフォルト: 0） */
  delay?: number;
  /** スクロール制御を除外するパスのパターン */
  excludePaths?: string[];
  /** デバッグログを出力するかどうか（デフォルト: false） */
  debug?: boolean;
}

/**
 * ページ遷移時のスクロール位置制御フック
 *
 * 機能:
 * - 新しいページへの遷移時: スクロールトップに移動
 * - 戻る操作時: スクロール位置を維持（ブラウザのデフォルト動作）
 * - 条件付き制御: 除外パスや無効化オプションに対応
 *
 * 使用例:
 * ```tsx
 * function App() {
 *   useScrollToTop({
 *     enabled: true,
 *     excludePaths: ['/modal/*', '/tabs/*'],
 *     debug: process.env.NODE_ENV === 'development'
 *   });
 *
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useScrollToTop(options: UseScrollToTopOptions = {}): void {
  const { enabled = true, delay = 0, excludePaths = [], debug = false } = options;

  const location = useLocation();
  const navigationType = useNavigationType();
  const previousLocationRef = useRef<string | null>(null);

  useEffect(() => {
    // スクロール制御が無効な場合は何もしない
    if (!enabled) {
      if (debug) {
        console.log('[useScrollToTop] スクロール制御が無効です');
      }
      return;
    }

    // 初回レンダリング時は何もしない
    if (previousLocationRef.current === null) {
      previousLocationRef.current = location.pathname;
      if (debug) {
        console.log('[useScrollToTop] 初回レンダリング:', location.pathname);
      }
      return;
    }

    // パスが変更されていない場合は何もしない
    if (previousLocationRef.current === location.pathname) {
      if (debug) {
        console.log('[useScrollToTop] パス変更なし:', location.pathname);
      }
      return;
    }

    // 除外パスのチェック
    const isExcluded = excludePaths.some(pattern => {
      // 簡単なワイルドカードマッチング（*を使用）
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(location.pathname);
    });

    if (isExcluded) {
      if (debug) {
        console.log('[useScrollToTop] 除外パスのためスキップ:', location.pathname);
      }
      previousLocationRef.current = location.pathname;
      return;
    }

    // ナビゲーションタイプによる制御
    const shouldScrollToTop = navigationType === 'PUSH' || navigationType === 'REPLACE';

    if (debug) {
      console.log('[useScrollToTop] ナビゲーション情報:', {
        from: previousLocationRef.current,
        to: location.pathname,
        type: navigationType,
        shouldScrollToTop,
      });
    }

    if (shouldScrollToTop) {
      const scrollToTop = () => {
        try {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant', // スムーズスクロールではなく即座に移動
          });

          if (debug) {
            console.log('[useScrollToTop] スクロールトップに移動しました');
          }
        } catch {
          // フォールバック: scrollToがサポートされていない場合
          try {
            window.scrollTo(0, 0);
            if (debug) {
              console.log('[useScrollToTop] フォールバック: スクロールトップに移動しました');
            }
          } catch (fallbackError) {
            if (debug) {
              console.error('[useScrollToTop] スクロール制御に失敗しました:', fallbackError);
            }
          }
        }
      };

      if (delay > 0) {
        const timeoutId = setTimeout(scrollToTop, delay);
        // クリーンアップ関数でタイムアウトをクリア
        return () => clearTimeout(timeoutId);
      } else {
        scrollToTop();
      }
    } else {
      if (debug) {
        console.log('[useScrollToTop] 戻る操作のためスクロール位置を維持します');
      }
    }

    // 現在のパスを記録
    previousLocationRef.current = location.pathname;
  }, [location.pathname, navigationType, enabled, delay, excludePaths, debug]);
}

/**
 * デフォルト設定でのスクロールトップ制御フック
 *
 * 最も一般的な使用ケース向けの簡略化されたバージョン
 */
export function useSimpleScrollToTop(): void {
  useScrollToTop({
    enabled: true,
    delay: 0,
    excludePaths: [],
    debug: process.env.NODE_ENV === 'development',
  });
}
