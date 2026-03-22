'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { toast } from 'sonner';

export type TwoFactorState = {
  isOpen: boolean;
  tempUserId: string | null;
  loading: boolean;
  error: string | null;
};

type Actions = {
  open: (tempUserId: string) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  verify: (
    code: string,
    verifyFn?: (
      tempUserId: string,
      code: string
    ) => Promise<{ success: boolean; errorMessage?: string }>
  ) => Promise<boolean>;
  reset: () => void;
};

type Store = TwoFactorState & Actions;

export const useTwoFactorStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    // --- State ---
    isOpen: false,
    tempUserId: null,
    loading: false,
    error: null,

    // --- Actions ---
    open: (tempUserId: string) => {
      console.log('🔐 [TwoFactorStore] 2FA認証ダイアログを開く:', { tempUserId });
      set({
        isOpen: true,
        tempUserId,
        error: null,
        loading: false,
      });
    },

    close: () => {
      console.log('🔐 [TwoFactorStore] 2FA認証ダイアログを閉じる');
      set({
        isOpen: false,
        tempUserId: null,
        loading: false,
        error: null,
      });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    verify: async (
      code: string,
      verifyFn?: (
        tempUserId: string,
        code: string
      ) => Promise<{ success: boolean; errorMessage?: string }>
    ) => {
      const { tempUserId } = get();
      if (!tempUserId) {
        console.error('🔐 [TwoFactorStore] tempUserIdが設定されていません');
        return false;
      }

      console.log('🔐 [TwoFactorStore] 2FA認証開始:', {
        tempUserId,
        code: code.substring(0, 2) + '****',
      });

      set({ loading: true, error: null });

      try {
        let result: { success: boolean; errorMessage?: string } = { success: false };

        if (verifyFn) {
          // 外部から注入された認証関数を使用
          result = await verifyFn(tempUserId, code);
        } else {
          // フォールバック: 模擬認証（開発用）
          await new Promise(resolve => setTimeout(resolve, 1000));
          result = {
            success: code === '123456',
            errorMessage: code !== '123456' ? '認証コードが正しくありません' : undefined,
          };
        }

        if (result.success) {
          console.log('🔐 [TwoFactorStore] 2FA認証成功');
          toast.success('認証に成功しました');
          set({
            isOpen: false,
            tempUserId: null,
            loading: false,
            error: null,
          });
          return true;
        } else {
          console.log('🔐 [TwoFactorStore] 2FA認証失敗: 無効なコード');
          const errorMessage = result.errorMessage || '認証コードが正しくありません';
          set({ loading: false, error: errorMessage });
          toast.error(errorMessage);
          return false;
        }
      } catch (error) {
        console.error('🔐 [TwoFactorStore] 2FA認証エラー:', error);
        const errorMessage = '認証エラーが発生しました';
        set({ loading: false, error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
    },

    reset: () => {
      console.log('🔐 [TwoFactorStore] ストア状態をリセット');
      set({
        isOpen: false,
        tempUserId: null,
        loading: false,
        error: null,
      });
    },
  }))
);

// 便利なselector（部分購読用）
export const useTwoFactorSlice = () => {
  const isOpen = useTwoFactorStore((state: Store) => state.isOpen);
  const tempUserId = useTwoFactorStore((state: Store) => state.tempUserId);
  const loading = useTwoFactorStore((state: Store) => state.loading);
  const error = useTwoFactorStore((state: Store) => state.error);
  const verify = useTwoFactorStore((state: Store) => state.verify);
  const close = useTwoFactorStore((state: Store) => state.close);

  return { isOpen, tempUserId, loading, error, verify, close };
};

export const useTwoFactorActions = () => {
  const open = useTwoFactorStore((state: Store) => state.open);
  const close = useTwoFactorStore((state: Store) => state.close);
  const verify = useTwoFactorStore((state: Store) => state.verify);
  const reset = useTwoFactorStore((state: Store) => state.reset);

  return { open, close, verify, reset };
};

// 個別のselector（パフォーマンス最適化）
export const useTwoFactorIsOpen = () => useTwoFactorStore((state: Store) => state.isOpen);
export const useTwoFactorTempUserId = () => useTwoFactorStore((state: Store) => state.tempUserId);
export const useTwoFactorLoading = () => useTwoFactorStore((state: Store) => state.loading);
export const useTwoFactorError = () => useTwoFactorStore((state: Store) => state.error);
export const useTwoFactorVerify = () => useTwoFactorStore((state: Store) => state.verify);
export const useTwoFactorClose = () => useTwoFactorStore((state: Store) => state.close);

// デバッグ用: ストア状態の変更を監視
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  useTwoFactorStore.subscribe(
    (state: Store) => state,
    (state: Store) => {
      console.log('🔐 [TwoFactorStore] 状態変更:', state);
    }
  );
}
