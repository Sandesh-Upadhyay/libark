/**
 * メッセージ関連シーダー
 * 会話、メッセージ、既読データの作成を担当
 */

import { PrismaClient } from '@prisma/client';

import type { User, SeedResult } from '../utils/types';
import {
  directMessages,
  groupMessages,
  conversationTitles,
  messageConfig,
  messageTypes,
  participantRoles,
} from '../data/messages';
import { getRandomElement, getRandomInt } from '../utils/random';
import { logProgress } from '../utils/database';

/**
 * 1対1会話を作成
 */
export async function createDirectConversations(
  prisma: PrismaClient,
  users: User[]
): Promise<any[]> {
  console.log('1対1会話を作成しています...');
  const conversations = [];

  if (users.length < 2) {
    console.log('⚠️ 1対1会話の作成には最低2人のユーザーが必要です');
    return conversations;
  }

  for (let i = 0; i < messageConfig.directConversations; i++) {
    // ランダムに2人のユーザーを選択
    const user1 = getRandomElement(users);
    let user2 = getRandomElement(users);

    // 同じユーザーが選ばれた場合は別のユーザーを選択
    while (user2.id === user1.id && users.length > 1) {
      user2 = getRandomElement(users);
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdBy: user1.id,
        participants: {
          create: [
            {
              userId: user1.id,
              role: participantRoles.DIRECT,
            },
            {
              userId: user2.id,
              role: participantRoles.DIRECT,
            },
          ],
        },
      },
    });

    conversations.push(conversation);
    logProgress(i + 1, messageConfig.directConversations, '1対1会話');
  }

  console.log(`${conversations.length} 個の1対1会話を作成しました`);
  return conversations;
}

/**
 * グループ会話を作成
 */
export async function createGroupConversations(
  prisma: PrismaClient,
  users: User[]
): Promise<any[]> {
  console.log('グループ会話を作成しています...');
  const conversations = [];

  if (users.length < messageConfig.minGroupParticipants) {
    console.log(
      `⚠️ グループ会話の作成には最低${messageConfig.minGroupParticipants}人のユーザーが必要です`
    );
    return conversations;
  }

  for (let i = 0; i < messageConfig.groupConversations; i++) {
    // 参加者数を決定
    const participantCount = Math.min(
      getRandomInt(messageConfig.minGroupParticipants, messageConfig.maxGroupParticipants),
      users.length
    );

    // ランダムに参加者を選択
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const participants = shuffledUsers.slice(0, participantCount);
    const admin = participants[0];

    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        title: getRandomElement(conversationTitles),
        createdBy: admin.id,
        participants: {
          create: participants.map((user, index) => ({
            userId: user.id,
            role: index === 0 ? participantRoles.GROUP_ADMIN : participantRoles.GROUP_MEMBER,
          })),
        },
      },
    });

    conversations.push(conversation);
    logProgress(i + 1, messageConfig.groupConversations, 'グループ会話');
  }

  console.log(`${conversations.length} 個のグループ会話を作成しました`);
  return conversations;
}

/**
 * メッセージを作成
 */
export async function createMessages(
  prisma: PrismaClient,
  conversations: unknown[]
): Promise<any[]> {
  console.log('メッセージを作成しています...');
  const allMessages = [];

  for (const conversation of conversations) {
    // 会話の参加者を取得
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      include: { user: true },
    });

    if (participants.length === 0) continue;

    // メッセージ数を決定
    const messageCount =
      conversation.type === 'DIRECT'
        ? messageConfig.messagesPerDirectConversation
        : messageConfig.messagesPerGroupConversation;

    // メッセージサンプルを選択
    const messageSamples = conversation.type === 'DIRECT' ? directMessages : groupMessages;

    for (let i = 0; i < messageCount && i < messageSamples.length; i++) {
      // ランダムに送信者を選択
      const sender = getRandomElement(participants);

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.userId,
          content: messageSamples[i],
          type: getRandomElement(messageTypes),
        },
      });

      allMessages.push(message);

      // 既読データを作成（送信者以外の参加者）
      const otherParticipants = participants.filter(p => p.userId !== sender.userId);
      for (const participant of otherParticipants) {
        // 設定された確率で既読にする
        if (Math.random() < messageConfig.messageReadRate) {
          await prisma.messageRead.create({
            data: {
              messageId: message.id,
              userId: participant.userId,
            },
          });
        }
      }
    }
  }

  console.log(`${allMessages.length} 件のメッセージを作成しました`);
  return allMessages;
}

/**
 * メッセージ関連のシード実行
 */
export async function seedMessages(prisma: PrismaClient, users: User[]): Promise<SeedResult> {
  try {
    if (users.length < 2) {
      return {
        success: false,
        error: new Error('メッセージシードには最低2人のユーザーが必要です'),
        message: 'メッセージ関連のシードでエラーが発生しました',
      };
    }

    // 1対1会話を作成
    const directConversations = await createDirectConversations(prisma, users);

    // グループ会話を作成
    const groupConversations = await createGroupConversations(prisma, users);

    // 全ての会話
    const allConversations = [...directConversations, ...groupConversations];

    // メッセージを作成
    const messages = await createMessages(prisma, allConversations);

    const totalItems = allConversations.length + messages.length;

    return {
      success: true,
      data: { conversations: allConversations, messages },
      count: totalItems,
      message: 'メッセージ関連のシードが正常に完了しました',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'メッセージ関連のシードでエラーが発生しました',
    };
  }
}
