/**
 * 🔐 2FA設定パネル（設定画面専用）
 *
 * 責任:
 * - 2FA設定・管理の統合UI
 * - QRコード表示・設定フロー
 * - バックアップコード管理
 * - 設定画面に最適化されたレイアウト
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Shield, Copy, Download, Smartphone, Key, AlertTriangle } from 'lucide-react';
import {
  useTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useRegenerateBackupCodesMutation,
} from '@libark/graphql-client';

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';

// フォームスキーマ
const setupSchema = z.object({
  password: z.string().min(1, 'パスワードが必要です'),
});

const enableSchema = z.object({
  totpCode: z
    .string()
    .length(6, 'TOTPコードは6桁である必要があります')
    .regex(/^\d{6}$/, 'TOTPコードは数字のみである必要があります'),
  password: z.string().min(1, 'パスワードが必要です'),
});

const disableSchema = z.object({
  password: z.string().min(1, 'パスワードが必要です'),
  code: z.string().min(1, 'TOTPコードまたはバックアップコードが必要です'),
});

const regenerateSchema = z.object({
  password: z.string().min(1, 'パスワードが必要です'),
  totpCode: z
    .string()
    .length(6, 'TOTPコードは6桁である必要があります')
    .regex(/^\d{6}$/, 'TOTPコードは数字のみである必要があります'),
});

type SetupFormData = z.infer<typeof setupSchema>;
type EnableFormData = z.infer<typeof enableSchema>;
type DisableFormData = z.infer<typeof disableSchema>;
type RegenerateFormData = z.infer<typeof regenerateSchema>;

interface TwoFactorSettingsPanelProps {
  onBack: () => void;
}

export const TwoFactorSettingsPanel: React.FC<TwoFactorSettingsPanelProps> = ({ onBack: _onBack }) => {
  const [step, setStep] = useState<'status' | 'setup' | 'enable' | 'disable' | 'regenerate'>(
    'status'
  );
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  } | null>(null);
  const [_backupCodes, setBackupCodes] = useState<string[]>([]);
  const [_showBackupCodes, setShowBackupCodes] = useState(false);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[]>([]);

  // GraphQLクエリ・ミューテーション
  const { data: statusData, refetch: refetchStatus } = useTwoFactorStatusQuery();
  const [setupTwoFactor, { loading: setupLoading }] = useSetupTwoFactorMutation();
  const [enableTwoFactor, { loading: enableLoading }] = useEnableTwoFactorMutation();
  const [disableTwoFactor, { loading: disableLoading }] = useDisableTwoFactorMutation();
  const [regenerateBackupCodes, { loading: regenerateLoading }] =
    useRegenerateBackupCodesMutation();

  // フォーム設定
  const setupForm = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  const enableForm = useForm<EnableFormData>({
    resolver: zodResolver(enableSchema),
  });

  const disableForm = useForm<DisableFormData>({
    resolver: zodResolver(disableSchema),
  });

  const regenerateForm = useForm<RegenerateFormData>({
    resolver: zodResolver(regenerateSchema),
  });

  const _compact = regenerateForm;

  const twoFactorEnabled = statusData?.twoFactorStatus?.enabled ?? false;

  // 2FA設定開始
  const handleSetup = async (data: SetupFormData) => {
    try {
      const result = await setupTwoFactor({
        variables: {
          input: { password: data.password },
        },
      });

      if (result.data?.setupTwoFactor) {
        setSetupData(result.data.setupTwoFactor);
        setStep('enable');
        toast.success('QRコードを生成しました');
      }
    } catch (error) {
      toast.error('設定の開始に失敗しました');
      console.error('Setup error:', error);
    }
  };

  // 2FA有効化
  const handleEnable = async (data: EnableFormData) => {
    try {
      const result = await enableTwoFactor({
        variables: {
          input: {
            totpCode: data.totpCode,
            password: data.password,
          },
        },
      });

      if (result.data?.enableTwoFactor?.success) {
        setBackupCodes(result.data.enableTwoFactor.backupCodes?.codes || []);
        setShowBackupCodes(true);
        await refetchStatus();
        toast.success('2FAが有効化されました');
        setStep('status');
      }
    } catch (error) {
      toast.error('2FAの有効化に失敗しました');
      console.error('Enable error:', error);
    }
  };

  // 2FA無効化
  const handleDisable = async (data: DisableFormData) => {
    try {
      const result = await disableTwoFactor({
        variables: {
          input: {
            password: data.password,
            code: data.code,
          },
        },
      });

      if (result.data?.disableTwoFactor?.success) {
        await refetchStatus();
        toast.success('2FAが無効化されました');
        setStep('status');
      }
    } catch (error) {
      toast.error('2FAの無効化に失敗しました');
      console.error('Disable error:', error);
    }
  };

  // バックアップコード再生成
  const handleRegenerateBackupCodes = async (data: RegenerateFormData) => {
    try {
      const result = await regenerateBackupCodes({
        variables: {
          input: {
            password: data.password,
            totpCode: data.totpCode,
          },
        },
      });

      if (result.data?.regenerateBackupCodes) {
        setRegeneratedCodes(result.data.regenerateBackupCodes.codes);
        await refetchStatus();
        regenerateForm.reset();
        toast.success('バックアップコードを再生成しました');
      }
    } catch (error) {
      toast.error('バックアップコード再生成でエラーが発生しました');
      console.error('Regenerate error:', error);
    }
  };

  // バックアップコード再生成ダイアログを開く
  const openRegenerateDialog = () => {
    setStep('regenerate');
  };

  // QRコードをクリップボードにコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('クリップボードにコピーしました');
  };

  // バックアップコードをクリップボードにコピー
  const copyBackupCodes = () => {
    const codesText = regeneratedCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('バックアップコードをコピーしました');
  };

  // バックアップコードをダウンロード
  const downloadBackupCodes = () => {
    const codesText = regeneratedCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'libark-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('バックアップコードをダウンロードしました');
  };

  // ステップに応じたコンテンツをレンダリング
  const renderContent = () => {
    switch (step) {
      case 'setup':
        return (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Shield className='h-5 w-5' />
                <span>2FA設定開始</span>
              </CardTitle>
              <CardDescription>パスワードを入力して2FAの設定を開始してください。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={setupForm.handleSubmit(handleSetup)} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='password'>パスワード</Label>
                  <Input
                    id='password'
                    type='password'
                    {...setupForm.register('password')}
                    placeholder='現在のパスワードを入力'
                  />
                  {setupForm.formState.errors.password && (
                    <p className='text-sm text-red-500'>
                      {setupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className='flex space-x-2'>
                  <Button type='submit' disabled={setupLoading}>
                    {setupLoading ? '処理中...' : '設定開始'}
                  </Button>
                  <Button type='button' variant='outline' onClick={() => setStep('status')}>
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );

      case 'enable':
        return (
          <div className='space-y-6'>
            {/* QRコード表示 */}
            {setupData && (
              <Card>
                <CardHeader>
                  <CardTitle>QRコードをスキャン</CardTitle>
                  <CardDescription>
                    認証アプリ（Google Authenticator、Authy等）でQRコードをスキャンしてください。
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-center'>
                    <div className='p-4 bg-white rounded-lg'>
                      <img src={setupData.qrCodeUrl} alt='2FA QR Code' className='w-48 h-48' />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>手動入力キー</Label>
                    <div className='flex space-x-2'>
                      <Input
                        value={setupData.manualEntryKey}
                        readOnly
                        className='font-mono text-sm'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => copyToClipboard(setupData.manualEntryKey)}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 認証コード入力 */}
            <Card>
              <CardHeader>
                <CardTitle>認証コードを入力</CardTitle>
                <CardDescription>
                  認証アプリに表示された6桁のコードを入力してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={enableForm.handleSubmit(handleEnable)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='totpCode'>認証コード</Label>
                    <Input
                      id='totpCode'
                      {...enableForm.register('totpCode')}
                      placeholder='123456'
                      maxLength={6}
                      className='text-center text-lg font-mono'
                    />
                    {enableForm.formState.errors.totpCode && (
                      <p className='text-sm text-red-500'>
                        {enableForm.formState.errors.totpCode.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='enablePassword'>パスワード確認</Label>
                    <Input
                      id='enablePassword'
                      type='password'
                      {...enableForm.register('password')}
                      placeholder='パスワードを再入力'
                    />
                    {enableForm.formState.errors.password && (
                      <p className='text-sm text-red-500'>
                        {enableForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className='flex space-x-2'>
                    <Button type='submit' disabled={enableLoading}>
                      {enableLoading ? '有効化中...' : '2FAを有効化'}
                    </Button>
                    <Button type='button' variant='outline' onClick={() => setStep('status')}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case 'regenerate':
        return (
          <div className='space-y-6'>
            {/* バックアップコード再生成フォーム */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Key className='h-5 w-5' />
                  <span>バックアップコード再生成</span>
                </CardTitle>
                <CardDescription>
                  新しいバックアップコードを生成します。既存のバックアップコードは無効になります。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={regenerateForm.handleSubmit(handleRegenerateBackupCodes)}
                  className='space-y-4'
                >
                  <div className='space-y-2'>
                    <Label htmlFor='regenerate-password'>パスワード</Label>
                    <Input
                      id='regenerate-password'
                      type='password'
                      {...regenerateForm.register('password')}
                      placeholder='現在のパスワードを入力'
                    />
                    {regenerateForm.formState.errors.password && (
                      <p className='text-sm text-red-600'>
                        {regenerateForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='regenerate-totp'>認証コード</Label>
                    <Input
                      id='regenerate-totp'
                      type='text'
                      {...regenerateForm.register('totpCode')}
                      placeholder='123456'
                      maxLength={6}
                    />
                    {regenerateForm.formState.errors.totpCode && (
                      <p className='text-sm text-red-600'>
                        {regenerateForm.formState.errors.totpCode.message}
                      </p>
                    )}
                  </div>

                  <div className='flex space-x-2'>
                    <Button type='submit' disabled={regenerateLoading}>
                      {regenerateLoading ? '再生成中...' : '再生成'}
                    </Button>
                    <Button type='button' variant='outline' onClick={() => setStep('status')}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 再生成されたバックアップコード表示 */}
            {regeneratedCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <Key className='h-5 w-5' />
                    <span>新しいバックアップコード</span>
                  </CardTitle>
                  <CardDescription>
                    これらのコードを安全な場所に保存してください。各コードは一度だけ使用できます。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm'>
                      {regeneratedCodes.map((code, index) => (
                        <div key={index} className='p-2 bg-background rounded border'>
                          {code}
                        </div>
                      ))}
                    </div>

                    <div className='flex space-x-2'>
                      <Button onClick={copyBackupCodes} variant='outline' size='sm'>
                        <Copy className='h-4 w-4 mr-2' />
                        コピー
                      </Button>
                      <Button onClick={downloadBackupCodes} variant='outline' size='sm'>
                        <Download className='h-4 w-4 mr-2' />
                        ダウンロード
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'disable':
        return (
          <div className='space-y-6'>
            {/* 2FA無効化フォーム */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <AlertTriangle className='h-5 w-5 text-destructive' />
                  <span>2FA無効化</span>
                </CardTitle>
                <CardDescription>
                  2FAを無効化すると、アカウントのセキュリティレベルが低下します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='p-4 border border-destructive/20 bg-destructive/5 rounded-lg mb-4'>
                  <h3 className='font-medium text-destructive mb-2'>⚠️ 重要な警告</h3>
                  <p className='text-sm text-muted-foreground'>
                    2FAを無効化すると、アカウントのセキュリティが大幅に低下します。
                    続行するには、パスワードと認証コードの入力が必要です。
                  </p>
                </div>

                <form onSubmit={disableForm.handleSubmit(handleDisable)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='disable-password'>パスワード確認</Label>
                    <Input
                      id='disable-password'
                      type='password'
                      {...disableForm.register('password')}
                      placeholder='現在のパスワードを入力'
                    />
                    {disableForm.formState.errors.password && (
                      <p className='text-sm text-red-600'>
                        {disableForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='disable-code'>認証コードまたはバックアップコード</Label>
                    <Input
                      id='disable-code'
                      type='text'
                      {...disableForm.register('code')}
                      placeholder='123456 または ABCD1234'
                    />
                    {disableForm.formState.errors.code && (
                      <p className='text-sm text-red-600'>
                        {disableForm.formState.errors.code.message}
                      </p>
                    )}
                    <p className='text-xs text-muted-foreground'>
                      認証アプリの6桁コードまたはバックアップコードを入力してください
                    </p>
                  </div>

                  <div className='flex space-x-2'>
                    <Button type='button' variant='outline' onClick={() => setStep('status')}>
                      キャンセル
                    </Button>
                    <Button type='submit' variant='destructive' disabled={disableLoading}>
                      {disableLoading ? '無効化中...' : '2FAを無効化'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className='space-y-6'>
            {/* 2FA状態表示 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Smartphone className='h-5 w-5' />
                  <span>二要素認証の状態</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>{twoFactorEnabled ? '有効' : '無効'}</p>
                    <p className='text-sm text-muted-foreground'>
                      {twoFactorEnabled
                        ? 'アカウントは2FAで保護されています'
                        : 'アカウントのセキュリティを強化しましょう'}
                    </p>
                  </div>
                  <div className='space-x-2'>
                    {twoFactorEnabled ? (
                      <>
                        <Button variant='outline' onClick={() => setStep('disable')}>
                          無効化
                        </Button>
                        <Button
                          variant='outline'
                          onClick={openRegenerateDialog}
                          disabled={regenerateLoading}
                        >
                          バックアップコード再生成
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setStep('setup')}>2FAを設定</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* セキュリティ情報 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <AlertTriangle className='h-5 w-5 text-amber-500' />
                  <span>重要な情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm text-muted-foreground'>
                  <p>• 2FAを有効にすると、ログイン時に認証アプリからのコードが必要になります</p>
                  <p>• バックアップコードは安全な場所に保管してください</p>
                  <p>• 認証アプリを紛失した場合、バックアップコードでアクセスできます</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return <div className='space-y-6'>{renderContent()}</div>;
};
