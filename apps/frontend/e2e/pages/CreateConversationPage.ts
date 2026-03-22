import { Page, Locator } from '@playwright/test';

export class CreateConversationPage {
  readonly page: Page;
  readonly userSearchInput: Locator;
  readonly userList: Locator;
  readonly createGroupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userSearchInput = page.getByTestId('user-search-input');
    this.userList = page.getByTestId('user-list');
    this.createGroupButton = page.getByTestId('create-group-button');
  }

  async goto() {
    await this.page.goto('/messages/new');
    await this.page.waitForLoadState('networkidle');
  }

  async searchUser(name: string) {
    await this.userSearchInput.fill(name);
    // Wait for search results
    await this.page.waitForTimeout(500); // Debounce
  }

  async selectUser(userId: string) {
    await this.userList.getByTestId(`user-item-${userId}`).click();
  }

  async startConversation() {
    await this.createGroupButton.click();
  }
}
