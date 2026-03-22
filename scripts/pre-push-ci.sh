#!/bin/bash

# 🚀 LIBARK Pre-push CI Validation
# GitHub Actions CIと同等のテストを実行
# 本番環境へのプッシュ前に完全な品質チェックを実施

set -euo pipefail

# 対話的な確認を無効化
export CI=true
export PNPM_DISABLE_INTERACTIVE=true

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BOLD}${PURPLE}[STEP $1]${NC} $2"
}

# Docker環境チェック
check_docker_environment() {
    if [ -f /.dockerenv ] || [ "${DOCKER_CONTAINER:-}" = "true" ]; then
        echo "docker"
    else
        echo "host"
    fi
}

# コマンド実行関数
execute_command() {
    local description="$1"
    local command="$2"
    local environment=$(check_docker_environment)

    log_info "Executing: $description"

    if [ "$environment" = "docker" ]; then
        # Docker内で実行
        if eval "$command"; then
            log_success "$description: PASSED"
            return 0
        else
            log_error "$description: FAILED"
            return 1
        fi
    else
        # ホスト環境からDocker Compose経由で実行
        if docker compose exec -T dev bash -c "$command"; then
            log_success "$description: PASSED"
            return 0
        else
            log_error "$description: FAILED"
            return 1
        fi
    fi
}

# メイン実行
main() {
    log_info "🚀 Starting LIBARK Pre-push CI Validation..."
    log_info "📋 Executing GitHub Actions CI equivalent tests..."

    echo "=================================================="
    echo "🧪 LIBARK PRE-PUSH CI VALIDATION"
    echo "=================================================="

    local start_time=$(date +%s)
    local step_count=0

    # Step 1: 依存関係インストール
    step_count=$((step_count + 1))
    log_step "$step_count" "Install Dependencies"
    if ! execute_command "Install dependencies" "CI=true pnpm install --frozen-lockfile --prefer-offline --silent"; then
        exit 1
    fi

    # Step 2: Prismaクライアント生成
    step_count=$((step_count + 1))
    log_step "$step_count" "Generate Prisma Client"
    if ! execute_command "Generate Prisma Client" "cd packages/db && pnpm prisma generate"; then
        exit 1
    fi

    # Step 3: パッケージビルド
    step_count=$((step_count + 1))
    log_step "$step_count" "Build Packages"
    if ! execute_command "Build packages" "pnpm build:libs"; then
        exit 1
    fi

    # Step 4: テスト実行
    step_count=$((step_count + 1))
    log_step "$step_count" "Run Tests"
    if ! execute_command "Run tests" "SKIP_DB_RESET=true pnpm test"; then
        exit 1
    fi

    # Step 5: TypeScript型チェック
    step_count=$((step_count + 1))
    log_step "$step_count" "TypeScript Type Check"
    if ! execute_command "TypeScript type check" "pnpm type-check"; then
        exit 1
    fi

    # Step 6: ESLint
    step_count=$((step_count + 1))
    log_step "$step_count" "ESLint Check"
    if ! execute_command "ESLint check" "pnpm lint"; then
        exit 1
    fi

    # Step 7: Prettier フォーマットチェック
    step_count=$((step_count + 1))
    log_step "$step_count" "Prettier Format Check"
    if ! execute_command "Prettier format check" "pnpm format:check"; then
        exit 1
    fi

    # Step 8: 本番ビルド
    step_count=$((step_count + 1))
    log_step "$step_count" "Production Build"
    if ! execute_command "Production build" "pnpm build:prod"; then
        exit 1
    fi

    # Step 9: Docker Multi-stage Build Test
    step_count=$((step_count + 1))
    log_step "$step_count" "Docker Multi-stage Build Test"
    if ! test_docker_builds; then
        exit 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    echo ""
    echo "=================================================="
    echo "🎉 PRE-PUSH CI VALIDATION RESULTS"
    echo "=================================================="
    log_success "All CI validation steps passed!"
    log_info "Total time: ${minutes}m ${seconds}s"
    log_info "Total steps: $step_count"

    echo ""
    echo "=================================================="
    echo "🚀 READY TO PUSH"
    echo "=================================================="
    echo "✅ Code quality: PASSED"
    echo "✅ Tests: PASSED"
    echo "✅ Build: PASSED"
    echo "✅ Docker: PASSED"
    echo ""
    log_success "🎯 Ready to push to production!"
}

# Docker Multi-stage Build Test
test_docker_builds() {
    log_info "Testing Docker multi-stage builds..."

    local services=("backend" "frontend" "s3-gateway" "worker")
    local targets=("backend-runtime" "frontend-runtime" "s3-gateway-runtime" "worker-runtime")

    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local target="${targets[$i]}"
        local image_name="libark-${service}-ci-test:latest"

        log_info "Building ${service} (target: ${target})..."

        if docker build -f Dockerfile.production --target "${target}" -t "${image_name}" . --no-cache; then
            log_success "${service} Docker build: PASSED"

            # Runtime dependency test for backend
            if [ "$service" = "backend" ]; then
                if docker run --rm "${image_name}" node -e "require('otpauth'); console.log('✅ otpauth OK');" > /dev/null 2>&1; then
                    log_success "${service} runtime dependencies: PASSED"
                else
                    log_error "${service} runtime dependencies: FAILED"
                    docker rmi "${image_name}" > /dev/null 2>&1 || true
                    return 1
                fi
            fi

            # Cleanup test image
            docker rmi "${image_name}" > /dev/null 2>&1 || true
        else
            log_error "${service} Docker build: FAILED"
            return 1
        fi
    done

    return 0
}

# エラーハンドリング
trap 'log_error "Pre-push validation interrupted"; exit 1' INT TERM

# スクリプト実行
main "$@"
