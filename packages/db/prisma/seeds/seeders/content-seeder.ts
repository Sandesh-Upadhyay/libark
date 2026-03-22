/**
 * コンテンツ関連シーダー
 * 投稿、コメント、いいね、通知の作成を担当
 */

import { PrismaClient } from '@prisma/client';

import type { User, Post, Comment, Like, SeedResult } from '../utils/types';
import { samplePosts, postConfig } from '../data/posts';
import { sampleComments, commentConfig } from '../data/comments';
import {
  getRandomElement,
  getRandomDate,
  getRandomDateInRange,
  getRandomBoolean,
  getRandomInt,
} from '../utils/random';
import { logProgress } from '../utils/database';

/**
 * 投稿を作成
 */
export async function createPosts(prisma: PrismaClient, users: User[]): Promise<Post[]> {
  console.log('投稿を作成しています...');
  const posts: Post[] = [];

  for (let i = 0; i < postConfig.totalPosts; i++) {
    const user = getRandomElement(users);
    const content = getRandomElement(samplePosts);
    const createdAt = getRandomDate();

    // 設定された確率でPaid投稿を作成
    const isPaidPost = getRandomBoolean(postConfig.paidPostProbability);
    const visibility = isPaidPost ? 'PAID' : 'PUBLIC';
    const price = isPaidPost ? getRandomInt(postConfig.minPrice, postConfig.maxPrice) : null;

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content,
        isProcessing: false, // 処理完了済みとして作成
        visibility,
        price,
        createdAt,
        updatedAt: createdAt,
      },
    });

    posts.push(post);
    logProgress(i + 1, postConfig.totalPosts, '投稿');
  }

  console.log(`${posts.length} 件の投稿を作成しました`);
  return posts;
}

/**
 * コメントを作成
 */
export async function createComments(
  prisma: PrismaClient,
  users: User[],
  posts: Post[]
): Promise<Comment[]> {
  console.log('コメントを作成しています...');
  const comments: Comment[] = [];

  for (let i = 0; i < commentConfig.totalComments; i++) {
    const user = getRandomElement(users);
    const post = getRandomElement(posts);
    const content = getRandomElement(sampleComments);

    // 投稿作成日以降のランダムな日時
    const createdAt = getRandomDateInRange(post.createdAt, new Date());

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        postId: post.id,
        content,
        createdAt,
        updatedAt: createdAt,
      },
    });

    comments.push(comment);
    logProgress(i + 1, commentConfig.totalComments, 'コメント');
  }

  console.log(`${comments.length} 件のコメントを作成しました`);
  return comments;
}

/**
 * いいねを作成
 */
export async function createLikes(
  prisma: PrismaClient,
  users: User[],
  posts: Post[]
): Promise<Like[]> {
  console.log('いいねを作成しています...');
  const likes: Like[] = [];

  // 各投稿に対してランダムにいいねを作成（重複を避ける）
  for (const post of posts) {
    const likeCount = getRandomInt(0, commentConfig.maxCommentsPerPost);
    const likedUsers = new Set<string>();

    for (let i = 0; i < likeCount; i++) {
      let user;
      let attempts = 0;

      // 同じユーザーが同じ投稿に複数回いいねしないようにする
      do {
        user = getRandomElement(users);
        attempts++;
      } while (likedUsers.has(user.id) && attempts < 10);

      if (!likedUsers.has(user.id)) {
        likedUsers.add(user.id);

        // 投稿作成日以降のランダムな日時
        const createdAt = getRandomDateInRange(post.createdAt, new Date());

        const like = await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
            createdAt,
          },
        });

        likes.push(like);
      }
    }
  }

  console.log(`${likes.length} 件のいいねを作成しました`);
  return likes;
}

/**
 * 通知を作成
 */
export async function createNotifications(
  prisma: PrismaClient,
  users: User[],
  posts: Post[],
  comments: Comment[],
  likes: Like[]
): Promise<any[]> {
  console.log('通知を作成しています...');
  const notifications: unknown[] = [];

  // コメント通知を作成
  for (const comment of comments) {
    const post = posts.find(p => p.id === comment.postId);
    const commenter = users.find(u => u.id === comment.userId);

    if (post && post.userId !== comment.userId) {
      // 自分のコメントには通知しない
      const notification = await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'COMMENT',
          actorId: comment.userId,
          referenceId: post.id,
          content: commenter
            ? `@${commenter.username}さんがあなたの投稿にコメントしました`
            : '誰かがあなたの投稿にコメントしました',
          createdAt: new Date(comment.createdAt.getTime() + getRandomInt(0, 5000)), // 0-5秒後
        },
      });
      notifications.push(notification);
    }
  }

  // いいね通知を作成
  for (const like of likes) {
    const post = posts.find(p => p.id === like.postId);
    const liker = users.find(u => u.id === like.userId);

    if (post && post.userId !== like.userId) {
      // 自分のいいねには通知しない
      const notification = await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'LIKE',
          actorId: like.userId,
          referenceId: post.id,
          content: liker
            ? `@${liker.username}さんがあなたの投稿にいいねしました`
            : '誰かがあなたの投稿にいいねしました',
          createdAt: new Date(like.createdAt.getTime() + getRandomInt(0, 3000)), // 0-3秒後
        },
      });
      notifications.push(notification);
    }
  }

  // POST_PROCESSING_COMPLETED通知は削除済み
  // 理由: Postは即座に処理されるため、処理完了通知は不要

  // 一部の投稿に処理失敗通知を作成
  const failedPosts = posts.filter(() => getRandomBoolean(0.05)); // 5%の投稿のみ
  for (const post of failedPosts) {
    const notification = await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'POST_PROCESSING_FAILED',
        referenceId: post.id,
        content: '投稿の処理中にエラーが発生しました。再度お試しください',
        createdAt: new Date(post.createdAt.getTime() + getRandomInt(10000, 30000)), // 10-30秒後
      },
    });
    notifications.push(notification);
  }

  // ランダムに一部の通知を既読にする
  const readNotifications = notifications.filter(() => getRandomBoolean(0.4)); // 40%を既読に
  for (const notification of readNotifications) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: new Date(notification.createdAt.getTime() + getRandomInt(0, 86400000)), // 24時間以内
      },
    });
  }

  console.log(`${notifications.length} 件の通知を作成しました`);
  console.log(`  - 既読通知: ${readNotifications.length}件`);

  return notifications;
}

/**
 * コンテンツ関連のシード実行
 */
export async function seedContent(prisma: PrismaClient, users: User[]): Promise<SeedResult> {
  try {
    // 投稿を作成
    const posts = await createPosts(prisma, users);

    // コメントを作成
    const comments = await createComments(prisma, users, posts);

    // いいねを作成
    const likes = await createLikes(prisma, users, posts);

    // 通知を作成
    const notifications = await createNotifications(prisma, users, posts, comments, likes);

    const totalItems = posts.length + comments.length + likes.length + notifications.length;

    return {
      success: true,
      data: { posts, comments, likes, notifications },
      count: totalItems,
      message: 'コンテンツ関連のシードが正常に完了しました',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'コンテンツ関連のシードでエラーが発生しました',
    };
  }
}
