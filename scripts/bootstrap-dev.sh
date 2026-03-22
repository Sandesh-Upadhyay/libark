#!/usr/bin/env bash

set -euo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_BIN="docker-compose"
else
  COMPOSE_BIN="docker compose"
fi

echo "==> Ensuring .env.development exists"
cp -n .env.template .env.development || true

echo "==> Starting base services (dev, postgres, redis)"
$COMPOSE_BIN up -d dev postgres redis

echo "==> Installing dependencies in dev container"
$COMPOSE_BIN exec dev pnpm install

echo "==> Generating Prisma client in dev container"
$COMPOSE_BIN exec dev pnpm db:generate

echo "==> Applying Prisma migrations in dev container"
$COMPOSE_BIN exec dev pnpm db:deploy

echo "==> Seeding development data in dev container"
$COMPOSE_BIN exec dev pnpm db:seed

echo "==> Building shared libs required by tests/runtime"
if ! $COMPOSE_BIN exec dev pnpm build:libs; then
  echo "WARN: build:libs failed. Environment bootstrap is complete, but some package builds are currently broken."
  echo "Run manual fix inside dev container before full test/build execution."
fi

echo "==> Development bootstrap completed"
echo "Run app services: $COMPOSE_BIN --profile apps up -d"
echo "Run dev command : $COMPOSE_BIN exec dev pnpm dev"
