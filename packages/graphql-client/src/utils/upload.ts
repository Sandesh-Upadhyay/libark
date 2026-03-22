/**
 * 🚀 S3 Gateway Upload Utilities
 *
 * S3 Gateway経由のファイルアップロードをサポートするユーティリティ関数
 */

// ================================
// 型定義
// ================================

export interface HeaderPair {
  key: string;
  value: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadOptions {
  headers: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

// ================================
// ユーティリティ関数
// ================================

/**
 * HeaderPair[]をRecord<string,string>に変換
 * 同名キーが来たら後勝ち
 */
export const headerPairsToRecord = (pairs: HeaderPair[]): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const pair of pairs) {
    result[pair.key] = pair.value;
  }

  return result;
};

/**
 * S3 GatewayにファイルをPUTアップロード
 * XHRを使用してプログレスコールバックをサポート
 */
export const putToGateway = async (
  url: string,
  file: File,
  options: UploadOptions
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // アボートシグナルの設定
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('アップロードがキャンセルされました'));
      });
    }

    // プログレスイベントのハンドリング
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable && options.onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        };
        options.onProgress(progress);
      }
    });

    // アップロード完了
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const errorMessage = getErrorMessage(xhr.status);
        reject(new Error(errorMessage));
      }
    });

    // エラーハンドリング
    xhr.addEventListener('error', () => {
      reject(new Error('ネットワークエラーが発生しました'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('アップロードがキャンセルされました'));
    });

    // タイムアウト
    xhr.addEventListener('timeout', () => {
      reject(new Error('アップロードがタイムアウトしました'));
    });

    // リクエストの設定
    xhr.open('PUT', url, true);
    xhr.timeout = 300000; // 5分タイムアウト

    // ヘッダーの設定
    for (const [key, value] of Object.entries(options.headers)) {
      xhr.setRequestHeader(key, value);
    }

    // ファイルを送信
    xhr.send(file);
  });
};

/**
 * HTTPステータスコードに基づいてエラーメッセージを取得
 */
const getErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'リクエストが無効です';
    case 401:
      return '認証に失敗しました';
    case 403:
      return 'アクセス権限がありません';
    case 404:
      return 'アップロード先が見つかりません';
    case 409:
      return 'ファイルが既に存在するか、競合が発生しました';
    case 413:
      return 'ファイルサイズが大きすぎます';
    case 415:
      return 'サポートされていないファイル形式です';
    case 429:
      return 'リクエストが多すぎます';
    case 500:
      return 'サーバーエラーが発生しました';
    case 502:
      return 'ゲートウェイエラーが発生しました';
    case 503:
      return 'サービスが一時的に利用できません';
    default:
      return `アップロードに失敗しました (HTTP ${status})`;
  }
};
