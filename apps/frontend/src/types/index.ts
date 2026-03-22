/**
 * 🎯 型定義統一エクスポート (Unified Types Export)
 *
 * 責任:
 * - アプリケーション全体で使用する型定義の統一エクスポート
 * - 機能別型定義の集約
 * - 型安全性の確保
 * - インポートパスの簡素化
 *
 * 特徴:
 * - Domain-Driven Design原則に基づく型定義
 * - 機能別責任分離
 * - 再利用可能な型定義
 * - 明確な依存関係
 */

// 共通型定義（2箇所以上で使用される型）
export type {
  TabItem,
  AuthenticatedTabItem,
  AdminMenuItem,
  SettingsMenuItem,
  AdminMenuListProps,
  SupportedLocale,
  ButtonProps,
  MobileHeaderProps,
  SettingGroupProps,
  SettingsCategory,
  SettingsMenuListProps,
  SettingsMenuItemFilter,
  SettingsMenuItemSorter,
  SettingValue,
  AdminMenuItemFilter,
  AdminMenuItemSorter,
  AdminPermissionChecker,
  // UserInfoLayout, // 未実装
  AvatarGroupProps,
  BadgeVariants,
  ButtonVariants,
  IconButtonProps,
  ButtonGroupProps,
  CardVariant,
  CardSize,
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  BreadcrumbItem,
  HeaderAction,
  IconInputProps,
  PasswordInputProps,
  SelectOption,
  SelectProps,
  FormFieldProps,
  TimeFormat,
  TimeAlign,
  RelativeTimeProps,
  TimeDisplayProps,
  AbsoluteTimeProps,
  UseTabsOptions,
  UseTabsReturn,
  TabFilterOptions,
  TimelineTabType,
  ProfileTabType,
  WalletTabType,
  EmptyState,
  ListItem,
  HeaderLevel,
  SizeVariant,
  ButtonVariant,
  ButtonSize,
  InputVariant,
  DepositWithdrawTabType,
  BadgeSize,
} from './common';

// コンポーネント型定義（3-4箇所で使用される型）
export type {
  // UI基本型
  IconType,
  BadgeInfo,
  BaseMenuItem,
  HeaderVariant,
  BaseListProps,
  ClickableItemProps,
  AvatarSize,
  // UserInfo, // GraphQL生成型のUserInfoFragmentを使用

  // 入力関連
  InputProps,
  TextareaProps,

  // アバター関連
  AvatarProps,
  UserInfoProps,

  // ヘッダー関連
  HeaderProps,
  PageHeaderProps,

  // タブ関連
  TabNavigationProps,
  TabContentProps,
  AuthenticatedTabsProps,

  // レイアウト関連
  PageLayoutProps,
  MobileResponsiveLayoutProps,
  ResponsiveMenuLayoutProps,
  PageContainerProps,

  // 移動した型
  BadgeVariant,
  BadgeProps,
  LayoutVariant,
  LayoutSize,
  ListVariant,
  FilterFunction,
  SortFunction,
  ListProps,
} from './components';

// 機能固有型定義（1箇所のみ使用される型）

// 管理機能型定義（機能固有型 - 現在は空）
// 管理関連の型は共通型またはコンポーネント型に移動済み

// 設定機能型定義（共通フォルダに移動済み）
// 型は @/types からインポートしてください

// タブ関連型定義（機能固有型）
// DepositWithdrawTabTypeは共通フォルダに移動されました

// 外部ライブラリ型定義は各ライブラリの実装ファイルから直接インポート
