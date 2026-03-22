/**
 * タイムゾーン自動検出ユーティリティ
 *
 * ブラウザAPIとIPベースの検出を組み合わせて、
 * ユーザーのタイムゾーンを自動検出する機能を提供
 */

import { z } from 'zod';

// IPGeolocation.io APIレスポンス型
const IPGeolocationResponseSchema = z.object({
  timezone: z.string(),
  country_code2: z.string().optional(),
  city: z.string().optional(),
});

/**
 * IPアドレスからタイムゾーンを検出
 * IPGeolocation.io の無料APIを使用
 */
export async function detectTimezoneFromIP(
  ipAddress: string,
  apiKey?: string
): Promise<string | null> {
  try {
    // APIキーがない場合は無料版を使用（制限あり）
    const baseUrl = 'https://api.ipgeolocation.io/timezone';
    const url = apiKey
      ? `${baseUrl}?apiKey=${apiKey}&ip=${ipAddress}`
      : `${baseUrl}?ip=${ipAddress}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LIBARK/1.0',
      },
      // タイムアウト設定（5秒）
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`IPGeolocation API error: ${response.status} ${response.statusText}`);
      console.warn(`Response body: ${errorText}`);
      console.warn(`Request URL: ${url}`);
      return null;
    }

    const data = await response.json();
    const parsed = IPGeolocationResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.warn('IPGeolocation API response validation failed:', parsed.error);
      return null;
    }

    // タイムゾーンの有効性をチェック
    const timezone = parsed.data.timezone;
    if (isValidTimezone(timezone)) {
      return timezone;
    }

    console.warn(`Invalid timezone from IP detection: ${timezone}`);
    return null;
  } catch (error) {
    console.warn('IP-based timezone detection failed:', error);
    return null;
  }
}

/**
 * リクエストヘッダーからクライアントIPアドレスを取得
 */
export function extractClientIP(
  headers: Record<string, string | string[] | undefined>
): string | null {
  // プロキシ経由の場合のヘッダーをチェック
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIP = ips.split(',')[0].trim();
    if (firstIP && firstIP !== '127.0.0.1' && firstIP !== '::1') {
      return firstIP;
    }
  }

  // その他のプロキシヘッダー
  const realIP = headers['x-real-ip'];
  if (realIP && typeof realIP === 'string' && realIP !== '127.0.0.1' && realIP !== '::1') {
    return realIP;
  }

  const clientIP = headers['x-client-ip'];
  if (clientIP && typeof clientIP === 'string' && clientIP !== '127.0.0.1' && clientIP !== '::1') {
    return clientIP;
  }

  // 直接接続の場合（開発環境では通常localhost）
  const remoteAddress = headers['remote-address'] || headers['x-remote-address'];
  if (remoteAddress && typeof remoteAddress === 'string') {
    return remoteAddress;
  }

  return null;
}

/**
 * タイムゾーン識別子の有効性をチェック
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * デフォルトタイムゾーンのリスト（地域別）
 * IP検出が失敗した場合のフォールバック用
 */
export const DEFAULT_TIMEZONES_BY_REGION = {
  // アジア太平洋
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
  SG: 'Asia/Singapore',
  TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh',
  ID: 'Asia/Jakarta',
  MY: 'Asia/Kuala_Lumpur',
  PH: 'Asia/Manila',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',

  // 北米
  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',

  // ヨーロッパ
  GB: 'Europe/London',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Zurich',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  RU: 'Europe/Moscow',

  // その他
  BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires',
  IN: 'Asia/Kolkata',
  ZA: 'Africa/Johannesburg',
} as const;

/**
 * 国コードからデフォルトタイムゾーンを取得
 */
export function getDefaultTimezoneByCountry(countryCode: string): string {
  const upperCode = countryCode.toUpperCase() as keyof typeof DEFAULT_TIMEZONES_BY_REGION;
  return DEFAULT_TIMEZONES_BY_REGION[upperCode] || 'Asia/Tokyo';
}

/**
 * 包括的なタイムゾーン検出
 *
 * 1. ブラウザから送信されたタイムゾーン（最優先）
 * 2. IPアドレスベースの検出
 * 3. デフォルト値（Asia/Tokyo）
 */
export async function detectUserTimezone(options: {
  browserTimezone?: string;
  ipAddress?: string;
  countryCode?: string;
  apiKey?: string;
}): Promise<string> {
  const { browserTimezone, ipAddress, countryCode, apiKey } = options;

  // 1. ブラウザから送信されたタイムゾーンを最優先
  if (browserTimezone && isValidTimezone(browserTimezone)) {
    return browserTimezone;
  }

  // 2. IPアドレスベースの検出
  if (ipAddress) {
    const ipTimezone = await detectTimezoneFromIP(ipAddress, apiKey);
    if (ipTimezone) {
      return ipTimezone;
    }
  }

  // 3. 国コードベースのフォールバック
  if (countryCode) {
    return getDefaultTimezoneByCountry(countryCode);
  }

  // 4. 最終的なデフォルト値
  return 'Asia/Tokyo';
}
