/**
 * 🎯 モダンアカウント設定ページ
 *
 * Shadcnデフォルトスタイル + アトミックデザイン
 * ミニマルでモダンなデザイン
 */

'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAuth, type User } from '@libark/graphql-client';

import { Button } from '@/components/atoms';
import { Input } from '@/components/atoms';
import { Label } from '@/components/atoms';
import { Header } from '@/components/molecules/Header';

const AccountPage: React.FC = () => {
  const { user } = useAuth() as { user: User | null };

  return (
    <div>
      {/* ページヘッダー - Xスタイル */}
      <Header title='アカウント' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* 基本情報 */}
      <div className='bg-background border-b border-border/30'>
        <div className='p-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <UserIcon className='h-4 w-4' />
            <span className='text-base font-semibold'>基本情報</span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='username'>ユーザー名</Label>
              <Input
                id='username'
                defaultValue={user?.username || ''}
                placeholder='ユーザー名を入力'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='displayName'>表示名</Label>
              <Input
                id='displayName'
                defaultValue={user?.displayName || ''}
                placeholder='表示名を入力'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>メールアドレス</Label>
              <Input
                id='email'
                defaultValue={user?.email || ''}
                placeholder='メールアドレス'
                disabled
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bio'>自己紹介</Label>
            <Input id='bio' placeholder='自己紹介を入力' />
          </div>

          <div className='flex justify-end'>
            <Button>変更を保存</Button>
          </div>
        </div>
      </div>

      {/* 余計な未実装セクションを削除しました（通知・セキュリティ・危険な操作） */}
    </div>
  );
};

export default AccountPage;
