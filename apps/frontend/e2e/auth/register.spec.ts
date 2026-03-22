import { test, expect } from '@playwright/test';

import { RegisterPage } from '../pages/AuthPage';
import {
  generateTestUser,
  EXPECTED_ERRORS,
  VALIDATION_TEST_CASES,
  generateInvalidUsernames,
  generateWeakPasswords,
  verifyAuthRedirect,
} from '../helpers/test-data';

test.describe('📝 登録機能', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test.describe('✅ 正常系テスト', () => {
    test('有効な情報で新規登録できる', async ({ page }) => {
      const testUser = generateTestUser();

      await test.step('登録フォームに入力', async () => {
        await registerPage.register(
          testUser.username,
          testUser.email,
          testUser.password,
          testUser.displayName
        );
      });

      await test.step('登録成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });

    test('表示名なしで新規登録できる', async ({ page }) => {
      const testUser = generateTestUser();

      await test.step('表示名なしで登録', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('登録成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });

    test('最小文字数のユーザー名で登録できる', async ({ page }) => {
      const testUser = generateTestUser();
      const timestamp = Date.now().toString().slice(-3); // 最後の3桁
      testUser.username = `ab${timestamp}`; // 3文字（最小）でユニーク

      await test.step('最小文字数のユーザー名で登録', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('登録成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });

    test('最大文字数のユーザー名で登録できる', async ({ page }) => {
      const testUser = generateTestUser();
      const timestamp = Date.now().toString().slice(-6); // 最後の6桁
      testUser.username = `user${timestamp}${'a'.repeat(6)}`; // 20文字（最大）でユニーク

      await test.step('最大文字数のユーザー名で登録', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('登録成功を確認', async () => {
        await verifyAuthRedirect(page, '/home');
      });
    });
  });

  test.describe('❌ 異常系テスト', () => {
    test('既存のメールアドレスで登録が失敗する', async () => {
      const testUser = generateTestUser();
      testUser.email = 'admin@libark.io'; // 既存のメールアドレス

      await test.step('既存のメールアドレスで登録試行', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('エラーメッセージを確認', async () => {
        await registerPage.verifyFormError(
          'register-email-field',
          'このメールアドレスは既に使用されています'
        );
      });
    });

    test('既存のユーザー名で登録が失敗する', async () => {
      const testUser = generateTestUser();
      testUser.username = 'admin'; // 既存のユーザー名

      await test.step('既存のユーザー名で登録試行', async () => {
        await registerPage.register(testUser.username, testUser.email, testUser.password);
      });

      await test.step('エラーメッセージを確認', async () => {
        await registerPage.verifyFormError(
          'username-field',
          'このユーザー名は既に使用されています'
        );
      });
    });
  });

  test.describe('🔍 バリデーションテスト', () => {
    test.describe('ユーザー名バリデーション', () => {
      test('空のユーザー名でバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('空のユーザー名で登録試行', async () => {
          await registerPage.register(
            VALIDATION_TEST_CASES.USERNAME.EMPTY,
            testUser.email,
            testUser.password
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'username-field',
            EXPECTED_ERRORS.REGISTER.EMPTY_USERNAME
          );
        });
      });

      test('短すぎるユーザー名でバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('短いユーザー名で登録試行', async () => {
          await registerPage.register(
            VALIDATION_TEST_CASES.USERNAME.TOO_SHORT,
            testUser.email,
            testUser.password
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'username-field',
            EXPECTED_ERRORS.REGISTER.SHORT_USERNAME
          );
        });
      });

      test('長すぎるユーザー名でバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('長いユーザー名で登録試行', async () => {
          await registerPage.register(
            VALIDATION_TEST_CASES.USERNAME.TOO_LONG,
            testUser.email,
            testUser.password
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'username-field',
            EXPECTED_ERRORS.REGISTER.LONG_USERNAME
          );
        });
      });

      test('無効な文字を含むユーザー名でバリデーションエラー', async () => {
        const testUser = generateTestUser();
        const invalidUsernames = generateInvalidUsernames();

        for (const invalidUsername of invalidUsernames.slice(2, 4)) {
          // @ と スペースをテスト
          await test.step(`無効なユーザー名 "${invalidUsername}" で登録試行`, async () => {
            // ページをリロードしてダイアログの状態をリセット
            await registerPage.goto();

            await registerPage.usernameField.fill(invalidUsername);
            await registerPage.emailField.fill(testUser.email);
            await registerPage.passwordField.fill(testUser.password);
            await registerPage.submitButton.click();
          });

          await test.step('バリデーションエラーを確認', async () => {
            await registerPage.verifyFormError(
              'username-field',
              EXPECTED_ERRORS.REGISTER.INVALID_USERNAME
            );
          });

          // フォームをリセット
          await registerPage.page.reload();
        }
      });
    });

    test.describe('メールアドレスバリデーション', () => {
      test('空のメールアドレスでバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('空のメールアドレスで登録試行', async () => {
          await registerPage.register(
            testUser.username,
            VALIDATION_TEST_CASES.EMAIL.EMPTY,
            testUser.password
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'register-email-field',
            EXPECTED_ERRORS.REGISTER.EMPTY_EMAIL
          );
        });
      });

      test('無効なメールアドレス形式でバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('無効なメール形式で登録試行', async () => {
          await registerPage.register(
            testUser.username,
            VALIDATION_TEST_CASES.EMAIL.INVALID_FORMAT,
            testUser.password
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'register-email-field',
            EXPECTED_ERRORS.REGISTER.INVALID_EMAIL
          );
        });
      });
    });

    test.describe('パスワードバリデーション', () => {
      test('空のパスワードでバリデーションエラー', async () => {
        const testUser = generateTestUser();

        await test.step('空のパスワードで登録試行', async () => {
          await registerPage.register(
            testUser.username,
            testUser.email,
            VALIDATION_TEST_CASES.PASSWORD.EMPTY
          );
        });

        await test.step('バリデーションエラーを確認', async () => {
          await registerPage.verifyFormError(
            'register-password-field',
            EXPECTED_ERRORS.REGISTER.EMPTY_PASSWORD
          );
        });
      });

      test('弱いパスワードでバリデーションエラー', async () => {
        const testUser = generateTestUser();
        const weakPasswords = generateWeakPasswords();

        for (const weakPassword of weakPasswords.slice(0, 3)) {
          // 最初の3つをテスト
          await test.step(`弱いパスワード "${weakPassword}" で登録試行`, async () => {
            // ページをリロードしてダイアログの状態をリセット
            await registerPage.goto();

            await registerPage.usernameField.fill(testUser.username);
            await registerPage.emailField.fill(testUser.email);
            await registerPage.passwordField.fill(weakPassword);
            await registerPage.submitButton.click();
          });

          await test.step('バリデーションエラーを確認', async () => {
            await registerPage.verifyFormError(
              'register-password-field',
              EXPECTED_ERRORS.REGISTER.WEAK_PASSWORD
            );
          });

          // フォームをリセット
          await registerPage.page.reload();
        }
      });
    });
  });

  test.describe('🔗 ナビゲーションテスト', () => {
    test('ログインページへのリンクが機能する', async ({ page }) => {
      await test.step('ログインリンクをクリック', async () => {
        await registerPage.goToLogin();
      });

      await test.step('ログインダイアログが開くことを確認', async () => {
        // ログインダイアログが表示されることを確認
        await expect(page.getByTestId('login-form')).toBeVisible();
      });
    });
  });

  test.describe('🎨 UI/UXテスト', () => {
    test('登録ボタンのローディング状態が表示される', async () => {
      const testUser = generateTestUser();

      await test.step('登録情報を入力', async () => {
        await registerPage.usernameField.fill(testUser.username);
        await registerPage.emailField.fill(testUser.email);
        await registerPage.passwordField.fill(testUser.password);
      });

      await test.step('登録ボタンをクリック', async () => {
        await registerPage.submitButton.click();
      });

      await test.step('ローディング状態を確認', async () => {
        await registerPage.verifyLoadingState();
      });
    });

    test('パスワードフィールドの表示/非表示切り替えが機能する', async ({ page }) => {
      const passwordField = registerPage.passwordField;
      const toggleButton = page
        .getByTestId('register-password-field')
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
  });
});
