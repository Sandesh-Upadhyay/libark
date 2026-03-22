/**
 * 📨 Message Factory
 *
 * Factory for creating test messages.
 * Auto-creates conversation and sender if not provided.
 */

import type { PrismaClient, Prisma, Message, MessageType } from '@libark/db';
import { BaseFactory, FactoryOptions } from './BaseFactory';
import { UserFactory, type UserOverride } from './UserFactory';
import { ConversationFactory, type ConversationOverride } from './ConversationFactory';

export interface MessageOverride {
  conversationId?: string;
  senderId?: string;
  content?: string;
  type?: MessageType;
  replyToId?: string | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  sender?: UserOverride;
  conversation?: ConversationOverride;
}

type MessageUncheckedCreateInput = Prisma.MessageUncheckedCreateInput;

export class MessageFactory extends BaseFactory<
  Message,
  MessageUncheckedCreateInput,
  MessageOverride,
  'conversationId' | 'senderId'
> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly userFactory: UserFactory,
    private readonly conversationFactory: ConversationFactory
  ) {
    super(prisma);
  }

  protected async generateDefaults(): Promise<
    Omit<MessageUncheckedCreateInput, 'id' | 'conversationId' | 'senderId'>
  > {
    return {
      content: `Test message ${Date.now()}`,
      type: 'TEXT',
      replyToId: null,
      editedAt: null,
      deletedAt: null,
    };
  }

  protected async persist(
    data: MessageUncheckedCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Message> {
    return tx.message.create({
      data: data as unknown as Prisma.MessageCreateInput,
    });
  }

  async create(override: MessageOverride = {}, options: FactoryOptions = {}): Promise<Message> {
    // Auto-create conversation if conversationId not provided
    let conversationId = override.conversationId;
    if (!conversationId && !options.skipRelations) {
      if (options.tx) {
        const conversation = await this.conversationFactory.create(override.conversation || {}, {
          tx: options.tx,
        });
        conversationId = conversation.id;
      } else {
        const conversation = await this.conversationFactory.create(override.conversation || {});
        conversationId = conversation.id;
      }
    }

    if (!conversationId) {
      throw new Error('conversationId is required when skipRelations is true');
    }

    // Auto-create sender if senderId not provided
    let senderId = override.senderId;
    if (!senderId && !options.skipRelations) {
      if (options.tx) {
        const user = await this.userFactory.create(override.sender || {}, {
          tx: options.tx,
        });
        senderId = user.id;
      } else {
        const user = await this.userFactory.create(override.sender || {});
        senderId = user.id;
      }
    }

    if (!senderId) {
      throw new Error('senderId is required when skipRelations is true');
    }

    const data = await this.build({
      ...override,
      conversationId,
      senderId,
    });

    if (options.tx) {
      return this.persist(data, options.tx);
    }

    return this.prisma.$transaction(async tx => {
      return this.persist(data, tx);
    });
  }

  /**
   * Create a text message
   */
  async createText(
    content: string,
    override: Omit<MessageOverride, 'content' | 'type'> = {},
    options: FactoryOptions = {}
  ): Promise<Message> {
    return this.create({ ...override, content, type: 'TEXT' }, options);
  }

  /**
   * Create a reply message
   */
  async createReply(
    replyToId: string,
    content: string,
    override: Omit<MessageOverride, 'content' | 'replyToId'> = {},
    options: FactoryOptions = {}
  ): Promise<Message> {
    return this.create({ ...override, content, replyToId }, options);
  }

  /**
   * Create an edited message
   */
  async createEdited(
    content: string,
    override: Omit<MessageOverride, 'content' | 'editedAt'> = {},
    options: FactoryOptions = {}
  ): Promise<Message> {
    return this.create({ ...override, content, editedAt: new Date() }, options);
  }

  /**
   * Create a deleted (soft-deleted) message
   */
  async createDeleted(
    override: MessageOverride = {},
    options: FactoryOptions = {}
  ): Promise<Message> {
    return this.create(
      {
        ...override,
        deletedAt: new Date(),
      },
      options
    );
  }

  /**
   * Create multiple messages in a conversation
   */
  async createManyInConversation(
    conversationId: string,
    senderId: string,
    count: number,
    baseContent = 'Message'
  ): Promise<Message[]> {
    const messages: Message[] = [];

    for (let i = 0; i < count; i++) {
      const message = await this.create({
        conversationId,
        senderId,
        content: `${baseContent} ${i + 1}`,
      });
      messages.push(message);
    }

    return messages;
  }
}
