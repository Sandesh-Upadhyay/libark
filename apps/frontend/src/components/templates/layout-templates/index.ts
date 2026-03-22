/**
 * 🎯 レイアウトテンプレート 統一エクスポート
 *
 * 全レイアウトテンプレートと共通設定の統一エクスポート
 * 段階的な実装をサポート
 */

// 共通設定・型・ユーティリティ
export * from './shared';

// UnifiedLayoutTemplate削除済み - PageLayoutTemplateを使用

// 統一レイアウトテンプレート
export {
  PageLayoutTemplate,
  PageLayoutTemplate as SettingsLayoutTemplate, // 設定ページ用エイリアス
  PageLayout,
  PAGE_LAYOUT_DEFAULTS,
} from './PageLayoutTemplate';

/**
 * 🎯 統一レイアウトテンプレート使用ガイド
 *
 * ## PageLayoutTemplate（完全統一レイアウト）
 * 全ページで完全に統一されたレイアウトを提供
 * ClientLayoutのLeftSidebarと統一されたデザインを採用
 *
 * ### 統一レイアウト適用ページ（全ページ）
 * - HomePage: 統一レイアウト
 * - ProfilePage: 統一レイアウト
 * - PostDetailPage: 統一レイアウト
 * - NotificationsPage: 統一レイアウト
 * - SettingsPage: 統一レイアウト（専用サイドバー廃止）
 * - WalletPage: 統一レイアウト（専用サイドバー廃止）
 * - AdminPage: 統一レイアウト（専用サイドバー廃止）
 *
 * ### 特殊レイアウト
 * - MessagesPage: 独自レイアウト（ClientLayoutで管理）
 *
 * ### 使用方法
 * ```tsx
 * <PageLayoutTemplate requireAuth={true} header={{ show: false }}>
 *   <YourContent />
 * </PageLayoutTemplate>
 * ```
 */
