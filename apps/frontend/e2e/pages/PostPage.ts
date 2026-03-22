/**
 * 🎯 投稿画面のページオブジェクト
 *
 * 投稿作成に関連する操作を提供します
 */

import { Page, Locator, expect } from '@playwright/test';

export class PostPage {
  readonly page: Page;

  // 要素ロケーター
  readonly postCreator: Locator;
  readonly postContentInput: Locator;
  readonly postErrorAlert: Locator;
  readonly postImageUploadSection: Locator;
  readonly postImageUploadActions: Locator;
  readonly imageFileInput: Locator;
  readonly imageUploadButton: Locator;
  readonly imageCount: Locator;
  readonly imageUploadLoading: Locator;
  readonly postSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // 投稿作成コンテナ
    this.postCreator = page.getByTestId('post-creator');

    // 投稿内容入力
    this.postContentInput = page.getByTestId('post-content-input').locator('textarea');

    // エラーアラート
    this.postErrorAlert = page.getByTestId('post-error-alert');

    // 画像アップロードセクション
    this.postImageUploadSection = page.getByTestId('post-image-upload-section');
    this.postImageUploadActions = page.getByTestId('post-image-upload-actions');
    this.imageFileInput = page.getByTestId('image-file-input');
    this.imageUploadButton = page.getByTestId('image-upload-button');
    this.imageCount = page.getByTestId('image-count');
    this.imageUploadLoading = page.getByTestId('image-upload-loading');

    // 投稿ボタン
    this.postSubmitButton = page.getByTestId('post-submit-button');
  }

  /**
   * 投稿画面に移動
   */
  async goto() {
    await this.page.goto('/home');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 投稿内容を入力
   */
  async enterContent(content: string) {
    await this.postContentInput.fill(content);
  }

  /**
   * 画像ファイルを選択
   */
  async selectImage(filePath: string) {
    const fileInput = this.imageFileInput;
    await fileInput.setInputFiles(filePath);
  }

  /**
   * 画像アップロードボタンをクリック
   */
  async clickImageUploadButton() {
    await this.imageUploadButton.click();
  }

  /**
   * 投稿ボタンをクリック
   */
  async clickSubmitButton() {
    await this.postSubmitButton.click();
  }

  /**
   * 画像が選択されているか確認
   */
  async verifyImageSelected(expectedCount: number) {
    await expect(this.imageCount).toContainText(`${expectedCount}/`);
  }

  /**
   * アップロード中か確認
   */
  async verifyUploading() {
    await expect(this.imageUploadLoading).toBeVisible();
  }

  /**
   * アップロード完了を確認
   */
  async verifyUploadComplete() {
    await expect(this.imageUploadLoading).not.toBeVisible();
  }

  /**
   * 投稿ボタンが有効か確認
   */
  async verifySubmitButtonEnabled() {
    await expect(this.postSubmitButton).toBeEnabled();
  }

  /**
   * 投稿ボタンが無効か確認
   */
  async verifySubmitButtonDisabled() {
    await expect(this.postSubmitButton).toBeDisabled();
  }

  /**
   * エラーアラートが表示されているか確認
   */
  async verifyErrorAlertVisible() {
    await expect(this.postErrorAlert).toBeVisible();
  }

  /**
   * エラーアラートが表示されていないか確認
   */
  async verifyErrorAlertNotVisible() {
    await expect(this.postErrorAlert).not.toBeVisible();
  }

  /**
   * 投稿作成フォームが表示されているか確認
   */
  async verifyFormVisible() {
    await expect(this.postCreator).toBeVisible();
  }

  /**
   * 画像アップロードセクションが表示されているか確認
   */
  async verifyImageUploadSectionVisible() {
    await expect(this.postImageUploadSection).toBeVisible();
  }
}
