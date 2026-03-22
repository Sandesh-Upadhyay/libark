/**
 * 🧪 2FA手動テスト
 *
 * 実際の2FAフローをテストするためのスクリプト
 */

import { describe, it, expect } from 'vitest';
import {
  generateTOTPSecret,
  generateTOTPSetup,
  verifyTOTPCode,
  generateTOTPCode,
} from '@libark/core-server/security/totp';

describe('🔐 2FA手動テスト', () => {
  it('完全な2FAフローをテスト', async () => {
    console.log('🔐 2FA手動テスト開始');

    // 1. シークレット生成
    const secret = await generateTOTPSecret();
    console.log('✅ シークレット生成:', secret);

    // 2. セットアップデータ生成
    const setupData = await generateTOTPSetup(secret, 'test@example.com', {
      issuer: 'LIBARK',
    });
    console.log('✅ セットアップデータ生成完了');
    console.log('- QRコードURL長さ:', setupData.qrCodeUrl.length);
    console.log('- 手動入力キー:', setupData.manualEntryKey);

    // 3. TOTPコード生成（テスト用）
    const totpCode = generateTOTPCode(secret);
    console.log('✅ TOTPコード生成:', totpCode);

    // 4. TOTPコード検証
    const isValid = verifyTOTPCode(secret, totpCode);
    console.log('✅ TOTPコード検証:', isValid ? '成功' : '失敗');

    // 5. 結果確認
    expect(secret).toBeDefined();
    expect(setupData.qrCodeUrl).toContain('data:image/png;base64,');
    expect(setupData.manualEntryKey).toBeDefined();
    expect(totpCode).toMatch(/^\d{6}$/);
    expect(isValid).toBe(true);

    console.log('🎉 2FA手動テスト完了');
  });

  it('無効なTOTPコードを検証', () => {
    const secret = generateTOTPSecret();
    const invalidCode = '000000';

    const isValid = verifyTOTPCode(secret, invalidCode);
    expect(isValid).toBe(false);

    console.log('✅ 無効なTOTPコード検証: 正しく失敗');
  });
});
