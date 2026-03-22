/**
 * 🎯 GraphQLスキーマ定義 - 分割されたスキーマファイルの統合
 *
 * 各機能別に分割されたGraphQLスキーマファイルを読み込み、統合する
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESMでの__dirnameの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 分割されたスキーマファイルを読み込み
const baseSchema = readFileSync(join(__dirname, 'base.graphql'), 'utf-8');
const userSchema = readFileSync(join(__dirname, 'user.graphql'), 'utf-8');
const postSchema = readFileSync(join(__dirname, 'post.graphql'), 'utf-8');
const walletSchema = readFileSync(join(__dirname, 'wallet.graphql'), 'utf-8');
const notificationSchema = readFileSync(join(__dirname, 'notification.graphql'), 'utf-8');
const messageSchema = readFileSync(join(__dirname, 'message.graphql'), 'utf-8');
const adminSchema = readFileSync(join(__dirname, 'admin.graphql'), 'utf-8');
const cacheSchema = readFileSync(join(__dirname, 'cache.graphql'), 'utf-8');
const operationsSchema = readFileSync(join(__dirname, 'operations.graphql'), 'utf-8');
const mediaSchema = readFileSync(join(__dirname, 'media.graphql'), 'utf-8');
const siteFeaturesSchema = readFileSync(join(__dirname, 'site-features.graphql'), 'utf-8');
const twoFactorSchema = readFileSync(join(__dirname, 'twoFactor.graphql'), 'utf-8');
const p2pSchema = readFileSync(join(__dirname, 'p2p.graphql'), 'utf-8');

// 統一メディアシステムの型定義（Phase 2）
const unifiedMediaTypeDefs = `
  input UnifiedUploadInput {
    filename: String!
    contentType: String!
    size: Int!
    mediaType: MediaType!
    fileData: String!
  }

  type UnifiedUploadResponse {
    success: Boolean!
    mediaId: String!
    filename: String!
    contentType: String!
    size: Int!
    downloadUrl: String!
    status: MediaStatus!
    message: String
  }

  extend type Mutation {
    uploadMediaUnified(input: UnifiedUploadInput!): UnifiedUploadResponse!
  }
`;

/**
 * 🎯 統合されたGraphQLスキーマ定義
 *
 * 分割されたスキーマファイルを統合して、完全なGraphQLスキーマを構築
 */
export const typeDefs = `#graphql
  # 基本型定義（スカラー型、列挙型、ページネーション）
  ${baseSchema}

  # GraphQL操作定義（Query、Mutation、Subscription）- 最初に定義
  ${operationsSchema}

  # ユーザー関連スキーマ
  ${userSchema}

  # 投稿関連スキーマ
  ${postSchema}

  # ウォレット関連スキーマ
  ${walletSchema}

  # 通知関連スキーマ
  ${notificationSchema}

  # メッセージ関連スキーマ
  ${messageSchema}

  # 管理者機能スキーマ
  ${adminSchema}

  # キャッシュ統計スキーマ
  ${cacheSchema}

  # サイト機能管理スキーマ
  ${siteFeaturesSchema}

  # 2FA関連スキーマ
  ${twoFactorSchema}

  # P2P取引関連スキーマ
  ${p2pSchema}

  # メディア関連スキーマ（既存）
  ${mediaSchema}

  # 統一メディアシステム（Phase 2）
  ${unifiedMediaTypeDefs}
`;
