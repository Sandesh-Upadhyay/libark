/**
 * 🎯 Apollo Clientユーザー管理フック
 *
 * 完全なApollo Client移行版
 * クリーンで一貫性のあるインターフェース
 */

import {
  useUsersQuery,
  useUserQuery,
  useUserByUsernameQuery,
  useMySettingsQuery,
  useUpdateProfileMutation,
  useUpdateUserSettingsMutation,
} from '@libark/graphql-client';

/**
 * ユーザー一覧取得フック
 *
 * @deprecated キャッシュ競合を防ぐため一時的に無効化
 */
export const useUsers = (
  params: {
    first?: number;
    after?: string;
    search?: string;
  } = {}
) => {
  console.warn('useUsers は一時的に無効化されています（キャッシュ競合防止）');
  return useUsersQuery({
    variables: params,
    fetchPolicy: 'cache-only', // キャッシュのみ
    skip: true, // クエリを完全にスキップ
  });
};

/**
 * IDでユーザー取得フック
 *
 * @deprecated キャッシュ競合を防ぐため一時的に無効化
 */
export const useUserById = (id: string) => {
  console.warn('useUserById は一時的に無効化されています（キャッシュ競合防止）');
  return useUserQuery({
    variables: { id },
    skip: true, // クエリを完全にスキップ
    fetchPolicy: 'cache-only', // キャッシュのみ
  });
};

/**
 * ユーザー名でユーザー取得フック
 */
export const useUserByUsername = (username: string, options?: { skip?: boolean }) => {
  return useUserByUsernameQuery({
    variables: { username },
    skip: !username || options?.skip,
    fetchPolicy: 'cache-first', // キャッシュ優先に変更
  });
};

/**
 * 現在のユーザー設定取得フック
 *
 * @deprecated useUserSettings または useTheme を使用してください
 * MySettingsクエリの重複実行を防ぐため、このフックは非推奨です
 */
export const useMySettings = () => {
  console.warn('useMySettings は非推奨です。useUserSettings または useTheme を使用してください。');
  return useMySettingsQuery({
    fetchPolicy: 'cache-only', // キャッシュのみで重複実行を完全に防止
    skip: true, // クエリを完全にスキップ
  });
};

/**
 * プロフィール更新フック
 */
export const useUpdateProfile = () => {
  return useUpdateProfileMutation({
    // refetchQueriesを削除 - Apollo Clientの楽観的更新のみを使用
  });
};

/**
 * ユーザー設定更新フック
 */
export const useUpdateUserSettings = () => {
  return useUpdateUserSettingsMutation({
    refetchQueries: ['MySettings'],
    awaitRefetchQueries: true,
  });
};

// レガシー互換性は削除 - Apollo Clientネイティブフックを直接使用
