import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

// PostList がモックされた GetPosts の結果を表示できること

describe('PostList + MSW', () => {
  it('モックの投稿一覧を表示する', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 投稿コンテンツが表示されること
    await waitFor(() => {
      expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      expect(screen.getByText('Mock Post 2')).toBeInTheDocument();
    });
  });
});
