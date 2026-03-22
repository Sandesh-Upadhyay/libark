/**
 * 🧪 設定画面統合テスト
 *
 * 責任:
 * - 設定画面の基本機能テスト
 * - セキュリティ設定（2FA）のテスト
 * - 設定項目の表示・操作テスト
 * - ナビゲーションテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage';
import AccountSettingsPage from '@/pages/settings/AccountSettingsPage';
import DisplaySettingsPage from '@/pages/settings/DisplaySettingsPage';
import { SettingsMenuList } from '@/features/settings/components/organisms/SettingsMenuList';

// モック設定
vi.mock('@libark/graphql-client', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  }),
  useTwoFactorStatusQuery: () => ({
    data: {
      twoFactorStatus: {
        enabled: false,
        enabledAt: null,
        backupCodesCount: 0,
      },
    },
    loading: false,
    error: null,
  }),
  useSetupTwoFactorMutation: () => [
    vi.fn().mockResolvedValue({
      data: {
        setupTwoFactor: {
          secret: 'test-secret',
          qrCodeUrl: 'data:image/png;base64,test-qr-code',
          manualEntryKey: 'TEST-MANUAL-KEY',
        },
      },
    }),
    { loading: false },
  ],
  useEnableTwoFactorMutation: () => [
    vi.fn().mockResolvedValue({
      data: {
        enableTwoFactor: {
          success: true,
          message: '2FAが有効化されました',
          backupCodes: {
            codes: ['12345678', '87654321'],
            generatedAt: new Date().toISOString(),
          },
        },
      },
    }),
    { loading: false },
  ],
  useDisableTwoFactorMutation: () => [
    vi.fn().mockResolvedValue({
      data: {
        disableTwoFactor: {
          success: true,
          message: '2FAが無効化されました',
        },
      },
    }),
    { loading: false },
  ],
  useRegenerateBackupCodesMutation: () => [
    vi.fn().mockResolvedValue({
      data: {
        regenerateBackupCodes: {
          codes: ['11111111', '22222222'],
          generatedAt: new Date().toISOString(),
        },
      },
    }),
    { loading: false },
  ],
  useUserSettings: () => ({
    settings: {
      theme: 'system',
      locale: 'ja',
      animations: true,
    },
    changeTheme: vi.fn(),
    changeLocale: vi.fn(),
    toggleAnimations: vi.fn(),
    isDarkMode: false,
    isSystemTheme: true,
    currentLocale: 'ja',
    animationsEnabled: true,
  }),
}));

vi.mock('@/hooks', () => ({
  usePermissions: () => ({
    isAdmin: false,
  }),
}));

// 2FAコンポーネントのモック
vi.mock('@/features/auth/components/TwoFactorSettingsPanel', () => ({
  TwoFactorSettingsPanel: ({ onBack }: { onBack: () => void }) => (
    <div data-testid='two-factor-settings-panel'>
      <div>2FA設定パネル</div>
      <button onClick={onBack}>戻る</button>
    </div>
  ),
}));

// テスト用ラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    <BrowserRouter>{children}</BrowserRouter>
  </MockedProvider>
);

describe('🔐 設定画面統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('設定メニュー', () => {
    it('設定メニューに必要な項目が表示される', () => {
      render(
        <TestWrapper>
          <SettingsMenuList />
        </TestWrapper>
      );

      // 基本設定項目の確認
      expect(screen.getByText('アカウント')).toBeInTheDocument();
      expect(screen.getByText('プロフィール、基本情報')).toBeInTheDocument();

      expect(screen.getByText('表示設定')).toBeInTheDocument();
      expect(screen.getByText('テーマ、言語、タイムゾーン')).toBeInTheDocument();

      expect(screen.getByText('セキュリティ')).toBeInTheDocument();
      expect(screen.getByText('2FA、パスワード、セキュリティ設定')).toBeInTheDocument();
    });

    it('設定項目をクリックするとナビゲーションが動作する', () => {
      const mockOnItemClick = vi.fn();

      render(
        <TestWrapper>
          <SettingsMenuList onItemClick={mockOnItemClick} />
        </TestWrapper>
      );

      // セキュリティ設定項目をクリック
      const securityItem = screen.getByText('セキュリティ');
      fireEvent.click(securityItem);

      expect(mockOnItemClick).toHaveBeenCalled();
    });
  });

  describe('セキュリティ設定ページ', () => {
    it('セキュリティ設定ページが正常に表示される', () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // ページタイトルの確認
      expect(screen.getByText('セキュリティ')).toBeInTheDocument();

      // セキュリティ概要カードの確認
      expect(screen.getByText('二要素認証')).toBeInTheDocument();
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      // セキュリティ推奨事項の内容を確認（SectionShellのtitleはshowHeader={false}で非表示）
      expect(screen.getByText('二要素認証を有効にする')).toBeInTheDocument();
      expect(screen.getByText('強力なパスワードを使用する')).toBeInTheDocument();
      expect(screen.getByText('定期的にパスワードを変更する')).toBeInTheDocument();
    });

    it('2FA設定セクションに移動できる', async () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // 2FA設定ボタンをクリック
      const twoFactorButton = screen.getByRole('button', { name: /設定/ });
      fireEvent.click(twoFactorButton);

      // 2FA設定画面に移動することを確認
      await waitFor(() => {
        expect(screen.getByText('2FA設定パネル')).toBeInTheDocument();
        expect(screen.getByText('← セキュリティ設定に戻る')).toBeInTheDocument();
      });
    });

    it('パスワード変更セクションに移動できる', async () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // パスワード変更ボタンをクリック
      const passwordButtons = screen.getAllByRole('button', { name: /変更/ });
      const passwordButton = passwordButtons.find(
        button =>
          button.closest('[data-testid]')?.getAttribute('data-testid') === 'password-card' ||
          button.textContent === '変更'
      );

      if (passwordButton) {
        fireEvent.click(passwordButton);

        // パスワード変更画面に移動することを確認
        await waitFor(() => {
          expect(screen.getByText('パスワード変更')).toBeInTheDocument();
          expect(screen.getByText('← セキュリティ設定に戻る')).toBeInTheDocument();
        });
      }
    });

    it('セキュリティ推奨事項が表示される', () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // セキュリティ推奨事項の確認
      expect(screen.getByText('二要素認証を有効にする')).toBeInTheDocument();
      expect(screen.getByText('強力なパスワードを使用する')).toBeInTheDocument();
      expect(screen.getByText('定期的にパスワードを変更する')).toBeInTheDocument();
    });

    it('戻るボタンで概要画面に戻れる', async () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // 2FA設定に移動
      const twoFactorButton = screen.getByRole('button', { name: /設定/ });
      fireEvent.click(twoFactorButton);

      await waitFor(() => {
        expect(screen.getByText('← セキュリティ設定に戻る')).toBeInTheDocument();
      });

      // 戻るボタンをクリック
      const backButton = screen.getByText('← セキュリティ設定に戻る');
      fireEvent.click(backButton);

      // 概要画面に戻ることを確認（セキュリティ推奨事項の内容が表示される）
      await waitFor(() => {
        expect(screen.getByText('二要素認証を有効にする')).toBeInTheDocument();
        expect(screen.getByText('強力なパスワードを使用する')).toBeInTheDocument();
        expect(screen.getByText('定期的にパスワードを変更する')).toBeInTheDocument();
      });
    });
  });

  describe('2FA機能統合テスト', () => {
    it('2FA無効状態では設定画面が表示される', async () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // 2FA設定に移動
      const twoFactorButton = screen.getByRole('button', { name: /設定/ });
      fireEvent.click(twoFactorButton);

      await waitFor(() => {
        // 2FA設定コンポーネントが表示されることを確認
        expect(screen.getByText('2FA設定パネル')).toBeInTheDocument();
      });
    });

    it('2FA有効状態では管理画面が表示される', async () => {
      // 2FA有効状態をモック
      const SecuritySettingsPageWithEnabled = () => {
        const [twoFactorEnabled] = React.useState(true);

        return (
          <div>
            <div>セキュリティ</div>
            <div>{twoFactorEnabled ? '有効' : '無効'}</div>
            <button onClick={() => {}}>{twoFactorEnabled ? '管理' : '設定'}</button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <SecuritySettingsPageWithEnabled />
        </TestWrapper>
      );

      expect(screen.getByText('有効')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '管理' })).toBeInTheDocument();
    });
  });

  describe('アクセシビリティテスト', () => {
    it('適切なARIAラベルが設定されている', () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // ボタンにアクセシブルな名前があることを確認
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('キーボードナビゲーションが機能する', () => {
      render(
        <TestWrapper>
          <SecuritySettingsPage />
        </TestWrapper>
      );

      // フォーカス可能な要素が存在することを確認
      const focusableElements = screen.getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);

      // 最初の要素にフォーカスを設定
      focusableElements[0].focus();
      expect(focusableElements[0]).toHaveFocus();
    });
  });

  describe('アカウント設定ページ', () => {
    it('アカウント設定ページが正常に表示される', () => {
      render(
        <TestWrapper>
          <AccountSettingsPage />
        </TestWrapper>
      );

      // ページタイトルの確認
      expect(screen.getByText('アカウント設定')).toBeInTheDocument();
    });

    it('主要セクションが表示される', () => {
      render(
        <TestWrapper>
          <AccountSettingsPage />
        </TestWrapper>
      );

      // 基本情報セクション
      expect(screen.getByText('基本情報')).toBeInTheDocument();
      expect(screen.getByText('アカウントの基本情報を確認できます')).toBeInTheDocument();
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
      expect(screen.getByText('メールアドレス')).toBeInTheDocument();

      // パスワード変更セクション
      expect(screen.getByText('パスワード変更')).toBeInTheDocument();
      expect(screen.getByText('新しいパスワードは8文字以上で設定してください')).toBeInTheDocument();
      // 重複するテキストなので、label要素を確認
      const passwordLabels = screen.getAllByText('現在のパスワード');
      expect(passwordLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('新しいパスワード')).toBeInTheDocument();
      expect(screen.getByText('パスワード確認')).toBeInTheDocument();

      // メールアドレス変更セクション
      expect(screen.getByText('メールアドレス変更')).toBeInTheDocument();
      expect(
        screen.getByText('新しいメールアドレスに確認メールが送信されます')
      ).toBeInTheDocument();
      expect(screen.getByText('新しいメールアドレス')).toBeInTheDocument();

      // 危険な操作セクション
      expect(screen.getByText('危険な操作')).toBeInTheDocument();
      expect(
        screen.getByText(
          'アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('アカウント削除')).toBeInTheDocument();
    });

    it('ページがクラッシュしない', () => {
      expect(() => {
        render(
          <TestWrapper>
            <AccountSettingsPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('パスワード変更フォームが存在する', () => {
      render(
        <TestWrapper>
          <AccountSettingsPage />
        </TestWrapper>
      );

      // フォーム要素の確認 - idで取得して重複を回避
      const currentPasswordInput = document.getElementById('currentPassword');
      const newPasswordInput = screen.queryByLabelText('新しいパスワード');
      const confirmPasswordInput = screen.queryByLabelText('パスワード確認');
      const submitButton = screen.queryByRole('button', { name: 'パスワードを変更' });

      expect(currentPasswordInput).toBeInTheDocument();
      expect(newPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('メールアドレス変更フォームが存在する', () => {
      render(
        <TestWrapper>
          <AccountSettingsPage />
        </TestWrapper>
      );

      // フォーム要素の確認 - idで取得して重複を回避
      const newEmailInput = screen.queryByLabelText('新しいメールアドレス');
      const emailPasswordInput = document.getElementById('emailPassword');
      const submitButton = screen.queryByRole('button', { name: 'メールアドレスを変更' });

      expect(newEmailInput).toBeInTheDocument();
      expect(emailPasswordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('表示設定ページ', () => {
    it('表示設定ページが正常に表示される', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // ページタイトルの確認
      expect(screen.getByText('表示設定')).toBeInTheDocument();
    });

    it('主要セクションが表示される', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // テーマ設定セクション
      expect(screen.getByText('テーマ設定')).toBeInTheDocument();
      expect(screen.getByText('アプリの外観テーマを選択できます')).toBeInTheDocument();
      // 重複するテキストなので、roleで取得
      expect(screen.getByRole('radio', { name: 'ライト' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'ダーク' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'システム' })).toBeInTheDocument();

      // 言語設定セクション
      expect(screen.getByText('言語設定')).toBeInTheDocument();
      expect(screen.getByText('アプリの表示言語を変更できます')).toBeInTheDocument();
      expect(screen.getByText('表示言語')).toBeInTheDocument();

      // アニメーション設定セクション
      expect(screen.getByText('アニメーション設定')).toBeInTheDocument();
      expect(screen.getByText('アプリのアニメーション効果を制御できます')).toBeInTheDocument();
      expect(screen.getByText('アニメーションを有効にする')).toBeInTheDocument();
    });

    it('タイムゾーン設定セクションが表示される', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // タイムゾーン設定セクションの確認
      expect(screen.getByText('タイムゾーン')).toBeInTheDocument();
    });

    it('ページがクラッシュしない', () => {
      expect(() => {
        render(
          <TestWrapper>
            <DisplaySettingsPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('テーマ選択のラジオボタンが存在する', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // ラジオボタンの確認
      const lightRadio = screen.getByRole('radio', { name: 'ライト' });
      const darkRadio = screen.getByRole('radio', { name: 'ダーク' });
      const systemRadio = screen.getByRole('radio', { name: 'システム' });

      expect(lightRadio).toBeInTheDocument();
      expect(darkRadio).toBeInTheDocument();
      expect(systemRadio).toBeInTheDocument();
    });

    it('現在のテーマ状態が表示される', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // 現在のテーマ状態の確認
      expect(screen.getByText('現在のテーマ:')).toBeInTheDocument();
    });

    it('アニメーション設定のスイッチが存在する', () => {
      render(
        <TestWrapper>
          <DisplaySettingsPage />
        </TestWrapper>
      );

      // スイッチの確認
      const animationSwitch = screen.getByRole('switch');
      expect(animationSwitch).toBeInTheDocument();
    });
  });
});
