/**
 * 🎯 ユーティリティ関数のエクスポート
 */

// 統一定数のエクスポート
export * from '../constants/design-system';
export * from '../constants/validation';
export * from '../constants/ui-config';

// 通貨フォーマット関連
export {
  formatCurrency,
  formatWalletBalance,
  formatTransactionAmount,
  formatMenuBalance,
  formatInputAmount,
  parseAmount,
  validateAmount,
  type CurrencyFormatOptions,
} from './currencyUtils';

// 画像関連
export {
  detectImageSourceType,
  isMediaId,
  isExternalUrl,
  hasValidImageSource,
  generateFallbackText,
  generateAltText,
  generateUnifiedImageUrl,
  createUnifiedImageSource,
  generateFallbackContent,
  type ImageSourceType,
  type ImageVariant,
  type UnifiedImageSource,
  type FallbackConfig,
} from './imageUtils';

// タイムゾーン関連
export {
  parseDate,
  getBrowserTimezone,
  isValidTimezone,
  formatInUserTimezone,
  formatRelativeTimeInTimezone,
  formatUnifiedTime,
  getCurrentTimeInTimezone,
  convertToUTC,
  getFormatForLocale,
  TIME_FORMATS,
  type SupportedLocale,
  type TimeFormatResult,
} from './timezoneUtils';

// アクセシビリティ関連
export {
  getFocusableElements,
  hasFocusableChildren,
  setSafeAriaHidden,
  hideFromAssistiveTech,
  showToAssistiveTech,
  createFocusTrap,
  createLiveRegion,
} from './accessibility';
