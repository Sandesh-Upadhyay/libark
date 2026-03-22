import { test, expect, Page } from '@playwright/test';
import { CreatePostPage } from './pages/CreatePostPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { RegisterPage, LoginPage } from './pages/AuthPage';
import { generateTestUser } from './helpers/test-data';

// Start fresh for each test (no pre-authenticated state)
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Helper to logout via UI
 */
async function logout(page: Page) {
  // Open user menu
  await page.getByTestId('user-menu-button').click();
  // Click logout
  await page.getByTestId('logout-button').click();
  // Verify logout success (login button visible)
  await expect(page.getByTestId('open-login-dialog-button')).toBeVisible();
}

/**
 * Helper to register a new user and return credentials
 */
async function registerNewUser(page: Page) {
  const user = generateTestUser();
  const registerPage = new RegisterPage(page);

  await registerPage.goto();
  await registerPage.register(user.username, user.email, user.password, user.displayName);

  // Wait for login success (redirect to home or user menu visible)
  await expect(page.getByTestId('user-menu-button')).toBeVisible({ timeout: 15000 });

  return user;
}

test.describe('👁️ Post Visibility Settings', () => {
  test('PUBLIC post should be visible to non-followers', async ({ page }) => {
    // 1. User A creates PUBLIC post
    const userA = await registerNewUser(page);
    const createPostPage = new CreatePostPage(page);
    await createPostPage.goto();

    const postContent = `Public Post ${Date.now()}`;
    await createPostPage.createPost(postContent, 'public');

    // Get the post ID from URL or response - simplified assumption:
    // After creation, we are redirected to home or post detail?
    // Assuming redirection to home, we find the post link or ID.
    // For TDD, let's assume we land on home and can click the new post.
    // Or we can intercept the creation request to get ID.

    // Better: Navigate to profile or just assume it's the latest post on feed?
    // Let's try to extract ID from URL if redirected to post detail.
    // If not, we might need to find it in the feed.
    // Let's assume we are redirected to home, and we click the first post.

    // Wait for post to appear in feed
    await expect(page.getByText(postContent)).toBeVisible();

    // Click to go to detail to get URL
    await page.getByText(postContent).first().click();
    await page.waitForURL(/\/post\//);
    const postUrl = page.url();

    // 2. Logout
    await logout(page);

    // 3. User B (not following) logs in
    const userB = await registerNewUser(page);

    // 4. User B navigates to post
    await page.goto(postUrl);

    // 5. Verify User B can see post content
    const postDetailPage = new PostDetailPage(page, postUrl.split('/').pop()!);
    await expect(page.getByText(postContent)).toBeVisible();
  });

  test('PRIVATE post should be visible only to followers', async ({ page }) => {
    // 1. User A creates PRIVATE post
    const userA = await registerNewUser(page);
    const createPostPage = new CreatePostPage(page);
    await createPostPage.goto();

    const postContent = `Private Post ${Date.now()}`;
    await createPostPage.createPost(postContent, 'private');

    // Get URL
    await expect(page.getByText(postContent)).toBeVisible();
    await page.getByText(postContent).first().click();
    await page.waitForURL(/\/post\//);
    const postUrl = page.url();
    const userAProfileUrl = `/u/${userA.username}`; // Assumption for profile URL

    // 2. Logout
    await logout(page);

    // 3. User C (not following) logs in
    await registerNewUser(page); // User C

    // 4. User C navigates to post
    await page.goto(postUrl);

    // 5. Verify User C CANNOT see post content, sees "Follow to view"
    await expect(page.getByText(postContent)).not.toBeVisible();
    await expect(page.getByText(/Follow to view|Private content/i)).toBeVisible();

    // 6. Logout
    await logout(page);

    // 7. User B (follower) logs in
    const userB = await registerNewUser(page);

    // 8. User B follows User A
    await page.goto(userAProfileUrl);
    await page.getByTestId('follow-button').click();
    await expect(page.getByTestId('unfollow-button')).toBeVisible(); // Verify follow success

    // 9. User B navigates to post
    await page.goto(postUrl);

    // 10. Verify User B can view post
    await expect(page.getByText(postContent)).toBeVisible();
  });

  test('PAID post should be visible only to purchasers', async ({ page }) => {
    // 1. User A creates PAID post
    const userA = await registerNewUser(page);
    const createPostPage = new CreatePostPage(page);
    await createPostPage.goto();

    const postContent = `Paid Post ${Date.now()}`;

    // Select PAID visibility
    await createPostPage.visibilitySelector.selectOption('paid');

    // Expect Price input to appear and fill it
    const priceInput = page.getByTestId('price-input');
    await expect(priceInput).toBeVisible();
    await priceInput.fill('100'); // 100 whatever currency

    await createPostPage.contentInput.fill(postContent);
    await createPostPage.submitButton.click();

    // Get URL
    // Paid posts might be visible to author
    await expect(page.getByText(postContent)).toBeVisible();
    await page.getByText(postContent).first().click();
    await page.waitForURL(/\/post\//);
    const postUrl = page.url();

    // 2. Logout
    await logout(page);

    // 3. User C (not purchased) logs in
    await registerNewUser(page);

    // 4. User C navigates to post
    await page.goto(postUrl);

    // 5. Verify User C sees purchase button and NOT full content
    // Assuming content is blurred or hidden
    await expect(page.getByTestId('purchase-post-button')).toBeVisible();
    // Maybe verify preview is visible but full content hidden?
    // For now, let's assume strict hiding or specific message
    // If the post content is visible, this assertion will fail (which is good if unimplemented)
    // But since User A sees it, we need to distinguish.
    // Maybe we look for a "blur" class or "Purchase to unlock" text
    await expect(page.getByText('Purchase to unlock')).toBeVisible();

    // 6. Logout
    await logout(page);

    // 7. User B (purchaser) logs in
    const userB = await registerNewUser(page);

    // 8. User B navigates to post and purchases
    await page.goto(postUrl);
    await page.getByTestId('purchase-post-button').click();

    // Confirm purchase dialog
    await page.getByTestId('confirm-purchase-button').click();

    // Wait for purchase to complete
    await expect(page.getByTestId('purchase-post-button')).not.toBeVisible();

    // 9. Verify User B can view full post
    await expect(page.getByText(postContent)).toBeVisible();
  });
});
