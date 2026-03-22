import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostList } from '@/features/posts/components/PostList';

/**
 * 投稿削除の最小統合テスト
 */
describe('DeletePost + MSW', () => {
  it('自分の投稿の削除がUIから消える', async () => {
    render(
      <MemoryRouter>
        <Providers>
          <PostList />
        </Providers>
      </MemoryRouter>
    );

    // 初期表示（Mock Post 1, 2）。自分の投稿は Mock Post 2（user-1 所有）
    await waitFor(() => expect(screen.getByText('Mock Post 2')).toBeInTheDocument());

    // Mock Post 2 の記事領域を特定し、その中の「投稿メニュー」を開く（ダイアログ無しに変更済みのため、そのまま削除を実行）
    const post2 = screen.getByText('Mock Post 2').closest('article')!;
    const menuBtn = within(post2).getByRole('button', { name: '投稿メニュー' });
    await userEvent.click(menuBtn);

    // メニューの表示を待ってから項目を選択
    const menuDelete = await screen.findByText('削除');
    await userEvent.click(menuDelete);

    // ダイアログが開いたことを確認（AlertDialogはrole="alertdialog"）
    const dialog = await screen.findByRole('alertdialog');

    // 確認ダイアログの「削除」をクリック（ダイアログ内にスコープ）
    const confirmBtn = await within(dialog).findByRole('button', { name: '削除' });
    await userEvent.click(confirmBtn);

    // 先にダイアログが閉じたことを確認
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

    // Mock Post 2 が消えたこと（非同期考慮）
    await waitFor(() => expect(screen.queryByText('Mock Post 2')).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  });
});
