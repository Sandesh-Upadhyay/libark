import { graphql, HttpResponse, delay } from 'msw';

/**
 * エラーシナリオ用のMSWハンドラー
 * 各種エラー状態をシミュレートするためのハンドラー
 */

// ================================
// エラーハンドラー
// ================================

export const errorHandlers = [
  // ================================
  // 認証エラー
  // ================================

  // Login with invalid credentials
  graphql.mutation('Login', ({ variables }) => {
    const input = (variables as any)?.input as { email: string; password: string };

    // 特定のメールアドレスで認証エラーをシミュレート
    if (input.email === 'invalid@example.com') {
      return HttpResponse.json({
        errors: [
          {
            message: 'Invalid email or password',
            extensions: {
              code: 'AUTHENTICATION_FAILED',
            },
          },
        ],
      });
    }

    // デフォルトの成功レスポンス
    return HttpResponse.json({
      data: {
        login: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Login successful',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: input.email,
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // ================================
  // 権限エラー
  // ================================

  // Delete post without permission
  graphql.mutation('DeletePost', ({ variables }) => {
    const id = (variables as any)?.id as string;

    // 特定の投稿IDで権限エラーをシミュレート
    if (id === 'post-forbidden') {
      return HttpResponse.json({
        errors: [
          {
            message: 'You do not have permission to delete this post',
            extensions: {
              code: 'FORBIDDEN',
            },
          },
        ],
      });
    }

    return HttpResponse.json({
      data: {
        deletePost: true,
      },
    });
  }),

  // Update post without permission
  graphql.mutation('UpdatePost', ({ variables }) => {
    const { id } = variables as any as { id: string };

    if (id === 'post-forbidden') {
      return HttpResponse.json({
        errors: [
          {
            message: 'You do not have permission to update this post',
            extensions: {
              code: 'FORBIDDEN',
            },
          },
        ],
      });
    }

    return HttpResponse.json({
      data: {
        updatePost: {
          __typename: 'Post',
          id,
          content: 'Updated post',
          visibility: 'PUBLIC',
          isDeleted: false,
          isProcessing: false,
          price: null,
          paidAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user-1',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: 'testuser@example.com',
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          media: [],
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLikedByCurrentUser: false,
          isPurchasedByCurrentUser: false,
        },
      },
    });
  }),

  // ================================
  // バリデーションエラー
  // ================================

  // Register with invalid data
  graphql.mutation('Register', ({ variables }) => {
    const input = (variables as any)?.input as {
      username: string;
      email: string;
      password: string;
      displayName?: string;
      timezone?: string;
    };

    const errors: any[] = [];

    // バリデーションエラーをシミュレート
    if (input.username.length < 3) {
      errors.push({
        message: 'Username must be at least 3 characters long',
        extensions: {
          code: 'VALIDATION_ERROR',
          field: 'username',
        },
      });
    }

    if (!input.email.includes('@')) {
      errors.push({
        message: 'Invalid email format',
        extensions: {
          code: 'VALIDATION_ERROR',
          field: 'email',
        },
      });
    }

    if (input.password.length < 8) {
      errors.push({
        message: 'Password must be at least 8 characters long',
        extensions: {
          code: 'VALIDATION_ERROR',
          field: 'password',
        },
      });
    }

    if (errors.length > 0) {
      return HttpResponse.json({
        errors,
      });
    }

    // 成功レスポンス
    return HttpResponse.json({
      data: {
        register: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Registration successful',
          user: {
            __typename: 'User',
            id: 'user-new',
            username: input.username,
            email: input.email,
            displayName: input.displayName || input.username,
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // Create post with invalid data
  graphql.mutation('CreatePost', ({ variables }) => {
    const input = (variables as any)?.input as {
      content?: string;
      visibility?: string;
      mediaIds?: string[];
      price?: number;
    };

    const errors: any[] = [];

    // バリデーションエラーをシミュレート
    if (input.content && input.content.length > 5000) {
      errors.push({
        message: 'Content must be less than 5000 characters',
        extensions: {
          code: 'VALIDATION_ERROR',
          field: 'content',
        },
      });
    }

    if (input.price !== undefined && input.price < 0) {
      errors.push({
        message: 'Price must be greater than or equal to 0',
        extensions: {
          code: 'VALIDATION_ERROR',
          field: 'price',
        },
      });
    }

    if (errors.length > 0) {
      return HttpResponse.json({
        errors,
      });
    }

    // 成功レスポンス
    return HttpResponse.json({
      data: {
        createPost: {
          __typename: 'Post',
          id: `post-new-${Date.now()}`,
          content: input.content ?? 'New Post',
          visibility: input.visibility ?? 'PUBLIC',
          isDeleted: false,
          isProcessing: false,
          price: input.price ?? null,
          paidAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user-1',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: 'testuser@example.com',
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          media: [],
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLikedByCurrentUser: false,
          isPurchasedByCurrentUser: false,
        },
      },
    });
  }),

  // ================================
  // データベースエラー
  // ================================

  // Query with database error
  graphql.query('Timeline', async ({ variables }) => {
    const { type } = variables as any as { type: string };

    // 特定のタイプでデータベースエラーをシミュレート
    if (type === 'ERROR') {
      await delay(100);

      return HttpResponse.json({
        errors: [
          {
            message: 'Database connection failed',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              type: 'DATABASE_ERROR',
            },
          },
        ],
      });
    }

    // 成功レスポンス
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

  // ================================
  // ネットワークエラー
  // ================================

  // Query with network error
  graphql.query('Posts', async ({ variables }) => {
    const { userId } = variables as any as { userId?: string };

    // 特定のユーザーIDでネットワークエラーをシミュレート
    if (userId === 'network-error') {
      await delay(100);

      return HttpResponse.json({
        errors: [
          {
            message: 'Network error occurred',
            extensions: {
              code: 'NETWORK_ERROR',
              type: 'NETWORK_ERROR',
            },
          },
        ],
      });
    }

    // 成功レスポンス
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

  // ================================
  // タイムアウトエラー
  // ================================

  // Query with timeout
  graphql.query('Notifications', async ({ variables }) => {
    const { first } = variables as any as { first?: number };

    // 特定のページサイズでタイムアウトをシミュレート
    if (first === 999) {
      await delay(30000); // 30秒待機（タイムアウト）

      return HttpResponse.json({
        errors: [
          {
            message: 'Request timeout',
            extensions: {
              code: 'REQUEST_TIMEOUT',
              type: 'TIMEOUT_ERROR',
            },
          },
        ],
      });
    }

    // 成功レスポンス
    return HttpResponse.json({
      data: {
        notifications: [],
      },
    });
  }),

  // ================================
  // レート制限エラー
  // ================================

  // Mutation with rate limit
  graphql.mutation('CreatePost', async ({ variables }) => {
    const input = (variables as any)?.input as {
      content?: string;
    };

    // 特定のコンテンツでレート制限をシミュレート
    if (input.content === 'rate-limit-me') {
      await delay(100);

      return HttpResponse.json({
        errors: [
          {
            message: 'Too many requests. Please try again later.',
            extensions: {
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: 60,
            },
          },
        ],
      });
    }

    // 成功レスポンス（デフォルトのハンドラーが処理）
    return HttpResponse.json({
      data: {
        createPost: {
          __typename: 'Post',
          id: `post-new-${Date.now()}`,
          content: input.content ?? 'New Post',
          visibility: 'PUBLIC',
          isDeleted: false,
          isProcessing: false,
          price: null,
          paidAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user-1',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: 'testuser@example.com',
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          media: [],
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLikedByCurrentUser: false,
          isPurchasedByCurrentUser: false,
        },
      },
    });
  }),

  // ================================
  // リソースが見つからないエラー
  // ================================

  // Query non-existent post
  graphql.query('Post', ({ variables }) => {
    const { id } = variables as any as { id: string };

    // 特定のIDでリソースが見つからないエラーをシミュレート
    if (id === 'post-not-found') {
      return HttpResponse.json({
        errors: [
          {
            message: 'Post not found',
            extensions: {
              code: 'NOT_FOUND',
              resource: 'Post',
            },
          },
        ],
      });
    }

    // 成功レスポンス
    return HttpResponse.json({
      data: {
        post: {
          __typename: 'Post',
          id,
          content: 'Mock Post',
          visibility: 'PUBLIC',
          isDeleted: false,
          isProcessing: false,
          price: null,
          paidAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user-1',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: 'testuser@example.com',
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          media: [],
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLikedByCurrentUser: false,
          isPurchasedByCurrentUser: false,
        },
      },
    });
  }),

  // ================================
  // 重複エラー
  // ================================

  // Register with existing email
  graphql.mutation('Register', ({ variables }) => {
    const input = (variables as any)?.input as {
      username: string;
      email: string;
      password: string;
    };

    // 特定のメールアドレスで重複エラーをシミュレート
    if (input.email === 'existing@example.com') {
      return HttpResponse.json({
        errors: [
          {
            message: 'Email already registered',
            extensions: {
              code: 'DUPLICATE_ENTRY',
              field: 'email',
            },
          },
        ],
      });
    }

    // 成功レスポンス（デフォルトのハンドラーが処理）
    return HttpResponse.json({
      data: {
        register: {
          __typename: 'AuthPayload',
          success: true,
          message: 'Registration successful',
          user: {
            __typename: 'User',
            id: 'user-new',
            username: input.username,
            email: input.email,
            displayName: input.username,
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          accessToken: 'mock-access-token',
          requiresTwoFactor: false,
          tempUserId: null,
        },
      },
    });
  }),

  // ================================
  // 機能が無効化されているエラー
  // ================================

  // Create post when feature is disabled
  graphql.mutation('CreatePost', async ({ variables }) => {
    const input = (variables as any)?.input as {
      content?: string;
    };

    // 特定のコンテンツで機能無効化エラーをシミュレート
    if (input.content === 'feature-disabled') {
      await delay(100);

      return HttpResponse.json({
        errors: [
          {
            message: 'Post creation is currently disabled',
            extensions: {
              code: 'FEATURE_DISABLED',
              feature: 'POST_CREATE',
            },
          },
        ],
      });
    }

    // 成功レスポンス（デフォルトのハンドラーが処理）
    return HttpResponse.json({
      data: {
        createPost: {
          __typename: 'Post',
          id: `post-new-${Date.now()}`,
          content: input.content ?? 'New Post',
          visibility: 'PUBLIC',
          isDeleted: false,
          isProcessing: false,
          price: null,
          paidAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'user-1',
          user: {
            __typename: 'User',
            id: 'user-1',
            username: 'testuser',
            email: 'testuser@example.com',
            displayName: 'Test User',
            bio: null,
            profileImageId: null,
            coverImageId: null,
            isVerified: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            role: {
              __typename: 'Role',
              id: 'role-user',
              name: 'USER',
              description: 'Standard user role',
            },
          },
          media: [],
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLikedByCurrentUser: false,
          isPurchasedByCurrentUser: false,
        },
      },
    });
  }),
];

/**
 * エラーシナリオを有効化するためのヘルパー関数
 * テストで特定のエラーシナリオをテストする場合に使用
 */
export function getErrorHandlers() {
  return errorHandlers;
}
