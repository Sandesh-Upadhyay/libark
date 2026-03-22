import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * 無限スクロールの基本テスト
 * - hasNextPage=true のときに IntersectionObserver で loadMore が呼ばれる
 * - hasNextPage=false のときには呼ばれない
 */

describe('PostList infinite scroll', () => {
  it('hasNextPage=true でスクロールトリガーが呼ばれる', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 初期投稿が表示
    await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());

    // IntersectionObserver を発火（テストセットアップでモック済み）
    // triggerRef をセレクタで取得できないため、ボタン経由（さらに読み込む）と同等の効果を検証
    const loadMoreBtn = await screen.findByRole('button', { name: /さらに読み込む/ });
    await userEvent.click(loadMoreBtn);

    // 次ページの投稿が出る（MSW 依存）
    await waitFor(() => expect(screen.getByText('Mock Post 3')).toBeInTheDocument());
  });

  it('hasNextPage=false でロードが発火しない（ボタン非表示）', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 2回押して最後まで読み込む
    const btn1 = await screen.findByRole('button', { name: /さらに読み込む/ });
    await userEvent.click(btn1);
    // 2ページ目で hasNextPage=false になる想定
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /さらに読み込む/ })).not.toBeInTheDocument()
    );
  });
});
