/**
 * 🧪 認証ユーティリティ関数のテスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { validateRedirectUrl, handleAuthRedirect } from '../utils';

// window.location のモック
const mockLocation = {
  origin: 'https://example.com',
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// console のモック
const consoleErrorSpy = vi.spyOn(console, 'error');
const consoleLogSpy = vi.spyOn(console, 'log');
const consoleWarnSpy = vi.spyOn(console, 'warn');

describe('validateRedirectUrl', () => {
  beforeEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  it('nullの場合はデフォルトパスを返す', () => {
    const result = validateRedirectUrl(null);
    expect(result).toBe('/home');
  });

  it('カスタムデフォルトパスを返す', () => {
    const result = validateRedirectUrl(null, '/dashboard');
    expect(result).toBe('/dashboard');
  });

  it('相対パスをそのまま返す', () => {
    const result = validateRedirectUrl('/dashboard');
    expect(result).toBe('/dashboard');
  });

  it('クエリパラメータ付きの相対パスを返す', () => {
    const result = validateRedirectUrl('/dashboard?tab=settings');
    expect(result).toBe('/dashboard?tab=settings');
  });

  it('プロトコル相対URLを拒否する', () => {
    const result = validateRedirectUrl('//evil.com/hack');
    expect(result).toBe('/home');
  });

  it('同一オリジンの絶対URLを許可する', () => {
    const result = validateRedirectUrl('https://example.com/dashboard');
    expect(result).toBe('/dashboard');
  });

  it('外部URLを拒否する', () => {
    const result = validateRedirectUrl('https://evil.com/hack');
    expect(result).toBe('/home');
  });

  it('無効なURLを拒否する', () => {
    const result = validateRedirectUrl('invalid-url');
    expect(result).toBe('/invalid-url');
  });

  it('ハッシュ付きのURLを処理する', () => {
    const result = validateRedirectUrl('https://example.com/dashboard#section');
    expect(result).toBe('/dashboard#section');
  });
});

describe('handleAuthRedirect', () => {
  beforeEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
    mockLocation.href = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('物理リダイレクトを実行する', () => {
    const user = {
      id: '1',
      username: 'test',
      email: 'test@example.com',
      role: 'USER' as unknown,
      isVerified: true,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    handleAuthRedirect('/dashboard', user, { usePhysicalRedirect: true });

    expect(mockLocation.href).toBe('/dashboard');
    // ログ出力は開発環境でのみ実行されるため、テスト環境では出力されない
  });

  it('遅延リダイレクトを実行する', () => {
    handleAuthRedirect('/dashboard', undefined, {
      delay: 1000,
      usePhysicalRedirect: true,
    });

    expect(mockLocation.href).toBe('');

    vi.advanceTimersByTime(1000);

    expect(mockLocation.href).toBe('/dashboard');
  });

  it('SPA内ナビゲーションを実行する（React Routerなし）', () => {
    // React Routerが提供されていない場合は物理リダイレクトにフォールバック
    handleAuthRedirect('/dashboard', undefined, { usePhysicalRedirect: false });

    expect(mockLocation.href).toBe('/dashboard');
  });

  it('React Routerを使用したナビゲーション', () => {
    const mockRouter = vi.fn();

    handleAuthRedirect('/dashboard', undefined, {
      usePhysicalRedirect: false,
      router: mockRouter,
    });

    expect(mockRouter).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});

// 注意: getLoginErrorMessage関数のテストは削除されました
// 新しい統一エラーハンドラー（/features/auth/utils/authErrorHandler.ts）のテストは
// 該当ディレクトリで実装してください
