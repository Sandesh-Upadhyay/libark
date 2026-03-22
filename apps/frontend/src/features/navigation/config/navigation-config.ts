import {
  Bell,
  MessageSquare,
  User,
  LogIn,
  UserPlus,
  Settings,
  ShieldAlert,
  Wallet,
  Home,
} from 'lucide-react';
import type { ComponentType } from 'react';

// 機能フラグ型定義
interface Features {
  MESSAGES_ACCESS?: boolean;
  WALLET_ACCESS?: boolean;
}

/**
 * ベースナビゲーションメニューアイテム
 */
interface BaseNavMenuConfig {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

/**
 * リンクタイプのナビゲーションメニューアイテム
 */
interface LinkNavMenuConfig extends BaseNavMenuConfig {
  type: 'link';
  href: string;
  onClick?: never;
}

/**
 * ボタンタイプのナビゲーションメニューアイテム
 */
interface ButtonNavMenuConfig extends BaseNavMenuConfig {
  type: 'button';
  href?: never;
  onClick: () => void;
}

/**
 * ナビゲーションメニューアイテムの統合型
 */
export type NavMenuConfig = LinkNavMenuConfig | ButtonNavMenuConfig;

/**
 * 未読数の型定義
 */
export interface UnreadCounts {
  notifications: number;
  messages: number;
}

/**
 * サイドバー用ユーザープロフィール情報の型定義
 */
export interface SidebarUserProfile {
  id: string;
  username: string;
  displayName?: string;
  profileImageId?: string;
}

/**
 * 🎯 左側サイドメニュー用メニュー設定
 * Twitterライクな豊富なメニュー項目
 */
export const getLeftSidebarMenuConfig = (
  t: (key: string) => string,
  isAuthenticated: boolean,
  user: { username: string } | null,
  isAdmin: boolean = false,
  features?: Features
): NavMenuConfig[] => {
  const baseItems: NavMenuConfig[] = [
    {
      id: 'home',
      type: 'link',
      icon: Home,
      label: t('common.home') || 'ホーム',
      href: isAuthenticated ? '/home' : '/',
      requireAuth: false,
    },
  ];

  if (!isAuthenticated) {
    return [
      ...baseItems,
      {
        id: 'login',
        type: 'link',
        icon: LogIn,
        label: t('common.login') || 'ログイン',
        href: '/login',
        requireAuth: false,
      },
      {
        id: 'register',
        type: 'link',
        icon: UserPlus,
        label: t('common.register') || '登録',
        href: '/register',
        requireAuth: false,
      },
    ];
  }

  const authenticatedItems: NavMenuConfig[] = [
    {
      id: 'notifications',
      type: 'link',
      icon: Bell,
      label: t('common.notifications') || '通知',
      href: '/notifications',
      requireAuth: true,
    },
  ];

  // メッセージ機能が有効な場合のみ追加
  if (features?.MESSAGES_ACCESS !== false) {
    authenticatedItems.push({
      id: 'messages',
      type: 'link',
      icon: MessageSquare,
      label: t('common.messages') || 'メッセージ',
      href: '/messages',
      requireAuth: true,
    });
  }

  // ウォレット機能が有効な場合のみ追加
  if (features?.WALLET_ACCESS !== false) {
    authenticatedItems.push({
      id: 'wallet',
      type: 'link',
      icon: Wallet,
      label: t('common.wallet') || 'ウォレット',
      href: '/wallet',
      requireAuth: true,
    });
  }

  return [
    ...baseItems,
    ...authenticatedItems,
    {
      id: 'profile',
      type: 'link',
      icon: User,
      label: t('common.profile') || 'プロフィール',
      href: user ? `/profile/${user.username}` : '/profile',
      requireAuth: true,
    },
    {
      id: 'settings',
      type: 'link',
      icon: Settings,
      label: t('common.settings') || '設定とプライバシー',
      href: '/settings',
      requireAuth: true,
    },
    // 管理者のみに表示
    ...(isAdmin
      ? [
          {
            id: 'admin',
            type: 'link' as const,
            icon: ShieldAlert,
            label: t('common.admin') || '管理者',
            href: '/admin',
            requireAuth: true,
            adminOnly: true,
          },
        ]
      : []),
  ];
};

/**
 * 🎯 モバイル下部ナビゲーション用メニュー設定
 * シンプルなアイコン中心のナビゲーション
 */
export const getMobileBottomNavConfig = (
  t: (key: string) => string,
  isAuthenticated: boolean,
  user: { username: string } | null,
  features?: Features
): NavMenuConfig[] => {
  const baseItems: NavMenuConfig[] = [
    {
      id: 'home',
      type: 'link',
      icon: Home,
      label: t('common.home') || 'ホーム',
      href: '/home',
      requireAuth: false,
    },
  ];

  if (!isAuthenticated) {
    return [
      ...baseItems,
      {
        id: 'login',
        type: 'link',
        icon: LogIn,
        label: t('common.login'),
        href: '/login',
        requireAuth: false,
      },
      {
        id: 'register',
        type: 'link',
        icon: UserPlus,
        label: t('common.register'),
        href: '/register',
        requireAuth: false,
      },
    ];
  }

  const mobileAuthenticatedItems: NavMenuConfig[] = [
    {
      id: 'notifications',
      type: 'link',
      icon: Bell,
      label: t('common.notifications'),
      href: '/notifications',
      requireAuth: true,
    },
  ];

  // メッセージ機能が有効な場合のみ追加
  if (features?.MESSAGES_ACCESS !== false) {
    mobileAuthenticatedItems.push({
      id: 'messages',
      type: 'link',
      icon: MessageSquare,
      label: t('common.messages'),
      href: '/messages',
      requireAuth: true,
    });
  }

  mobileAuthenticatedItems.push({
    id: 'profile',
    type: 'link',
    icon: User,
    label: t('common.profile'),
    href: user ? `/profile/${user.username}` : '/profile',
    requireAuth: true,
  });

  return [...baseItems, ...mobileAuthenticatedItems];
};

/**
 * 🎯 未読数取得ヘルパー
 */
export const getUnreadCount = (unreadCounts: UnreadCounts, key?: keyof UnreadCounts): number => {
  if (!key) return 0;
  return unreadCounts[key] || 0;
};
