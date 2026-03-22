/**
 * OGP署名サービス
 *
 * OGP匿名配信エンドポイント用の署名生成・検証ロジック
 * バックエンドとゲートウェイで共通使用される
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * OGP署名オプション
 */
export interface OgpSignatureOptions {
  /** パス（例: /ogp/media/123） */
  path: string;
  /** ソルト（署名の失効に使用） */
  salt: string;
  /** 有効期限（Unixタイムスタンプ秒） */
  exp: number;
  /** 署名キー */
  signingKey: string;
}

/**
 * OGP署名検証オプション
 */
export interface OgpVerifyOptions extends OgpSignatureOptions {
  /** 検証する署名 */
  signature: string;
  /** 許容する未来の最大秒数（デフォルト: 300秒 = 5分） */
  maxFutureSec?: number;
}

/**
 * canonical文字列を作成
 * @param path - パス
 * @param salt - ソルト
 * @param exp - 有効期限
 * @returns canonical文字列
 */
function createCanonical(path: string, salt: string, exp: number): string {
  return `${path}:${salt}:${exp}`;
}

/**
 * OGP署名を生成
 *
 * @param path - パス（例: /ogp/media/123）
 * @param salt - ソルト（署名の失効に使用）
 * @param exp - 有効期限（Unixタイムスタンプ秒）
 * @param signingKey - 署名キー
 * @returns hex文字列の署名
 */
export function generateSignature(
  path: string,
  salt: string,
  exp: number,
  signingKey: string
): string {
  const canonical = createCanonical(path, salt, exp);
  const hmac = createHmac('sha256', signingKey);
  hmac.update(canonical);
  return hmac.digest('hex');
}

/**
 * OGP署名を検証
 *
 * @param path - パス
 * @param salt - ソルト
 * @param exp - 有効期限
 * @param signature - 検証する署名
 * @param signingKey - 署名キー
 * @param maxFutureSec - 許容する未来の最大秒数（デフォルト: 300秒 = 5分）
 * @returns 署名が有効ならtrue、無効ならfalse
 */
export function verifySignature(
  path: string,
  salt: string,
  exp: number,
  signature: string,
  signingKey: string,
  maxFutureSec: number = 300
): boolean {
  const now = Math.floor(Date.now() / 1000);

  // 期限切れチェック
  if (exp <= now) {
    return false;
  }

  // 未来過ぎチェック
  if (exp - now > maxFutureSec) {
    return false;
  }

  // 署名長チェック（タイミング攻撃対策）
  const expectedSignature = generateSignature(path, salt, exp, signingKey);
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  // タイミング攻撃対策でtimingSafeEqualを使用
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    // hexデコードに失敗した場合は無効
    return false;
  }
}

/**
 * OGP署名を生成（オプションオブジェクト版）
 */
export function generateSignatureFromOptions(options: OgpSignatureOptions): string {
  return generateSignature(options.path, options.salt, options.exp, options.signingKey);
}

/**
 * OGP署名を検証（オプションオブジェクト版）
 */
export function verifySignatureFromOptions(options: OgpVerifyOptions): boolean {
  return verifySignature(
    options.path,
    options.salt,
    options.exp,
    options.signature,
    options.signingKey,
    options.maxFutureSec
  );
}

/**
 * OGP署名を検証（デバッグ用）
 * 検証失敗の原因を特定するために使用
 */
export function verifySignatureDebug(
  path: string,
  salt: string,
  exp: number,
  signature: string,
  signingKey: string,
  maxFutureSec: number = 300
): { valid: boolean; reason?: string } {
  const now = Math.floor(Date.now() / 1000);

  // 期限切れチェック
  if (exp <= now) {
    return { valid: false, reason: `expired: exp=${exp}, now=${now}` };
  }

  // 未来過ぎチェック
  if (exp - now > maxFutureSec) {
    return {
      valid: false,
      reason: `too far in future: exp=${exp}, now=${now}, maxFutureSec=${maxFutureSec}`,
    };
  }

  // 署名長チェック
  const expectedSignature = generateSignature(path, salt, exp, signingKey);
  if (signature.length !== expectedSignature.length) {
    return {
      valid: false,
      reason: `length mismatch: sig=${signature.length}, expected=${expectedSignature.length}`,
    };
  }

  // 署名検証
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const result = timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!result) {
      return { valid: false, reason: 'signature mismatch' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: `hex decode error: ${e}` };
  }
}

/**
 * オンデマンドOGP署名オプション（期限なし）
 */
export interface OnDemandSignatureOptions {
  /** メディアID */
  mediaId: string;
  /** バリアント（standard | teaser） */
  variant: string;
  /** コンテンツハッシュ */
  contentHash: string;
  /** 拡張子（例: jpg） */
  ext: string;
  /** 署名キー */
  signingKey: string;
}

/**
 * オンデマンドOGP署名検証オプション（期限なし）
 */
export interface OnDemandVerifyOptions extends OnDemandSignatureOptions {
  /** 検証する署名 */
  signature: string;
}

/**
 * オンデマンドOGP用canonical文字列を作成（期限なし）
 * @param mediaId - メディアID
 * @param variant - バリアント
 * @param contentHash - コンテンツハッシュ
 * @param ext - 拡張子
 * @returns canonical文字列
 */
function createOnDemandCanonical(
  mediaId: string,
  variant: string,
  contentHash: string,
  ext: string
): string {
  return `${mediaId}:${variant}:${contentHash}:${ext}`;
}

/**
 * オンデマンドOGP署名を生成（期限なし）
 *
 * @param mediaId - メディアID
 * @param variant - バリアント（standard | teaser）
 * @param contentHash - コンテンツハッシュ
 * @param ext - 拡張子（例: jpg）
 * @param signingKey - 署名キー
 * @returns hex文字列の署名
 */
export function generateOnDemandSignature(
  mediaId: string,
  variant: string,
  contentHash: string,
  ext: string,
  signingKey: string
): string {
  const canonical = createOnDemandCanonical(mediaId, variant, contentHash, ext);
  const hmac = createHmac('sha256', signingKey);
  hmac.update(canonical);
  return hmac.digest('hex');
}

/**
 * オンデマンドOGP署名を検証（期限なし）
 *
 * @param mediaId - メディアID
 * @param variant - バリアント
 * @param contentHash - コンテンツハッシュ
 * @param ext - 拡張子
 * @param signature - 検証する署名
 * @param signingKey - 署名キー
 * @returns 署名が有効ならtrue、無効ならfalse
 */
export function verifyOnDemandSignature(
  mediaId: string,
  variant: string,
  contentHash: string,
  ext: string,
  signature: string,
  signingKey: string
): boolean {
  // 署名長チェック（タイミング攻撃対策）
  const expectedSignature = generateOnDemandSignature(
    mediaId,
    variant,
    contentHash,
    ext,
    signingKey
  );
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  // タイミング攻撃対策でtimingSafeEqualを使用
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    // hexデコードに失敗した場合は無効
    return false;
  }
}

/**
 * オンデマンドOGP署名を生成（オプションオブジェクト版）
 */
export function generateOnDemandSignatureFromOptions(options: OnDemandSignatureOptions): string {
  return generateOnDemandSignature(
    options.mediaId,
    options.variant,
    options.contentHash,
    options.ext,
    options.signingKey
  );
}

/**
 * オンデマンドOGP署名を検証（オプションオブジェクト版）
 */
export function verifyOnDemandSignatureFromOptions(options: OnDemandVerifyOptions): boolean {
  return verifyOnDemandSignature(
    options.mediaId,
    options.variant,
    options.contentHash,
    options.ext,
    options.signature,
    options.signingKey
  );
}
