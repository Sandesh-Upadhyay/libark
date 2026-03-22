/**
 * タイムゾーン対応の統一時間フォーマットユーティリティ
 *
 * date-fns-tzを使用してユーザーのタイムゾーンに合わせた時間表示を提供
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ja, enUS } from 'date-fns/locale';

// サポートするロケール
const LOCALES = {
  ja,
  en: enUS,
} as const;

export type SupportedLocale = keyof typeof LOCALES;

/**
 * 日付文字列またはDateオブジェクトを安全にパース
 */
export function parseDate(date: string | Date): Date | null {
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    // ISO文字列の場合はparseISOを使用
    if (date.includes('T') || date.includes('Z')) {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    }

    // その他の文字列の場合はnew Dateを使用
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

/**
 * ブラウザのタイムゾーンを取得
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Asia/Tokyo'; // フォールバック
  }
}

/**
 * タイムゾーンの有効性をチェック
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
 * 指定されたタイムゾーンで時間をフォーマット
 */
export function formatInUserTimezone(
  date: string | Date,
  formatString: string,
  timezone: string,
  locale: SupportedLocale = 'ja'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return '無効な日付';
  }

  try {
    const localeObj = LOCALES[locale];
    return formatInTimeZone(parsedDate, timezone, formatString, { locale: localeObj });
  } catch (error) {
    console.warn('Time formatting error:', error);
    // フォールバック: ローカル時間でフォーマット
    return format(parsedDate, formatString, { locale: LOCALES[locale] });
  }
}

/**
 * 相対時間をユーザーのタイムゾーンで表示
 */
export function formatRelativeTimeInTimezone(
  date: string | Date,
  timezone: string,
  locale: SupportedLocale = 'ja'
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return '無効な日付';
  }

  try {
    // ユーザーのタイムゾーンに変換
    const zonedDate = toZonedTime(parsedDate, timezone);
    const localeObj = LOCALES[locale];

    return formatDistanceToNow(zonedDate, {
      addSuffix: true,
      locale: localeObj,
    });
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    // フォールバック: ローカル時間で相対時間表示
    return formatDistanceToNow(parsedDate, {
      addSuffix: true,
      locale: LOCALES[locale],
    });
  }
}

/**
 * 統一時間フォーマット設定
 */
export const TIME_FORMATS = {
  // 絶対時間フォーマット
  FULL: 'yyyy年MM月dd日 HH:mm:ss',
  DATE_TIME: 'yyyy/MM/dd HH:mm',
  DATE_ONLY: 'yyyy/MM/dd',
  TIME_ONLY: 'HH:mm',
  SHORT_DATE: 'MM/dd',
  SHORT_DATE_TIME: 'MM/dd HH:mm',

  // 英語フォーマット
  FULL_EN: 'MMM dd, yyyy HH:mm:ss',
  DATE_TIME_EN: 'MMM dd, yyyy HH:mm',
  DATE_ONLY_EN: 'MMM dd, yyyy',
  TIME_ONLY_EN: 'HH:mm',
  SHORT_DATE_EN: 'MMM dd',
  SHORT_DATE_TIME_EN: 'MMM dd HH:mm',
} as const;

/**
 * ロケールに応じたフォーマットを取得
 */
export function getFormatForLocale(
  formatType: keyof typeof TIME_FORMATS,
  locale: SupportedLocale
): string {
  if (locale === 'en') {
    // 英語フォーマットが存在する場合は使用
    const enFormat = `${formatType}_EN` as keyof typeof TIME_FORMATS;
    if (enFormat in TIME_FORMATS) {
      return TIME_FORMATS[enFormat];
    }
  }

  return TIME_FORMATS[formatType];
}

/**
 * 統一時間表示フック用のフォーマット関数
 */
export interface TimeFormatResult {
  relativeTime: string;
  absoluteTime: string;
  hasError: boolean;
}

/**
 * 統一時間フォーマット（リアルタイム更新対応）
 */
export function formatUnifiedTime(
  date: string | Date,
  timezone: string,
  locale: SupportedLocale = 'ja',
  absoluteFormat?: string
): TimeFormatResult {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return {
      relativeTime: locale === 'ja' ? '無効な日付' : 'Invalid date',
      absoluteTime: locale === 'ja' ? '無効な日付' : 'Invalid date',
      hasError: true,
    };
  }

  // タイムゾーンの有効性をチェック
  if (!isValidTimezone(timezone)) {
    console.warn(`Invalid timezone: ${timezone}, falling back to browser timezone`);
    timezone = getBrowserTimezone();
  }

  try {
    // 相対時間
    const relativeTime = formatRelativeTimeInTimezone(parsedDate, timezone, locale);

    // 絶対時間
    const formatString = absoluteFormat || getFormatForLocale('FULL', locale);
    const absoluteTime = formatInUserTimezone(parsedDate, formatString, timezone, locale);

    return {
      relativeTime,
      absoluteTime,
      hasError: false,
    };
  } catch (error) {
    console.warn('Unified time formatting error:', error);

    // フォールバック処理: ローカル時間で表示
    try {
      const relativeTime = formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: LOCALES[locale],
      });

      const absoluteTime = format(parsedDate, TIME_FORMATS.FULL, {
        locale: LOCALES[locale],
      });

      return {
        relativeTime,
        absoluteTime,
        hasError: true,
      };
    } catch (fallbackError) {
      console.error('Fallback time formatting failed:', fallbackError);

      // 最終フォールバック: 基本的な文字列表示
      const errorMessage = locale === 'ja' ? '時間表示エラー' : 'Time display error';
      return {
        relativeTime: errorMessage,
        absoluteTime: errorMessage,
        hasError: true,
      };
    }
  }
}

/**
 * 現在時刻をユーザーのタイムゾーンで取得
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  try {
    const now = new Date();
    return toZonedTime(now, timezone);
  } catch {
    return new Date(); // フォールバック
  }
}

/**
 * ユーザーのタイムゾーンの時刻をUTCに変換
 */
export function convertToUTC(date: Date, timezone: string): Date {
  try {
    return fromZonedTime(date, timezone);
  } catch {
    return date; // フォールバック
  }
}
