/**
 * 🎯 アバターコンポーネント型定義 (Avatar Component Types)
 *
 * 責任:
 * - アバターコンポーネント専用の型定義
 * - ユーザー情報表示の型安全性
 * - オンライン状態の管理
 *
 * 特徴:
 * - 統一されたアバターサイズ
 * - オンライン状態表示
 * - フォールバック対応
 * - アクセシビリティ対応
 */

import type { UserInfoFragment } from '@libark/graphql-client';

import type { AvatarSize } from '@/types';

/**
 * アバターのプロパティ
 */
export interface AvatarProps {
  /** ユーザー情報 */
  user?: UserInfoFragment;
  /** ユーザー名（user.usernameの代替） */
  username?: string;
  /** 表示名（user.displayNameの代替） */
  displayName?: string;
  /** プロフィール画像ID（user.profileImageIdの代替） */
  profileImageId?: string;
  /** アバターのサイズ */
  size?: AvatarSize;
  /** オンライン状態 */
  isOnline?: boolean;
  /** オンライン状態インジケーターの表示 */
  showOnlineIndicator?: boolean;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
  /** カスタムクラス */
  className?: string;
  /** フォールバック画像のURL */
  fallbackSrc?: string;
  /** アクセシビリティ用のalt属性 */
  alt?: string;
}

/**
 * ユーザー情報表示のプロパティ
 */
export interface UserInfoProps {
  /** ユーザー情報 */
  user?: UserInfoFragment;
  /** ユーザー名（user.usernameの代替） */
  username?: string;
  /** 表示名（user.displayNameの代替） */
  displayName?: string;
  /** プロフィール画像ID（user.profileImageIdの代替） */
  profileImageId?: string;
  /** レイアウト */
  layout?: 'horizontal' | 'vertical';
  /** アバターのサイズ */
  avatarSize?: AvatarSize;
  /** アバターの表示 */
  showAvatar?: boolean;
  /** ユーザー名の表示 */
  showUsername?: boolean;
  /** 表示名の表示 */
  showDisplayName?: boolean;
  /** オンライン状態 */
  isOnline?: boolean;
  /** オンライン状態インジケーターの表示 */
  showOnlineIndicator?: boolean;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
  /** カスタムクラス */
  className?: string;
  /** アバターのカスタムクラス */
  avatarClassName?: string;
  /** テキスト部分のカスタムクラス */
  textClassName?: string;
}
