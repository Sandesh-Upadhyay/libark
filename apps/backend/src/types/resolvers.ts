/**
 * 🎯 GraphQLリゾルバー型定義
 *
 * リゾルバーで使用される型定義を集約
 */

import type { User, Post, Comment, Media, Notification } from '@libark/db';

// 認証関連の型定義
export interface AuthPayload {
  user: Pick<
    User,
    'id' | 'username' | 'displayName' | 'email' | 'profileImageId' | 'createdAt'
  > | null;
  success: boolean;
  message: string;
}

// GraphQLリゾルバーの親オブジェクト型定義
export type UserParent = User;
export type PostParent = Post & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'profileImageId'>;
  media?: Media[];
  _count?: {
    likes: number;
    comments: number;
  };
};
export type CommentParent = Comment & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'profileImageId'>;
};
export type MediaParent = Media;
export type NotificationParent = Notification;

// ユーザー関連の型定義
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateEmailInput {
  newEmail: string;
  password: string;
}

export interface UserSettingsUpdateInput {
  displayName?: string;
  bio?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface UsersQueryArgs {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
}

// その他の共通型定義
export interface PaginationArgs {
  limit?: number;
  offset?: number;
}

// メディア関連の型定義（責任分離対応）
export interface ProxyUploadInput {
  filename: string;
  contentType: string;
  size: number;
  mediaType: 'POST' | 'AVATAR' | 'COVER' | 'OGP';
  fileData: string; // Base64エンコードされたファイルデータ
}

export interface ProxyUploadResponse {
  success: boolean;
  mediaId: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  encrypted: boolean;
}

export interface SearchArgs {
  query?: string;
}

// 投稿関連の型定義
export interface PostCreateInput {
  content?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID';
  mediaIds?: string[];
  price?: number;
}

export interface PostUpdateInput {
  content?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID';
  price?: number;
}

export interface PurchasePostInput {
  postId: string;
}

export interface UpdatePostToPaidInput {
  postId: string;
  price: number;
}

export interface PostsArgs {
  first?: number;
  after?: string;
  userId?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY';
  includeProcessing?: boolean;
}
