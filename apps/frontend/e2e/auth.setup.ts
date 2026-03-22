import { test as setup } from '@playwright/test';

import { LoginPage } from './pages/AuthPage';
import { TEST_USERS } from './helpers/test-data';

/**
 * 認証セットアップ
 *
 * E2Eテストの実行前にユーザー認証を行い、storageStateを保存します。
 * これにより、各テストでログイン処理をスキップでき、テスト実行時間を短縮できます。
 */
setup('authenticate', async ({ page, context }) => {
  const loginPage = new LoginPage(page);

  // ログイン処理
  await loginPage.goto();
  await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);

  // ホームページに遷移するのを待機
  await page.waitForURL('**/home', { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // storageStateを保存
  await context.storageState({ path: 'playwright/.auth/user.json' });
});
