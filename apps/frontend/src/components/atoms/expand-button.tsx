/**
 * 🎯 統一された展開ボタンコンポーネント (Atom)
 *
 * 責任:
 * - 「もっと見る」「折りたたむ」機能の統一UI
 * - 一貫したスタイリングとアニメーション
 * - アクセシビリティ対応
 *
 * 特徴:
 * - CVAバリアント管理による柔軟なスタイリング
 * - 責任分離とデザイン一貫性
 * - レスポンシブ対応
 * - 型安全なプロパティ管理
 */

'use client';

import React from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import { Button } from '@/components/atoms';
/**
 * ExpandButton Props
 */
export interface ExpandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 展開状態 */
  isExpanded: boolean;
  /** 展開時のテキスト */
  expandedText?: string;
  /** 折りたたみ時のテキスト */
  collapsedText?: string;
  /** アイコンを表示するか */
  showIcon?: boolean;
  /** カスタムアイコン（pagination variant用） */
  customIcon?: React.ReactNode;
  /** ローディング状態 */
  loading?: boolean;
  /** バリアント */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** サイズ */
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
}

/**
 * ExpandButton コンポーネント
 */
export const ExpandButton: React.FC<ExpandButtonProps> = ({
  isExpanded,
  expandedText = '折りたたむ',
  collapsedText = 'もっと見る',
  showIcon = false,
  customIcon,
  loading = false,
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}) => {
  // アイコンの選択
  const getIcon = () => {
    if (loading) {
      return <RefreshCw />;
    }

    if (customIcon) {
      return customIcon;
    }

    if (showIcon) {
      return isExpanded ? <ChevronUp /> : <ChevronDown />;
    }

    return null;
  };

  // テキストの選択
  const getText = () => {
    if (children) return children;
    return isExpanded ? expandedText : collapsedText;
  };

  // aria-labelの生成
  const ariaLabel = isExpanded ? expandedText : collapsedText;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-label={ariaLabel}
      disabled={loading}
      {...props}
    >
      {getIcon()}
      <span>{getText()}</span>
    </Button>
  );
};

/**
 * 特定用途向けのプリセットコンポーネント
 */

/**
 * テキスト展開ボタン（PostContent用）
 */
export const TextExpandButton: React.FC<
  Omit<ExpandButtonProps, 'variant' | 'showIcon'>
> = props => <ExpandButton variant='ghost' showIcon={false} {...props} />;

/**
 * ページネーションボタン（PostList用）
 */
export const PaginationExpandButton: React.FC<
  Omit<ExpandButtonProps, 'variant' | 'isExpanded' | 'expandedText'>
> = ({ customIcon, ...props }) => (
  <ExpandButton
    variant='outline'
    isExpanded={false}
    customIcon={customIcon || <RefreshCw />}
    {...props}
  />
);

// expandButtonVariantsは削除済み - 直接Shadcn/ui Buttonを使用
// export type { ExpandButtonProps }; // 重複エクスポートを削除
