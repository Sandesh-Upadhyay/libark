/**
 * 🔐 GraphQL認証リゾルバー
 *
 * Cookie認証専用のシンプルな認証システム
 */

import { GraphQLError } from 'graphql';
import { verifyPassword, hashPassword } from '@libark/core-server/security/password';
import type { User } from '@libark/db';
import { UserCreateSchema, LoginSchema } from '@libark/core-shared';
import { detectUserTimezone, extractClientIP } from '@libark/core-shared';
import { z } from 'zod';

import { GraphQLContext } from '../graphql/context.js';

// 🎯 Zodスキーマを使用した入力型定義
export type LoginInput = z.infer<typeof LoginSchema>;

// RegisterInput型を拡張（タイムゾーン情報を含む）
const RegisterInputSchema = UserCreateSchema.extend({
  timezone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

// レスポンス型定義
export interface AuthPayload {
  success: boolean;
  message: string;
  user?: Pick<
    User,
    | 'id'
    | 'username'
    | 'email'
    | 'displayName'
    | 'bio'
    | 'profileImageId'
    | 'coverImageId'
    | 'roleId'
    | 'isVerified'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
    | 'lastLoginAt'
  >;
  accessToken?: string;
  requiresTwoFactor?: boolean;
  tempUserId?: string;
}

/**
 * 認証成功レスポンス作成
 */
function createAuthSuccessResponse(user: User, accessToken: string, message: string): AuthPayload {
  return {
    success: true,
    message,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      profileImageId: user.profileImageId,
      coverImageId: user.coverImageId,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roleId: user.roleId,

      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    },
    accessToken,
  };
}

export const authResolvers = {
  Query: {
    /**
     * 現在のユーザー情報取得
     */
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      // デバッグログ追加
      context.fastify.log.info(
        {
          hasUser: !!context.user,
          userId: context.user?.id,
          userEmail: context.user?.email,
        } as unknown,
        '🔍 [GraphQL me] 認証状況:'
      );

      if (!context.user) {
        context.fastify.log.warn('🔐 [GraphQL me] 認証されていないユーザー');
        return null;
      }

      const user = await context.prisma.user.findUnique({
        where: { id: context.user.id },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          bio: true,
          profileImageId: true,
          coverImageId: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      context.fastify.log.info(
        {
          found: !!user,
          email: user?.email,
        } as unknown,
        '✅ [GraphQL me] ユーザー情報取得:'
      );

      return user;
    },
  },

  Mutation: {
    /**
     * 🚪 ログイン
     */
    login: async (
      _parent: unknown,
      { input }: { input: LoginInput },
      context: GraphQLContext
    ): Promise<AuthPayload> => {
      try {
        // Zodバリデーション
        const validatedInput = LoginSchema.parse(input);
        const { email, password } = validatedInput;

        // ユーザー検索（ユーザー名またはメールアドレス）
        const user = await context.prisma.user.findFirst({
          where: {
            OR: [{ email }, { username: email }],
          },
        });

        if (!user) {
          throw new GraphQLError('メールアドレスまたはパスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          throw new GraphQLError('メールアドレスまたはパスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        if (!user.isActive) {
          throw new GraphQLError('アカウントが無効化されています', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // 2FA確認（有効な場合）
        if (user.twoFactorEnabled) {
          // 2FAが有効な場合は、まず第一段階の認証成功を返す
          // フロントエンドで2FA認証画面を表示する
          return {
            success: false,
            message: '二要素認証が必要です',
            user: undefined,
            accessToken: undefined,
            requiresTwoFactor: true,
            tempUserId: user.id, // 一時的なユーザーID（2FA検証用）
          };
        }

        // 認証用の最小フィールド
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

        context.fastify.log.info(
          { username: user.username } as unknown,
          '✅ GraphQL ログイン成功:'
        );

        return createAuthSuccessResponse(user, accessToken, 'ログインに成功しました');
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn(
            {
              errors: error.errors,
              input,
            } as unknown,
            '❌ GraphQL ログインバリデーションエラー:'
          );

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify.log.error(
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            input: { email: input.email }, // パスワードは除外
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            timestamp: new Date().toISOString(),
          } as unknown,
          '❌ GraphQL ログインエラー:'
        );
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('ログイン処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 📝 ユーザー登録
     */
    register: async (
      _parent: unknown,
      { input }: { input: RegisterInput },
      context: GraphQLContext
    ): Promise<AuthPayload> => {
      try {
        // Zodバリデーション（拡張されたスキーマを使用）
        context.fastify.log.info(
          { stage: 'validation' } as unknown,
          '🔧 ユーザー登録: 入力値バリデーション開始'
        );
        const validatedInput = RegisterInputSchema.parse(input);
        const {
          username,
          email,
          password,
          displayName,
          timezone: browserTimezone,
        } = validatedInput;
        context.fastify.log.info({ username, email } as unknown, '✅ 入力値バリデーション完了');

        // 既存ユーザーチェック
        context.fastify.log.info(
          { username, email } as unknown,
          '🔧 ユーザー登録: 既存ユーザー確認中'
        );
        const existingUser = await context.prisma.user.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        });

        if (existingUser) {
          if (existingUser.email === email) {
            context.fastify.log.warn({ email } as unknown, '⚠️ メールアドレス既に使用済み');
            throw new GraphQLError('このメールアドレスは既に使用されています', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
          if (existingUser.username === username) {
            context.fastify.log.warn({ username } as unknown, '⚠️ ユーザー名既に使用済み');
            throw new GraphQLError('このユーザー名は既に使用されています', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
        }
        context.fastify.log.info(
          { username, email } as unknown,
          '✅ 既存ユーザー確認完了（新規OK）'
        );

        // パスワードをハッシュ化
        context.fastify.log.info(
          { stage: 'password_hashing' } as unknown,
          '🔧 ユーザー登録: パスワードハッシュ化中'
        );
        const saltRounds = 12;
        const passwordHash = await hashPassword(password, { saltRounds });
        context.fastify.log.info('✅ パスワードハッシュ化完了');

        // ユーザー作成
        context.fastify.log.info(
          { username, email } as unknown,
          '🔧 ユーザー登録: ユーザーレコード作成中'
        );
        const user = await context.prisma.user.create({
          data: {
            username,
            email,
            passwordHash,
            displayName: displayName || username,
            isVerified: false,
            isActive: true,
            lastLoginAt: new Date(),
          },
        });
        context.fastify.log.info(
          { userId: user.id, username, email } as unknown,
          '✅ ユーザーレコード作成完了'
        );

        // タイムゾーン自動検出
        context.fastify.log.info(
          { browserTimezone, stage: 'timezone_detection' } as unknown,
          '🔧 ユーザー登録: タイムゾーン検出中'
        );
        const clientIP = extractClientIP(
          context.request?.headers ?? ({} as Record<string, string | string[] | undefined>)
        );
        let detectedTimezone: string;
        try {
          detectedTimezone = await detectUserTimezone({
            browserTimezone,
            ipAddress: clientIP || undefined,
            // TODO: 必要に応じてIPGeolocation APIキーを設定
            // apiKey: process.env.IPGEOLOCATION_API_KEY,
          });
          context.fastify.log.info(
            {
              detectedTimezone,
              browserTimezone,
              clientIP,
            } as unknown,
            '✅ タイムゾーン検出完了'
          );
        } catch (tzError) {
          context.fastify.log.warn(
            {
              error: tzError instanceof Error ? tzError.message : String(tzError),
              browserTimezone,
              clientIP,
            } as unknown,
            '⚠️ タイムゾーン検出エラー - デフォルト値を使用'
          );
          // デフォルト値をフォールバック
          detectedTimezone = 'Asia/Tokyo';
        }

        const userPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
        } as const;

        // ユーザー設定を作成（検出されたタイムゾーンを使用）
        context.fastify.log.info(
          { userId: user.id, stage: 'user_settings_creation' } as unknown,
          '🔧 ユーザー登録: ユーザー設定レコード作成中'
        );
        try {
          await context.prisma.userSettings.create({
            data: {
              userId: user.id,
              theme: 'system',
              animationsEnabled: true,
              locale: 'ja',
              contentFilter: 'all',
              displayMode: 'card',
              timezone: detectedTimezone,
            },
          });
          context.fastify.log.info(
            {
              userId: user.id,
              timezone: detectedTimezone,
            } as unknown,
            '✅ ユーザー設定レコード作成完了'
          );
        } catch (settingsError) {
          // ユーザー設定作成失敗時は詳細ログ
          const settingsErr = settingsError as any;
          context.fastify.log.error(
            {
              userId: user.id,
              errorType: settingsErr?.constructor?.name,
              prismaCode: settingsErr?.code,
              prismaMeta: settingsErr?.meta,
              message:
                settingsError instanceof Error ? settingsError.message : String(settingsError),
              stage: 'user_settings_creation_failed',
            } as unknown,
            '❌ ユーザー設定作成エラー:'
          );
          throw new GraphQLError('ユーザー設定の作成に失敗しました', {
            extensions: {
              code: 'SETTINGS_CREATION_ERROR',
              details:
                settingsError instanceof Error ? settingsError.message : String(settingsError),
            },
          });
        }

        // Cookie認証システムでトークン生成
        context.fastify.log.info(
          { userId: user.id, stage: 'token_generation' } as unknown,
          '🔧 ユーザー登録: アクセストークン生成中'
        );
        const accessToken = await context.fastify.auth.generateAccessToken(userPayload);
        context.fastify.log.info('✅ アクセストークン生成完了');

        // Cookie設定
        context.fastify.log.info(
          { stage: 'cookie_setting' } as unknown,
          '🔧 ユーザー登録: 認証Cookie設定中'
        );
        if (context.reply) {
          context.fastify.auth.setAuthCookie(context.reply, accessToken);
          context.fastify.log.info('✅ 認証Cookie設定完了');
        } else {
          context.fastify.log.warn('⚠️ Replyオブジェクトが利用できないためCookie設定をスキップ');
        }

        context.fastify.log.info(
          { userId: user.id, username, email, stage: 'registration_complete' } as unknown,
          '✅ GraphQL ユーザー登録成功（全ステップ完了）'
        );
        return createAuthSuccessResponse(user, accessToken, 'ユーザー登録に成功しました');
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn(
            {
              errors: error.errors,
              input: { username: input.username, email: input.email },
              stage: 'validation_error',
            } as unknown,
            '❌ GraphQL 登録バリデーションエラー:'
          );

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        const err = error as any;
        context.fastify.log.error(
          {
            errorType: err?.constructor?.name,
            prismaCode: err?.code,
            prismaMeta: err?.meta,
            message: error instanceof Error ? error.message : String(error),
            extensionsCode: err?.extensions?.code,
            input: {
              username: input.username,
              email: input.email,
              hasPassword:
                typeof (input as any).password === 'string' && (input as any).password.length > 0,
              displayName: input.displayName,
            },
            timestamp: new Date().toISOString(),
          } as unknown,
          '❌ GraphQL 登録エラー:'
        );

        if (error instanceof GraphQLError) throw error;

        // Prisma の既知エラーをわかりやすく返す（フロントのデバッグにも有効）
        if (err?.code === 'P1000') {
          throw new GraphQLError('データベース認証に失敗しました', {
            extensions: { code: 'DB_AUTH_FAILED' },
          });
        }
        if (err?.code === 'P2002') {
          throw new GraphQLError('入力値が既に使用されています', {
            extensions: { code: 'DUPLICATE' },
          });
        }
        if (err?.code === 'P1001') {
          throw new GraphQLError('データベース接続がタイムアウトしました', {
            extensions: { code: 'DB_TIMEOUT' },
          });
        }

        throw new GraphQLError('ユーザー登録処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 🚪 ログアウト
     */
    logout: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string }> => {
      try {
        // Cookie削除
        if (context.reply) {
          context.fastify.auth.clearAuthCookies(context.reply);
        }

        context.fastify.log.info('✅ GraphQL ログアウト成功');

        return {
          success: true,
          message: 'ログアウトしました',
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ GraphQL ログアウトエラー:');
        throw new GraphQLError('ログアウト処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
