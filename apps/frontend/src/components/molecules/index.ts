/**
 * Molecules - 組み合わせコンポーネント (src/components)
 *
 * 複数のatomsを組み合わせて作られる
 * 特定の機能を持つコンポーネント群
 */

// フォーム関連 - FormField削除済み（UnifiedFormFieldを使用）

// ソーシャルログイン - features/auth/components/molecules/ に移行済み

// メッセージ関連コンポーネント - features/messages/components/molecules/ に移行済み

// ユーザーメニューヘッダー削除済み - UserDisplayを使用

// ウォレット関連コンポーネント - features/wallet/components/molecules/ に移行済み

// 投稿関連コンポーネント - features/posts/components/molecules/ に移行済み

// ナビゲーション関連コンポーネント（再利用可能）
export {
  NavigationSidebar,
  type NavigationSidebarProps,
  type NavigationMenuItem,
} from './NavigationSidebar';

// リストコンポーネント（再利用可能）
export { List } from './List';

// ヘッダーコンポーネント（再利用可能）
export { Header, type HeaderProps } from './Header';

// セクションシェルコンポーネント（再利用可能）
export { SectionShell, type SectionShellProps } from './SectionShell';

// 認証ダイアログナビゲーション（再利用可能）
export { AuthDialogNavigation } from './AuthDialogNavigation';

// 統一タブコンポーネントは features/posts/components/PostList/UnifiedTabNavigation に移行済み

// コメント関連コンポーネント - features/posts/components/Comments/ に移行済み
