import { Page, Locator } from '@playwright/test';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';

export class ConversationPage {
  readonly page: Page;
  readonly conversationList: Locator;
  readonly messageList: MessageList;
  readonly messageInput: MessageInput;

  constructor(page: Page) {
    this.page = page;
    this.conversationList = page.getByTestId('conversation-list');
    this.messageList = new MessageList(page);
    this.messageInput = new MessageInput(page);
  }

  async goto(conversationId?: string) {
    const url = conversationId ? `/messages/${conversationId}` : '/messages';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async selectConversation(conversationId: string) {
    await this.conversationList.getByTestId(`conversation-item-${conversationId}`).click();
  }

  async sendMessage(text: string) {
    await this.messageInput.sendMessage(text);
  }

  async getMessages() {
    return this.messageList.getMessages();
  }
}
