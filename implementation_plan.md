# 実装計画: カバレッジ向上と不足したテストの追加

## 概要
`node scripts/coverage-report.cjs` の実行結果に基づき、テストカバレッジが不足しているバックエンドのリゾルバーに対して統合テストを追加します。

## 対象ファイル
- **Admin Resolver (`apps/backend/src/resolvers/admin.ts`)** (完了)
- **Notification Resolver (`apps/backend/src/resolvers/notification.ts`)** (完了)
- **Comment Resolver (`apps/backend/src/resolvers/comment.ts`)** (完了)
- **Message Resolver (`apps/backend/src/resolvers/message.ts`)** (完了)
- **P2P Resolver (`apps/backend/src/resolvers/p2p.ts`)** (完了)
- **Wallet Resolver (`apps/backend/src/resolvers/wallet.ts`)** (完了)
  - `myWallet`: ウォレット情報取得 (自動作成含む)
  - `myWalletTransactions`: 取引履歴取得
  - `registerUserWallet`: 外部ウォレット登録
  - `createDepositRequest`: 入金申請作成
  - `transferBalance`: 残高移動 (WALLET, SALES, P2P間)
- **Site Features Resolver (`apps/backend/src/resolvers/site-features.ts`)** (新規ターゲット)
  - `siteFeatureSettings`: 機能設定一覧取得
  - `updateSiteFeature`: 機能設定更新
  - `featureFlags`: 機能フラグ一括取得

## Prisma Client の修正計画
`Prisma Client` の生成エラーを解消するために、以下の手順を試行します：
1. `node_modules` の完全なクリーンアップと再インストール。
2. `prisma generate` をルートディレクトリから明示的なパス指定で実行。
3. `MessageRead` モデルの認識を確認。

## 新規作成・更新テストファイル
- `apps/backend/src/resolvers/__tests__/admin.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/notification.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/comment.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/message.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/p2p.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/wallet.integration.test.ts` (完了)
- `apps/backend/src/resolvers/__tests__/site-features.integration.test.ts` (完了)

## 実行手順
1. `apps/backend/src/resolvers/__tests__/site-features.integration.test.ts` を作成・実行。
2. `pnpm test src/resolvers/__tests__/site-features.integration.test.ts` で成功を確認。
3. `pnpm test src/resolvers/__tests__/*.integration.test.ts` で全テストの成功を確認。
5. `node scripts/coverage-report.cjs` でカバレッジ向上を確認。
