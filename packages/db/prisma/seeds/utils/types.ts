/**
 * 共通型定義
 * シードスクリプト全体で使用される型を定義
 */

import type { Prisma } from '@prisma/client';

// Prisma Clientから型を取得
export type User = Prisma.UserGetPayload<{}>;
export type Post = Prisma.PostGetPayload<{}>;
export type Comment = Prisma.CommentGetPayload<{}>;
export type Like = Prisma.LikeGetPayload<{}>;
export type ExchangeRate = Prisma.ExchangeRateGetPayload<{}>;
export type Media = Prisma.MediaGetPayload<{}>;
export type PaymentProvider = Prisma.PaymentProviderGetPayload<{}>;
export type TransactionType = Prisma.TransactionType;
export type TransactionStatus = Prisma.TransactionStatus;
export type DepositStatus = Prisma.DepositStatus;
export type WithdrawalStatus = Prisma.WithdrawalStatus;
export type MediaType = Prisma.MediaType;
export type MediaStatus = Prisma.MediaStatus;
export type VariantType = Prisma.VariantType;
export type ProviderType = Prisma.ProviderType;
export type RequestType = Prisma.RequestType;
export type PaymentMethod = Prisma.PaymentMethod;
export type RequestStatus = Prisma.RequestStatus;
export type P2PTradeStatus = Prisma.P2PTradeStatus;
export type P2PPaymentMethodType = Prisma.P2PPaymentMethodType;
export type BalanceType = Prisma.BalanceType;

// ユーザー作成用のデータ型
export interface UserData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio: string;
  role?: string;
}

// 管理者ユーザー作成用のデータ型
export interface AdminUserData extends UserData {
  role: 'ADMIN';
}

// 通貨データ型
export interface CurrencyData {
  currency: string;
  network: string;
  name: string;
}

// 為替レートデータ型
export interface ExchangeRateData {
  currency: string;
  usdRate: number;
}

// 決済プロバイダーデータ型
export interface PaymentProviderData {
  name: string;
  displayName: string;
  type: ProviderType;
  config: Record<string, unknown>;
}

// ロールデータ型
export interface RoleData {
  name: string;
  description: string;
}

// 権限データ型
export interface PermissionData {
  name: string;
  description: string;
}

// サイト機能設定データ型
export interface SiteFeatureData {
  featureName: string;
  isEnabled: boolean;
  description: string;
}

// シード実行結果型
export interface SeedResult<T = unknown> {
  success: boolean;
  data?: T[];
  count?: number;
  error?: Error;
  message?: string;
}

// シーダー設定型
export interface SeederConfig {
  clearDatabase?: boolean;
  skipExisting?: boolean;
  batchSize?: number;
  logProgress?: boolean;
}

// 取引説明文の型
export interface TransactionDescriptions {
  DEPOSIT: string[];
  WITHDRAWAL: string[];
  PAYMENT: string[];
  RECEIVE: string[];
}

// P2P取引データ型
export interface P2PTradeData {
  buyerUsername: string;
  sellerUsername: string;
  amountUsd: number;
  fiatCurrency: string;
  exchangeRate: number;
  status: P2PTradeStatus;
  paymentMethod?: P2PPaymentMethodType;
  paymentDetails?: string;
  escrowAmount?: number;
  expiresAt?: Date;
  completedAt?: Date;
}

// P2P売り手オファーデータ型
export interface P2PSellerOfferData {
  sellerUsername: string;
  minAmountUsd: number;
  maxAmountUsd: number;
  fiatCurrency: string;
  exchangeRateMargin: number;
  paymentMethods: P2PPaymentMethodType[];
  isActive: boolean;
}
