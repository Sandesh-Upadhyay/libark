/**
 * 🧪 Core Client Package テストセットアップ
 * 統一テストシステム - Core Client Package専用設定
 */

import { vi } from 'vitest';

// 🎯 Core Client Package固有のモック設定
beforeAll(() => {
  // Fetch APIのモック
  global.fetch = vi.fn();

  // WebSocket関連のモック
  global.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
  }));

  // LocalStorage/SessionStorageのモック
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    writable: true,
  });

  // Location/History APIのモック
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      reload: vi.fn(),
    },
    writable: true,
  });
});

// 🧹 各テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

// 🎯 Core Client Package固有の環境変数設定
process.env.NEXT_PUBLIC_FRONTEND_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_GRAPHQL_URL = 'http://localhost:8000/graphql';

console.log('🧪 Core Client Package テストセットアップ完了');
