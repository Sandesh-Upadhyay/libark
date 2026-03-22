import { test, expect } from '@playwright/test';

test.describe('P2P Deposit Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 認証済み状態をセットアップ
    // TODO: 実際の認証ロジックに置き換えてください
    await page.goto('/');
  });

  test('should display P2P deposit page', async ({ page }) => {
    await page.goto('/p2p/deposit');

    await expect(page.locator('h1')).toContainText('P2P入金');
    await expect(page.locator('text=法定通貨でウォレットに入金できます')).toBeVisible();
  });

  test('should navigate through deposit steps', async ({ page }) => {
    await page.goto('/p2p/deposit');

    // ステップ1: 金額入力
    await page.fill('input[type="number"]', '10000');
    await page.click('text=次へ: オファーを探す');

    // ステップ2: オファー選択（オファーが存在する場合）
    await expect(page.locator('text=オファーを選択')).toBeVisible();

    // ステップ3: 支払い（オファーを選択した場合）
    // TODO: オファー選択のテストを追加
  });

  test('should display trade history page', async ({ page }) => {
    await page.goto('/p2p/history');

    await expect(page.locator('h1')).toContainText('取引履歴');
    await expect(page.locator('text=ステータスフィルター')).toBeVisible();
  });

  test('should filter trades by status', async ({ page }) => {
    await page.goto('/p2p/history');

    // ステータスフィルターをクリック
    await page.click('text=完了');

    // フィルターが適用されていることを確認
    await expect(page.locator('text=完了')).toHaveClass(/border-blue-500/);
  });

  test('should display seller offer page', async ({ page }) => {
    await page.goto('/p2p/seller');

    await expect(page.locator('h1')).toContainText('売り手オファー設定');
    await expect(page.locator('text=P2P売り手としてオファーを設定できます')).toBeVisible();
  });

  test('should create seller offer', async ({ page }) => {
    await page.goto('/p2p/seller');

    // フォームに入力
    await page.fill('input[name="minAmount"]', '50');
    await page.fill('input[name="maxAmount"]', '500');
    await page.selectOption('select[name="currency"]', 'JPY');
    await page.fill('input[name="margin"]', '0.5');

    // 支払い方法を選択
    await page.check('input[value="bank_transfer"]');

    // 保存
    await page.click('text=オファーを保存');

    // TODO: 成功メッセージの確認
  });
});
