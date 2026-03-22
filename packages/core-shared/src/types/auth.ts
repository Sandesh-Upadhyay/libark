/**
 * 🔐 現代的認証システム型定義
 *
 * 業界標準のベストプラクティスに基づく型安全な認証システム
 * - 完全なTypeScript対応
 * - 厳密な型チェック
 * - エラーハンドリングの統一
 */

// JWT ペイロード型（標準クレーム + カスタムクレーム）
export interface JWTPayload {
  // 標準クレーム
  iss?: string; // Issuer
  sub?: string; // Subject (User ID)
  aud?: string | string[]; // Audience
  exp?: number; // Expiration Time
  nbf?: number; // Not Before
  iat?: number; // Issued At
  jti?: string; // JWT ID

  // カスタムクレーム（後方互換性のためidとuserIdの両方をサポート）
  id?: string; // 後方互換性のため
  userId: string;
  username: string;
  email: string;
  role?: string;
  permissions?: string[];
}

// 認証済みユーザー型（厳密な型定義）
export interface AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly isActive: boolean;
  readonly isVerified: boolean;
  readonly role: string;
  readonly permissions: readonly string[];
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;
}

// 認証結果型（Result Pattern適用）
export type AuthResult<T = AuthenticatedUser> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: AuthError };

// 統一認証レスポンス型（フロントエンド・バックエンド共通）
export interface AuthResponse<T = AuthenticatedUser> {
  success: boolean;
  data?: T | null;
  message?: string;
  error?: string;
  // 2FA関連フィールド
  requiresTwoFactor?: boolean;
  tempUserId?: string;
}

// 認証エラー型は下部のAuthErrorクラスで定義

// 認証エラーコード（const assertionで型安全性を向上）
export const AUTH_ERROR_CODES = {
  // 基本認証エラー
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  TOKEN_BLACKLISTED: 'TOKEN_BLACKLISTED',

  // ユーザー関連エラー
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',

  // セキュリティエラー
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // セッション・CSRF関連エラー
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  CSRF_TOKEN_MISSING: 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',

  // システムエラー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// 現代的なAuthErrorクラス（構造化エラー）
export class AuthError extends Error {
  public readonly timestamp: Date = new Date();

  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';

    // スタックトレースの最適化
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  // エラーの構造化された情報を取得
  toJSON(): {
    code: AuthErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: Date;
  } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  // 特定のエラーコードかどうかをチェック
  is(code: AuthErrorCode): boolean {
    return this.code === code;
  }

  // 複数のエラーコードのいずれかかどうかをチェック
  isOneOf(codes: AuthErrorCode[]): boolean {
    return codes.includes(this.code);
  }
}

// 認証エラーメッセージ
export const AUTH_ERROR_MESSAGES = {
  // 基本認証エラー
  [AUTH_ERROR_CODES.TOKEN_MISSING]: '認証トークンが見つかりません',
  [AUTH_ERROR_CODES.TOKEN_INVALID]: '無効な認証トークンです',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'ユーザーが見つかりません',
  [AUTH_ERROR_CODES.USER_INACTIVE]: 'アカウントが無効化されています',
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'メールアドレスまたはパスワードが正しくありません',

  // セキュリティエラー
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください',
  [AUTH_ERROR_CODES.TOKEN_BLACKLISTED]:
    'このトークンは無効化されています。再度ログインしてください',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: 'トークンの有効期限が切れています。再度ログインしてください',
  [AUTH_ERROR_CODES.TOKEN_REVOKED]: 'トークンが取り消されています。再度ログインしてください',

  // CSRF・セッション関連エラー
  [AUTH_ERROR_CODES.CSRF_TOKEN_MISSING]: 'CSRFトークンが見つかりません',
  [AUTH_ERROR_CODES.CSRF_TOKEN_INVALID]: '無効なCSRFトークンです',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]:
    'セッションの有効期限が切れています。再度ログインしてください',
  [AUTH_ERROR_CODES.SESSION_INVALID]: '無効なセッションです。再度ログインしてください',

  // 権限・アクセス制御エラー
  [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'この操作を実行する権限がありません',
  [AUTH_ERROR_CODES.ACCESS_DENIED]: 'アクセスが拒否されました',
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'アカウントがロックされています。管理者にお問い合わせください',
  [AUTH_ERROR_CODES.ACCOUNT_SUSPENDED]:
    'アカウントが一時停止されています。管理者にお問い合わせください',

  // システムエラー
  [AUTH_ERROR_CODES.INTERNAL_ERROR]: '認証処理中にエラーが発生しました',
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]:
    '認証サービスが一時的に利用できません。しばらく時間をおいてから再試行してください',
} as const;

// セキュリティイベント種別
export enum SecurityEventType {
  // 認証関連
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // セキュリティ関連
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',

  // アカウント管理
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',

  // 権限・アクセス制御
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',

  // セッション管理
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',
  CONCURRENT_SESSION_LIMIT = 'CONCURRENT_SESSION_LIMIT',

  // データアクセス
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',

  // システム関連
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
}

// セキュリティログエントリ
export interface SecurityLogEntry {
  // 基本情報
  eventType: SecurityEventType;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // ユーザー情報
  userId?: string;
  username?: string;
  email?: string;

  // リクエスト情報
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;

  // 地理的情報
  country?: string;
  city?: string;

  // 詳細情報
  details?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;

  // メタデータ
  source: 'BACKEND' | 'FRONTEND' | 'WORKER' | 'SYSTEM';
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
}

/**
 * セキュリティログマネージャー
 */
export class SecurityLogManager {
  private static instance: SecurityLogManager;
  private logBuffer: SecurityLogEntry[] = [];
  private readonly maxBufferSize = 100;
  private readonly flushInterval = 30000; // 30秒
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    // 定期的にバッファをフラッシュ
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  public static getInstance(): SecurityLogManager {
    if (!SecurityLogManager.instance) {
      SecurityLogManager.instance = new SecurityLogManager();
    }
    return SecurityLogManager.instance;
  }

  /**
   * セキュリティイベントをログに記録
   */
  public logEvent(entry: Omit<SecurityLogEntry, 'timestamp' | 'source' | 'environment'>): void {
    const fullEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date(),
      source: this.detectSource(),
      environment: this.detectEnvironment(),
    };

    // バッファに追加
    this.logBuffer.push(fullEntry);

    // 即座にコンソール出力（開発環境）
    if (this.detectEnvironment() === 'DEVELOPMENT') {
      this.logToConsole(fullEntry);
    }

    // バッファサイズ制限チェック
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }

    // 重要度が高い場合は即座にフラッシュ
    if (entry.severity === 'CRITICAL' || entry.severity === 'HIGH') {
      this.flushLogs();
    }
  }

  /**
   * バッファされたログをフラッシュ
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    // 本番環境では外部ログサービスに送信
    // 開発環境では詳細ログを出力
    if (this.detectEnvironment() === 'PRODUCTION') {
      this.sendToExternalService(logs);
    } else {
      console.log(`🔒 [SECURITY] Flushing ${logs.length} security events`);
    }
  }

  /**
   * コンソールにログ出力
   */
  private logToConsole(entry: SecurityLogEntry): void {
    const logMessage = `🔒 [SECURITY] ${entry.eventType} - ${entry.severity}`;
    const logDetails = {
      timestamp: entry.timestamp.toISOString(),
      userId: entry.userId,
      username: entry.username,
      email: entry.email,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      sessionId: entry.sessionId,
      country: entry.country,
      city: entry.city,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
      details: entry.details,
      source: entry.source,
      environment: entry.environment,
    };

    // 重要度に応じてログレベルを調整
    switch (entry.severity) {
      case 'CRITICAL':
      case 'HIGH':
        console.error(logMessage, logDetails);
        break;
      case 'MEDIUM':
        console.warn(logMessage, logDetails);
        break;
      case 'LOW':
      default:
        console.info(logMessage, logDetails);
        break;
    }
  }

  /**
   * 外部ログサービスに送信
   */
  private sendToExternalService(logs: SecurityLogEntry[]): void {
    // TODO: 実際の外部ログサービス（Datadog、CloudWatch等）への送信実装
    console.log(`📤 [SECURITY] Sending ${logs.length} events to external service`);
  }

  /**
   * 実行環境を検出
   */
  private detectEnvironment(): 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' {
    const env = process.env.NODE_ENV;
    if (env === 'production') return 'PRODUCTION';
    if (env === 'staging') return 'STAGING';
    return 'DEVELOPMENT';
  }

  /**
   * ログソースを検出
   */
  private detectSource(): 'BACKEND' | 'FRONTEND' | 'WORKER' | 'SYSTEM' {
    // Node.js環境かブラウザ環境かを判定
    if (typeof window !== 'undefined') return 'FRONTEND';
    if (typeof process !== 'undefined') {
      // プロセス名やパッケージ名から判定
      const processTitle = process.title || '';
      if (processTitle.includes('worker')) return 'WORKER';
      return 'BACKEND';
    }
    return 'SYSTEM';
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs(); // 最後のフラッシュ
  }
}

/**
 * セキュリティログを記録するヘルパー関数
 */
export function logSecurityEvent(
  entry: Omit<SecurityLogEntry, 'timestamp' | 'source' | 'environment'>
): void {
  const manager = SecurityLogManager.getInstance();
  manager.logEvent(entry);
}

// 認証エラー作成ヘルパー関数
export function createAuthError(code: AuthErrorCode, customMessage?: string): AuthError {
  const message =
    customMessage ||
    AUTH_ERROR_MESSAGES[code as keyof typeof AUTH_ERROR_MESSAGES] ||
    'Unknown authentication error';
  return new AuthError(code, message);
}
