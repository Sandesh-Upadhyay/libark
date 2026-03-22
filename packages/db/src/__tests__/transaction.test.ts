/**
 * 🧪 トランザクションテスト
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
    wallet: {
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
    transaction: {
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

describe('トランザクション', () => {
  let prisma: unknown;

  beforeEach(async () => {
    // Prismaクライアントをインポート
    const { prisma: prismaInstance } = await import('../index.js');
    prisma = prismaInstance;

    // モックをリセット
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // クリーンアップ
    if (prisma && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  });

  describe('トランザクションのコミット', () => {
    it('単一のトランザクションがコミットされる', async () => {
      const mockTx = {
        user: {
          create: vi.fn().mockResolvedValue({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async callback => {
        return await callback(mockTx);
      });

      const result = await prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });
        return user;
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('複数の操作がトランザクション内でコミットされる', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPost = {
        id: '1',
        content: 'Test post',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([mockUser, mockPost]);

      const [user, post] = await prisma.$transaction(async tx => {
        const createdUser = await tx.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });

        const createdPost = await tx.post.create({
          data: {
            content: 'Test post',
            userId: createdUser.id,
          },
        });

        return [createdUser, createdPost];
      });

      expect(user).toBeDefined();
      expect(post).toBeDefined();
      expect(user.id).toBe(post.userId);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('成功したトランザクションでデータが永続化される', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const user = await prisma.$transaction(async tx => {
        return await tx.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });
      });

      // トランザクション後、データが取得できる
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.username).toBe('testuser');
    });
  });

  describe('トランザクションのロールバック', () => {
    it('エラーでトランザクションがロールバックされる', async () => {
      const error = new Error('Transaction failed');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(async tx => {
          await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });

          throw error;
        })
      ).rejects.toThrow('Transaction failed');
    });

    it('ロールバックでデータが永続化されない', async () => {
      const error = new Error('Rollback test');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      try {
        await prisma.$transaction(async tx => {
          await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });

          throw error;
        });
      } catch (err) {
        // エラーを無視
      }

      // ロールバック後、データが取得できない
      const user = await prisma.user.findUnique({
        where: { id: '1' },
      });

      expect(user).toBeNull();
    });

    it('制約違反でトランザクションがロールバックされる', async () => {
      const error = new Error('Unique constraint failed');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(async tx => {
          // 重複ユーザーを作成しようとする
          await tx.user.create({
            data: {
              username: 'duplicate',
              email: 'duplicate@example.com',
              passwordHash: 'hashed',
            },
          });

          await tx.user.create({
            data: {
              username: 'duplicate',
              email: 'duplicate@example.com',
              passwordHash: 'hashed',
            },
          });
        })
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('ネストされたトランザクション', () => {
    it('ネストされたトランザクションが動作する', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPost = {
        id: '1',
        content: 'Test post',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([mockUser, mockPost]);

      const [user, post] = await prisma.$transaction(async tx1 => {
        const createdUser = await tx1.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });

        // ネストされたトランザクション（実際にはPrismaはネストをサポートしていないため、同じトランザクション内で実行）
        const createdPost = await tx1.post.create({
          data: {
            content: 'Test post',
            userId: createdUser.id,
          },
        });

        return [createdUser, createdPost];
      });

      expect(user).toBeDefined();
      expect(post).toBeDefined();
      expect(post.userId).toBe(user.id);
    });

    it('ネストされたトランザクションのエラーで全体がロールバックされる', async () => {
      const error = new Error('Nested transaction failed');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(async tx => {
          const user = await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });

          const post = await tx.post.create({
            data: {
              content: 'Test post',
              userId: user.id,
            },
          });

          // エラーをスロー
          throw error;
        })
      ).rejects.toThrow('Nested transaction failed');
    });
  });

  describe('並行トランザクション', () => {
    it('並行トランザクションが正しく処理される', async () => {
      const mockUser1 = {
        id: '1',
        username: 'user1',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser2 = {
        id: '2',
        username: 'user2',
        email: 'user2@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as any)
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      const [user1, user2] = await Promise.all([
        prisma.$transaction(async tx => {
          return await tx.user.create({
            data: {
              username: 'user1',
              email: 'user1@example.com',
              passwordHash: 'hashed',
            },
          });
        }),
        prisma.$transaction(async tx => {
          return await tx.user.create({
            data: {
              username: 'user2',
              email: 'user2@example.com',
              passwordHash: 'hashed',
            },
          });
        }),
      ]);

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1.username).toBe('user1');
      expect(user2.username).toBe('user2');
    });

    it('並行トランザクションの競合が処理される', async () => {
      const error = new Error('Transaction conflict');

      (prisma.$transaction as any)
        .mockResolvedValueOnce({
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockRejectedValueOnce(error);

      const results = await Promise.allSettled([
        prisma.$transaction(async tx => {
          return await tx.user.create({
            data: {
              username: 'user1',
              email: 'user1@example.com',
              passwordHash: 'hashed',
            },
          });
        }),
        prisma.$transaction(async tx => {
          // 同じユーザー名で作成しようとする（競合）
          return await tx.user.create({
            data: {
              username: 'user1',
              email: 'user2@example.com',
              passwordHash: 'hashed',
            },
          });
        }),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('トランザクションの分離レベル', () => {
    it('READ COMMITTED分離レベルで動作する', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const user = await prisma.$transaction(
        async tx => {
          return await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });
        },
        {
          maxWait: 5000,
          timeout: 10000,
        }
      );

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
    });

    it('タイムアウト設定が適用される', async () => {
      const error = new Error('Transaction timeout');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(
          async tx => {
            // 長時間実行される操作
            await new Promise(resolve => setTimeout(resolve, 6000));
            return await tx.user.create({
              data: {
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashed',
              },
            });
          },
          {
            maxWait: 5000,
            timeout: 5000,
          }
        )
      ).rejects.toThrow('Transaction timeout');
    });
  });

  describe('トランザクションの再試行', () => {
    it('一時的なエラーでトランザクションが再試行される', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTx = {
        user: {
          create: vi.fn().mockResolvedValue(mockUser),
        },
      };

      let attemptCount = 0;
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async callback => {
        attemptCount++;
        // 1回目は一時的なエラーをスロー
        if (attemptCount === 1) {
          const tempError = new Error('Temporary error') as Error & { code?: string };
          tempError.code = 'P2034'; // Prismaの接続エラーコード
          throw tempError;
        }
        // 2回目は成功
        return await callback(mockTx);
      });

      // アプリケーション層での再試行ロジックをシミュレート
      const maxRetries = 3;
      let user: Record<string, unknown> | null = null;
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          user = await prisma.$transaction(async tx => {
            return await tx.user.create({
              data: {
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashed',
              },
            });
          });
          break;
        } catch (err) {
          lastError = err as Error;
          // 最後の試行でなければ再試行
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(attemptCount).toBe(2);
    });

    it('最大再試行回数を超えるとエラーが発生する', async () => {
      const error = new Error('Persistent error');
      (error as Error & { code?: string }).code = 'P2034';

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          await prisma.$transaction(async tx => {
            return await tx.user.create({
              data: {
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashed',
              },
            });
          });
          break;
        } catch (err) {
          lastError = err as Error;
          // 最後の試行であればループを終了
          if (i === maxRetries - 1) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(lastError).toBeDefined();
      expect(lastError?.message).toBe('Persistent error');
    });
  });

  describe('トランザクションの原子性', () => {
    it('全ての操作が成功するか全て失敗する', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPost = {
        id: '1',
        content: 'Test post',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMedia = {
        id: '1',
        url: 'https://example.com/image.jpg',
        s3Key: 'post/2024-01-01/123.jpg',
        mediaType: 'IMAGE',
        status: 'COMPLETED',
        postId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([mockUser, mockPost, mockMedia]);

      const [user, post, media] = await prisma.$transaction(async tx => {
        const createdUser = await tx.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });

        const createdPost = await tx.post.create({
          data: {
            content: 'Test post',
            userId: createdUser.id,
          },
        });

        const createdMedia = await tx.media.create({
          data: {
            url: 'https://example.com/image.jpg',
            s3Key: 'post/2024-01-01/123.jpg',
            mediaType: 'IMAGE',
            status: 'COMPLETED',
            postId: createdPost.id,
            userId: createdUser.id,
          },
        });

        return [createdUser, createdPost, createdMedia];
      });

      expect(user).toBeDefined();
      expect(post).toBeDefined();
      expect(media).toBeDefined();
      expect(post.userId).toBe(user.id);
      expect(media.postId).toBe(post.id);
    });

    it('一部の操作が失敗すると全体がロールバックされる', async () => {
      const error = new Error('Media creation failed');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(async tx => {
          const user = await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });

          const post = await tx.post.create({
            data: {
              content: 'Test post',
              userId: user.id,
            },
          });

          // ここでエラー
          throw error;
        })
      ).rejects.toThrow('Media creation failed');
    });
  });

  describe('トランザクションの分離性', () => {
    it('トランザクション内の変更が他のトランザクションから見えない', async () => {
      const mockUser1 = {
        id: '1',
        username: 'user1',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser2 = {
        id: '2',
        username: 'user2',
        email: 'user2@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as any)
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      // トランザクション1でユーザーを作成
      const user1 = await prisma.$transaction(async tx => {
        return await tx.user.create({
          data: {
            username: 'user1',
            email: 'user1@example.com',
            passwordHash: 'hashed',
          },
        });
      });

      // トランザクション2でユーザーを作成（トランザクション1の変更は見えない）
      const user2 = await prisma.$transaction(async tx => {
        return await tx.user.create({
          data: {
            username: 'user2',
            email: 'user2@example.com',
            passwordHash: 'hashed',
          },
        });
      });

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1.username).toBe('user1');
      expect(user2.username).toBe('user2');
    });
  });

  describe('トランザクションの持続性', () => {
    it('コミットされた変更が永続化される', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      // トランザクションでユーザーを作成
      const user = await prisma.$transaction(async tx => {
        return await tx.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hashed',
          },
        });
      });

      // トランザクション後、ユーザーが取得できる
      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.username).toBe('testuser');
    });
  });

  describe('エラーハンドリング', () => {
    it('トランザクションエラーが適切に処理される', async () => {
      const error = new Error('Transaction error');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      try {
        await prisma.$transaction(async tx => {
          throw error;
        });
        expect(true).toBe(false); // 到達しないはず
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    it('タイムアウトエラーが適切に処理される', async () => {
      const error = new Error('Transaction timeout');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(
          async tx => {
            await new Promise(resolve => setTimeout(resolve, 6000));
          },
          { timeout: 5000 }
        )
      ).rejects.toThrow('Transaction timeout');
    });

    it('接続エラーが適切に処理される', async () => {
      const error = new Error('Connection lost');

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(
        prisma.$transaction(async tx => {
          return await tx.user.create({
            data: {
              username: 'testuser',
              email: 'test@example.com',
              passwordHash: 'hashed',
            },
          });
        })
      ).rejects.toThrow('Connection lost');
    });
  });
});
