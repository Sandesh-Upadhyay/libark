/**
 * 🎯 統一FormFieldコンポーネント
 *
 * 責任:
 * - React Hook Form統合
 * - FormFieldの特殊機能継承（アイコン、パスワード切替等）
 * - Legacy form.tsxの機能統合
 * - 完全互換性の確保
 *
 * 特徴:
 * - 型安全なフォーム管理
 * - 自動バリデーション
 * - 統一されたAPI
 * - 段階的移行対応
 */

'use client';

import React, { useState } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form-shadcn';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';


/**
 * 統一FormFieldのバリアント定義
 */
const unifiedFormFieldVariants = cva('', {
  variants: {
    variant: {
      default: '',
      success: 'border-green-500 focus:border-green-500',
      error: 'border-destructive focus:border-destructive',
    },
    size: {
      sm: 'h-8 text-sm',
      md: 'h-9 text-sm',
      lg: 'h-10 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * 統一FormFieldのプロパティ
 */
export interface UnifiedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends VariantProps<typeof unifiedFormFieldVariants> {
  // React Hook Form統合
  name: TName;
  control?: Control<TFieldValues>;

  // 基本プロパティ
  label: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number' | 'tel' | 'url';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;

  // FormField継承機能
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  success?: string;

  // Legacy統合機能
  characterCount?: {
    current: number;
    max: number;
  };
  rows?: number; // textarea用
  maxLength?: number;

  // Select専用
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;

  // スタイリング
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;

  // その他のHTML属性
  autoComplete?: string;
  autoFocus?: boolean;
}

/**
 * 成功メッセージコンポーネント
 */
const FormSuccess: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
    <Check className='w-4 h-4' />
    <span>{children}</span>
  </div>
);

/**
 * 文字数カウンターコンポーネント
 */
const CharacterCounter: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;

  return (
    <div
      className={cn(
        'text-xs text-right',
        isOverLimit
          ? 'text-destructive'
          : isNearLimit
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-muted-foreground'
      )}
    >
      {current}/{max}
    </div>
  );
};

/**
 * 統合入力コンポーネントのプロパティ型定義
 */
interface UnifiedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  type: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
  variant?: 'default' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  rows?: number;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  characterCount?: { current: number; max: number };
  className?: string;
}

/**
 * 統合入力コンポーネント
 */
const UnifiedInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, UnifiedInputProps>(
  (
    {
      type,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      onPasswordToggle,
      showPassword,
      variant,
      size,
      rows,
      options,
      characterCount,
      className,
      ...props
    },
    ref
  ) => {
    // Textarea
    if (type === 'textarea') {
      return (
        <div className='space-y-2'>
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows || 3}
            className={cn(unifiedFormFieldVariants({ variant, size }), className)}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {characterCount && (
            <CharacterCounter current={characterCount.current} max={characterCount.max} />
          )}
        </div>
      );
    }

    // Select
    if (type === 'select' && options) {
      return (
        <Select
          onValueChange={(value: string) => {
            const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
            props.onChange?.(event);
          }}
          defaultValue={props.value as string}
        >
          <SelectTrigger className={cn(unifiedFormFieldVariants({ variant, size }), className)}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Input with icons and password toggle
    return (
      <div className='relative'>
        {/* 左側アイコン */}
        {leftIcon && (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
            {leftIcon}
          </div>
        )}

        {/* 入力フィールド */}
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          {...(showPasswordToggle ? { type: showPassword ? 'text' : 'password' } : { type })}
          className={cn(
            unifiedFormFieldVariants({ variant, size }),
            leftIcon && 'pl-10',
            (rightIcon || showPasswordToggle) && 'pr-10',
            className
          )}
          {...props}
          // type=number の場合、value が undefined のときは空文字を表示（controlled input 化）
          value={type === 'number' && props.value === undefined ? '' : props.value}
        />

        {/* 右側アイコン・パスワード切替 */}
        {(rightIcon || showPasswordToggle) && (
          <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
            {showPasswordToggle ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-auto p-0 text-muted-foreground hover:text-foreground'
                onClick={onPasswordToggle}
                data-testid='password-toggle'
              >
                {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </Button>
            ) : (
              rightIcon && <div className='text-muted-foreground'>{rightIcon}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

UnifiedInput.displayName = 'UnifiedInput';

/**
 * 🎯 統一FormFieldコンポーネント
 *
 * React Hook FormベースでFormFieldの特殊機能を統合
 *
 * 使用例:
 * ```tsx
 * <UnifiedFormField
 *   name="email"
 *   control={control}
 *   label="メールアドレス"
 *   type="email"
 *   leftIcon={<Mail className="w-4 h-4" />}
 *   required
 * />
 * ```
 */
export const UnifiedFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  description,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  success,
  variant = 'default',
  size = 'md',
  characterCount,
  rows,
  maxLength,
  options,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
  autoComplete,
  autoFocus,
}: UnifiedFormFieldProps<TFieldValues, TName>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const finalVariant = hasError ? 'error' : success ? 'success' : variant;

        return (
          <FormItem className={containerClassName}>
            <FormLabel
              className={cn(
                required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
                labelClassName
              )}
            >
              {label}
            </FormLabel>
            <FormControl>
              <UnifiedInput
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                leftIcon={leftIcon}
                rightIcon={rightIcon}
                showPasswordToggle={showPasswordToggle}
                onPasswordToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                variant={finalVariant || 'default'}
                size={size || 'md'}
                rows={rows}
                options={options}
                characterCount={characterCount}
                className={inputClassName}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                maxLength={maxLength}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage className={errorClassName} />
            {success && !hasError && <FormSuccess>{success}</FormSuccess>}
          </FormItem>
        );
      }}
    />
  );
};
