/**
 * ⚙️ 統合ユーザー設定フック（UserContext統合版）
 *
 * UserContextから設定情報を取得して重複リクエストを防止
 */

import { useCallback } from 'react';
import type { ApolloError } from '@apollo/client';
import { useApolloClient } from '@apollo/client';

import { useAppStore, type UserSettings } from '../store/index.js';
import {
  useMySettingsQuery,
  useUpdateUserSettingsMutation,
  type UserSettingsUpdateInput,
  type MySettingsQuery,
  MySettingsDocument,
} from '../generated/graphql.js';

/**
 * 🎯 統合ユーザー設定フック
 */
export function useUserSettings(options?: { skipQuery?: boolean }) {
  const { settings, updateSettings, resetSettings } = useAppStore();
  const apolloClient = useApolloClient();

  // キャッシュにデータがあるかチェック
  const cachedData = apolloClient.cache.readQuery({
    query: MySettingsDocument,
  });

  // キャッシュにデータがある場合、またはskipQueryが指定されている場合はクエリをスキップ
  const shouldSkipQuery = options?.skipQuery || !!cachedData;

  // サーバーから設定を取得（条件付き実行）
  const { loading, error, refetch } = useMySettingsQuery({
    fetchPolicy: 'cache-first', // キャッシュ優先で重複実行を防止
    nextFetchPolicy: 'cache-only', // 次回以降はキャッシュのみ
    errorPolicy: 'all',
    skip: shouldSkipQuery, // 重複実行を防止
    onCompleted: (data: MySettingsQuery) => {
      if (data?.mySettings) {
        // サーバーの設定でローカル設定を更新
        updateSettings({
          theme: data.mySettings.theme as UserSettings['theme'],
          animationsEnabled: data.mySettings.animationsEnabled ?? true,
          locale: data.mySettings.locale ?? 'ja',
          contentFilter: (data.mySettings.contentFilter as UserSettings['contentFilter']) ?? 'all',
          displayMode: (data.mySettings.displayMode as UserSettings['displayMode']) ?? 'card',
          timezone: data.mySettings.timezone ?? 'Asia/Tokyo',
        });
      }
    },
    onError: (error: ApolloError) => {
      console.warn('設定取得エラー:', error);
    },
  });

  // 設定更新ミューテーション
  const [updateSettingsMutation, { loading: updating }] = useUpdateUserSettingsMutation({
    onCompleted: (data: { updateUserSettings?: unknown }) => {
      if (data?.updateUserSettings) {
        console.log('✅ 設定更新完了');
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ 設定更新エラー:', error);
      // エラー時は設定を再取得
      refetch();
    },
  });

  // 設定更新処理
  const updateUserSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      // 楽観的更新
      updateSettings(newSettings);

      try {
        await updateSettingsMutation({
          variables: {
            input: {
              theme: newSettings.theme,
              animationsEnabled: newSettings.animationsEnabled,
              locale: newSettings.locale,
              contentFilter: newSettings.contentFilter,
              displayMode: newSettings.displayMode,
              timezone: newSettings.timezone,
            } as UserSettingsUpdateInput,
          },
        });
      } catch (error) {
        console.error('設定更新失敗:', error);
        throw error;
      }
    },
    [updateSettings, updateSettingsMutation]
  );

  // テーマ変更
  const changeTheme = useCallback(
    async (theme: UserSettings['theme']) => {
      await updateUserSettings({ theme });
    },
    [updateUserSettings]
  );

  // ロケール変更
  const changeLocale = useCallback(
    async (locale: string) => {
      await updateUserSettings({ locale });
    },
    [updateUserSettings]
  );

  // 表示モード変更
  const changeDisplayMode = useCallback(
    async (displayMode: UserSettings['displayMode']) => {
      await updateUserSettings({ displayMode });
    },
    [updateUserSettings]
  );

  // アニメーション設定変更
  const toggleAnimations = useCallback(async () => {
    await updateUserSettings({
      animationsEnabled: !settings.animationsEnabled,
    });
  }, [updateUserSettings, settings.animationsEnabled]);

  // コンテンツフィルター変更
  const changeContentFilter = useCallback(
    async (contentFilter: UserSettings['contentFilter']) => {
      await updateUserSettings({ contentFilter });
    },
    [updateUserSettings]
  );

  // タイムゾーン変更
  const changeTimezone = useCallback(
    async (timezone: string) => {
      await updateUserSettings({ timezone });
    },
    [updateUserSettings]
  );

  // 設定リセット
  const resetUserSettings = useCallback(async () => {
    resetSettings();

    try {
      await updateSettingsMutation({
        variables: {
          input: {
            theme: 'system',
            animationsEnabled: true,
            locale: 'ja',
            contentFilter: 'all',
            displayMode: 'card',
            timezone: 'Asia/Tokyo',
          },
        },
      });
    } catch (error) {
      console.error('設定リセット失敗:', error);
      throw error;
    }
  }, [resetSettings, updateSettingsMutation]);

  // 設定の同期
  const syncSettings = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('設定同期エラー:', error);
    }
  }, [refetch]);

  return {
    // 状態
    settings,
    isLoading: loading,
    isUpdating: updating,
    error: error?.message,

    // アクション
    updateSettings: updateUserSettings,
    changeTheme,
    changeLocale,
    changeDisplayMode,
    toggleAnimations,
    changeContentFilter,
    changeTimezone,
    resetSettings: resetUserSettings,
    syncSettings,

    // 便利なプロパティ
    isDarkMode:
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
    isSystemTheme: settings.theme === 'system',
    currentLocale: settings.locale,
    currentTimezone: settings.timezone,
    isCardMode: settings.displayMode === 'card',
    animationsEnabled: settings.animationsEnabled,
  };
}

/**
 * 🎯 テーマ設定のみを取得するフック（DB同期対応版）
 *
 * ローカルストア更新 + GraphQL Mutation でDBに保存
 * MySettingsクエリの重複実行を防止
 */
export function useTheme() {
  const { settings, updateSettings } = useAppStore();
  const [updateSettingsMutation] = useUpdateUserSettingsMutation();

  const setTheme = useCallback(
    async (theme: UserSettings['theme']) => {
      // 楽観的更新: ローカルストアを即座に更新（永続化される）
      updateSettings({ theme });

      // DOM に即座にテーマを適用（ちらつき防止）
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        let actualTheme = theme;

        // システムテーマの場合は実際のテーマを判定
        if (theme === 'system') {
          actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        // CSSクラスの適用
        root.classList.remove('light', 'dark');
        root.classList.add(actualTheme);

        // カラースキームの設定
        root.style.colorScheme = actualTheme;
      }

      // DBに保存（バックグラウンドで実行）
      try {
        await updateSettingsMutation({
          variables: {
            input: { theme },
          },
        });
      } catch (error) {
        console.error('テーマ設定のDB保存に失敗:', error);
        // エラーが発生してもUIには影響させない（楽観的更新済み）
      }
    },
    [updateSettings, updateSettingsMutation]
  );

  return {
    theme: settings.theme,
    setTheme,
    isDarkMode:
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
}

/**
 * 🎯 設定の初期化専用フック
 *
 * アプリケーション起動時に一度だけ実行される
 * 認証状態確立後にサーバーから最新設定を取得
 */
export function useSettingsInitializer(skipQuery = false) {
  // UserContextから設定を取得するため、個別クエリは実行しない
  const loading = false;
  const error = null;

  return {
    isInitializing: loading,
    initializationError: (error as any)?.message,
  };
}
