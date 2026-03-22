/**
 * 🔐 GraphQL 2FA (Two-Factor Authentication) リゾルバー
 */

import { GraphQLError } from 'graphql';
import { verifyPassword } from '@libark/core-server/security/password';
import {
  generateTOTPSecret,
  generateTOTPSetup,
  generateBackupCodes,
  hashBackupCode,
  verifyTOTPCode,
} from '@libark/core-server';
import {
  TwoFactorSetupSchema,
  TwoFactorEnableSchema,
  TwoFactorDisableSchema,
  TwoFactorRegenerateBackupCodesSchema,
  type TwoFactorSetup,
  type TwoFactorEnable,
  type TwoFactorDisable,
  type TwoFactorRegenerateBackupCodes,
} from '@libark/core-shared';

import { GraphQLContext } from '../graphql/context.js';

/**
 * 認証が必要なリゾルバーのヘルパー
 */
function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

export const twoFactorResolvers = {
  Query: {
    /**
     * 2FA状態取得
     */
    twoFactorStatus: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);

      const userData = await context.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          twoFactorEnabled: true,
          twoFactorEnabledAt: true,
          backupCodes: true,
        },
      });

      if (!userData) {
        throw new GraphQLError('ユーザーが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return {
        enabled: userData.twoFactorEnabled,
        enabledAt: userData.twoFactorEnabledAt || null,
        backupCodesCount: userData.backupCodes.length,
      };
    },
  },

  Mutation: {
    /**
     * 2FA設定開始（QRコード生成）
     */
    setupTwoFactor: async (
      _parent: unknown,
      { input }: { input: TwoFactorSetup },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // 入力検証
        const validatedInput = TwoFactorSetupSchema.parse(input);
        const { password } = validatedInput;

        // 現在のユーザー情報取得
        const userData = await context.prisma.user.findUnique({
          where: { id: user.id },
          select: {
            passwordHash: true,
            twoFactorEnabled: true,
          },
        });

        if (!userData) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 既に2FAが有効な場合はエラー
        if (userData.twoFactorEnabled) {
          throw new GraphQLError('2FAは既に有効化されています', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, userData.passwordHash);
        if (!isValidPassword) {
          throw new GraphQLError('パスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // TOTPシークレット生成
        const secret = await generateTOTPSecret();
        const setupData = await generateTOTPSetup(secret, user.email, {
          issuer: 'LIBARK',
        });

        // 一時的にシークレットをデータベースに保存（有効化前の状態）
        await context.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorSecret: secret, // 一時保存
            twoFactorEnabled: false, // まだ有効化されていない
          },
        });

        return {
          secret: setupData.secret,
          qrCodeUrl: setupData.qrCodeUrl,
          manualEntryKey: setupData.manualEntryKey,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, '2FA setup error:');
        throw new GraphQLError('2FA設定でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 2FA有効化
     */
    enableTwoFactor: async (
      _parent: unknown,
      { input }: { input: TwoFactorEnable },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // 入力検証
        const validatedInput = TwoFactorEnableSchema.parse(input);
        const { totpCode, password } = validatedInput;

        // 現在のユーザー情報取得
        const userData = await context.prisma.user.findUnique({
          where: { id: user.id },
          select: {
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecret: true, // セットアップ時に保存されたシークレットを取得
          },
        });

        if (!userData) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 既に2FAが有効な場合はエラー
        if (userData.twoFactorEnabled) {
          throw new GraphQLError('2FAは既に有効化されています', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, userData.passwordHash);
        if (!isValidPassword) {
          throw new GraphQLError('パスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // セットアップ時に保存されたシークレットを使用
        if (!userData.twoFactorSecret) {
          throw new GraphQLError('2FAのセットアップが完了していません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 既に有効化されている場合はエラー
        if (userData.twoFactorEnabled) {
          throw new GraphQLError('2FAは既に有効化されています', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // TOTPコード検証
        const isValidTOTP = verifyTOTPCode(userData.twoFactorSecret, totpCode);
        if (!isValidTOTP) {
          throw new GraphQLError('認証コードが正しくありません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // バックアップコード生成
        const backupCodes = await generateBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
          backupCodes.map((code: string) => hashBackupCode(code))
        );

        // データベース更新
        await context.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorEnabledAt: new Date(),
            backupCodes: hashedBackupCodes,
          },
        });

        context.fastify.log.info({ userId: user.id }, '2FA enabled successfully');
        return {
          success: true,
          message: '2FAが有効化されました',
          backupCodes: {
            codes: backupCodes,
            generatedAt: new Date(),
          },
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, '2FA enable error:');
        throw new GraphQLError('2FA有効化でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 2FA無効化
     */
    disableTwoFactor: async (
      _parent: unknown,
      { input }: { input: TwoFactorDisable },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // 入力検証
        const validatedInput = TwoFactorDisableSchema.parse(input);
        const { password, code } = validatedInput;

        // 現在のユーザー情報取得
        const userData = await context.prisma.user.findUnique({
          where: { id: user.id },
          select: {
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            backupCodes: true,
          },
        });

        if (!userData) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 2FAが無効な場合はエラー
        if (!userData.twoFactorEnabled) {
          throw new GraphQLError('2FAは有効化されていません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, userData.passwordHash);
        if (!isValidPassword) {
          throw new GraphQLError('パスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 2FA検証（AuthServiceを使用）
        const verificationResult = await context.authService.verifyTwoFactor(user.id, code);
        if (!verificationResult.success) {
          throw new GraphQLError('認証コードが正しくありません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // データベース更新（2FA無効化）
        await context.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorEnabledAt: null,
            backupCodes: [],
          },
        });

        return {
          success: true,
          message: '2FAが無効化されました',
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, '2FA disable error:');
        throw new GraphQLError('2FA無効化でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * バックアップコード再生成
     */
    regenerateBackupCodes: async (
      _parent: unknown,
      { input }: { input: TwoFactorRegenerateBackupCodes },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // 入力検証
        const validatedInput = TwoFactorRegenerateBackupCodesSchema.parse(input);
        const { password, totpCode } = validatedInput;

        // 現在のユーザー情報取得
        const userData = await context.prisma.user.findUnique({
          where: { id: user.id },
          select: {
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });

        if (!userData) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 2FAが無効な場合はエラー
        if (!userData.twoFactorEnabled || !userData.twoFactorSecret) {
          throw new GraphQLError('2FAが有効化されていません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, userData.passwordHash);
        if (!isValidPassword) {
          throw new GraphQLError('パスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // TOTPコード検証
        const isValidTOTP = verifyTOTPCode(userData.twoFactorSecret, totpCode);
        if (!isValidTOTP) {
          throw new GraphQLError('認証コードが正しくありません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 新しいバックアップコード生成
        const backupCodes = await generateBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
          backupCodes.map((code: string) => hashBackupCode(code))
        );

        // データベース更新
        await context.prisma.user.update({
          where: { id: user.id },
          data: {
            backupCodes: hashedBackupCodes,
          },
        });

        return {
          codes: backupCodes,
          generatedAt: new Date(),
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, 'Backup codes regeneration error:');
        throw new GraphQLError('バックアップコード再生成でエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
