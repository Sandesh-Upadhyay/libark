# Production Seed System

## Overview

This seed flow inserts only the minimum master data required for production.
It is fully separated from development seed data and contains no test fixtures.

## Included Data

- Permission system: permission records and role-permission mappings
- Admin user: `admin@libark.io` with `SUPER_ADMIN`
- Site feature settings: baseline feature toggles
- Exchange rates: supported crypto pairs
- Payment providers: production payment provider settings

## Not Included

- Test users
- Sample posts/comments
- Test wallets or transaction history
- Sample conversations/messages

## File Layout

- `seed.production.ts`: entry point for production seed
- `seeds/data/production/permissions.ts`
- `seeds/data/production/site-features.ts`
- `seeds/data/production/exchange-rates.ts`
- `seeds/data/production/payment-providers.ts`
- `scripts/seed-production.sh`: helper script

## How To Run

### Option 1: Shell script (recommended)

```bash
cd packages/db
./scripts/seed-production.sh
```

### Option 2: Direct execution

```bash
pnpm tsx packages/db/prisma/seed.production.ts
```

### Option 3: Docker environment

```bash
docker-compose exec dev sh -c "cd /app/packages/db && pnpm tsx prisma/seed.production.ts"
```

## Security Notes

- Passwords are bcrypt-hashed
- API keys should come from environment variables
- Script is idempotent (safe to re-run)

## Verification Checklist

1. Admin login works (`/admin`)
2. Site feature settings are present
3. Permission checks work in admin UI
4. Wallet/exchange rate data appears correctly

## Cautions

- Production-only workflow; do not use in development
- Existing data is preserved via upsert patterns
- Take a database backup before execution
- Ensure payment-provider API keys are configured

## Customization

Adjust production requirements in:

- `seeds/data/production/permissions.ts`
- `seeds/data/production/site-features.ts`
- `seeds/data/production/exchange-rates.ts`
- `seeds/data/production/payment-providers.ts`
