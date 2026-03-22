/**
 * 🎯 統一ファイル処理フック
 *
 * 責任:
 * - ファイル選択、ドラッグ&ドロップの統一処理
 * - バリデーション、プレビュー生成
 * - エラーハンドリング
 * - 重複コードの排除
 */

import { useState, useRef, useCallback, useMemo } from 'react';

import { validateFiles, extractImageFiles } from './fileValidator';
import type {
  FileProcessingOptions,
  FileProcessorReturn,
  ProcessedFile,
  DragDropHandlersEvent,
  FileInputHandlersEvent,
} from './types';

/**
 * 統一ファイル処理フック
 */
export function useFileProcessor(options: FileProcessingOptions): FileProcessorReturn {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // accept属性の生成（MIMEタイプと拡張子の両方を含める）
  const acceptAttribute = useMemo(() => {
    const mimeTypes = options.validation.allowedMimeTypes;
    const extensions = options.validation.allowedExtensions || [];
    return [...mimeTypes, ...extensions].join(',');
  }, [options.validation.allowedMimeTypes, options.validation.allowedExtensions]);

  // ファイル処理の共通ロジック
  const processFiles = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);
      setError(null);

      try {
        // バリデーション
        const validationResult = validateFiles(files, options.validation);
        if (!validationResult.isValid) {
          setError(validationResult.error || 'ファイルの検証に失敗しました');
          options.onError?.(
            validationResult.error || 'ファイルの検証に失敗しました',
            validationResult.errorCode
          );
          return;
        }

        // ProcessedFileオブジェクトの生成
        const processed: ProcessedFile[] = [];

        for (const file of files) {
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          let previewUrl = '';

          // プレビューURL生成（画像ファイルの場合）
          if (options.generatePreview !== false && file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file);
          }

          processed.push({
            file,
            previewUrl,
            id,
            validation: { isValid: true },
          });
        }

        // 複数ファイル対応の場合は追加、単一ファイルの場合は置換
        if (options.multiple) {
          setProcessedFiles(prev => [...prev, ...processed]);
        } else {
          // 既存のプレビューURLをクリーンアップ
          processedFiles.forEach(pf => {
            if (pf.previewUrl) {
              URL.revokeObjectURL(pf.previewUrl);
            }
          });
          setProcessedFiles(processed);
        }

        options.onProcessed?.(processed);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'ファイル処理中にエラーが発生しました';
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [options, processedFiles]
  );

  // ドラッグ&ドロップハンドラー
  const dragDropHandlers: DragDropHandlersEvent = useMemo(
    () => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = extractImageFiles(e.dataTransfer);
        if (files.length === 0) {
          const errorMessage = '画像ファイルをドロップしてください';
          setError(errorMessage);
          options.onError?.(errorMessage, 'NO_FILES');
          return;
        }

        processFiles(files);
      },
      isDragOver,
    }),
    [isDragOver, processFiles, options]
  );

  // ファイル入力ハンドラー
  const fileInputHandlers: FileInputHandlersEvent = useMemo(
    () => ({
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
          processFiles(files);
        }
        // 入力をクリア（同じファイルを再選択可能にする）
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
      inputRef,
      acceptAttribute,
    }),
    [processFiles, acceptAttribute]
  );

  // ファイルクリア
  const clearFiles = useCallback(() => {
    // プレビューURLをクリーンアップ
    processedFiles.forEach(pf => {
      if (pf.previewUrl) {
        URL.revokeObjectURL(pf.previewUrl);
      }
    });
    setProcessedFiles([]);
    setError(null);
  }, [processedFiles]);

  // 特定ファイル削除
  const removeFile = useCallback((id: string) => {
    setProcessedFiles(prev => {
      const updated = prev.filter(pf => {
        if (pf.id === id) {
          // プレビューURLをクリーンアップ
          if (pf.previewUrl) {
            URL.revokeObjectURL(pf.previewUrl);
          }
          return false;
        }
        return true;
      });
      return updated;
    });
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    processedFiles,
    dragDropHandlers,
    fileInputHandlers,
    clearFiles,
    removeFile,
    isProcessing,
    error,
    clearError,
  };
}
