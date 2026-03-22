import { test } from '@playwright/test';

import { RegisterPage } from '../pages/AuthPage';
import { generateTestUser } from '../helpers/test-data';

test.describe('🔍 サーバーエラーメッセージの詳細デバッグ', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('既存ユーザー名エラーの詳細確認', async ({ page }) => {
    await test.step('既存ユーザー名で登録試行', async () => {
      const testUser = generateTestUser();

      await registerPage.usernameField.fill('admin'); // 既存のユーザー名
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
            body: responseBody,
          });
        }
      });

      await registerPage.submitButton.click();

      // 登録処理の完了を待機
      await page.waitForTimeout(3000);

      // ネットワークレスポンスをログ出力
      console.log('=== 既存ユーザー名 - GraphQLレスポンス ===');
      responses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.status} ${resp.statusText}`);
        console.log(`   Body: ${resp.body.substring(0, 1000)}...`);
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

      // トーストメッセージの確認
      const toasts = await page.locator('[data-sonner-toast]').all();
      console.log(`=== トーストメッセージ数: ${toasts.length} ===`);

      for (let i = 0; i < toasts.length; i++) {
        const text = await toasts[i].textContent();
        const isVisible = await toasts[i].isVisible();
        console.log(`${i + 1}. Toast: "${text}" (visible: ${isVisible})`);
      }

      // 全てのエラー関連要素を確認
      const allErrorElements = await page
        .locator('.text-destructive, [role="alert"], .text-red-500')
        .all();
      console.log(`=== 全エラー要素数: ${allErrorElements.length} ===`);

      for (let i = 0; i < allErrorElements.length; i++) {
        const text = await allErrorElements[i].textContent();
        const isVisible = await allErrorElements[i].isVisible();
        const tagName = await allErrorElements[i].evaluate(el => el.tagName);
        const className = await allErrorElements[i].evaluate(el => el.className);
        console.log(
          `${i + 1}. ${tagName}: "${text}" (visible: ${isVisible}) (class: ${className})`
        );
      }
    });
  });
});
