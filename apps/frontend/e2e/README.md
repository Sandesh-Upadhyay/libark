# Frontend E2E Test Guide

## Overview

This directory contains Playwright-based end-to-end tests for the frontend application.

## Prerequisites

- Docker services are running (`frontend`, `backend`, and dependencies)
- Test database is initialized
- Playwright browsers are installed in the dev environment

## Common Commands

```bash
# Run all E2E tests
docker-compose exec dev pnpm --filter frontend test:e2e

# Run in headed mode
docker-compose exec dev pnpm --filter frontend test:e2e:headed

# Run in UI mode
docker-compose exec dev pnpm --filter frontend test:e2e:ui

# Run in debug mode
docker-compose exec dev pnpm --filter frontend test:e2e:debug
```

## Test Design Guidelines

- Prefer stable selectors (`data-testid`) over brittle CSS chains
- Keep each test focused on one user scenario
- Cover both happy path and error path
- Add explicit assertions for visible outcomes
- Include responsive checks for key views when behavior differs by breakpoint

## CI/CD

E2E tests are intended to run in CI (for example, GitHub Actions) as part of release validation.

## Troubleshooting

1. Test timeout

- Increase timeout for the specific test only
- Wait for concrete UI state, not just network idle

2. Element not found

- Verify selector stability
- Ensure asynchronous rendering is awaited

3. Network error

- Check backend/gateway health endpoints
- Confirm Docker network and environment variables

## Debug Workflow

1. Run in UI mode (`docker-compose exec dev pnpm --filter frontend test:e2e:ui`)
2. Re-run failed test in headed mode
3. Inspect `test-results/` screenshots and traces
4. Use Playwright Trace Viewer for timing/interaction analysis

## Maintenance

- Keep fixtures deterministic
- Remove duplicated setup logic
- Update scenarios when product behavior changes
- Review flaky tests regularly and fix root causes
