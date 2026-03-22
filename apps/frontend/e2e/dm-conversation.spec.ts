import { test, expect, type Page, type Browser } from '@playwright/test';
import { LoginPage, ConversationPage, CreateConversationPage } from './pages';
import { RegisterPage } from './pages/AuthPage';
import { generateTestUser } from './helpers/test-data';

// Helper to create and authenticate a new user in a fresh context
async function setupUser(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = generateTestUser();

  // Use RegisterPage to create the user and log them in
  const registerPage = new RegisterPage(page);
  await registerPage.goto();
  await registerPage.register(user.username, user.email, user.password, user.displayName);

  // Verify we are redirected to home (logged in)
  await expect(page).toHaveURL(/\/home/);

  return { page, user, context };
}

test.describe('DM Conversation E2E', () => {
  test('1-on-1 direct message', async ({ browser }) => {
    // Create two browser contexts for User A and User B
    const userA = await setupUser(browser);
    const userB = await setupUser(browser);

    // User A starts conversation and sends message
    const conversationPageA = new ConversationPage(userA.page);
    const createPageA = new CreateConversationPage(userA.page);

    // Navigate to create new conversation
    await createPageA.goto();

    // Search and select User B
    // Note: Assuming searchUser takes username and selectUser takes username (or ID that matches username in test env)
    await createPageA.searchUser(userB.user.username);
    await createPageA.selectUser(userB.user.username);

    // Start conversation (navigate to message view)
    await createPageA.startConversation();

    // Send message
    const messageContent = `Hello ${userB.user.username}, this is a test message.`;
    await conversationPageA.sendMessage(messageContent);

    // User B verifies message received
    const conversationPageB = new ConversationPage(userB.page);
    await conversationPageB.goto(); // Go to messages list

    // Select the conversation (assuming it appears in the list)
    // Note: In a real app, we might need to know the conversation ID or find it by user name
    // For now, we assume the latest conversation is accessible or finding it by user A's username works
    // If selectConversation requires ID, we might need to find the ID first.
    // Here we'll try to rely on the UI showing the user name.
    // If the POM requires ID, this step might fail without modification to POM or app to expose IDs.
    // We will attempt to select by User A's username assuming the test ID might reflect it or we can find it.
    // However, the POM uses `getByTestId('conversation-item-${conversationId}')`.
    // We don't have the conversation ID.
    // WORKAROUND: In a real test we would intercept the network request to get the ID.
    // For this TDD phase, we will assume we can somehow select it, or perhaps check the list for text.
    // We'll skip explicit selection if we land on the conversation, or try to click the first one.

    await expect(userB.page.getByText(userA.user.username)).toBeVisible();
    await userB.page.getByText(userA.user.username).click(); // Click on conversation with User A

    const messagesB = await conversationPageB.getMessages();
    const lastMessageB = messagesB[messagesB.length - 1];
    await expect(lastMessageB).toContainText(messageContent);

    // User B replies
    const replyContent = `Hi ${userA.user.username}, I received your message.`;
    await conversationPageB.sendMessage(replyContent);

    // User A verifies reply
    // Wait for message to appear (polling or websocket)
    await expect(userA.page.getByText(replyContent)).toBeVisible();

    const messagesA = await conversationPageA.getMessages();
    const lastMessageA = messagesA[messagesA.length - 1];
    await expect(lastMessageA).toContainText(replyContent);
  });

  test('group conversation', async ({ browser }) => {
    // Create three browser contexts
    const userA = await setupUser(browser);
    const userB = await setupUser(browser);
    const userC = await setupUser(browser);

    // User A creates group with B and C
    const createPageA = new CreateConversationPage(userA.page);
    const conversationPageA = new ConversationPage(userA.page);

    await createPageA.goto();

    // Add User B
    await createPageA.searchUser(userB.user.username);
    await createPageA.selectUser(userB.user.username);

    // Add User C
    await createPageA.searchUser(userC.user.username);
    await createPageA.selectUser(userC.user.username);

    // Create group with name
    const groupName = 'Test Group ' + Date.now();

    // Note: createGroup method is expected by the prompt but might not exist on POM yet.
    // Casting to any to allow TDD RED phase compilation.
    if ('createGroup' in createPageA) {
      await (createPageA as any).createGroup(groupName);
    } else {
      // Fallback or explicit failure expectation if method missing
      // For TDD, we simulate the call
      await (createPageA as any).createGroup(groupName);
    }

    // User A sends message
    const groupMessage = 'Hello everyone in the group!';
    await conversationPageA.sendMessage(groupMessage);

    // User B and C verify message received
    // User B
    const conversationPageB = new ConversationPage(userB.page);
    await conversationPageB.goto();
    await expect(userB.page.getByText(groupName)).toBeVisible();
    await userB.page.getByText(groupName).click();
    await expect(userB.page.getByText(groupMessage)).toBeVisible();

    // User C
    const conversationPageC = new ConversationPage(userC.page);
    await conversationPageC.goto();
    await expect(userC.page.getByText(groupName)).toBeVisible();
    await userC.page.getByText(groupName).click();
    await expect(userC.page.getByText(groupMessage)).toBeVisible();
  });
});
