/**
 * 🚀 LIBARK S3 Gateway
 *
 * Universal S3 API Proxy with:
 * - POST Presigned URL support
 * - Transparent encryption (SSE-C/SSE-S3)
 * - Dynamic backend switching (R2/GCS/AWS/DO Spaces)
 * - CDN cache optimization
 *
 * 🔥 Hot reload test - Development mode enabled!
 */

import { createApp } from './app.js';
import { getConfig } from './config/index.js';

async function start() {
  try {
    const config = getConfig();
    const app = await createApp();

    // Start server
    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    app.log.info(`🚀 S3 Gateway started on port ${config.port}`);
    app.log.info(`📡 Backend: ${config.s3.backend.type} (${config.s3.backend.endpoint})`);
    app.log.info(`🔐 Encryption: ${config.encryption.enabled ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    console.error('❌ Failed to start S3 Gateway:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

start();
