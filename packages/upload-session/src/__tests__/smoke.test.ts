/**
 * 🧪 UploadSession Package スモークテスト
 *
 * 目的: パッケージの public API が正しくエクスポートされていることを確認する
 * - import が通ること
 * - 主要なエクスポートが存在すること
 */

import { describe, it, expect } from 'vitest';

import { UploadSessionManager, UploadSessionStatus } from '../session-manager.js';
import { UploadTokenService } from '../token-service.js';
import { UPLOAD_CONSTANTS } from '../constants.js';

describe('UploadSession Package - Smoke Test', () => {
  it('should export UploadSessionManager', () => {
    expect(UploadSessionManager).toBeDefined();
    expect(typeof UploadSessionManager).toBe('function');
  });

  it('should export UploadSessionStatus enum', () => {
    expect(UploadSessionStatus).toBeDefined();
    expect(typeof UploadSessionStatus).toBe('object');
  });

  it('should export UploadTokenService', () => {
    expect(UploadTokenService).toBeDefined();
    expect(typeof UploadTokenService).toBe('function');
  });

  it('should export UPLOAD_CONSTANTS', () => {
    expect(UPLOAD_CONSTANTS).toBeDefined();
    expect(typeof UPLOAD_CONSTANTS).toBe('object');
  });

  it('should be able to import from index.ts', async () => {
    // index.ts からの import が正常に動作することを確認
    const module = await import('../index.js');
    expect(module).toBeDefined();
    expect(module.UploadSessionManager).toBeDefined();
    expect(module.UploadSessionStatus).toBeDefined();
    expect(module.UploadTokenService).toBeDefined();
    expect(module.UPLOAD_CONSTANTS).toBeDefined();
  });
});
