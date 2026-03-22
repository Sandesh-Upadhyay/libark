/**
 * 🎯 レイアウトコンポーネント型定義 (Layout Component Types)
 *
 * 責任:
 * - レイアウトテンプレート専用の型定義
 * - レスポンシブレイアウトの型安全性
 * - ページ構造の管理
 *
 * 特徴:
 * - 統一されたレイアウト設計
 * - レスポンシブ対応
 * - アクセシビリティ対応
 * - 拡張可能な設計
 */

import React from 'react';

import type { IconType, LayoutVariant, LayoutSize } from '@/types';

/**
 * レイアウトのバリアント
 */

/**
 * レイアウトのサイズ

/**
 * ページレイアウトのプロパティ
 */
export interface PageLayoutProps {
  /** 子要素 */
  children: React.ReactNode;
  /** ページタイトル */
  title?: string;
  /** ページの説明 */
  description?: string;
  /** ヘッダーアイコン */
  icon?: IconType;
  /** レイアウトバリアント */
  variant?: LayoutVariant;
  /** レイアウトサイズ */
  size?: LayoutSize;
  /** サイドバーコンテンツ */
  sidebar?: React.ReactNode;
  /** サイドバーの表示 */
  showSidebar?: boolean;
  /** ヘッダーの表示 */
  showHeader?: boolean;
  /** フッターの表示 */
  showFooter?: boolean;
  /** カスタムクラス */
  className?: string;
  /** コンテンツのカスタムクラス */
  contentClassName?: string;
  /** 認証が必要 */
  requireAuth?: boolean;
  /** 管理者権限が必要 */
  requireAdmin?: boolean;
}

/**
 * モバイルレスポンシブレイアウトのプロパティ
 */
export interface MobileResponsiveLayoutProps {
  /** 子要素 */
  children: React.ReactNode;
  /** サイドバーコンテンツ */
  sidebar?: React.ReactNode;
  /** サイドバーの表示状態 */
  showSidebar?: boolean;
  /** カスタムクラス */
  className?: string;
  /** サイドバーのカスタムクラス */
  sidebarClassName?: string;
  /** メインコンテンツのカスタムクラス */
  mainClassName?: string;
}

/**
 * レスポンシブメニューレイアウトのプロパティ
 */
export interface ResponsiveMenuLayoutProps {
  /** メニューコンテンツ */
  menu: React.ReactNode;
  /** メインコンテンツ */
  children: React.ReactNode;
  /** メニューの表示状態（モバイル用） */
  showMenu: boolean;
  /** メニュー表示状態の変更ハンドラー */
  onMenuToggle: (show: boolean) => void;
  /** メニューのタイトル */
  menuTitle?: string;
  /** 「戻る」ボタンのラベル */
  backButtonLabel?: string;
  /** カスタムクラス */
  className?: string;
  /** メニューのカスタムクラス */
  menuClassName?: string;
  /** メインコンテンツのカスタムクラス */
  contentClassName?: string;
}

/**
 * ページコンテナのプロパティ
 */
export interface PageContainerProps {
  /** 子要素 */
  children: React.ReactNode;
  /** カスタムクラス */
  className?: string;
  /** 最大幅の制限 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** 中央寄せ */
  centered?: boolean;
  /** パディング */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
