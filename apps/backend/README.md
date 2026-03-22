# Backend README

## Overview
`apps/backend` is a Fastify + Apollo Server GraphQL service. It provides GraphQL Query/Mutation/Subscription APIs and additional REST endpoints for payment and media workflows.

## Key Features (Implementation-Based)
- GraphQL domains
- Auth / 2FA (`auth`, `twoFactor`, `twoFactorLogin`)
- Users, follows, timeline
- Posts, comments, likes, purchases
- Notifications, messages
- Wallet, P2P trades, disputes
- Site feature flags and admin operations

Evidence: `apps/backend/src/resolvers/**/*.ts`, `packages/graphql/src/schema/*.graphql`

## Supporting REST Endpoints
- `GET /health` health check
- `/api/nowpayments/*` NOWPayments integration
- `/mock/nowpayments/v1/*` mock payment API for development/testing
- `GET /api/media/:mediaId` authorized media delivery
- `GET /internal/ogp-meta/:mediaId` internal OGP API (requires internal token)

Evidence: `apps/backend/src/index.ts`, `apps/backend/src/routes/*.ts`

## Development (Docker-first)
```bash
docker-compose exec dev pnpm --filter @libark/backend dev
docker-compose exec dev pnpm --filter @libark/backend test
docker-compose exec dev pnpm --filter @libark/backend type-check
```

## Findings During Implementation Review
- Many migration comments like "removed/deprecated" remain across backend files. Runtime behavior is fine, but current vs legacy flow boundaries are harder to read.

See the [Implementation Audit Report](../../docs/implementation-audit.md) for details.
