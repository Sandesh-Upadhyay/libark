# Unified Auth Test Guide

## Overview

This test suite validates the unified authentication system end-to-end.

## Running Tests

### In Docker (recommended)

```bash
# Run auth-focused test suite (auth unit + resolver auth integration)
docker-compose exec dev pnpm --filter @libark/backend test:auth

# Run auth test report helper
docker-compose exec dev pnpm --filter @libark/backend test:auth-report

# Run backend coverage
docker-compose exec dev pnpm --filter @libark/backend test:coverage

# Run all backend tests (quick preset)
docker-compose exec dev pnpm --filter @libark/backend test
```

### Local

Repository policy prefers Docker execution.

## Coverage Scope

- AuthService: login, invalid password, unknown user, rate limit, JWT, cookies
- AuthCache: set/get/invalidate, L1/L2 stats, hit-rate behavior
- PermissionCache: permission checks, admin checks, invalidation, stats
- IntegratedSessionManager: create/get session, limits, invalidation, stats
- GraphQL auth resolvers: login mutation, `me` query, logout mutation, validation errors
- Performance checks: throughput and concurrency scenarios
- Security checks: tampered JWT, expired JWT, rate-limit behavior, security logging

## Quality Targets

- Success rate target: 95%+
- Runtime target: under 5 seconds for standard suite where practical
- Cache hit-rate target: 80%+

## Troubleshooting

1. Database connection issue

```bash
docker-compose ps postgres
docker-compose exec dev pnpm db:deploy
```

2. Redis connection issue

```bash
docker-compose ps redis
docker-compose exec dev redis-cli ping
```

3. Environment variable issue

```bash
docker-compose exec dev env | rg AUTH_
```

4. Test data cleanup

```bash
docker-compose exec dev pnpm --filter @libark/db data:reset
```

## Adding New Tests

1. Add integration tests to `auth.integration.test.ts`
2. Add security tests to `auth.security.test.ts`
3. Add GraphQL tests to `../resolvers/__tests__/auth.integration.test.ts`
4. Add reusable helpers in `../../__tests__/helpers/test-data.ts`
