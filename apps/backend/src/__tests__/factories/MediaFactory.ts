/**
 * 🖼️ Media Factory
 *
 * Factory for creating test media with variants support.
 * Auto-creates user and optionally post if not provided.
 */

import type { PrismaClient, Prisma, Media, MediaType, MediaStatus, VariantType } from '@libark/db';
import { BaseFactory, FactoryOptions } from './BaseFactory';
import { UserFactory, type UserOverride } from './UserFactory';
import { PostFactory, type PostOverride } from './PostFactory';

export interface MediaOverride {
  userId?: string;
  postId?: string | null;
  filename?: string;
  s3Key?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
  type?: MediaType;
  status?: MediaStatus;
  user?: UserOverride;
  post?: PostOverride;
}

export interface MediaVariantOverride {
  type?: VariantType;
  s3Key?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  quality?: number;
}

type MediaUncheckedCreateInput = Prisma.MediaUncheckedCreateInput;

export class MediaFactory extends BaseFactory<
  Media,
  MediaUncheckedCreateInput,
  MediaOverride,
  'userId'
> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly userFactory: UserFactory,
    private readonly postFactory?: PostFactory
  ) {
    super(prisma);
  }

  protected async generateDefaults(): Promise<Omit<MediaUncheckedCreateInput, 'id' | 'userId'>> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    return {
      filename: `test_image_${random}.jpg`,
      s3Key: `media/test/${timestamp}_${random}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 1024000,
      width: 1920,
      height: 1080,
      type: 'POST',
      status: 'READY',
      postId: null,
    };
  }

  protected async persist(
    data: MediaUncheckedCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Media> {
    return tx.media.create({
      data: data as unknown as Prisma.MediaCreateInput,
    });
  }

  async create(override: MediaOverride = {}, options: FactoryOptions = {}): Promise<Media> {
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

    // Auto-create post if postId not provided and post override provided
    let postId = override.postId;
    if (postId === undefined && override.post && !options.skipRelations && this.postFactory) {
      if (options.tx) {
        const post = await this.postFactory.create(override.post, { tx: options.tx });
        postId = post.id;
      } else {
        const post = await this.postFactory.create(override.post);
        postId = post.id;
      }
    }

    const data = await this.build({
      ...override,
      userId,
      postId: postId ?? null,
    });

    if (options.tx) {
      return this.persist(data, options.tx);
    }

    return this.prisma.$transaction(async tx => {
      return this.persist(data, tx);
    });
  }

  /**
   * Create a media variant for this media
   */
  async createVariant(
    mediaId: string,
    variantOverride: MediaVariantOverride = {},
    options: FactoryOptions = {}
  ): Promise<{
    id: string;
    mediaId: string;
    type: VariantType;
    s3Key: string;
    width: number;
    height: number;
    fileSize: number;
    quality: number;
    createdAt: Date;
  }> {
    const timestamp = Date.now();

    const defaults = {
      type: 'THUMB' as VariantType,
      s3Key: `media/variants/${mediaId}_thumb_${timestamp}.webp`,
      width: 300,
      height: 300,
      fileSize: 50000,
      quality: 80,
    };

    const variantData = { ...defaults, ...variantOverride, mediaId };

    if (options.tx) {
      return options.tx.mediaVariant.create({
        data: variantData as unknown as Prisma.MediaVariantCreateInput,
      });
    }

    return this.prisma.$transaction(async tx => {
      return tx.mediaVariant.create({
        data: variantData as unknown as Prisma.MediaVariantCreateInput,
      });
    });
  }

  /**
   * Create media with all standard variants
   */
  async createWithVariants(
    override: MediaOverride = {},
    options: FactoryOptions = {}
  ): Promise<{ media: Media; variants: Awaited<ReturnType<MediaFactory['createVariant']>>[] }> {
    const media = await this.create(override, options);

    const variantTypes: Array<'THUMB' | 'MEDIUM' | 'LARGE'> = ['THUMB', 'MEDIUM', 'LARGE'];
    const variantDimensions: Record<
      'THUMB' | 'MEDIUM' | 'LARGE',
      { width: number; height: number }
    > = {
      THUMB: { width: 300, height: 300 },
      MEDIUM: { width: 800, height: 800 },
      LARGE: { width: 1200, height: 1200 },
    };

    const variants = await Promise.all(
      variantTypes.map(type =>
        this.createVariant(
          media.id,
          {
            type,
            s3Key: `media/variants/${media.id}_${type.toLowerCase()}_${Date.now()}.webp`,
            ...variantDimensions[type],
          },
          options
        )
      )
    );

    return { media, variants };
  }

  /**
   * Create avatar media
   */
  async createAvatar(
    override: Omit<MediaOverride, 'type'> = {},
    options: FactoryOptions = {}
  ): Promise<Media> {
    return this.create({ ...override, type: 'AVATAR' }, options);
  }

  /**
   * Create cover media
   */
  async createCover(
    override: Omit<MediaOverride, 'type'> = {},
    options: FactoryOptions = {}
  ): Promise<Media> {
    return this.create({ ...override, type: 'COVER' }, options);
  }

  /**
   * Create OGP media
   */
  async createOgp(
    override: Omit<MediaOverride, 'type'> = {},
    options: FactoryOptions = {}
  ): Promise<Media> {
    return this.create({ ...override, type: 'OGP' }, options);
  }
}
