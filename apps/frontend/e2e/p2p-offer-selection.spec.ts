import { test, expect } from '@playwright/test';

test.describe('P2Pオファー選択と取引作成', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('オファー一覧が表示される', async ({ page }) => {
    await page.goto('/p2p');

    // オファーテーブルが表示されることを確認
    await expect(page.locator('[data-testid="p2p-offer-table"]')).toBeVisible();

    // オファーが少なくとも1つ表示されることを確認
    const offerCards = page.locator('[data-testid="p2p-offer-card"]');
    await expect(offerCards.first()).toBeVisible();
  });

  test('オファーを選択して取引を作成する', async ({ page }) => {
    await page.goto('/p2p');

    // 最初のオファーを選択
    await page.locator('[data-testid="p2p-offer-card"]').first().click();

    // 金額を入力
    await page.fill('input[name="amount"]', '100');

    // 取引作成ボタンをクリック
    await page.click('button[data-testid="create-trade-button"]');

    // 取引が作成されたことを確認
    await expect(page.locator('[data-testid="trade-success-message"]')).toBeVisible();
  });

  test('金額範囲外の入力でエラーが表示される', async ({ page }) => {
    await page.goto('/p2p');

    // 最初のオファーを選択
    await page.locator('[data-testid="p2p-offer-card"]').first().click();

    // 最小金額未満を入力
    await page.fill('input[name="amount"]', '1');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
  });
});
