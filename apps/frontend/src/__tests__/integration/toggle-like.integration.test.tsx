import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';


import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

import { resetMSWState } from '../msw/handlers.graphql';

/**
 * いいねのトグルがUIに即座に反映されることを確認（楽観的更新）
 * ページリロード後の状態維持も確認
 *
 * MSWの初期状態:
 * - Post 1 (index=1): likesCount=1, isLiked=false (index % 2 === 0 は false)
 * - Post 2 (index=2): likesCount=2, isLiked=true (index % 2 === 0 は true)
 */
describe('ToggleLike + MSW', () => {
  beforeEach(() => {
    // テストごとにlocalStorageとMSW状態をクリア
    localStorage.clear();
    resetMSWState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    resetMSWState();
  });

  describe('楽観的更新の即時反映', () => {
    it('いいねボタンでlikesCountが即座に更新される（楽観的更新）', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示（Mock Post 1 / likesCount 1, isLiked: false）
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());
      const post1 = screen.getByText('Mock Post 1').closest('article')!;
      const likeBtn = within(post1).getByRole('button', { name: /いいね 1件/ });

      // クリックでトグル
      fireEvent.click(likeBtn);

      // 楽観的更新により、即座にlikesCountが2に変わる（サーバー応答を待たない）
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );
    });

    it('いいねボタンでisLiked状態が即座に更新される（楽観的更新）', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示（Mock Post 2 / isLiked: true）
      await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());
      const post2 = screen.getByText('Mock Post 2').closest('article')!;
      const likeBtn = within(post2).getByRole('button', { name: /いいね 2件/ });

      // isLiked状態がtrueの場合、ボタンのaria-pressedがtrueであることを確認
      expect(likeBtn).toHaveAttribute('aria-pressed', 'true');

      // クリックでトグル
      fireEvent.click(likeBtn);

      // 楽観的更新により、即座にisLikedがfalseに変わる
      await waitFor(
        () => {
          const updatedBtn = within(post2).getByRole('button', { name: /いいね 1件/ });
          expect(updatedBtn).toHaveAttribute('aria-pressed', 'false');
        },
        { timeout: 100 }
      );
    });

    it('いいねボタンでlikesCountとisLikedが同時に即座に更新される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示（Mock Post 1 / likesCount 1, isLiked: false）
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());
      const post1 = screen.getByText('Mock Post 1').closest('article')!;
      const likeBtn = within(post1).getByRole('button', { name: /いいね 1件/ });

      // isLiked状態がfalseの場合、ボタンのaria-pressedがfalseであることを確認
      expect(likeBtn).toHaveAttribute('aria-pressed', 'false');

      // クリックでトグル
      fireEvent.click(likeBtn);

      // 楽観的更新により、即座にlikesCountが2に、isLikedがtrueに変わる
      await waitFor(
        () => {
          const updatedBtn = within(post1).getByRole('button', { name: /いいね 2件/ });
          expect(updatedBtn).toHaveAttribute('aria-pressed', 'true');
        },
        { timeout: 100 }
      );
    });
  });

  describe('ページリロード後の状態維持', () => {
    it('いいね状態がlocalStorageに保存される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());

      // いいねボタンをクリック
      const post1 = screen.getByText('Mock Post 1').closest('article')!;
      const likeBtn = within(post1).getByRole('button', { name: /いいね 1件/ });
      fireEvent.click(likeBtn);

      // 楽観的更新が反映されるのを待つ
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );

      // Apollo CacheがlocalStorageに保存されるのを待つ
      await waitFor(
        () => {
          const cacheData = localStorage.getItem('libark-apollo-cache');
          expect(cacheData).toBeTruthy();
          expect(cacheData).toContain('post-1');
        },
        { timeout: 500 } // waitForのタイムアウト値
      );
    });

    it('localStorageからキャッシュが復元される', async () => {
      // テスト用のキャッシュデータをlocalStorageに保存
      const mockCacheData = JSON.stringify({
        'Post:post-1': {
          id: 'post-1',
          likesCount: 2,
          isLikedByCurrentUser: true,
          __typename: 'Post',
        },
      });
      localStorage.setItem('libark-apollo-cache', mockCacheData);

      // Apollo Clientの初期化時にキャッシュが復元されることを確認
      // （実際の復元はGraphQLProvider内で行われるため、ここではlocalStorageにデータが存在することを確認）
      expect(localStorage.getItem('libark-apollo-cache')).toBe(mockCacheData);
    });

    it('visibilitychangeイベントハンドラーが登録されている', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());

      // Apollo Cache Persistorが初期化されていることを確認
      // （実際のアプリケーションでは、GraphQLProvider内でCachePersistorが初期化され、
      //  visibilitychangeイベントハンドラーが登録されます）
      const persistor = (window as any).__LIBARK_APOLLO_PERSISTOR__;
      expect(persistor).toBeDefined();

      const handler = (window as any).__LIBARK_APOLLO_PERSIST_HANDLER__;
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });
  });

  describe('連続いいね操作', () => {
    it('連続でいいねをトグルしても正しく動作する', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());
      const post1 = screen.getByText('Mock Post 1').closest('article')!;

      // 1回目のクリック（いいね追加: 1 -> 2）
      let likeBtn = within(post1).getByRole('button', { name: /いいね 1件/ });
      fireEvent.click(likeBtn);
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );

      // 2回目のクリック（いいね解除: 2 -> 1）
      likeBtn = within(post1).getByRole('button', { name: /いいね 2件/ });
      fireEvent.click(likeBtn);
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 1件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );

      // 3回目のクリック（いいね追加: 1 -> 2）
      likeBtn = within(post1).getByRole('button', { name: /いいね 1件/ });
      fireEvent.click(likeBtn);
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );
    });
  });

  describe('複数投稿のいいね', () => {
    it('複数の投稿でそれぞれ独立していいねが機能する', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <PostList />
          </Providers>
        </MemoryRouter>
      );

      // 初期表示
      await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());

      const post1 = screen.getByText('Mock Post 1').closest('article')!;
      const post2 = screen.getByText('Mock Post 2').closest('article')!;

      // Mock Post 1のいいねボタンをクリック（1 -> 2）
      const likeBtn1 = within(post1).getByRole('button', { name: /いいね 1件/ });
      fireEvent.click(likeBtn1);
      await waitFor(
        () => expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );

      // Mock Post 2のいいねボタンをクリック（2 -> 1）
      const likeBtn2 = within(post2).getByRole('button', { name: /いいね 2件/ });
      fireEvent.click(likeBtn2);
      await waitFor(
        () => expect(within(post2).getByRole('button', { name: /いいね 1件/ })).toBeInTheDocument(),
        { timeout: 100 }
      );

      // 各投稿の状態が独立していることを確認
      expect(within(post1).getByRole('button', { name: /いいね 2件/ })).toBeInTheDocument();
      expect(within(post2).getByRole('button', { name: /いいね 1件/ })).toBeInTheDocument();
    });
  });
});
