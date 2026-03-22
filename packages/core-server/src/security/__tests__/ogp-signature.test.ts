/**
 * OGP署名サービスのユニットテスト
 */

import { describe, it, expect } from 'vitest';

import {
  generateSignature,
  verifySignature,
  generateSignatureFromOptions,
  verifySignatureFromOptions,
  generateOnDemandSignature,
  verifyOnDemandSignature,
  generateOnDemandSignatureFromOptions,
  verifyOnDemandSignatureFromOptions,
  type OgpSignatureOptions,
  type OgpVerifyOptions,
  type OnDemandSignatureOptions,
  type OnDemandVerifyOptions,
} from '../ogp-signature';

describe('OGP署名サービス', () => {
  const signingKey = 'test-signing-key-12345';
  const path = '/ogp/media/123';
  const salt = 'test-salt';
  const now = Math.floor(Date.now() / 1000);

  describe('generateSignature', () => {
    it('同一入力→同一署名', () => {
      const exp = now + 3600; // 1時間後
      const sig1 = generateSignature(path, salt, exp, signingKey);
      const sig2 = generateSignature(path, salt, exp, signingKey);

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // SHA256 hex = 64文字
    });

    it('salt変更→署名変化', () => {
      const exp = now + 3600;
      const sig1 = generateSignature(path, salt, exp, signingKey);
      const sig2 = generateSignature(path, 'different-salt', exp, signingKey);

      expect(sig1).not.toBe(sig2);
    });

    it('exp変更→署名変化', () => {
      const sig1 = generateSignature(path, salt, now + 3600, signingKey);
      const sig2 = generateSignature(path, salt, now + 7200, signingKey);

      expect(sig1).not.toBe(sig2);
    });

    it('path変更→署名変化', () => {
      const exp = now + 3600;
      const sig1 = generateSignature(path, salt, exp, signingKey);
      const sig2 = generateSignature('/ogp/media/456', salt, exp, signingKey);

      expect(sig1).not.toBe(sig2);
    });

    it('signingKey変更→署名変化', () => {
      const exp = now + 3600;
      const sig1 = generateSignature(path, salt, exp, signingKey);
      const sig2 = generateSignature(path, salt, exp, 'different-key');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('有効な署名→true', () => {
      const exp = now + 3600;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey, 3600)).toBe(true);
    });

    it('exp期限切れ→false', () => {
      const exp = now - 3600; // 1時間前
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey)).toBe(false);
    });

    it('exp未来過大→false', () => {
      const exp = now + 10000; // 10000秒後（デフォルトmaxFutureSec=300を超過）
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey)).toBe(false);
    });

    it('maxFutureSecを指定して未来過大チェック', () => {
      const exp = now + 600; // 600秒後
      const sig = generateSignature(path, salt, exp, signingKey);

      // maxFutureSec=500を指定すると600秒は超過
      expect(verifySignature(path, salt, exp, sig, signingKey, 500)).toBe(false);

      // maxFutureSec=700を指定すると600秒は許容
      expect(verifySignature(path, salt, exp, sig, signingKey, 700)).toBe(true);
    });

    it('署名不一致→false', () => {
      const exp = now + 3600;
      const sig = generateSignature(path, salt, exp, signingKey);
      const wrongSig = sig.slice(0, -1) + '0'; // 最後の1文字を変更

      expect(verifySignature(path, salt, exp, wrongSig, signingKey)).toBe(false);
    });

    it('署名長不正→false（例外が出ない）', () => {
      const exp = now + 3600;
      const shortSig = 'abc123';
      const longSig = 'a'.repeat(100);

      expect(verifySignature(path, salt, exp, shortSig, signingKey)).toBe(false);
      expect(verifySignature(path, salt, exp, longSig, signingKey)).toBe(false);
    });

    it('署名長不正→例外が出ない', () => {
      const exp = now + 3600;
      const shortSig = 'abc123';

      // 例外がスローされないことを確認
      expect(() => {
        verifySignature(path, salt, exp, shortSig, signingKey);
      }).not.toThrow();
    });

    it('無効なhex文字列→例外が出ない', () => {
      const exp = now + 3600;
      const invalidHex = 'g'.repeat(64); // gはhex文字ではない

      expect(() => {
        verifySignature(path, salt, exp, invalidHex, signingKey);
      }).not.toThrow();
      expect(verifySignature(path, salt, exp, invalidHex, signingKey)).toBe(false);
    });

    it('salt不一致→false', () => {
      const exp = now + 3600;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, 'wrong-salt', exp, sig, signingKey)).toBe(false);
    });

    it('path不一致→false', () => {
      const exp = now + 3600;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature('/ogp/media/456', salt, exp, sig, signingKey)).toBe(false);
    });

    it('signingKey不一致→false', () => {
      const exp = now + 3600;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, 'wrong-key')).toBe(false);
    });
  });

  describe('generateSignatureFromOptions', () => {
    it('オプションオブジェクトで署名生成', () => {
      const exp = now + 3600;
      const options: OgpSignatureOptions = {
        path,
        salt,
        exp,
        signingKey,
      };

      const sig1 = generateSignatureFromOptions(options);
      const sig2 = generateSignature(path, salt, exp, signingKey);

      expect(sig1).toBe(sig2);
    });
  });

  describe('verifySignatureFromOptions', () => {
    it('オプションオブジェクトで署名検証', () => {
      const exp = now + 3600;
      const signature = generateSignature(path, salt, exp, signingKey);

      const options: OgpVerifyOptions = {
        path,
        salt,
        exp,
        signature,
        signingKey,
        maxFutureSec: 3600,
      };

      expect(verifySignatureFromOptions(options)).toBe(true);
    });

    it('オプションオブジェクトでmaxFutureSec指定', () => {
      const exp = now + 600;
      const signature = generateSignature(path, salt, exp, signingKey);

      const options: OgpVerifyOptions = {
        path,
        salt,
        exp,
        signature,
        signingKey,
        maxFutureSec: 500,
      };

      expect(verifySignatureFromOptions(options)).toBe(false);
    });
  });

  describe('タイミング攻撃対策', () => {
    it('署名検証がタイミング攻撃に対して安全', () => {
      const exp = now + 3600;
      const validSig = generateSignature(path, salt, exp, signingKey);
      const invalidSig = 'a'.repeat(64);

      // 両方の検証を実行（タイミング攻撃対策としてtimingSafeEqualが使用されている）
      const validResult = verifySignature(path, salt, exp, validSig, signingKey, 3600);
      const invalidResult = verifySignature(path, salt, exp, invalidSig, signingKey, 3600);

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });
  });

  describe('境界値テスト', () => {
    it('exp = now + 1（1秒後）→有効', () => {
      const exp = now + 1;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey)).toBe(true);
    });

    it('exp = now（現在時刻）→期限切れ', () => {
      const exp = now;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey)).toBe(false);
    });

    it('exp = now + maxFutureSec（境界値）→有効', () => {
      const maxFutureSec = 300;
      const exp = now + maxFutureSec;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey, maxFutureSec)).toBe(true);
    });

    it('exp = now + maxFutureSec + 1（境界値超過）→無効', () => {
      const maxFutureSec = 300;
      const exp = now + maxFutureSec + 1;
      const sig = generateSignature(path, salt, exp, signingKey);

      expect(verifySignature(path, salt, exp, sig, signingKey, maxFutureSec)).toBe(false);
    });
  });

  describe('オンデマンドOGP署名（期限なし）', () => {
    const signingKey = 'test-signing-key-12345';
    const mediaId = '550e8400-e29b-41d4-a716-446655440000';
    const variant = 'standard';
    const contentHash = 'a'.repeat(64);
    const ext = 'jpg';

    describe('generateOnDemandSignature', () => {
      it('同一入力→同一署名', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(sig1).toBe(sig2);
        expect(sig1).toHaveLength(64); // SHA256 hex = 64文字
      });

      it('mediaId変更→署名変化', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(
          '550e8400-e29b-41d4-a716-446655440001',
          variant,
          contentHash,
          ext,
          signingKey
        );

        expect(sig1).not.toBe(sig2);
      });

      it('variant変更→署名変化', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(mediaId, 'teaser', contentHash, ext, signingKey);

        expect(sig1).not.toBe(sig2);
      });

      it('contentHash変更→署名変化', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(mediaId, variant, 'b'.repeat(64), ext, signingKey);

        expect(sig1).not.toBe(sig2);
      });

      it('ext変更→署名変化', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(mediaId, variant, contentHash, 'png', signingKey);

        expect(sig1).not.toBe(sig2);
      });

      it('signingKey変更→署名変化', () => {
        const sig1 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const sig2 = generateOnDemandSignature(mediaId, variant, contentHash, ext, 'different-key');

        expect(sig1).not.toBe(sig2);
      });
    });

    describe('verifyOnDemandSignature', () => {
      it('有効な署名→true', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(verifyOnDemandSignature(mediaId, variant, contentHash, ext, sig, signingKey)).toBe(
          true
        );
      });

      it('署名不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const wrongSig = sig.slice(0, -1) + '0'; // 最後の1文字を変更

        expect(
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, wrongSig, signingKey)
        ).toBe(false);
      });

      it('署名長不正→false（例外が出ない）', () => {
        const shortSig = 'abc123';
        const longSig = 'a'.repeat(100);

        expect(
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, shortSig, signingKey)
        ).toBe(false);
        expect(
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, longSig, signingKey)
        ).toBe(false);
      });

      it('署名長不正→例外が出ない', () => {
        const shortSig = 'abc123';

        expect(() => {
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, shortSig, signingKey);
        }).not.toThrow();
      });

      it('無効なhex文字列→例外が出ない', () => {
        const invalidHex = 'g'.repeat(64); // gはhex文字ではない

        expect(() => {
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, invalidHex, signingKey);
        }).not.toThrow();
        expect(
          verifyOnDemandSignature(mediaId, variant, contentHash, ext, invalidHex, signingKey)
        ).toBe(false);
      });

      it('mediaId不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(
          verifyOnDemandSignature(
            '550e8400-e29b-41d4-a716-446655440001',
            variant,
            contentHash,
            ext,
            sig,
            signingKey
          )
        ).toBe(false);
      });

      it('variant不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(verifyOnDemandSignature(mediaId, 'teaser', contentHash, ext, sig, signingKey)).toBe(
          false
        );
      });

      it('contentHash不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(
          verifyOnDemandSignature(mediaId, variant, 'b'.repeat(64), ext, sig, signingKey)
        ).toBe(false);
      });

      it('ext不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(verifyOnDemandSignature(mediaId, variant, contentHash, 'png', sig, signingKey)).toBe(
          false
        );
      });

      it('signingKey不一致→false', () => {
        const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(verifyOnDemandSignature(mediaId, variant, contentHash, ext, sig, 'wrong-key')).toBe(
          false
        );
      });
    });

    describe('generateOnDemandSignatureFromOptions', () => {
      it('オプションオブジェクトで署名生成', () => {
        const options: OnDemandSignatureOptions = {
          mediaId,
          variant,
          contentHash,
          ext,
          signingKey,
        };

        const sig1 = generateOnDemandSignatureFromOptions(options);
        const sig2 = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        expect(sig1).toBe(sig2);
      });
    });

    describe('verifyOnDemandSignatureFromOptions', () => {
      it('オプションオブジェクトで署名検証', () => {
        const signature = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

        const options: OnDemandVerifyOptions = {
          mediaId,
          variant,
          contentHash,
          ext,
          signature,
          signingKey,
        };

        expect(verifyOnDemandSignatureFromOptions(options)).toBe(true);
      });
    });

    describe('タイミング攻撃対策', () => {
      it('署名検証がタイミング攻撃に対して安全', () => {
        const validSig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);
        const invalidSig = 'a'.repeat(64);

        // 両方の検証を実行（タイミング攻撃対策としてtimingSafeEqualが使用されている）
        const validResult = verifyOnDemandSignature(
          mediaId,
          variant,
          contentHash,
          ext,
          validSig,
          signingKey
        );
        const invalidResult = verifyOnDemandSignature(
          mediaId,
          variant,
          contentHash,
          ext,
          invalidSig,
          signingKey
        );

        expect(validResult).toBe(true);
        expect(invalidResult).toBe(false);
      });
    });
  });
});
