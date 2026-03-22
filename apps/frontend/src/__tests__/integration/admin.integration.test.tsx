/**
 * 🧪 管理パネル統合テスト
 *
 * 責任:
 * - サイト機能管理ページの基本機能テスト
 * - ユーザー権限管理ページの基本機能テスト
 * - ページがクラッシュしないことの担保
 * - 主要ヘッダー/セクションが描画されることの担保
 * - 主要なユーザー操作が成立することの担保
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes, Navigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import SiteFeaturesPage from '@/pages/admin/SiteFeaturesPage';
import UserPermissionsPage from '@/pages/admin/UserPermissionsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// モック設定
vi.mock('@libark/graphql-client', () => ({
  useSiteFeatureSettingsQuery: () => ({
    data: {
      siteFeatureSettings: [
        {
          id: '1',
          featureName: 'POST_CREATE',
          isEnabled: true,
          description: 'PostCreator自体の表示・非表示',
        },
        {
          id: '2',
          featureName: 'POST_IMAGE_UPLOAD',
          isEnabled: false,
          description: 'PostCreatorの画像追加ボタンの表示・非表示',
        },
        {
          id: '3',
          featureName: 'MESSAGES_ACCESS',
          isEnabled: true,
          description: 'メッセージ画面自体の表示・非表示',
        },
        {
          id: '4',
          featureName: 'WALLET_ACCESS',
          isEnabled: false,
          description: 'ウォレット画面自体の表示・非表示',
        },
      ],
    },
    loading: false,
    error: null,
  }),
  useUpdateSiteFeatureMutation: () => [
    vi.fn().mockResolvedValue({
      data: {
        updateSiteFeature: {
          featureName: 'POST_CREATE',
          isEnabled: false,
        },
      },
    }),
    { loading: false },
  ],
  GetFeatureFlagsDocument: {},
}));

vi.mock('@/hooks', () => ({
  useAppData: () => ({
    refetch: vi.fn(),
  }),
  useIsMobile: () => false,
  usePermissions: () => ({
    isAdmin: true,
  }),
}));

// モバイル用のAdminOutletContextを提供するラッパー
const AdminLayout = ({ _children }: { children: React.ReactNode }) => {
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);

  return (
    <div>
      <Outlet context={{ showAdminMenu, setShowAdminMenu }} />
    </div>
  );
};

// テスト用ラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <Routes>
      <Route path='/' element={<AdminLayout />}>
        <Route index element={children} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('🔧 管理パネル統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('サイト機能管理ページ', () => {
    it('ページが正常にレンダリングされ、ヘッダーが表示される', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // ページヘッダーの確認
      expect(screen.getByText('サイト機能管理')).toBeInTheDocument();
    });

    it('成功時にカテゴリ見出しが表示される', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // カテゴリ見出しの確認
      expect(screen.getByText('投稿機能')).toBeInTheDocument();
      expect(screen.getByText('メッセージ機能')).toBeInTheDocument();
      expect(screen.getByText('ウォレット機能')).toBeInTheDocument();
    });

    it('機能の表示名と説明が正しく表示される', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // 機能名の確認
      expect(screen.getByText('投稿')).toBeInTheDocument();
      expect(screen.getByText('画像アップロード')).toBeInTheDocument();
      expect(screen.getByText('メッセージ')).toBeInTheDocument();
      expect(screen.getByText('ウォレット')).toBeInTheDocument();

      // 説明の確認
      expect(screen.getByText('PostCreator自体の表示・非表示')).toBeInTheDocument();
      expect(screen.getByText('メッセージ画面自体の表示・非表示')).toBeInTheDocument();
    });

    it('機能の有効/無効ステータスが正しく表示される', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // 有効/無効ステータスの確認
      const enabledBadges = screen.getAllByText('有効');
      const disabledBadges = screen.getAllByText('無効');

      expect(enabledBadges.length).toBeGreaterThan(0);
      expect(disabledBadges.length).toBeGreaterThan(0);
    });

    it('Switch要素が存在する', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // Switch要素の確認
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
    });
  });

  describe('ユーザー権限管理ページ', () => {
    it('ページが正常にレンダリングされ、ヘッダーが表示される', () => {
      render(
        <TestWrapper>
          <UserPermissionsPage />
        </TestWrapper>
      );

      // ページヘッダーの確認
      expect(screen.getByText('ユーザー権限管理')).toBeInTheDocument();
    });

    it('主要セクションが表示される', () => {
      render(
        <TestWrapper>
          <UserPermissionsPage />
        </TestWrapper>
      );

      // セクションヘッダーの確認
      expect(screen.getByText('ユーザー機能権限設定')).toBeInTheDocument();

      // 各セクションの確認
      expect(screen.getByText('ユーザー検索')).toBeInTheDocument();
      expect(screen.getByText('機能権限設定')).toBeInTheDocument();
      expect(screen.getByText('有効期限設定')).toBeInTheDocument();
      expect(screen.getByText('権限変更履歴')).toBeInTheDocument();
    });

    it('TODO実装のプレースホルダーが表示される', () => {
      render(
        <TestWrapper>
          <UserPermissionsPage />
        </TestWrapper>
      );

      // 実装予定のテキストが表示されることを確認
      expect(screen.getByText('実装予定: ユーザー検索・選択UI')).toBeInTheDocument();
      expect(screen.getByText('実装予定: 機能別権限設定UI')).toBeInTheDocument();
      expect(screen.getByText('実装予定: 有効期限設定UI')).toBeInTheDocument();
      expect(screen.getByText('実装予定: 権限変更履歴表示UI')).toBeInTheDocument();
    });

    it('ページがクラッシュしない', () => {
      expect(() => {
        render(
          <TestWrapper>
            <UserPermissionsPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('アクセシビリティテスト', () => {
    it('適切なARIAラベルが設定されている', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // Switchにアクセシブルな名前があることを確認
      const switches = screen.getAllByRole('switch');
      switches.forEach(switchElement => {
        expect(switchElement).toHaveAccessibleName();
      });
    });

    it('キーボードナビゲーションが機能する', () => {
      render(
        <TestWrapper>
          <SiteFeaturesPage />
        </TestWrapper>
      );

      // フォーカス可能な要素が存在することを確認
      const focusableElements = screen.getAllByRole('switch');
      expect(focusableElements.length).toBeGreaterThan(0);

      // 最初の要素にフォーカスを設定
      focusableElements[0].focus();
      expect(focusableElements[0]).toHaveFocus();
    });
  });

  describe('未定義ルートのテスト (404ページ)', () => {
    it('/admin/users に遷移しても React エラーが発生しない', () => {
      // /admin/users はルート定義されていないため404に遷移するはず
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/admin/users']}>
            <Routes>
              <Route path='/' element={<Outlet />}>
                <Route path='admin' element={<Outlet />}>
                  <Route path='site-features' element={<SiteFeaturesPage />} />
                  <Route path='user-permissions' element={<UserPermissionsPage />} />
                </Route>
                <Route path='404' element={<NotFoundPage />} />
              </Route>
              <Route path='*' element={<Navigate to='/404' replace />} />
            </Routes>
          </MemoryRouter>
        );
      }).not.toThrow();
    });

    it('/admin/payments に遷移しても React エラーが発生しない', () => {
      // 他の未定義ルートでも同様に404に遷移するはず
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/admin/payments']}>
            <Routes>
              <Route path='/' element={<Outlet />}>
                <Route path='admin' element={<Outlet />}>
                  <Route path='site-features' element={<SiteFeaturesPage />} />
                  <Route path='user-permissions' element={<UserPermissionsPage />} />
                </Route>
                <Route path='404' element={<NotFoundPage />} />
              </Route>
              <Route path='*' element={<Navigate to='/404' replace />} />
            </Routes>
          </MemoryRouter>
        );
      }).not.toThrow();
    });

    it('/admin/stats に遷移しても React エラーが発生しない', () => {
      // 他の未定義ルートでも同様に404に遷移するはず
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/admin/stats']}>
            <Routes>
              <Route path='/' element={<Outlet />}>
                <Route path='admin' element={<Outlet />}>
                  <Route path='site-features' element={<SiteFeaturesPage />} />
                  <Route path='user-permissions' element={<UserPermissionsPage />} />
                </Route>
                <Route path='404' element={<NotFoundPage />} />
              </Route>
              <Route path='*' element={<Navigate to='/404' replace />} />
            </Routes>
          </MemoryRouter>
        );
      }).not.toThrow();
    });

    it('/admin/system に遷移しても React エラーが発生しない', () => {
      // 他の未定義ルートでも同様に404に遷移するはず
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/admin/system']}>
            <Routes>
              <Route path='/' element={<Outlet />}>
                <Route path='admin' element={<Outlet />}>
                  <Route path='site-features' element={<SiteFeaturesPage />} />
                  <Route path='user-permissions' element={<UserPermissionsPage />} />
                </Route>
                <Route path='404' element={<NotFoundPage />} />
              </Route>
              <Route path='*' element={<Navigate to='/404' replace />} />
            </Routes>
          </MemoryRouter>
        );
      }).not.toThrow();
    });
  });
});
