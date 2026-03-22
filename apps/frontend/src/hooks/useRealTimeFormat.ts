'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  formatUnifiedTime,
  getBrowserTimezone,
  type SupportedLocale,
} from '@/lib/utils/timezoneUtils';

interface UseRealTimeFormatOptions {
  /** 更新間隔（ミリ秒）デフォルト: 1000ms（1秒） */
  updateInterval?: number;
  /** 自動更新を有効にするかどうか デフォルト: true */
  enableAutoUpdate?: boolean;
  /** 絶対時間のフォーマット デフォルト: "yyyy年MM月dd日 HH:mm:ss" */
  absoluteFormat?: string;
  /** タイムゾーン（IANA識別子）デフォルト: ブラウザのタイムゾーン */
  timezone?: string;
  /** ロケール デフォルト: 'ja' */
  locale?: SupportedLocale;
}

interface UseRealTimeFormatReturn {
  /** 相対時間（例: "2分前"） */
  relativeTime: string;
  /** 絶対時間（例: "2024年1月1日 12:00:00"） */
  absoluteTime: string;
  /** フォーマットエラーがあるかどうか */
  hasError: boolean;
}

/**
 * リアルタイム時間フォーマットフック
 *
 * 指定された日時を相対時間と絶対時間でリアルタイム更新しながら表示するためのフック
 *
 * @param dateTime - フォーマットする日時（string | Date）
 * @param options - オプション設定
 * @returns 相対時間、絶対時間、エラー状態
 *
 * @example
 * ```tsx
 * const { relativeTime, absoluteTime, hasError } = useRealTimeFormat(post.createdAt, {
 *   updateInterval: 1000,
 *   enableAutoUpdate: true
 * });
 *
 * return (
 *   <span title={absoluteTime}>
 *     {relativeTime}
 *   </span>
 * );
 * ```
 */
export const useRealTimeFormat = (
  dateTime: string | Date,
  options: UseRealTimeFormatOptions = {}
): UseRealTimeFormatReturn => {
  const {
    updateInterval = 1000,
    enableAutoUpdate = true,
    absoluteFormat = 'yyyy年MM月dd日 HH:mm:ss',
    timezone = getBrowserTimezone(),
    locale = 'ja',
  } = options;

  const [currentTime, setCurrentTime] = useState(() => new Date());

  // 統一時間フォーマットを使用（メモ化）
  const timeFormat = useMemo(() => {
    return formatUnifiedTime(dateTime, timezone, locale, absoluteFormat);
  }, [dateTime, timezone, locale, absoluteFormat, currentTime]);

  // エラー状態の判定（メモ化）
  const hasError = useMemo(() => {
    return timeFormat.hasError;
  }, [timeFormat]);

  // 動的な更新間隔の計算
  const dynamicUpdateInterval = useMemo(() => {
    if (hasError) return updateInterval;

    try {
      const parsedDate = new Date(dateTime);
      if (isNaN(parsedDate.getTime())) return updateInterval;

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

      // 1分未満は1秒間隔、1時間未満は30秒間隔、それ以外は60秒間隔
      if (diffInSeconds < 60) return 1000;
      if (diffInSeconds < 3600) return 30000;
      return 60000;
    } catch {
      return updateInterval;
    }
  }, [dateTime, updateInterval, currentTime, hasError]);

  // リアルタイム更新のセットアップ（間隔を最適化）
  useEffect(() => {
    if (!enableAutoUpdate) return;

    // 最小更新間隔を30秒に設定（負荷軽減）
    const optimizedInterval = Math.max(dynamicUpdateInterval, 30000);

    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, optimizedInterval);

    return () => clearInterval(intervalId);
  }, [enableAutoUpdate, dynamicUpdateInterval]);

  return {
    relativeTime: timeFormat.relativeTime,
    absoluteTime: timeFormat.absoluteTime,
    hasError: timeFormat.hasError,
  };
};

/**
 * 静的な時間フォーマット関数
 *
 * リアルタイム更新が不要な場合に使用
 *
 * @param dateTime - フォーマットする日時
 * @param absoluteFormat - 絶対時間のフォーマット
 * @param timezone - タイムゾーン（IANA識別子）
 * @param locale - ロケール
 * @returns 相対時間と絶対時間
 */
export const formatTimeStatic = (
  dateTime: string | Date,
  absoluteFormat: string = 'yyyy年MM月dd日 HH:mm:ss',
  timezone: string = getBrowserTimezone(),
  locale: SupportedLocale = 'ja'
) => {
  // 統一時間フォーマット関数を使用
  return formatUnifiedTime(dateTime, timezone, locale, absoluteFormat);
};
