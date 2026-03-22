/**
 * 🔐 バックアップコード再生成テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphQLError } from 'graphql';
import { verifyPassword } from '@libark/core-server/security/password';
import {
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCode,
} from '@libark/core-server/security/totp';

import { twoFactorResolvers } from '../twoFactor';
import type { GraphQLContext } from '../../types/context';

// 外部依存関係をモック
vi.mock('@libark/core-server/security/password');
vi.mock('@libark/core-server/security/totp', async () => {
  const actual = await vi.importActual('@libark/core-server/security/totp');
  return {
    ...actual,
    verifyTOTPCode: vi.fn(),
    generateBackupCodes: vi.fn(),
    hashBackupCode: vi.fn(),
  };
});

describe('🔐 バックアップコード再生成', () => {
  let mockContext: GraphQLContext;
  let testUser: any;

  beforeEach(() => {
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      twoFactorEnabled: true,
      twoFactorSecret: 'test-secret',
      backupCodes: ['old-code-1', 'old-code-2'],
    };

    mockContext = {
      user: testUser,
      prisma: {
        user: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      },
      fastify: {
        log: {
          error: vi.fn(),
        },
      },
    } as any;

    vi.clearAllMocks();
  });

  describe('✅ 正常ケース', () => {
    it('正しい認証情報でバックアップコード再生成が成功する', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      const newBackupCodes = [
        'ABCD1234',
        'EFGH5678',
        'IJKL9012',
        'MNOP3456',
        'QRST7890',
        'UVWX1234',
        'YZAB5678',
        'CDEF9012',
        'GHIJ3456',
        'KLMN7890',
      ];
      const hashedCodes = newBackupCodes.map(code => `hashed-${code}`);

      // モック設定
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
      vi.mocked(generateBackupCodes).mockReturnValue(newBackupCodes);
      vi.mocked(hashBackupCode).mockImplementation(async code => `hashed-${code}`);

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.prisma.user.update.mockResolvedValue({
        ...testUser,
        backupCodes: hashedCodes,
      });

      // テスト実行
      const result = await twoFactorResolvers.Mutation.regenerateBackupCodes(
        null,
        { input },
        mockContext
      );

      // 検証
      expect(result.codes).toEqual(newBackupCodes);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(mockContext.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id },
        select: {
          passwordHash: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
        },
      });
      expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: {
          backupCodes: hashedCodes,
        },
      });
      expect(verifyPassword).toHaveBeenCalledWith('correct-password', testUser.passwordHash);
      expect(verifyTOTPCode).toHaveBeenCalledWith(testUser.twoFactorSecret, '123456');
      expect(generateBackupCodes).toHaveBeenCalledWith(10);
    });

    it('生成されるバックアップコードが10個である', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      const newBackupCodes = Array.from(
        { length: 10 },
        (_, i) => `CODE${i.toString().padStart(4, '0')}`
      );

      // モック設定
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
      vi.mocked(generateBackupCodes).mockReturnValue(newBackupCodes);
      vi.mocked(hashBackupCode).mockImplementation(async code => `hashed-${code}`);

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.prisma.user.update.mockResolvedValue(testUser);

      // テスト実行
      const result = await twoFactorResolvers.Mutation.regenerateBackupCodes(
        null,
        { input },
        mockContext
      );

      // 検証
      expect(result.codes).toHaveLength(10);
      expect(generateBackupCodes).toHaveBeenCalledWith(10);
    });
  });

  describe('❌ エラーケース', () => {
    it('ユーザーが見つからない場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('ユーザーが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        })
      );
    });

    it('2FAが無効な場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      const disabledUser = {
        ...testUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(disabledUser);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('2FAが有効化されていません', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );
    });

    it('パスワードが間違っている場合はエラー', async () => {
      const input = {
        password: 'wrong-password',
        totpCode: '123456',
      };

      vi.mocked(verifyPassword).mockResolvedValue(false);
      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('パスワードが正しくありません', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );
    });

    it('TOTPコードが間違っている場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '000000',
      };

      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(false);
      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('認証コードが正しくありません', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );
    });

    it('データベースエラーが発生した場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
      vi.mocked(generateBackupCodes).mockReturnValue(['CODE1234']);
      vi.mocked(hashBackupCode).mockResolvedValue('hashed-CODE1234');

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.prisma.user.update.mockRejectedValue(new Error('Database error'));

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('バックアップコード再生成でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      );

      const errorLogCalls = mockContext.fastify.log.error.mock.calls;
      const hasExpectedLog = errorLogCalls.some(call => {
        return (
          (call[0] === 'Backup codes regeneration error:' && call[1] instanceof Error) ||
          (call[0]?.err instanceof Error && call[1] === 'Backup codes regeneration error:')
        );
      });
      expect(hasExpectedLog).toBe(true);
    });

    it('バックアップコード生成でエラーが発生した場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
      vi.mocked(generateBackupCodes).mockImplementation(() => {
        throw new Error('Backup code generation error');
      });

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('バックアップコード再生成でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      );
    });

    it('バックアップコードハッシュ化でエラーが発生した場合はエラー', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(verifyTOTPCode).mockReturnValue(true);
      vi.mocked(generateBackupCodes).mockReturnValue(['CODE1234']);
      vi.mocked(hashBackupCode).mockRejectedValue(new Error('Hash error'));

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow(
        new GraphQLError('バックアップコード再生成でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        })
      );
    });
  });

  describe('🔒 セキュリティテスト', () => {
    it('認証されていないユーザーはアクセスできない', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456',
      };

      const unauthenticatedContext = {
        ...mockContext,
        user: null,
      };

      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, unauthenticatedContext)
      ).rejects.toThrow();
    });

    it('空のパスワードは拒否される', async () => {
      const input = {
        password: '',
        totpCode: '123456',
      };

      // Zodスキーマバリデーションでエラーになることを期待
      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow();
    });

    it('空のTOTPコードは拒否される', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '',
      };

      // Zodスキーマバリデーションでエラーになることを期待
      await expect(
        twoFactorResolvers.Mutation.regenerateBackupCodes(null, { input }, mockContext)
      ).rejects.toThrow();
    });
  });
});
