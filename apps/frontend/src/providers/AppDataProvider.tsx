/**
 * 🎯 統合アプリケーションデータプロバイダー
 *
 * ベストプラクティス:
 * - 単一クエリによる効率的なデータ取得
 * - 重複リクエストの完全排除
 * - シンプルで理解しやすいAPI
 * - 型安全性の確保
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '@libark/graphql-client';

// 統合アプリケーションデータクエリ
const GET_APP_DATA = gql`
  query GetAppData {
    me {
      id
      username
      email
      displayName
      profileImageId
      createdAt
      updatedAt
      role {
        name
      }
    }
    myPermissions {
      id
      userId
      permissionId
      isActive
      permission {
        id
        name
        description
      }
    }
    mySettings {
      userId
      theme
      animationsEnabled
      locale
      contentFilter
      displayMode
      timezone
      updatedAt
    }
    featureFlags {
      POST_CREATE
      POST_IMAGE_UPLOAD
      POST_LIKE
      MESSAGES_ACCESS
      MESSAGES_SEND
      WALLET_ACCESS
      WALLET_DEPOSIT
      WALLET_WITHDRAW
    }
  }
`;

// 型定義
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  profileImageId?: string;
  createdAt: string;
  updatedAt: string;
  role?: { name: string };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  isActive: boolean;
  permission: Permission;
}

export interface Settings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  animationsEnabled: boolean;
  locale: string;
  contentFilter: string;
  displayMode: string;
  timezone: string;
  updatedAt: string;
}

export interface Features {
  POST_CREATE: boolean;
  POST_IMAGE_UPLOAD: boolean;
  POST_LIKE: boolean;
  MESSAGES_ACCESS: boolean;
  MESSAGES_SEND: boolean;
  WALLET_ACCESS: boolean;
  WALLET_DEPOSIT: boolean;
  WALLET_WITHDRAW: boolean;
}

export interface AppData {
  user: User | null;
  permissions: UserPermission[];
  settings: Settings | null;
  features: Features;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: Error | null | undefined;
  refetch: () => void;
}

// デフォルト値
const DEFAULT_FEATURES: Features = {
  POST_CREATE: true,
  POST_IMAGE_UPLOAD: true,
  POST_LIKE: true,
  MESSAGES_ACCESS: true,
  MESSAGES_SEND: true,
  WALLET_ACCESS: true,
  WALLET_DEPOSIT: true,
  WALLET_WITHDRAW: true,
};

const DEFAULT_APP_DATA: AppData = {
  user: null,
  permissions: [],
  settings: null,
  features: DEFAULT_FEATURES,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
  refetch: () => {},
};

// Context作成
const AppDataContext = createContext<AppData>(DEFAULT_APP_DATA);

/**
 * 統合アプリケーションデータプロバイダー
 */
export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 認証状態を取得
  const { isAuthenticated, isInitializing } = useAuth();

  // 統合データ取得（認証済みの場合のみ実行）- パフォーマンス最適化
  const { data, loading, error, refetch } = useQuery(GET_APP_DATA, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
    errorPolicy: 'ignore',
    skip: isInitializing || !isAuthenticated, // 認証されていない場合もスキップしてエラーを防止
  });

  // 認証状態の判定（データの存在を優先）
  const userIsAuthenticated = !!data?.me;

  // 管理者権限の判定
  const isAdmin = useMemo(() => {
    const roleName = data?.me?.role?.name;
    if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') return true;

    if (!data?.myPermissions) return false;
    const activeNames = data.myPermissions
      .filter((p: UserPermission) => p.isActive)
      .map((p: UserPermission) => p.permission.name);
    return activeNames.includes('ADMIN_PANEL') || activeNames.includes('MANAGE_USERS');
  }, [data?.me?.role?.name, data?.myPermissions]);

  // コンテキスト値の構築
  const contextValue = useMemo(
    (): AppData => ({
      user: data?.me || null,
      permissions: data?.myPermissions || [],
      settings: data?.mySettings || null,
      features: data?.featureFlags || DEFAULT_FEATURES,
      isAuthenticated: userIsAuthenticated,
      isAdmin,
      loading: loading || isInitializing,
      error,
      refetch,
    }),
    [data, userIsAuthenticated, isAdmin, loading, isInitializing, error, refetch]
  );

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
};

/**
 * アプリケーションデータフック
 */
export const useAppData = (): AppData => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

/**
 * ユーザーフック
 */
export const useUser = () => {
  const { user, loading, error } = useAppData();
  return { user, loading, error };
};

/**
 * 権限フック
 */
export const usePermissions = () => {
  const { permissions, isAdmin, loading, error } = useAppData();

  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(
      userPermission => userPermission.isActive && userPermission.permission.name === permissionName
    );
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(permissionName => hasPermission(permissionName));
  };

  return {
    permissions,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    loading,
    error,
  };
};

/**
 * 設定フック
 */
export const useSettings = () => {
  const { settings, loading, error } = useAppData();
  return { settings, loading, error };
};

/**
 * 機能フラグフック
 */
export const useFeatures = () => {
  const { features, loading, error } = useAppData();
  return { features, loading, error };
};
