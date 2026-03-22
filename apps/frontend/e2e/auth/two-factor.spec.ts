/**
 * 🔐 2FA認証 E2Eテスト
 */

import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages/AuthPage';
import { TEST_USERS } from '../fixtures/users';

test.describe('🔐 2FA認証フロー', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('✅ 2FAログインフロー', () => {
    test('2FA要求時に認証画面が表示される', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('2FA認証画面が表示される', async () => {
        // 2FA認証画面の要素を確認
        await expect(page.getByText('二要素認証')).toBeVisible();
        await expect(
          page.getByText('認証アプリで生成された6桁のコードを入力してください')
        ).toBeVisible();

        // 認証コード入力フィールドを確認
        const codeInput = page.locator('input[placeholder="123456"]');
        await expect(codeInput).toBeVisible();
        await expect(codeInput).toBeFocused();

        // 戻るボタンを確認
        await expect(page.getByTestId('back-to-login-button')).toBeVisible();
      });

      await test.step('エラートーストが表示されない', async () => {
        // 「ログインに失敗しました」トーストが表示されないことを確認
        await expect(page.locator('.sonner-toast')).not.toBeVisible();
      });
    });

    test('2FA認証成功でホームページに遷移する', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('2FA認証コードを入力', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // 認証コードを入力（テスト用固定コード）
        const codeInput = page.locator('input[placeholder="123456"]');
        await codeInput.fill('123456');

        // 認証ボタンをクリック
        const authButton = page.getByRole('button', { name: '認証' });
        await authButton.click();
      });

      await test.step('ログイン成功を確認', async () => {
        // ホームページに遷移することを確認
        await expect(page).toHaveURL('/home');

        // 成功トーストが表示されることを確認
        await expect(page.locator('.sonner-toast')).toContainText('認証に成功しました');
      });
    });

    test('無効な2FA認証コードでエラーが表示される', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('無効な認証コードを入力', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // 無効な認証コードを入力
        const codeInput = page.locator('input[placeholder="123456"]');
        await codeInput.fill('000000');

        // 認証ボタンをクリック
        const authButton = page.getByRole('button', { name: '認証' });
        await authButton.click();
      });

      await test.step('エラーが表示される', async () => {
        // エラートーストが表示されることを確認
        await expect(page.locator('.sonner-toast')).toContainText('認証コードが正しくありません');

        // 2FA認証画面が開いたままであることを確認
        await expect(page.getByText('二要素認証')).toBeVisible();
      });
    });

    test('バックアップコード入力フォームに切り替えできる', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('バックアップコードフォームに切り替え', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // バックアップコード切り替えボタンをクリック
        const switchButton = page.getByRole('button', { name: 'バックアップコードを使用' });
        await switchButton.click();

        // バックアップコード入力フィールドが表示されることを確認
        await expect(page.getByText('バックアップコード')).toBeVisible();
        const backupInput = page.locator('input[placeholder="ABCD1234"]');
        await expect(backupInput).toBeVisible();

        // 説明テキストが変更されることを確認
        await expect(page.getByText('バックアップコードは8桁の英数字です')).toBeVisible();
      });
    });

    test('2FA認証画面から戻るボタンでログインフォームに戻る', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('戻るボタンをクリック', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // 戻るボタンをクリック
        const backButton = page.getByTestId('back-to-login-button');
        await backButton.click();
      });

      await test.step('ログインフォームに戻る', async () => {
        // ログインフォームが表示されることを確認
        await expect(page.getByText('ログイン')).toBeVisible();
        await expect(page.getByTestId('email-field')).toBeVisible();
        await expect(page.getByTestId('password-field')).toBeVisible();

        // 2FA認証画面が非表示になることを確認
        await expect(page.getByText('二要素認証')).not.toBeVisible();
      });
    });
  });

  test.describe('🎨 UI/UXテスト', () => {
    test('2FA認証ボタンのローディング状態が表示される', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('認証コードを入力してローディング状態を確認', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // 認証コードを入力
        const codeInput = page.locator('input[placeholder="123456"]');
        await codeInput.fill('123456');

        // 認証ボタンをクリック
        const authButton = page.getByRole('button', { name: '認証' });
        await authButton.click();

        // ローディングスピナーが表示されることを確認
        await expect(authButton).toBeDisabled();
        await expect(authButton.locator('.animate-spin')).toBeVisible();
      });
    });

    test('認証コード入力フィールドが自動フォーカスされる', async ({ page }) => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('認証コード入力フィールドのフォーカスを確認', async () => {
        // 2FA認証画面が表示されるまで待機
        await expect(page.getByText('二要素認証')).toBeVisible();

        // 認証コード入力フィールドが自動フォーカスされることを確認
        const codeInput = page.locator('input[placeholder="123456"]');
        await expect(codeInput).toBeFocused();
      });
    });
  });
});
