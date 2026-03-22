/**
 * SocialLink - フッター専用ソーシャルリンクコンポーネント
 *
 * シンプルで統一されたソーシャルリンクスタイル
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SocialLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const SocialLink: React.FC<SocialLinkProps> = ({
  href,
  icon: Icon,
  label,
  className,
  ...props
}) => (
  <a
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    className={className}
    aria-label={label}
    {...props}
  >
    <Icon className='' />
  </a>
);

SocialLink.displayName = 'SocialLink';
