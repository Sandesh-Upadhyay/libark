/**
 * 🧪 useNotificationAutoRead フック テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useNotificationAutoRead } from '../useNotificationAutoRead';

describe('useNotificationAutoRead', () => {
  let mockOnMarkAsRead: ReturnType<typeof vi.fn>;
  let mockIntersectionObserver: any;

  beforeEach(() => {
    mockOnMarkAsRead = vi.fn();

    // Mock IntersectionObserver
    mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });

    global.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックが正しく初期化されること', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      expect(result.current.observeNotification).toBeDefined();
      expect(typeof result.current.observeNotification).toBe('function');
    });

    it('enabled=falseの場合、observeNotificationが何もしないこと', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: false,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', false);

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });
  });

  describe('通知の監視', () => {
    it('通知要素が監視されること', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', false);

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('既読の通知は監視されないこと', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', true);

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });
  });

  describe('既読化の処理', () => {
    it('通知が表示されたときに既読化されること', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', false);

      // IntersectionObserverのコールバックをシミュレート
      const callback = mockIntersectionObserver.mock.calls[0][0];
      callback([{ isIntersecting: true, target: element }]);

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(['test-id']);
    });

    it('通知が表示されないときは既読化されないこと', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', false);

      // IntersectionObserverのコールバックをシミュレート
      const callback = mockIntersectionObserver.mock.calls[0][0];
      callback([{ isIntersecting: false, target: element }]);

      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
    });

    it('複数の通知が同時に既読化されること', () => {
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const element3 = document.createElement('div');

      result.current.observeNotification(element1, 'test-id-1', false);
      result.current.observeNotification(element2, 'test-id-2', false);
      result.current.observeNotification(element3, 'test-id-3', false);

      // IntersectionObserverのコールバックをシミュレート
      const callback = mockIntersectionObserver.mock.calls[0][0];
      callback([
        { isIntersecting: true, target: element1 },
        { isIntersecting: true, target: element2 },
        { isIntersecting: true, target: element3 },
      ]);

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(['test-id-1', 'test-id-2', 'test-id-3']);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にIntersectionObserverが切断されること', () => {
      const { unmount } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      result.current.observeNotification(element, 'test-id', false);

      const disconnect = mockIntersectionObserver.mock.results[0].value.disconnect;

      unmount();

      expect(disconnect).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('onMarkAsReadがエラーを投げても処理が続行されること', () => {
      mockOnMarkAsRead.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useNotificationAutoRead({
          onMarkAsRead: mockOnMarkAsRead,
          enabled: true,
        })
      );

      const element = document.createElement('div');
      result.current.observeNotification(element, 'test-id', false);

      // IntersectionObserverのコールバックをシミュレート
      const callback = mockIntersectionObserver.mock.calls[0][0];
      callback([{ isIntersecting: true, target: element }]);

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(['test-id']);
    });
  });
});
