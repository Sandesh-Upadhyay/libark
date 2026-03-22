#!/bin/bash

# 🧹 Docker自動クリーンアップスクリプト
# 本番環境用 - 安全なリソース管理

set -euo pipefail

# ログ設定
LOG_FILE="/var/log/docker-cleanup.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

# ディスク使用量チェック
check_disk_usage() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    log "現在のディスク使用率: ${usage}%"
    
    if [ "$usage" -gt 80 ]; then
        log "⚠️  警告: ディスク使用率が80%を超えています"
        return 1
    fi
    return 0
}

# Docker使用量確認
check_docker_usage() {
    log "=== Docker使用量確認 ==="
    docker system df
}

# 安全なクリーンアップ実行
safe_cleanup() {
    log "=== 安全なDockerクリーンアップ開始 ==="
    
    # 1. 停止中のコンテナを削除
    log "停止中のコンテナを削除中..."
    docker container prune -f
    
    # 2. 未使用のネットワークを削除
    log "未使用のネットワークを削除中..."
    docker network prune -f
    
    # 3. 未使用のイメージを削除（タグなしのみ）
    log "未使用のイメージを削除中..."
    docker image prune -f
    
    # 4. ビルドキャッシュの部分削除（古いもののみ）
    log "古いビルドキャッシュを削除中..."
    docker builder prune --filter until=24h -f
    
    log "✅ 安全なクリーンアップ完了"
}

# 緊急時の完全クリーンアップ
emergency_cleanup() {
    log "🚨 緊急クリーンアップ実行中..."
    
    # 本番環境では慎重に実行
    if [ "${ENVIRONMENT:-}" = "production" ]; then
        log "❌ 本番環境では緊急クリーンアップを無効化"
        return 1
    fi
    
    # 開発環境のみ
    docker system prune -a --volumes -f
    log "✅ 緊急クリーンアップ完了"
}

# メイン処理
main() {
    log "=== Dockerクリーンアップ開始 ==="
    
    # 事前チェック
    check_docker_usage
    
    # ディスク使用量に応じた処理
    if check_disk_usage; then
        log "通常のクリーンアップを実行"
        safe_cleanup
    else
        log "ディスク使用率が高いため、より積極的なクリーンアップを実行"
        safe_cleanup
        
        # 再チェック
        if ! check_disk_usage; then
            log "⚠️  緊急クリーンアップが必要です"
            emergency_cleanup
        fi
    fi
    
    # 結果確認
    check_docker_usage
    log "=== Dockerクリーンアップ完了 ==="
}

# 実行
main "$@"
