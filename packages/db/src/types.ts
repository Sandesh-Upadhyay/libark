/**
 * 🏆 @libark/db/types - 共通型定義
 *
 * ✅ Prismaスキーマから生成される型のみ
 * ✅ クライアント・サーバー共通で使用可能
 * ✅ 実行時依存なし
 */

// Prismaクライアントの型定義のみをエクスポート
export type {
  User,
  Post,
  Media,
  Comment,
  Like,
  Conversation,
  Message,
  Notification,
  UserSettings,
  PostVisibility,
  MediaStatus,
  MediaType,
  VariantType,
  MediaVariant,
  PostPurchase,
  NotificationType,
  // ウォレット関連の型
  Wallet,
  UserWallet,
  DepositRequest,
  WithdrawalRequest,
  WalletTransaction,
  ExchangeRate,
  TransactionType,
  TransactionStatus,
  DepositStatus,
  WithdrawalStatus,
  BalanceType,
  // 権限システム関連の型
  Permission,
  UserPermissionOverride,
  Role,
  RolePermission,
  // OGP関連の型
  OgpPublicMedia,
  Prisma,
  PrismaClient,
} from '@prisma/client';

// Prismaの型ヘルパー
export type { Prisma as PrismaNamespace } from '@prisma/client';
