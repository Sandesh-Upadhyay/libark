/**
 * 🧪 ユーティリティ関数テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  S3KeyGenerator,
  generateS3Key,
  generateVariantS3Key,
  normalizeMediaType,
  sanitizeFilename,
  convertToClientUrl,
  VARIANT_TYPES,
  type S3KeyParams,
} from '../utils/s3KeyGenerator.js';
import {
  detectTimezoneFromIP,
  extractClientIP,
  isValidTimezone,
  DEFAULT_TIMEZONES_BY_REGION,
  getDefaultTimezoneByCountry,
  detectUserTimezone,
} from '../utils/timezone-detection.js';
import {
  generateMediaUrl,
  generateThumbnailUrl,
  getS3GatewayUrl,
  generatePublicMediaUrl,
  getMediaUrlDebugInfo,
} from '../utils/media-url.js';

describe('S3キー生成ユーティリティ', () => {
  const validUUID = '12345678-1234-1234-1234-123456789012';

  describe('S3KeyGenerator.generateMediaKey', () => {
    it('有効なパラメータでS3キーを生成する', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'test-image.jpg',
        mediaType: 'post',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toContain('post/');
      expect(key).toContain(validUUID);
      expect(key).toContain('.jpg');
    });

    it('バリアント付きでS3キーを生成する', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'test-image.jpg',
        mediaType: 'post',
        variant: 'thumb',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).toContain('post/');
      expect(key).toContain(validUUID);
      expect(key).toContain('thumb');
      expect(key).toContain('.jpg');
    });

    it('無効なmediaIdでエラーを投げる', () => {
      const params: S3KeyParams = {
        mediaId: 'invalid-uuid',
        filename: 'test.jpg',
        mediaType: 'post',
      };

      expect(() => S3KeyGenerator.generateMediaKey(params)).toThrow();
    });

    it('無効なmediaTypeでエラーを投げる', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'test.jpg',
        mediaType: 'invalid' as any,
      };

      expect(() => S3KeyGenerator.generateMediaKey(params)).toThrow();
    });

    it('ファイル名がサニタイズされる', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'test@#$%^&*()image.jpg',
        mediaType: 'post',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).not.toContain('@');
      expect(key).not.toContain('#');
      expect(key).not.toContain('$');
    });

    it('異なるメディアタイプでキーを生成する', () => {
      const types = ['post', 'avatar', 'cover', 'ogp'] as const;

      types.forEach(type => {
        const params: S3KeyParams = {
          mediaId: validUUID,
          filename: 'test.jpg',
          mediaType: type,
        };

        const key = S3KeyGenerator.generateMediaKey(params);

        expect(key).toContain(`${type}/`);
      });
    });
  });

  describe('S3KeyGenerator.generateVariantKey', () => {
    it('オリジナルキーからバリアントキーを生成する', () => {
      const originalKey = 'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg';
      const variantKey = S3KeyGenerator.generateVariantKey(originalKey, 'thumb');

      expect(variantKey).toContain('thumb');
      expect(variantKey).toContain(validUUID);
    });

    it('無効なキー形式でエラーを投げる', () => {
      const invalidKey = 'invalid-key-format';

      expect(() => S3KeyGenerator.generateVariantKey(invalidKey, 'thumb')).toThrow();
    });
  });

  describe('S3KeyGenerator.parseS3Key', () => {
    it('有効なS3キーを解析する', () => {
      const key = 'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg';
      const parsed = S3KeyGenerator.parseS3Key(key);

      expect(parsed).not.toBeNull();
      expect(parsed?.mediaType).toBe('post');
      expect(parsed?.mediaId).toBe(validUUID);
      expect(parsed?.extension).toBe('jpg');
      expect(parsed?.datePrefix).toBe('2024-01-01');
    });

    it('バリアント付きキーを解析する', () => {
      const key = 'post/2024-01-01/12345678-1234-1234-1234-123456789012_thumb.jpg';
      const parsed = S3KeyGenerator.parseS3Key(key);

      // バリアントの正規化により、アンダースコアが削除される
      expect(parsed?.variant).toBe('thumb');
    });

    it('無効なキー形式でnullを返す', () => {
      const invalidKeys = [
        'invalid',
        'post/invalid',
        'post/2024-01-01',
        'post/invalid-date/12345678-1234-1234-1234-123456789012.jpg',
      ];

      invalidKeys.forEach(key => {
        const parsed = S3KeyGenerator.parseS3Key(key);
        expect(parsed).toBeNull();
      });
    });
  });

  describe('S3KeyGenerator.isValidS3Key', () => {
    it('有効なキーでtrueを返す', () => {
      const validKey = 'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg';
      expect(S3KeyGenerator.isValidS3Key(validKey)).toBe(true);
    });

    it('無効なキーでfalseを返す', () => {
      const invalidKey = 'invalid-key';
      expect(S3KeyGenerator.isValidS3Key(invalidKey)).toBe(false);
    });
  });

  describe('S3KeyGenerator.generateAllVariantKeys', () => {
    it('全バリアントキーを生成する', () => {
      const originalKey = 'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg';
      const variants = ['thumb', 'medium', 'large'];

      const variantKeys = S3KeyGenerator.generateAllVariantKeys(originalKey, variants);

      expect(Object.keys(variantKeys)).toHaveLength(variants.length);
      expect(variantKeys.thumb).toContain('thumb');
      expect(variantKeys.medium).toContain('medium');
      expect(variantKeys.large).toContain('large');
    });
  });

  describe('S3KeyGenerator.filterKeysByDateRange', () => {
    it('日付範囲でキーをフィルタリングする', () => {
      const keys = [
        'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg',
        'post/2024-01-15/22345678-1234-1234-1234-123456789012.jpg',
        'post/2024-02-01/32345678-1234-1234-1234-123456789012.jpg',
      ];

      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-20');

      const filtered = S3KeyGenerator.filterKeysByDateRange(keys, startDate, endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toContain('2024-01-15');
    });
  });

  describe('S3KeyGenerator.filterKeysByMediaType', () => {
    it('メディアタイプでキーをフィルタリングする', () => {
      const keys = [
        'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg',
        'avatar/2024-01-01/22345678-1234-1234-1234-123456789012.jpg',
        'cover/2024-01-01/32345678-1234-1234-1234-123456789012.jpg',
      ];

      const filtered = S3KeyGenerator.filterKeysByMediaType(keys, 'avatar');

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toContain('avatar/');
    });
  });

  describe('スタンドアロン関数', () => {
    it('generateS3Keyが正しく動作する', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'test.jpg',
        mediaType: 'post',
      };

      const key = generateS3Key(params);

      expect(key).toContain('post/');
      expect(key).toContain(validUUID);
    });

    it('generateVariantS3Keyが正しく動作する', () => {
      const originalKey = 'post/2024-01-01/12345678-1234-1234-1234-123456789012.jpg';
      const variantKey = generateVariantS3Key({
        originalS3Key: originalKey,
        variantType: 'thumb',
      });

      expect(variantKey).toContain('thumb');
    });

    it('normalizeMediaTypeが正しく動作する', () => {
      expect(normalizeMediaType('POST')).toBe('post');
      expect(normalizeMediaType('Avatar')).toBe('avatar');
      expect(normalizeMediaType('COVER')).toBe('cover');
    });

    it('sanitizeFilenameが正しく動作する', () => {
      expect(sanitizeFilename('test@#$%^&*()image.jpg')).toBe('test_image.jpg');
      expect(sanitizeFilename('  test  image  .jpg  ')).toBe('test_image_.jpg');
    });

    it('convertToClientUrlが正しく動作する', () => {
      const serverUrl = 'http://s3-gateway:8080/files/bucket/test.jpg';
      const clientUrl = convertToClientUrl(serverUrl);

      expect(clientUrl).toContain('http://localhost');
      expect(clientUrl).not.toContain('s3-gateway');
    });
  });

  describe('定数', () => {
    it('VARIANT_TYPESが定義されている', () => {
      expect(VARIANT_TYPES).toBeDefined();
      expect(VARIANT_TYPES.THUMB).toBe('THUMB');
      expect(VARIANT_TYPES.MEDIUM).toBe('MEDIUM');
      expect(VARIANT_TYPES.LARGE).toBe('LARGE');
      expect(VARIANT_TYPES.BLUR).toBe('BLUR');
      expect(VARIANT_TYPES.OGP).toBe('OGP');
    });
  });

  describe('エッジケース', () => {
    it('非常に長いファイル名が処理される', () => {
      const longFilename = 'a'.repeat(200) + '.jpg';
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: longFilename,
        mediaType: 'post',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).toBeDefined();
      expect(key.length).toBeLessThan(300);
    });

    it('特殊文字を含むファイル名がサニタイズされる', () => {
      const specialFilename = 'テスト画像🎨.jpg';
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: specialFilename,
        mediaType: 'post',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).toBeDefined();
    });

    it('拡張子がないファイル名が処理される', () => {
      const params: S3KeyParams = {
        mediaId: validUUID,
        filename: 'noextension',
        mediaType: 'post',
      };

      const key = S3KeyGenerator.generateMediaKey(params);

      expect(key).toBeDefined();
    });
  });
});

describe('タイムゾーン検出ユーティリティ', () => {
  describe('isValidTimezone', () => {
    it('有効なタイムゾーンでtrueを返す', () => {
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('無効なタイムゾーンでfalseを返す', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
    });
  });

  describe('DEFAULT_TIMEZONES_BY_REGION', () => {
    it('全ての地域のデフォルトタイムゾーンが定義されている', () => {
      expect(DEFAULT_TIMEZONES_BY_REGION.JP).toBe('Asia/Tokyo');
      expect(DEFAULT_TIMEZONES_BY_REGION.US).toBe('America/New_York');
      expect(DEFAULT_TIMEZONES_BY_REGION.GB).toBe('Europe/London');
      expect(DEFAULT_TIMEZONES_BY_REGION.AU).toBe('Australia/Sydney');
    });
  });

  describe('getDefaultTimezoneByCountry', () => {
    it('国コードからデフォルトタイムゾーンを取得する', () => {
      expect(getDefaultTimezoneByCountry('JP')).toBe('Asia/Tokyo');
      expect(getDefaultTimezoneByCountry('US')).toBe('America/New_York');
      expect(getDefaultTimezoneByCountry('GB')).toBe('Europe/London');
    });

    it('未知の国コードでデフォルト値を返す', () => {
      const timezone = getDefaultTimezoneByCountry('XX');
      expect(timezone).toBe('Asia/Tokyo');
    });
  });

  describe('extractClientIP', () => {
    it('x-forwarded-forヘッダーからIPを抽出する', () => {
      const headers = {
        'x-forwarded-for': '203.0.113.1, 203.0.113.2',
      };

      const ip = extractClientIP(headers);

      expect(ip).toBe('203.0.113.1');
    });

    it('x-real-ipヘッダーからIPを抽出する', () => {
      const headers = {
        'x-real-ip': '203.0.113.1',
      };

      const ip = extractClientIP(headers);

      expect(ip).toBe('203.0.113.1');
    });

    it('x-client-ipヘッダーからIPを抽出する', () => {
      const headers = {
        'x-client-ip': '203.0.113.1',
      };

      const ip = extractClientIP(headers);

      expect(ip).toBe('203.0.113.1');
    });

    it('localhost IPを無視する', () => {
      const headers = {
        'x-forwarded-for': '127.0.0.1',
      };

      const ip = extractClientIP(headers);

      expect(ip).toBeNull();
    });

    it('ヘッダーがない場合nullを返す', () => {
      const headers = {};

      const ip = extractClientIP(headers);

      expect(ip).toBeNull();
    });
  });

  describe('detectUserTimezone', () => {
    it('ブラウザタイムゾーンを優先する', async () => {
      const options = {
        browserTimezone: 'Asia/Tokyo',
      };

      const timezone = await detectUserTimezone(options);

      expect(timezone).toBe('Asia/Tokyo');
    });

    it('無効なブラウザタイムゾーンをスキップする', async () => {
      const options = {
        browserTimezone: 'Invalid/Timezone',
      };

      const timezone = await detectUserTimezone(options);

      expect(timezone).toBe('Asia/Tokyo'); // デフォルト値
    });

    it('国コードからタイムゾーンを取得する', async () => {
      const options = {
        countryCode: 'JP',
      };

      const timezone = await detectUserTimezone(options);

      expect(timezone).toBe('Asia/Tokyo');
    });

    it('全ての検出が失敗した場合デフォルト値を返す', async () => {
      const options = {};

      const timezone = await detectUserTimezone(options);

      expect(timezone).toBe('Asia/Tokyo');
    });
  });

  describe('detectTimezoneFromIP', () => {
    beforeEach(() => {
      // fetch APIをモック化
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('有効なIPアドレスでタイムゾーンを検出する', async () => {
      // モックレスポンスを設定
      const mockResponse = {
        timezone: 'America/New_York',
        country_code2: 'US',
        city: 'New York',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const timezone = await detectTimezoneFromIP('8.8.8.8');

      expect(timezone).toBe('America/New_York');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.ipgeolocation.io'),
        expect.any(Object)
      );
    });

    it('無効なIPアドレスでnullを返す', async () => {
      const timezone = await detectTimezoneFromIP('invalid-ip');

      expect(timezone).toBeNull();
    });

    it('APIエラー時にnullを返す', async () => {
      // 401エラーをシミュレート
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      } as Response);

      const timezone = await detectTimezoneFromIP('8.8.8.8');

      expect(timezone).toBeNull();
    });

    it('無効なタイムゾーンレスポンスでnullを返す', async () => {
      // 無効なタイムゾーンを含むレスポンス
      const mockResponse = {
        timezone: 'Invalid/Timezone',
        country_code2: 'US',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const timezone = await detectTimezoneFromIP('8.8.8.8');

      expect(timezone).toBeNull();
    });

    it('ネットワークエラー時にnullを返す', async () => {
      // ネットワークエラーをシミュレート
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const timezone = await detectTimezoneFromIP('8.8.8.8');

      expect(timezone).toBeNull();
    });
  });
});

describe('メディアURL生成ユーティリティ', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateMediaUrl', () => {
    it('メディアURLを生成する', () => {
      const url = generateMediaUrl('media-id-123');

      expect(url).toContain('/api/media/media-id-123');
    });

    it('バリアント付きでURLを生成する', () => {
      const url = generateMediaUrl('media-id-123', 'THUMB');

      expect(url).toContain('/api/media/media-id-123');
      expect(url).toContain('variant=THUMB');
    });
  });

  describe('generateThumbnailUrl', () => {
    it('サムネイルURLを生成する', () => {
      const url = generateThumbnailUrl('media-id-123');

      expect(url).toContain('/api/media/media-id-123');
      expect(url).toContain('variant=THUMB');
    });
  });

  describe('getS3GatewayUrl', () => {
    it('サーバーサイドで内部URLを返す', () => {
      process.env.S3_GATEWAY_URL = 'http://s3-gateway:8080';

      const url = getS3GatewayUrl();

      expect(url).toContain('s3-gateway');
    });

    it('クライアントサイドで公開URLを返す', () => {
      process.env.NEXT_PUBLIC_S3_GATEWAY_URL = 'https://libark.io';

      const url = getS3GatewayUrl();

      // 環境変数が設定されている場合、その値が使用される
      expect(url).toBeDefined();
    });
  });

  describe('generatePublicMediaUrl', () => {
    it('公開メディアURLを生成する', () => {
      process.env.S3_BUCKET = 'test-bucket';
      process.env.NEXT_PUBLIC_S3_GATEWAY_URL = 'https://libark.io';

      const url = generatePublicMediaUrl('post/2024-01-01/test.jpg');

      // URLが生成されることを確認
      expect(url).toBeDefined();
      expect(url).toContain('test-bucket');
      expect(url).toContain('post/2024-01-01/test.jpg');
    });
  });

  describe('getMediaUrlDebugInfo', () => {
    it('デバッグ情報を返す', () => {
      const info = getMediaUrlDebugInfo();

      expect(info).toBeDefined();
      expect(typeof info.isServer).toBe('boolean');
      expect(typeof info.isProduction).toBe('boolean');
      expect(typeof info.mediaBaseUrl).toBe('string');
      expect(typeof info.s3GatewayUrl).toBe('string');
      expect(typeof info.environment).toBe('string');
    });
  });

  describe('エッジケース', () => {
    it('特殊文字を含むメディアIDでURLを生成する', () => {
      const url = generateMediaUrl('media-id-with-special-chars_123');

      expect(url).toBeDefined();
      expect(url).toContain('media-id-with-special-chars_123');
    });

    it('空のメディアIDでURLを生成する', () => {
      const url = generateMediaUrl('');

      expect(url).toContain('/api/media/');
    });
  });
});
