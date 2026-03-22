/**
 * 📝 Post Factory
 *
 * Factory for creating test posts with visibility support.
 * Auto-creates user if not provided.
 */

import type { PrismaClient, Prisma, Post, PostVisibility } from '@libark/db';
import { BaseFactory, FactoryOptions } from './BaseFactory';
import { UserFactory, type UserOverride } from './UserFactory';

export interface PostOverride {
  userId?: string;
  content?: string | null;
  visibility?: PostVisibility;
  isProcessing?: boolean;
  isDeleted?: boolean;
  price?: number | null;
  paidAt?: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  user?: UserOverride;
}

type PostUncheckedCreateInput = Prisma.PostUncheckedCreateInput;

export class PostFactory extends BaseFactory<
  Post,
  PostUncheckedCreateInput,
  PostOverride,
  'userId'
> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly userFactory: UserFactory
  ) {
    super(prisma);
  }

  protected async generateDefaults(): Promise<Omit<PostUncheckedCreateInput, 'id' | 'userId'>> {
    return {
      content: `Test post content ${Date.now()}`,
      visibility: 'PUBLIC',
      isProcessing: false,
      isDeleted: false,
      price: null,
      paidAt: null,
      deletedAt: null,
    };
  }

  protected async persist(
    data: PostUncheckedCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Post> {
    return tx.post.create({
      data: data as unknown as Prisma.PostCreateInput,
    });
  }

  async create(override: PostOverride = {}, options: FactoryOptions = {}): Promise<Post> {
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

    const data = await this.build({
      ...override,
      userId,
    });

    if (options.tx) {
      return this.persist(data, options.tx);
    }

    return this.prisma.$transaction(async tx => {
      return this.persist(data, tx);
    });
  }

  /**
   * Create a public post
   */
  async createPublic(
    override: Omit<PostOverride, 'visibility'> = {},
    options: FactoryOptions = {}
  ): Promise<Post> {
    return this.create({ ...override, visibility: 'PUBLIC' }, options);
  }

  /**
   * Create a private post
   */
  async createPrivate(
    override: Omit<PostOverride, 'visibility'> = {},
    options: FactoryOptions = {}
  ): Promise<Post> {
    return this.create({ ...override, visibility: 'PRIVATE' }, options);
  }

  /**
   * Create a paid post with price
   */
  async createPaid(
    price: number,
    override: Omit<PostOverride, 'visibility' | 'price' | 'paidAt'> = {},
    options: FactoryOptions = {}
  ): Promise<Post> {
    return this.create(
      {
        ...override,
        visibility: 'PAID',
        price,
        paidAt: new Date(),
      },
      options
    );
  }

  /**
   * Create a followers-only post
   */
  async createFollowersOnly(
    override: Omit<PostOverride, 'visibility'> = {},
    options: FactoryOptions = {}
  ): Promise<Post> {
    return this.create({ ...override, visibility: 'FOLLOWERS_ONLY' }, options);
  }

  /**
   * Create a deleted post
   */
  async createDeleted(override: PostOverride = {}, options: FactoryOptions = {}): Promise<Post> {
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
