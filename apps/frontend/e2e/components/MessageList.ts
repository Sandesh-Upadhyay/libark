import { Locator, Page } from '@playwright/test';

export class MessageList {
  readonly page: Page;
  readonly list: Locator;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByTestId('message-list');
  }

  async getMessages(): Promise<Locator[]> {
    return this.list.getByTestId('message-item').all();
  }

  async getMessageText(index: number): Promise<string | null> {
    return this.list.getByTestId('message-item').nth(index).textContent();
  }

  async getLastMessageText(): Promise<string | null> {
    const messages = this.list.getByTestId('message-item');
    const count = await messages.count();
    if (count === 0) return null;
    return messages.last().textContent();
  }

  async isRead(index: number): Promise<boolean> {
    const message = this.list.getByTestId('message-item').nth(index);
    // Assuming a read-receipt icon or class exists
    const readReceipt = message.getByTestId('read-receipt');
    return await readReceipt.isVisible();
  }
}
