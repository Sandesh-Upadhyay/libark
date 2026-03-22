import { Page, Locator } from '@playwright/test';
import { PostCard } from '../components/PostCard';
import { CommentSection } from '../components/CommentSection';

export class PostDetailPage {
  readonly page: Page;
  readonly postContainer: Locator;
  readonly commentSection: CommentSection;

  constructor(
    page: Page,
    readonly postId: string
  ) {
    this.page = page;
    this.postContainer = page.getByTestId('post-detail-container');
    this.commentSection = new CommentSection(page, this.postContainer);
  }

  async goto() {
    await this.page.goto(`/post/${this.postId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getPostCard(): Promise<PostCard> {
    return new PostCard(this.page, this.postId);
  }

  async addComment(text: string) {
    await this.commentSection.addComment(text);
  }
}
