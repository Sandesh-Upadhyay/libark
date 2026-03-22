import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// アバターバリアントは削除済み - Shadcn/uiベースのBaseAvatarを使用
