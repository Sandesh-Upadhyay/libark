import { test } from '@playwright/test';

import { PostPage } from './pages/PostPage';

test.describe('📸 Post Image Upload', () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);

    // /homeへ遷移（認証はstorageStateで済んでいる）
    await page.goto('http://nginx/home');

    // waitForLoadState('networkidle')乱用せず、必要な要素の可視待ち
    await page.waitForSelector('[data-testid="post-creator"]');
  });

  test.describe('✅ 正常系テスト', () => {
    test('should upload image via Gateway mode and display in feed', async ({ page }) => {
      // 画像アップロード
      const fileChooserPromise = page.waitForEvent('filechooser');
      await postPage.clickImageUploadButton();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        ),
      });

      // 投稿作成（本文はDate.now()でユニーク化）
      const postContent = `Test post ${Date.now()}`;
      await postPage.enterContent(postContent);
      await postPage.clickSubmitButton();

      // 成功トースト（または成功状態）を確認
      const toast = page.locator('[data-sonner-toast]').filter({ hasText: /投稿/ });
      await toast.waitFor({ state: 'visible', timeout: 10000 });

      // フィード上に投稿本文で該当投稿を特定して表示確認
      await page.waitForSelector(`text=${postContent}`, { timeout: 10000 });

      // その投稿カード内で画像表示を確認
      await page.waitForSelector('[data-testid="post-image"]', { timeout: 10000 });
    });

    test('画像なしで投稿を作成できる', async ({ page }) => {
      await test.step('投稿内容を入力', async () => {
        await postPage.enterContent('テスト投稿です');
      });

      await test.step('投稿ボタンが有効になることを確認', async () => {
        await postPage.verifySubmitButtonEnabled();
      });

      await test.step('投稿を送信', async () => {
        await postPage.clickSubmitButton();
      });

      await test.step('投稿が成功することを確認', async () => {
        // トーストメッセージが表示されることを確認
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: /投稿/ });
        await toast.waitFor({ state: 'visible', timeout: 10000 });
      });
    });

    test('画像付きで投稿を作成できる', async ({ page }) => {
      await test.step('テスト画像ファイルを作成', async () => {
        // テスト用の画像ファイルを作成
        const testImage = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        );
        await page.route('**/test-image.png', route => {
          route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: testImage,
          });
        });
      });

      await test.step('画像を選択', async () => {
        // 画像ファイルを選択
        const fileChooserPromise = page.waitForEvent('filechooser');
        await postPage.clickImageUploadButton();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      });

      await test.step('画像が選択されていることを確認', async () => {
        await postPage.verifyImageSelected(1);
      });

      await test.step('投稿内容を入力', async () => {
        await postPage.enterContent('画像付きテスト投稿です');
      });

      await test.step('投稿ボタンが有効になることを確認', async () => {
        await postPage.verifySubmitButtonEnabled();
      });

      await test.step('投稿を送信', async () => {
        await postPage.clickSubmitButton();
      });

      await test.step('投稿が成功することを確認', async () => {
        // トーストメッセージが表示されることを確認
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: /投稿/ });
        await toast.waitFor({ state: 'visible', timeout: 10000 });
      });
    });

    test('複数の画像を選択できる', async ({ page }) => {
      await test.step('複数の画像を選択', async () => {
        // 画像ファイルを選択
        const fileChooserPromise = page.waitForEvent('filechooser');
        await postPage.clickImageUploadButton();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([
          {
            name: 'test-image-1.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
          {
            name: 'test-image-2.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        ]);
      });

      await test.step('画像が選択されていることを確認', async () => {
        await postPage.verifyImageSelected(2);
      });

      await test.step('投稿内容を入力', async () => {
        await postPage.enterContent('複数画像付きテスト投稿です');
      });

      await test.step('投稿を送信', async () => {
        await postPage.clickSubmitButton();
      });

      await test.step('投稿が成功することを確認', async () => {
        // トーストメッセージが表示されることを確認
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: /投稿/ });
        await toast.waitFor({ state: 'visible', timeout: 10000 });
      });
    });
  });

  test.describe('🔍 バリデーションテスト', () => {
    test('投稿内容なしで画像のみで投稿できる', async ({ page }) => {
      await test.step('画像を選択', async () => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await postPage.clickImageUploadButton();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      });

      await test.step('投稿ボタンが有効になることを確認', async () => {
        await postPage.verifySubmitButtonEnabled();
      });

      await test.step('投稿を送信', async () => {
        await postPage.clickSubmitButton();
      });

      await test.step('投稿が成功することを確認', async () => {
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: /投稿/ });
        await toast.waitFor({ state: 'visible', timeout: 10000 });
      });
    });

    test('投稿内容と画像なしで投稿できない', async () => {
      await test.step('投稿ボタンが無効であることを確認', async () => {
        await postPage.verifySubmitButtonDisabled();
      });
    });
  });

  test.describe('🎨 UI/UXテスト', () => {
    test('投稿作成フォームが表示される', async () => {
      await test.step('フォームが表示されていることを確認', async () => {
        await postPage.verifyFormVisible();
      });
    });

    test('画像アップロードセクションが表示される', async () => {
      await test.step('画像アップロードセクションが表示されていることを確認', async () => {
        await postPage.verifyImageUploadSectionVisible();
      });
    });

    test('画像選択後に画像数が表示される', async ({ page }) => {
      await test.step('画像を選択', async () => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await postPage.clickImageUploadButton();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      });

      await test.step('画像数が表示されていることを確認', async () => {
        await postPage.verifyImageSelected(1);
      });
    });
  });
});
