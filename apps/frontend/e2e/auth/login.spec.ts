import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages/AuthPage';
import {
  TEST_USERS,
  EXPECTED_ERRORS,
  VALIDATION_TEST_CASES,
  verifyAuthRedirect,
} from '../helpers/test-data';

test.describe('🚪 ログイン機能', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('✅ 正常系テスト', () => {
    test('有効な認証情報でログインできる', async ({ page }) => {
      await test.step('ログインフォームに入力', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);
      });

      await test.step('ログイン成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });

    test('管理者アカウントでログインできる', async ({ page }) => {
      await test.step('管理者認証情報でログイン', async () => {
        await loginPage.login(TEST_USERS.VALID_ADMIN.email, TEST_USERS.VALID_ADMIN.password);
      });

      await test.step('ログイン成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });

    test('ユーザー名でもログインできる', async ({ page }) => {
      await test.step('ユーザー名でログイン', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.username, TEST_USERS.VALID_USER.password);
      });

      await test.step('ログイン成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });
  });

  test.describe('❌ 異常系テスト', () => {
    test('無効な認証情報でログインが失敗する', async () => {
      await test.step('無効な認証情報でログイン試行', async () => {
        await loginPage.login(TEST_USERS.INVALID.email, TEST_USERS.INVALID.password);
      });

      await test.step('エラーメッセージを確認', async () => {
        await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.INVALID_CREDENTIALS);
      });
    });

    test('存在しないユーザーでログインが失敗する', async () => {
      await test.step('存在しないユーザーでログイン試行', async () => {
        await loginPage.login('nonexistent@example.com', 'password123');
      });

      await test.step('エラーメッセージを確認', async () => {
        await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.INVALID_CREDENTIALS);
      });
    });

    test('間違ったパスワードでログインが失敗する', async () => {
      await test.step('正しいメール、間違ったパスワードでログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, 'wrongpassword');
      });

      await test.step('エラーメッセージを確認', async () => {
        // フォームエラーまたはトーストエラーのいずれかが表示されることを確認
        try {
          await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.INVALID_CREDENTIALS);
        } catch {
          // フォームエラーが表示されない場合はトーストエラーを確認
          await loginPage.verifyToastError(EXPECTED_ERRORS.LOGIN.INVALID_CREDENTIALS);
        }
      });
    });
  });

  test.describe('🔍 バリデーションテスト', () => {
    test('空のメールアドレスでバリデーションエラー', async () => {
      await test.step('空のメールアドレスでログイン試行', async () => {
        await loginPage.login(VALIDATION_TEST_CASES.EMAIL.EMPTY, TEST_USERS.VALID_USER.password);
      });

      await test.step('バリデーションエラーを確認', async () => {
        await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.EMPTY_EMAIL);
      });
    });

    test('空のパスワードでバリデーションエラー', async () => {
      await test.step('空のパスワードでログイン試行', async () => {
        await loginPage.login(TEST_USERS.VALID_USER.email, VALIDATION_TEST_CASES.PASSWORD.EMPTY);
      });

      await test.step('バリデーションエラーを確認', async () => {
        await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.EMPTY_PASSWORD);
      });
    });

    test('短すぎるパスワードでバリデーションエラー', async () => {
      await test.step('短いパスワードでログイン試行', async () => {
        await loginPage.login(
          TEST_USERS.VALID_USER.email,
          VALIDATION_TEST_CASES.PASSWORD.TOO_SHORT
        );
      });

      await test.step('バリデーションエラーを確認', async () => {
        await loginPage.verifyFormError(EXPECTED_ERRORS.LOGIN.SHORT_PASSWORD);
      });
    });

    test('無効なメールアドレス形式でバリデーションエラー', async () => {
      await test.step('無効なメール形式でログイン試行', async () => {
        await loginPage.login(
          VALIDATION_TEST_CASES.EMAIL.INVALID_FORMAT,
          TEST_USERS.VALID_USER.password
        );
      });

      await test.step('バリデーションエラーを確認', async () => {
        await loginPage.verifyFormError('有効なメールアドレスまたはユーザー名を入力してください');
      });
    });
  });

  test.describe('🔗 ナビゲーションテスト', () => {
    test('登録ダイアログへの切り替えが機能する', async ({ page }) => {
      await test.step('登録切り替えボタンをクリック', async () => {
        await loginPage.switchToRegister();
      });

      await test.step('登録ダイアログが開くことを確認', async () => {
        // 登録ダイアログが表示されることを確認
        await expect(page.getByTestId('register-dialog')).toBeVisible();
        // ログインダイアログが閉じることを確認
        await expect(page.getByTestId('login-dialog')).not.toBeVisible();
      });
    });

    test('パスワード忘れページへのリンクが機能する', async ({ page }) => {
      await test.step('パスワード忘れリンクをクリック', async () => {
        await loginPage.goToForgotPassword();
      });

      await test.step('パスワード忘れページに遷移することを確認', async () => {
        await expect(page).toHaveURL('/forgot-password');
      });
    });
  });

  test.describe('🎨 UI/UXテスト', () => {
    test('ログインボタンのローディング状態が表示される', async () => {
      await test.step('ログイン情報を入力', async () => {
        await loginPage.emailField.fill(TEST_USERS.VALID_USER.email);
        await loginPage.passwordField.fill(TEST_USERS.VALID_USER.password);
      });

      await test.step('ログインボタンをクリック', async () => {
        await loginPage.submitButton.click();
      });

      await test.step('ローディング状態を確認', async () => {
        await loginPage.verifyLoadingState();
      });
    });

    test('パスワードフィールドの表示/非表示切り替えが機能する', async ({ page }) => {
      const passwordField = loginPage.passwordField;
      const toggleButton = page
        .getByTestId('password-field')
        .locator('[data-testid="password-toggle"]');

      await test.step('パスワードを入力', async () => {
        await passwordField.fill('testpassword');
      });

      await test.step('初期状態でパスワードが隠されている', async () => {
        await expect(passwordField).toHaveAttribute('type', 'password');
      });

      await test.step('表示切り替えボタンをクリック', async () => {
        await toggleButton.click();
      });

      await test.step('パスワードが表示される', async () => {
        await expect(passwordField).toHaveAttribute('type', 'text');
      });

      await test.step('再度切り替えボタンをクリック', async () => {
        await toggleButton.click();
      });

      await test.step('パスワードが再び隠される', async () => {
        await expect(passwordField).toHaveAttribute('type', 'password');
      });
    });

    test('パスワード切り替えボタンがフォーム送信を引き起こさない', async ({ page }) => {
      await test.step('フォームに入力', async () => {
        await loginPage.emailField.fill('test@example.com');
        await loginPage.passwordField.fill('testpassword');
      });

      await test.step('パスワード切り替えボタンをクリック', async () => {
        const currentUrl = page.url();
        const toggleButton = page
          .getByTestId('password-field')
          .locator('[data-testid="password-toggle"]');

        // パスワード切り替えボタンをクリック
        await toggleButton.click();

        // 少し待機してフォーム送信が発生しないことを確認
        await page.waitForTimeout(1000);

        // URLが変わっていないことを確認（フォーム送信されていない）
        await expect(page).toHaveURL(currentUrl);

        // ダイアログがまだ開いていることを確認
        await expect(loginPage.loginDialog).toBeVisible();

        // パスワードフィールドのtype属性が変更されていることを確認
        await expect(loginPage.passwordField).toHaveAttribute('type', 'text');
      });

      await test.step('再度切り替えて元に戻す', async () => {
        const toggleButton = page
          .getByTestId('password-field')
          .locator('[data-testid="password-toggle"]');
        await toggleButton.click();

        // パスワードが再び隠されることを確認
        await expect(loginPage.passwordField).toHaveAttribute('type', 'password');

        // まだダイアログが開いていることを確認
        await expect(loginPage.loginDialog).toBeVisible();
      });
    });
  });
});
