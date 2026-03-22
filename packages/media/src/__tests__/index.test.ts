/**
 * Media Package Tests
 */

import { describe, it, expect } from 'vitest';

import {
  createMediaClient,
  shouldUseMultipartUpload,
  calculatePartCount,
  isSupportedFileType,
  inferMediaType,
  getFileExtension,
  generateDisplayFilename,
  validatePresignedExpires,
  MEDIA_V2_CONSTANTS,
} from '../index.js';

describe('Media Package', () => {
  describe('Constants', () => {
    it('MEDIA_V2_CONSTANTSが正しく定義されている', () => {
      expect(MEDIA_V2_CONSTANTS.MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
      expect(MEDIA_V2_CONSTANTS.MULTIPART_THRESHOLD).toBe(100 * 1024 * 1024);
      expect(MEDIA_V2_CONSTANTS.MULTIPART_CHUNK_SIZE).toBe(10 * 1024 * 1024);
      expect(MEDIA_V2_CONSTANTS.MAX_PARTS).toBe(1000);
    });

    it('サポートされるファイルタイプが定義されている', () => {
      expect(MEDIA_V2_CONSTANTS.SUPPORTED_IMAGE_TYPES).toContain('image/jpeg');
      expect(MEDIA_V2_CONSTANTS.SUPPORTED_VIDEO_TYPES).toContain('video/mp4');
      expect(MEDIA_V2_CONSTANTS.SUPPORTED_AUDIO_TYPES).toContain('audio/mp3');
      expect(MEDIA_V2_CONSTANTS.SUPPORTED_DOCUMENT_TYPES).toContain('application/pdf');
    });
  });

  describe('createMediaClient', () => {
    it('メディアクライアントを正しく作成する', () => {
      const client = createMediaClient();
      expect(client).toBeDefined();
      expect(typeof client.generatePresignedUpload).toBe('function');
      expect(typeof client.initiateMultipartUpload).toBe('function');
    });
  });

  describe('shouldUseMultipartUpload', () => {
    it('閾値以下のファイルサイズでfalseを返す', () => {
      const smallFileSize = 50 * 1024 * 1024; // 50MB
      expect(shouldUseMultipartUpload(smallFileSize)).toBe(false);
    });

    it('閾値以上のファイルサイズでtrueを返す', () => {
      const largeFileSize = 150 * 1024 * 1024; // 150MB
      expect(shouldUseMultipartUpload(largeFileSize)).toBe(true);
    });

    it('閾値ちょうどのファイルサイズでfalseを返す', () => {
      const thresholdSize = MEDIA_V2_CONSTANTS.MULTIPART_THRESHOLD;
      expect(shouldUseMultipartUpload(thresholdSize)).toBe(false);
    });
  });

  describe('calculatePartCount', () => {
    it('正しいパート数を計算する', () => {
      const fileSize = 50 * 1024 * 1024; // 50MB
      const expectedParts = Math.ceil(fileSize / MEDIA_V2_CONSTANTS.MULTIPART_CHUNK_SIZE);
      expect(calculatePartCount(fileSize)).toBe(expectedParts);
    });

    it('最大パート数を超えない', () => {
      const largeFileSize = 20 * 1024 * 1024 * 1024; // 20GB
      expect(calculatePartCount(largeFileSize)).toBe(MEDIA_V2_CONSTANTS.MAX_PARTS);
    });
  });

  describe('isSupportedFileType', () => {
    it('サポートされる画像タイプでtrueを返す', () => {
      expect(isSupportedFileType('image/jpeg')).toBe(true);
      expect(isSupportedFileType('image/png')).toBe(true);
      expect(isSupportedFileType('image/webp')).toBe(true);
    });

    it('サポートされる動画タイプでtrueを返す', () => {
      expect(isSupportedFileType('video/mp4')).toBe(true);
      expect(isSupportedFileType('video/webm')).toBe(true);
    });

    it('サポートされない形式でfalseを返す', () => {
      expect(isSupportedFileType('application/x-executable')).toBe(false);
      expect(isSupportedFileType('text/html')).toBe(false);
    });
  });

  describe('inferMediaType', () => {
    it('画像タイプを正しく推定する', () => {
      expect(inferMediaType('image/jpeg')).toBe('image');
      expect(inferMediaType('image/png')).toBe('image');
    });

    it('動画タイプを正しく推定する', () => {
      expect(inferMediaType('video/mp4')).toBe('video');
      expect(inferMediaType('video/webm')).toBe('video');
    });

    it('音声タイプを正しく推定する', () => {
      expect(inferMediaType('audio/mp3')).toBe('audio');
      expect(inferMediaType('audio/wav')).toBe('audio');
    });

    it('文書タイプを正しく推定する', () => {
      expect(inferMediaType('application/pdf')).toBe('document');
      expect(inferMediaType('text/plain')).toBe('document');
    });

    it('未知のタイプでgeneralを返す', () => {
      expect(inferMediaType('application/unknown')).toBe('general');
    });
  });

  describe('getFileExtension', () => {
    it('正しい拡張子を取得する', () => {
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('video.mp4')).toBe('mp4');
    });

    it('拡張子がない場合にbinを返す', () => {
      expect(getFileExtension('filename')).toBe('bin');
    });

    it('許可されていない拡張子でbinを返す', () => {
      expect(getFileExtension('malware.exe')).toBe('bin');
      expect(getFileExtension('script.js')).toBe('bin');
    });

    it('大文字の拡張子を小文字に変換する', () => {
      expect(getFileExtension('IMAGE.JPG')).toBe('jpg');
      expect(getFileExtension('Document.PDF')).toBe('pdf');
    });
  });

  describe('generateDisplayFilename', () => {
    it('安全な表示用ファイル名を生成する', () => {
      const result = generateDisplayFilename('test image.jpg');
      expect(result).toMatch(/^[a-zA-Z0-9-_]+\.jpg$/);
    });

    it('特殊文字をアンダースコアに置換する', () => {
      const result = generateDisplayFilename('test@#$%image.png');
      expect(result).toBe('test_image.png'); // sanitizeFilenameが先に処理される
    });

    it('長いファイル名を50文字に制限する', () => {
      const longName = 'a'.repeat(100) + '.jpg';
      const result = generateDisplayFilename(longName);
      expect(result.length).toBeLessThanOrEqual(54); // 50文字 + '.jpg'
    });
  });

  describe('validatePresignedExpires', () => {
    it('有効な有効期限をそのまま返す', () => {
      expect(validatePresignedExpires(3600)).toBe(3600);
      expect(validatePresignedExpires(7200)).toBe(7200);
    });

    it('最小値未満の場合にデフォルト値を返す', () => {
      expect(validatePresignedExpires(0)).toBe(MEDIA_V2_CONSTANTS.DEFAULT_PRESIGNED_EXPIRES);
      expect(validatePresignedExpires(-100)).toBe(MEDIA_V2_CONSTANTS.DEFAULT_PRESIGNED_EXPIRES);
    });

    it('最大値を超える場合に最大値を返す', () => {
      const overMax = MEDIA_V2_CONSTANTS.MAX_PRESIGNED_EXPIRES + 1000;
      expect(validatePresignedExpires(overMax)).toBe(MEDIA_V2_CONSTANTS.MAX_PRESIGNED_EXPIRES);
    });
  });
});
