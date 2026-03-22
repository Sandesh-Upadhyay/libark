/**
 * 🎯 コンポーネント型定義エクスポート (Component Types Export)
 *
 * 責任:
 * - コンポーネント専用型定義の統一エクスポート
 * - Atomicデザイン原則に基づく型の集約
 * - 依存関係の明確化
 */

// ボタンコンポーネント関連
export type {} from './button';

// 入力コンポーネント関連
export type { InputProps, TextareaProps, SelectProps } from './input';

// アバターコンポーネント関連
export type {
  AvatarProps,
  UserInfoProps,
  // AvatarGroupProps, // 未実装
} from './avatar';

// ヘッダーコンポーネント関連
export type { HeaderProps, PageHeaderProps } from './header';

// バッジコンポーネント関連は共通フォルダに移動されました

// カードコンポーネント関連
export type {} from './card';

// 時間表示コンポーネント関連は共通フォルダに移動されました

// レイアウトコンポーネント関連
export type {
  PageLayoutProps,
  MobileResponsiveLayoutProps,
  ResponsiveMenuLayoutProps,
  PageContainerProps,
} from './layout';

// タブコンポーネント関連
export type { TabNavigationProps, TabContentProps, AuthenticatedTabsProps } from './tabs';

// 管理コンポーネント関連は共通フォルダに移動されました

// UIコンポーネント関連
export type {
  IconType,
  BadgeInfo,
  BaseMenuItem,
  HeaderVariant,
  BaseListProps,
  ClickableItemProps,
  AvatarSize,
  // UserInfo, // GraphQL生成型のUserInfoFragmentを使用
  UserInfoLayout,
  BadgeVariant,
  BadgeProps,
  LayoutVariant,
  LayoutSize,
  ListVariant,
  FilterFunction,
  SortFunction,
  ListProps,
} from './ui';
