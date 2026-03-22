# Worker README

## Overview
`apps/worker` is the BullMQ-based asynchronous processing service. It handles media processing, S3 event handling, P2P timeout checks, and cleanup jobs.

## Key Features (Implementation-Based)
- `MediaProcessingWorker`: image variant generation, status updates, notifications
- `S3EventWorker`: queue processing from S3-driven events
- `MediaCleanupWorker`: cleanup for failed/stalled media records
- `P2PTradeTimeoutWorker`: expired P2P trade handling
- `S3EventListener`: Redis Pub/Sub subscription on `s3:events`
- `MediaCleanupScheduler` / `P2PTradeTimeoutScheduler`: cron-driven queue job dispatch

Evidence: `apps/worker/src/workers/*.ts`, `apps/worker/src/services/*.ts`

## Development (Docker-first)
```bash
docker-compose exec dev pnpm --filter worker dev
docker-compose exec dev pnpm --filter worker test
```

## Findings During Implementation Review
- `P2PTradeTimeoutWorker` still has a TODO about user notification dispatch, so timeout notification behavior may be incomplete.

See the [Implementation Audit Report](../../docs/implementation-audit.md) for details.
