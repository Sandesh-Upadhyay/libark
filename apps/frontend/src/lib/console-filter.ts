/**
 * 🔇 コンソールエラーフィルター（簡素化版）
 *
 * 開発環境でのノイズとなるエラーメッセージを抑制します
 * 注意: 統一ログシステムで制御できるログは移行済みです
 */

/**
 * Chrome拡張機能関連のエラーパターン
 */
const CHROME_EXTENSION_ERROR_PATTERNS = [
  /runtime\.lastError.*message port closed/i,
  /Extension context invalidated/i,
  /Could not establish connection/i,
  /Receiving end does not exist/i,
  /A listener indicated an asynchronous response by returning true.*message channel closed/i,
  /message channel closed before a response was received/i,
];

/**
 * React DOM属性関連のエラーパターン
 */
const REACT_DOM_ATTRIBUTE_ERROR_PATTERNS = [
  /Received `false` for a non-boolean attribute/i,
  /If you want to write it to the DOM, pass a string instead/i,
  /pass.*condition \? value : undefined.*instead/i,
];

/**
 * 重複ログ制限のためのキャッシュ（Chrome拡張機能エラー用）
 */
const logCache = new Map<string, { count: number; lastTime: number }>();
const LOG_THROTTLE_MS = 10000; // 10秒間隔（Chrome拡張機能エラーは頻度を下げる）
const MAX_DUPLICATE_LOGS = 2; // 同じログは最大2回まで

/**
 * 初期化状態管理（重複防止）
 */
let isConsoleFilterInitialized = false;

/**
 * 抑制すべきエラーかどうかを判定
 */
function shouldSuppressError(message: string): boolean {
  return (
    CHROME_EXTENSION_ERROR_PATTERNS.some(pattern => pattern.test(message)) ||
    REACT_DOM_ATTRIBUTE_ERROR_PATTERNS.some(pattern => pattern.test(message))
  );
}

/**
 * ログの重複を制限すべきかどうかを判定
 */
function shouldThrottleLog(message: string): boolean {
  const now = Date.now();
  const logKey = message.substring(0, 100); // 最初の100文字でキー生成

  const cached = logCache.get(logKey);

  if (!cached) {
    logCache.set(logKey, { count: 1, lastTime: now });
    return false;
  }

  // 時間間隔チェック
  if (now - cached.lastTime < LOG_THROTTLE_MS) {
    cached.count++;

    // 最大回数を超えた場合は抑制
    if (cached.count > MAX_DUPLICATE_LOGS) {
      return true;
    }
  } else {
    // 時間が経過した場合はリセット
    cached.count = 1;
    cached.lastTime = now;
  }

  return false;
}

/**
 * コンソールエラーフィルターを初期化（簡素化版）
 *
 * 注意: 統一ログシステムで制御できるログは移行済みです
 * このフィルターは主にChrome拡張機能エラーなどの外部ノイズ用です
 */
export function initializeConsoleFilter(): void {
  if (typeof window === 'undefined' || import.meta.env.PROD) {
    return;
  }

  // 重複初期化防止
  if (isConsoleFilterInitialized) {
    return;
  }
  isConsoleFilterInitialized = true;

  // console.errorをオーバーライド
  const originalConsoleError = console.error;
  console.error = function (...args: unknown[]) {
    const message = args.join(' ');
    if (!shouldSuppressError(message) && !shouldThrottleLog(message)) {
      originalConsoleError.apply(console, args);
    }
  };

  // console.warnも同様に処理
  const originalConsoleWarn = console.warn;
  console.warn = function (...args: unknown[]) {
    const message = args.join(' ');
    if (!shouldSuppressError(message) && !shouldThrottleLog(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // console.logの重複制限（統一ログシステム移行により大幅簡素化）
  const originalConsoleLog = console.log;
  console.log = function (...args: unknown[]) {
    const message = args.join(' ');

    // 統一ログシステムで制御できない外部ノイズのみ制限
    // 注意: アプリケーションログは統一ログシステムを使用してください
    if (
      // 外部ライブラリのノイズ
      message.includes('[HMR]') ||
      message.includes('[webpack]') ||
      message.includes('[Next.js]') ||
      message.includes('[Vite]') ||
      // レガシーパフォーマンスログ（段階的に削除予定）
      message.includes('🧠 High Memory Usage') ||
      message.includes('📊 Performance Metric') ||
      // auth-logger.ts関連（統一ログシステムと重複）
      message.includes('🎯[useAuth]') ||
      message.includes('🎯[Navigation]') ||
      message.includes('🎯[Provider]') ||
      message.includes('🎯[UnifiedNotificationService]') ||
      message.includes('🔍[useAuth]') ||
      message.includes('🔍[AuthProvider]') ||
      message.includes('🔍[Navigation]') ||
      // Apollo関連ログ（重複防止）
      message.includes('🔑 [Apollo]') ||
      message.includes('🔍 [Apollo]') ||
      message.includes('🎯 [Apollo]') ||
      message.includes('Apollo Client') ||
      message.includes('GraphQL') ||
      message.includes('キャッシュマージ') ||
      message.includes('キャッシュ読み取り') ||
      // コンポーネント初期化ログ（重複防止）
      message.includes('🎯 [Molecule]') ||
      message.includes('🎯 [Organism]') ||
      message.includes('🎯 [MEDIA]') ||
      message.includes('🎯 [COMPONENT]') ||
      message.includes('PostImageDisplay') ||
      message.includes('PostCard') ||
      // その他の統一ログシステム移行済みパターン
      message.includes('🚀 認証状態事前確認完了') ||
      message.includes('🔗 [WebSocket] connectionParams設定:') ||
      message.includes('🎯 サーバーから設定を取得:') ||
      message.includes('🎯 ContentCompletionProvider初期化完了') ||
      message.includes('✅ 統一通知マネージャー初期化完了') ||
      message.includes('🔔 統一通知マネージャー初期化開始:') ||
      message.includes('🔧 [FrontendS3Config]') ||
      (message.includes('メディア') && message.includes('詳細:'))
    ) {
      if (shouldThrottleLog(message)) {
        return;
      }
    }

    originalConsoleLog.apply(console, args);
  };

  // 定期的にキャッシュをクリア（メモリリーク防止）
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of logCache.entries()) {
      if (now - value.lastTime > 60000) {
        // 1分以上古いエントリを削除
        logCache.delete(key);
      }
    }
  }, 60000); // 1分間隔

  console.log('🔇 コンソールフィルター初期化完了（最小化版）- 外部ノイズのみフィルタリング');
}
