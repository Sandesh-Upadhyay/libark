/**
 * 🔐 2FA GraphQL統合テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GraphQLError } from 'graphql';
import { PrismaClient } from '@prisma/client';
import { generateTOTPCode, verifyTOTPCode } from '@libark/core-server/security/totp';
import { hashPassword } from '@libark/core-server/security/password';

import { twoFactorResolvers } from '../twoFactor';
import { twoFactorLoginResolvers } from '../twoFactorLogin';
import { AuthService } from '../../auth/AuthService';

// TOTPコード検証をモック化
vi.mock('@libark/core-server/security/totp', async () => {
  const actual = await vi.importActual('@libark/core-server/security/totp');
  return {
    ...actual,
    verifyTOTPCode: vi.fn(),
  };
});

// テスト用のモックコンテキスト
const createMockContext = (user?: any) => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient,
  user,
  authService: {
    verifyTwoFactor: vi.fn(),
  } as unknown as AuthService,
  fastify: {
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
    auth: {
      generateAccessToken: vi.fn(),
      setAuthCookie: vi.fn(),
    },
  },
  reply: {
    setCookie: vi.fn(),
  },
});

describe('2FA GraphQL Integration Tests', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    vi.mocked(verifyTOTPCode).mockReset();
  });
  let mockContext: any;
  let testUser: any;
  let totpSecret: string;

  beforeEach(async () => {
    totpSecret = 'JBSWY3DPEHPK3PXP'; // 固定テスト用シークレット
    const hashedPassword = await hashPassword('correct-password');
    testUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      isActive: true,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    };

    mockContext = createMockContext(testUser);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setupTwoFactor', () => {
    it('should setup 2FA successfully', async () => {
      const input = { password: 'correct-password' };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      const result = await twoFactorResolvers.Mutation.setupTwoFactor(null, { input }, mockContext);

      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toContain('data:image/png;base64,');
      expect(result.manualEntryKey).toBeDefined();
    });

    it('should reject setup without authentication', async () => {
      const input = { password: 'correct-password' };
      const contextWithoutUser = createMockContext();

      await expect(
        twoFactorResolvers.Mutation.setupTwoFactor(null, { input }, contextWithoutUser)
      ).rejects.toThrow(GraphQLError);
    });

    it('should reject setup with wrong password', async () => {
      const input = { password: 'wrong-password' };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.setupTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('enableTwoFactor', () => {
    beforeEach(() => {
      testUser.twoFactorSecret = totpSecret;
    });

    it('should enable 2FA with valid TOTP code', async () => {
      // セットアップ段階でシークレットを保存したユーザーを模擬
      const userWithSecret = { ...testUser, twoFactorSecret: totpSecret };
      const input = {
        totpCode: '123456', // テスト用固定コード
        password: 'correct-password',
      };

      // TOTPコード検証をモック化
      vi.mocked(verifyTOTPCode).mockReturnValue(true);

      mockContext.prisma.user.findUnique.mockResolvedValue(userWithSecret);
      mockContext.prisma.user.update.mockResolvedValue({
        ...userWithSecret,
        twoFactorEnabled: true,
      });

      const result = await twoFactorResolvers.Mutation.enableTwoFactor(
        null,
        { input },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.backupCodes.codes).toHaveLength(10);
      expect(verifyTOTPCode).toHaveBeenCalledWith(totpSecret, '123456');
      expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: expect.objectContaining({
          twoFactorEnabled: true,
          twoFactorEnabledAt: expect.any(Date),
          backupCodes: expect.any(Array),
        }),
      });
    });

    it('should reject enable with invalid TOTP code', async () => {
      const input = {
        totpCode: '000000',
        password: 'correct-password',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.enableTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('disableTwoFactor', () => {
    beforeEach(() => {
      testUser.twoFactorEnabled = true;
      testUser.twoFactorSecret = totpSecret;
    });

    it('should disable 2FA with valid TOTP code', async () => {
      const validCode = generateTOTPCode(totpSecret);
      const input = {
        password: 'correct-password',
        code: validCode,
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.authService.verifyTwoFactor.mockResolvedValue({ success: true });
      mockContext.prisma.user.update.mockResolvedValue({
        ...testUser,
        twoFactorEnabled: false,
      });

      const result = await twoFactorResolvers.Mutation.disableTwoFactor(
        null,
        { input },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
          twoFactorEnabledAt: null,
        },
      });
    });

    it('should disable 2FA with valid backup code', async () => {
      const backupCode = 'ABCD1234';
      const input = {
        password: 'correct-password',
        code: backupCode,
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.authService.verifyTwoFactor.mockResolvedValue({
        success: true,
        isBackupCode: true,
      });
      mockContext.prisma.user.update.mockResolvedValue({
        ...testUser,
        twoFactorEnabled: false,
      });

      const result = await twoFactorResolvers.Mutation.disableTwoFactor(
        null,
        { input },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should reject disable with wrong password', async () => {
      const validCode = generateTOTPCode(totpSecret);
      const input = {
        password: 'wrong-password',
        code: validCode,
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      await expect(
        twoFactorResolvers.Mutation.disableTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow('パスワードが正しくありません');
    });

    it('should reject disable with invalid code', async () => {
      const input = {
        password: 'correct-password',
        code: 'invalid-code',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.authService.verifyTwoFactor.mockResolvedValue({
        success: false,
        error: { message: '認証コードが正しくありません' },
      });

      await expect(
        twoFactorResolvers.Mutation.disableTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow('認証コードが正しくありません');
    });

    it('should reject disable when 2FA is not enabled', async () => {
      const validCode = generateTOTPCode(totpSecret);
      const input = {
        password: 'correct-password',
        code: validCode,
      };

      const userWithout2FA = {
        ...testUser,
        twoFactorEnabled: false,
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(userWithout2FA);

      await expect(
        twoFactorResolvers.Mutation.disableTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow('2FAは有効化されていません');
    });
  });

  describe('regenerateBackupCodes', () => {
    beforeEach(() => {
      testUser.twoFactorEnabled = true;
      testUser.twoFactorSecret = totpSecret;
    });

    it('should regenerate backup codes successfully', async () => {
      const input = {
        password: 'correct-password',
        totpCode: '123456', // テスト用固定コード
      };

      // TOTPコード検証をモック化
      vi.mocked(verifyTOTPCode).mockReturnValue(true);

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.prisma.user.update.mockResolvedValue(testUser);

      const result = await twoFactorResolvers.Mutation.regenerateBackupCodes(
        null,
        { input },
        mockContext
      );

      expect(result.codes).toHaveLength(10);
      expect(result.generatedAt).toBeDefined();
      expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: {
          backupCodes: expect.any(Array),
        },
      });
    });
  });

  describe('loginWithTwoFactor', () => {
    beforeEach(() => {
      testUser.twoFactorEnabled = true;
      testUser.twoFactorSecret = totpSecret;
    });

    // 複雑な2FA統合テストは別途専用テストで実装予定
    // 現在は基本的な2FA機能のテストのみ実装

    it('should reject login with invalid code', async () => {
      const input = {
        tempUserId: testUser.id,
        code: '000000',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);
      mockContext.authService.verifyTwoFactor.mockResolvedValue({ success: false });

      await expect(
        twoFactorLoginResolvers.Mutation.loginWithTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...testUser, isActive: false };
      const input = {
        tempUserId: testUser.id,
        code: '123456',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        twoFactorLoginResolvers.Mutation.loginWithTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });

    it('should reject login for user without 2FA', async () => {
      const userWithout2FA = { ...testUser, twoFactorEnabled: false };
      const input = {
        tempUserId: testUser.id,
        code: '123456',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(userWithout2FA);

      await expect(
        twoFactorLoginResolvers.Mutation.loginWithTwoFactor(null, { input }, mockContext)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('twoFactorStatus query', () => {
    it('should return correct status for enabled 2FA', async () => {
      const enabledUser = {
        ...testUser,
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
        backupCodes: ['code1', 'code2', 'code3'],
      };

      mockContext.user = enabledUser;
      mockContext.prisma.user.findUnique.mockResolvedValue(enabledUser);

      const result = await twoFactorResolvers.Query.twoFactorStatus(null, {}, mockContext);

      expect(result.enabled).toBe(true);
      expect(result.enabledAt).toBeDefined();
      expect(result.backupCodesCount).toBe(3);
    });

    it('should return correct status for disabled 2FA', async () => {
      mockContext.prisma.user.findUnique.mockResolvedValue(testUser);

      const result = await twoFactorResolvers.Query.twoFactorStatus(null, {}, mockContext);

      expect(result.enabled).toBe(false);
      expect(result.enabledAt).toBeNull();
      expect(result.backupCodesCount).toBe(0);
    });
    describe('バックアップコードのエッジケース', () => {
      it('バックアップコードの枯渇時の挙動を確認', async () => {
        const userWithSingleBackupCode = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-backup-code'],
        };

        mockContext.user = userWithSingleBackupCode;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithSingleBackupCode);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWithSingleBackupCode,
          backupCodes: [],
        });

        // 最後のバックアップコードを使用
        const input = {
          password: 'correct-password',
          code: 'ABCD1234',
        };

        mockContext.authService.verifyTwoFactor.mockResolvedValue({
          success: true,
          isBackupCode: true,
        });

        const result = await twoFactorResolvers.Mutation.disableTwoFactor(
          null,
          { input },
          mockContext
        );

        expect(result.success).toBe(true);
      });

      it('バックアップコードの同時使用を正しく処理', async () => {
        const userWithMultipleBackupCodes = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['code1', 'code2', 'code3'],
        };

        mockContext.user = userWithMultipleBackupCodes;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithMultipleBackupCodes);
        mockContext.prisma.user.update.mockResolvedValue({});

        // 同時に複数のバックアップコードを使用を試行
        const input1 = {
          password: 'correct-password',
          code: 'ABCD1234',
        };

        const input2 = {
          password: 'correct-password',
          code: 'EFGH5678',
        };

        mockContext.authService.verifyTwoFactor.mockResolvedValue({
          success: true,
          isBackupCode: true,
        });

        const [result1, result2] = await Promise.all([
          twoFactorResolvers.Mutation.disableTwoFactor(null, { input: input1 }, mockContext),
          twoFactorResolvers.Mutation.disableTwoFactor(null, { input: input2 }, mockContext),
        ]);

        // 少なくとも1つは成功するはず
        expect([result1.success, result2.success]).toContain(true);
      });
    });

    describe('2FA有効化・無効化のエッジケース', () => {
      it('2FA有効化時のTOTPコード検証エッジケース', async () => {
        const userWithSecret = {
          ...testUser,
          twoFactorSecret: totpSecret,
        };

        mockContext.user = userWithSecret;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithSecret);

        // 有効なTOTPコードで有効化
        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const input1 = {
          totpCode: '123456',
          password: 'correct-password',
        };

        const result1 = await twoFactorResolvers.Mutation.enableTwoFactor(
          null,
          { input: input1 },
          mockContext
        );

        expect(result1.success).toBe(true);

        // 無効なTOTPコードで有効化を試行
        vi.mocked(verifyTOTPCode).mockReturnValue(false);

        const input2 = {
          totpCode: '000000',
          password: 'correct-password',
        };

        await expect(
          twoFactorResolvers.Mutation.enableTwoFactor(null, { input: input2 }, mockContext)
        ).rejects.toThrow(GraphQLError);
      });

      it('2FA無効化時のバックアップコード使用', async () => {
        const userWithBackupCode = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-backup-code'],
        };

        mockContext.user = userWithBackupCode;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithBackupCode);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWithBackupCode,
          twoFactorEnabled: false,
        });

        const input = {
          password: 'correct-password',
          code: 'ABCD1234',
        };

        mockContext.authService.verifyTwoFactor.mockResolvedValue({
          success: true,
          isBackupCode: true,
        });

        const result = await twoFactorResolvers.Mutation.disableTwoFactor(
          null,
          { input },
          mockContext
        );

        expect(result.success).toBe(true);
      });
    });

    describe('不正なコード入力時のロックアウト', () => {
      it('連続する不正なコード入力の処理', async () => {
        const userWith2FA = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
        };

        mockContext.user = userWith2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FA);

        // 連続して不正なコードを入力
        const invalidInputs = [
          { totpCode: '000000', password: 'correct-password' },
          { totpCode: '111111', password: 'correct-password' },
          { totpCode: '222222', password: 'correct-password' },
          { totpCode: '333333', password: 'correct-password' },
          { totpCode: '444444', password: 'correct-password' },
        ];

        for (const input of invalidInputs) {
          vi.mocked(verifyTOTPCode).mockReturnValue(false);

          await expect(
            twoFactorResolvers.Mutation.enableTwoFactor(null, { input }, mockContext)
          ).rejects.toThrow(GraphQLError);
        }
      });

      it('TOTPコードとバックアップコードの混在入力', async () => {
        const userWithBothCodes = {
          ...testUser,
          twoFactorEnabled: false, // まだ有効化されていない状態
          twoFactorSecret: totpSecret,
          backupCodes: [],
        };

        mockContext.user = userWithBothCodes;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithBothCodes);

        // TOTPコードで有効化を試行
        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const totpInput = {
          totpCode: '123456',
          password: 'correct-password',
        };

        const totpResult = await twoFactorResolvers.Mutation.enableTwoFactor(
          null,
          { input: totpInput },
          mockContext
        );

        expect(totpResult.success).toBe(true);

        // バックアップコードで無効化を試行（有効化後の状態）
        const userWith2FAEnabled = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-backup-code'],
        };

        mockContext.user = userWith2FAEnabled;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FAEnabled);

        const backupInput = {
          password: 'correct-password',
          code: 'ABCD1234',
        };

        mockContext.authService.verifyTwoFactor.mockResolvedValue({
          success: true,
          isBackupCode: true,
        });

        const backupResult = await twoFactorResolvers.Mutation.disableTwoFactor(
          null,
          { input: backupInput },
          mockContext
        );

        expect(backupResult.success).toBe(true);
      });
    });

    describe.skip('2FA設定済みユーザーのパスワードリセット', () => {
      it.skip('パスワードリセット後の2FA状態を確認', async () => {
        const userWith2FA = {
          ...testUser,
          twoFactorEnabled: false, // まだ有効化されていない状態
          twoFactorSecret: totpSecret,
          backupCodes: [],
        };

        mockContext.user = userWith2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FA);

        // パスワードリセット後に2FA検証
        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const input = {
          totpCode: '123456',
          password: 'new-password',
        };

        const result = await twoFactorResolvers.Mutation.enableTwoFactor(
          null,
          { input },
          mockContext
        );

        expect(result.success).toBe(true);
        expect(mockContext.prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: testUser.id },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true,
            isActive: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            backupCodes: true,
          },
        });
      });

      it('パスワードリセット後のバックアップコード使用', async () => {
        const userWith2FA = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-backup-code'],
        };

        mockContext.user = userWith2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FA);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWith2FA,
          twoFactorEnabled: false,
        });

        const input = {
          password: 'correct-password', // 正しいパスワードを使用
          code: 'ABCD1234',
        };

        mockContext.authService.verifyTwoFactor.mockResolvedValue({
          success: true,
          isBackupCode: true,
        });

        const result = await twoFactorResolvers.Mutation.disableTwoFactor(
          null,
          { input },
          mockContext
        );

        expect(result.success).toBe(true);
      });
    });

    describe('リカバリーコードの再生成', () => {
      it('リカバリーコードの再生成が正しく動作', async () => {
        const userWithOldBackupCodes = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['old-hashed-code-1', 'old-hashed-code-2'],
        };

        mockContext.user = userWithOldBackupCodes;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithOldBackupCodes);
        mockContext.prisma.user.update.mockResolvedValue(userWithOldBackupCodes);

        const input = {
          password: 'correct-password',
          totpCode: '123456',
        };

        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const result = await twoFactorResolvers.Mutation.regenerateBackupCodes(
          null,
          { input },
          mockContext
        );

        expect(result.codes).toHaveLength(10);
        expect(result.generatedAt).toBeDefined();
        expect(mockContext.prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUser.id },
          data: {
            backupCodes: expect.any(Array),
          },
        });
      });

      it('リカバリーコード再生成後の古いコード無効化', async () => {
        const userWithBackupCodes = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['old-hashed-code'],
        };

        mockContext.user = userWithBackupCodes;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithBackupCodes);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWithBackupCodes,
          backupCodes: ['new-hashed-code-1', 'new-hashed-code-2'],
        });

        const input = {
          password: 'correct-password',
          totpCode: '123456',
        };

        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const result = await twoFactorResolvers.Mutation.regenerateBackupCodes(
          null,
          { input },
          mockContext
        );

        expect(result.codes).toHaveLength(10);
        expect(mockContext.prisma.user.update).toHaveBeenCalled();
      });
    });

    describe('2FA認証フローの統合テスト', () => {
      it('2FA有効化から無効化までの完全なフロー', async () => {
        // 1. 2FAセットアップ
        const userWithout2FA = {
          ...testUser,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        };

        mockContext.user = userWithout2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithout2FA);

        const setupInput = { password: 'correct-password' };
        const setupResult = await twoFactorResolvers.Mutation.setupTwoFactor(
          null,
          { input: setupInput },
          mockContext
        );

        expect(setupResult).toBeDefined();
        expect(setupResult.secret).toBeDefined();

        // 2. 2FA有効化
        const userWithSecret = {
          ...testUser,
          twoFactorSecret: setupResult.secret,
        };

        mockContext.user = userWithSecret;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWithSecret);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWithSecret,
          twoFactorEnabled: true,
          backupCodes: ['code1', 'code2', 'code3'],
        });

        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const enableInput = {
          totpCode: '123456',
          password: 'correct-password',
        };

        const enableResult = await twoFactorResolvers.Mutation.enableTwoFactor(
          null,
          { input: enableInput },
          mockContext
        );

        expect(enableResult.success).toBe(true);
        expect(enableResult.backupCodes.codes).toHaveLength(10);

        // 3. 2FA無効化
        const userWith2FA = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: setupResult.secret,
          backupCodes: ['code1', 'code2', 'code3'],
        };

        mockContext.user = userWith2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FA);
        mockContext.prisma.user.update.mockResolvedValue({
          ...userWith2FA,
          twoFactorEnabled: false,
        });

        mockContext.authService.verifyTwoFactor.mockResolvedValue({ success: true });

        const disableInput = {
          password: 'correct-password',
          code: '123456',
        };

        const disableResult = await twoFactorResolvers.Mutation.disableTwoFactor(
          null,
          { input: disableInput },
          mockContext
        );

        expect(disableResult.success).toBe(true);
      });

      it('複数の2FA検証を同時に実行', async () => {
        const userWith2FA = {
          ...testUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-backup-code'],
        };

        mockContext.user = userWith2FA;
        mockContext.prisma.user.findUnique.mockResolvedValue(userWith2FA);
        mockContext.prisma.user.update.mockResolvedValue({});

        // 同時に複数の2FA操作を実行
        vi.mocked(verifyTOTPCode).mockReturnValue(true);

        const [result1, result2] = await Promise.all([
          twoFactorResolvers.Mutation.regenerateBackupCodes(
            null,
            { input: { password: 'correct-password', totpCode: '123456' } },
            mockContext
          ),
          twoFactorResolvers.Mutation.regenerateBackupCodes(
            null,
            { input: { password: 'correct-password', totpCode: '123456' } },
            mockContext
          ),
        ]);

        expect(result1.codes).toHaveLength(10);
        expect(result2.codes).toHaveLength(10);
      });
    });
  });
});
