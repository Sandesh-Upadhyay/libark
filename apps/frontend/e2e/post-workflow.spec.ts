import { test, expect } from '@playwright/test';
import { LoginPage, FeedPage, CreatePostPage, PostDetailPage } from './pages';
import { TEST_USERS } from './helpers/test-data';
import * as path from 'path';
import * as fs from 'fs';

const TEST_IMAGE_PATH = path.resolve('apps/frontend/e2e/temp-image.png');

test.describe('Post Workflow', () => {
  let loginPage: LoginPage;
  let feedPage: FeedPage;
  let createPostPage: CreatePostPage;
  // PostDetailPage will be instantiated dynamically

  test.beforeAll(async () => {
    // Create a dummy image file
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(TEST_IMAGE_PATH, buffer);
  });

  test.afterAll(async () => {
    // Clean up
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH);
    }
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    feedPage = new FeedPage(page);
    createPostPage = new CreatePostPage(page);

    // 1. Login
    await loginPage.goto();
    await loginPage.login(TEST_USERS.VALID_USER.email, TEST_USERS.VALID_USER.password);

    // Wait for redirect to home/feed
    await expect(page).toHaveURL(/\/home/);
  });

  test('should create post, view in feed, comment, and like', async ({ page }) => {
    const uniqueContent = `E2E Test Post ${Date.now()}`;

    // 2. Create post (with image)
    // Assuming we are on feed, click create post to go to create page or open modal
    await feedPage.clickCreatePost();

    // Check if we navigated to create-post page or if it's a modal.
    // The CreatePostPage has a goto() method but we clicked a button.
    // If CreatePostPage locators are present, we can proceed.
    // We might need to wait for the form to be visible.
    await expect(createPostPage.contentInput).toBeVisible();

    await createPostPage.uploadImage(TEST_IMAGE_PATH);
    await createPostPage.createPost(uniqueContent, 'public');

    // 3. View post in feed
    // Wait for the post to appear in the feed.
    // We don't have the ID yet, so we find by content.
    const postLocator = feedPage.postList.filter({ hasText: uniqueContent }).first();
    await expect(postLocator).toBeVisible();

    // Verify image is present in the post card (optional but good)
    // Using a generic selector for now as PostCard POM requires ID
    await expect(postLocator.getByRole('img')).toBeVisible();

    // 4. Open post detail
    // Click on the post content or a specific area to go to detail
    // We try to click the content part
    await postLocator.click();

    // Verify we are on post detail page
    await expect(page).toHaveURL(/\/post\//);

    // Extract Post ID from URL
    const url = page.url();
    const postId = url.split('/').pop();
    if (!postId) throw new Error('Could not extract post ID from URL');

    const postDetailPage = new PostDetailPage(page, postId);
    await expect(postDetailPage.postContainer).toBeVisible();

    // Verify content in detail
    const detailPostCard = await postDetailPage.getPostCard();
    await expect(detailPostCard.content).toContainText(uniqueContent);

    // 5. Add comment
    const commentText = `Nice post! ${Date.now()}`;
    await postDetailPage.addComment(commentText);

    // Verify comment appears
    // CommentSection updates automatically?
    const comments = await postDetailPage.commentSection.getComments();
    // Check if the last comment or any comment contains the text
    const lastComment = comments[comments.length - 1]; // This might need retrying or waiting
    // Better: use filter
    const myComment = postDetailPage.commentSection.commentList.getByText(commentText).first();
    await expect(myComment).toBeVisible();

    // 6. Like post
    const likeButton = detailPostCard.likeButton;
    const initialLikes = await likeButton.getCount();

    await likeButton.click();

    // Verify like count increases
    // Wait for UI update
    await expect(async () => {
      const newLikes = await likeButton.getCount();
      expect(newLikes).toBe(initialLikes + 1);
    }).toPass();

    // 7. Unlike post
    await likeButton.click();

    // Verify like count decreases
    await expect(async () => {
      const finalLikes = await likeButton.getCount();
      expect(finalLikes).toBe(initialLikes);
    }).toPass();
  });
});
