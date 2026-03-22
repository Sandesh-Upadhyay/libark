import { test } from '@playwright/test';

import { LoginPage } from '../pages/AuthPage';
import { TEST_USERS } from '../helpers/test-data';

test.describe('🔍 ログイン処理の詳細デバッグ', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('ユーザー名ログインの詳細確認', async ({ page }) => {
    await test.step('ユーザー名でログイン試行', async () => {
      await loginPage.emailField.fill(TEST_USERS.VALID_USER.username);
      await loginPage.passwordField.fill(TEST_USERS.VALID_USER.password);

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

      await loginPage.submitButton.click();

      // ログイン処理の完了を待機
      await page.waitForTimeout(3000);

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
      const dialogVisible = await loginPage.loginDialog.isVisible();
      console.log(`ダイアログ表示状態: ${dialogVisible}`);

      // ページタイトル確認
      const title = await page.title();
      console.log(`ページタイトル: ${title}`);
    });
  });

  test('メールアドレスログインとの比較', async ({ page }) => {
    await test.step('メールアドレスでログイン試行', async () => {
      await loginPage.emailField.fill(TEST_USERS.VALID_USER.email);
      await loginPage.passwordField.fill(TEST_USERS.VALID_USER.password);

      // ネットワークリクエストを監視
      const responses: unknown[] = [];
      page.on('response', response => {
        if (response.url().includes('graphql')) {
          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
          });
        }
      });

      await loginPage.submitButton.click();

      // ログイン処理の完了を待機
      await page.waitForTimeout(3000);

      // ネットワークレスポンスをログ出力
      console.log('=== メールアドレスログイン - GraphQLレスポンス ===');
      responses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.status} ${resp.statusText} - ${resp.url}`);
      });

      // 現在のURL確認
      const currentUrl = page.url();
      console.log(`現在のURL: ${currentUrl}`);

      // 認証状態の確認
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(cookie => cookie.name === 'accessToken');
      console.log(`認証Cookie: ${authCookie ? '存在' : '不存在'}`);

      // リダイレクトが成功したかを確認
      if (currentUrl.includes('/home')) {
        console.log('✅ メールアドレスログインでリダイレクト成功');
      } else {
        console.log('❌ メールアドレスログインでリダイレクト失敗');
      }
    });
  });
});
