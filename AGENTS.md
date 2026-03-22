# AGENTS.md

## 目的

このリポジトリで実装・修正を行うエージェント（人/AI）が、同じ前提と手順で開発できるようにするガイドです。
特に Docker 前提の開発フローと、依存関係・Prisma の取り扱いを統一します。

## コード検索 / 調査（必須）

- プロジェクト内のコード検索・調査は `Augment codebase retrieval tool` を優先して実施する。
- 対象例: 仕様の所在確認、既存実装参照、影響範囲調査、類似実装探索。
- 原則として `grep` / `ripgrep` のみで完結させない。

## 実行環境

- プロジェクトは Docker 上で実行する。
- ローカル編集は許可するが、依存関係インストールや生成処理（Prisma など）は Docker 内で実行する。
- 環境変数は `.env.template` を基に `.env.development`（開発）/`.env.production`（本番）を使用する。

## 依存関係（pnpm）

### 依存を追加・更新した場合（必須）

```bash
docker-compose exec dev pnpm install
```

### 依存の通常インストール

```bash
docker-compose exec dev pnpm install
```

- ホスト側で `pnpm install` を実行しない（ロック差分・生成物差分・実行環境差分の原因になる）。

## Prisma（必須）

- `prisma generate` は必ず Docker 内で実行する。

```bash
docker-compose exec dev pnpm prisma generate
# または運用コマンドに合わせて:
# docker-compose exec dev pnpm -w prisma generate
```

- スキーマ変更を伴う作業では、`generate` 実行を手順に必ず含める。

## よくある作業コマンド

### dev コンテナに入る

```bash
docker-compose exec dev bash
```

### 依存追加（例）

```bash
docker-compose exec dev pnpm add <pkg>
# 追加・更新後は必ず
docker-compose exec dev pnpm install
```

### Prisma generate

```bash
docker-compose exec dev pnpm prisma generate
```

## トラブルシューティング（必須）

### `@libark/core-shared` の `dist` 未生成でテストが落ちる場合

#### 事象

- `Failed to resolve entry for package "@libark/core-shared"`
- `dist/index.js` が存在しない
- テスト時にモジュール解決エラーが発生

#### 原因

- TypeScript incremental build の `tsconfig.tsbuildinfo` が残り、ビルドが誤ってスキップされる。

#### 対処手順（Docker 内で実行）

```bash
# 1) tsconfig.tsbuildinfo を削除
docker-compose exec dev rm packages/core-shared/tsconfig.tsbuildinfo

# 2) core-shared をビルド
docker-compose exec dev pnpm --filter @libark/core-shared build

# 3) dist の生成確認
docker-compose exec dev ls -la packages/core-shared/dist

# 4) テスト実行
docker-compose exec dev pnpm test
```

#### 補足

- incremental build は `tsconfig.tsbuildinfo` を基準に差分判定する。
- Docker 内で実行することで Node.js / TypeScript などの環境差分を回避できる。

## 変更時のチェック（推奨）

- 依存追加・更新を行ったら `pnpm install` を Docker 内で実行する。
- Prisma を使う変更では `prisma generate` を Docker 内で実行する。
- 影響範囲が広い場合は、関連テスト・ビルドを Docker 内で実行して確認する。
