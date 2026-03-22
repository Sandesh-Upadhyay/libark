import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * 🎯 レイアウトテンプレート共通型定義
 *
 * 全レイアウトテンプレートで使用する型を統一定義
 * PageLayoutTemplateとの互換性を保持
 */

import type {
  LayoutType,
  SpacingVariant,
  PaddingVariant,
  HeaderVariant,
  HeaderSize,
} from './layout-constants';

/**
 * 全レイアウトテンプレートの基底インターフェース
 * PageLayoutTemplateProps から共通部分を抽出
 */
export interface BaseLayoutProps {
  /** ページタイトル（オプション） */
  title?: string;
  /** ページ説明 */
  description?: string;
  /** ページアイコン */
  icon?: LucideIcon;
  /** ヘッダーアクション（ボタンなど） */
  headerActions?: React.ReactNode;
  /** メインコンテンツ */
  children: React.ReactNode;
  /** 認証が必要かどうか */
  requireAuth?: boolean;
  /** 管理者権限が必要かどうか */
  requireAdmin?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string | null;
  /** アニメーションを無効にするか */
  disableAnimation?: boolean;
}

/**
 * ヘッダー設定インターフェース
 */
export interface HeaderConfig {
  /** ヘッダーバリアント */
  variant?: HeaderVariant;
  /** ヘッダーサイズ */
  size?: HeaderSize;
  /** ヘッダーを表示するか */
  show?: boolean;
}

/**
 * レイアウト設定インターフェース
 */
export interface LayoutConfig {
  /** レイアウトタイプ */
  type: LayoutType;
  /** スペーシングバリアント */
  spacing?: SpacingVariant;
  /** パディングバリアント */
  padding?: PaddingVariant;
}

/**
 * フィードレイアウト専用Props
 */
export interface FeedLayoutProps extends BaseLayoutProps {
  /** 投稿作成コンポーネント */
  creator?: React.ReactNode;
  /** 投稿リストコンポーネント */
  list?: React.ReactNode;
  /** ヘッダー設定 */
  header?: HeaderConfig;
  /** レイアウト設定 */
  layout?: Omit<LayoutConfig, 'type'>;
}

/**
 * ページレイアウト専用Props（統一レイアウト）
 */
export interface PageLayoutProps extends BaseLayoutProps {
  /** ヘッダー設定 */
  header?: HeaderConfig;
  /** レイアウト設定 */
  layout?: Omit<LayoutConfig, 'type'>;
  /** アニメーション設定 */
  animation?: AnimationConfig;
  /** 最大幅を制限するか */
  constrainWidth?: boolean;
  /** サイドバーコンテンツ */
  sidebar?: React.ReactNode;
  /** Post関係のページかどうか（600px最大幅を適用） */
  isPostContent?: boolean;
}

/**
 * 設定レイアウト専用Props（PageLayoutPropsのエイリアス）
 */
export interface SettingsLayoutProps extends PageLayoutProps {}

/**
 * シンプルレイアウト専用Props
 */
export interface SimpleLayoutProps extends BaseLayoutProps {
  /** 中央配置するか */
  centered?: boolean;
  /** ヘッダー設定 */
  header?: HeaderConfig;
  /** レイアウト設定 */
  layout?: Omit<LayoutConfig, 'type'>;
  /** 背景バリアント */
  background?: 'default' | 'muted' | 'card';
}

/**
 * カスタムレイアウト専用Props
 */
export interface CustomLayoutProps extends BaseLayoutProps {
  /** 完全カスタムレイアウト */
  customLayout?: boolean;
  /** ヘッダー設定 */
  header?: HeaderConfig;
  /** レイアウト設定 */
  layout?: Omit<LayoutConfig, 'type'>;
  /** フルスクリーンモード */
  fullscreen?: boolean;
}

/**
 * レイアウトユーティリティ関数の戻り値型
 */
export interface LayoutClasses {
  /** コンテナクラス */
  container: string;
  /** コンテンツクラス */
  content: string;
  /** スペーシングクラス */
  spacing: string;
  /** パディングクラス */
  padding: string;
}

/**
 * レイアウト設定オブジェクトの型
 */
export interface LayoutSettings {
  /** スペーシング設定 */
  spacing: Record<LayoutType, Record<SpacingVariant, string>>;
  /** パディング設定 */
  padding: Record<LayoutType, Record<PaddingVariant, string>>;
}

/**
 * レイアウトコンテキストの型
 * 将来的なContext API使用を想定
 */
export interface LayoutContextValue {
  /** 現在のレイアウトタイプ */
  currentLayout: LayoutType;
  /** レイアウト設定 */
  settings: LayoutSettings;
  /** レイアウト変更関数 */
  setLayout: (layout: LayoutType) => void;
}

/**
 * レスポンシブ設定の型
 */
export interface ResponsiveConfig {
  /** モバイル設定 */
  mobile?: Partial<LayoutConfig>;
  /** タブレット設定 */
  tablet?: Partial<LayoutConfig>;
  /** デスクトップ設定 */
  desktop?: Partial<LayoutConfig>;
}

/**
 * アニメーション設定の型
 */
export interface AnimationConfig {
  /** アニメーションプリセット */
  preset?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  /** 遅延時間 */
  delay?: number;
  /** 継続時間 */
  duration?: number;
  /** アニメーションを無効にするか */
  disabled?: boolean;
}

/**
 * 型ガード関数用の型
 */
export type LayoutTypeGuard<T extends LayoutType> = (layout: LayoutType) => layout is T;

/**
 * ユーティリティ型：レイアウトタイプから対応するPropsを取得
 */
export type LayoutPropsMap = {
  page: PageLayoutProps;
  feed: FeedLayoutProps;
  settings: SettingsLayoutProps;
  simple: SimpleLayoutProps;
  custom: CustomLayoutProps;
};

/**
 * ユーティリティ型：レイアウトタイプに基づく条件付きProps
 */
export type ConditionalLayoutProps<T extends LayoutType> = T extends 'page'
  ? PageLayoutProps
  : T extends 'feed'
    ? FeedLayoutProps
    : T extends 'settings'
      ? SettingsLayoutProps
      : T extends 'simple'
        ? SimpleLayoutProps
        : T extends 'custom'
          ? CustomLayoutProps
          : BaseLayoutProps;
