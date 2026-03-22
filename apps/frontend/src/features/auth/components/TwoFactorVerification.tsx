/**
 * 🔐 2FA認証コンポーネント
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Shield, HelpCircle } from 'lucide-react';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';

// フォームスキーマ
const verificationSchema = z.object({
  code: z
    .string()
    .min(6, 'コードは6桁以上である必要があります')
    .max(8, 'コードは8桁以下である必要があります')
    .regex(/^[A-Z0-9]+$/, 'コードは英数字のみである必要があります'),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface TwoFactorVerificationProps {
  isOpen: boolean;
  tempUserId?: string | null;
  onClose?: () => void;
  onVerify?: (code: string) => Promise<boolean>;
  onSuccess?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  embedded?: boolean; // LoginDialog内での使用時はtrue
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  isOpen,
  tempUserId: _tempUserId,
  onClose,
  onVerify,
  onSuccess,
  onCancel,
  loading = false,
  embedded = false,
}) => {
  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const handleSubmit = async (data: VerificationFormData) => {
    try {
      if (onVerify) {
        const success = await onVerify(data.code);
        if (success) {
          form.reset();
          onSuccess?.();
          if (!embedded) {
            onClose?.();
          }
        }
      }
    } catch (error) {
      toast.error('認証に失敗しました');
      console.error('Verification error:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    if (embedded) {
      onCancel?.();
    } else {
      onClose?.();
    }
  };

  // embeddedモードの場合はDialogを使わずに直接コンテンツを返す
  const content = (
    <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
      <div>
        <Label htmlFor='code'>認証コードまたはバックアップコード</Label>
        <Input
          id='code'
          placeholder='123456 または ABCD1234'
          maxLength={8}
          className='text-center font-mono text-lg'
          {...form.register('code')}
          error={form.formState.errors.code?.message}
          autoFocus
        />
        <div className='mt-2 text-xs text-muted-foreground'>
          <HelpCircle className='inline h-3 w-3 mr-1' />
          認証アプリの6桁コードまたはバックアップコードを入力してください
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Button type='submit' loading={loading} className='w-full'>
          認証
        </Button>

        {!embedded && (
          <Button type='button' variant='outline' onClick={handleClose}>
            キャンセル
          </Button>
        )}
      </div>

      <div className='text-xs text-muted-foreground space-y-2 border-t pt-4'>
        <p>
          <strong>認証アプリのコード:</strong> Google Authenticator、Authy等で生成される6桁の数字
        </p>
        <p>
          <strong>バックアップコード:</strong> 2FA設定時に保存した8桁の英数字コード
        </p>
      </div>
    </form>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            二要素認証
          </DialogTitle>
          <DialogDescription>
            認証アプリのコードまたはバックアップコードを入力してください
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
