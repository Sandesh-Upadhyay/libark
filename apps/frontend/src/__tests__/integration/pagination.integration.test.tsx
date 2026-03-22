import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * カーソルベース・ページネーションの検証
 */
describe('PostList pagination + MSW', () => {
  it('「さらに読み込む」で次ページが読み込まれる', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 初期ページ: 1,2
    await waitFor(() => {
      expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      expect(screen.getByText('Mock Post 2')).toBeInTheDocument();
    });

    // ボタンをクリックして次ページを要求
    const loadMoreBtn = screen.getByRole('button', { name: /さらに読み込む/i });
    fireEvent.click(loadMoreBtn);

    // 次ページ: 3,4 が表示される
    await waitFor(() => {
      expect(screen.getByText('Mock Post 3')).toBeInTheDocument();
      expect(screen.getByText('Mock Post 4')).toBeInTheDocument();
    });
  });
});
