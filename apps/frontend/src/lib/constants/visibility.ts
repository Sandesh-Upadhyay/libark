/**
 * 🎯 投稿の公開範囲設定定数
 *
 * 機能:
 * - 公開範囲の型定義
 * - 各公開範囲のアイコンマッピング
 * - 表示ラベルの定義
 * - 説明文の定義
 */

import { Globe, Users, Lock, DollarSign } from 'lucide-react';

/**
 * 投稿の公開範囲タイプ
 */
export type PostVisibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE' | 'PAID';

/**
 * 公開範囲設定の詳細情報
 */
export interface VisibilityOption {
  /** 公開範囲の値 */
  value: PostVisibility;
  /** 表示ラベル */
  label: string;
  /** 説明文 */
  description: string;
  /** アイコンコンポーネント */
  icon: React.ComponentType<{ className?: string; size?: number; title?: string }>;
  /** アイコンの色クラス */
  iconColor: string;
}

/**
 * 公開範囲設定のオプション一覧
 */
export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'PUBLIC',
    label: '公開',
    description: '誰でも見ることができます',
    icon: Globe,
    iconColor: 'text-blue-500',
  },
  {
    value: 'FOLLOWERS_ONLY',
    label: 'フォロワーのみ',
    description: 'フォロワーのみが見ることができます',
    icon: Users,
    iconColor: 'text-green-500',
  },
  {
    value: 'PRIVATE',
    label: '非公開',
    description: '自分のみが見ることができます',
    icon: Lock,
    iconColor: 'text-gray-500',
  },
  {
    value: 'PAID',
    label: '有料投稿',
    description: '購入者のみが見ることができます',
    icon: DollarSign,
    iconColor: 'text-yellow-500',
  },
];

/**
 * 公開範囲から詳細情報を取得
 * @param visibility 公開範囲
 * @returns 詳細情報
 */
export function getVisibilityOption(visibility: PostVisibility): VisibilityOption {
  const option = VISIBILITY_OPTIONS.find(opt => opt.value === visibility);
  if (!option) {
    throw new Error(`Invalid visibility: ${visibility}`);
  }
  return option;
}

/**
 * デフォルトの公開範囲
 */
export const DEFAULT_VISIBILITY: PostVisibility = 'PUBLIC';
