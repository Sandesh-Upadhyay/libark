/**
 * 🎯 管理画面メニューアイテム定義 (Config)
 *
 * 責任:
 * - 管理画面のメニューアイテム定義
 * - 権限チェック
 * - アイコンとメタデータの管理
 *
 * 特徴:
 * - 統一されたメニューアイテム型を使用
 * - 権限ベースの表示制御
 * - 拡張可能な設計
 */

import React from 'react';
import {
  Sliders,
  UserCheck,
  Users,
  DollarSign,
  BarChart3,
  Database,
  Activity,
  Shield,
} from 'lucide-react';

import type { AdminMenuItem } from '@/types';

/**
 * 管理メニュー項目の定義
 */
export const getAdminMenuItems = (isAdmin: boolean): AdminMenuItem[] => {
  if (!isAdmin) {
    return [];
  }

  const adminItems: AdminMenuItem[] = [
    {
      id: 'site-features',
      label: 'サイト機能管理',
      title: 'サイト機能管理',
      subtitle: 'ウォレット、メッセージ、投稿機能',
      description: 'サイト全体の機能の有効/無効を管理',
      icon: <Sliders className='h-5 w-5 text-info' />,
      href: '/admin/site-features',
      requireAdmin: true,
    },
    {
      id: 'user-permissions',
      label: 'ユーザー権限管理',
      title: 'ユーザー権限管理',
      subtitle: '個別ユーザーの機能権限',
      description: 'ユーザーごとの機能アクセス権限を管理',
      icon: <UserCheck className='h-5 w-5 text-success' />,
      href: '/admin/user-permissions',
      requireAdmin: true,
    },
    {
      id: 'users',
      label: 'ユーザー管理',
      title: 'ユーザー管理',
      subtitle: 'アカウント、プロフィール管理',
      description: 'ユーザーアカウントの管理と監視',
      icon: <Users className='h-5 w-5 text-primary' />,
      href: '/admin/users',
      requireAdmin: true,
    },
    {
      id: 'payments',
      label: '決済管理',
      title: '決済管理',
      subtitle: '入出金、取引履歴',
      description: '決済システムの管理と監視',
      icon: <DollarSign className='h-5 w-5 text-emerald-500' />,
      href: '/admin/payments',
      requireAdmin: true,
    },
    {
      id: 'stats',
      label: 'システム統計',
      title: 'システム統計',
      subtitle: 'パフォーマンス、利用状況',
      description: 'システム全体の統計情報と分析',
      icon: <BarChart3 className='h-5 w-5 text-orange-500' />,
      href: '/admin/stats',
      requireAdmin: true,
    },
    {
      id: 'system',
      label: 'システム設定',
      title: 'システム設定',
      subtitle: 'サーバー、データベース設定',
      description: 'システム全体の設定と管理',
      icon: <Database className='h-5 w-5 text-gray-500' />,
      href: '/admin/system',
      requireAdmin: true,
    },
    {
      id: 'monitoring',
      label: 'システム監視',
      title: 'システム監視',
      subtitle: 'ログ、エラー監視',
      description: 'システムの健全性とパフォーマンス監視',
      icon: <Activity className='h-5 w-5 text-red-500' />,
      href: '/admin/monitoring',
      requireAdmin: true,
    },
    {
      id: 'security',
      label: 'セキュリティ管理',
      title: 'セキュリティ管理',
      subtitle: '認証、権限、監査ログ',
      description: 'セキュリティ設定と監査機能',
      icon: <Shield className='h-5 w-5 text-indigo-500' />,
      href: '/admin/security',
      requireAdmin: true,
      dangerous: true,
    },
  ];

  return adminItems;
};
