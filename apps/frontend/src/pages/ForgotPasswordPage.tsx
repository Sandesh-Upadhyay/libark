/**
 * 🔑 ForgotPasswordPage - パスワード忘れページ
 *
 * パスワードリセット機能を提供するページ
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

import { Button } from '@/components/atoms';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-8'>
        {/* ヘッダー */}
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            パスワードをお忘れですか？
          </h1>
          <p className='text-muted-foreground'>
            登録されたメールアドレスにパスワードリセットリンクをお送りします
          </p>
        </div>

        {/* フォーム */}
        <div className='bg-card border border-border rounded-lg shadow-lg p-6 space-y-6'>
          <div className='space-y-4'>
            {/* メールアドレスフィールド */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>メールアドレス</label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <input
                  type='email'
                  placeholder='メールアドレスを入力'
                  className='w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  data-testid='forgot-password-email-field'
                />
              </div>
            </div>

            {/* 送信ボタン */}
            <Button
              type='submit'
              className='w-full'
              size='lg'
              data-testid='forgot-password-submit-button'
            >
              <Mail className='mr-2 h-4 w-4' />
              リセットリンクを送信
            </Button>
          </div>

          {/* 戻るリンク */}
          <div className='text-center border-t border-border pt-4'>
            <Link
              to='/'
              className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
              data-testid='back-to-login-link'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              ログインページに戻る
            </Link>
          </div>
        </div>

        {/* フッター */}
        <div className='text-center text-xs text-muted-foreground'>
          <p>リセットリンクが届かない場合は、迷惑メールフォルダもご確認ください</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
