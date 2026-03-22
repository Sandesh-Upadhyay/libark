/**
 * 🧪 Vitest workspaces configuration
 *
 * Manages all packages in a unified workspace and
 * displays a unified summary after tests complete
 */
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Applications
  'apps/backend/vitest.config.ts',
  'apps/frontend/vitest.config.ts',
  'apps/worker/vitest.config.ts',
  'apps/s3-gateway/vitest.config.ts',

  // Packages
  'packages/cache/vitest.config.ts',
  'packages/core-client/vitest.config.ts',
  'packages/core-server/vitest.config.ts',
  'packages/core-shared/vitest.config.ts',
  'packages/db/vitest.config.ts',
  'packages/graphql/vitest.config.ts',
  'packages/graphql-client/vitest.config.ts',
  'packages/media/vitest.config.ts',
  'packages/nowpayments-api/vitest.config.ts',
  'packages/queues/vitest.config.ts',
  'packages/redis-client/vitest.config.ts',
  'packages/upload-session/vitest.config.ts',
]);
