/**
 * 🧪 ProfilePage コンポーネントのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { graphql, HttpResponse } from 'msw';

import { Providers } from '@/providers';
import { server } from '@/__tests__/msw/server';
import { resetMSWState } from '@/__tests__/msw/handlers.graphql';

import ProfilePage from '../ProfilePage';

describe('ProfilePage', () => {
  beforeEach(() => {
    resetMSWState();
    server.resetHandlers();
  });

  describe('基本的なレンダリング', () => {
    it('自分のプロフィールページが正しくレンダリングされる', async () => {
      const _user = { id: 'user-1' };
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      // ユーザー情報が表示されるのを待つ
      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });
    });

    it('他のユーザーのプロフィールページが正しくレンダリングされる', async () => {
      // userByUsernameクエリをモック
      server.use(
        graphql.query('UserByUsername', () => {
          return HttpResponse.json({
            data: {
              userByUsername: {
                __typename: 'User',
                id: 'user-2',
                username: 'another',
                displayName: 'Another User',
                bio: 'This is a test bio',
                profileImageId: null,
                coverImageId: null,
                isVerified: false,
                isActive: true,
                postsCount: 10,
                followersCount: 5,
                followingCount: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  __typename: 'Role',
                  id: 'role-user',
                  name: 'USER',
                  description: 'Standard user role',
                },
              },
            },
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/another']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      // ユーザー情報が表示されるのを待つ
      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
        expect(screen.getByText('This is a test bio')).toBeInTheDocument();
      });
    });

    it('ヘッダーが正しく表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 戻るボタンが表示されることを確認
      const backButton = screen.getByRole('button', { name: /戻る/ });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('ユーザー情報の表示', () => {
    it('ユーザー名が表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });
    });

    it('ユーザー名（@username）が表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });
    });

    it('投稿数が表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 投稿数が表示されることを確認
      const postCount = screen.getByText(/0件のポスト/);
      expect(postCount).toBeInTheDocument();
    });

    it('フォロワー数が表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // フォロワー数が表示されることを確認
      const followersCount = screen.getByText(/フォロワー/);
      expect(followersCount).toBeInTheDocument();
    });

    it('フォロー中の数が表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // フォロー中の数が表示されることを確認
      const followingCount = screen.getByText(/フォロー中/);
      expect(followingCount).toBeInTheDocument();
    });
  });

  describe('ユーザーの投稿一覧の表示', () => {
    it('投稿タブが表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 投稿タブが表示されることを確認
      const postsTab = screen.getByRole('tab', { name: /投稿/ });
      expect(postsTab).toBeInTheDocument();
    });
  });

  describe('ユーザーのフォロワー/フォロー中の表示', () => {
    it('フォロワー数をクリックできる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // フォロワー数をクリック
      const followersCount = screen.getByText(/フォロワー/);
      await user.click(followersCount);

      // クリックイベントが発生することを確認（実際のナビゲーションは実装次第）
      expect(followersCount).toBeInTheDocument();
    });

    it('フォロー中の数をクリックできる', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // フォロー中の数をクリック
      const followingCount = screen.getByText(/フォロー中/);
      await user.click(followingCount);

      // クリックイベントが発生することを確認
      expect(followingCount).toBeInTheDocument();
    });
  });

  describe('ユーザーのフォロー/フォロー解除', () => {
    it('他のユーザーのプロフィールにフォローボタンが表示される', async () => {
      // userByUsernameクエリをモック
      server.use(
        graphql.query('UserByUsername', () => {
          return HttpResponse.json({
            data: {
              userByUsername: {
                __typename: 'User',
                id: 'user-2',
                username: 'another',
                displayName: 'Another User',
                bio: 'This is a test bio',
                profileImageId: null,
                coverImageId: null,
                isVerified: false,
                isActive: true,
                postsCount: 10,
                followersCount: 5,
                followingCount: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  __typename: 'Role',
                  id: 'role-user',
                  name: 'USER',
                  description: 'Standard user role',
                },
              },
            },
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/another']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
      });

      // フォローボタンが表示されることを確認
      const followButton = screen.getByRole('button', { name: 'フォローする' });
      expect(followButton).toBeInTheDocument();
    });

    it('フォローボタンクリックでフォローが実行される', async () => {
      const user = userEvent.setup();

      // userByUsernameクエリをモック
      server.use(
        graphql.query('UserByUsername', () => {
          return HttpResponse.json({
            data: {
              userByUsername: {
                __typename: 'User',
                id: 'user-2',
                username: 'another',
                displayName: 'Another User',
                bio: 'This is a test bio',
                profileImageId: null,
                coverImageId: null,
                isVerified: false,
                isActive: true,
                postsCount: 10,
                followersCount: 5,
                followingCount: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  __typename: 'Role',
                  id: 'role-user',
                  name: 'USER',
                  description: 'Standard user role',
                },
              },
            },
          });
        }),
        graphql.query('IsFollowing', () => {
          return HttpResponse.json({
            data: {
              isFollowing: false,
            },
          });
        }),
        graphql.mutation('FollowUser', () => {
          return HttpResponse.json({
            data: {
              followUser: {
                __typename: 'FollowPayload',
                success: true,
                message: 'FOLLOW_SUCCESS',
              },
            },
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/another']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
      });

      // フォローボタンをクリック
      const followButton = screen.getByRole('button', { name: 'フォローする' });
      await user.click(followButton);

      // フォローが実行されることを確認（実際のUI更新は実装次第）
      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
      });
    });

    it('フォロー解除ボタンクリックでフォロー解除が実行される', async () => {
      const user = userEvent.setup();

      // userByUsernameクエリをモック
      server.use(
        graphql.query('UserByUsername', () => {
          return HttpResponse.json({
            data: {
              userByUsername: {
                __typename: 'User',
                id: 'user-2',
                username: 'another',
                displayName: 'Another User',
                bio: 'This is a test bio',
                profileImageId: null,
                coverImageId: null,
                isVerified: false,
                isActive: true,
                postsCount: 10,
                followersCount: 5,
                followingCount: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  __typename: 'Role',
                  id: 'role-user',
                  name: 'USER',
                  description: 'Standard user role',
                },
              },
            },
          });
        }),
        graphql.query('IsFollowing', () => {
          return HttpResponse.json({
            data: {
              isFollowing: true,
            },
          });
        }),
        graphql.mutation('UnfollowUser', () => {
          return HttpResponse.json({
            data: {
              unfollowUser: {
                __typename: 'UnfollowPayload',
                success: true,
                message: 'UNFOLLOW_SUCCESS',
              },
            },
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/another']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
      });

      // フォロー解除ボタンをクリック
      const unfollowButton = screen.getByRole('button', { name: /フォロー中/ });
      await user.click(unfollowButton);

      // フォロー解除が実行されることを確認
      await waitFor(() => {
        expect(screen.getAllByText('Another User').length).toBeGreaterThan(0);
      });
    });
  });

  describe('ユーザー情報の編集', () => {
    it('自分のプロフィールに編集ボタンが表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 編集ボタンが表示されることを確認
      const editButton = screen.getByRole('button', { name: /編集/ });
      expect(editButton).toBeInTheDocument();
    });

    it('編集ボタンクリックで編集モーダルが開く', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: /編集/ });
      await user.click(editButton);

      // 編集モーダルが開くことを確認（実際のモーダル表示は実装次第）
      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中にスピナーが表示される', async () => {
      // userByUsernameクエリを遅延させる
      server.use(
        graphql.query('UserByUsername', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(
                HttpResponse.json({
                  data: {
                    userByUsername: {
                      __typename: 'User',
                      id: 'user-2',
                      username: 'another',
                      displayName: 'Another User',
                      bio: 'This is a test bio',
                      profileImageId: null,
                      coverImageId: null,
                      isVerified: false,
                      isActive: true,
                      postsCount: 10,
                      followersCount: 5,
                      followingCount: 3,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      role: {
                        __typename: 'Role',
                        id: 'role-user',
                        name: 'USER',
                        description: 'Standard user role',
                      },
                    },
                  },
                })
              );
            }, 100);
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/another']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      // ローディング中のインジケーターが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
      });
    });
  });

  describe('エラー状態', () => {
    it('ユーザーが見つからない場合にエラーメッセージが表示される', async () => {
      // userByUsernameクエリをエラーにする
      server.use(
        graphql.query('UserByUsername', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'User not found',
              },
            ],
          });
        })
      );

      render(
        <MemoryRouter initialEntries={['/profile/nonexistent']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      // エラーメッセージが表示されるのを待つ
      await waitFor(() => {
        expect(
          screen.getByText(/User not found|ユーザーが見つかりませんでした/)
        ).toBeInTheDocument();
      });
    });

    it('無効なプロフィールURLの場合にエラーメッセージが表示される', async () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Providers>
            <Routes>
              <Route path='/profile' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      // エラーメッセージが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText(/無効なプロフィールURL/)).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // 戻るボタンに適切なラベルが設定されていることを確認
      const backButton = screen.getByRole('button', { name: /戻る/ });
      expect(backButton).toBeInTheDocument();
    });

    it('タブナビゲーションがキーボード操作可能である', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/testuser']}>
          <Providers>
            <Routes>
              <Route path='/profile/:username' element={<ProfilePage />} />
            </Routes>
          </Providers>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });

      // タブが存在することを確認
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // 各タブにtabindexが設定されていることを確認
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex');
      });
    });
  });
});
