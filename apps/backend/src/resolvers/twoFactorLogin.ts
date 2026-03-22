/**
 * 🔐 2FA統合ログインリゾルバー
 */

import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { GraphQLContext } from '../graphql/context.js';

// 2FAログイン入力スキーマ
const TwoFactorLoginSchema = z.object({
  tempUserId: z.string().uuid('無効なユーザーIDです'),
  code: z
    .string()
    .min(6, 'コードは6桁以上である必要があります')
    .max(8, 'コードは8桁以下である必要があります')
    .regex(/^[A-Z0-9]+$/, 'コードは英数字のみである必要があります'),
});

export type TwoFactorLoginInput = z.infer<typeof TwoFactorLoginSchema>;

export const twoFactorLoginResolvers = {
  Mutation: {
    /**
     * 2FA認証完了ログイン
     */
    loginWithTwoFactor: async (
      _parent: unknown,
      { input }: { input: TwoFactorLoginInput },
      context: GraphQLContext
    ) => {
      try {
        // 入力検証
        const validatedInput = TwoFactorLoginSchema.parse(input);
        const { tempUserId, code } = validatedInput;

        // ユーザー情報取得
        const user = await context.prisma.user.findUnique({
          where: { id: tempUserId },
          select: {
            id: true,
            username: true,
            email: true,
            isActive: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            backupCodes: true,
          },
        });

        if (!user) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (!user.isActive) {
          throw new GraphQLError('アカウントが無効化されています', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        if (!user.twoFactorEnabled) {
          throw new GraphQLError('2FAが有効化されていません', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 2FA検証
        const verificationResult = await context.authService.verifyTwoFactor(user.id, code);
        if (!verificationResult.success) {
          const errorMessage = verificationResult.error?.message || '認証コードが正しくありません';
          throw new GraphQLError(errorMessage, {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 認証成功 - トークン生成
        const userPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
        } as const;

        // 最終ログイン時刻を更新
        await context.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Cookie認証システムでトークン生成
        const accessToken = await context.fastify.auth.generateAccessToken(userPayload);

        // Cookie設定
        if (context.reply) {
          context.fastify.auth.setAuthCookie(context.reply, accessToken);
        }

        // セキュリティログ記録
        context.fastify.log.info({
          userId: user.id,
          username: user.username,
          email: user.email,
          isBackupCode: verificationResult.isBackupCode,
          timestamp: new Date().toISOString(),
        }, '🔐 [2FA Login] 認証成功:');

        return {
          success: true,
          message: verificationResult.isBackupCode
            ? 'バックアップコードでログインしました'
            : 'ログインしました',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.username, // 基本的な表示名
            isVerified: false, // 簡略化
            isActive: user.isActive,
            createdAt: new Date(), // 簡略化
            updatedAt: new Date(), // 簡略化
            lastLoginAt: new Date(),
          },
          accessToken,
          requiresTwoFactor: false,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, '2FA login error:');
        throw new GraphQLError('2FAログインでエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
