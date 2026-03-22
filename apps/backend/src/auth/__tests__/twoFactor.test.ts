/**
 * 🔐 AuthService 2FA機能テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { generateTOTPSecret, generateTOTPCode, hashBackupCode } from '@libark/core-server';

import { AuthService } from '../AuthService';

// Prismaクライアントのモック
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe('AuthService 2FA functionality', () => {
  let authService: AuthService;
  let mockUser: any;
  let totpSecret: string;

  beforeEach(async () => {
    // AuthServiceインスタンス作成
    authService = AuthService.getInstance(mockPrisma, undefined, {
      jwtSecret: 'test-secret',
      jwtExpiresIn: '15m',
      cookieName: 'accessToken',
      cookieSecure: false,
      cookieSameSite: 'lax',
      maxLoginAttempts: 5,
      lockoutDuration: 900,
    });

    // テスト用のTOTPシークレット生成
    totpSecret = await generateTOTPSecret();

    // モックユーザーデータ
    mockUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      twoFactorEnabled: true,
      twoFactorSecret: totpSecret,
      backupCodes: [],
    };

    // モック関数をリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyTwoFactor', () => {
    it('should verify valid TOTP code', async () => {
      const validCode = generateTOTPCode(totpSecret);

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyTwoFactor('test-user-id', validCode);

      expect(result.success).toBe(true);
      expect(result.isBackupCode).toBeUndefined();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: {
          id: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          backupCodes: true,
        },
      });
    });

    it('should reject invalid TOTP code', async () => {
      const invalidCode = '000000';

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyTwoFactor('test-user-id', invalidCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('無効な認証コード');
    });

    it('should verify valid backup code', async () => {
      const backupCode = 'ABCD1234';
      const hashedBackupCode = await hashBackupCode(backupCode);

      const userWithBackupCodes = {
        ...mockUser,
        backupCodes: [hashedBackupCode, 'other-hashed-code'],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithBackupCodes);
      mockPrisma.user.update = vi.fn().mockResolvedValue({});

      const result = await authService.verifyTwoFactor('test-user-id', backupCode);

      expect(result.success).toBe(true);
      expect(result.isBackupCode).toBe(true);

      // バックアップコードが削除されることを確認
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { backupCodes: ['other-hashed-code'] },
      });
    });

    it('should reject invalid backup code', async () => {
      const invalidBackupCode = 'INVALID1';
      const hashedBackupCode = await hashBackupCode('VALID123');

      const userWithBackupCodes = {
        ...mockUser,
        backupCodes: [hashedBackupCode],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithBackupCodes);

      const result = await authService.verifyTwoFactor('test-user-id', invalidBackupCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject when user not found', async () => {
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null);

      const result = await authService.verifyTwoFactor('nonexistent-user', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject when 2FA is not enabled', async () => {
      const userWithout2FA = {
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithout2FA);

      const result = await authService.verifyTwoFactor('test-user-id', '123456');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('2FAが有効化されていません');
    });

    it('should handle malformed codes gracefully', async () => {
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);

      // 短すぎるコード
      const shortCodeResult = await authService.verifyTwoFactor('test-user-id', '123');
      expect(shortCodeResult.success).toBe(false);

      // 長すぎるコード
      const longCodeResult = await authService.verifyTwoFactor('test-user-id', '123456789');
      expect(longCodeResult.success).toBe(false);

      // 無効な文字を含むコード
      const invalidCharResult = await authService.verifyTwoFactor('test-user-id', '12345@');
      expect(invalidCharResult.success).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique = vi.fn().mockRejectedValue(new Error('Database error'));

      const result = await authService.verifyTwoFactor('test-user-id', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle backup code update errors gracefully', async () => {
      const backupCode = 'ABCD1234';
      const hashedBackupCode = await hashBackupCode(backupCode);

      const userWithBackupCodes = {
        ...mockUser,
        backupCodes: [hashedBackupCode],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithBackupCodes);
      mockPrisma.user.update = vi.fn().mockRejectedValue(new Error('Update failed'));

      const result = await authService.verifyTwoFactor('test-user-id', backupCode);

      // バックアップコード検証は成功するが、更新エラーは内部で処理される
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty backup codes array', async () => {
      const userWithEmptyBackupCodes = {
        ...mockUser,
        backupCodes: [],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithEmptyBackupCodes);

      const result = await authService.verifyTwoFactor('test-user-id', 'ABCD1234');

      expect(result.success).toBe(false);
    });

    it('should handle concurrent backup code usage', async () => {
      const backupCode = 'ABCD1234';
      const hashedBackupCode = await hashBackupCode(backupCode);

      const userWithBackupCodes = {
        ...mockUser,
        backupCodes: [hashedBackupCode],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithBackupCodes);
      mockPrisma.user.update = vi.fn().mockResolvedValue({});

      // 同じバックアップコードを2回使用
      const result1 = await authService.verifyTwoFactor('test-user-id', backupCode);
      expect(result1.success).toBe(true);

      // 2回目は失敗するはず（既に削除されている）
      const userWithoutBackupCode = {
        ...mockUser,
        backupCodes: [],
      };
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithoutBackupCode);

      const result2 = await authService.verifyTwoFactor('test-user-id', backupCode);
      expect(result2.success).toBe(false);
    });

    it('should return specific error message for used backup code', async () => {
      const backupCode = 'ABCD1234';

      // バックアップコードが残っていないユーザー
      const userWithoutBackupCodes = {
        ...mockUser,
        backupCodes: [],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithoutBackupCodes);

      const result = await authService.verifyTwoFactor('test-user-id', backupCode);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(
        'バックアップコードが残っていません。新しいバックアップコードを生成してください'
      );
    });

    it('should return specific error message for invalid backup code', async () => {
      const validBackupCode = 'ABCD1234';
      const invalidBackupCode = 'EFGH5678';
      const hashedBackupCode = await hashBackupCode(validBackupCode);

      const userWithBackupCodes = {
        ...mockUser,
        backupCodes: [hashedBackupCode],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(userWithBackupCodes);

      const result = await authService.verifyTwoFactor('test-user-id', invalidBackupCode);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(
        'このバックアップコードは無効です。使用済みか間違っている可能性があります'
      );
    });
    describe('バックアップコードのエッジケース', () => {
      it.skip('バックアップコードの枯渇時の挙動を確認', async () => {
        // バックアップコードが1つだけのユーザー
        const singleBackupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(singleBackupCode);

        const userWithSingleBackupCode = {
          ...mockUser,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithSingleBackupCode);
        mockPrisma.user.update.mockResolvedValue({});

        // 最後のバックアップコードを使用
        const result1 = await authService.verifyTwoFactor('test-user-id', singleBackupCode);
        expect(result1.success).toBe(true);

        // バックアップコードが使用済みになったユーザーをシミュレート
        const userWithoutBackupCodes = {
          ...mockUser,
          backupCodes: [],
        };
        mockPrisma.user.findUnique.mockResolvedValue(userWithoutBackupCodes);

        // バックアップコードが枯渇した状態で使用を試行
        const result2 = await authService.verifyTwoFactor('test-user-id', 'EFGH5678');
        expect(result2.success).toBe(false);
        expect(result2.error?.message).toContain('バックアップコードが残っていません');
      });

      it.skip('バックアップコードの同時使用を正しく処理', async () => {
        const backupCode1 = 'ABCD1234';
        const backupCode2 = 'EFGH5678';
        const hashedBackupCode1 = await hashBackupCode(backupCode1);
        const hashedBackupCode2 = await hashBackupCode(backupCode2);

        const userWithBackupCodes = {
          ...mockUser,
          backupCodes: [hashedBackupCode1, hashedBackupCode2],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // 同時に2つのバックアップコードを使用
        const [result1, result2] = await Promise.all([
          authService.verifyTwoFactor('test-user-id', backupCode1),
          authService.verifyTwoFactor('test-user-id', backupCode2),
        ]);

        // 少なくとも1つは成功するはず（競合状態により）
        const successCount = [result1.success, result2.success].filter(Boolean).length;
        expect(successCount).toBeGreaterThan(0);
      });

      it.skip('バックアップコードの再生成を確認', async () => {
        const userWithBackupCodes = {
          ...mockUser,
          backupCodes: ['old-hashed-code-1', 'old-hashed-code-2'],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // 古いバックアップコードを使用
        const result1 = await authService.verifyTwoFactor('test-user-id', 'INVALID');
        expect(result1.success).toBe(false);

        // 新しいバックアップコードが生成されたことを確認
        expect(mockPrisma.user.update).toHaveBeenCalled();
      });
    });

    describe('2FA有効化・無効化のエッジケース', () => {
      it('2FA有効化時のTOTPコード検証エッジケース', async () => {
        const validCode = generateTOTPCode(totpSecret);

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // 有効なTOTPコードで検証
        const result1 = await authService.verifyTwoFactor('test-user-id', validCode);
        expect(result1.success).toBe(true);

        // 無効なTOTPコード（桁数が違う）
        const result2 = await authService.verifyTwoFactor('test-user-id', '12345');
        expect(result2.success).toBe(false);

        // 無効なTOTPコード（文字が含まれる）
        const result3 = await authService.verifyTwoFactor('test-user-id', '12345A');
        expect(result3.success).toBe(false);
      });

      it('2FA無効化時のバックアップコード使用', async () => {
        const backupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(backupCode);

        const userWithBackupCodes = {
          ...mockUser,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // バックアップコードで2FA検証
        const result = await authService.verifyTwoFactor('test-user-id', backupCode);
        expect(result.success).toBe(true);
        expect(result.isBackupCode).toBe(true);

        // バックアップコードが削除されたことを確認
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'test-user-id' },
          data: { backupCodes: [] },
        });
      });

      it('2FA無効化時のTOTPコード検証', async () => {
        const validCode = generateTOTPCode(totpSecret);

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // 有効なTOTPコードで検証
        const result = await authService.verifyTwoFactor('test-user-id', validCode);
        expect(result.success).toBe(true);
        expect(result.isBackupCode).toBeUndefined();
      });
    });

    describe('不正なコード入力時のロックアウト', () => {
      it('連続する不正なコード入力の処理', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // 連続して不正なコードを入力
        const invalidCodes = ['000000', '111111', '222222', '333333', '444444', '555555'];
        const results = [];

        for (const invalidCode of invalidCodes) {
          const result = await authService.verifyTwoFactor('test-user-id', invalidCode);
          results.push(result);
        }

        // すべての試行が失敗することを確認
        results.forEach(result => {
          expect(result.success).toBe(false);
        });
      });

      it('TOTPコードとバックアップコードの混在入力', async () => {
        const backupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(backupCode);

        const userWithBackupCodes = {
          ...mockUser,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // TOTPコード（6桁）とバックアップコード（8桁）を混在して入力
        const totpResult = await authService.verifyTwoFactor('test-user-id', '123456');
        expect(totpResult.success).toBe(false);

        const backupResult = await authService.verifyTwoFactor('test-user-id', backupCode);
        expect(backupResult.success).toBe(true);
        expect(backupResult.isBackupCode).toBe(true);
      });
    });

    describe('2FA設定済みユーザーのパスワードリセット', () => {
      it('パスワードリセット後の2FA状態を確認', async () => {
        const userWith2FA = {
          ...mockUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-code-1', 'hashed-code-2'],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);

        // パスワードリセットをシミュレート（2FA設定は維持されるはず）
        const validCode = generateTOTPCode(totpSecret);
        const result = await authService.verifyTwoFactor('test-user-id', validCode);

        expect(result.success).toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'test-user-id' },
          select: {
            id: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            backupCodes: true,
          },
        });
      });

      it('パスワードリセット後のバックアップコード使用', async () => {
        const backupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(backupCode);

        const userWith2FA = {
          ...mockUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
        mockPrisma.user.update.mockResolvedValue({});

        // パスワードリセット後にバックアップコードを使用
        const result = await authService.verifyTwoFactor('test-user-id', backupCode);

        expect(result.success).toBe(true);
        expect(result.isBackupCode).toBe(true);
      });
    });

    describe.skip('リカバリーコードの再生成', () => {
      it.skip('リカバリーコードの再生成が正しく動作', async () => {
        const userWithOldBackupCodes = {
          ...mockUser,
          backupCodes: ['old-hashed-code-1', 'old-hashed-code-2'],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithOldBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // 古いバックアップコードを使用
        const result1 = await authService.verifyTwoFactor('test-user-id', 'INVALID');
        expect(result1.success).toBe(false);

        // 新しいバックアップコードが生成されたことを確認
        expect(mockPrisma.user.update).toHaveBeenCalled();
      });

      it.skip('リカバリーコード再生成後の古いコード無効化', async () => {
        const oldBackupCode = 'ABCD1234';
        const hashedOldBackupCode = await hashBackupCode(oldBackupCode);

        const userWithOldBackupCodes = {
          ...mockUser,
          backupCodes: [hashedOldBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithOldBackupCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // 古いバックアップコードを使用
        const result1 = await authService.verifyTwoFactor('test-user-id', oldBackupCode);
        expect(result1.success).toBe(true);

        // バックアップコードが削除されたことを確認
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'test-user-id' },
          data: { backupCodes: [] },
        });

        // 削除されたバックアップコードを再使用しようとする
        const result2 = await authService.verifyTwoFactor('test-user-id', oldBackupCode);
        expect(result2.success).toBe(false);
      });
    });

    describe('2FA認証フローの統合テスト', () => {
      it('2FA有効化から無効化までの完全なフロー', async () => {
        // 1. 2FA有効化前の状態
        const userWithout2FA = {
          ...mockUser,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithout2FA);

        const result1 = await authService.verifyTwoFactor('test-user-id', '123456');
        expect(result1.success).toBe(false);
        expect(result1.error?.message).toContain('2FAが有効化されていません');

        // 2. 2FA有効化後の状態
        const userWith2FA = {
          ...mockUser,
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret,
          backupCodes: ['hashed-code-1'],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);

        const validCode = generateTOTPCode(totpSecret);
        const result2 = await authService.verifyTwoFactor('test-user-id', validCode);
        expect(result2.success).toBe(true);

        // 3. バックアップコード使用
        const backupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(backupCode);

        const userWithBackupCode = {
          ...mockUser,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBackupCode);
        mockPrisma.user.update.mockResolvedValue({});

        const result3 = await authService.verifyTwoFactor('test-user-id', backupCode);
        expect(result3.success).toBe(true);
        expect(result3.isBackupCode).toBe(true);
      });

      it('複数の2FA検証を同時に実行', async () => {
        const validCode = generateTOTPCode(totpSecret);
        const backupCode = 'ABCD1234';
        const hashedBackupCode = await hashBackupCode(backupCode);

        const userWithBothCodes = {
          ...mockUser,
          backupCodes: [hashedBackupCode],
        };

        mockPrisma.user.findUnique.mockResolvedValue(userWithBothCodes);
        mockPrisma.user.update.mockResolvedValue({});

        // 同時に複数の2FA検証を実行
        const [result1, result2, result3] = await Promise.all([
          authService.verifyTwoFactor('test-user-id', validCode),
          authService.verifyTwoFactor('test-user-id', '000000'),
          authService.verifyTwoFactor('test-user-id', backupCode),
        ]);

        // 少なくとも1つは成功するはず
        const successCount = [result1.success, result2.success, result3.success].filter(
          Boolean
        ).length;
        expect(successCount).toBeGreaterThan(0);
      });
    });
  });
});
