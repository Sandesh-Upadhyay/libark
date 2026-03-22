/**
 * Post関係のユーティリティ関数
 */

import type { PostInfoFragment } from '@libark/graphql-client';

import type { PostListFilters } from '@/features/posts/types';

/**
 * 投稿データの変換とフィルタリング
 */
export function filterAndTransformPosts(posts: PostInfoFragment[]) {
  const validPosts = posts.filter((post): post is PostInfoFragment => {
    return post && typeof post === 'object' && 'id' in post;
  });

  const keys = validPosts.map((post, index) => `${post.id}-${index}`);

  return { validPosts, keys };
}

/**
 * 投稿の削除ハンドラーマップを生成
 */
export function generateDeleteHandlers(
  posts: PostInfoFragment[],
  currentUserId?: string,
  onDeleteRequest?: (postId: string) => void
) {
  const handlers = new Map<string, (() => void) | undefined>();

  posts.forEach(post => {
    if (post && currentUserId && post.user.id === currentUserId && onDeleteRequest) {
      handlers.set(post.id, () => onDeleteRequest(post.id));
    } else {
      handlers.set(post.id, undefined);
    }
  });

  return handlers;
}

/**
 * 投稿の表示用データを準備
 */
export function preparePostDisplayData(post: PostInfoFragment) {
  return {
    id: post.id,
    content: post.content,
    user: post.user,
    createdAt: post.createdAt,
    visibility: post.visibility,
    media: post.media || [],
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    isLikedByCurrentUser: post.isLikedByCurrentUser || false,
  };
}

/**
 * 投稿リストのフィルター条件を正規化
 */
export function normalizePostListFilters(filters: Partial<PostListFilters>): PostListFilters {
  return {
    type: filters.type || 'all',
    timelineType: filters.timelineType || 'ALL',
    userId: filters.userId,
    visibility: filters.visibility,
    limit: filters.limit || 20,
  };
}

/**
 * 投稿の内容を切り詰める
 */
export function truncatePostContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '...';
}

/**
 * 投稿の統計情報をフォーマット
 */
export function formatPostStats(likesCount: number, commentsCount: number) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return {
    likes: formatCount(likesCount),
    comments: formatCount(commentsCount),
  };
}

/**
 * 投稿の作成日時を相対時間でフォーマット
 */
export function formatPostTime(createdAt: string): string {
  const now = new Date();
  const postTime = new Date(createdAt);
  const diffMs = now.getTime() - postTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'たった今';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  }
  if (diffHours < 24) {
    return `${diffHours}時間前`;
  }
  if (diffDays < 7) {
    return `${diffDays}日前`;
  }

  return postTime.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
