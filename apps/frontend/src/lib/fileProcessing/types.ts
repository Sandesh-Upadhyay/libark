/**
 * 🎯 ファイル処理統一インターフェース - 型定義
 *
 * 責任:
 * - ファイル処理に関する共通型定義
 * - ドラッグ&ドロップ、ファイル選択、バリデーションの統一
 * - 型安全性の確保
 */

export interface FileValidationConfig {
  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number;
  /** 許可されるMIMEタイプ */
  allowedMimeTypes: string[];
  /** 許可される拡張子 */
  allowedExtensions: string[];
  /** 最大ファイル数 */
  maxFiles?: number;
}

export interface FileValidationResult {
  /** バリデーション成功フラグ */
  isValid: boolean;
  /** エラーメッセージ */
  error?: string;
  /** エラーコード */
  errorCode?: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'TOO_MANY_FILES' | 'NO_FILES';
}

export interface ProcessedFile {
  /** 元のファイル */
  file: File;
  /** プレビューURL */
  previewUrl: string;
  /** ファイルID（一意識別子） */
  id: string;
  /** バリデーション結果 */
  validation: FileValidationResult;
}

export interface FileProcessingOptions {
  /** バリデーション設定 */
  validation: FileValidationConfig;
  /** プレビューを生成するかどうか */
  generatePreview?: boolean;
  /** 複数ファイル対応 */
  multiple?: boolean;
  /** 処理完了コールバック */
  onProcessed?: (files: ProcessedFile[]) => void;
  /** エラーコールバック */
  onError?: (error: string, errorCode?: string) => void;
}

export interface DragDropHandlersEvent {
  /** ドラッグオーバーハンドラー */
  onDragOver: (e: React.DragEvent) => void;
  /** ドラッグリーブハンドラー */
  onDragLeave: (e: React.DragEvent) => void;
  /** ドロップハンドラー */
  onDrop: (e: React.DragEvent) => void;
  /** ドラッグ状態 */
  isDragOver: boolean;
}

export interface FileInputHandlersEvent {
  /** ファイル選択ハンドラー */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** ファイル入力参照 */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** accept属性 */
  acceptAttribute: string;
}

export interface FileProcessorReturn {
  /** 処理されたファイル一覧 */
  processedFiles: ProcessedFile[];
  /** ドラッグ&ドロップハンドラー */
  dragDropHandlers: DragDropHandlersEvent;
  /** ファイル入力ハンドラー */
  fileInputHandlers: FileInputHandlersEvent;
  /** ファイルクリア */
  clearFiles: () => void;
  /** 特定ファイル削除 */
  removeFile: (id: string) => void;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** エラー状態 */
  error: string | null;
  /** エラークリア */
  clearError: () => void;
}
