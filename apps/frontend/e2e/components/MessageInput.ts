import { Locator, Page } from '@playwright/test';

export class MessageInput {
  readonly page: Page;
  readonly input: Locator;
  readonly sendButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByTestId('message-input');
    this.sendButton = page.getByTestId('send-button');
  }

  async sendMessage(text: string) {
    await this.input.fill(text);
    await this.sendButton.click();
  }
}
