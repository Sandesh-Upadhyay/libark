import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MenuButton } from '@/features/posts/components/atoms/MenuButton';

describe('MenuButton', () => {
  it('メニューの開閉と削除クリック', async () => {
    const onDelete = vi.fn();
    render(<MenuButton onDelete={onDelete} />);

    // トリガーをクリックしてメニューを開く
    await userEvent.click(screen.getByRole('button', { name: '投稿メニュー' }));

    // 削除メニュークリック
    await userEvent.click(await screen.findByText('削除'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
