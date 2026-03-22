/**
 * 🎯 通知グループ化ユーティリティ
 *
 * 責任:
 * - 同じ投稿への同じアクションをグループ化
 * - X風の通知表示のためのデータ変換
 */

import type { NotificationsQuery } from '@libark/graphql-client';

// GraphQLクエリの結果型を使用
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

/**
 * グループ化された通知の型定義
 */
export interface GroupedNotification {
  id: string; // グループのID（最初の通知のID）
  type: string;
  referenceId: string | null;
  actors: Array<{
    id: string;
    username: string;
    displayName?: string | null;
    profileImageUrl?: string | null;
  }>;
  content: string; // 投稿内容（プレビュー用）
  createdAt: string; // 最新の通知の時間
  isRead: boolean; // 全て既読かどうか
  notificationIds: string[]; // グループに含まれる通知IDの配列
}

/**
 * 通知をグループ化するキーを生成
 */
const getGroupingKey = (notification: NotificationItem): string => {
  // referenceIdとtypeでグループ化
  // referenceIdがnullの場合は個別に表示
  if (!notification.referenceId) {
    return `individual_${notification.id}`;
  }

  return `${notification.referenceId}_${notification.type}`;
};

/**
 * 通知をグループ化
 */
export const groupNotifications = (notifications: NotificationItem[]): GroupedNotification[] => {
  const groups = new Map<string, NotificationItem[]>();

  // 通知をグループ化
  notifications.forEach(notification => {
    const key = getGroupingKey(notification);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(notification);
  });

  // グループをGroupedNotification形式に変換
  const groupedNotifications: GroupedNotification[] = [];

  groups.forEach(notificationGroup => {
    // 時間順でソート（最新が最初）
    const sortedGroup = notificationGroup.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const firstNotification = sortedGroup[0];

    // アクターを重複なしで収集
    const actorsMap = new Map();
    sortedGroup.forEach(notification => {
      if (notification.actor) {
        actorsMap.set(notification.actor.id, notification.actor);
      }
    });

    const actors = Array.from(actorsMap.values());

    // 全て既読かどうかをチェック
    const allRead = sortedGroup.every(notification => notification.isRead);

    groupedNotifications.push({
      id: firstNotification.id,
      type: firstNotification.type,
      referenceId: firstNotification.referenceId,
      actors,
      content: getPostContent(firstNotification), // 投稿内容を取得
      createdAt: firstNotification.createdAt, // 最新の時間
      isRead: allRead,
      notificationIds: sortedGroup.map(n => n.id),
    });
  });

  // 時間順でソート（最新が最初）
  return groupedNotifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * 投稿内容を取得（プレビュー用）
 * TODO: 実際の投稿データを取得するAPIを実装
 */
const getPostContent = (notification: NotificationItem): string => {
  // 現在は通知内容をそのまま使用
  // 実際の実装では、referenceIdを使って投稿内容を取得する
  if (notification.type === 'LIKE' || notification.type === 'COMMENT') {
    // 仮の投稿内容（実際の実装では投稿APIから取得）
    return '今日は素晴らしい天気ですね！散歩に出かけたくなります。';
  }

  return notification.content;
};

/**
 * グループ化された通知のテキストを生成
 */
export const generateNotificationText = (groupedNotification: GroupedNotification): string => {
  const { actors, type } = groupedNotification;

  if (actors.length === 0) {
    return getDefaultNotificationText(type);
  }

  const getActorName = (actor: (typeof actors)[0]) =>
    actor.displayName || actor.username || 'Unknown User';

  if (actors.length === 1) {
    const actorName = getActorName(actors[0]);
    return getSingleActorText(actorName, type);
  } else if (actors.length === 2) {
    const name1 = getActorName(actors[0]);
    const name2 = getActorName(actors[1]);
    return getTwoActorsText(name1, name2, type);
  } else {
    const firstName = getActorName(actors[0]);
    const othersCount = actors.length - 1;
    return getMultipleActorsText(firstName, othersCount, type);
  }
};

/**
 * 単一アクターのテキスト生成
 */
const getSingleActorText = (actorName: string, type: string): string => {
  switch (type) {
    case 'LIKE':
      return `${actorName}さんがあなたのポストをいいねしました`;
    case 'COMMENT':
      return `${actorName}さんがあなたのポストにコメントしました`;
    case 'FOLLOW':
      return `${actorName}さんがあなたをフォローしました`;
    default:
      return `${actorName}さんからの通知`;
  }
};

/**
 * 2人のアクターのテキスト生成
 */
const getTwoActorsText = (name1: string, name2: string, type: string): string => {
  switch (type) {
    case 'LIKE':
      return `${name1}さんと${name2}さんがあなたのポストをいいねしました`;
    case 'COMMENT':
      return `${name1}さんと${name2}さんがあなたのポストにコメントしました`;
    case 'FOLLOW':
      return `${name1}さんと${name2}さんがあなたをフォローしました`;
    default:
      return `${name1}さんと${name2}さんからの通知`;
  }
};

/**
 * 複数アクターのテキスト生成
 */
const getMultipleActorsText = (firstName: string, othersCount: number, type: string): string => {
  switch (type) {
    case 'LIKE':
      return `${firstName}さんと他${othersCount}人があなたのポストをいいねしました`;
    case 'COMMENT':
      return `${firstName}さんと他${othersCount}人があなたのポストにコメントしました`;
    case 'FOLLOW':
      return `${firstName}さんと他${othersCount}人があなたをフォローしました`;
    default:
      return `${firstName}さんと他${othersCount}人からの通知`;
  }
};

/**
 * デフォルトの通知テキスト
 */
const getDefaultNotificationText = (type: string): string => {
  switch (type) {
    // POST_PROCESSING_COMPLETEDは削除済み（Postは即座に処理されるため不要）
    case 'AVATAR_PROCESSING_COMPLETED':
      return 'プロフィール画像の処理が完了しました';
    case 'COMMENT_PROCESSING_COMPLETED':
      return 'コメントの処理が完了しました';
    case 'POST_PROCESSING_FAILED':
      return 'ポストの処理に失敗しました';
    case 'AVATAR_PROCESSING_FAILED':
      return 'プロフィール画像の処理に失敗しました';
    case 'COMMENT_PROCESSING_FAILED':
      return 'コメントの処理に失敗しました';
    default:
      return '新しい通知があります';
  }
};
