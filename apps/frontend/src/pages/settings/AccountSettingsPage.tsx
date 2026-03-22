/* eslint-disable import/order */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, User as UserIcon, Mail, Lock } from 'lucide-react';
import { useAuth, type User } from '@libark/graphql-client';
import { toast } from 'sonner';
import { Button, Input, Label } from '@/components/atoms';
import { Header, SectionShell } from '@/components/molecules';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/atoms';
/* eslint-enable import/order */

/**
 * 🎯 アカウント設定ページ (責任分離・統一デザイン版)
 *
 * 責任:
 * - アカウントセキュリティ設定
 * - パスワード変更機能
 * - メールアドレス変更機能
 * - アカウント削除機能
 * - 統一されたデザインシステムの適用
 */

const AccountSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: _user } = useAuth() as { user: User | null };
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });

  // パスワード変更処理
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(
        t('settings.account.password.mismatch', { default: '新しいパスワードが一致しません' })
      );
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(
        t('settings.account.password.tooShort', {
          default: 'パスワードは8文字以上で入力してください',
        })
      );
      return;
    }
    setIsChangingPassword(true);
    try {
      // TODO: パスワード変更のGraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(
        t('settings.account.password.changeSuccess', { default: 'パスワードを変更しました' })
      );
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error(
        t('settings.account.password.changeError', { default: 'パスワードの変更に失敗しました' })
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // メールアドレス変更処理
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);
    try {
      // TODO: メールアドレス変更のGraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(
        t('settings.account.email.changeSuccess', {
          default: 'メールアドレス変更の確認メールを送信しました',
        })
      );
      setEmailForm({ newEmail: '', password: '' });
    } catch {
      toast.error(
        t('settings.account.email.changeError', { default: 'メールアドレスの変更に失敗しました' })
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  // アカウント削除処理
  const handleAccountDeletion = async () => {
    setIsDeletingAccount(true);
    try {
      // TODO: アカウント削除のGraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('settings.account.delete.success', { default: 'アカウントを削除しました' }));
      // ログアウト処理
    } catch {
      toast.error(
        t('settings.account.delete._error', { default: 'アカウントの削除に失敗しました' })
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div>
      {/* ページヘッダー */}
      <Header title='アカウント設定' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* 基本情報セクション */}
      <SectionShell
        title='基本情報'
        description='アカウントの基本情報を確認できます'
        icon={UserIcon}
        variant='settings'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>ユーザー名</Label>
            <div className='flex items-center justify-between p-3 bg-muted/50 rounded-md'>
              <span className='text-sm'>{_user?.username || '未設定'}</span>
              <span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded'>
                変更不可
              </span>
            </div>
          </div>
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>メールアドレス</Label>
            <div className='flex items-center justify-between p-3 bg-muted/50 rounded-md'>
              <span className='text-sm'>{_user?.email || '未設定'}</span>
              <span className='text-xs text-primary bg-primary/10 px-2 py-1 rounded'>変更可能</span>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* パスワード変更セクション */}
      <SectionShell
        title='パスワード変更'
        description='新しいパスワードは8文字以上で設定してください'
        icon={Lock}
        variant='settings'
      >
        <form onSubmit={handlePasswordChange} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>現在のパスワード</Label>
            <Input
              id='currentPassword'
              type='password'
              value={passwordForm.currentPassword}
              onChange={e =>
                setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
              }
              placeholder='現在のパスワードを入力'
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='newPassword'>新しいパスワード</Label>
            <Input
              id='newPassword'
              type='password'
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder='新しいパスワードを入力'
              minLength={8}
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>パスワード確認</Label>
            <Input
              id='confirmPassword'
              type='password'
              value={passwordForm.confirmPassword}
              onChange={e =>
                setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
              }
              placeholder='新しいパスワードを再入力'
              minLength={8}
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className='flex justify-end pt-4'>
            <Button type='submit' disabled={isChangingPassword} className='min-w-[120px]'>
              {isChangingPassword ? '変更中...' : 'パスワードを変更'}
            </Button>
          </div>
        </form>
      </SectionShell>

      {/* メールアドレス変更セクション */}
      <SectionShell
        title='メールアドレス変更'
        description='新しいメールアドレスに確認メールが送信されます'
        icon={Mail}
        variant='settings'
      >
        <form onSubmit={handleEmailChange} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='newEmail'>新しいメールアドレス</Label>
            <Input
              id='newEmail'
              type='email'
              value={emailForm.newEmail}
              onChange={e => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
              placeholder='新しいメールアドレスを入力'
              required
              disabled={isChangingEmail}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='emailPassword'>現在のパスワード</Label>
            <Input
              id='emailPassword'
              type='password'
              value={emailForm.password}
              onChange={e => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder='現在のパスワードを入力'
              required
              disabled={isChangingEmail}
            />
          </div>

          <div className='flex justify-end pt-4'>
            <Button type='submit' disabled={isChangingEmail} className='min-w-[140px]'>
              {isChangingEmail ? '変更中...' : 'メールアドレスを変更'}
            </Button>
          </div>
        </form>
      </SectionShell>

      {/* 危険な操作セクション */}
      <SectionShell
        title='危険な操作'
        description='アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。'
        icon={Trash2}
        variant='danger'
      >
        <div className='p-4 bg-destructive/5 rounded-lg border border-destructive/20'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <h4 className='text-sm font-medium text-destructive'>アカウント削除</h4>
              <p className='text-xs text-muted-foreground'>
                この操作は取り消せません。すべてのデータが完全に削除されます。
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' size='sm' disabled={isDeletingAccount}>
                  <Trash2 className='h-4 w-4 mr-2' />
                  アカウントを削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>アカウントを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消すことができません。アカウントとすべてのデータが完全に削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAccountDeletion}
                    className='bg-destructive text-white hover:bg-destructive/90'
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? '削除中...' : '完全に削除する'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SectionShell>
    </div>
  );
};

export default AccountSettingsPage;
