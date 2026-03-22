/**
 * 🎯 統一バリデーション定数
 *
 * 責任:
 * - 文字数制限、数値範囲、ファイルサイズ制限の統一管理
 * - バリデーションルールの重複防止
 * - 一貫したバリデーション体験の提供
 *
 * 使用方法:
 * - Zodスキーマやフォームバリデーションでこの定数を使用
 * - ESLintルールによりハードコード制限値の使用を検出・警告
 */

/**
 * テキスト関連の制限値
 */
export const VALIDATION_LIMITS = {
  // ユーザープロフィール
  profile: {
    displayNameMin: 1,
    displayNameMax: 50,
    bioMax: 500,
  },

  // 投稿関連
  post: {
    contentMax: 500,
    titleMax: 100,
    descriptionMax: 200,
  },

  // コメント
  comment: {
    contentMax: 300,
  },

  // 一般的なテキスト
  text: {
    shortMax: 50, // 短いテキスト（タイトル、名前など）
    mediumMax: 200, // 中程度のテキスト（説明など）
    longMax: 500, // 長いテキスト（内容、自己紹介など）
    veryLongMax: 1000, // 非常に長いテキスト（詳細説明など）
  },

  // パスワード
  password: {
    min: 8,
    max: 128,
  },

  // メールアドレス
  email: {
    max: 254, // RFC 5321準拠
  },
} as const;

/**
 * 数値関連の制限値
 */
export const VALIDATION_RANGES = {
  // 価格設定
  price: {
    min: 0.01,
    max: 10000,
  },

  // 年齢
  age: {
    min: 13,
    max: 120,
  },

  // 評価・レーティング
  rating: {
    min: 1,
    max: 5,
  },

  // パーセンテージ
  percentage: {
    min: 0,
    max: 100,
  },

  // 暗号通貨関連
  crypto: {
    minAmount: 0.00000001, // 1 satoshi
    maxAmount: 21000000, // Bitcoin max supply
  },
} as const;

/**
 * ファイル関連の制限値
 */
export const VALIDATION_FILES = {
  // 画像ファイル
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxCount: 4, // 最大4枚
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },

  // 動画ファイル
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxCount: 1, // 最大1本
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    allowedExtensions: ['.mp4', '.webm', '.ogg'],
  },

  // 音声ファイル
  audio: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxCount: 1, // 最大1本
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    allowedExtensions: ['.mp3', '.wav', '.ogg'],
  },

  // ドキュメントファイル
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxCount: 5, // 最大5ファイル
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
  },
} as const;

/**
 * 正規表現パターン
 */
export const VALIDATION_PATTERNS = {
  // ユーザー名（英数字とアンダースコア、3-20文字）
  username: /^[a-zA-Z0-9_]{3,20}$/,

  // 表示名（前後の空白を除く）
  displayName: /^[^\s].*[^\s]$|^[^\s]$/,

  // 日本の電話番号
  phoneJP: /^0\d{1,4}-\d{1,4}-\d{4}$/,

  // 郵便番号（日本）
  postalCodeJP: /^\d{3}-\d{4}$/,

  // URL
  url: /^https?:\/\/.+/,

  // 暗号通貨アドレス（Bitcoin）
  bitcoinAddress: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,

  // 色コード（Hex）
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * エラーメッセージテンプレート
 */
export const VALIDATION_MESSAGES = {
  // 必須フィールド
  required: (field: string) => `${field}は必須です`,

  // 文字数制限
  tooShort: (field: string, min: number) => `${field}は${min}文字以上で入力してください`,
  tooLong: (field: string, max: number) => `${field}は${max}文字以内で入力してください`,

  // 数値範囲
  tooSmall: (field: string, min: number) => `${field}は${min}以上で設定してください`,
  tooLarge: (field: string, max: number) => `${field}は${max}以下で設定してください`,

  // フォーマット
  invalidFormat: (field: string) => `${field}の形式が正しくありません`,
  invalidEmail: 'メールアドレスの形式が正しくありません',
  invalidUrl: 'URLの形式が正しくありません',

  // ファイル
  fileTooLarge: (maxSize: string) => `ファイルサイズは${maxSize}以下にしてください`,
  tooManyFiles: (maxCount: number) => `ファイルは${maxCount}個まで選択できます`,
  invalidFileType: (allowedTypes: string[]) =>
    `許可されているファイル形式: ${allowedTypes.join(', ')}`,

  // パスワード
  passwordTooWeak: 'パスワードは英数字を含む8文字以上で設定してください',
  passwordMismatch: 'パスワードが一致しません',

  // 一般的なエラー
  networkError: 'ネットワークエラーが発生しました',
  serverError: 'サーバーエラーが発生しました',
  unknownError: '予期しないエラーが発生しました',
} as const;

/**
 * バリデーション用ヘルパー関数
 */
export const VALIDATION_HELPERS = {
  // ファイルサイズを人間が読みやすい形式に変換
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 文字数カウント（全角文字を2文字として計算）
  countCharacters: (text: string): number => {
    return text.replace(/[^\x01-\x7E]/g, 'xx').length;
  },

  // バリデーション結果の型定義
  createValidationResult: (isValid: boolean, message?: string) => ({
    isValid,
    message: message || '',
  }),
} as const;

/**
 * 型定義
 */
export type ValidationLimit = keyof typeof VALIDATION_LIMITS;
export type ValidationRange = keyof typeof VALIDATION_RANGES;
export type ValidationPattern = keyof typeof VALIDATION_PATTERNS;
