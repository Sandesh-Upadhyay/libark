#!/bin/sh

# ヘルスチェックスクリプト
# 各サービスの状態を確認し、すべて正常であれば0を返す

# Nginxゲートウェイのヘルスチェック
GATEWAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
if [ "$GATEWAY_STATUS" != "200" ]; then
  echo "ゲートウェイのヘルスチェックに失敗しました: $GATEWAY_STATUS"
  exit 1
fi

# バックエンドのヘルスチェック
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
if [ "$BACKEND_STATUS" != "200" ]; then
  echo "バックエンドのヘルスチェックに失敗しました: $BACKEND_STATUS"
  exit 1
fi

# フロントエンドのヘルスチェック
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
if [ "$FRONTEND_STATUS" != "200" ]; then
  echo "フロントエンドのヘルスチェックに失敗しました: $FRONTEND_STATUS"
  exit 1
fi

# すべてのサービスが正常に動作している
echo "すべてのサービスが正常に動作しています"
exit 0
