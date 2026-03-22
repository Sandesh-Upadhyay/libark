/**
 * 🎯 設定画面メニューアイテム定義 (Config)
 *
 * 責任:
 * - 設定画面のメニューアイテム定義
 * - 権限チェック
 * - アイコンとメタデータの管理
 *
 * 特徴:
 * - 統一されたメニューアイテム型を使用
 * - 権限ベースの表示制御
 * - 拡張可能な設計
 */

import React from 'react';
import { User, Palette, Shield } from 'lucide-react';

import type { SettingsMenuItem } from '@/types';

/**
 * 設定メニュー項目の定義
 */
export const getSettingsMenuItems = (_isAdmin: boolean): SettingsMenuItem[] => {
  const baseItems: SettingsMenuItem[] = [
    {
      id: 'account',
      title: 'アカウント',
      subtitle: 'プロフィール、基本情報',
      description: 'ユーザー名、表示名、プロフィール画像などの基本情報を管理',
      icon: <User className='h-5 w-5 text-info' />,
      href: '/settings/account',
      category: 'account',
      requireAuth: true,
    },
    {
      id: 'display',
      title: '表示設定',
      subtitle: 'テーマ、言語、タイムゾーン',
      description: 'アプリの外観、言語、時間表示などの設定',
      icon: <Palette className='h-5 w-5 text-primary' />,
      href: '/settings/display',
      category: 'display',
      requireAuth: true,
    },
    {
      id: 'security',
      title: 'セキュリティ',
      subtitle: '2FA、パスワード、セキュリティ設定',
      description: '二要素認証、パスワード変更、セキュリティ関連の設定',
      icon: <Shield className='h-5 w-5 text-destructive' />,
      href: '/settings/security',
      category: 'security',
      requireAuth: true,
    },
  ];

  return baseItems;
};
