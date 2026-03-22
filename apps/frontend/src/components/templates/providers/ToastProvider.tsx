'use client';

/**
 * 🎯 Toast Provider - Shadcn/ui Sonnerベース（クリーン版）
 *
 * デフォルト設定のみ、カスタマイズなし
 */

import React from 'react';

import { Toaster } from '@/components/atoms';

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
