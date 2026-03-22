# S3 Gateway README

## Overview

`apps/s3-gateway` is a Fastify-based S3 API gateway. It provides upload proxying, signed URL generation, file proxy delivery, OGP anonymous delivery, and encryption status endpoints.

## Main Endpoints (Implementation-Based)

- `GET /health` health check
- `POST /presign/upload` upload signed URL
- `POST /presign/download` download signed URL
- `POST /upload-proxy` upload proxy endpoint
- `POST /upload-variant` variant upload endpoint
- `PUT /upload/:uploadId` token-based upload session endpoint
- `GET /files/:bucket/*` file proxy from S3 backend
- `GET /encryption/status` encryption status endpoint
- `GET /ogp/...` anonymous OGP delivery (legacy-compatible + on-demand)

Evidence: `apps/s3-gateway/src/app.ts`, `apps/s3-gateway/src/routes/*.ts`

## Development (Docker-first)

```bash
docker-compose exec dev pnpm --filter @libark/s3-gateway dev
docker-compose exec dev pnpm --filter @libark/s3-gateway test
```

## Findings During Implementation Review

- In development compose, `s3-gateway` is intentionally not exposed on a host port. Access is expected through Nginx (`http://localhost`) rather than direct host port access.

See the [Implementation Audit Report](../../docs/implementation-audit.md) for details.
