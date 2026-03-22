# LIBARK Devcontainer

このディレクトリには、VSCode Devcontainer用の設定ファイルが含まれています。Devcontainerを使用すると、開発環境を簡単に構築し、チーム全体で一貫した開発環境を維持することができます。

## 使用方法

1. VSCodeとDocker Desktopをインストールします
2. VSCodeに[Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)拡張機能をインストールします
3. プロジェクトをVSCodeで開きます
4. コマンドパレット（`Ctrl+Shift+P` または `Cmd+Shift+P`）を開き、`Remote-Containers: Reopen in Container`を選択します
5. Devcontainerが構築され、VSCodeが自動的にコンテナ内で再起動します
6. 必要に応じて `make bootstrap` を実行して初期化します

## 機能

- Node.js 24
- pnpm パッケージマネージャー
- PostgreSQLデータベース
- 開発に必要なVSCode拡張機能
- 開発環境の設定（フォーマッタ、リンタなど）
- Context7 MCP（@upstash/context7-mcp）

## コマンド

Devcontainer内では、以下のコマンドを使用できます：

### フロントエンド開発

```bash
# ルートディレクトリで
cd apps/frontend
pnpm dev
```

### バックエンド開発

```bash
# ルートディレクトリで
cd apps/backend
pnpm dev
```

### データベース操作

```bash
# Prismaスキーマの生成
pnpm db:generate

# マイグレーション適用（初回セットアップ）
pnpm db:deploy

# データベースマイグレーション（開発時に新規作成する場合）
pnpm db:migrate

# 開発データ投入
pnpm db:seed

# Prisma Studioの起動
pnpm db:studio
```

## 環境変数

Devcontainer起動前にルートの`.env.template`から`.env.development`が自動作成されます。必要に応じて`.env.development`を編集してください。

## トラブルシューティング

### コンテナが起動しない場合

1. Docker Desktopが実行されていることを確認します
2. VSCodeを再起動し、もう一度試してください
3. コマンドパレットから`Remote-Containers: Rebuild Container`を実行してみてください

### 依存関係のインストールに失敗する場合

コンテナ内で以下のコマンドを実行してください：

```bash
pnpm -w install --force
pnpm approve-builds
```

### ホットリロードが機能しない場合

`.env.development`に以下の設定があることを確認してください：

```
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
```
