/**
 * 🎯 投稿フォーム状態管理フック
 *
 * 責任:
 * - 投稿フォームの統一状態管理
 * - テキスト・画像・送信状態の統合
 * - バリデーション状態の管理
 * - 送信可能判定の提供
 */

import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { POST_FORM_CONFIG } from '../constants/post.constants';

// バリデーションスキーマ
const postCreateSchema = z
  .object({
    content: z
      .string()
      .max(
        POST_FORM_CONFIG.maxContentLength,
        `投稿内容は${POST_FORM_CONFIG.maxContentLength}文字以内で入力してください`
      )
      .optional()
      .transform(val => val?.trim() || ''),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'FOLLOWERS_ONLY', 'PAID']).default('PUBLIC'),
    price: z.preprocess(
      // string/number を受け入れ、number に正規化。空文字は undefined にする
      (val: unknown) => {
        if (val === '' || val === undefined || val === null) {
          return undefined;
        }
        if (typeof val === 'string') {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        if (typeof val === 'number') {
          return isNaN(val) ? undefined : val;
        }
        return undefined;
      },
      z
        .number()
        .min(0.01, '価格は0.01以上で設定してください')
        .max(10000, '価格は10000以下で設定してください')
        .optional()
    ),
  })
  .refine(
    data => {
      // Paid投稿の場合は価格が必須
      if (data.visibility === 'PAID' && (!data.price || data.price <= 0)) {
        return false;
      }
      // Paid以外の投稿では価格は設定不可
      if (data.visibility !== 'PAID' && data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Paid投稿には有効な価格が必要です',
      path: ['price'],
    }
  );

export type PostCreateFormData = z.infer<typeof postCreateSchema>;

export interface PostFormState {
  // フォーム状態
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID';
  price?: number;
  hasImages: boolean;
  isSubmitting: boolean;
  isUploading: boolean;

  // エラー状態
  contentError?: string;
  visibilityError?: string;
  priceError?: string;
  uploadError?: string;
  submitError?: string;

  // UI状態
  isFocused: boolean;
  canSubmit: boolean;
}

export interface PostFormActions {
  // コンテンツ操作
  setContent: (content: string) => void;
  setContentError: (error?: string) => void;

  // Paid投稿操作
  setVisibility: (visibility: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID') => void;
  setPrice: (price?: number) => void;
  setVisibilityError: (error?: string) => void;
  setPriceError: (error?: string) => void;

  // 画像状態操作
  setHasImages: (hasImages: boolean) => void;
  setUploadError: (error?: string) => void;
  setIsUploading: (isUploading: boolean) => void;

  // 送信状態操作
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error?: string) => void;

  // UI状態操作
  setIsFocused: (isFocused: boolean) => void;

  // フォーム操作
  resetForm: () => void;
  validateForm: () => boolean;
  getFormData: () => PostCreateFormData;
}

export interface UsePostFormStateReturn {
  state: PostFormState;
  actions: PostFormActions;
  formMethods: ReturnType<typeof useForm<PostCreateFormData>>;
}

/**
 * 🎯 投稿フォーム状態管理フック
 */
export function usePostFormState(): UsePostFormStateReturn {
  // React Hook Form設定
  const formMethods = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      content: '',
      visibility: 'PUBLIC',
      price: undefined, // controlled input として初期値は undefined（空文字は preprocess で number に変換）
    },
  });

  const { watch, setValue, setError, reset, formState } = formMethods;
  const content = watch('content') || '';
  const visibility = watch('visibility') || 'PUBLIC';
  const price = watch('price');

  // ローカル状態
  const [hasImages, setHasImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [visibilityError, setVisibilityError] = useState<string | undefined>();
  const [priceError, setPriceError] = useState<string | undefined>();

  // 送信可能判定
  const canSubmit = useMemo(
    () =>
      Boolean(
        !isSubmitting &&
          !isUploading &&
          !formState.isSubmitting &&
          (content.trim().length > 0 || hasImages) &&
          !formState.errors?.content &&
          !formState.errors?.visibility &&
          !formState.errors?.price &&
          // Paid投稿の場合は価格が必須
          (visibility !== 'PAID' || (price && price > 0))
      ),
    [
      isSubmitting,
      isUploading,
      formState.isSubmitting,
      content,
      hasImages,
      formState.errors,
      visibility,
      price,
    ]
  );

  // アクション
  const actions: PostFormActions = {
    setContent: useCallback(
      (newContent: string) => {
        setValue('content', newContent, { shouldValidate: true });
      },
      [setValue]
    ),

    setContentError: useCallback(
      (error?: string) => {
        if (error) {
          setError('content', { type: 'manual', message: error });
        }
      },
      [setError]
    ),

    setVisibility: useCallback(
      (newVisibility: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID') => {
        setValue('visibility', newVisibility, { shouldValidate: true });
        // Paid以外に変更した場合は価格をクリア
        if (newVisibility !== 'PAID') {
          setValue('price', undefined, { shouldValidate: true });
        }
      },
      [setValue]
    ),

    setPrice: useCallback(
      (newPrice?: number) => {
        setValue('price', newPrice, { shouldValidate: true });
      },
      [setValue]
    ),

    setVisibilityError,
    setPriceError,

    setHasImages,
    setUploadError,
    setIsUploading,
    setIsSubmitting,
    setSubmitError,
    setIsFocused,

    resetForm: useCallback(() => {
      reset();
      setHasImages(false);
      setIsUploading(false);
      setIsSubmitting(false);
      setIsFocused(false);
      setUploadError(undefined);
      setSubmitError(undefined);
      setVisibilityError(undefined);
      setPriceError(undefined);
    }, [reset]),

    validateForm: useCallback(() => {
      const trimmedContent = content.trim();

      if (!trimmedContent && !hasImages) {
        setError('content', {
          type: 'manual',
          message: '投稿内容または画像を入力してください',
        });
        return false;
      }

      // Paid投稿の価格検証
      if (visibility === 'PAID') {
        if (!price || price <= 0) {
          setError('price', {
            type: 'manual',
            message: 'Paid投稿には有効な価格が必要です',
          });
          return false;
        }
      }

      return true;
    }, [content, hasImages, visibility, price, setError]),

    getFormData: useCallback(() => {
      // priceをnumberに正規化（watchがstringを返す可能性があるため）
      let normalizedPrice: number | undefined = undefined;

              if (visibility === 'PAID' && price !== undefined && price !== null) {
        if (typeof price === 'string') {
          const parsed = parseFloat(price);
          if (!isNaN(parsed) && parsed > 0) {
            normalizedPrice = parsed;
          }
        } else if (typeof price === 'number' && price > 0) {
          normalizedPrice = price;
        }
      }

              return {
        content: content.trim() || '',
        visibility,
        price: normalizedPrice,
      };
    }, [content, visibility, price]),
  };

  // 状態オブジェクト
  const state: PostFormState = {
    content,
    visibility,
    price,
    hasImages,
    isSubmitting,
    isUploading,
    contentError: formState.errors.content?.message,
    visibilityError: formState.errors.visibility?.message || visibilityError,
    priceError: formState.errors.price?.message || priceError,
    uploadError,
    submitError,
    isFocused,
    canSubmit,
  };

  return {
    state,
    actions,
    formMethods,
  };
}

// POST_FORM_CONFIGは../constants/post.constantsからインポート済み
