/**
 * 🎯 テンプレートコンポーネント統一エクスポート
 *
 * ESLintルール準拠のレイアウトテンプレートシステム
 * PageLayoutTemplateとSettingComponentsは削除済み
 */

// BaseLayoutTemplate削除済み - PageLayoutTemplateを使用

// Client Layout
export { ClientLayout } from './ClientLayout';

// スクロール制御
export { ScrollToTop, SimpleScrollToTop } from './ScrollToTop';

// モバイル対応レスポンシブレイアウト
export { MobileResponsiveLayout } from './MobileResponsiveLayout';

// 改善されたレスポンシブメニューレイアウト
export { ResponsiveMenuLayout } from './ResponsiveMenuLayout';

// レイアウトテンプレート（ESLintルール準拠）
export * from './layout-templates';

// 認証ページレイアウト（/features/auth/ に移動済み）
// export { AuthPageLayout } from './AuthPageLayout';
// export type { AuthPageLayoutProps } from './AuthPageLayout';

// 既存レイアウト（互換性維持） - PageLayoutは削除済み、PageLayoutTemplateを使用

// フォームテンプレート（templates専用）
// PostCreatorForm は非推奨 - PostCreatorContainer を使用してください
// export { PostCreatorForm } from '../organisms/PostCreatorForm';
// CommentForm は molecules層に移行済み - @/components/molecules/CommentForm を使用

// メッセージテンプレート（削除済み - src/components/organisms/messages/ を使用）

// プロバイダー（templates専用）
export { PerformanceMonitor, usePerformanceMonitor } from './providers/PerformanceMonitor';
export { ToastProvider } from './providers/ToastProvider';
// 他のプロバイダーは削除済み

// 設定関連（SettingsLayoutTemplateに統合済み）
// SettingComponentsは削除済み - SettingsLayoutTemplateを使用してください

// デバッグコンポーネントは削除済み

// 型定義エクスポート

// フォーム関連型定義
// LoginForm型定義は organisms/LoginForm から使用

// 設定関連型定義（SettingsLayoutTemplateに統合済み）
// SettingComponents型定義は削除済み

// プロバイダー関連型定義
export type { PerformanceMonitorProps, PerformanceMetrics } from './providers/PerformanceMonitor';
export type { ToastProviderProps } from './providers/ToastProvider';
// 他のプロバイダー型定義は削除済み
