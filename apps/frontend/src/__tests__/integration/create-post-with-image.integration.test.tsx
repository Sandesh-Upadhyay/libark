/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Providers } from '@/providers';
import { PostCreatorContainer } from '@/features/posts/components/PostCreator/PostCreatorContainer';
import { PostList } from '@/features/posts/components/PostList';

// File APIのモック
const mockFile = new File(['test image content'], 'test-image.png', {
  type: 'image/png',
});

// URL.createObjectURLのモック
global.URL = global.URL || {};
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

/**
 * 画像付き投稿作成→一覧反映の統合テスト
 */
describe('CreatePost with Image + MSW', () => {
  it('画像選択とプレビュー表示が正常に動作する', async () => {
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

    // 初期一覧の確認
    await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());

    // 投稿フォームに入力
    const textarea = screen.getByLabelText('投稿内容');
    fireEvent.change(textarea, { target: { value: '画像付きテスト投稿です' } });

    // 画像ファイル選択をシミュレート（隠されたfile input要素を使用）
    const fileInput = screen.getByTestId('image-file-input');

    // ファイル選択イベントをシミュレート
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // 画像プレビューが表示されることを確認
    await waitFor(() => {
      const imagePreview = screen.getByAltText('画像 1');
      expect(imagePreview).toBeInTheDocument();
      expect(imagePreview).toHaveAttribute('src', 'blob:mock-url');
    });

    // 投稿ボタンが有効になっていることを確認
    const submitButton = screen.getByLabelText('投稿を送信');
    expect(submitButton).not.toBeDisabled();
  });

  it('画像なしの投稿フォームが正常に動作する', async () => {
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

    // 初期一覧の確認
    await waitFor(() => expect(screen.getByText('Mock Post 1')).toBeInTheDocument());

    // 投稿フォームに入力（画像なし）
    const textarea = screen.getByLabelText('投稿内容');
    fireEvent.change(textarea, { target: { value: '画像なしテスト投稿です' } });

    // 投稿ボタンが有効になっていることを確認
    const submitButton = screen.getByLabelText('投稿を送信');
    expect(submitButton).not.toBeDisabled();

    // 画像プレビューが表示されていないことを確認
    const imagePreview = screen.queryByAltText('画像 1');
    expect(imagePreview).not.toBeInTheDocument();
  });
});
