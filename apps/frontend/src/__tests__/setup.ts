/**
 * 🧪 テストセットアップファイル
 *
 * Vitestのグローバルセットアップを行います
 */

import '@testing-library/jest-dom';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

import { server } from './msw/server';

// Vitestのexpectにjest-domマッチャーを追加
expect.extend(matchers);

// グローバルなfetch APIのモック（必要に応じて）
if (!(global.fetch as unknown)) {
  global.fetch = vi.fn();
}
// JSDOMのmatchMediaポリフィル（存在しない、または関数でない場合に上書き）

if (typeof (window as unknown).matchMedia !== 'function') {
  (window as unknown).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// IntersectionObserver ポリフィル（JSDOM）
if (typeof (window as unknown).IntersectionObserver !== 'function') {
  class MockIntersectionObserver {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_callback: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  (window as unknown).IntersectionObserver = MockIntersectionObserver as unknown;

  (global as unknown).IntersectionObserver = MockIntersectionObserver as unknown;
}

// MSWサーバーのライフサイクル管理
beforeAll(() => {
  console.log('🧪 テスト環境を初期化しています...');
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
  console.log('🧹 テスト環境をクリーンアップしています...');
});

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_GRAPHQL_URL = 'http://localhost:8000/graphql';
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';

// グローバルなNode.jsモジュールのモック設定（重複定義を防ぐ）
if (!globalThis.__vite_ssr_import__) {
  Object.defineProperty(globalThis, '__vite_ssr_import__', {
    value: (id: string) => {
      if (id === 'crypto') {
        return Promise.resolve({
          randomBytes: (size: number) => {
            const bytes = new Uint8Array(size);
            globalThis.crypto.getRandomValues(bytes);
            return bytes;
          },
          createHmac: (_algorithm: string, _key: string | Uint8Array) => ({
            update: (_data: string | Uint8Array) => ({
              digest: (encoding: string) => {
                if (encoding === 'hex') {
                  return 'mock-hmac-hex-digest';
                }
                return new Uint8Array(32);
              },
            }),
          }),
          createHash: (_algorithm: string) => ({
            update: (_data: string | Uint8Array) => ({
              digest: (encoding?: string) => {
                if (encoding === 'hex') {
                  return 'mock-hash-hex-digest';
                }
                return new Uint8Array(32);
              },
            }),
          }),
          timingSafeEqual: (a: string, b: string) => a === b,
        });
      }
      if (id === 'buffer') {
        return Promise.resolve({
          Buffer: {
            from: (data: string, encoding?: string) => {
              if (encoding === 'base64') {
                const binaryString = atob(data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
              }
              return new TextEncoder().encode(data);
            },
          },
        });
      }
      return Promise.reject(new Error(`Module ${id} not found`));
    },
  });
}

// Node.js crypto moduleのモック（テスト環境用）
vi.mock('crypto', async () => {
  // ブラウザ環境のWeb Crypto APIを使用
  const crypto = globalThis.crypto;
  return {
    default: {
      randomBytes: (size: number) => {
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        return bytes;
      },
      createHmac: (_algorithm: string, _key: string | Uint8Array) => {
        return {
          update: (_data: string | Uint8Array) => {
            // テスト用の簡易実装
            return {
              digest: (encoding: string) => {
                if (encoding === 'hex') {
                  return 'mock-hmac-hex-digest';
                }
                return new Uint8Array(32); // SHA-512の場合
              },
            };
          },
        };
      },
      createHash: (_algorithm: string) => {
        return {
          update: (_data: string | Uint8Array) => {
            return {
              digest: (encoding?: string) => {
                if (encoding === 'hex') {
                  return 'mock-hash-hex-digest';
                }
                return new Uint8Array(32);
              },
            };
          },
        };
      },
      timingSafeEqual: (a: string, b: string) => {
        return a === b;
      },
    },
    randomBytes: (size: number) => {
      const bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    },
    createHmac: (_algorithm: string, _key: string | Uint8Array) => {
      return {
        update: (_data: string | Uint8Array) => {
          // テスト用の簡易実装
          return {
            digest: (encoding: string) => {
              if (encoding === 'hex') {
                return 'mock-hmac-hex-digest';
              }
              return new Uint8Array(32); // SHA-512の場合
            },
          };
        },
      };
    },
    createHash: (_algorithm: string) => {
      return {
        update: (_data: string | Uint8Array) => {
          return {
            digest: (encoding?: string) => {
              if (encoding === 'hex') {
                return 'mock-hash-hex-digest';
              }
              return new Uint8Array(32);
            },
          };
        },
      };
    },
    timingSafeEqual: (a: string, b: string) => {
      return a === b;
    },
  };
});

// buffer moduleのモック
vi.mock('buffer', () => ({
  default: {
    Buffer: {
      from: (data: string, encoding?: string) => {
        if (encoding === 'base64') {
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        }
        return new TextEncoder().encode(data);
      },
    },
  },
  Buffer: {
    from: (data: string, encoding?: string) => {
      if (encoding === 'base64') {
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      return new TextEncoder().encode(data);
    },
  },
}));
