# Seed Script Architecture

This directory contains a refactored seed implementation based on clear separation of responsibilities.

## Directory Structure

```text
seeds/
├── data/           # static data
│   ├── users.ts
│   ├── posts.ts
│   ├── comments.ts
│   └── currencies.ts
├── seeders/        # execution logic
│   ├── user-seeder.ts
│   ├── content-seeder.ts
│   ├── wallet-seeder.ts
│   └── system-seeder.ts
└── utils/          # shared utilities
    ├── types.ts
    ├── random.ts
    └── database.ts
```

## Design Principles

1. Single Responsibility: each file has one clear concern
2. Dependency Inversion: logic depends on abstractions where possible
3. Open/Closed: easy extension with minimal modifications

## Usage

### Standard Run

```bash
docker-compose exec dev pnpm db:seed
```

### Run After Clearing DB

```bash
docker-compose exec dev pnpm --filter @libark/db data:reset
docker-compose exec dev pnpm db:seed
```

### Run Individual Seeders

Use the package scripts or call the corresponding seeder module directly from `seed.ts`.

## Seeder Responsibilities

- `user-seeder.ts`: users, roles, permissions, permission overrides
- `content-seeder.ts`: posts, comments, likes, notifications
- `wallet-seeder.ts`: wallets, user wallets, exchange rates, transactions
- `system-seeder.ts`: site feature settings

## Utilities

- `types.ts`: shared type definitions and Prisma type re-exports
- `random.ts`: random generators and weighted selection helpers
- `database.ts`: cleanup, batching, and DB helper operations

## Execution Flow

1. Optional DB cleanup
2. User-related seed
3. Content-related seed
4. Wallet-related seed
5. System setting seed
6. Summary output

## Customization

### Add a New Entity

1. Add static data in `data/`
2. Create a seeder in `seeders/`
3. Call it from `seed.ts`

### Tune Data Volume

Update values in data config objects (counts/probabilities).

## Notes

- Keep `any` usage minimal to preserve type safety
- Handle errors independently in each seeder
- Use batching for large volumes
- In production, use `seed.production.ts`

## Troubleshooting

- Type errors: regenerate Prisma client with `docker-compose exec dev pnpm db:generate`
- Connection errors: verify database container/service status
- Permission errors: run commands in Docker as defined by project policy
