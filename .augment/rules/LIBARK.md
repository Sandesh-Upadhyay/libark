---
type: 'always_apply'
---

# LIBARK プロジェクト基本情報

## 🐳 開発環境

- **Docker環境必須**: すべての開発作業はDocker環境で実行
- **Nginxプロキシ**: http://localhost でアクセス（ポート直接アクセス不要）
- **ホットリロード対応**: フロントエンド・バックエンド・ワーカーは自動リロード
- **ローカルDB禁止**: Docker PostgreSQLのみ使用

## 🌐 アクセスURL

- **フロントエンド**: http://localhost/home
- **バックエンド**: http://localhost:8000
- **GraphQL**: http://localhost:8000/graphiql
- **S3 Gateway**: http://localhost:8001（Nginx経由でアクセス）
- **Prisma Studio**: http://localhost:5555

## 📦 重要な制約

- **共通パッケージ編集時**: 必ずTurboビルドが必要
- **パッケージ管理**: Docker上でpnpmを使用
- **ビルドシステム**: Turboを使用
- **S3アクセス**: 必ずS3 Gateway経由（直接R2アクセス禁止）
- **S3Gateway**: S3ゲートウェイは透過的にR2に接続するためだけに使用。アプリロジックは持たせない。

## 🔐 セキュリティ

- **画像暗号化**: すべての画像はCloudflare R2で暗号化保存
- **認証統一**: useAuth()フックのみ使用
- **プロキシパターン**: S3 Gatewayで透明な暗号化・復号化

## 🎨 UI統一

- **スタイル**: Radix UI + Tailwind CSSによる統一スタイル
- **コンポーネント**: Atomic Design原則に基づく統一されたスタイリング
- **レスポンシブ**: モバイルファーストレイアウト

その他不明点は以下のガイドを確認してください。
docs/ai-dev/quick-reference.md
