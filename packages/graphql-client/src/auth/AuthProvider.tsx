/**
 * 🔐 認証プロバイダー（最適化版）
 *
 * GraphQL中心の統一認証システム
 * - Apollo Client useMeQuery を単一ソースとして使用
 * - 型安全性とパフォーマンスを重視
 * - 責任分離の徹底
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

import {
  useMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  MeDocument,
  type LoginInput,
  type RegisterInput,
  type UserInfoFragment,
} from '../generated/graphql.js';
// 型定義を直接定義（Docker環境でのTypeScript型解決問題の回避）
interface AuthResponse<T = any> {
  success: boolean;
  data?: T | null;
  message?: string;
  error?: string;
  requiresTwoFactor?: boolean;
  tempUserId?: string;
}

// 認証状態の型定義
interface AuthState {
  user: UserInfoFragment | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<AuthResponse<UserInfoFragment>>;
  register: (data: RegisterInput) => Promise<AuthResponse<UserInfoFragment>>;
  logout: (options?: { skipRedirect?: boolean }) => Promise<void>;
  refetch: () => Promise<void>;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  userId?: string;
  username?: string;
  clientReady: boolean;
}

// 認証コンテキスト
const AuthContext = createContext<AuthState | undefined>(undefined);

// プロバイダーのプロパティ
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 🔐 認証プロバイダー
 */
export const AuthProvider = React.memo<AuthProviderProps>(({ children }) => {
  const client = useApolloClient();

  // Apollo Clientクエリ（初回はネットワーク、以降はキャッシュ優先）
  const {
    data: meData,
    loading: meLoading,
    error: meError,
    refetch,
  } = useMeQuery({
    fetchPolicy: 'cache-first', // 初回はネットワークから取得
    nextFetchPolicy: 'cache-first', // 以降はキャッシュ優先
    errorPolicy: 'ignore',
    notifyOnNetworkStatusChange: false,
  });

  // ミューテーション
  const [loginMutation, { loading: loginLoading }] = useLoginMutation();
  const [registerMutation, { loading: registerLoading }] = useRegisterMutation();
  const [logoutMutation, { loading: logoutLoading }] = useLogoutMutation();

  // 認証アクション
  const login = useCallback(
    async (credentials: LoginInput): Promise<AuthResponse<UserInfoFragment>> => {
      try {
        console.log('🔐 [DEBUG] AuthProvider: loginMutation開始');
        const result = await loginMutation({ variables: { input: credentials } });
        console.log('🔐 [DEBUG] AuthProvider: loginMutation完了', {
          hasLoginData: !!result.data?.login,
          success: result.data?.login?.success,
        });

        // GraphQLレスポンスを統一形式に変換
        console.log('🔐 [DEBUG] AuthProvider GraphQLレスポンス:', {
          success: result.data?.login?.success,
          message: result.data?.login?.message,
          requiresTwoFactor: result.data?.login?.requiresTwoFactor,
          tempUserId: result.data?.login?.tempUserId,
          hasUser: !!result.data?.login?.user,
        });

        if (result.data?.login?.success) {
          const nextUser = result.data.login.user;
          if (nextUser) {
            // 認証状態の再取得（refetch）を避け、キャッシュ更新でUIの安定性を担保
            client.cache.writeQuery({
              query: MeDocument,
              data: { me: nextUser },
            } as any);
          }
          return {
            success: true,
            data: result.data.login.user,
            message: result.data.login.message,
            requiresTwoFactor: result.data.login.requiresTwoFactor || undefined,
            tempUserId: result.data.login.tempUserId || undefined,
          };
        } else {
          return {
            success: false,
            error: result.data?.login?.message || 'ログインに失敗しました',
            requiresTwoFactor: result.data?.login?.requiresTwoFactor || undefined,
            tempUserId: result.data?.login?.tempUserId || undefined,
          };
        }
      } catch (error: unknown) {
        console.log('🔐 [DEBUG] AuthProvider: loginMutation error', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'ログインに失敗しました',
        };
      }
    },
    [loginMutation, client]
  );

  const register = useCallback(
    async (data: RegisterInput): Promise<AuthResponse<UserInfoFragment>> => {
      try {
        console.log('🔐 [DEBUG] AuthProvider: registerMutation開始', {
          username: data.username,
          email: data.email,
          displayName: data.displayName,
          hasTimezone: !!data.timezone,
        });
        const result = await registerMutation({ variables: { input: data } });
        console.log('🔐 [DEBUG] AuthProvider: registerMutation完了', {
          success: result.data?.register?.success,
          message: result.data?.register?.message,
          hasUser: !!result.data?.register?.user,
          hasErrors: !!result.errors,
          errorCount: result.errors?.length || 0,
        });

        // GraphQL実行エラーの確認
        if (result.errors && result.errors.length > 0) {
          console.error('🔐 [DEBUG] AuthProvider: GraphQL実行エラー', {
            errors: result.errors.map(e => ({
              message: e.message,
              extensions: (e as any)?.extensions,
            })),
          });
          const firstError = result.errors[0];
          return {
            success: false,
            error: firstError.message || '登録中にエラーが発生しました',
          };
        }

        // GraphQLレスポンスを統一形式に変換
        if (result.data?.register?.success) {
          const nextUser = result.data.register.user;
          console.log('🔐 [DEBUG] AuthProvider: 登録成功 - キャッシュ更新', {
            userId: nextUser?.id,
            username: nextUser?.username,
          });
          if (nextUser) {
            // refetch/clearStoreを避けてキャッシュ更新のみで状態を反映
            client.cache.writeQuery({
              query: MeDocument,
              data: { me: nextUser },
            } as any);
          }
          return {
            success: true,
            data: result.data.register.user,
            message: result.data.register.message,
          };
        } else {
          const errorMsg = result.data?.register?.message || '登録に失敗しました';
          console.warn('🔐 [DEBUG] AuthProvider: 登録失敗', {
            message: errorMsg,
            success: result.data?.register?.success,
          });
          return {
            success: false,
            error: errorMsg,
          };
        }
      } catch (error: unknown) {
        // GraphQL エラーの詳細抽出
        const apolloError = error as any;
        const graphQLErrors = apolloError?.graphQLErrors as
          | Array<{ message?: string; extensions?: any }>
          | undefined;
        const networkError = apolloError?.networkError;
        const graphQLErrorMessage = graphQLErrors?.[0]?.message;
        const graphQLErrorExtensions = graphQLErrors?.[0]?.extensions;

        console.error('🔐 [DEBUG] AuthProvider: registerMutation例外エラー', {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          graphQLErrorMessage,
          graphQLErrorExtensions,
          hasNetworkError: !!networkError,
          networkErrorMessage: networkError?.message,
        });

        // エラーメッセージの優先順位: GraphQL > Network > Generic
        const finalError =
          graphQLErrorMessage ||
          networkError?.message ||
          (error instanceof Error ? error.message : '登録に失敗しました');

        return {
          success: false,
          error: finalError,
        };
      }
    },
    [registerMutation, client]
  );

  const logout = useCallback(
    async (options?: { skipRedirect?: boolean }): Promise<void> => {
      const result = await logoutMutation();
      await client.cache.writeQuery({
        query: MeDocument,
        data: { me: null },
      });
      // refetch/clearStoreを避けて、最小限のキャッシュ更新でUIの安定性を担保

      // AuthGuardが認証状態の変更を検知して自動的にリダイレクト

      // void関数なので何も返さない
    },
    [logoutMutation, client]
  );

  // 認証状態の計算（メモ化）
  const authState = useMemo((): AuthState => {
    const user = meData?.me || null;
    const isAuthenticated = !!user;
    const isInitializing = meLoading && meData === undefined;

    const isLoading = loginLoading || registerLoading || logoutLoading;

    return {
      user,
      isAuthenticated,
      isLoading,
      isInitializing,
      error: meError?.message || null,
      login,
      register,
      logout,
      refetch: async (): Promise<void> => {
        await refetch();
      },
      isLoggedIn: isAuthenticated && !!user,
      isLoggingIn: loginLoading,
      isRegistering: registerLoading,
      userId: user?.id,
      username: user?.username,
      clientReady: typeof window !== 'undefined' && !!client,
    };
  }, [
    meData?.me,
    meLoading,
    meError?.message,
    loginLoading,
    registerLoading,
    logoutLoading,
    login,
    register,
    logout,
    refetch,
    client,
  ]);

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
});

/**
 * 🔐 認証フック
 */
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 型エクスポート
export type { AuthState };
