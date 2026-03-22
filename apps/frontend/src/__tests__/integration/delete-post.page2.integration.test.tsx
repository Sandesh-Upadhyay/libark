import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * ページまたぎ削除: 2ページ目の投稿を削除→全体再取得後も復帰しない
 */

describe('DeletePost Pagination + MSW', () => {
  it('2ページ目の投稿を削除しても復活しない', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 初期表示
    await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());

    // さらに読み込む（2ページ目へ）
    const loadMore = await screen.findByRole('button', { name: /さらに読み込む/ });
    fireEvent.click(loadMore);

    // 2ページ目のモック投稿が表示される前提（MSW実装に依存）
    // 所有投稿は 'Mock Post 4'（user-1 所有）を削除対象とする
    await waitFor(() => expect(screen.getByText('Mock Post 4')).toBeInTheDocument());

    // 2ページ目の投稿を削除
    const post4 = screen.getByText('Mock Post 4').closest('article')!;
    const menuBtn = within(post4).getByRole('button', { name: '投稿メニュー' });
    await userEvent.click(menuBtn);

    const menuDelete = await screen.findByText('削除');
    await userEvent.click(menuDelete);

    const confirmBtn = await screen.findByRole('button', { name: '削除' });
    await userEvent.click(confirmBtn);

    // 削除後に復活しないこと
    await waitFor(() => expect(screen.queryByText('Mock Post 4')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
  });
});
