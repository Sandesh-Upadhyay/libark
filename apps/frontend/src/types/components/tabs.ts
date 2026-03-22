/**
 * 🎯 タブコンポーネント型定義 (Tab Component Types)
 *
 * 責任:
 * - タブコンポーネント専用の型定義
 * - タブナビゲーションの型安全性
 * - 認証対応タブの管理
 *
 * 特徴:
 * - 統一されたタブインターフェース
 * - 認証状態対応
 * - アクセシビリティ対応
 * - 拡張可能な設計
 */

import type { ReactNode } from 'react';

import type { TabItem, AuthenticatedTabItem } from '@/types';

/**
 * 基本タブナビゲーションのプロパティ
 */
export interface TabNavigationProps {
  /** タブアイテムの配列 */
  tabs: TabItem[];
  /** 現在のアクティブタブ */
  activeTab: string;
  /** タブ変更時のコールバック */
  onTabChange: (value: string) => void;
  /** 追加のCSSクラス */
  className?: string;
  /** sticky位置にするかどうか */
  sticky?: boolean;
}

/**
 * タブコンテンツのプロパティ
 */
export interface TabContentProps {
  /** このコンテンツが表示されるタブの値 */
  value: string;
  /** 現在のアクティブタブ */
  activeTab: string;
  /** 追加のCSSクラス */
  className?: string;
  /** 子要素 */
  children: ReactNode;
}

/**
 * 認証対応タブのプロパティ
 */
export interface AuthenticatedTabsProps extends Omit<TabNavigationProps, 'tabs'> {
  /** 認証対応タブアイテムの配列 */
  tabs: AuthenticatedTabItem[];
  /** 初期化中かどうか */
  isInitializing?: boolean;
}
