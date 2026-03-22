#!/bin/bash

# 本番環境用Seedスクリプト実行シェル
# 使用方法: ./scripts/seed-production.sh

set -e

echo "🚀 本番環境用Seedスクリプトを実行します..."
echo "⚠️  注意: このスクリプトは本番環境のデータベースを変更します"
echo ""

# 確認プロンプト
read -p "本当に実行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 実行をキャンセルしました"
    exit 1
fi

echo ""
echo "📋 実行内容:"
echo "   - 権限システム構築 (permissions, role_permissions)"
echo "   - 管理者ユーザー作成/更新"
echo "   - サイト機能設定作成"
echo "   - 為替レート設定"
echo "   - 決済プロバイダー設定"
echo ""

# 最終確認
read -p "続行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 実行をキャンセルしました"
    exit 1
fi

echo ""
echo "🔄 Seedスクリプトを実行中..."

# TypeScriptファイルを直接実行
npx tsx prisma/seed.production.ts

echo ""
echo "✅ 本番環境用Seedスクリプトの実行が完了しました"
echo ""
echo "🔗 次のステップ:"
echo "   1. https://libark.io/admin でログイン確認"
echo "   2. サイト機能設定の動作確認"
echo "   3. ウォレット機能の動作確認"
echo ""
