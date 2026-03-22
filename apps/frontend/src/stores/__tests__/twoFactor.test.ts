/**
 * 🔐 TwoFactorStore テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useTwoFactorStore,
  useTwoFactorIsOpen,
  useTwoFactorTempUserId,
  useTwoFactorLoading,
  useTwoFactorError,
  useTwoFactorVerify,
  useTwoFactorClose,
  useTwoFactorActions,
  useTwoFactorSlice,
} from '../twoFactor';

// Sonnerトーストをモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('🔐 TwoFactorStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useTwoFactorStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('open アクション', () => {
    it('2FA認証ダイアログを開く', () => {
      const { result } = renderHook(() => useTwoFactorStore());
      const tempUserId = 'test-user-id';

      act(() => {
        result.current.open(tempUserId);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.tempUserId).toBe(tempUserId);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('close アクション', () => {
    it('2FA認証ダイアログを閉じる', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // まず開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 閉じる
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('verify アクション', () => {
    it('模擬認証で成功する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // ダイアログを開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 模擬認証（123456で成功）
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456');
      });

      expect(verifyResult!).toBe(true);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(toast.success).toHaveBeenCalledWith('認証に成功しました');
    });

    it('模擬認証で失敗する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // ダイアログを開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 模擬認証（間違ったコードで失敗）
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('000000');
      });

      expect(verifyResult!).toBe(false);
      expect(result.current.isOpen).toBe(true); // ダイアログは開いたまま
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('認証コードが正しくありません');
      expect(toast.error).toHaveBeenCalledWith('認証コードが正しくありません');
    });

    it('外部認証関数を使用する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());
      const mockVerifyFn = vi.fn().mockResolvedValue({ success: true });

      // ダイアログを開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 外部認証関数を使用
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456', mockVerifyFn);
      });

      expect(verifyResult!).toBe(true);
      expect(mockVerifyFn).toHaveBeenCalledWith('test-user-id', '123456');
      expect(toast.success).toHaveBeenCalledWith('認証に成功しました');
    });
  });

  describe('setLoading アクション', () => {
    it('loading状態を設定する', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('setError アクション', () => {
    it('error状態を設定する', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      expect(result.current.error).toBe(null);

      act(() => {
        result.current.setError('テストエラー');
      });

      expect(result.current.error).toBe('テストエラー');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('verify アクション - エラーハンドリング', () => {
    it('tempUserIdが設定されていない場合、認証を失敗させる', async () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // tempUserIdを設定せずに認証を試みる
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456');
      });

      expect(verifyResult!).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('外部認証関数がエラーを返す場合、適切に処理する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());
      const mockVerifyFn = vi.fn().mockResolvedValue({
        success: false,
        errorMessage: 'カスタムエラーメッセージ',
      });

      // ダイアログを開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 外部認証関数を使用
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456', mockVerifyFn);
      });

      expect(verifyResult!).toBe(false);
      expect(result.current.error).toBe('カスタムエラーメッセージ');
      expect(result.current.loading).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('カスタムエラーメッセージ');
    });

    it('外部認証関数が例外をスローする場合、適切に処理する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());
      const mockVerifyFn = vi.fn().mockRejectedValue(new Error('ネットワークエラー'));

      // ダイアログを開く
      act(() => {
        result.current.open('test-user-id');
      });

      // 外部認証関数を使用
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456', mockVerifyFn);
      });

      expect(verifyResult!).toBe(false);
      expect(result.current.error).toBe('認証エラーが発生しました');
      expect(result.current.loading).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('認証エラーが発生しました');
    });
  });

  describe('連続実行のテスト', () => {
    it('open → verify(成功) → close のシーケンスを実行する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // 1. open
      act(() => {
        result.current.open('test-user-id');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.tempUserId).toBe('test-user-id');

      // 2. verify(成功)
      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verify('123456');
      });

      expect(verifyResult!).toBe(true);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);

      // 3. close（既に閉じているが、エラーにならないことを確認）
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('open → verify(失敗) → verify(成功) のシーケンスを実行する', async () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // 1. open
      act(() => {
        result.current.open('test-user-id');
      });

      // 2. verify(失敗)
      let verifyResult1: boolean;
      await act(async () => {
        verifyResult1 = await result.current.verify('000000');
      });

      expect(verifyResult1!).toBe(false);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.error).toBe('認証コードが正しくありません');

      // 3. verify(成功)
      let verifyResult2: boolean;
      await act(async () => {
        verifyResult2 = await result.current.verify('123456');
      });

      expect(verifyResult2!).toBe(true);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('open → setLoading → setError → reset のシーケンスを実行する', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // 1. open
      act(() => {
        result.current.open('test-user-id');
      });

      expect(result.current.isOpen).toBe(true);

      // 2. setLoading
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      // 3. setError
      act(() => {
        result.current.setError('テストエラー');
      });

      expect(result.current.error).toBe('テストエラー');

      // 4. reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('個別セレクター', () => {
    it('useTwoFactorIsOpen が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorIsOpen());

      expect(result.current).toBe(false);

      act(() => {
        useTwoFactorStore.getState().open('test-user-id');
      });

      expect(result.current).toBe(true);
    });

    it('useTwoFactorTempUserId が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorTempUserId());

      expect(result.current).toBe(null);

      act(() => {
        useTwoFactorStore.getState().open('test-user-id');
      });

      expect(result.current).toBe('test-user-id');
    });

    it('useTwoFactorLoading が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorLoading());

      expect(result.current).toBe(false);

      act(() => {
        useTwoFactorStore.getState().setLoading(true);
      });

      expect(result.current).toBe(true);

      act(() => {
        useTwoFactorStore.getState().setLoading(false);
      });

      expect(result.current).toBe(false);
    });

    it('useTwoFactorError が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorError());

      expect(result.current).toBe(null);

      act(() => {
        useTwoFactorStore.getState().setError('テストエラー');
      });

      expect(result.current).toBe('テストエラー');

      act(() => {
        useTwoFactorStore.getState().setError(null);
      });

      expect(result.current).toBe(null);
    });

    it('useTwoFactorVerify が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorVerify());

      expect(typeof result.current).toBe('function');
    });

    it('useTwoFactorClose が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorClose());

      expect(typeof result.current).toBe('function');
    });

    it('useTwoFactorActions が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorActions());

      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
      expect(typeof result.current.verify).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('useTwoFactorSlice が正しく動作する', () => {
      const { result } = renderHook(() => useTwoFactorSlice());

      expect(typeof result.current.isOpen).toBe('boolean');
      expect(typeof result.current.tempUserId).toBe('object');
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.error).toBe('object');
      expect(typeof result.current.verify).toBe('function');
      expect(typeof result.current.close).toBe('function');
    });

    it('useTwoFactorSlice が状態の変更を正しく反映する', () => {
      const { result } = renderHook(() => useTwoFactorSlice());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);

      act(() => {
        result.current.verify = useTwoFactorStore.getState().verify;
        useTwoFactorStore.getState().open('test-user-id');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.tempUserId).toBe('test-user-id');
    });
  });

  describe('reset アクション', () => {
    it('ストアを初期状態にリセットする', () => {
      const { result } = renderHook(() => useTwoFactorStore());

      // 状態を変更
      act(() => {
        result.current.open('test-user-id');
        result.current.setLoading(true);
        result.current.setError('テストエラー');
      });

      // リセット
      act(() => {
        result.current.reset();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.tempUserId).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
