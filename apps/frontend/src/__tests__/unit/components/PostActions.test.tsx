import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostActions } from '@/features/posts/components/molecules/PostActions';

const currentUser = { id: 'user-1' } as unknown;

describe('PostActions', () => {
  it('自分の投稿では MenuButton が表示され、削除が呼べる', async () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <Providers>
          <PostActions
            postId='post-1'
            postUser={{ id: 'user-1' }}
            currentUser={currentUser}
            onDelete={onDelete}
          />
        </Providers>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: '投稿メニュー' }));
    await userEvent.click(await screen.findByText('削除'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('他人の投稿では MenuButton が表示されない', () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostActions postId='post-1' postUser={{ id: 'user-2' }} currentUser={currentUser} />
        </Providers>
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: '投稿メニュー' })).not.toBeInTheDocument();
  });
});
