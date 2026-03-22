# Implementation Audit Report

Last updated: 2026-03-04

## Scope

- `apps/frontend`, `apps/backend`, `apps/worker`, `apps/s3-gateway`
- Routing, service entry points, core service implementations, Docker composition

## Unused / Inconsistency Findings (by priority)

1. Routing mismatch (High)

- Observation: `apps/frontend/src/pages/wallet/DepositPage.tsx` navigates to `/p2p/deposit`
- Implementation fact: `apps/frontend/src/routes/index.tsx` does not define `/p2p/deposit`
- Impact: The P2P deposit path can result in a 404

2. Route-disconnected page (Medium)

- Target: `apps/frontend/src/pages/settings/AccountSettingsPage.tsx`
- Implementation fact: Not connected to production routes; referenced mainly by integration tests
- Impact: Can create confusion between documented and actually reachable UI

3. Migration comment accumulation (Low)

- Target: Mainly backend/worker/graphql-client code with many "removed/deprecated" comments
- Implementation fact: Runtime is valid, but legacy notes are dense
- Impact: Onboarding and current-flow comprehension become harder

## References (checked)

- Frontend routes: `apps/frontend/src/routes/index.tsx`
- P2P navigation: `apps/frontend/src/pages/wallet/DepositPage.tsx`
- Backend entry/routes: `apps/backend/src/index.ts`, `apps/backend/src/routes/*.ts`
- Worker entry: `apps/worker/src/index.ts`
- S3 Gateway entry/routes: `apps/s3-gateway/src/app.ts`, `apps/s3-gateway/src/routes/*.ts`
- Compose: `docker-compose.yml`
