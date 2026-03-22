/**
 * 🎯 通貨フォーマット統一ユーティリティ
 *
 * サイト全体で統一された通貨表示フォーマットを提供
 * 3,654.87 USD 形式での表示を標準とする
 */

/**
 * 通貨フォーマットオプション
 */
export interface CurrencyFormatOptions {
  /** 通貨コード */
  currency?: string;
  /** 小数点以下の桁数 */
  decimals?: number;
  /** カンマ区切りを使用するか */
  useGrouping?: boolean;
  /** 通貨記号を表示するか */
  showCurrency?: boolean;
  /** 符号を表示するか（取引履歴用） */
  showSign?: boolean;
  /** コンパクト表示（K, M表記） */
  compact?: boolean;
}

/**
 * デフォルトフォーマットオプション
 */
const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  currency: 'USD',
  decimals: 2,
  useGrouping: true,
  showCurrency: true,
  showSign: false,
  compact: false,
};

/**
 * 🎯 統一通貨フォーマット関数
 *
 * @param amount - 金額
 * @param options - フォーマットオプション
 * @returns フォーマットされた通貨文字列
 *
 * @example
 * formatCurrency(1000) // "1,000.00 USD"
 * formatCurrency(1000, { decimals: 0 }) // "1,000 USD"
 * formatCurrency(-500, { showSign: true }) // "-500.00 USD"
 * formatCurrency(1500000, { compact: true }) // "1.5M USD"
 */
export const formatCurrency = (amount: number, options: CurrencyFormatOptions = {}): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // コンパクト表示の場合
  if (opts.compact) {
    return formatCompactCurrency(amount, opts);
  }

  // 符号の処理
  const sign = opts.showSign && amount !== 0 ? (amount >= 0 ? '+' : '') : '';
  const absAmount = Math.abs(amount);

  // 数値フォーマット
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: opts.decimals,
    maximumFractionDigits: opts.decimals,
    useGrouping: opts.useGrouping,
  }).format(absAmount);

  // 通貨記号の追加
  const currencyPart = opts.showCurrency ? ` ${opts.currency}` : '';

  return `${sign}${formattedNumber}${currencyPart}`;
};

/**
 * コンパクト通貨フォーマット（K, M表記）
 */
const formatCompactCurrency = (
  amount: number,
  options: Required<CurrencyFormatOptions>
): string => {
  const sign = options.showSign && amount !== 0 ? (amount >= 0 ? '+' : '') : '';
  const absAmount = Math.abs(amount);

  let formattedNumber: string;

  if (absAmount >= 1000000) {
    formattedNumber = `${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    formattedNumber = `${(absAmount / 1000).toFixed(1)}K`;
  } else {
    formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: options.decimals,
      useGrouping: options.useGrouping,
    }).format(absAmount);
  }

  const currencyPart = options.showCurrency ? ` ${options.currency}` : '';
  return `${sign}${formattedNumber}${currencyPart}`;
};

/**
 * 🎯 ウォレット残高専用フォーマット
 *
 * @param amount - 残高金額
 * @param currency - 通貨コード
 * @param options - フォーマットオプション
 * @returns フォーマットされた残高文字列
 *
 * @example
 * formatWalletBalance(1000) // "1,000.00 USD"
 * formatWalletBalance(1234.56, "EUR") // "1,234.56 EUR"
 * formatWalletBalance(1500000, "USD", { compact: true }) // "1.5M USD"
 */
export const formatWalletBalance = (
  amount: number,
  currency: string = 'USD',
  options: Partial<CurrencyFormatOptions> = {}
): string => {
  return formatCurrency(amount, {
    currency,
    decimals: 2,
    useGrouping: true,
    showCurrency: true,
    showSign: false,
    compact: false,
    ...options,
  });
};

/**
 * 🎯 取引履歴専用フォーマット
 *
 * @param amount - 取引金額
 * @param currency - 通貨コード
 * @returns フォーマットされた取引金額文字列
 *
 * @example
 * formatTransactionAmount(500) // "+500.00 USD"
 * formatTransactionAmount(-200) // "-200.00 USD"
 */
export const formatTransactionAmount = (amount: number, currency: string = 'USD'): string => {
  return formatCurrency(amount, {
    currency,
    decimals: 2,
    useGrouping: true,
    showCurrency: true,
    showSign: true,
    compact: false,
  });
};

/**
 * 🎯 ナビゲーションメニュー専用フォーマット（統一表記）
 *
 * @param amount - 残高金額
 * @param currency - 通貨コード
 * @returns 統一フォーマットされた残高文字列
 *
 * @example
 * formatMenuBalance(1000) // "1,000.00 USD"
 * formatMenuBalance(1500000) // "1,500,000.00 USD"
 */
export const formatMenuBalance = (amount: number, currency: string = 'USD'): string => {
  return formatWalletBalance(amount, currency);
};

/**
 * 🎯 入力フィールド専用フォーマット（通貨記号なし）
 *
 * @param amount - 入力金額
 * @returns フォーマットされた数値文字列
 *
 * @example
 * formatInputAmount(1000) // "1,000.00"
 */
export const formatInputAmount = (amount: number): string => {
  return formatCurrency(amount, {
    decimals: 2,
    useGrouping: true,
    showCurrency: false,
    showSign: false,
    compact: false,
  });
};

/**
 * 🎯 数値文字列を金額に変換
 *
 * @param value - 数値文字列
 * @returns 数値または0
 *
 * @example
 * parseAmount("1,234.56") // 1234.56
 * parseAmount("invalid") // 0
 */
export const parseAmount = (value: string): number => {
  // カンマを除去して数値に変換
  const cleanValue = value.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * 🎯 金額の妥当性チェック
 *
 * @param amount - チェックする金額
 * @param min - 最小値
 * @param max - 最大値
 * @returns 妥当性チェック結果
 */
export const validateAmount = (
  amount: number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): { isValid: boolean; error?: string } => {
  if (isNaN(amount)) {
    return { isValid: false, error: '有効な数値を入力してください' };
  }

  if (amount < min) {
    return { isValid: false, error: `最小金額は ${formatCurrency(min)} です` };
  }

  if (amount > max) {
    return { isValid: false, error: `最大金額は ${formatCurrency(max)} です` };
  }

  return { isValid: true };
};
