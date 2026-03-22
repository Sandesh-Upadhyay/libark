import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * 削除フロー: 確認ダイアログでキャンセルした場合に投稿が残ること
 */

describe('DeletePost Cancel + MSW', () => {
  it('確認ダイアログでキャンセルすると投稿は残る', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 自分の投稿（Mock Post 2 = user-1 所有）
    await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());

    const post2 = screen.getByText('Mock Post 2').closest('article')!;
    const menuBtn = within(post2).getByRole('button', { name: '投稿メニュー' });
    await userEvent.click(menuBtn);

    const menuDelete = await screen.findByText('削除');
    await userEvent.click(menuDelete);

    // 確認ダイアログで「キャンセル」をクリック
    const cancelBtn = await screen.findByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelBtn);

    // 投稿はまだ残っている
    await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());
  });
});
