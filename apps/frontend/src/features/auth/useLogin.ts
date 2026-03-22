/**
 * 🚀 現代的ログインフック（統一版）
 *
 * useAuthFormベースの統一されたログインフック
 * - 共通エラーハンドリング
 * - 統一されたローディング状態管理
 * - 統一されたリダイレクト処理
 */

import { useAuth } from '@libark/graphql-client';

import { useTwoFactorActions } from '@/stores/twoFactor';
import type { AuthFormConfig } from '@/features/auth/types';

import { loginSchema, type LoginFormData } from './validations';
import { useAuthForm, createFormDataTransformer } from './hooks/useAuthForm';
import { createLoginErrorHandler } from './utils/authErrorHandler';


export function useLogin(config: AuthFormConfig<LoginFormData> = {}) {
  const { login, isLoading: isAuthLoading } = useAuth();
  const { open: openTwoFactorDialog } = useTwoFactorActions();

  // 2FA対応のログイン処理
  const handleLoginWithTwoFactor = async (data: LoginFormData) => {
    console.log('🔐 [DEBUG] ログイン試行開始:', { email: data.email });
    // #region agent log
    fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a7f7a'},body:JSON.stringify({sessionId:'1a7f7a',runId:'pre-fix',hypothesisId:'E',location:'apps/frontend/src/features/auth/useLogin.ts:26',message:'Login submit started',data:{hasEmail:!!data.email,emailLength:data.email?String(data.email).length:0,hasPassword:!!data.password,passwordLength:data.password?String(data.password).length:0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const result = await login(data);

    console.log('🔐 [DEBUG] ログイン結果:', {
      success: result?.success,
      requiresTwoFactor: result?.requiresTwoFactor,
      tempUserId: result?.tempUserId,
      error: result?.error,
      message: result?.message,
    });
    // #region agent log
    fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a7f7a'},body:JSON.stringify({sessionId:'1a7f7a',runId:'pre-fix',hypothesisId:'E',location:'apps/frontend/src/features/auth/useLogin.ts:30',message:'Login submit result',data:{success:!!result?.success,requiresTwoFactor:!!result?.requiresTwoFactor,hasTempUserId:!!result?.tempUserId,hasError:!!result?.error,error:String(result?.error||''),message:String(result?.message||'')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // 2FAが必要な場合は2FA認証画面を開く
    if (result?.requiresTwoFactor && result?.tempUserId) {
      console.log('🔐 [DEBUG] 2FA認証ダイアログを開く:', result.tempUserId);
      openTwoFactorDialog(result.tempUserId);
      return { success: false, requiresTwoFactor: true };
    }

    return result;
  };

  // 統一認証フォームフックを使用
  return useAuthForm(config, {
    schema: loginSchema,
    defaultValues: { email: '', password: '' } as const,
    authAction: handleLoginWithTwoFactor,
    isAuthLoading,
    transformFormData: createFormDataTransformer.login,
    createErrorHandler: createLoginErrorHandler,
  });
}
