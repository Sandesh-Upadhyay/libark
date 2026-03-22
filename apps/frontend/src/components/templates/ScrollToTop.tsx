'use client';

import React from 'react';

import { useScrollToTop, type UseScrollToTopOptions } from '@/hooks/useScrollToTop';

/**
 * ScrollToTopコンポーネントのプロパティ
 */
export interface ScrollToTopProps extends UseScrollToTopOptions {
  /** 子コンポーネント（オプション） */
  children?: React.ReactNode;
}

/**
 * ページ遷移時のスクロール位置制御コンポーネント
 *
 * 機能:
 * - React Routerのルート変更を監視
 * - 新しいページへの遷移時: スクロールトップに移動
 * - 戻る操作時: スクロール位置を維持
 * - 条件付き制御: 除外パスや無効化オプションに対応
 *
 * 使用例:
 * ```tsx
 * // App.tsx または AppRoutes.tsx
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <ScrollToTop
 *         enabled={true}
 *         excludePaths={['/modal/*', '/tabs/*']}
 *         debug={process.env.NODE_ENV === 'development'}
 *       />
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *         <Route path="/profile/:username" element={<ProfilePage />} />
 *       </Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 *
 * 特徴:
 * - 非表示コンポーネント（UIを持たない）
 * - useScrollToTopフックをラップ
 * - アプリケーション全体で一度だけ使用
 * - 子コンポーネントをそのまま表示（オプション）
 */
export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  children,
  enabled = true,
  delay = 0,
  excludePaths = [],
  debug = process.env.NODE_ENV === 'development',
}) => {
  // スクロール制御フックを実行
  useScrollToTop({
    enabled,
    delay,
    excludePaths,
    debug,
  });

  // 子コンポーネントがある場合はそのまま表示、ない場合はnullを返す
  return children ? <>{children}</> : null;
};

/**
 * デフォルト設定でのScrollToTopコンポーネント
 *
 * 最も一般的な使用ケース向けの簡略化されたバージョン
 *
 * 使用例:
 * ```tsx
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <SimpleScrollToTop />
 *       <Routes>...</Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
export const SimpleScrollToTop: React.FC = () => {
  return (
    <ScrollToTop
      enabled={true}
      delay={0}
      excludePaths={[]}
      debug={process.env.NODE_ENV === 'development'}
    />
  );
};

export default ScrollToTop;
