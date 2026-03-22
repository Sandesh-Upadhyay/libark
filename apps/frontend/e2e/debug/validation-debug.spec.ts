import { test } from '@playwright/test';

import { LoginPage } from '../pages/AuthPage';

test.describe('🔍 バリデーション動作の詳細確認', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('フォームバリデーションの動作を詳細確認', async ({ page }) => {
    await test.step('空のフィールドでフォーム送信', async () => {
      // 空のままフォーム送信
      await loginPage.submitButton.click();

      // 少し待機してエラーメッセージの表示を確認
      await page.waitForTimeout(1000);

      // ページ全体のHTML構造をログ出力
      const html = await page.content();
      console.log('=== ページHTML構造 ===');
      console.log(html.substring(0, 2000)); // 最初の2000文字

      // text-destructiveクラスを持つ全ての要素を確認
      const destructiveElements = await page.locator('.text-destructive').all();
      console.log(`=== text-destructive要素数: ${destructiveElements.length} ===`);

      for (let i = 0; i < destructiveElements.length; i++) {
        const text = await destructiveElements[i].textContent();
        const tagName = await destructiveElements[i].evaluate(el => el.tagName);
        const className = await destructiveElements[i].evaluate(el => el.className);
        console.log(`${i + 1}. ${tagName}: "${text}" (class: ${className})`);
      }

      // FormMessage要素を探す
      const formMessages = await page.locator('p[id*="form-item-message"]').all();
      console.log(`=== FormMessage要素数: ${formMessages.length} ===`);

      for (let i = 0; i < formMessages.length; i++) {
        const text = await formMessages[i].textContent();
        const isVisible = await formMessages[i].isVisible();
        console.log(`${i + 1}. FormMessage: "${text}" (visible: ${isVisible})`);
      }
    });

    await test.step('無効なメールアドレスでバリデーション確認', async () => {
      // 無効なメールアドレスを入力
      await loginPage.emailField.fill('invalid-email');
      await loginPage.passwordField.fill('short');

      // フォーム送信
      await loginPage.submitButton.click();

      // 少し待機
      await page.waitForTimeout(1000);

      // バリデーションエラーの確認
      const formMessages = await page.locator('p[id*="form-item-message"]').all();
      console.log('=== バリデーション後のFormMessage ===');

      for (let i = 0; i < formMessages.length; i++) {
        const text = await formMessages[i].textContent();
        const isVisible = await formMessages[i].isVisible();
        console.log(`${i + 1}. FormMessage: "${text}" (visible: ${isVisible})`);
      }
    });
  });

  test('ログイン失敗時のエラーメッセージ確認', async ({ page }) => {
    await test.step('存在しないユーザーでログイン試行', async () => {
      await loginPage.emailField.fill('nonexistent@example.com');
      await loginPage.passwordField.fill('wrongpassword');
      await loginPage.submitButton.click();

      // ログイン処理の完了を待機
      await page.waitForTimeout(3000);

      // エラーメッセージの確認
      const formMessages = await page.locator('p[id*="form-item-message"]').all();
      console.log('=== ログイン失敗後のFormMessage ===');

      for (let i = 0; i < formMessages.length; i++) {
        const text = await formMessages[i].textContent();
        const isVisible = await formMessages[i].isVisible();
        console.log(`${i + 1}. FormMessage: "${text}" (visible: ${isVisible})`);
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
