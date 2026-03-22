import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * 削除権限: 他人の投稿には削除メニューが表示されない
 */

describe('DeletePost Permissions + MSW', () => {
  it('他人の投稿には削除メニューが表示されない', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      expect(screen.getByText('Mock Post 2')).toBeInTheDocument();
    });

    // Mock Post 1 は user-2 所有（テストユーザーは user-1）
    const post1 = screen.getByText('Mock Post 1').closest('article')!;

    // 記事内に「投稿メニュー」ボタンが存在しないこと
    const menuButtons = within(post1).queryAllByRole('button', { name: '投稿メニュー' });
    expect(menuButtons.length).toBe(0);
  });
});
