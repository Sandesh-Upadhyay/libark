/**
 * 🔐 セキュリティ設定ページ
 *
 * 責任:
 * - 2FA（二要素認証）設定の管理
 * - パスワード変更機能
 * - セキュリティログの表示
 * - セキュリティ関連設定の統合管理
 *
 * 特徴:
 * - 統一されたデザインシステム
 * - 2FAコンポーネントの統合
 * - セキュリティ重視のUX
 */

'use client';

import React, { useState } from 'react';
import { Key, Smartphone, AlertTriangle } from 'lucide-react';
import { useAuth, useTwoFactorStatusQuery } from '@libark/graphql-client';

import { Header, SectionShell } from '@/components/molecules';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/atoms';
import { TwoFactorSettingsPanel } from '@/features/auth/components/TwoFactorSettingsPanel';

const SecuritySettingsPage: React.FC = () => {
  const { user: _user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'twoFactor' | 'password'>(
    'overview'
  );

  // 2FA状態を取得
  const { data: twoFactorStatus, loading: twoFactorLoading } = useTwoFactorStatusQuery();
  const twoFactorEnabled = twoFactorStatus?.twoFactorStatus?.enabled ?? false;

  const renderContent = () => {
    switch (activeSection) {
      case 'twoFactor':
        return (
          <SectionShell
            title='二要素認証'
            description=''
            icon={Smartphone}
            variant='settings'
            showHeader={false}
          >
            <TwoFactorSettingsPanel onBack={() => setActiveSection('overview')} />
          </SectionShell>
        );

      case 'password':
        return (
          <SectionShell
            title='パスワード変更'
            description='セキュリティを保つため、定期的にパスワードを変更することをお勧めします。'
            icon={Key}
            variant='settings'
          >
            <div className='text-sm text-muted-foreground'>
              パスワード変更機能は近日実装予定です。
            </div>
          </SectionShell>
        );

      default:
        return (
          <div className='space-y-6'>
            {/* セキュリティ概要 */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Card data-testid='two-factor-card'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>二要素認証</CardTitle>
                  <Smartphone className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{twoFactorEnabled ? '有効' : '無効'}</div>
                  <p className='text-xs text-muted-foreground'>
                    {twoFactorEnabled
                      ? 'アカウントは2FAで保護されています'
                      : 'アカウントのセキュリティを強化しましょう'}
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-2'
                    onClick={() => setActiveSection('twoFactor')}
                  >
                    {twoFactorEnabled ? '管理' : '設定'}
                  </Button>
                </CardContent>
              </Card>

              <Card data-testid='password-card'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>パスワード</CardTitle>
                  <Key className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>保護済み</div>
                  <p className='text-xs text-muted-foreground'>最終更新: 未実装</p>
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-2'
                    onClick={() => setActiveSection('password')}
                  >
                    変更
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* セキュリティ推奨事項 */}
            <SectionShell
              title='セキュリティ推奨事項'
              description=''
              icon={AlertTriangle}
              variant='settings'
              showHeader={false}
            >
              <div className='space-y-3'>
                <div className='flex items-start space-x-3'>
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <div>
                    <p className='font-medium'>二要素認証を有効にする</p>
                    <p className='text-sm text-muted-foreground'>
                      アカウントのセキュリティを大幅に向上させます
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 rounded-full mt-2 bg-amber-500' />
                  <div>
                    <p className='font-medium'>強力なパスワードを使用する</p>
                    <p className='text-sm text-muted-foreground'>
                      8文字以上で、大文字・小文字・数字・記号を含む
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 rounded-full mt-2 bg-amber-500' />
                  <div>
                    <p className='font-medium'>定期的にパスワードを変更する</p>
                    <p className='text-sm text-muted-foreground'>3〜6ヶ月ごとの変更を推奨します</p>
                  </div>
                </div>
              </div>
            </SectionShell>
          </div>
        );
    }
  };

  return (
    <div>
      {/* ページヘッダー */}
      <Header title='セキュリティ' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* ナビゲーション */}
      {activeSection !== 'overview' && (
        <div className='p-4 border-b border-border/30'>
          <Button variant='ghost' size='sm' onClick={() => setActiveSection('overview')}>
            ← セキュリティ設定に戻る
          </Button>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className='p-4'>{renderContent()}</div>
    </div>
  );
};

export default SecuritySettingsPage;
