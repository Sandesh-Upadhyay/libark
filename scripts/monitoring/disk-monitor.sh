#!/bin/bash

# 📊 ディスク使用量監視スクリプト
# 本番環境用 - アラート機能付き

set -euo pipefail

# 設定
ALERT_THRESHOLD=85  # アラート閾値（%）
CRITICAL_THRESHOLD=95  # 緊急閾値（%）
LOG_FILE="/var/log/disk-monitor.log"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# ログ関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Slack通知
send_slack_alert() {
    local message="$1"
    local level="$2"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="warning"
        [ "$level" = "critical" ] && color="danger"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"🚨 LIBARK ディスクアラート\",
                    \"text\": \"$message\",
                    \"footer\": \"$(hostname)\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# ディスク使用量チェック
check_disk_usage() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local available=$(df -h / | awk 'NR==2 {print $4}')
    
    log "ディスク使用率: ${usage}% (利用可能: ${available})"
    
    if [ "$usage" -ge "$CRITICAL_THRESHOLD" ]; then
        local msg="🔴 緊急: ディスク使用率が${usage}%に達しました！即座の対応が必要です。"
        log "$msg"
        send_slack_alert "$msg" "critical"
        
        # 緊急クリーンアップの実行
        log "緊急クリーンアップを実行します..."
        /opt/libark/scripts/maintenance/docker-cleanup.sh emergency
        
    elif [ "$usage" -ge "$ALERT_THRESHOLD" ]; then
        local msg="🟡 警告: ディスク使用率が${usage}%です。クリーンアップを検討してください。"
        log "$msg"
        send_slack_alert "$msg" "warning"
    fi
    
    return "$usage"
}

# Docker使用量詳細チェック
check_docker_detailed() {
    log "=== Docker詳細使用量 ==="
    
    # イメージ使用量
    local images_size=$(docker images --format "table {{.Size}}" | tail -n +2 | \
        sed 's/[^0-9.]//g' | awk '{sum += $1} END {print sum}')
    
    # ボリューム使用量
    local volumes_size=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" | \
        grep "Local Volumes" | awk '{print $3}' | sed 's/[^0-9.]//g')
    
    # ビルドキャッシュ使用量
    local cache_size=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" | \
        grep "Build Cache" | awk '{print $3}' | sed 's/[^0-9.]//g')
    
    log "Dockerイメージ: ${images_size:-0}GB"
    log "ボリューム: ${volumes_size:-0}GB"
    log "ビルドキャッシュ: ${cache_size:-0}GB"
    
    # 大きなボリュームの特定
    log "=== 大容量ボリューム TOP5 ==="
    docker system df -v | grep "Local Volumes" -A 20 | \
        tail -n +3 | sort -k3 -hr | head -5 | \
        while read line; do
            log "  $line"
        done
}

# メイン処理
main() {
    log "=== ディスク監視開始 ==="
    
    # 基本チェック
    check_disk_usage
    local disk_usage=$?
    
    # 詳細チェック（使用率が高い場合）
    if [ "$disk_usage" -ge 70 ]; then
        check_docker_detailed
    fi
    
    log "=== ディスク監視完了 ==="
}

# 実行
main "$@"
