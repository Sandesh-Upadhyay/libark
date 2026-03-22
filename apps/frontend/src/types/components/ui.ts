/**
 * 🎯 UIコンポーネント型定義 (UI Component Types)
 *
 * 責任:
 * - UIコンポーネント専用の型定義
 * - 再利用可能なUI要素の型安全性
 * - アトミックデザイン原則に基づく型構造
 *
 * 特徴:
 * - 統一されたUIインターフェース
 * - 拡張可能な設計
 * - アクセシビリティ対応
 * - レスポンシブ対応
 */

import React from 'react';

import type { BadgeSize } from '@/types';

/**
 * リストバリアント（コンポーネント使用）
 */
export type ListVariant = 'default' | 'compact' | 'detailed' | 'comfortable';

/**
 * フィルター関数（コンポーネント使用）
 */
export type FilterFunction<T = unknown> = (item: T) => boolean;

/**
 * ソート関数（コンポーネント使用）
 */
export type SortFunction<T = unknown> = (a: T, b: T) => number;

/**
 * バッジバリアント（コンポーネント使用）
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info';

// バッジサイズは共通フォルダに移動されました

/**
 * 基本的なアイコン型（コンポーネント型）
 */
export type IconType = React.ReactNode;

// バッジのバリアント型は共通フォルダに移動されました

/**
 * バッジ情報の型定義（コンポーネント型）
 */
export interface BadgeInfo {
  /** バッジのテキスト */
  text: string;
  /** バッジのバリアント */
  variant?: BadgeVariant;
  /** バッジが表示されるかどうか */
  visible?: boolean;
}

/**
 * 基本メニューアイテムの型定義（コンポーネント型）
 */
export interface BaseMenuItem {
  /** 一意識別子 */
  id: string;
  /** ラベル */
  label: string;
  /** タイトル */
  title?: string;
  /** サブタイトル */
  subtitle?: string;
  /** 説明 */
  description?: string;
  /** アイコン */
  icon?: IconType;
  /** リンク先URL */
  href?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 表示順序 */
  order?: number;
  /** バッジ情報 */
  badge?: BadgeInfo;
  /** 表示するかどうか */
  visible?: boolean;
}

/**
 * ヘッダーのバリアント（コンポーネント型）
 */
export type HeaderVariant = 'default' | 'compact' | 'minimal';

/**
 * ヘッダーのレベル（コンポーネント型）
 */

/**
 * 基本リストのプロパティ（コンポーネント型）
 */
export interface BaseListProps<T = unknown> {
  /** リストアイテムの配列 */
  items: T[];
  /** 空状態の表示 */
  emptyState?: React.ReactNode;
  /** ローディング状態 */
  loading?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * クリック可能なアイテムのプロパティ（コンポーネント型）
 */
export interface ClickableItemProps {
  /** クリックハンドラー */
  onClick?: (event: React.MouseEvent) => void;
  /** キーボードイベントハンドラー */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** フォーカス可能かどうか */
  focusable?: boolean;
  /** アクセシビリティラベル */
  'aria-label'?: string;
}

/**
 * サイズバリアント（コンポーネント型）
 */

/**
 * ボタンバリアント（コンポーネント型）
 */

/**
 * ボタンサイズ（コンポーネント型）
 */

/**
 * 入力フィールドバリアント（コンポーネント型）
 */

/**
 * アバターサイズ（コンポーネント型）
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// UserInfo型はGraphQL生成型のUserInfoFragmentを使用

/**
 * ユーザー情報レイアウト（コンポーネント使用）
 */
export type UserInfoLayout = 'horizontal' | 'vertical' | 'compact';

/**
 * バッジのプロパティ（コンポーネント使用）
 */
export interface BadgeProps {
  /** バッジのバリアント */
  variant?: BadgeVariant;
  /** バッジのサイズ */
  size?: BadgeSize;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * レイアウトバリアント（コンポーネント使用）
 */
export type LayoutVariant = 'default' | 'centered' | 'sidebar' | 'fullwidth';

/**
 * レイアウトサイズ（コンポーネント使用）
 */
export type LayoutSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * リストのプロパティ（コンポーネント使用）
 */
// List関連の型定義（既存のListVariantを拡張）

export interface ListProps<T = unknown> {
  /** リストアイテム */
  items: T[];
  /** タイトル */
  title?: string;
  /** 選択されたアイテムID */
  selectedItemId?: string;
  /** ローディング状態 */
  loading?: boolean;
  /** エラー */
  error?: Error;
  /** バリアント */
  variant?: ListVariant;
  /** 空の状態 */
  emptyState?: React.ReactNode;
  /** 追加ボタンを表示 */
  showAddButton?: boolean;
  /** 追加ボタンのテキスト */
  addButtonText?: string;
  /** 追加ボタンのクリックハンドラー */
  onAddClick?: () => void;
  /** カスタムヘッダーアクション */
  customHeaderAction?: React.ReactNode;
  /** アイテムクリックハンドラー */
  onItemClick?: (item: T) => void;
  /** アイテムのCSSクラス */
  itemClassName?: string;
  /** ヘッダーバリアント */
  headerVariant?: 'default' | 'x-style' | 'minimal';
  /** ヘッダーレベル */
  headerLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** フィルター関数 */
  filter?: FilterFunction<T>;
  /** ソート関数 */
  sort?: SortFunction<T>;
  /** 追加のCSSクラス */
  className?: string;
}

// ListItem型定義
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  href?: string;
  avatar?: {
    profileImageId?: string;
    username?: string;
    displayName?: string;
  };
  badge?: BadgeProps;
  isActive?: boolean;
  visible?: boolean;
  children?: React.ReactNode;
}

// ListItemComponentProps型定義
export interface ListItemComponentProps {
  item: ListItem;
  isSelected?: boolean;
  onClick?: (item: ListItem) => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}
