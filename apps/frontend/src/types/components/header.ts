/**
 * ヘッダーコンポーネント関連の型定義
 */
import React from 'react';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonLabel?: string;
  rightAction?: React.ReactNode;
  className?: string;
  showBorder?: boolean;
  variant?: 'default' | 'x-style' | 'minimal';
  headingLevel?: HeadingLevel;
}

export interface PageHeaderProps extends HeaderProps {
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}
