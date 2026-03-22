/**
 * 💬 Conversation Factory
 *
 * Factory for creating test conversations (1-on-1 and group).
 * Auto-creates users if not provided.
 */

import type {
  PrismaClient,
  Prisma,
  Conversation,
  ConversationType,
  ConversationParticipant,
} from '@libark/db';
import { BaseFactory, FactoryOptions } from './BaseFactory';
import { UserFactory, type UserOverride } from './UserFactory';

export interface ConversationOverride {
  createdBy?: string;
  type?: ConversationType;
  title?: string | null;
  isArchived?: boolean;
  participants?: string[];
  creator?: UserOverride;
}

type ConversationUncheckedCreateInput = Prisma.ConversationUncheckedCreateInput;

export class ConversationFactory extends BaseFactory<
  Conversation,
  ConversationUncheckedCreateInput,
  ConversationOverride,
  'createdBy'
> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly userFactory: UserFactory
  ) {
    super(prisma);
  }

  protected async generateDefaults(): Promise<
    Omit<ConversationUncheckedCreateInput, 'id' | 'createdBy'>
  > {
    return {
      type: 'DIRECT',
      title: null,
      isArchived: false,
    };
  }

  protected async persist(
    data: ConversationUncheckedCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Conversation> {
    return tx.conversation.create({
      data: data as unknown as Prisma.ConversationCreateInput,
    });
  }

  async create(
    override: ConversationOverride = {},
    options: FactoryOptions = {}
  ): Promise<Conversation & { participants: ConversationParticipant[] }> {
    // Auto-create creator if createdBy not provided
    let creatorId = override.createdBy;
    if (!creatorId && !options.skipRelations) {
      if (options.tx) {
        const user = await this.userFactory.create(override.creator || {}, { tx: options.tx });
        creatorId = user.id;
      } else {
        const user = await this.userFactory.create(override.creator || {});
        creatorId = user.id;
      }
    }

    if (!creatorId) {
      throw new Error('createdBy is required when skipRelations is true');
    }

    // Create participant list
    let participantIds = override.participants;
    if (!participantIds && !options.skipRelations) {
      // For direct messages, create another user as participant
      if (override.type === 'DIRECT' || !override.type) {
        const otherUser = await this.userFactory.create();
        participantIds = [creatorId, otherUser.id];
      } else {
        // For group, just include creator
        participantIds = [creatorId];
      }
    }

    const data = await this.build({
      ...override,
      createdBy: creatorId,
    });

    if (options.tx) {
      const conversation = await this.persist(data, options.tx);

      // Create participants
      const participants: ConversationParticipant[] = [];
      if (participantIds) {
        for (const userId of participantIds) {
          const participant = await options.tx.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId,
            },
          });
          participants.push(participant);
        }
      }

      return { ...conversation, participants };
    }

    return this.prisma.$transaction(async tx => {
      const conversation = await this.persist(data, tx);

      // Create participants
      const participants: ConversationParticipant[] = [];
      if (participantIds) {
        for (const userId of participantIds) {
          const participant = await tx.conversationParticipant.create({
            data: {
              conversationId: conversation.id,
              userId,
            },
          });
          participants.push(participant);
        }
      }

      return { ...conversation, participants };
    });
  }

  /**
   * Create a 1-on-1 direct conversation
   */
  async createDirect(
    override: Omit<ConversationOverride, 'type'> = {},
    options: FactoryOptions = {}
  ): Promise<Conversation & { participants: ConversationParticipant[] }> {
    return this.create({ ...override, type: 'DIRECT' }, options);
  }

  /**
   * Create a group conversation
   */
  async createGroup(
    title: string,
    participantIds: string[],
    override: Omit<ConversationOverride, 'type' | 'title' | 'participants'> = {},
    options: FactoryOptions = {}
  ): Promise<Conversation & { participants: ConversationParticipant[] }> {
    return this.create(
      {
        ...override,
        type: 'GROUP',
        title,
        participants: participantIds,
      },
      options
    );
  }

  /**
   * Create an archived conversation
   */
  async createArchived(
    override: ConversationOverride = {},
    options: FactoryOptions = {}
  ): Promise<Conversation & { participants: ConversationParticipant[] }> {
    return this.create({ ...override, isArchived: true }, options);
  }

  /**
   * Add a participant to an existing conversation
   */
  async addParticipant(
    conversationId: string,
    userId: string,
    options: FactoryOptions = {}
  ): Promise<ConversationParticipant> {
    if (options.tx) {
      return options.tx.conversationParticipant.create({
        data: {
          conversationId,
          userId,
        },
      });
    }

    return this.prisma.$transaction(async tx => {
      return tx.conversationParticipant.create({
        data: {
          conversationId,
          userId,
        },
      });
    });
  }
}
