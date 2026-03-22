import { Locator, Page } from '@playwright/test';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

export class PostCard {
  readonly page: Page;
  readonly card: Locator;
  readonly content: Locator;
  readonly author: Locator;
  readonly timestamp: Locator;
  readonly likeButton: LikeButton;
  readonly commentButton: Locator;
  readonly commentCount: Locator;

  constructor(page: Page, postId: string) {
    this.page = page;
    this.card = page.getByTestId(`post-card-${postId}`);
    this.content = this.card.getByTestId('post-content');
    this.author = this.card.getByTestId('post-author');
    this.timestamp = this.card.getByTestId('post-timestamp');
    this.likeButton = new LikeButton(page, this.card);
    this.commentButton = this.card.getByTestId('comment-button');
    this.commentCount = this.card.getByTestId('comment-count');
  }

  async getContent(): Promise<string | null> {
    return this.content.textContent();
  }

  async getAuthor(): Promise<string | null> {
    return this.author.textContent();
  }

  async click() {
    await this.card.click();
  }

  async openComments() {
    await this.commentButton.click();
  }

  async getCommentCount(): Promise<number> {
    const text = await this.commentCount.innerText();
    return parseInt(text, 10);
  }
}
