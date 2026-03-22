import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostCreatorContainer } from '@/features/posts/components/PostCreator/PostCreatorContainer';
import { PostList } from '@/features/posts/components/PostList';

/**
 * 投稿作成→一覧反映の最小統合テスト
 */
describe('CreatePost + MSW', () => {
  it('投稿作成で新規投稿がリストに現れる', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <>
            <PostCreatorContainer />
            <PostList />
          </>
        </Providers>
      </MemoryRouter>
    );

    // 初期一覧は1,2表示
    await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());

    // 投稿フォームに入力して送信
    const textarea = screen.getByLabelText('投稿内容');
    fireEvent.change(textarea, { target: { value: 'Hello from test' } });

    const submitButton = screen.getByLabelText('投稿を送信');
    fireEvent.click(submitButton);

    // 新規投稿が現れる
    await waitFor(() => expect(screen.getByText('Hello from test')).toBeInTheDocument());
  });
});
