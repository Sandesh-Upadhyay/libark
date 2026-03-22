import { test, expect } from '@playwright/test';

import { LoginPage, RegisterPage } from '../pages/AuthPage';
import { generateTestUser, TEST_USERS } from '../helpers/test-data';

test.describe('🚨 認証エラーハンドリング', () => {
  test.describe('🌐 ネットワークエラー', () => {
    test('ログイン時のネットワークエラーハンドリング', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await test.step('ネットワークを無効化', async () => {
        await page.context().setOffline(true);
      });

      await test.step('ログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('ネットワークエラーメッセージを確認', async () => {
        await loginPage.verifyFormError(
          'ネットワークエラーが発生しました。接続を確認してください。'
        );
      });

      await test.step('ネットワークを復旧', async () => {
        await page.context().setOffline(false);
      });
    });

    test('登録時のネットワークエラーハンドリング', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      const testUser = generateTestUser();

      await test.step('ネットワークを無効化', async () => {
        await page.context().setOffline(true);
      });

      await test.step('登録試行', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('ネットワークエラーメッセージを確認', async () => {
        await registerPage.verifyFormError(
          'register-form',
          'ネットワークエラーが発生しました。接続を確認してください。'
        );
      });

      await test.step('ネットワークを復旧', async () => {
        await page.context().setOffline(false);
      });
    });
  });

  test.describe('⏱️ タイムアウトエラー', () => {
    test('ログイン時のタイムアウトハンドリング', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await test.step('レスポンスを遅延させる', async () => {
        await page.route('**/api/auth/login', async route => {
          // 30秒遅延（タイムアウトを発生させる）
          await new Promise(resolve => setTimeout(resolve, 30000));
          await route.continue();
        });
      });

      await test.step('ログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('タイムアウトエラーメッセージを確認', async () => {
        await loginPage.verifyFormError('リクエストがタイムアウトしました。再度お試しください。');
      });
    });
  });

  test.describe('🔒 認証エラー', () => {
    test('アカウントロック時のエラーハンドリング', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await test.step('アカウントロックレスポンスをモック', async () => {
        await page.route('**/api/auth/login', async route => {
          await route.fulfill({
            status: 423,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'ACCOUNT_LOCKED',
              message:
                'アカウントが一時的にロックされています。しばらく時間をおいてから再度お試しください。',
            }),
          });
        });
      });

      await test.step('ログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('アカウントロックエラーメッセージを確認', async () => {
        await loginPage.verifyFormError(
          'アカウントが一時的にロックされています。しばらく時間をおいてから再度お試しください。'
        );
      });
    });

    test('アカウント無効化時のエラーハンドリング', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await test.step('アカウント無効化レスポンスをモック', async () => {
        await page.route('**/api/auth/login', async route => {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'ACCOUNT_DISABLED',
              message: 'このアカウントは無効化されています。管理者にお問い合わせください。',
            }),
          });
        });
      });

      await test.step('ログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('アカウント無効化エラーメッセージを確認', async () => {
        await loginPage.verifyFormError(
          'このアカウントは無効化されています。管理者にお問い合わせください。'
        );
      });
    });
  });

  test.describe('🔄 リトライ機能', () => {
    test('一時的なサーバーエラー後のリトライ', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      let requestCount = 0;

      await test.step('最初のリクエストでエラー、2回目で成功するようにモック', async () => {
        await page.route('**/api/auth/login', async route => {
          requestCount++;
          if (requestCount === 1) {
            // 最初のリクエストは500エラー
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'サーバーエラーが発生しました。',
              }),
            });
          } else {
            // 2回目のリクエストは成功
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                user: { id: 1, email: TEST_USERS.VALID_USER.email },
                token: 'mock-token',
              }),
            });
          }
        });
      });

      await test.step('ログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('最初はエラーメッセージが表示される', async () => {
        await loginPage.verifyFormError('サーバーエラーが発生しました。');
      });

      await test.step('リトライボタンをクリック', async () => {
        const retryButton = page.getByTestId('retry-button');
        await retryButton.click();
      });

      await test.step('リトライ後にログイン成功', async () => {
        await expect(page).toHaveURL('/home');
      });
    });
  });

  test.describe('📱 レスポンシブエラー表示', () => {
    test('モバイル画面でのエラー表示', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await test.step('モバイル画面サイズに設定', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await loginPage.goto();

      await test.step('無効な認証情報でログイン試行', async () => {
        await loginPage.login(TEST_USERS.INVALID.email, TEST_USERS.INVALID.password);
      });

      await test.step('モバイルでエラーメッセージが適切に表示される', async () => {
        const errorMessage = page.locator('[role="alert"]').first();
        await expect(errorMessage).toBeVisible();

        // モバイルでも読みやすいサイズで表示されることを確認
        const boundingBox = await errorMessage.boundingBox();
        expect(boundingBox?.width).toBeLessThan(375); // 画面幅以内
      });
    });

    test('タブレット画面でのエラー表示', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await test.step('タブレット画面サイズに設定', async () => {
        await page.setViewportSize({ width: 768, height: 1024 });
      });

      await registerPage.goto();
      const testUser = generateTestUser();

      await test.step('バリデーションエラーを発生させる', async () => {
        await registerPage.register('ab', testUser.email, testUser.password); // 短すぎるユーザー名
      });

      await test.step('タブレットでエラーメッセージが適切に表示される', async () => {
        const errorMessage = page.getByTestId('username-field').locator('[role="alert"]').first();
        await expect(errorMessage).toBeVisible();

        // タブレットでも適切にレイアウトされることを確認
        const boundingBox = await errorMessage.boundingBox();
        expect(boundingBox?.width).toBeLessThan(768); // 画面幅以内
      });
    });
  });

  test.describe('♿ アクセシビリティエラー', () => {
    test('スクリーンリーダー用のエラーアナウンス', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await test.step('無効な認証情報でログイン試行', async () => {
        await loginPage.login(TEST_USERS.INVALID.email, TEST_USERS.INVALID.password);
      });

      await test.step('エラーメッセージにaria属性が設定されている', async () => {
        const errorMessage = page.locator('[role="alert"]').first();
        await expect(errorMessage).toHaveAttribute('role', 'alert');
        await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('フォーカス管理でのエラーハンドリング', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await test.step('バリデーションエラーを発生させる', async () => {
        await registerPage.usernameField.fill('ab'); // 短すぎるユーザー名
        await registerPage.emailField.fill('test@example.com');
        await registerPage.passwordField.fill('Password123!');
        await registerPage.submitButton.click();
      });

      await test.step('エラーのあるフィールドにフォーカスが移動する', async () => {
        await expect(registerPage.usernameField).toBeFocused();
      });

      await test.step('エラーメッセージがフィールドと関連付けられている', async () => {
        const errorMessage = page.getByTestId('username-field').locator('[role="alert"]').first();
        const errorId = await errorMessage.getAttribute('id');
        await expect(registerPage.usernameField).toHaveAttribute('aria-describedby', errorId);
      });
    });
  });
});
