import { graphql, HttpResponse } from 'msw';

// テスト環境でのGraphQLエンドポイント設定
const _GRAPHQL_ENDPOINT = 'http://localhost:8000/graphql';

// ================================
// 状態管理
// ================================

const deletedPostIds = new Set<string>();
const postLikes = new Map<string, { count: number; isLiked: boolean }>();
const createdPosts: Record<string, unknown>[] = [];
const createdComments: Record<string, unknown>[] = [];
const followers = new Map<string, Set<string>>(); // userId -> followers
const following = new Map<string, Set<string>>(); // userId -> following
const notifications: Record<string, unknown>[] = [];
const walletTransactions: Record<string, unknown>[] = [];
const depositRequests: Record<string, unknown>[] = [];
const withdrawalRequests: Record<string, unknown>[] = [];
const p2pOffers: Record<string, unknown>[] = [];
const p2pTrades: Record<string, unknown>[] = [];
const conversations: Record<string, unknown>[] = [];
const messages: Record<string, unknown>[] = [];

// 2FA状態
let twoFactorEnabled = false;
const twoFactorSecret = 'JBSWY3DPEHPK3PXP';
const backupCodes = [
  '123456',
  '234567',
  '345678',
  '456789',
  '567890',
  '678901',
  '789012',
  '890123',
  '901234',
  '012345',
];

/**
 * MSWの状態をリセットする関数（テスト間の分離用）
 */
export function resetMSWState() {
  deletedPostIds.clear();
  postLikes.clear();
  createdPosts.length = 0;
  createdComments.length = 0;
  followers.clear();
  following.clear();
  notifications.length = 0;
  walletTransactions.length = 0;
  depositRequests.length = 0;
  withdrawalRequests.length = 0;
  p2pOffers.length = 0;
  p2pTrades.length = 0;
  conversations.length = 0;
  messages.length = 0;
  twoFactorEnabled = false;
}

// ================================
// モックデータ生成関数
// ================================

function mockUser(id: string, username: string, displayName: string) {
  return {
    __typename: 'User',
    id,
    username,
    email: `${username}@example.com`,
    displayName,
    bio: `Bio for ${displayName}`,
    profileImageId: null,
    coverImageId: null,
    isVerified: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    postsCount: 0,
    followersCount: followers.get(id)?.size || 0,
    followingCount: following.get(id)?.size || 0,
    role: {
      __typename: 'Role',
      id: `role-${id}`,
      name: 'USER',
      description: 'Standard user role',
    },
  };
}

function mockPost(index: number) {
  const id = `post-${index}`;
  const userId = index % 2 === 0 ? 'user-1' : 'user-2';

  // いいね状態を初期化
  if (!postLikes.has(id)) {
    postLikes.set(id, {
      count: index,
      isLiked: index % 2 === 0,
    });
  }

  const likeState = postLikes.get(id)!;

  return {
    __typename: 'Post',
    id,
    content: `Mock Post ${index}`,
    visibility: 'PUBLIC',
    isDeleted: false,
    isProcessing: false,
    price: null,
    paidAt: null,
    createdAt: new Date(Date.now() - index * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - index * 30_000).toISOString(),
    userId,
    user: mockUser(
      userId,
      userId === 'user-1' ? 'testuser' : 'another',
      userId === 'user-1' ? 'Test User' : 'Another User'
    ),
    media: [],
    likesCount: likeState.count,
    commentsCount: index * 2,
    viewsCount: index * 5,
    isLikedByCurrentUser: likeState.isLiked,
    isPurchasedByCurrentUser: false,
  };
}

function mockComment(index: number, postId: string) {
  return {
    __typename: 'Comment',
    id: `comment-${index}`,
    content: `Comment ${index}`,
    isDeleted: false,
    createdAt: new Date(Date.now() - index * 30_000).toISOString(),
    updatedAt: new Date(Date.now() - index * 30_000).toISOString(),
    userId: 'user-1',
    user: mockUser('user-1', 'testuser', 'Test User'),
    postId,
    post: mockPost(parseInt(postId.replace('post-', ''))),
    likesCount: index,
    isLikedByCurrentUser: false,
  };
}

function mockNotification(index: number) {
  return {
    __typename: 'Notification',
    id: `notification-${index}`,
    type: index % 2 === 0 ? 'LIKE' : 'COMMENT',
    content: `Notification ${index}`,
    isRead: false,
    createdAt: new Date(Date.now() - index * 60_000).toISOString(),
    readAt: null,
    userId: 'user-1',
    user: mockUser('user-1', 'testuser', 'Test User'),
    actorId: 'user-2',
    actor: mockUser('user-2', 'another', 'Another User'),
    referenceId: `post-${index}`,
  };
}

function mockWalletTransaction(index: number) {
  return {
    __typename: 'WalletTransaction',
    id: `transaction-${index}`,
    userId: 'user-1',
    paymentRequestId: null,
    type: index % 2 === 0 ? 'DEPOSIT' : 'WITHDRAWAL',
    balanceType: 'WALLET',
    amountUsd: 100 * index,
    description: `Transaction ${index}`,
    metadata: null,
    createdAt: new Date(Date.now() - index * 60_000).toISOString(),
    user: mockUser('user-1', 'testuser', 'Test User'),
    paymentRequest: null,
  };
}

function mockP2POffer(index: number) {
  return {
    __typename: 'P2POffer',
    id: `offer-${index}`,
    sellerId: 'user-1',
    paymentMethod: index % 2 === 0 ? 'BANK_TRANSFER' : 'PAYPAY',
    minAmountUsd: 10,
    maxAmountUsd: 1000,
    fiatCurrency: 'JPY',
    exchangeRateMargin: 0.01,
    isActive: true,
    instructions: `Instructions for offer ${index}`,
    priority: index,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seller: mockUser('user-1', 'testuser', 'Test User'),
  };
}

function mockP2PTrade(index: number) {
  return {
    __typename: 'P2PTradeRequest',
    id: `trade-${index}`,
    buyerId: 'user-1',
    sellerId: 'user-2',
    offerId: `offer-${index}`,
    offer: mockP2POffer(index),
    amountUsd: 100,
    fiatCurrency: 'JPY',
    fiatAmount: 15000,
    exchangeRate: 150,
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    paymentDetails: null,
    escrowAmount: 100,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buyer: mockUser('user-1', 'testuser', 'Test User'),
    seller: mockUser('user-2', 'another', 'Another User'),
  };
}

// ================================
// クエリハンドラー
// ================================

export const graphqlHandlers = [
  // ================================
  // 認証関連クエリ
  // ================================

  // Me query
  graphql.query('Me', () => {
    return HttpResponse.json({
      data: {
        me: mockUser('user-1', 'testuser', 'Test User'),
      },
    });
  }),

  // ================================
  // ユーザー関連クエリ
  // ================================

  // User query
  graphql.query('User', ({ variables }) => {
    const id = (variables as unknown)?.id as string;
    return HttpResponse.json({
      data: {
        user: mockUser(id, `user-${id}`, `User ${id}`),
      },
    });
  }),

  // UserByUsername query
  graphql.query('UserByUsername', ({ variables }) => {
    const username = (variables as unknown)?.username as string;
    return HttpResponse.json({
      data: {
        userByUsername: mockUser(
          `user-${username}`,
          username,
          username.charAt(0).toUpperCase() + username.slice(1)
        ),
      },
    });
  }),

  // Users query
  graphql.query('Users', ({ variables }) => {
    const { first = 20, after } = variables as { first: number; after?: string };
    const users = Array.from({ length: Math.min(first, 10) }, (_, i) =>
      mockUser(`user-${i}`, `user${i}`, `User ${i}`)
    );

    return HttpResponse.json({
      data: {
        users: {
          __typename: 'UserConnection',
          edges: users.map((user, i) => ({
            __typename: 'UserEdge',
            node: user,
            cursor: `cursor-${i}`,
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${users.length - 1}`,
          },
          totalCount: users.length,
        },
      },
    });
  }),

  // AdminUsers query
  graphql.query('AdminUsers', ({ variables }) => {
    const { first = 20, after } = variables as { first: number; after?: string };
    const users = Array.from({ length: Math.min(first, 10) }, (_, i) =>
      mockUser(`user-${i}`, `user${i}`, `User ${i}`)
    );

    return HttpResponse.json({
      data: {
        adminUsers: {
          __typename: 'AdminUserConnection',
          edges: users.map((user, i) => ({
            __typename: 'UserEdge',
            node: user,
            cursor: `cursor-${i}`,
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${users.length - 1}`,
          },
          totalCount: users.length,
        },
      },
    });
  }),

  // AdminUser query
  graphql.query('AdminUser', ({ variables }) => {
    const id = (variables as unknown)?.id as string;
    return HttpResponse.json({
      data: {
        adminUser: {
          __typename: 'AdminUserDetail',
          user: mockUser(id, `user-${id}`, `User ${id}`),
          permissions: [],
          settings: null,
        },
      },
    });
  }),

  // ================================
  // フォロー関連クエリ
  // ================================

  // Followers query
  graphql.query('Followers', ({ variables }) => {
    const {
      userId,
      first = 20,
      after,
    } = variables as { userId: string; first: number; after?: string };
    const followerIds = Array.from(followers.get(userId) || []);
    const followersList = followerIds
      .slice(0, first)
      .map(id => mockUser(id, `user-${id}`, `User ${id}`));

    return HttpResponse.json({
      data: {
        followers: {
          __typename: 'FollowConnection',
          edges: followersList.map((user, i) => ({
            __typename: 'FollowEdge',
            node: user,
            cursor: `cursor-${i}`,
            followedAt: new Date().toISOString(),
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: followerIds.length > first,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${followersList.length - 1}`,
          },
          totalCount: followerIds.length,
        },
      },
    });
  }),

  // Following query
  graphql.query('Following', ({ variables }) => {
    const {
      userId,
      first = 20,
      after,
    } = variables as { userId: string; first: number; after?: string };
    const followingIds = Array.from(following.get(userId) || []);
    const followingList = followingIds
      .slice(0, first)
      .map(id => mockUser(id, `user-${id}`, `User ${id}`));

    return HttpResponse.json({
      data: {
        following: {
          __typename: 'FollowConnection',
          edges: followingList.map((user, i) => ({
            __typename: 'FollowEdge',
            node: user,
            cursor: `cursor-${i}`,
            followedAt: new Date().toISOString(),
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: followingIds.length > first,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${followingList.length - 1}`,
          },
          totalCount: followingIds.length,
        },
      },
    });
  }),

  // IsFollowing query
  graphql.query('IsFollowing', ({ variables }) => {
    const { userId } = variables as { userId: string };
    const isFollowing = following.get('user-1')?.has(userId) || false;

    return HttpResponse.json({
      data: {
        isFollowing,
      },
    });
  }),

  // ================================
  // タイムライン・投稿関連クエリ
  // ================================

  // Timeline query
  graphql.query('Timeline', ({ variables }) => {
    const { type, after } = variables as { type: string; first: number; after?: string };

    // 1ページ目
    if (!after) {
      const base = [mockPost(1), mockPost(2)];
      const filtered = base.filter(p => !deletedPostIds.has(p.id));
      const edges = filtered.map((p, idx) => ({
        __typename: 'PostEdge',
        node: p,
        cursor: idx === 0 ? 'c1' : 'c2',
      }));
      const total =
        4 - ['post-1', 'post-2', 'post-3', 'post-4'].filter(id => deletedPostIds.has(id)).length;

      return HttpResponse.json({
        data: {
          timeline: {
            __typename: 'TimelineConnection',
            edges,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'c1',
              endCursor: 'c2',
            },
            totalCount: total,
            timelineType: type,
          },
        },
      });
    }

    // 2ページ目
    if (after === 'c2') {
      const base = [mockPost(3), mockPost(4)];
      const filtered = base.filter(p => !deletedPostIds.has(p.id));
      const edges = filtered.map((p, idx) => ({
        __typename: 'PostEdge',
        node: p,
        cursor: idx === 0 ? 'c3' : 'c4',
      }));
      const total =
        4 - ['post-1', 'post-2', 'post-3', 'post-4'].filter(id => deletedPostIds.has(id)).length;

      return HttpResponse.json({
        data: {
          timeline: {
            __typename: 'TimelineConnection',
            edges,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: edges[0]?.cursor ?? null,
              endCursor: edges.at(-1)?.cursor ?? null,
            },
            totalCount: total,
            timelineType: type,
          },
        },
      });
    }

    // デフォルト（空）
    return HttpResponse.json({
      data: {
        timeline: {
          __typename: 'TimelineConnection',
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
          timelineType: type,
        },
      },
    });
  }),

  // Post query
  graphql.query('Post', ({ variables }) => {
    const { id } = variables as { id: string };
    const post = mockPost(parseInt(id.replace('post-', '')));

    return HttpResponse.json({
      data: {
        post: deletedPostIds.has(id) ? null : post,
      },
    });
  }),

  // Posts query
  graphql.query('Posts', ({ variables }) => {
    const { after } = variables as {
      first: number;
      after?: string;
      userId?: string;
      visibility?: string;
      includeProcessing: boolean;
    };

    // 1ページ目
    if (!after) {
      const base = [mockPost(1), mockPost(2)];
      const filtered = base.filter(p => !deletedPostIds.has(p.id));
      const edges = filtered.map((p, idx) => ({
        __typename: 'PostEdge',
        node: p,
        cursor: idx === 0 ? 'c1' : 'c2',
      }));
      const total =
        4 - ['post-1', 'post-2', 'post-3', 'post-4'].filter(id => deletedPostIds.has(id)).length;

      return HttpResponse.json({
        data: {
          posts: {
            __typename: 'PostConnection',
            edges,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'c1',
              endCursor: 'c2',
            },
            totalCount: total,
          },
        },
      });
    }

    // 2ページ目
    if (after === 'c2') {
      const base = [mockPost(3), mockPost(4)];
      const filtered = base.filter(p => !deletedPostIds.has(p.id));
      const edges = filtered.map((p, idx) => ({
        __typename: 'PostEdge',
        node: p,
        cursor: idx === 0 ? 'c3' : 'c4',
      }));
      const total =
        4 - ['post-1', 'post-2', 'post-3', 'post-4'].filter(id => deletedPostIds.has(id)).length;

      return HttpResponse.json({
        data: {
          posts: {
            __typename: 'PostConnection',
            edges,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: edges[0]?.cursor ?? null,
              endCursor: edges.at(-1)?.cursor ?? null,
            },
            totalCount: total,
          },
        },
      });
    }

    // デフォルト（空）
    return HttpResponse.json({
      data: {
        posts: {
          __typename: 'PostConnection',
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        },
      },
    });
  }),

  // LikedPosts query
  graphql.query('LikedPosts', ({ variables }) => {
    const { after } = variables as { first: number; after?: string };
    const likedPosts = [mockPost(1), mockPost(3)].filter(p => p.isLikedByCurrentUser);

    return HttpResponse.json({
      data: {
        likedPosts: {
          __typename: 'PostConnection',
          edges: likedPosts.map((p, i) => ({
            __typename: 'PostEdge',
            node: p,
            cursor: `cursor-${i}`,
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${likedPosts.length - 1}`,
          },
          totalCount: likedPosts.length,
        },
      },
    });
  }),

  // MediaPosts query
  graphql.query('MediaPosts', ({ variables }) => {
    const { after } = variables as { first: number; after?: string };

    return HttpResponse.json({
      data: {
        mediaPosts: {
          __typename: 'PostConnection',
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        },
      },
    });
  }),

  // ================================
  // コメント関連クエリ
  // ================================

  // Comment query
  graphql.query('Comment', ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        comment: mockComment(parseInt(id.replace('comment-', '')), 'post-1'),
      },
    });
  }),

  // Comments query
  graphql.query('Comments', ({ variables }) => {
    const { postId } = variables as { postId: string; first: number; after?: string };
    const comments = Array.from({ length: 5 }, (_, i) => mockComment(i, postId));

    return HttpResponse.json({
      data: {
        comments,
      },
    });
  }),

  // ================================
  // 通知関連クエリ
  // ================================

  // Notifications query
  graphql.query('Notifications', ({ variables }) => {
    const {
      isRead,
      type,
      first = 20,
    } = variables as {
      first: number;
      after?: string;
      isRead?: boolean;
      type?: string;
    };

    let filteredNotifications =
      notifications.length > 0
        ? notifications
        : Array.from({ length: 5 }, (_, i) => mockNotification(i));

    if (isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === isRead);
    }
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    return HttpResponse.json({
      data: {
        notifications: filteredNotifications.slice(0, first),
      },
    });
  }),

  // UnreadNotificationsCount query
  graphql.query('UnreadNotificationsCount', () => {
    const unreadCount = notifications.filter(n => !n.isRead).length || 3;

    return HttpResponse.json({
      data: {
        unreadNotificationsCount: unreadCount,
      },
    });
  }),

  // ================================
  // メディア関連クエリ
  // ================================

  // Media query
  graphql.query('Media', ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        media: {
          __typename: 'Media',
          id,
          filename: `test-${id}.webp`,
          s3Key: `post/2025-01-01/test-${id}.webp`,
          mimeType: 'image/webp',
          fileSize: 1024,
          width: 1200,
          height: 800,
          type: 'POST',
          status: 'READY',
          url: `/api/media/${id}`,
          thumbnailUrl: `/api/media/${id}/thumb`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          variants: [],
          user: mockUser('user-1', 'testuser', 'Test User'),
          post: mockPost(1),
        },
      },
    });
  }),

  // MyMedia query
  graphql.query('MyMedia', ({ variables }) => {
    void (variables as { first: number; after?: string });
    const mediaList = Array.from({ length: 5 }, (_, i) => ({
      __typename: 'Media',
      id: `media-${i}`,
      filename: `test-${i}.webp`,
      s3Key: `post/2025-01-01/test-${i}.webp`,
      mimeType: 'image/webp',
      fileSize: 1024,
      width: 1200,
      height: 800,
      type: 'POST',
      status: 'READY',
      url: `/api/media/${i}`,
      thumbnailUrl: `/api/media/${i}/thumb`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: [],
      user: mockUser('user-1', 'testuser', 'Test User'),
      post: mockPost(1),
    }));

    return HttpResponse.json({
      data: {
        myMedia: mediaList,
      },
    });
  }),

  // ================================
  // ユーザー設定関連クエリ
  // ================================

  // MySettings query
  graphql.query('MySettings', () => {
    return HttpResponse.json({
      data: {
        mySettings: {
          __typename: 'UserSettings',
          userId: 'user-1',
          theme: 'light',
          animationsEnabled: true,
          locale: 'ja',
          contentFilter: 'ALL',
          displayMode: 'STANDARD',
          timezone: 'Asia/Tokyo',
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // ================================
  // メッセージ関連クエリ
  // ================================

  // Conversations query
  graphql.query('Conversations', ({ variables }) => {
    const { after } = variables as {
      first: number;
      after?: string;
      includeArchived: boolean;
    };

    return HttpResponse.json({
      data: {
        conversations: {
          __typename: 'ConversationConnection',
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        },
      },
    });
  }),

  // Conversation query
  graphql.query('Conversation', ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        conversation: {
          __typename: 'Conversation',
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participants: [],
          messages: [],
        },
      },
    });
  }),

  // MessageStats query
  graphql.query('MessageStats', () => {
    return HttpResponse.json({
      data: {
        messageStats: {
          __typename: 'MessageStats',
          totalConversations: 0,
          unreadMessages: 0,
          totalMessages: 0,
        },
      },
    });
  }),

  // SearchMessages query
  graphql.query('SearchMessages', ({ variables }) => {
    const { after } = variables as {
      query: string;
      conversationId?: string;
      first: number;
      after?: string;
    };

    return HttpResponse.json({
      data: {
        searchMessages: {
          __typename: 'MessageConnection',
          edges: [],
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: !!after,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        },
      },
    });
  }),

  // ================================
  // 管理者機能クエリ
  // ================================

  // SystemStats query
  graphql.query('SystemStats', () => {
    return HttpResponse.json({
      data: {
        systemStats: {
          __typename: 'SystemStats',
          totalUsers: 100,
          activeUsers: 50,
          totalPosts: 500,
          totalComments: 1000,
        },
      },
    });
  }),

  // AuthCacheStats query
  graphql.query('AuthCacheStats', () => {
    return HttpResponse.json({
      data: {
        authCacheStats: {
          __typename: 'CacheStats',
          hitRate: 0.95,
          totalRequests: 1000,
          cacheHits: 950,
          cacheMisses: 50,
        },
      },
    });
  }),

  // RateLimitStats query
  graphql.query('RateLimitStats', () => {
    return HttpResponse.json({
      data: {
        rateLimitStats: {
          __typename: 'RateLimitStats',
          totalRequests: 1000,
          rateLimitedRequests: 10,
          averageResponseTime: 100,
        },
      },
    });
  }),

  // ================================
  // ウォレット関連クエリ
  // ================================

  // MyWallet query
  graphql.query('MyWallet', () => {
    return HttpResponse.json({
      data: {
        myWallet: {
          __typename: 'Wallet',
          id: 'wallet-1',
          userId: 'user-1',
          balanceUsd: 1000,
          salesBalanceUsd: 500,
          p2pBalanceUsd: 200,
          p2pLockedUsd: 50,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // MyWalletTransactions query
  graphql.query('MyWalletTransactions', ({ variables }) => {
    void (variables as { first: number; after?: string });
    const transactions =
      walletTransactions.length > 0
        ? walletTransactions
        : Array.from({ length: 5 }, (_, i) => mockWalletTransaction(i));

    return HttpResponse.json({
      data: {
        myWalletTransactions: transactions,
      },
    });
  }),

  // MyUserWallets query
  graphql.query('MyUserWallets', () => {
    return HttpResponse.json({
      data: {
        myUserWallets: [
          {
            __typename: 'UserWallet',
            id: 'user-wallet-1',
            userId: 'user-1',
            walletName: 'Main Wallet',
            currency: 'BTC',
            network: 'bitcoin',
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            isVerified: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: mockUser('user-1', 'testuser', 'Test User'),
          },
        ],
      },
    });
  }),

  // MyDepositRequests query
  graphql.query('MyDepositRequests', () => {
    return HttpResponse.json({
      data: {
        myDepositRequests: depositRequests.length > 0 ? depositRequests : [],
      },
    });
  }),

  // MyWithdrawalRequests query
  graphql.query('MyWithdrawalRequests', () => {
    return HttpResponse.json({
      data: {
        myWithdrawalRequests: withdrawalRequests.length > 0 ? withdrawalRequests : [],
      },
    });
  }),

  // GetExchangeRate query
  graphql.query('GetExchangeRate', ({ variables }) => {
    const { currency } = variables as { currency: string };
    const rates: Record<string, number> = {
      BTC: 45000,
      ETH: 3000,
      JPY: 0.0067,
      USD: 1,
    };

    return HttpResponse.json({
      data: {
        getExchangeRate: rates[currency] || 1,
      },
    });
  }),

  // GetSupportedCurrencies query
  graphql.query('GetSupportedCurrencies', () => {
    return HttpResponse.json({
      data: {
        getSupportedCurrencies: ['BTC', 'ETH', 'JPY', 'USD'],
      },
    });
  }),

  // ================================
  // サイト機能関連クエリ
  // ================================

  // SiteFeatureSettings query
  graphql.query('SiteFeatureSettings', () => {
    return HttpResponse.json({
      data: {
        siteFeatureSettings: [],
      },
    });
  }),

  // SiteFeatureSetting query
  graphql.query('SiteFeatureSetting', ({ variables }) => {
    const { featureName } = variables as { featureName: string };
    return HttpResponse.json({
      data: {
        siteFeatureSetting: {
          __typename: 'SiteFeatureSetting',
          id: `feature-${featureName}`,
          featureName,
          isEnabled: true,
          description: `Feature ${featureName}`,
          updatedBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedByUser: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // UserFeaturePermissions query
  graphql.query('UserFeaturePermissions', ({ variables }) => {
    void (variables as { userId: string });
    return HttpResponse.json({
      data: {
        userFeaturePermissions: [],
      },
    });
  }),

  // MyFeaturePermissions query
  graphql.query('MyFeaturePermissions', () => {
    return HttpResponse.json({
      data: {
        myFeaturePermissions: [],
      },
    });
  }),

  // FeatureFlags query
  graphql.query('FeatureFlags', () => {
    return HttpResponse.json({
      data: {
        featureFlags: {
          __typename: 'FeatureFlags',
          POST_CREATE: true,
          POST_IMAGE_UPLOAD: true,
          POST_LIKE: true,
          MESSAGES_ACCESS: true,
          MESSAGES_SEND: true,
          WALLET_ACCESS: true,
          WALLET_DEPOSIT: true,
          WALLET_WITHDRAW: true,
        },
      },
    });
  }),

  // ================================
  // 2FA関連クエリ
  // ================================

  // TwoFactorStatus query
  graphql.query('TwoFactorStatus', () => {
    return HttpResponse.json({
      data: {
        twoFactorStatus: {
          __typename: 'TwoFactorStatus',
          enabled: twoFactorEnabled,
          enabledAt: twoFactorEnabled ? new Date().toISOString() : null,
          backupCodesCount: backupCodes.length,
        },
      },
    });
  }),

  // ================================
  // P2P関連クエリ
  // ================================

  // MyP2PTradeRequests query
  graphql.query('MyP2PTradeRequests', ({ variables }) => {
    const { status, first } = variables as {
      status?: string;
      first?: number;
      after?: string;
    };
    const trades =
      p2pTrades.length > 0 ? p2pTrades : Array.from({ length: 3 }, (_, i) => mockP2PTrade(i));

    let filteredTrades = trades;
    if (status) {
      filteredTrades = trades.filter(t => t.status === status);
    }

    return HttpResponse.json({
      data: {
        myP2PTradeRequests: filteredTrades.slice(0, first || 10),
      },
    });
  }),

  // P2PTradeRequest query
  graphql.query('P2PTradeRequest', ({ variables }) => {
    const { tradeId } = variables as { tradeId: string };
    const trade = p2pTrades.find(t => t.id === tradeId) || mockP2PTrade(0);

    return HttpResponse.json({
      data: {
        p2pTradeRequest: trade,
      },
    });
  }),

  // AvailableP2POffers query
  graphql.query('AvailableP2POffers', ({ variables }) => {
    const {
      fiatCurrency,
      paymentMethod,
      amountUsd,
      first = 20,
      after,
    } = variables as {
      fiatCurrency?: string;
      paymentMethod?: string;
      amountUsd?: number;
      first: number;
      after?: string;
    };

    const offers =
      p2pOffers.length > 0 ? p2pOffers : Array.from({ length: 5 }, (_, i) => mockP2POffer(i));

    let filteredOffers = offers;
    if (fiatCurrency) {
      filteredOffers = filteredOffers.filter(o => o.fiatCurrency === fiatCurrency);
    }
    if (paymentMethod) {
      filteredOffers = filteredOffers.filter(o => o.paymentMethod === paymentMethod);
    }
    if (amountUsd) {
      filteredOffers = filteredOffers.filter(
        o => o.minAmountUsd <= amountUsd && o.maxAmountUsd >= amountUsd
      );
    }

    return HttpResponse.json({
      data: {
        availableP2POffers: {
          __typename: 'P2POfferConnection',
          edges: filteredOffers.slice(0, first).map((o, i) => ({
            __typename: 'P2POfferEdge',
            node: o,
            cursor: `cursor-${i}`,
          })),
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: filteredOffers.length > first,
            hasPreviousPage: !!after,
            startCursor: 'cursor-0',
            endCursor: `cursor-${Math.min(first, filteredOffers.length) - 1}`,
          },
          totalCount: filteredOffers.length,
        },
      },
    });
  }),

  // MyP2POffers query
  graphql.query('MyP2POffers', ({ variables }) => {
    const { fiatCurrency, paymentMethod, isActive } = variables as {
      fiatCurrency?: string;
      paymentMethod?: string;
      isActive?: boolean;
    };

    const offers = p2pOffers.filter(o => o.sellerId === 'user-1');

    let filteredOffers = offers;
    if (fiatCurrency) {
      filteredOffers = filteredOffers.filter(o => o.fiatCurrency === fiatCurrency);
    }
    if (paymentMethod) {
      filteredOffers = filteredOffers.filter(o => o.paymentMethod === paymentMethod);
    }
    if (isActive !== undefined) {
      filteredOffers = filteredOffers.filter(o => o.isActive === isActive);
    }

    return HttpResponse.json({
      data: {
        myP2POffers: filteredOffers,
      },
    });
  }),

  // ================================
  // GetAppData query (複合クエリ)
  // ================================

  graphql.query('GetAppData', () => {
    return HttpResponse.json({
      data: {
        me: mockUser('user-1', 'testuser', 'Test User'),
        myPermissions: [
          {
            __typename: 'UserPermission',
            id: 'perm-1',
            userId: 'user-1',
            permissionId: 'perm-view',
            isActive: true,
            permission: {
              __typename: 'Permission',
              id: 'perm-view',
              name: 'VIEW',
              description: 'View permission',
            },
          },
        ],
        mySettings: {
          __typename: 'UserSettings',
          userId: 'user-1',
          theme: 'light',
          animationsEnabled: true,
          locale: 'ja',
          contentFilter: 'ALL',
          displayMode: 'STANDARD',
          timezone: 'Asia/Tokyo',
          updatedAt: new Date().toISOString(),
        },
        featureFlags: {
          __typename: 'FeatureFlags',
          POST_CREATE: true,
          POST_IMAGE_UPLOAD: true,
          POST_LIKE: true,
          MESSAGES_ACCESS: true,
          MESSAGES_SEND: true,
          WALLET_ACCESS: true,
          WALLET_DEPOSIT: true,
          WALLET_WITHDRAW: true,
        },
      },
    });
  }),

  // ================================
  // ミューテーションハンドラー
  // ================================

  // ================================
  // 認証関連ミューテーション
  // ================================

  // Login mutation
  graphql.mutation('Login', ({ variables }) => {
    const _input = (variables as unknown)?.input as { email: string; password: string };

    return HttpResponse.json({
      data: {
        login: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Login successful',
          user: mockUser('user-1', 'testuser', 'Test User'),
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // Register mutation
  graphql.mutation('Register', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      username: string;
      email: string;
      password: string;
      displayName?: string;
      timezone?: string;
    };

    return HttpResponse.json({
      data: {
        register: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Registration successful',
          user: mockUser('user-new', input.username, input.displayName || input.username),
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // Logout mutation
  graphql.mutation('Logout', () => {
    return HttpResponse.json({
      data: {
        logout: {
          __typename: 'LogoutPayload',
          success: true,
          message: 'Logout successful',
        },
      },
    });
  }),

  // ================================
  // 投稿関連ミューテーション
  // ================================

  // CreatePost mutation
  graphql.mutation('CreatePost', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      content?: string;
      visibility?: string;
      mediaIds?: string[];
      price?: number;
    };

    // 画像付き投稿の場合はメディア情報を含める
    const media =
      input?.mediaIds?.map((mediaId, index) => ({
        __typename: 'Media',
        id: mediaId,
        filename: `test-image-${index + 1}.webp`,
        s3Key: `post/2025-01-01/test-${mediaId}.webp`,
        mimeType: 'image/webp',
        fileSize: 1024,
        width: 1200,
        height: 800,
        status: 'READY',
        url: `/api/media/${mediaId}`,
        thumbnailUrl: `/api/media/${mediaId}/thumb`,
        variants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: mockUser('user-1', 'testuser', 'Test User'),
        post: mockPost(99),
      })) || [];

    const created = {
      ...mockPost(99),
      id: `post-new-${Date.now()}`,
      content: input?.content ?? 'New Post',
      visibility: (input?.visibility as unknown) ?? 'PUBLIC',
      price: input?.price ?? null,
      media,
      likesCount: 0,
      commentsCount: 0,
      isLikedByCurrentUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createdPosts.push(created);

    return HttpResponse.json({
      data: {
        createPost: created,
      },
    });
  }),

  // UpdatePost mutation
  graphql.mutation('UpdatePost', ({ variables }) => {
    const { id, input } = variables as {
      id: string;
      input: { content?: string; visibility?: string; price?: number };
    };

    return HttpResponse.json({
      data: {
        updatePost: {
          ...mockPost(1),
          id,
          content: input.content || 'Updated post',
          visibility: input.visibility || 'PUBLIC',
          price: input.price || null,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // DeletePost mutation
  graphql.mutation('DeletePost', ({ variables }) => {
    const _id = (variables as unknown)?.id as string;
    if (id) deletedPostIds.add(id);

    return HttpResponse.json({
      data: {
        deletePost: true,
      },
    });
  }),

  // PurchasePost mutation
  graphql.mutation('PurchasePost', ({ variables }) => {
    const _input = (variables as unknown)?.input as { postId: string };

    return HttpResponse.json({
      data: {
        purchasePost: {
          __typename: 'PostPurchase',
          id: `purchase-${Date.now()}`,
          userId: 'user-1',
          postId: input.postId,
          price: 100,
          purchasedAt: new Date().toISOString(),
          expiresAt: null,
          isActive: true,
          user: mockUser('user-1', 'testuser', 'Test User'),
          post: mockPost(1),
        },
      },
    });
  }),

  // UpdatePostToPaid mutation
  graphql.mutation('UpdatePostToPaid', ({ variables }) => {
    const _input = (variables as unknown)?.input as { postId: string; price: number };

    return HttpResponse.json({
      data: {
        updatePostToPaid: {
          ...mockPost(1),
          id: input.postId,
          price: input.price,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // ================================
  // いいね関連ミューテーション
  // ================================

  // ToggleLike mutation
  graphql.mutation('ToggleLike', ({ variables }) => {
    const postId = (variables as unknown)?.postId as string;

    // いいね状態をトグル
    const currentState = postLikes.get(postId) || { count: 0, isLiked: false };
    const newState = {
      count: currentState.isLiked ? currentState.count - 1 : currentState.count + 1,
      isLiked: !currentState.isLiked,
    };
    postLikes.set(postId, newState);

    console.log('🔍 [MSW] ToggleLike:', { postId, oldState: currentState, newState });

    return HttpResponse.json({
      data: {
        toggleLike: {
          __typename: 'Post',
          id: postId,
          isLikedByCurrentUser: newState.isLiked,
          likesCount: newState.count,
        },
      },
    });
  }),

  // ToggleCommentLike mutation
  graphql.mutation('ToggleCommentLike', ({ variables }) => {
    const commentId = (variables as unknown)?.commentId as string;

    return HttpResponse.json({
      data: {
        toggleCommentLike: {
          __typename: 'Comment',
          id: commentId,
          isLikedByCurrentUser: true,
          likesCount: 1,
        },
      },
    });
  }),

  // ================================
  // コメント関連ミューテーション
  // ================================

  // CreateComment mutation
  graphql.mutation('CreateComment', ({ variables }) => {
    const _input = (variables as unknown)?.input as { postId: string; content: string };

    const comment = {
      ...mockComment(createdComments.length, input.postId),
      id: `comment-new-${Date.now()}`,
      content: input.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createdComments.push(comment);

    return HttpResponse.json({
      data: {
        createComment: comment,
      },
    });
  }),

  // DeleteComment mutation
  graphql.mutation('DeleteComment', ({ variables }) => {
    const _id = (variables as unknown)?.id as string;

    return HttpResponse.json({
      data: {
        deleteComment: true,
      },
    });
  }),

  // ================================
  // プロフィール関連ミューテーション
  // ================================

  // UpdateProfile mutation
  graphql.mutation('UpdateProfile', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      displayName?: string;
      bio?: string;
      coverImageId?: string;
    };

    return HttpResponse.json({
      data: {
        updateProfile: {
          ...mockUser('user-1', 'testuser', 'Test User'),
          displayName: input.displayName || 'Test User',
          bio: input.bio || 'Bio for Test User',
          coverImageId: input.coverImageId || null,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // ================================
  // フォロー関連ミューテーション
  // ================================

  // FollowUser mutation
  graphql.mutation('FollowUser', ({ variables }) => {
    const _userId = (variables as unknown)?.userId as string;

    // フォロー状態を更新
    if (!following.has('user-1')) {
      following.set('user-1', new Set());
    }
    following.get('user-1')!.add(userId);

    if (!followers.has(userId)) {
      followers.set(userId, new Set());
    }
    followers.get(userId)!.add('user-1');

    return HttpResponse.json({
      data: {
        followUser: {
          __typename: 'FollowPayload',
          success: true,
          message: 'Followed successfully',
          follow: {
            __typename: 'Follow',
            id: `follow-${Date.now()}`,
            follower: mockUser('user-1', 'testuser', 'Test User'),
            following: mockUser(userId, `user-${userId}`, `User ${userId}`),
            createdAt: new Date().toISOString(),
          },
        },
      },
    });
  }),

  // UnfollowUser mutation
  graphql.mutation('UnfollowUser', ({ variables }) => {
    const _userId = (variables as unknown)?.userId as string;

    // フォロー状態を更新
    following.get('user-1')?.delete(userId);
    followers.get(userId)?.delete('user-1');

    return HttpResponse.json({
      data: {
        unfollowUser: {
          __typename: 'UnfollowPayload',
          success: true,
          message: 'Unfollowed successfully',
        },
      },
    });
  }),

  // ================================
  // ユーザー設定関連ミューテーション
  // ================================

  // UpdateUserSettings mutation
  graphql.mutation('UpdateUserSettings', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      theme?: string;
      animationsEnabled?: boolean;
      locale?: string;
      contentFilter?: string;
      displayMode?: string;
      timezone?: string;
    };

    return HttpResponse.json({
      data: {
        updateUserSettings: {
          __typename: 'UserSettings',
          userId: 'user-1',
          theme: input.theme || 'light',
          animationsEnabled: input.animationsEnabled ?? true,
          locale: input.locale || 'ja',
          contentFilter: input.contentFilter || 'ALL',
          displayMode: input.displayMode || 'STANDARD',
          timezone: input.timezone || 'Asia/Tokyo',
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // ChangePassword mutation
  graphql.mutation('ChangePassword', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      currentPassword: string;
      newPassword: string;
    };

    return HttpResponse.json({
      data: {
        changePassword: {
          __typename: 'UserUpdatePayload',
          success: true,
          message: 'Password changed successfully',
          user: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // UpdateEmail mutation
  graphql.mutation('UpdateEmail', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      newEmail: string;
      password: string;
    };

    return HttpResponse.json({
      data: {
        updateEmail: {
          __typename: 'UserUpdatePayload',
          success: true,
          message: 'Email updated successfully',
          user: {
            ...mockUser('user-1', 'testuser', 'Test User'),
            email: input.newEmail,
          },
        },
      },
    });
  }),

  // ================================
  // 管理者用ユーザー管理ミューテーション
  // ================================

  // AdminUpdateUser mutation
  graphql.mutation('AdminUpdateUser', ({ variables }) => {
    const _input = (variables as unknown)?.input as Record<string, unknown>;

    return HttpResponse.json({
      data: {
        adminUpdateUser: {
          __typename: 'AdminUpdateUserPayload',
          success: true,
          message: 'User updated successfully',
          user: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // AdminDeleteUser mutation
  graphql.mutation('AdminDeleteUser', ({ variables }) => {
    const _userId = (variables as { userId?: string })?.userId;

    return HttpResponse.json({
      data: {
        adminDeleteUser: {
          __typename: 'AdminDeleteUserPayload',
          success: true,
          message: 'User deleted successfully',
        },
      },
    });
  }),

  // AdminChangeUserPassword mutation
  graphql.mutation('AdminChangeUserPassword', ({ variables }) => {
    const _input = (variables as unknown)?.input as Record<string, unknown>;

    return HttpResponse.json({
      data: {
        adminChangeUserPassword: {
          __typename: 'AdminChangeUserPasswordPayload',
          success: true,
          message: 'Password changed successfully',
        },
      },
    });
  }),

  // ResetDatabase mutation
  graphql.mutation('ResetDatabase', () => {
    return HttpResponse.json({
      data: {
        resetDatabase: {
          __typename: 'AdminResetResult',
          success: true,
          message: 'Database reset successfully',
        },
      },
    });
  }),

  // ================================
  // 通知関連ミューテーション
  // ================================

  // MarkNotificationAsRead mutation
  graphql.mutation('MarkNotificationAsRead', ({ variables }) => {
    const _id = (variables as unknown)?.id as string;
    const notification = notifications.find(n => n.id === id);

    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        markNotificationAsRead: notification || mockNotification(0),
      },
    });
  }),

  // MarkNotificationsAsRead mutation
  graphql.mutation('MarkNotificationsAsRead', ({ variables }) => {
    const ids = (variables as unknown)?.ids as string[];

    ids.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
    });

    return HttpResponse.json({
      data: {
        markNotificationsAsRead: notifications.filter(n => ids.includes(n.id)),
      },
    });
  }),

  // MarkAllNotificationsAsRead mutation
  graphql.mutation('MarkAllNotificationsAsRead', () => {
    const now = new Date().toISOString();
    notifications.forEach(n => {
      n.isRead = true;
      n.readAt = now;
    });

    return HttpResponse.json({
      data: {
        markAllNotificationsAsRead: notifications.length,
      },
    });
  }),

  // CreateTestNotification mutation
  graphql.mutation('CreateTestNotification', ({ variables }) => {
    const { userId, message } = variables as { userId: string; message?: string };

    const notification = {
      ...mockNotification(notifications.length),
      id: `notification-test-${Date.now()}`,
      content: message || 'Test notification',
      userId,
      createdAt: new Date().toISOString(),
    };

    notifications.push(notification);

    return HttpResponse.json({
      data: {
        createTestNotification: notification,
      },
    });
  }),

  // ================================
  // メディア関連ミューテーション
  // ================================

  // DeleteMedia mutation
  graphql.mutation('DeleteMedia', ({ variables }) => {
    const _id = (variables as unknown)?.id as string;

    return HttpResponse.json({
      data: {
        deleteMedia: true,
      },
    });
  }),

  // UploadMediaUnified mutation
  graphql.mutation('UploadMediaUnified', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      filename?: string;
      contentType?: string;
      size?: number;
      mediaType?: string;
      fileData?: string;
    };

    const mediaId = `media-${Date.now()}`;
    return HttpResponse.json({
      data: {
        uploadMediaUnified: {
          __typename: 'UnifiedUploadResponse',
          success: true,
          mediaId,
          filename: input?.filename ?? 'test-image.webp',
          contentType: input?.contentType ?? 'image/webp',
          size: input?.size ?? 1024,
          downloadUrl: `/api/media/${mediaId}`,
          status: 'READY',
          message: 'アップロード完了',
        },
      },
    });
  }),

  // ================================
  // 管理者機能ミューテーション
  // ================================

  // ResetPosts mutation
  graphql.mutation('ResetPosts', () => {
    return HttpResponse.json({
      data: {
        resetPosts: {
          __typename: 'AdminResetResult',
          success: true,
          message: 'Posts reset successfully',
        },
      },
    });
  }),

  // ResetPostsAndMedia mutation
  graphql.mutation('ResetPostsAndMedia', () => {
    return HttpResponse.json({
      data: {
        resetPostsAndMedia: {
          __typename: 'AdminResetResult',
          success: true,
          message: 'Posts and media reset successfully',
        },
      },
    });
  }),

  // GetSystemStats mutation
  graphql.mutation('GetSystemStats', () => {
    return HttpResponse.json({
      data: {
        getSystemStats: {
          __typename: 'SystemStats',
          totalUsers: 100,
          activeUsers: 50,
          totalPosts: 500,
          totalComments: 1000,
        },
      },
    });
  }),

  // InvalidateUserCache mutation
  graphql.mutation('InvalidateUserCache', ({ variables }) => {
    const _userId = (variables as unknown)?.userId as string;

    return HttpResponse.json({
      data: {
        invalidateUserCache: true,
      },
    });
  }),

  // ================================
  // ウォレット関連ミューテーション
  // ================================

  // CreateDepositRequest mutation
  graphql.mutation('CreateDepositRequest', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      requestedUsdAmount: number;
      currency: string;
      network: string;
      userWalletAddress: string;
    };

    const request = {
      __typename: 'DepositRequest',
      id: `deposit-${Date.now()}`,
      userId: 'user-1',
      requestedUsdAmount: input.requestedUsdAmount,
      currency: input.currency,
      network: input.network,
      expectedCryptoAmount: input.requestedUsdAmount * 150,
      exchangeRate: 150,
      ourDepositAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      user: mockUser('user-1', 'testuser', 'Test User'),
      walletTransactions: [],
    };

    depositRequests.push(request);

    return HttpResponse.json({
      data: {
        createDepositRequest: request,
      },
    });
  }),

  // CreateWithdrawalRequest mutation
  graphql.mutation('CreateWithdrawalRequest', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      currency: string;
      amount: number;
      destinationAddress: string;
      memo?: string;
      network: string;
    };

    const request = {
      __typename: 'WithdrawalRequest',
      id: `withdrawal-${Date.now()}`,
      userId: 'user-1',
      currency: input.currency,
      amount: input.amount,
      amountUsd: input.amount * 0.0067,
      destinationAddress: input.destinationAddress,
      memo: input.memo || null,
      network: input.network,
      status: 'PENDING',
      errorMessage: null,
      processedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: mockUser('user-1', 'testuser', 'Test User'),
      walletTransactions: [],
    };

    withdrawalRequests.push(request);

    return HttpResponse.json({
      data: {
        createWithdrawalRequest: request,
      },
    });
  }),

  // RegisterUserWallet mutation
  graphql.mutation('RegisterUserWallet', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      walletName: string;
      currency: string;
      network: string;
      address: string;
    };

    return HttpResponse.json({
      data: {
        registerUserWallet: {
          __typename: 'UserWallet',
          id: `user-wallet-${Date.now()}`,
          userId: 'user-1',
          walletName: input.walletName,
          currency: input.currency,
          network: input.network,
          address: input.address,
          isVerified: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // ================================
  // メッセージ関連ミューテーション
  // ================================

  // SendMessage mutation
  graphql.mutation('SendMessage', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId?: string;
      recipientId?: string;
      content: string;
    };

    return HttpResponse.json({
      data: {
        sendMessage: {
          __typename: 'SendMessagePayload',
          success: true,
          message: {
            __typename: 'Message',
            id: `message-${Date.now()}`,
            conversationId: input.conversationId || 'conversation-1',
            senderId: 'user-1',
            content: input.content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: mockUser('user-1', 'testuser', 'Test User'),
          },
        },
      },
    });
  }),

  // CreateConversation mutation
  graphql.mutation('CreateConversation', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      participantIds: string[];
      name?: string;
    };

    return HttpResponse.json({
      data: {
        createConversation: {
          __typename: 'CreateConversationPayload',
          success: true,
          conversation: {
            __typename: 'Conversation',
            id: `conversation-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: input.participantIds.map(id => mockUser(id, `user-${id}`, `User ${id}`)),
            messages: [],
          },
        },
      },
    });
  }),

  // MarkAsRead mutation
  graphql.mutation('MarkAsRead', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId: string;
      messageId?: string;
    };

    return HttpResponse.json({
      data: {
        markAsRead: {
          __typename: 'MarkAsReadPayload',
          success: true,
          conversation: {
            __typename: 'Conversation',
            id: input.conversationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: [],
            messages: [],
          },
        },
      },
    });
  }),

  // UpdateConversation mutation
  graphql.mutation('UpdateConversation', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId: string;
      name?: string;
      isArchived?: boolean;
    };

    return HttpResponse.json({
      data: {
        updateConversation: {
          __typename: 'UpdateConversationPayload',
          success: true,
          conversation: {
            __typename: 'Conversation',
            id: input.conversationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: [],
            messages: [],
          },
        },
      },
    });
  }),

  // AddParticipant mutation
  graphql.mutation('AddParticipant', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId: string;
      userId: string;
    };

    return HttpResponse.json({
      data: {
        addParticipant: {
          __typename: 'AddParticipantPayload',
          success: true,
          participant: {
            __typename: 'ConversationParticipant',
            id: `participant-${Date.now()}`,
            conversationId: input.conversationId,
            userId: input.userId,
            joinedAt: new Date().toISOString(),
            user: mockUser(input.userId, `user-${input.userId}`, `User ${input.userId}`),
          },
        },
      },
    });
  }),

  // RemoveParticipant mutation
  graphql.mutation('RemoveParticipant', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId: string;
      userId: string;
    };

    return HttpResponse.json({
      data: {
        removeParticipant: {
          __typename: 'RemoveParticipantPayload',
          success: true,
          message: 'Participant removed successfully',
        },
      },
    });
  }),

  // MuteConversation mutation
  graphql.mutation('MuteConversation', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      conversationId: string;
      isMuted: boolean;
    };

    return HttpResponse.json({
      data: {
        muteConversation: {
          __typename: 'MuteConversationPayload',
          success: true,
          conversation: {
            __typename: 'Conversation',
            id: input.conversationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: [],
            messages: [],
          },
        },
      },
    });
  }),

  // DeleteMessage mutation
  graphql.mutation('DeleteMessage', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      messageId: string;
    };

    return HttpResponse.json({
      data: {
        deleteMessage: {
          __typename: 'DeleteMessagePayload',
          success: true,
          message: 'Message deleted successfully',
        },
      },
    });
  }),

  // HideMessage mutation
  graphql.mutation('HideMessage', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      messageId: string;
    };

    return HttpResponse.json({
      data: {
        hideMessage: {
          __typename: 'HideMessagePayload',
          success: true,
          message: 'Message hidden successfully',
        },
      },
    });
  }),

  // ================================
  // サイト機能関連ミューテーション
  // ================================

  // UpdateSiteFeature mutation
  graphql.mutation('UpdateSiteFeature', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      featureName: string;
      isEnabled: boolean;
      description?: string;
    };

    return HttpResponse.json({
      data: {
        updateSiteFeature: {
          __typename: 'SiteFeatureSetting',
          id: `feature-${input.featureName}`,
          featureName: input.featureName,
          isEnabled: input.isEnabled,
          description: input.description || `Feature ${input.featureName}`,
          updatedBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedByUser: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // UpdateUserFeaturePermission mutation
  graphql.mutation('UpdateUserFeaturePermission', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      userId: string;
      featureName: string;
      isEnabled: boolean;
      expiresAt?: string;
    };

    return HttpResponse.json({
      data: {
        updateUserFeaturePermission: {
          __typename: 'UserFeaturePermission',
          id: `permission-${Date.now()}`,
          userId: input.userId,
          featureName: input.featureName,
          isEnabled: input.isEnabled,
          grantedBy: 'user-1',
          grantedAt: new Date().toISOString(),
          expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: mockUser(input.userId, `user-${input.userId}`, `User ${input.userId}`),
          grantedByUser: mockUser('user-1', 'testuser', 'Test User'),
        },
      },
    });
  }),

  // RevokeUserFeaturePermission mutation
  graphql.mutation('RevokeUserFeaturePermission', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      userId: string;
      featureName: string;
    };

    return HttpResponse.json({
      data: {
        revokeUserFeaturePermission: true,
      },
    });
  }),

  // ================================
  // 2FA関連ミューテーション
  // ================================

  // SetupTwoFactor mutation
  graphql.mutation('SetupTwoFactor', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      password: string;
    };

    return HttpResponse.json({
      data: {
        setupTwoFactor: {
          __typename: 'TwoFactorSetupData',
          secret: twoFactorSecret,
          qrCodeUrl: `otpauth://totp/LibArk:testuser@example.com?secret=${twoFactorSecret}&issuer=LibArk`,
          manualEntryKey: twoFactorSecret,
        },
      },
    });
  }),

  // EnableTwoFactor mutation
  graphql.mutation('EnableTwoFactor', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      totpCode: string;
      password: string;
    };

    twoFactorEnabled = true;

    return HttpResponse.json({
      data: {
        enableTwoFactor: {
          __typename: 'TwoFactorEnableResult',
          success: true,
          message: 'Two-factor authentication enabled successfully',
          backupCodes: {
            __typename: 'BackupCodes',
            codes: backupCodes,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    });
  }),

  // DisableTwoFactor mutation
  graphql.mutation('DisableTwoFactor', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      password: string;
      code: string;
    };

    twoFactorEnabled = false;

    return HttpResponse.json({
      data: {
        disableTwoFactor: {
          __typename: 'TwoFactorDisableResult',
          success: true,
          message: 'Two-factor authentication disabled successfully',
        },
      },
    });
  }),

  // RegenerateBackupCodes mutation
  graphql.mutation('RegenerateBackupCodes', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      password: string;
      totpCode: string;
    };

    const newBackupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    backupCodes.splice(0, backupCodes.length, ...newBackupCodes);

    return HttpResponse.json({
      data: {
        regenerateBackupCodes: {
          __typename: 'BackupCodes',
          codes: backupCodes,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // LoginWithTwoFactor mutation
  graphql.mutation('LoginWithTwoFactor', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      tempUserId: string;
      code: string;
    };

    return HttpResponse.json({
      data: {
        loginWithTwoFactor: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Login successful',
          user: mockUser('user-1', 'testuser', 'Test User'),
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // ================================
  // P2P関連ミューテーション
  // ================================

  // CreateP2PTradeRequest mutation
  graphql.mutation('CreateP2PTradeRequest', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      offerId: string;
      amountUsd: number;
    };

    const trade = {
      ...mockP2PTrade(p2pTrades.length),
      id: `trade-${Date.now()}`,
      offerId: input.offerId,
      amountUsd: input.amountUsd,
      fiatAmount: input.amountUsd * 150,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    p2pTrades.push(trade);

    return HttpResponse.json({
      data: {
        createP2PTradeRequest: trade,
      },
    });
  }),

  // CancelP2PTradeRequest mutation
  graphql.mutation('CancelP2PTradeRequest', ({ variables }) => {
    const tradeId = (variables as unknown)?.tradeId as string;
    const trade = p2pTrades.find(t => t.id === tradeId);

    if (trade) {
      trade.status = 'CANCELLED';
      trade.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        cancelP2PTradeRequest: true,
      },
    });
  }),

  // MarkP2PPaymentSent mutation
  graphql.mutation('MarkP2PPaymentSent', ({ variables }) => {
    const tradeId = (variables as unknown)?.tradeId as string;
    const trade = p2pTrades.find(t => t.id === tradeId);

    if (trade) {
      trade.status = 'PAYMENT_SENT';
      trade.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        markP2PPaymentSent: trade || mockP2PTrade(0),
      },
    });
  }),

  // CreateP2POffer mutation
  graphql.mutation('CreateP2POffer', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      paymentMethod: string;
      minAmountUsd: number;
      maxAmountUsd: number;
      fiatCurrency: string;
      exchangeRateMargin: number;
      instructions?: string;
      priority?: number;
    };

    const offer = {
      __typename: 'P2POffer',
      id: `offer-${Date.now()}`,
      sellerId: 'user-1',
      paymentMethod: input.paymentMethod,
      minAmountUsd: input.minAmountUsd,
      maxAmountUsd: input.maxAmountUsd,
      fiatCurrency: input.fiatCurrency,
      exchangeRateMargin: input.exchangeRateMargin,
      isActive: true,
      instructions: input.instructions || '',
      priority: input.priority || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seller: mockUser('user-1', 'testuser', 'Test User'),
    };

    p2pOffers.push(offer);

    return HttpResponse.json({
      data: {
        createP2POffer: offer,
      },
    });
  }),

  // UpdateP2POffer mutation
  graphql.mutation('UpdateP2POffer', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      offerId: string;
      minAmountUsd?: number;
      maxAmountUsd?: number;
      exchangeRateMargin?: number;
      isActive?: boolean;
      instructions?: string;
      priority?: number;
    };

    const offer = p2pOffers.find(o => o.id === input.offerId);

    if (offer) {
      if (input.minAmountUsd !== undefined) offer.minAmountUsd = input.minAmountUsd;
      if (input.maxAmountUsd !== undefined) offer.maxAmountUsd = input.maxAmountUsd;
      if (input.exchangeRateMargin !== undefined)
        offer.exchangeRateMargin = input.exchangeRateMargin;
      if (input.isActive !== undefined) offer.isActive = input.isActive;
      if (input.instructions !== undefined) offer.instructions = input.instructions;
      if (input.priority !== undefined) offer.priority = input.priority;
      offer.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        updateP2POffer: offer || mockP2POffer(0),
      },
    });
  }),

  // DeleteP2POffer mutation
  graphql.mutation('DeleteP2POffer', ({ variables }) => {
    const offerId = (variables as unknown)?.offerId as string;
    const index = p2pOffers.findIndex(o => o.id === offerId);

    if (index !== -1) {
      p2pOffers.splice(index, 1);
    }

    return HttpResponse.json({
      data: {
        deleteP2POffer: true,
      },
    });
  }),

  // AcceptP2PTradeRequest mutation
  graphql.mutation('AcceptP2PTradeRequest', ({ variables }) => {
    const tradeId = (variables as unknown)?.tradeId as string;
    const trade = p2pTrades.find(t => t.id === tradeId);

    if (trade) {
      trade.status = 'MATCHED';
      trade.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        acceptP2PTradeRequest: trade || mockP2PTrade(0),
      },
    });
  }),

  // ConfirmP2PPaymentReceived mutation
  graphql.mutation('ConfirmP2PPaymentReceived', ({ variables }) => {
    const _input = (variables as unknown)?.input as {
      tradeId: string;
      paymentDetails: string;
    };

    const trade = p2pTrades.find(t => t.id === input.tradeId);

    if (trade) {
      trade.status = 'COMPLETED';
      trade.paymentDetails = input.paymentDetails;
      trade.completedAt = new Date().toISOString();
      trade.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      data: {
        confirmP2PPaymentReceived: trade || mockP2PTrade(0),
      },
    });
  }),

  // ================================
  // エラーハンドラー（テスト用）
  // ================================

  // TimelineError query (エラーレスポンス用)
  graphql.query('TimelineError', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Network error occurred',
          extensions: {
            code: 'NETWORK_ERROR',
          },
        },
      ],
    });
  }),
];
