import { useLoginWithTwoFactorMutation } from '@libark/graphql-client';
import { useAuth } from '@libark/graphql-client';

/**
 * 2FA認証を実行するヘルパー関数
 */
export const createTwoFactorVerifier = () => {
  const [loginWithTwoFactor] = useLoginWithTwoFactorMutation();
  const { refetch } = useAuth();

  return async (
    tempUserId: string,
    code: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      console.log('🔐 [TwoFactorAuth] GraphQL 2FA認証実行:', {
        tempUserId,
        code: code.substring(0, 2) + '****',
      });

      const result = await loginWithTwoFactor({
        variables: {
          input: {
            tempUserId,
            code,
          },
        },
      });

      if (result.data?.loginWithTwoFactor?.success) {
        console.log('🔐 [TwoFactorAuth] GraphQL 2FA認証成功');
        // 認証状態を更新
        await refetch();
        return { success: true };
      } else {
        console.log(
          '🔐 [TwoFactorAuth] GraphQL 2FA認証失敗:',
          result.data?.loginWithTwoFactor?.message
        );
        return { success: false, errorMessage: result.data?.loginWithTwoFactor?.message };
      }
    } catch (error: unknown) {
      console.error('🔐 [TwoFactorAuth] GraphQL 2FA認証エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '認証エラーが発生しました';
      return { success: false, errorMessage };
    }
  };
};

/**
 * 2FA認証フックを使用するコンポーネント用のヘルパー
 */
export const useTwoFactorVerifier = () => {
  return createTwoFactorVerifier();
};
