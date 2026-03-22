/**
 * 🎯 ユーザー権限管理ページ
 *
 * 責任:
 * - ユーザー個別の機能権限管理
 * - ユーザー検索・選択
 * - 権限の有効期限設定
 * - 権限変更履歴表示
 */

'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';

import { Header, SectionShell } from '@/components/molecules';

const UserPermissionsPage: React.FC = () => {
  return (
    <div className='flex flex-col h-full'>
      {/* ページヘッダー - Xスタイル */}
      <Header title='ユーザー権限管理' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* コンテンツエリア - スクロール対応 */}
      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 space-y-6'>
          <SectionShell
            title='ユーザー機能権限設定'
            description='個別ユーザーの機能アクセス権限を管理します。サイト機能が有効な場合でも、特定ユーザーの機能を無効にできます。'
            icon={UserCheck}
            variant='admin'
          >
            {/* TODO: ユーザー権限管理UI実装 */}
            <div className='space-y-6'>
              {/* ユーザー検索セクション */}
              <div className='p-4 border border-border rounded-lg'>
                <h3 className='font-medium mb-3'>ユーザー検索</h3>
                <p className='text-sm text-muted-foreground mb-3'>
                  権限を設定するユーザーを検索・選択してください
                </p>
                <div className='text-sm text-muted-foreground'>実装予定: ユーザー検索・選択UI</div>
              </div>

              {/* 権限設定セクション */}
              <div className='p-4 border border-border rounded-lg'>
                <h3 className='font-medium mb-3'>機能権限設定</h3>
                <p className='text-sm text-muted-foreground mb-3'>
                  選択したユーザーの各機能へのアクセス権限を設定
                </p>
                <div className='text-sm text-muted-foreground'>実装予定: 機能別権限設定UI</div>
              </div>

              {/* 有効期限設定セクション */}
              <div className='p-4 border border-border rounded-lg'>
                <h3 className='font-medium mb-3'>有効期限設定</h3>
                <p className='text-sm text-muted-foreground mb-3'>
                  権限の有効期限を設定（無期限も可能）
                </p>
                <div className='text-sm text-muted-foreground'>実装予定: 有効期限設定UI</div>
              </div>

              {/* 権限変更履歴セクション */}
              <div className='p-4 border border-border rounded-lg'>
                <h3 className='font-medium mb-3'>権限変更履歴</h3>
                <p className='text-sm text-muted-foreground mb-3'>ユーザーの権限変更履歴を表示</p>
                <div className='text-sm text-muted-foreground'>実装予定: 権限変更履歴表示UI</div>
              </div>
            </div>
          </SectionShell>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsPage;
