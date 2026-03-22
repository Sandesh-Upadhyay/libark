import { test } from '@playwright/test';

import { RegisterPage } from '../pages/AuthPage';
import { generateTestUser } from '../helpers/test-data';

test.describe('🔍 登録処理の詳細デバッグ', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('登録処理の詳細確認', async ({ page }) => {
    await test.step('登録情報を入力', async () => {
      const testUser = generateTestUser();

      await registerPage.register(
        testUser.username,
        testUser.email,
        testUser.password,
        testUser.displayName
      );
    });

    await test.step('登録処理の結果を確認', async () => {
      // ネットワークリクエストを監視
      const responses: unknown[] = [];
      page.on('response', async response => {
        if (response.url().includes('graphql')) {
          const responseBody = await response.text().catch(() => 'Failed to read response');
          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            body: responseBody,
          });
        }
      });

      // 登録処理の完了を待機
      await page.waitForTimeout(5000);

      // ネットワークレスポンスをログ出力
      console.log('=== GraphQLレスポンス ===');
      responses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.status} ${resp.statusText} - ${resp.url}`);
        console.log(`   Body: ${resp.body.substring(0, 500)}...`);
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

      // ページタイトル確認
      const title = await page.title();
      console.log(`ページタイトル: ${title}`);

      // エラーメッセージの確認
      const errorMessages = await page.locator('p[id*="form-item-message"]').all();
      console.log(`=== エラーメッセージ数: ${errorMessages.length} ===`);

      for (let i = 0; i < errorMessages.length; i++) {
        const text = await errorMessages[i].textContent();
        const isVisible = await errorMessages[i].isVisible();
        console.log(`${i + 1}. エラーメッセージ: "${text}" (visible: ${isVisible})`);
      }

      // トーストメッセージの確認
      const toasts = await page.locator('[data-sonner-toast]').all();
      console.log(`=== トーストメッセージ数: ${toasts.length} ===`);

      for (let i = 0; i < toasts.length; i++) {
        const text = await toasts[i].textContent();
        const isVisible = await toasts[i].isVisible();
        console.log(`${i + 1}. Toast: "${text}" (visible: ${isVisible})`);
      }
    });
  });
});
