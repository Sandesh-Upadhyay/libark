/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

describe('MSW smoke', () => {
  it('mocks a simple REST request', async () => {
    // MSWサーバーが既にセットアップされているため、直接テスト
    const res = await fetch('https://example.com/ping');

    // レスポンスが正常かチェック
    expect(res.ok).toBe(true);

    // JSONレスポンスをパース
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });
});
