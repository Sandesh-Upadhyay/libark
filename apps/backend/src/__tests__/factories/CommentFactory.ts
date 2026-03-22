/**
 * 💬 Comment Factory
 *
 * Factory for creating test comments.
 * Auto-creates user and post if not provided.
 */

import type { PrismaClient, Prisma, Comment } from '@libark/db';
import { BaseFactory, FactoryOptions } from './BaseFactory';
import { UserFactory, type UserOverride } from './UserFactory';
import { PostFactory, type PostOverride } from './PostFactory';

export interface CommentOverride {
  userId?: string;
  postId?: string;
  content?: string;
  isDeleted?: boolean;
  isProcessing?: boolean;
  deletedAt?: Date | null;
  user?: UserOverride;
  post?: PostOverride;
}

type CommentUncheckedCreateInput = Prisma.CommentUncheckedCreateInput;

export class CommentFactory extends BaseFactory<
  Comment,
  CommentUncheckedCreateInput,
  CommentOverride,
  'userId' | 'postId'
> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly userFactory: UserFactory,
    private readonly postFactory: PostFactory
  ) {
    super(prisma);
  }

  protected async generateDefaults(): Promise<
    Omit<CommentUncheckedCreateInput, 'id' | 'userId' | 'postId'>
  > {
    return {
      content: `Test comment ${Date.now()}`,
      isDeleted: false,
      isProcessing: false,
      deletedAt: null,
    };
  }

  protected async persist(
    data: CommentUncheckedCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Comment> {
    return tx.comment.create({
      data: data as unknown as Prisma.CommentCreateInput,
    });
  }

  async create(override: CommentOverride = {}, options: FactoryOptions = {}): Promise<Comment> {
    // Auto-create user if userId not provided
    let userId = override.userId;
    if (!userId && !options.skipRelations) {
      if (options.tx) {
        const user = await this.userFactory.create(override.user || {}, { tx: options.tx });
        userId = user.id;
      } else {
        const user = await this.userFactory.create(override.user || {});
        userId = user.id;
      }
    }

    if (!userId) {
      throw new Error('userId is required when skipRelations is true');
    }

    // Auto-create post if postId not provided
    let postId = override.postId;
    if (!postId && !options.skipRelations) {
      if (options.tx) {
        const post = await this.postFactory.create(override.post || {}, { tx: options.tx });
        postId = post.id;
      } else {
        const post = await this.postFactory.create(override.post || {});
        postId = post.id;
      }
    }

    if (!postId) {
      throw new Error('postId is required when skipRelations is true');
    }

    const data = await this.build({
      ...override,
      userId,
      postId,
    });

    if (options.tx) {
      return this.persist(data, options.tx);
    }

    return this.prisma.$transaction(async tx => {
      return this.persist(data, tx);
    });
  }

  /**
   * Create a deleted comment
   */
  async createDeleted(
    override: CommentOverride = {},
    options: FactoryOptions = {}
  ): Promise<Comment> {
    return this.create(
      {
        ...override,
        isDeleted: true,
        deletedAt: new Date(),
      },
      options
    );
  }
}
