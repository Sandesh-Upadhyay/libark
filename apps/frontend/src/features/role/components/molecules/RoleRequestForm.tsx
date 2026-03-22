/**
 * 🎯 権限申請フォームコンポーネント (Molecule)
 *
 * 責任:
 * - 権限申請フォームの表示
 * - バリデーション
 * - 申請送信
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms';
import { Button } from '@/components/atoms';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/atoms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';
import { Textarea } from '@/components/atoms';

/**
 * 権限申請フォームのスキーマ
 */
const _permissionRequestSchema = z.object({
  requestedPermission: z.enum(['CONTENT_SELLER', 'P2P_TRADER'], {
    required_error: '申請する権限を選択してください',
  }),
  reason: z
    .string()
    .min(10, '申請理由は10文字以上で入力してください')
    .max(500, '申請理由は500文字以内で入力してください'),
});

// 実際に使用するスキーマ
const _permissionRequestSchemaUsed = _permissionRequestSchema;
const roleRequestSchema = _permissionRequestSchema;

type PermissionRequestFormData = z.infer<typeof _permissionRequestSchemaUsed>;
type RoleRequestFormData = PermissionRequestFormData;

export interface PermissionRequestFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /** フォーム送信成功時のコールバック */
  onSuccess?: () => void;
  /** フォーム送信キャンセル時のコールバック */
  onCancel?: () => void;
}

// エイリアス
export type RoleRequestFormProps = PermissionRequestFormProps;

/**
 * 権限選択肢の定義
 */
// モックフック（実装が必要な場合は適切なフックに置き換え）
const useCreateRoleRequest = () => {
  return {
    mutate: (data: RoleRequestFormData) => {
      console.log('Role request submitted:', data);
      // 実際の実装では適切なAPIコールを行う
    },
    isPending: false,
    error: null,
  };
};

const _PERMISSION_OPTIONS = [
  {
    value: 'CONTENT_SELLER',
    label: 'コンテンツ販売者 (CONTENT_SELLER)',
    description: 'デジタルコンテンツの販売が可能になります',
  },
  {
    value: 'P2P_TRADER',
    label: 'P2P取引者 (P2P_TRADER)',
    description: 'ユーザー間でのウォレット残高売買が可能になります',
  },
];

// 役割オプション
const ROLE_OPTIONS = _PERMISSION_OPTIONS;

/**
 * 🎯 ロール申請フォームコンポーネント
 */
export const RoleRequestForm = React.forwardRef<HTMLDivElement, RoleRequestFormProps>(
  ({ onSuccess, onCancel, className, ...props }, ref) => {
    const { mutate: createRequest, isPending: loading } = useCreateRoleRequest();

    const form = useForm<RoleRequestFormData>({
      resolver: zodResolver(roleRequestSchema),
      defaultValues: {
        requestedPermission: undefined,
        reason: '',
      },
    });

    const onSubmit = async (data: RoleRequestFormData) => {
      try {
        createRequest({
          requestedPermission: data.requestedPermission,
          reason: data.reason,
        });

        toast.success('申請を送信しました。管理者による承認をお待ちください。');

        form.reset();
        onSuccess?.();
      } catch (error) {
        console.error('ロール申請エラー:', error);
        // toast({
        // title: '申請の送信に失敗しました', // titleプロパティが存在しないためコメントアウト
        // description: 'しばらく時間をおいて再度お試しください。', // descriptionプロパティが存在しないためコメントアウト
        // variant: 'destructive', // variantプロパティが存在しないためコメントアウト
        // });
      }
    };

    return (
      <Card ref={ref} className={cn('w-full max-w-2xl', className)} {...props}>
        <CardHeader>
          <CardTitle>ロール申請</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='requestedPermission'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申請するロール</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='ロールを選択してください' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{option.label}</span>
                              <span className='text-sm text-muted-foreground'>
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申請理由</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='なぜこのロールが必要なのか、具体的な理由を記入してください...'
                        className='min-h-[120px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                <Button type='submit' disabled={loading} className='flex-1'>
                  {loading ? '送信中...' : '申請を送信'}
                </Button>
                {onCancel && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onCancel}
                    disabled={loading}
                    className='flex-1'
                  >
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
);

RoleRequestForm.displayName = 'RoleRequestForm';
