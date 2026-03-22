import { test } from '@playwright/test';

import { RegisterPage } from '../pages/AuthPage';
import { generateTestUser } from '../helpers/test-data';

test.describe('🔍 リダイレクト問題の詳細デバッグ', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('最小文字数ユーザー名でのリダイレクト確認', async ({ page }) => {
    await test.step('最小文字数ユーザー名で登録', async () => {
      const testUser = generateTestUser();
      const minUsername = 'abc'; // 3文字（最小）

      await registerPage.usernameField.fill(minUsername);
      await registerPage.emailField.fill(testUser.email);
      await registerPage.passwordField.fill(testUser.password);

      // ネットワークリクエストを監視
      const responses: unknown[] = [];
      page.on('response', async response => {
        if (response.url().includes('graphql')) {
          const responseBody = await response.text().catch(() => 'Failed to read response');
          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: responseBody.substring(0, 500),
          });
        }
      });

      await registerPage.submitButton.click();

      // 登録処理の完了を待機
      await page.waitForTimeout(5000);

      // ネットワークレスポンスをログ出力
      console.log('=== 最小文字数ユーザー名 - GraphQLレスポンス ===');
      responses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.status} ${resp.statusText}`);
        console.log(`   Body: ${resp.body}...`);
      });

      // 現在のURL確認
      const currentUrl = page.url();
      console.log(`現在のURL: ${currentUrl}`);

      // 認証状態の確認
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(cookie => cookie.name === 'accessToken');
      console.log(`認証Cookie: ${authCookie ? '存在' : '不存在'}`);

      // ダイアログの状態確認
      const dialogVisible = await registerPage.registerDialog.isVisible();
      console.log(`ダイアログ表示状態: ${dialogVisible}`);

      // エラーメッセージの確認
      const errorMessages = await page.locator('p[id*="form-item-message"]').all();
      console.log(`=== エラーメッセージ数: ${errorMessages.length} ===`);

      for (let i = 0; i < errorMessages.length; i++) {
        const text = await errorMessages[i].textContent();
        const isVisible = await errorMessages[i].isVisible();
        console.log(`${i + 1}. エラーメッセージ: "${text}" (visible: ${isVisible})`);
      }
    });
  });

  test('最大文字数ユーザー名でのリダイレクト確認', async ({ page }) => {
    await test.step('最大文字数ユーザー名で登録', async () => {
      const testUser = generateTestUser();
      const maxUsername = 'a'.repeat(20); // 20文字（最大）

      await registerPage.usernameField.fill(maxUsername);
      await registerPage.emailField.fill(testUser.email);
      await registerPage.passwordField.fill(testUser.password);

      // ネットワークリクエストを監視
      const responses: unknown[] = [];
      page.on('response', async response => {
        if (response.url().includes('graphql')) {
          const responseBody = await response.text().catch(() => 'Failed to read response');
          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: responseBody.substring(0, 500),
          });
        }
      });

      await registerPage.submitButton.click();

      // 登録処理の完了を待機
      await page.waitForTimeout(5000);

      // ネットワークレスポンスをログ出力
      console.log('=== 最大文字数ユーザー名 - GraphQLレスポンス ===');
      responses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.status} ${resp.statusText}`);
        console.log(`   Body: ${resp.body}...`);
      });

      // 現在のURL確認
      const currentUrl = page.url();
      console.log(`現在のURL: ${currentUrl}`);

      // 認証状態の確認
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(cookie => cookie.name === 'accessToken');
      console.log(`認証Cookie: ${authCookie ? '存在' : '不存在'}`);

      // ダイアログの状態確認
      const dialogVisible = await registerPage.registerDialog.isVisible();
      console.log(`ダイアログ表示状態: ${dialogVisible}`);
    });
  });
});
