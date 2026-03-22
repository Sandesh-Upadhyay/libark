/**
 * 🎯 統一エラーハンドリング
 *
 * 認証エラーと画像アップロードエラーの統一処理
 */

export interface Router {
  push: (url: string) => void;
  replace: (url: string) => void;
  reload: () => void;
  refresh: () => void;
}

export interface ErrorInfo {
  message: string;
  type: 'auth' | 'upload' | 'network' | 'validation' | 'unknown';
  statusCode?: number;
  shouldRetry?: boolean;
  shouldReload?: boolean;
}

/**
 * HTTPステータスコードからエラー情報を生成
 */
export function createErrorFromStatus(status: number, defaultMessage: string): ErrorInfo {
  switch (status) {
    case 401:
      return {
        message: '認証が無効です。ページを再読み込みしてログインし直してください。',
        type: 'auth',
        statusCode: status,
        shouldReload: true,
      };

    case 403:
      return {
        message: 'この操作を実行する権限がありません。',
        type: 'auth',
        statusCode: status,
        shouldReload: false,
      };

    case 413:
      return {
        message: 'ファイルサイズが大きすぎます。',
        type: 'upload',
        statusCode: status,
        shouldRetry: false,
      };

    case 429:
      return {
        message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
        type: 'network',
        statusCode: status,
        shouldRetry: true,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。',
        type: 'network',
        statusCode: status,
        shouldRetry: true,
      };

    default:
      return {
        message: defaultMessage,
        type: 'unknown',
        statusCode: status,
        shouldRetry: false,
      };
  }
}

/**
 * レスポンスからエラー情報を抽出
 */
export async function extractErrorFromResponse(response: Response): Promise<ErrorInfo> {
  const defaultMessage = `エラーが発生しました (${response.status})`;

  try {
    const errorData = await response.json();
    const serverMessage = errorData.message || errorData.error;

    const errorInfo = createErrorFromStatus(response.status, defaultMessage);

    // サーバーからのメッセージがある場合は使用
    if (serverMessage && typeof serverMessage === 'string') {
      errorInfo.message = serverMessage;
    }

    return errorInfo;
  } catch {
    // JSONパースに失敗した場合はデフォルトメッセージを使用
    return createErrorFromStatus(response.status, defaultMessage);
  }
}

/**
 * 画像アップロード専用エラーハンドリング
 */
export function createUploadError(message: string, shouldRetry = false): ErrorInfo {
  return {
    message,
    type: 'upload',
    shouldRetry,
  };
}

/**
 * 認証エラー専用ハンドリング
 */
export function createAuthError(message: string, shouldReload = true): ErrorInfo {
  return {
    message,
    type: 'auth',
    shouldReload,
  };
}

/**
 * エラー情報をコンソールに出力
 */
export function logError(error: ErrorInfo, context?: string): void {
  const prefix = context ? `[${context}]` : '';

  switch (error.type) {
    case 'auth':
      console.error(`❌ ${prefix} 認証エラー:`, error.message);
      break;
    case 'upload':
      console.error(`📤 ${prefix} アップロードエラー:`, error.message);
      break;
    case 'network':
      console.error(`🌐 ${prefix} ネットワークエラー:`, error.message);
      break;
    case 'validation':
      console.error(`✅ ${prefix} バリデーションエラー:`, error.message);
      break;
    default:
      console.error(`❓ ${prefix} エラー:`, error.message);
  }
}

/**
 * エラー情報に基づいて適切なアクションを実行
 */
export function handleError(error: ErrorInfo, context?: string, router?: Router): void {
  logError(error, context);

  // 認証エラーでページリロードが必要な場合
  if (error.type === 'auth' && error.shouldReload && typeof window !== 'undefined') {
    console.log('🔄 認証エラーのためページを再読み込みします');
    setTimeout(() => {
      if (router) {
        // 🚀 Next.js ルーターを使用してリフレッシュ
        router.refresh();
      } else {
        // フォールバック: 物理リロード
        console.warn('⚠️ router が利用できないため物理リロードを使用');
        window.location.reload();
      }
    }, 2000); // 2秒後にリロード
  }
}
