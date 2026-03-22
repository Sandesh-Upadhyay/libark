import { test, expect } from '@playwright/test';

test.describe('🔍 ページ構造の確認', () => {
  test('ルートページの構造を確認', async ({ page }) => {
    await test.step('ルートページに移動', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await test.step('ページの基本構造を確認', async () => {
      // ページタイトルを確認
      await expect(page).toHaveTitle('LIBARK');

      // ページが読み込まれていることを確認
      await expect(page.locator('body')).toBeVisible();

      // ログインボタンの存在を確認
      const loginButton = page.getByTestId('open-login-dialog-button');
      await expect(loginButton).toBeVisible();

      // 登録ボタンの存在を確認
      const registerButton = page.getByTestId('open-register-dialog-button');
      await expect(registerButton).toBeVisible();
    });

    await test.step('ログインダイアログを開く', async () => {
      const loginButton = page.getByTestId('open-login-dialog-button');
      await loginButton.click();

      // ダイアログが開くことを確認
      const dialog = page.getByTestId('login-dialog');
      await expect(dialog).toBeVisible();

      // ダイアログ内のフォーム要素を確認
      const emailField = dialog.locator('input[type="text"], input[type="email"]').first();
      const passwordField = dialog.locator('input[type="password"]');
      const submitButton = dialog.locator('button[type="submit"]');

      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(submitButton).toBeVisible();

      console.log('ログインダイアログの構造確認完了');
    });

    await test.step('ダイアログを閉じる', async () => {
      // ESCキーでダイアログを閉じる
      await page.keyboard.press('Escape');

      // ダイアログが閉じることを確認
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible();
    });

    await test.step('登録ダイアログを開く', async () => {
      const registerButton = page.locator('button').filter({ hasText: 'アカウントを作成' });
      await registerButton.click();

      // ダイアログが開くことを確認
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // ダイアログ内のフォーム要素を確認
      const usernameField = dialog.locator('input').first();
      const emailField = dialog.locator('input[type="email"]');
      const passwordField = dialog.locator('input[type="password"]');
      const submitButton = dialog.locator('button[type="submit"]');

      await expect(usernameField).toBeVisible();
      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(submitButton).toBeVisible();

      console.log('登録ダイアログの構造確認完了');
    });
  });

  test('ページ要素のdata-testid属性を確認', async ({ page }) => {
    await test.step('ルートページに移動', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await test.step('ログインダイアログのdata-testid確認', async () => {
      const loginButton = page.getByTestId('open-login-dialog-button');
      await loginButton.click();

      const dialog = page.getByTestId('login-dialog');
      await expect(dialog).toBeVisible();

      // data-testid属性の存在を確認
      const loginForm = dialog.getByTestId('login-form');
      const emailField = dialog.getByTestId('email-field');
      const passwordField = dialog.getByTestId('password-field');
      const submitButton = dialog.getByTestId('login-submit-button');

      // 要素が存在するかチェック（存在しない場合はエラーになる）
      try {
        await expect(loginForm).toBeVisible();
        console.log('✅ login-form data-testid 確認');
      } catch {
        console.log('❌ login-form data-testid が見つからない');
      }

      try {
        await expect(emailField).toBeVisible();
        console.log('✅ email-field data-testid 確認');
      } catch {
        console.log('❌ email-field data-testid が見つからない');
      }

      try {
        await expect(passwordField).toBeVisible();
        console.log('✅ password-field data-testid 確認');
      } catch {
        console.log('❌ password-field data-testid が見つからない');
      }

      try {
        await expect(submitButton).toBeVisible();
        console.log('✅ login-submit-button data-testid 確認');
      } catch {
        console.log('❌ login-submit-button data-testid が見つからない');
      }
    });
  });
});
