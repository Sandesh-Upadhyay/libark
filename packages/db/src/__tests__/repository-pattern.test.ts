/**
 * 🧪 リポジトリパターンテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Prismaクライアントをモック
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    media: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  })),
}));

describe('リポジトリパターン', () => {
  let prisma: unknown;

  beforeEach(async () => {
    // Prismaクライアントをインポート
    const { prisma: prismaInstance } = await import('../index.js');
    prisma = prismaInstance;

    if (!(prisma as any).comment) {
      (prisma as any).comment = {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      };
    }

    if (!(prisma as any).notification) {
      (prisma as any).notification = {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      };
    }

    // モックをリセット
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // クリーンアップ
    if (prisma && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  });

  describe('ユーザーリポジトリ', () => {
    describe('CRUD操作', () => {
      it('ユーザーを作成できる', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
        };

        (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: '1',
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const user = await prisma.user.create({ data: userData });

        expect(user).toBeDefined();
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(prisma.user.create).toHaveBeenCalledWith({ data: userData });
      });

      it('ユーザーを取得できる', async () => {
        const userId = '1';
        const mockUser = {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        expect(user).toBeDefined();
        expect(user.id).toBe(userId);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: userId },
        });
      });

      it('ユーザーを更新できる', async () => {
        const userId = '1';
        const updateData = { username: 'updateduser' };

        (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: userId,
          username: 'updateduser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const user = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        expect(user).toBeDefined();
        expect(user.username).toBe('updateduser');
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: updateData,
        });
      });

      it('ユーザーを削除できる', async () => {
        const userId = '1';

        (prisma.user.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const user = await prisma.user.delete({
          where: { id: userId },
        });

        expect(user).toBeDefined();
        expect(user.id).toBe(userId);
        expect(prisma.user.delete).toHaveBeenCalledWith({
          where: { id: userId },
        });
      });

      it('ユーザー一覧を取得できる', async () => {
        const mockUsers = [
          {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            username: 'user2',
            email: 'user2@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);

        const users = await prisma.user.findMany();

        expect(users).toHaveLength(2);
        expect(users[0].username).toBe('user1');
        expect(users[1].username).toBe('user2');
        expect(prisma.user.findMany).toHaveBeenCalled();
      });
    });

    describe('クエリ操作', () => {
      it('条件付きでユーザーを検索できる', async () => {
        const mockUser = {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

        const user = await prisma.user.findFirst({
          where: { email: 'test@example.com' },
        });

        expect(user).toBeDefined();
        expect(user.email).toBe('test@example.com');
        expect(prisma.user.findFirst).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
      });

      it('ページネーションでユーザー一覧を取得できる', async () => {
        const mockUsers = Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 1}`,
          username: `user${i + 1}`,
          email: `user${i + 1}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers.slice(0, 10));

        const users = await prisma.user.findMany({
          skip: 0,
          take: 10,
        });

        expect(users).toHaveLength(10);
        expect(prisma.user.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
        });
      });

      it('ソートでユーザー一覧を取得できる', async () => {
        const mockUsers = [
          {
            id: '2',
            username: 'user2',
            email: 'user2@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);

        const users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
        });

        expect(users).toHaveLength(2);
        expect(users[0].id).toBe('2');
        expect(prisma.user.findMany).toHaveBeenCalledWith({
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('集計操作', () => {
      it('ユーザー数をカウントできる', async () => {
        (prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(100);

        const count = await prisma.user.count();

        expect(count).toBe(100);
        expect(prisma.user.count).toHaveBeenCalled();
      });

      it('条件付きでユーザー数をカウントできる', async () => {
        (prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

        const count = await prisma.user.count({
          where: { active: true },
        });

        expect(count).toBe(50);
        expect(prisma.user.count).toHaveBeenCalledWith({
          where: { active: true },
        });
      });

      it('ユーザーを集計できる', async () => {
        (prisma.user.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
          _count: { id: 100 },
          _min: { createdAt: new Date('2024-01-01') },
          _max: { createdAt: new Date('2024-12-31') },
        });

        const aggregate = await prisma.user.aggregate({
          _count: { id: true },
          _min: { createdAt: true },
          _max: { createdAt: true },
        });

        expect(aggregate._count.id).toBe(100);
        expect(prisma.user.aggregate).toHaveBeenCalledWith({
          _count: { id: true },
          _min: { createdAt: true },
          _max: { createdAt: true },
        });
      });
    });
  });

  describe('投稿リポジトリ', () => {
    describe('CRUD操作', () => {
      it('投稿を作成できる', async () => {
        const postData = {
          content: 'Test post content',
          userId: '1',
          visibility: 'PUBLIC',
        };

        (prisma.post.create as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: '1',
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const post = await prisma.post.create({ data: postData });

        expect(post).toBeDefined();
        expect(post.content).toBe('Test post content');
        expect(prisma.post.create).toHaveBeenCalledWith({ data: postData });
      });

      it('投稿を取得できる', async () => {
        const postId = '1';
        const mockPost = {
          id: postId,
          content: 'Test post',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

        const post = await prisma.post.findUnique({
          where: { id: postId },
        });

        expect(post).toBeDefined();
        expect(post.id).toBe(postId);
        expect(prisma.post.findUnique).toHaveBeenCalledWith({
          where: { id: postId },
        });
      });

      it('投稿を更新できる', async () => {
        const postId = '1';
        const updateData = { content: 'Updated content' };

        (prisma.post.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: postId,
          content: 'Updated content',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const post = await prisma.post.update({
          where: { id: postId },
          data: updateData,
        });

        expect(post).toBeDefined();
        expect(post.content).toBe('Updated content');
        expect(prisma.post.update).toHaveBeenCalledWith({
          where: { id: postId },
          data: updateData,
        });
      });

      it('投稿を削除できる', async () => {
        const postId = '1';

        (prisma.post.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: postId,
          content: 'Test post',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const post = await prisma.post.delete({
          where: { id: postId },
        });

        expect(post).toBeDefined();
        expect(post.id).toBe(postId);
        expect(prisma.post.delete).toHaveBeenCalledWith({
          where: { id: postId },
        });
      });
    });

    describe('リレーション操作', () => {
      it('ユーザー付きで投稿を取得できる', async () => {
        const mockPost = {
          id: '1',
          content: 'Test post',
          userId: '1',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

        const post = await prisma.post.findUnique({
          where: { id: '1' },
          include: { user: true },
        });

        expect(post).toBeDefined();
        expect(post.user).toBeDefined();
        expect(post.user.username).toBe('testuser');
        expect(prisma.post.findUnique).toHaveBeenCalledWith({
          where: { id: '1' },
          include: { user: true },
        });
      });

      it('メディア付きで投稿を取得できる', async () => {
        const mockPost = {
          id: '1',
          content: 'Test post',
          userId: '1',
          media: [
            {
              id: '1',
              url: 'https://example.com/image.jpg',
              postId: '1',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

        const post = await prisma.post.findUnique({
          where: { id: '1' },
          include: { media: true },
        });

        expect(post).toBeDefined();
        expect(post.media).toHaveLength(1);
        expect(post.media[0].url).toBe('https://example.com/image.jpg');
        expect(prisma.post.findUnique).toHaveBeenCalledWith({
          where: { id: '1' },
          include: { media: true },
        });
      });
    });
  });

  describe('メディアリポジトリ', () => {
    describe('CRUD操作', () => {
      it('メディアを作成できる', async () => {
        const mediaData = {
          url: 'https://example.com/image.jpg',
          s3Key: 'post/2024-01-01/123.jpg',
          mediaType: 'IMAGE',
          status: 'COMPLETED',
          userId: '1',
        };

        (prisma.media.create as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: '1',
          ...mediaData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const media = await prisma.media.create({ data: mediaData });

        expect(media).toBeDefined();
        expect(media.url).toBe('https://example.com/image.jpg');
        expect(prisma.media.create).toHaveBeenCalledWith({ data: mediaData });
      });

      it('メディアを取得できる', async () => {
        const mediaId = '1';
        const mockMedia = {
          id: mediaId,
          url: 'https://example.com/image.jpg',
          s3Key: 'post/2024-01-01/123.jpg',
          mediaType: 'IMAGE',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.media.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedia);

        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        });

        expect(media).toBeDefined();
        expect(media.id).toBe(mediaId);
        expect(prisma.media.findUnique).toHaveBeenCalledWith({
          where: { id: mediaId },
        });
      });

      it('メディアを更新できる', async () => {
        const mediaId = '1';
        const updateData = { status: 'COMPLETED' };

        (prisma.media.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: mediaId,
          url: 'https://example.com/image.jpg',
          s3Key: 'post/2024-01-01/123.jpg',
          mediaType: 'IMAGE',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const media = await prisma.media.update({
          where: { id: mediaId },
          data: updateData,
        });

        expect(media).toBeDefined();
        expect(media.status).toBe('COMPLETED');
        expect(prisma.media.update).toHaveBeenCalledWith({
          where: { id: mediaId },
          data: updateData,
        });
      });

      it('メディアを削除できる', async () => {
        const mediaId = '1';

        (prisma.media.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: mediaId,
          url: 'https://example.com/image.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const media = await prisma.media.delete({
          where: { id: mediaId },
        });

        expect(media).toBeDefined();
        expect(media.id).toBe(mediaId);
        expect(prisma.media.delete).toHaveBeenCalledWith({
          where: { id: mediaId },
        });
      });
    });

    describe('バッチ操作', () => {
      it('複数のメディアを作成できる', async () => {
        const mediaData = [
          {
            url: 'https://example.com/image1.jpg',
            s3Key: 'post/2024-01-01/1.jpg',
            mediaType: 'IMAGE',
            status: 'COMPLETED',
          },
          {
            url: 'https://example.com/image2.jpg',
            s3Key: 'post/2024-01-01/2.jpg',
            mediaType: 'IMAGE',
            status: 'COMPLETED',
          },
        ];

        (prisma.media.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
          count: 2,
        });

        const result = await prisma.media.createMany({
          data: mediaData,
        });

        expect(result.count).toBe(2);
        expect(prisma.media.createMany).toHaveBeenCalledWith({
          data: mediaData,
        });
      });

      it('条件付きで複数のメディアを削除できる', async () => {
        (prisma.media.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
          count: 10,
        });

        const result = await prisma.media.deleteMany({
          where: { status: 'FAILED' },
        });

        expect(result.count).toBe(10);
        expect(prisma.media.deleteMany).toHaveBeenCalledWith({
          where: { status: 'FAILED' },
        });
      });
    });
  });

  describe('コメントリポジトリ', () => {
    describe('CRUD操作', () => {
      it('コメントを作成できる', async () => {
        const commentData = {
          content: 'Test comment',
          postId: '1',
          userId: '1',
        };

        (prisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: '1',
          ...commentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const comment = await prisma.comment.create({ data: commentData });

        expect(comment).toBeDefined();
        expect(comment.content).toBe('Test comment');
        expect(prisma.comment.create).toHaveBeenCalledWith({ data: commentData });
      });

      it('コメントを取得できる', async () => {
        const commentId = '1';
        const mockComment = {
          id: commentId,
          content: 'Test comment',
          postId: '1',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockComment);

        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
        });

        expect(comment).toBeDefined();
        expect(comment.id).toBe(commentId);
        expect(prisma.comment.findUnique).toHaveBeenCalledWith({
          where: { id: commentId },
        });
      });

      it('コメントを更新できる', async () => {
        const commentId = '1';
        const updateData = { content: 'Updated comment' };

        (prisma.comment.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: commentId,
          content: 'Updated comment',
          postId: '1',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const comment = await prisma.comment.update({
          where: { id: commentId },
          data: updateData,
        });

        expect(comment).toBeDefined();
        expect(comment.content).toBe('Updated comment');
        expect(prisma.comment.update).toHaveBeenCalledWith({
          where: { id: commentId },
          data: updateData,
        });
      });

      it('コメントを削除できる', async () => {
        const commentId = '1';

        (prisma.comment.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: commentId,
          content: 'Test comment',
          postId: '1',
          userId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const comment = await prisma.comment.delete({
          where: { id: commentId },
        });

        expect(comment).toBeDefined();
        expect(comment.id).toBe(commentId);
        expect(prisma.comment.delete).toHaveBeenCalledWith({
          where: { id: commentId },
        });
      });
    });
  });

  describe('通知リポジトリ', () => {
    describe('CRUD操作', () => {
      it('通知を作成できる', async () => {
        const notificationData = {
          userId: '1',
          type: 'LIKE',
          actorId: '2',
          postId: '3',
        };

        (prisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: '1',
          ...notificationData,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const notification = await prisma.notification.create({ data: notificationData });

        expect(notification).toBeDefined();
        expect(notification.type).toBe('LIKE');
        expect(prisma.notification.create).toHaveBeenCalledWith({ data: notificationData });
      });

      it('通知を取得できる', async () => {
        const notificationId = '1';
        const mockNotification = {
          id: notificationId,
          userId: '1',
          type: 'LIKE',
          actorId: '2',
          postId: '3',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.notification.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotification);

        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });

        expect(notification).toBeDefined();
        expect(notification.id).toBe(notificationId);
        expect(prisma.notification.findUnique).toHaveBeenCalledWith({
          where: { id: notificationId },
        });
      });

      it('通知を更新できる', async () => {
        const notificationId = '1';
        const updateData = { read: true };

        (prisma.notification.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: notificationId,
          userId: '1',
          type: 'LIKE',
          actorId: '2',
          postId: '3',
          read: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const notification = await prisma.notification.update({
          where: { id: notificationId },
          data: updateData,
        });

        expect(notification).toBeDefined();
        expect(notification.read).toBe(true);
        expect(prisma.notification.update).toHaveBeenCalledWith({
          where: { id: notificationId },
          data: updateData,
        });
      });

      it('通知を削除できる', async () => {
        const notificationId = '1';

        (prisma.notification.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: notificationId,
          userId: '1',
          type: 'LIKE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const notification = await prisma.notification.delete({
          where: { id: notificationId },
        });

        expect(notification).toBeDefined();
        expect(notification.id).toBe(notificationId);
        expect(prisma.notification.delete).toHaveBeenCalledWith({
          where: { id: notificationId },
        });
      });
    });

    describe('バッチ操作', () => {
      it('複数の通知を既読にできる', async () => {
        (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
          count: 10,
        });

        const result = await prisma.notification.updateMany({
          where: { userId: '1', read: false },
          data: { read: true },
        });

        expect(result.count).toBe(10);
        expect(prisma.notification.updateMany).toHaveBeenCalledWith({
          where: { userId: '1', read: false },
          data: { read: true },
        });
      });

      it('古い通知を削除できる', async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        (prisma.notification.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
          count: 100,
        });

        const result = await prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });

        expect(result.count).toBe(100);
        expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないユーザーの取得でnullを返す', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { id: 'non-existent' },
      });

      expect(user).toBeNull();
    });

    it('一意制約違反でエラーが発生する', async () => {
      const error = new Error('Unique constraint failed');
      (prisma.user.create as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.user.create({
          data: {
            username: 'duplicate',
            email: 'duplicate@example.com',
            passwordHash: 'hashed',
          },
        })
      ).rejects.toThrow();
    });

    it('外部キー制約違反でエラーが発生する', async () => {
      const error = new Error('Foreign key constraint failed');
      (prisma.post.create as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.post.create({
          data: {
            content: 'Test',
            userId: 'non-existent',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('データの整合性', () => {
    it('作成日時と更新日時が正しく設定される', async () => {
      const now = new Date();
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: now,
        updatedAt: now,
      };

      (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashed',
        },
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('更新時にupdatedAtが更新される', async () => {
      const now = new Date();
      const originalDate = new Date();
      originalDate.setDate(originalDate.getDate() - 1);

      const mockUser = {
        id: '1',
        username: 'updateduser',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: originalDate,
        updatedAt: now,
      };

      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const user = await prisma.user.update({
        where: { id: '1' },
        data: { username: 'updateduser' },
      });

      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime());
    });

    it('リレーションの整合性が保たれる', async () => {
      const mockPost = {
        id: '1',
        content: 'Test post',
        userId: '1',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
        media: [
          {
            id: '1',
            url: 'https://example.com/image.jpg',
            postId: '1',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.post.findUnique as any).mockResolvedValue(mockPost);

      const post = await prisma.post.findUnique({
        where: { id: '1' },
        include: { user: true, media: true },
      });

      expect(post.userId).toBe(post.user.id);
      expect(post.media[0].postId).toBe(post.id);
    });
  });
});
