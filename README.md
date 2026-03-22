# LIBARK Monorepo

LIBARK is a TypeScript monorepo composed of `apps/*` and `packages/*`.
Development, dependency management, and Prisma generation must run inside Docker containers.
The recommended workflow is VS Code Dev Container (or GitHub Codespaces when needed).

## Service Readmes

- [Frontend README](./apps/frontend/README.md)
- [Backend README](./apps/backend/README.md)
- [Worker README](./apps/worker/README.md)
- [S3 Gateway README](./apps/s3-gateway/README.md)
- [Implementation Audit Report](./docs/implementation-audit.md)

## Repository Structure

- `apps/frontend`: React + Vite frontend
- `apps/backend`: Fastify + GraphQL backend
- `apps/s3-gateway`: media delivery gateway
- `apps/worker`: async job worker
- `packages/*`: shared libraries (DB/GraphQL/Core/Queue/etc.)

## Setup (Docker / Dev Container)

```bash
# Recommended: run initial setup in one command
make bootstrap
```

If you want to run app services (`frontend/backend/worker/s3-gateway/nginx`) through compose, use profiles.

```bash
docker-compose --profile apps up -d
```

Prisma Studio is separated as a development tool and should be started only when needed.

```bash
docker-compose --profile tools up -d
```

In development, Nginx uses `docker/nginx/nginx.dev.conf` and can run without certificates.

Manual setup order:

```bash
docker-compose up -d dev postgres redis
docker-compose exec dev pnpm install
docker-compose exec dev pnpm db:generate
docker-compose exec dev pnpm db:deploy
docker-compose exec dev pnpm db:seed
```

## Development Commands

```bash
# Development server
make dev

# Start/stop app services (compose)
make apps-up
make apps-down

# Tests
make test

# Lint / type-check
make lint
make type-check

# Build shared libraries
make build-packages
```

## Access URLs (Development)

- Primary app entrypoint (recommended): `http://localhost` (Nginx)
- Frontend dev server (debug only): `http://localhost:3000`
- Backend direct (debug/API check): `http://localhost:8000`
- Prisma Studio: `http://localhost:5555` (when tools profile is running)

### Why `http://localhost` (no port) is the default in development

- In the current implementation, upload sessions return a relative path (`/upload/:uploadId`), and frontend GraphQL defaults to `http://localhost/graphql`.
- The `s3-gateway` container is intentionally **not** exposed on a host port in development.
- Nginx (`docker/nginx/nginx.dev.conf`) is the single entrypoint that proxies:
  - `/graphql` and `/api/*` to backend
  - `/upload/*`, `/files/media/*`, `/ogp/*` to s3-gateway

If you access only `http://localhost:3000`, some end-to-end flows (especially upload/media routes) may not match the intended reverse-proxy path unless you override client endpoint settings.

## Development Rules

- After adding/updating dependencies, run `docker-compose exec dev pnpm install`
- After Prisma-related changes, run `docker-compose exec dev pnpm db:generate`
- During initial setup, run `docker-compose exec dev pnpm db:deploy` and `docker-compose exec dev pnpm db:seed`
- Do not run `pnpm install` or `prisma generate` on the host machine
- Root `preinstall` blocks host-side `pnpm install` (exception: `LIBARK_ALLOW_HOST_PNPM=1`)
- For collaboration, prioritize Dev Container or Codespaces and avoid local Node execution

For detailed rules, see `AGENTS.md`.

# libark
