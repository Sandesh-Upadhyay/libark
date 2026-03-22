/**
 * 🎯 インライン編集可能テキストコンポーネント (Molecule)
 *
 * モダンなインライン編集体験を提供
 * - クリックで編集モード
 * - Enter で保存、Escape でキャンセル
 * - スムーズなアニメーション
 * - 保存状態の視覚的フィードバック
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface InlineEditableTextProps {
  /** 現在の値 */
  value: string;
  /** 保存時のコールバック */
  onSave: (value: string) => Promise<void>;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 複数行対応 */
  multiline?: boolean;
  /** 最大文字数 */
  maxLength?: number;
  /** 編集可能かどうか */
  editable?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** テキストスタイル */
  textStyle?: 'title' | 'body' | 'caption';
  /** バリデーション関数 */
  validate?: (value: string) => string | null;
  /** 編集開始時のコールバック */
  onEditStart?: () => void;
  /** 編集終了時のコールバック */
  onEditEnd?: () => void;
}

/**
 * テキストスタイルのバリアント
 */
const textStyleVariants = {
  title: 'text-xl sm:text-2xl font-bold text-foreground',
  body: 'text-foreground whitespace-pre-wrap break-words leading-relaxed',
  caption: 'text-sm text-muted-foreground',
};

/**
 * インライン編集可能テキストコンポーネント
 */
export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onSave,
  placeholder = 'クリックして編集',
  multiline = false,
  maxLength,
  editable = true,
  className,
  textStyle = 'body',
  validate,
  onEditStart,
  onEditEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isLoading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 値が外部から変更された場合の同期
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  // 編集モード開始
  const startEditing = useCallback(() => {
    if (!editable) return;

    setIsEditing(true);
    setTempValue(value);
    setError(null);
    onEditStart?.();
  }, [editable, value, onEditStart]);

  // 編集モード終了
  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setTempValue(value);
    setError(null);
    onEditEnd?.();
  }, [value, onEditEnd]);

  // 保存処理
  const handleSave = useCallback(async () => {
    const trimmedValue = tempValue.trim();

    // バリデーション
    if (validate) {
      const validationError = validate(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // 値が変更されていない場合はキャンセル
    if (trimmedValue === value) {
      stopEditing();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(trimmedValue);

      // 成功アニメーション
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);

      stopEditing();
    } catch (error) {
      console.error('保存エラー:', error);
      setError(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [tempValue, value, validate, onSave, stopEditing]);

  // キャンセル処理
  const handleCancel = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  // キーボードイベント処理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [multiline, handleSave, handleCancel]
  );

  // 編集モード時のフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // テキストを全選択
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      } else if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(0, inputRef.current.value.length);
      }
    }
  }, [isEditing]);

  // 外部クリックで編集終了
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isEditing, handleCancel]);

  // 表示用の値
  const displayValue = value || placeholder;
  const isEmpty = !value;

  // 編集中の場合
  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className='flex items-start gap-2'>
          <InputComponent
            ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            placeholder={placeholder}
            className={cn(
              'flex-1 bg-background border border-primary rounded-md px-3 py-2',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              textStyleVariants[textStyle],
              multiline && 'min-h-[80px] resize-none'
            )}
            disabled={isLoading}
            {...(multiline && { rows: 3 })}
          />

          {/* アクションボタン */}
          <div className='flex items-center gap-1 mt-1'>
            <button
              type='button'
              onClick={handleSave}
              disabled={isLoading}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                'hover:bg-green-100 text-green-600 hover:text-green-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title='保存 (Enter)'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Check className='w-4 h-4' />
              )}
            </button>

            <button
              type='button'
              onClick={handleCancel}
              disabled={isLoading}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                'hover:bg-red-100 text-red-600 hover:text-red-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title='キャンセル (Escape)'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className='mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md'>{error}</div>
        )}

        {/* 文字数カウンター */}
        {maxLength && (
          <div className='mt-1 text-xs text-muted-foreground text-right'>
            {tempValue.length}/{maxLength}
          </div>
        )}
      </div>
    );
  }

  // 表示モード
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        editable && 'hover:bg-muted/30 rounded-md px-2 py-1 -mx-2 -my-1',
        className
      )}
      onClick={startEditing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={e => {
        if (editable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          startEditing();
        }
      }}
    >
      <div className='flex items-center gap-2'>
        <span
          className={cn(
            textStyleVariants[textStyle],
            isEmpty && 'text-muted-foreground italic',
            'transition-colors duration-200'
          )}
        >
          {displayValue}
        </span>

        {/* 編集アイコン */}
        {editable && isHovered && (
          <Edit3 className='w-4 h-4 text-muted-foreground opacity-60 transition-opacity duration-200' />
        )}

        {/* 成功アイコン */}
        {showSuccess && (
          <div className='absolute -right-6 top-1/2 -translate-y-1/2'>
            <Check className='w-4 h-4 text-green-600 animate-pulse' />
          </div>
        )}
      </div>
    </div>
  );
};
