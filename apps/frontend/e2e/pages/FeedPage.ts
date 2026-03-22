import { Page, Locator } from '@playwright/test';
import { PostCard } from '../components/PostCard';

export class FeedPage {
  readonly page: Page;
  readonly postList: Locator;
  readonly createPostButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postList = page.getByTestId('post-list');
    this.createPostButton = page.getByTestId('create-post-button');
  }

  async goto() {
    await this.page.goto('/home');
    await this.page.waitForLoadState('networkidle');
  }

  async getPost(postId: string): Promise<PostCard> {
    return new PostCard(this.page, postId);
  }

  async clickCreatePost() {
    await this.createPostButton.click();
  }
}
