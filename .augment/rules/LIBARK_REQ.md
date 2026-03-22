---
type: 'always_apply'
description: 'ターミナル操作をするときに確認してください。'
---

# LIBARK 作業手順ガイド

## 🗃️ データベース操作

### PostgreSQL接続

```bash
# Docker経由でPostgreSQLに接続
docker-compose exec postgres psql -U libark_db_admin -d libark_db

# 直接接続（ローカルからDocker PostgreSQLへ）
psql -h localhost -p 5432 -U libark_db_admin -d libark_db
```

### Prisma操作

```bash
# Prismaクライアント生成
docker-compose exec dev pnpm db:generate

# マイグレーション実行
docker-compose exec dev pnpm db:migrate

# データベース完全初期化（全データ削除）
docker-compose exec dev sh -c "cd /workspace/packages/db && pnpm prisma migrate reset --force"

# Prisma Studio（http://localhost:5555で自動起動中）
# 手動起動する場合: docker-compose exec dev pnpm db:studio
```

## 📦 パッケージ管理

### 依存関係インストール

```bash
# プロジェクト全体の依存関係インストール
docker-compose exec dev sh -c "cd /workspace && pnpm install"

# 特定パッケージの依存関係追加
docker-compose exec dev sh -c "cd /workspace && pnpm add <package> --filter <workspace>"
# 例: docker-compose exec dev sh -c "cd /workspace && pnpm add zod --filter @libark/core"
# 例: docker-compose exec dev sh -c "cd /workspace && pnpm add @fastify/cookie --filter @libark/s3-gateway"

# 重要:
# - 必ずDocker Composeのdevサービスを使用する
# - ワークスペースルート(/workspace)で実行する
# - --filterオプションでワークスペース名を指定する
# - ワークスペース名は@libark/で始まる（例: @libark/s3-gateway, @libark/core）
```

### ビルド

```bash
# 全体ビルド（Turbo推奨）
docker-compose exec dev pnpm turbo build

# 特定パッケージのみビルド
docker-compose exec dev pnpm turbo build --filter=@libark/core

# 強制ビルド（キャッシュ無視）
docker-compose exec dev pnpm turbo build --force

# 本番環境用ビルド（Backend/Worker）
docker-compose exec backend sh -c "cd /app && pnpm turbo build --filter=@libark/core --filter=@libark/cache --filter=@libark/redis-client"
```

### TypeScript distファイル生成問題の解決

```bash
# 問題: distディレクトリが生成されない、.jsファイルが見つからない

# 解決手順1: TypeScript設定確認
# tsconfig.jsonに以下が含まれているか確認:
# - "declaration": true
# - "declarationMap": true
# - "sourceMap": true
# - "skipLibCheck": true

# 解決手順2: ビルドファイルクリーンアップ
docker-compose exec backend sh -c "cd /app/packages/core && rm -rf dist .tsbuildinfo"

# 解決手順3: TypeScriptコンパイラ直接実行
docker-compose exec backend sh -c "cd /app/packages/core && npx tsc --build"

# 解決手順4: 強制ビルド（全パッケージ）
docker-compose exec backend sh -c "cd /app && pnpm turbo build --filter=@libark/core --filter=@libark/cache --filter=@libark/redis-client --force"

# 解決手順5: サービス再起動
docker-compose restart backend worker

# 確認: distファイル生成確認
docker-compose exec backend sh -c "ls -la /app/packages/core/dist/config/index.*"
docker-compose exec backend sh -c "ls -la /app/packages/core/dist/events/index.*"
```

## 🗄️ 統一キャッシュシステム

### キャッシュパッケージ管理

```bash
# 新しい統一キャッシュパッケージのビルド
docker-compose exec backend sh -c "cd /app && pnpm --filter @libark/cache build"

# キャッシュ設定の確認
docker-compose exec backend sh -c "cd /app && grep -r CACHE_ .env*"

# キャッシュシステムのテスト
docker-compose exec backend sh -c "cd /app/packages/cache && pnpm test"
```

### レガシーキャッシュからの移行

```bash
# レガシーRedisDistributedCacheの確認
docker-compose exec backend sh -c "cd /app && pnpm --filter @libark/redis-client build"

# 互換性アダプターの動作確認
docker-compose logs backend | grep -i "cache\|redis"

# 統一キャッシュシステムへの完全移行後のクリーンアップ
# 注意: 後方互換性が不要になった場合のみ実行
# docker-compose exec backend sh -c "cd /app && rm -f packages/redis-client/src/distributed-cache.ts"
```

## 🔍 ログ確認

### コンテナログ

```bash
# フロントエンドログ
docker-compose logs -f frontend

# バックエンドログ
docker-compose logs -f backend

# S3 Gatewayログ
docker-compose logs -f s3-gateway

# ワーカーログ
docker-compose logs -f worker

# キャッシュ関連ログのフィルタリング
docker-compose logs backend | grep -i "cache\|redis"
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. TypeScriptビルドエラー

```bash
# 基本的なビルドエラー
docker-compose exec dev rm -rf packages/*/dist && pnpm turbo build

# distファイルが生成されない場合
docker-compose exec backend sh -c "cd /app/packages/core && rm -rf dist .tsbuildinfo && npx tsc --build"

# モジュールが見つからないエラー
docker-compose exec backend sh -c "cd /app && pnpm install && pnpm turbo build --force"
```

#### 2. パッケージ依存関係エラー

```bash
# 依存関係の再インストール
docker-compose exec dev pnpm install && pnpm turbo build

# ワークスペース依存関係の問題
docker-compose exec dev sh -c "cd /workspace && pnpm install --frozen-lockfile=false"

# 新しいパッケージ追加後のビルドエラー
docker-compose exec dev pnpm turbo build --filter=@libark/cache --filter=@libark/core --filter=@libark/redis-client
```

#### 3. Docker関連問題

```bash
# コンテナ再構築
docker-compose down && docker-compose up -d --build

# ボリューム含む完全リセット
docker-compose down -v && docker-compose up -d

# 特定サービスの再起動
docker-compose restart backend worker
```

#### 4. キャッシュシステム関連エラー

```bash
# 統一キャッシュシステムのビルドエラー
docker-compose exec backend sh -c "cd /app && pnpm --filter @libark/cache build"

# レガシーキャッシュとの互換性問題
docker-compose exec backend sh -c "cd /app && pnpm --filter @libark/redis-client build"

# キャッシュ設定エラー
docker-compose logs backend | grep -i cache
```

### 環境リセット

```bash
# 完全リセット（データベース含む）
docker-compose down -v && docker-compose up -d

# 開発環境再構築
docker-compose down && docker-compose up -d --build

# DB初期化エラー時の完全復旧手順
# 1. 環境完全リセット
docker-compose down -v && docker-compose up -d
# 2. DB強制リセット（全データ削除・シード実行）
docker-compose exec dev sh -c "cd /workspace/packages/db && pnpm prisma migrate reset --force"
# 3. Prismaクライアント再生成
docker-compose exec dev pnpm db:generate
```
