/**
 * 🔐 Uploadトークンサービス
 *
 * 責任:
 * - JWTベースのトークン生成
 * - トークン検証
 */

import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

// トークンペイロード
export interface UploadTokenPayload {
  uploadId: string;
  userId: string;
  aud: string; // 's3-gateway-upload'
  exp: number;
  iat: number;
  contentType?: string; // 改ざん防止用（オプション）
}

export class UploadTokenService {
  private readonly AUDIENCE = 's3-gateway-upload';
  private readonly EXPIRES_IN = 600; // 10分（秒）

  constructor(private readonly jwtSecret: string) {}

  /**
   * トークン生成
   */
  generateToken(uploadId: string, userId: string, contentType?: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: UploadTokenPayload = {
      uploadId,
      userId,
      aud: this.AUDIENCE,
      exp: now + this.EXPIRES_IN,
      iat: now,
      contentType,
    };

    const options: SignOptions = {
      // audienceはペイロードに含まれているため、optionsには指定しない
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * トークン検証
   */
  verifyToken(token: string): UploadTokenPayload | null {
    try {
      const options: VerifyOptions = {
        audience: this.AUDIENCE,
      };

      const decoded = jwt.verify(token, this.jwtSecret, options) as UploadTokenPayload;

      return decoded;
    } catch (_error) {
      return null;
    }
  }
}
