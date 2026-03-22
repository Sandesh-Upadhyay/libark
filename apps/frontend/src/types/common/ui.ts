/**
 * 🎯 共通UI型定義 (Common/UI Types)
 *
 * 責任:
 * - アプリケーション全体で使用される基本的なUI要素の型定義
 * - 再利用可能なインターフェース定義
 * - UIコンポーネント間の統一された型安全性
 *
 * 特徴:
 * - Domain-agnostic（ドメインに依存しない）
 * - 高い再利用性
 * - 明確な責任分離
 * - 型安全性の確保
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { UserInfoFragment } from '@libark/graphql-client';

import type { IconType, BadgeInfo, BaseListProps, ClickableItemProps, AvatarSize } from '@/types';

/**
 * 基本的なタブアイテムの型定義
 * 最小限の責任で最大限の再利用性を提供
 */
export interface TabItem {
  /** タブの一意識別子 */
  value: string;
  /** タブのラベル */
  label: string;
  /** タブのアイコン */
  icon?: LucideIcon;
  /** タブが無効かどうか */
  disabled?: boolean;
}

/**
 * 認証対応タブアイテムの型定義
 */
export interface AuthenticatedTabItem extends TabItem {
  /** 認証が必要かどうか */
  requiresAuth?: boolean;
}

/**
 * 基本的なメニューアイテムの型定義（共通使用）
 */
export interface BaseMenuItem {
  /** 一意のID */
  id: string;
  /** 表示名 */
  title: string;
  /** ラベル（表示名の別名） */
  label?: string;
  /** サブタイトル */
  subtitle?: string;
  /** 説明文 */
  description?: string;
  /** アイコン */
  icon?: React.ReactNode;
  /** リンク先 */
  href?: string;
  /** 無効化フラグ */
  disabled?: boolean;
  /** バッジ情報 */
  badge?: BadgeInfo;
}

/**
 * 管理メニューアイテムの型定義（共通使用）
 */
export interface AdminMenuItem extends BaseMenuItem {
  /** 管理者権限が必要 */
  requireAdmin?: boolean;
  /** 危険な操作かどうか */
  dangerous?: boolean;
  /** 管理機能のカテゴリ */
  category?: 'system' | 'user' | 'content' | 'security' | 'monitoring' | 'settings';
}

/**
 * 設定メニューアイテムの型定義（共通使用）
 */
export interface SettingsMenuItem extends BaseMenuItem {
  /** 認証が必要 */
  requireAuth?: boolean;
  /** 設定のカテゴリ */
  category?: 'account' | 'display' | 'privacy' | 'security' | 'system' | 'help';
  /** 設定の重要度レベル */
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * useTabsフックのオプション（共通使用）
 */
export interface UseTabsOptions<T extends string = string> {
  /** デフォルトのアクティブタブ */
  defaultTab: T;
  /** タブ変更時のコールバック */
  onTabChange?: (tab: T) => void;
}

/**
 * useTabsフックの戻り値（共通使用）
 */
export interface UseTabsReturn<T extends string = string> {
  /** 現在のアクティブタブ */
  activeTab: T;
  /** タブを変更する関数 */
  setActiveTab: (tab: T) => void;
  /** タブ変更ハンドラー（TabNavigationに渡す用） */
  handleTabChange: (value: string) => void;
}

/**
 * タブフィルタリングのオプション（共通使用）
 */
export interface TabFilterOptions {
  /** 認証状態 */
  isAuthenticated?: boolean;
  /** 初期化中かどうか */
  isInitializing?: boolean;
  /** カスタムフィルター関数 */
  customFilter?: (tab: TabItem) => boolean;
}

/**
 * タイムライン用タブの型（共通使用）
 */
export type TimelineTabType = 'FOLLOWING' | 'RECOMMENDED' | 'ALL';

/**
 * プロフィール用タブの型（共通使用）
 */
export type ProfileTabType = 'posts' | 'media' | 'likes';

/**
 * ウォレット用タブの型（共通使用）
 */
export type WalletTabType = 'wallet' | 'sales' | 'p2p';

/**
 * 管理メニューリストのプロパティ（共通使用）
 */
export interface AdminMenuListProps extends BaseListProps, ClickableItemProps {
  /** タイトル */
  title?: string;
  /** 管理メニューアイテムのリスト */
  items: AdminMenuItem[];
}

/**
 * サポートされるロケール（共通使用）
 */
export type SupportedLocale =
  | 'ja'
  | 'en'
  | 'ko'
  | 'zh'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'ar'
  | 'hi'
  | 'th';

/**
 * ボタンのプロパティ（共通使用）
 */
export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンのバリアント */
  variant?: ButtonVariant;
  /** ボタンのサイズ */
  size?: ButtonSize;
  /** 無効状態 */
  disabled?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** アイコン */
  icon?: IconType;
  /** 子要素 */
  children?: React.ReactNode;
}

// ButtonPropsエイリアス
export type ButtonProps = BaseButtonProps;

/**
 * モバイルヘッダーのプロパティ（共通使用）
 */
export interface MobileHeaderProps {
  /** タイトル */
  title?: string;
  /** 戻るボタンを表示するか */
  showBackButton?: boolean;
  /** 戻るボタンのハンドラー */
  onBack?: () => void;
  /** 右側のアクション */
  rightAction?: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 設定グループのプロパティ（共通使用）
 */
export interface SettingGroupProps {
  /** グループのタイトル */
  title?: string;
  /** グループの説明 */
  description?: string;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 設定カテゴリの型定義（共通使用）
 */
export type SettingsCategory =
  | 'account' // アカウント関連
  | 'display' // 表示設定
  | 'privacy' // プライバシー設定
  | 'security' // セキュリティ設定
  | 'system' // システム設定
  | 'help'; // ヘルプ・サポート

/**
 * 設定メニューリストのプロパティ（共通使用）
 */
export interface SettingsMenuListProps extends BaseListProps, ClickableItemProps {
  /** タイトル */
  title?: string;
  /** 設定メニューアイテムのリスト */
  items: SettingsMenuItem[];
}

/**
 * 設定メニューアイテムのフィルター関数（共通使用）
 */
export type SettingsMenuItemFilter = (item: SettingsMenuItem) => boolean;

/**
 * 設定メニューアイテムのソート関数（共通使用）
 */
export type SettingsMenuItemSorter = (a: SettingsMenuItem, b: SettingsMenuItem) => number;

/**
 * 設定値の型定義（共通使用）
 */
export interface SettingValue<T = unknown> {
  /** 設定値 */
  value: T;
  /** デフォルト値 */
  defaultValue: T;
  /** 設定値の説明 */
  description?: string;
  /** 設定値が変更可能かどうか */
  readonly?: boolean;
}

/**
 * 管理メニューアイテムのフィルター関数（共通使用）
 */
export type AdminMenuItemFilter = (item: AdminMenuItem) => boolean;

/**
 * 管理メニューアイテムのソート関数（共通使用）
 */
export type AdminMenuItemSorter = (a: AdminMenuItem, b: AdminMenuItem) => number;

/**
 * 管理者権限チェック関数の型（共通使用）
 */
export type AdminPermissionChecker = (requiredPermission?: string) => boolean;

/**
 * ユーザー情報レイアウト（共通使用）
 */

/**
 * アバターグループのプロパティ（共通使用）
 */
export interface AvatarGroupProps {
  /** アバターのリスト */
  avatars: UserInfoFragment[];
  /** 最大表示数 */
  max?: number;
  /** アバターのサイズ */
  size?: AvatarSize;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * バッジサイズ（共通使用）
 */

/**
 * バッジバリアント（共通使用）
 */
export interface BadgeVariants {
  /** バリアント */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * バッジのプロパティ（共通使用）
 */

/**
 * ボタンバリアント（共通使用）
 */
export interface ButtonVariants {
  /** バリアント */
  variant?: ButtonVariant;
  /** サイズ */
  size?: ButtonSize;
}

/**
 * アイコンボタンのプロパティ（共通使用）
 */
export interface IconButtonProps extends BaseButtonProps {
  /** アイコン */
  icon: IconType;
  /** アクセシビリティラベル */
  'aria-label': string;
}

/**
 * ボタングループのプロパティ（共通使用）
 */
export interface ButtonGroupProps {
  /** ボタンのリスト */
  children: React.ReactNode;
  /** 方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カードバリアント（共通使用）
 */
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

/**
 * カードサイズ（共通使用）
 */
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * カードのプロパティ（共通使用）
 */
export interface CardProps {
  /** バリアント */
  variant?: CardVariant;
  /** サイズ */
  size?: CardSize;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カードヘッダーのプロパティ（共通使用）
 */
export interface CardHeaderProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カードタイトルのプロパティ（共通使用）
 */
export interface CardTitleProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カード説明のプロパティ（共通使用）
 */
export interface CardDescriptionProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カードコンテンツのプロパティ（共通使用）
 */
export interface CardContentProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * カードフッターのプロパティ（共通使用）
 */
export interface CardFooterProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * パンくずリストアイテム（共通使用）
 */
export interface BreadcrumbItem {
  /** ラベル */
  label: string;
  /** リンク先URL */
  href?: string;
  /** アクティブかどうか */
  isActive?: boolean;
}

/**
 * ヘッダーアクション（共通使用）
 */
export interface HeaderAction {
  /** アイコン */
  icon: IconType;
  /** ラベル */
  label: string;
  /** クリックハンドラー */
  onClick: () => void;
  /** 無効状態 */
  disabled?: boolean;
}

/**
 * アイコン入力のプロパティ（共通使用）
 */
export interface IconInputProps {
  /** アイコン */
  icon: IconType;
  /** プレースホルダー */
  placeholder?: string;
  /** 値 */
  value?: string;
  /** 変更ハンドラー */
  onChange?: (value: string) => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * パスワード入力のプロパティ（共通使用）
 */
export interface PasswordInputProps {
  /** プレースホルダー */
  placeholder?: string;
  /** 値 */
  value?: string;
  /** 変更ハンドラー */
  onChange?: (value: string) => void;
  /** パスワード表示切り替え */
  showPassword?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * セレクトオプション（共通使用）
 */
export interface SelectOption {
  /** 値 */
  value: string;
  /** ラベル */
  label: string;
  /** 無効状態 */
  disabled?: boolean;
}

/**
 * セレクトのプロパティ（共通使用）
 */
export interface SelectProps {
  /** オプション */
  options: SelectOption[];
  /** 値 */
  value?: string;
  /** 変更ハンドラー */
  onChange?: (value: string) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * フォームフィールドのプロパティ（共通使用）
 */
export interface FormFieldProps {
  /** ラベル */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** ヘルプテキスト */
  helpText?: string;
  /** 必須フィールドかどうか */
  required?: boolean;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * レイアウトバリアント（共通使用）
 */

/**
 * レイアウトサイズ（共通使用）
 */

/**
 * 時間表示の形式（共通使用）
 */
export type TimeFormat = 'relative' | 'absolute' | 'both';

/**
 * 時間表示の配置（共通使用）
 */
export type TimeAlign = 'left' | 'center' | 'right';

/**
 * 相対時間表示のプロパティ（共通使用）
 */
export interface RelativeTimeProps {
  /** 日時 */
  date: Date | string;
  /** 更新間隔（秒） */
  updateInterval?: number;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 絶対時間表示のプロパティ（共通使用）
 */
export interface AbsoluteTimeProps {
  /** 日時 */
  date: Date | string;
  /** フォーマット */
  format?: string;
  /** ロケール */
  locale?: SupportedLocale;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * バッジバリアント（共通使用）
 */

/**
 * ヘッダーレベル（共通使用）
 */
export type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * サイズバリアント（共通使用）
 */
export type SizeVariant = 'sm' | 'md' | 'lg';

/**
 * ボタンバリアント（共通使用）
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * ボタンサイズ（共通使用）
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * 入力バリアント（共通使用）
 */
export type InputVariant = 'default' | 'destructive' | 'ghost';

/**
 * 入出金タブタイプ（共通使用）
 */
export type DepositWithdrawTabType = 'deposit' | 'withdraw';

/**
 * バッジサイズ（共通使用）
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * リストアイテムの表示バリアント
 */

/**
 * 空状態の表示設定（共通型）
 */
export interface EmptyState {
  /** 空状態のアイコン */
  icon?: IconType;
  /** 空状態のタイトル */
  title: string;
  /** 空状態の説明 */
  description?: string;
}

/**
 * フィルター関数の型
 */

/**
 * ソート関数の型
 */

/**
 * リストアイテムの型定義（統一版）
 */
export interface ListItem {
  /** 一意識別子 */
  id: string;
  /** タイトル */
  title: string;
  /** サブタイトル */
  subtitle?: string;
  /** 説明文 */
  description?: string;
  /** アイコン */
  icon?: IconType;
  /** ユーザーアバター情報 */
  avatar?: UserInfoFragment;
  /** バッジ情報 */
  badge?: BadgeInfo;
  /** 右側コンテンツ */
  rightContent?: IconType;
  /** アクティブ状態 */
  isActive?: boolean;
  /** 無効状態 */
  isDisabled?: boolean;
  /** リンク先URL */
  href?: string;
  /** クリックハンドラー */
  onClick?: () => void;
}

/**
 * リストプロパティの型定義（統一版）
 */

// TimeDisplay関連の型定義
export type TimeDisplayVariant = 'relative' | 'absolute' | 'both';

export interface TimeDisplayProps {
  /** 表示する日時 */
  date: Date | string;
  /** 作成日時（後方互換性） */
  createdAt?: Date | string;
  /** 表示形式 */
  variant?: TimeDisplayVariant;
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** フォーマット */
  format?: string;
  /** 配置 */
  align?: 'center' | 'end' | 'start';
  /** リアルタイム更新を有効にするか */
  enableRealTimeUpdate?: boolean;
  /** インタラクティブクリック時のコールバック */
  onInteractiveClick?: () => void;
  /** タイムゾーン */
  timezone?: string;
  /** ロケール */
  locale?: string;
  /** CSSクラス */
  className?: string;
}
