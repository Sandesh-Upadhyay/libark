/**
 * 🎨 OGP生成サービス
 *
 * オンデマンドOGP画像を生成するサービス
 * SVGテンプレート方式を使用（原画像を読まない）
 */

import { Readable } from 'stream';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * OGP生成メタデータ
 */
export interface OgpGeneratorMeta {
  /** メディアID */
  mediaId: string;
  /** バリアント */
  variant: 'standard' | 'teaser';
  /** 投稿ID（オプション） */
  postId?: string;
  /** 有料コンテンツかどうか */
  isPaid: boolean;
}

/**
 * 生成結果
 */
export interface OgpGenerationResult {
  /** 画像バッファ */
  buffer: Buffer;
  /** コンテンツタイプ */
  contentType: string;
  /** ETag */
  etag: string;
}

/**
 * OGP生成サービス
 */
export class OgpGeneratorService {
  /**
   * 標準OGPを生成
   *
   * @param meta - OGP生成メタデータ
   * @returns 生成結果
   */
  async generateStandardOgp(meta: OgpGeneratorMeta): Promise<Buffer> {
    // SVGテンプレートを生成
    const svg = this.generateStandardSvg(meta);
    return this.svgToBuffer(svg);
  }

  /**
   * ティーザーOGPを生成（有料コンテンツ用）
   *
   * @param meta - OGP生成メタデータ
   * @returns 生成結果
   */
  async generateTeaserOgp(meta: OgpGeneratorMeta): Promise<Buffer> {
    // SVGテンプレートを生成
    const svg = this.generateTeaserSvg(meta);
    return this.svgToBuffer(svg);
  }

  /**
   * フォールバックOGPを生成（汎用テンプレート）
   *
   * @returns 生成結果
   */
  async generateFallbackOgp(): Promise<Buffer> {
    const svg = this.generateFallbackSvg();
    return this.svgToBuffer(svg);
  }

  /**
   * OGPをS3に保存
   *
   * @param ogpKey - S3キー
   * @param buffer - 画像バッファ
   * @param contentType - コンテンツタイプ
   * @param s3Client - S3クライアント
   * @param bucket - バケット名
   */
  async saveOgpToS3(
    ogpKey: string,
    buffer: Buffer,
    contentType: string,
    s3Client: S3Client,
    bucket: string
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: ogpKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=86400, s-maxage=604800',
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('❌ [OgpGeneratorService] S3保存エラー:', error);
      throw error;
    }
  }

  /**
   * 標準OGP用SVGを生成
   *
   * @param meta - OGP生成メタデータ
   * @returns SVG文字列
   */
  private generateStandardSvg(meta: OgpGeneratorMeta): string {
    const { mediaId, variant, postId, isPaid } = meta;
    const title = isPaid ? '🔒 有料コンテンツ' : '📸 メディア';
    const subtitle = postId ? `Post: ${postId}` : `Media: ${mediaId}`;
    const badge = variant === 'teaser' ? 'ティーザー' : '標準';

    return `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 背景 -->
        <rect width="1200" height="630" fill="url(#bg-gradient)" />

        <!-- デコレーション -->
        <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.1)" />
        <circle cx="1100" cy="530" r="120" fill="rgba(255,255,255,0.1)" />

        <!-- タイトル -->
        <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
          ${title}
        </text>

        <!-- サブタイトル -->
        <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)">
          ${subtitle}
        </text>

        <!-- バッジ -->
        <rect x="520" y="380" width="160" height="50" rx="25" fill="rgba(255,255,255,0.2)" />
        <text x="600" y="412" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">
          ${badge}
        </text>

        <!-- ロゴ/ブランド -->
        <text x="1150" y="600" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.7)">
          LIBARK
        </text>
      </svg>
    `.trim();
  }

  /**
   * ティーザーOGP用SVGを生成
   *
   * @param meta - OGP生成メタデータ
   * @returns SVG文字列
   */
  private generateTeaserSvg(meta: OgpGeneratorMeta): string {
    const { mediaId, postId } = meta;
    const subtitle = postId ? `Post: ${postId}` : `Media: ${mediaId}`;

    return `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="teaser-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 背景 -->
        <rect width="1200" height="630" fill="url(#teaser-bg-gradient)" />

        <!-- デコレーション -->
        <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.1)" />
        <circle cx="1100" cy="530" r="120" fill="rgba(255,255,255,0.1)" />

        <!-- ロックアイコン -->
        <circle cx="600" cy="250" r="60" fill="rgba(255,255,255,0.2)" />
        <text x="600" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="white">
          🔒
        </text>

        <!-- タイトル -->
        <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
          有料コンテンツ
        </text>

        <!-- サブタイトル -->
        <text x="600" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)">
          ${subtitle}
        </text>

        <!-- 購入ボタン風 -->
        <rect x="500" y="440" width="200" height="60" rx="30" fill="white" />
        <text x="600" y="478" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f5576c">
          購入して表示
        </text>

        <!-- ロゴ/ブランド -->
        <text x="1150" y="600" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.7)">
          LIBARK
        </text>
      </svg>
    `.trim();
  }

  /**
   * フォールバックOGP用SVGを生成
   *
   * @returns SVG文字列
   */
  private generateFallbackSvg(): string {
    return `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fallback-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#434343;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 背景 -->
        <rect width="1200" height="630" fill="url(#fallback-bg-gradient)" />

        <!-- デコレーション -->
        <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.05)" />
        <circle cx="1100" cy="530" r="120" fill="rgba(255,255,255,0.05)" />

        <!-- アイコン -->
        <text x="600" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="rgba(255,255,255,0.5)">
          🖼️
        </text>

        <!-- タイトル -->
        <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
          画像を準備中
        </text>

        <!-- サブタイトル -->
        <text x="600" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">
          しばらくお待ちください
        </text>

        <!-- ロゴ/ブランド -->
        <text x="1150" y="600" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)">
          LIBARK
        </text>
      </svg>
    `.trim();
  }

  /**
   * SVGをJPEGバッファに変換
   *
   * @param svg - SVG文字列
   * @returns JPEGバッファ
   */
  private async svgToBuffer(svg: string): Promise<Buffer> {
    // SVGをJPEGに変換するために、canvasを使用
    // Node.js環境では canvas パッケージが必要だが、
    // ここでは簡易的にSVGをbase64エンコードしてdata URIとして返す
    // 実際の運用では sharp または canvas を使用してJPEGに変換することを推奨

    // とりあえずSVGをBufferとして返す（簡易実装）
    return Buffer.from(svg, 'utf-8');
  }

  /**
   * ETagを生成
   *
   * @param buffer - バッファ
   * @returns ETag
   */
  generateEtag(buffer: Buffer): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    return `"${hash}"`;
  }

  /**
   * BufferをReadableストリームに変換
   *
   * @param buffer - バッファ
   * @returns Readableストリーム
   */
  bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
}

// シングルトンインスタンス
let ogpGeneratorService: OgpGeneratorService | null = null;

/**
 * シングルトンOGP生成サービスを取得
 */
export function getOgpGeneratorService(): OgpGeneratorService {
  if (!ogpGeneratorService) {
    ogpGeneratorService = new OgpGeneratorService();
  }
  return ogpGeneratorService;
}
