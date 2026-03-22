# Frontend README

## Overview
`apps/frontend` is a React + Vite single-page application. Routing is handled by `react-router-dom`, and data access is handled through `@libark/graphql-client` (Apollo-based).

## Key Features (Implementation-Based)
- Authentication: registration flow, auth guards, password reset
- Social: timeline, post detail, comments, likes
- Communication: notifications and direct messages
- Wallet: crypto deposits/history, withdrawals/history, transaction history
- P2P: trade list/detail/history, seller settings/dashboard
- Admin: site feature flags, user permissions, P2P dispute management, P2P currency settings

Evidence: `apps/frontend/src/routes/index.tsx`, `apps/frontend/src/pages/**`, `apps/frontend/src/features/**`

## Main Routes
- `/` registration page
- `/home` home (auth required)
- `/posts/:id` post detail
- `/notifications` notifications (auth required)
- `/messages` messages (auth required)
- `/wallet/*` wallet routes (deposit/withdraw/history/P2P)
- `/profile/:username` profile
- `/settings/*` settings (account/display/security)
- `/admin/*` admin area

## Development (Docker-first)
```bash
docker-compose exec dev pnpm --filter frontend dev
docker-compose exec dev pnpm --filter frontend test
docker-compose exec dev pnpm --filter frontend type-check
```

## Findings During Implementation Review
- In `DepositPage`, the "P2P Deposit" button navigates to `/p2p/deposit`, but only `/wallet/p2p/*` routes are registered. This can currently lead to a 404.
- `pages/settings/AccountSettingsPage.tsx` is not connected to production routing and is mostly referenced by integration tests.

See the [Implementation Audit Report](../../docs/implementation-audit.md) for details.
