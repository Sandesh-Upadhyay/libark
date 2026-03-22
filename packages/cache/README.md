# @libark/cache

Unified cache module for LIBARK.

## What It Provides

- `UnifiedCacheManager` for category-based cache operations
- `getDefaultCacheManager()` singleton accessor
- `createCacheAdapter()` for adapter creation (for example, Apollo Server or generic adapters)
- Config utilities and cache key/event helpers

## Build / Test

Run from the repository root in Docker:

```bash
docker-compose exec dev pnpm --filter @libark/cache build
docker-compose exec dev pnpm --filter @libark/cache test
```

## Basic Usage

```ts
import { getDefaultCacheManager } from '@libark/cache';

const cache = getDefaultCacheManager();

await cache.set('user', '1', { id: 1, name: 'Alice' });
const user = await cache.get('user', '1');
await cache.delete('user', '1');

const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate}%`);
```

## Adapter Usage

```ts
import { createCacheAdapter } from '@libark/cache';

const apolloAdapter = createCacheAdapter({ type: 'apollo-server' });
```

## Configuration

Configuration is loaded through the cache config module (`getCacheConfig`) and environment variables.
Use project-level environment files (`.env.development` / `.env.production`) as defined by repository policy.
