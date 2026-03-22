import { Page, Locator } from '@playwright/test';

export class CreatePostPage {
  readonly page: Page;
  readonly contentInput: Locator;
  readonly visibilitySelector: Locator;
  readonly imageUploadButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.contentInput = page.getByTestId('post-content-input');
    this.visibilitySelector = page.getByTestId('visibility-selector');
    this.imageUploadButton = page.getByTestId('image-upload-button');
    this.submitButton = page.getByTestId('submit-post-button');
  }

  async goto() {
    await this.page.goto('/create-post');
    await this.page.waitForLoadState('networkidle');
  }

  async createPost(content: string, visibility: string = 'public') {
    await this.contentInput.fill(content);
    await this.visibilitySelector.selectOption(visibility);
    await this.submitButton.click();
  }

  async uploadImage(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.imageUploadButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }
}
