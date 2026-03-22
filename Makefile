# 🚀 LIBARK unified development commands
# Common command set for local development and CI/CD

.PHONY: help bootstrap install dev build test lint format clean ci ci-fast docker-up docker-down apps-up apps-down tools-up tools-down

# Default target
help: ## Show help
	@echo "🚀 LIBARK development commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 🏗️ Setup and installation
bootstrap: ## Initial development setup (recommended)
	./scripts/bootstrap-dev.sh

install: ## Install dependencies
	docker-compose exec dev pnpm install

setup: ## Initial setup (start Docker + install dependencies + initialize DB)
	docker-compose up -d
	sleep 10
	docker-compose exec dev pnpm install
	docker-compose exec dev pnpm db:generate
	docker-compose exec dev pnpm db:deploy
	docker-compose exec dev pnpm db:seed

# 🚀 Development
dev: ## Start development server
	docker-compose up -d
	docker-compose exec dev pnpm dev

apps-up: ## Start app services (frontend/backend/worker/s3-gateway/nginx)
	docker-compose --profile apps up -d

apps-down: ## Stop app services
	docker-compose stop frontend backend worker s3-gateway nginx

tools-up: ## Start development tools (Prisma Studio)
	docker-compose --profile tools up -d prisma-studio

tools-down: ## Stop development tools (Prisma Studio)
	docker-compose stop prisma-studio

dev-logs: ## Show development server logs
	docker-compose logs -f

# 🏗️ Build
build: ## Build all
	docker-compose exec dev pnpm build

build-packages: ## Build packages only
	docker-compose exec dev pnpm build:packages:turbo

# 🧪 Tests and quality checks
test: ## Run tests
	docker-compose exec dev pnpm test

test-fast: ## Run tests quickly (skip DB initialization)
	docker-compose exec dev pnpm test:fast

lint: ## Run ESLint
	docker-compose exec dev pnpm lint

lint-fix: ## Run ESLint auto-fix
	docker-compose exec dev pnpm lint:fix

format: ## Run Prettier
	docker-compose exec dev pnpm format

format-check: ## Run Prettier check
	docker-compose exec dev pnpm format:check

type-check: ## Run TypeScript type checks
	docker-compose exec dev pnpm type-check

# 🔄 CI/CD
ci: ## Run full CI locally
	./scripts/pre-push-ci.sh

ci-fast: ## Run CI quickly (skip tests)
	docker-compose exec dev pnpm lint
	docker-compose exec dev pnpm type-check
	docker-compose exec dev pnpm test:fast

ci-local: ## Run CI inside Docker
	docker-compose exec dev bash scripts/pre-push-ci.sh

# 🗄️ Database
db-generate: ## Generate Prisma client
	docker-compose exec dev pnpm db:generate

db-migrate: ## Run migrations
	docker-compose exec dev pnpm db:migrate

db-deploy: ## Apply existing migrations
	docker-compose exec dev pnpm db:deploy

db-studio: ## Start Prisma Studio
	docker-compose --profile tools up -d prisma-studio

db-seed: ## Run seed data
	docker-compose exec dev pnpm db:seed

db-reset: ## Fully reset database
	docker-compose exec dev sh -c "cd /workspace/packages/db && pnpm prisma migrate reset --force"

# 🐳 Docker management
docker-up: ## Start Docker environment
	docker-compose up -d

docker-down: ## Stop Docker environment
	docker-compose down

docker-restart: ## Restart Docker environment
	docker-compose restart

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-clean: ## Clean up Docker environment
	docker-compose down -v
	docker system prune -f

# 🧹 Cleanup
clean: ## Remove build artifacts
	docker-compose exec dev pnpm clean
	docker-compose exec dev find /workspace -name "node_modules" -type d -prune -exec rm -rf {} +
	docker-compose exec dev find /workspace -name "dist" -type d -prune -exec rm -rf {} +
	docker-compose exec dev find /workspace -name ".turbo" -type d -prune -exec rm -rf {} +

clean-all: ## Full cleanup (including Docker)
	make clean
	make docker-clean

# 📊 Status check
status: ## Check service status
	@echo "🐳 Docker status:"
	docker-compose ps
	@echo ""
	@echo "🌐 Service checks:"
	@curl -fsS http://localhost/health >/dev/null && echo "✅ Gateway: healthy" || echo "❌ Gateway: stopped"
	@curl -fsS http://localhost:8000/health >/dev/null && echo "✅ Backend: healthy" || echo "❌ Backend: stopped"
	@curl -fsS http://localhost:3000/ >/dev/null && echo "✅ Frontend: healthy" || echo "❌ Frontend: stopped"

# 🔧 Development tools
fix: ## Auto-fix (lint + format)
	docker-compose exec dev pnpm lint:fix
	docker-compose exec dev pnpm format

check: ## Quality checks (lint + format + type-check)
	docker-compose exec dev pnpm lint
	docker-compose exec dev pnpm format:check
	docker-compose exec dev pnpm type-check

# 🚀 Production
prod-build: ## Build for production
	docker build -f Dockerfile.production -t libark:latest .

prod-up: ## Start production environment
	docker-compose -f docker-compose.production.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.production.yml down
