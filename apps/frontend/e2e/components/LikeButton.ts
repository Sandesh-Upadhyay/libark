import { Locator, Page } from '@playwright/test';

export class LikeButton {
  readonly page: Page;
  readonly container: Locator;
  readonly button: Locator;
  readonly count: Locator;

  constructor(page: Page, parentLocator?: Locator) {
    this.page = page;
    this.container = parentLocator ? parentLocator : page.locator('body');
    this.button = this.container.getByTestId('like-button');
    this.count = this.container.getByTestId('like-count');
  }

  async click() {
    await this.button.click();
  }

  async getCount(): Promise<number> {
    const text = await this.count.innerText();
    return parseInt(text, 10);
  }

  async isLiked(): Promise<boolean> {
    // Assuming a class or attribute indicates liked state
    // For now, checking if data-liked attribute exists or specific class
    const isLiked = await this.button.getAttribute('data-liked');
    return isLiked === 'true';
  }
}
