import { Locator, Page } from '@playwright/test';

export class CommentSection {
  readonly page: Page;
  readonly container: Locator;
  readonly commentList: Locator;
  readonly commentInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page, parentLocator?: Locator) {
    this.page = page;
    this.container = parentLocator ? parentLocator : page.locator('body');
    this.commentList = this.container.getByTestId('comment-list');
    this.commentInput = this.container.getByTestId('comment-input');
    this.submitButton = this.container.getByTestId('comment-submit');
  }

  async addComment(text: string) {
    await this.commentInput.fill(text);
    await this.submitButton.click();
  }

  async getComments(): Promise<Locator[]> {
    return this.commentList.getByTestId('comment-item').all();
  }

  async getCommentText(index: number): Promise<string | null> {
    return this.commentList.getByTestId('comment-item').nth(index).textContent();
  }
}
