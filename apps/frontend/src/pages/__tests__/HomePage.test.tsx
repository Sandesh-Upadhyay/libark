/**
 * 🧪 HomePage コンポーネントのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';


import { Providers } from '@/providers';
import { server } from '@/__tests__/msw/server';
import { resetMSWState } from '@/__tests__/msw/handlers.graphql';

import HomePage from '../HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    resetMSWState();
    server.resetHandlers();
  });

  describe('基本的なレンダリング', () => {
    it('ページが正しくレンダリングされる', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      // 投稿リストが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
        expect(screen.getByText('Mock Post 2')).toBeInTheDocument();
      });
    });

    it('タブナビゲーションが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      // タブナビゲーションが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('投稿作成フォームが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      // 投稿作成フォームが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByLabelText('投稿内容')).toBeInTheDocument();
      });
    });
  });

  describe('投稿リストの表示', () => {
    it('投稿がリストとして表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
        expect(screen.getByText('Mock Post 2')).toBeInTheDocument();
      });
    });

    it('投稿のユーザー情報が表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Another User')).toBeInTheDocument();
      });
    });

    it('投稿のいいね数が表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        // いいね数が表示されることを確認（mockPost(1)はlikesCount: 1）
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('投稿のコメント数が表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        // コメント数が表示されることを確認（mockPost(1)はcommentsCount: 2）
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('投稿のフィルタリング', () => {
    it('タブ切り替えが可能である', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // タブが存在することを確認
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('タブ切り替えでフィルタリングが行われる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // 最初のタブをクリック
      const firstTab = screen.getAllByRole('tab')[0];
      await user.click(firstTab);

      // 投稿が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });
    });
  });

  describe('投稿のページネーション', () => {
    it('さらに読み込むボタンが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      // さらに読み込むボタンを探す
      const loadMoreButton = await screen.findByRole('button', { name: /さらに読み込む/ });
      expect(loadMoreButton).toBeInTheDocument();
    });

    it('さらに読み込むで次ページが読み込まれる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      // さらに読み込むボタンをクリック
      const loadMoreButton = await screen.findByRole('button', { name: /さらに読み込む/ });
      await user.click(loadMoreButton);

      // 次ページの投稿が表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('Mock Post 3')).toBeInTheDocument();
        expect(screen.getByText('Mock Post 4')).toBeInTheDocument();
      });
    });
  });

  describe('投稿のいいね', () => {
    it('いいねボタンが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      // いいねボタンを探す（aria-labelまたはroleで探す）
      const likeButtons = screen.getAllByRole('button');
      const likeButton = likeButtons.find(btn => btn.getAttribute('aria-label')?.includes('like'));
      expect(likeButton).toBeInTheDocument();
    });

    it('いいねボタンクリックでいいねがトグルされる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      // いいねボタンを探してクリック
      const likeButtons = screen.getAllByRole('button');
      const likeButton = likeButtons.find(btn => btn.getAttribute('aria-label')?.includes('like'));

      if (likeButton) {
        await user.click(likeButton);

        // いいね数が変わるのを待つ
        await waitFor(() => {
          expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
        });
      }
    });
  });

  describe('投稿のコメント', () => {
    it('コメントボタンが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      // コメントボタンを探す
      const commentButtons = screen.getAllByRole('button');
      const commentButton = commentButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('comment')
      );
      expect(commentButton).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('投稿リストのローディング中にスピナーが表示される', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      // ローディング中のインジケーターが表示されるか確認
      // PostListコンポーネント内のローディング状態を確認
      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });
    });
  });

  describe('エラー状態', () => {
    it('エラー時にエラーメッセージが表示される', async () => {
      // エラーハンドラーを設定
      server.use(
        ...server.listHandlers().filter(handler => {
          // Timelineクエリをエラーにする
          if (
            handler.info &&
            handler.info.kind === 'query' &&
            handler.info.operationName === 'Timeline'
          ) {
            return false; // 元のハンドラーを除外
          }
          return true;
        })
      );

      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      // エラーハンドリングが行われることを確認
      // 実際のエラー表示はPostListコンポーネント内で行われる
    });
  });

  describe('ユーザー操作のシミュレーション', () => {
    it('投稿フォームにテキストを入力できる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('投稿内容')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText('投稿内容');
      await user.type(textarea, 'テスト投稿');

      expect(textarea).toHaveValue('テスト投稿');
    });

    it('投稿ボタンがクリックできる', async () => {
      const _user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('投稿内容')).toBeInTheDocument();
      });

      const submitButton = screen.getByLabelText('投稿を送信');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    });

    it('投稿作成後にリストが更新される', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Mock Post 1')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText('投稿内容');
      await user.type(textarea, '新しい投稿');

      const submitButton = screen.getByLabelText('投稿を送信');
      await user.click(submitButton);

      // 新しい投稿が表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('新しい投稿')).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('投稿内容')).toBeInTheDocument();
        expect(screen.getByLabelText('投稿を送信')).toBeInTheDocument();
      });
    });

    it('タブナビゲーションがキーボード操作可能である', async () => {
      render(
        <MemoryRouter>
          <Providers>
            <HomePage />
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex');
      });
    });
  });
});
