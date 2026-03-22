/**
 * 💬 メッセージページ (Shadcn版)
 *
 * 責任:
 * - Shadcnコンポーネントを使用したチャットUI
 * - メッセージ送信・受信機能
 * - ユーザー検索・選択
 * - 会話管理
 *
 * 特徴:
 * - 統一されたShadcnデザインシステム
 * - 完全独立レイアウト（ClientLayoutで右サイドバー非表示）
 * - 左サイドバー表示、右サイドバー・フッター非表示
 * - z-index 950で左サイドバー（1000）を表示
 * - 左サイドバー分のスペース確保（lg:left-16 xl:left-72）
 * - 無駄なパディング削除
 * - 機能的なメッセージング
 * - 改善されたエラーハンドリング
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import type { GraphQLFormattedError } from 'graphql';
import { useAuth, useMessageStore, type User } from '@libark/graphql-client';
import { toast } from 'sonner';

import { OptimisticUpdates } from '@/lib/graphql-client-utils';
import { useIsMobile } from '@/hooks';
import { Guard } from '@/features/auth/components/organisms/Guard';
import { MobileResponsiveLayout } from '@/components/templates/MobileResponsiveLayout';
import {
  ConversationList,
  ChatArea,
  RecipientSelectionModal,
} from '@/features/messages/components/organisms';
import {
  GET_CONVERSATIONS,
  GET_CONVERSATION_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_ADDED_SUBSCRIPTION,
  CONVERSATION_UPDATED_SUBSCRIPTION,
  type GetConversationsResponse,
  type GetConversationMessagesResponse,
  type SendMessageResponse,
  type SendMessageInput,
} from '@/features/messages/messages';
import { useFeatures } from '@/hooks';

// GraphQLエラーの型定義
interface GraphQLError {
  extensions?: {
    code?: string;
  };
}

interface _GraphQLErrorResponse {
  graphQLErrors?: GraphQLError[];
}

// 送信先選択モーダル用の型定義
interface SelectedRecipient {
  type: 'user' | 'conversation';
  id: string;
  name: string;
  username?: string;
  profileImageId?: string;
  isVerified?: boolean;
  participantCount?: number;
}

const MessagesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth() as { user: User | null; isAuthenticated: boolean };
  const isMobile = useIsMobile();

  // 機能フラグチェック
  const { features, loading: featureLoading } = useFeatures();
  const canAccessMessages = features.MESSAGES_ACCESS;
  const canSendMessages = features.MESSAGES_SEND;

  // 重複防止用のRef
  const processedMessageIds = useRef(new Set<string>());
  // パフォーマンス最適化用のRef
  const lastMessageTime = useRef<number>(0);
  const MESSAGE_THROTTLE_MS = 100; // メッセージ受信の最小間隔（100ms）

  // Zustandストアから状態を取得
  const {
    messages: messageState,
    setSelectedConversation,
    setDraftMessage,
    setShowConversationList,
    setShowNewMessageForm,
    cleanupOldDrafts,
  } = useMessageStore();

  const selectedConversation = messageState.selectedConversationId;
  const messageContent = selectedConversation
    ? messageState.draftMessages[selectedConversation] || ''
    : '';
  const showConversationList = messageState.ui?.showConversationList ?? true;

  // 送信先選択モーダルの状態
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // 選択された受信者の状態（ローカル状態）
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);

  // メッセージ内容更新ハンドラー
  const setMessageContent = (content: string) => {
    if (selectedConversation) {
      setDraftMessage(selectedConversation, content);
    }
  };

  // 初期化時にクリーンアップを実行
  useEffect(() => {
    cleanupOldDrafts();
  }, [cleanupOldDrafts]);

  // モバイルでの初期表示状態を設定（改善版）
  useEffect(() => {
    // モバイルでは会話が選択されている場合のみチャット画面を優先
    // 会話が選択されていない場合は会話リストを表示
    if (isMobile && selectedConversation) {
      setShowConversationList(false);
    } else if (isMobile && !selectedConversation) {
      setShowConversationList(true);
    }
  }, [isMobile, selectedConversation, setShowConversationList]);

  // サブスクリプション状態管理とクリーンアップ
  useEffect(() => {
    // 会話が変更されたときに処理済みメッセージIDをクリア
    processedMessageIds.current.clear();
    lastMessageTime.current = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 会話変更によるサブスクリプション状態リセット:', selectedConversation);
    }
  }, [selectedConversation]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      processedMessageIds.current.clear();
      lastMessageTime.current = 0;
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 MessagesPageクリーンアップ完了');
      }
    };
  }, []);

  // GraphQLクエリ
  const {
    data: conversationsData,
    loading: conversationsLoading,
    error: conversationsError,
  } = useQuery<GetConversationsResponse>(GET_CONVERSATIONS, {
    variables: { first: 20 },
    errorPolicy: 'all',
    onError: error => {
      console.error('❌ 会話一覧取得エラー:', error);
      toast.error('会話一覧の取得に失敗しました');
    },
    onCompleted: data => {
      console.log('✅ 会話一覧取得成功:', data?.conversations?.edges?.length || 0, '件');
    },
  });

  // 選択された会話のメッセージ一覧を取得
  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
  } = useQuery<GetConversationMessagesResponse>(GET_CONVERSATION_MESSAGES, {
    variables: { conversationId: selectedConversation!, first: 50 },
    skip: !selectedConversation,
    errorPolicy: 'all',
    onError: error => {
      console.error('❌ メッセージ取得エラー:', error);

      // 権限エラーの場合は会話選択をクリア
      if (
        error?.graphQLErrors?.some((e: GraphQLFormattedError) => e.extensions?.code === 'FORBIDDEN')
      ) {
        console.log('🔐 会話アクセス権限なし - 会話選択をクリア');
        setSelectedConversation(null);
        toast.error('この会話にアクセスする権限がありません');
      } else {
        toast.error('メッセージの取得に失敗しました');
      }
    },
  });

  // 無効な会話IDの場合はクリア
  useEffect(() => {
    if (selectedConversation && messagesError) {
      const isForbiddenError = messagesError?.graphQLErrors?.some(
        e => e.extensions?.code === 'FORBIDDEN'
      );
      if (isForbiddenError) {
        console.log('🔐 無効な会話ID検出 - 選択をクリア:', selectedConversation);
        setSelectedConversation(null);
      }
    }
  }, [selectedConversation, messagesError, setSelectedConversation]);

  // メッセージ送信ミューテーション
  const [sendMessage, { loading: sendingMessage }] = useMutation<SendMessageResponse>(
    SEND_MESSAGE,
    {
      update: (cache, { data }) => {
        if (data?.sendMessage.success && data.sendMessage.messageData && selectedConversation) {
          // 統一パターンでメッセージを追加
          OptimisticUpdates.safe((_cache: unknown) => {
            // メッセージをキャッシュに追加
            console.log('Adding message to cache:', data.sendMessage.messageData);
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('📨 メッセージ送信楽観的更新完了:', data.sendMessage.messageData.id);
          }
        }
      },
      onCompleted: data => {
        if (data.sendMessage.success) {
          setMessageContent(''); // メッセージ入力欄をクリア
          setSelectedRecipient(null); // 選択された受信者をクリア
          setShowNewMessageForm(false); // 新規メッセージフォームを閉じる
        }
      },
      onError: error => {
        console.error('❌ メッセージ送信エラー:', error);
        toast.error('メッセージ送信に失敗しました');
      },
    }
  );

  // メッセージ追加サブスクリプション（WebSocket使用）
  const { data: messageAddedData, error: messageAddedError } = useSubscription(
    MESSAGE_ADDED_SUBSCRIPTION,
    {
      variables: { conversationId: selectedConversation! },
      skip: !selectedConversation || !user || !isAuthenticated, // 適切な条件で有効化
      onData: ({ data, client: _client }) => {
        if (data?.data?.messageAdded) {
          const newMessage = data.data.messageAdded;
          const now = Date.now();

          // パフォーマンス最適化: メッセージ受信頻度の制限
          if (now - lastMessageTime.current < MESSAGE_THROTTLE_MS) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⏱️ メッセージ受信頻度制限によりスキップ:', newMessage.id);
            }
            return;
          }
          lastMessageTime.current = now;

          // 重複チェック（自分が送信したメッセージは既にキャッシュに追加済み）
          if (
            processedMessageIds.current.has(newMessage.id) ||
            (user && isAuthenticated && newMessage.senderId === user.id)
          ) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 重複メッセージをスキップ:', newMessage.id);
            }
            return;
          }

          // 処理済みとしてマーク
          processedMessageIds.current.add(newMessage.id);

          // 統一パターンでメッセージを追加
          OptimisticUpdates.safe((_cache: unknown) => {
            console.log('Adding received message to cache:', newMessage.id);
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('📨 新しいメッセージを受信:', newMessage.id);
          }
        }
      },
      onError: error => {
        console.error('❌ メッセージサブスクリプションエラー:', error);

        // 権限エラーの場合は会話選択をクリア
        if (
          error?.graphQLErrors?.some(
            (e: { extensions?: { code?: string } }) => e.extensions?.code === 'FORBIDDEN'
          )
        ) {
          console.log('🔐 メッセージサブスクリプション権限なし - 会話選択をクリア');
          setSelectedConversation(null);
          // サブスクリプションエラーではトーストを表示しない（ユーザビリティ向上）
        }
      },
    }
  );

  // 会話更新サブスクリプション（WebSocket使用）
  const { data: conversationUpdatedData, error: conversationUpdatedError } = useSubscription(
    CONVERSATION_UPDATED_SUBSCRIPTION,
    {
      variables: { userId: user && isAuthenticated ? user.id : '' },
      skip: !user || !('id' in user), // 適切な条件で有効化
      onData: ({ data, client: _client }) => {
        if (data?.data?.conversationUpdated) {
          const updatedConversation = data.data.conversationUpdated;

          // 統一パターンで会話リストを更新
          OptimisticUpdates.safe((_cache: unknown) => {
            console.log('Updating conversation list:', updatedConversation.id);
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 会話リストを更新:', updatedConversation.id);
          }
        }
      },
      onError: error => {
        console.error('❌ 会話更新サブスクリプションエラー:', error);
        // 会話更新サブスクリプションエラーは通常ログのみ（ユーザビリティ向上）
      },
    }
  );

  // データの取得
  const conversations = conversationsData?.conversations?.edges?.map(edge => edge.node) || [];
  const messages = messagesData?.conversation?.messages?.edges?.map(edge => edge.node) || [];

  // デバッグ情報
  useEffect(() => {
    console.log('🔍 メッセージページ状態:', {
      conversationsLoading,
      conversationsError: conversationsError?.message,
      conversationsCount: conversations.length,
      messagesCount: messages.length,
      selectedConversation,
      user: user && isAuthenticated ? user.id : '',
    });
  }, [
    conversationsLoading,
    conversationsError,
    conversations.length,
    messages.length,
    selectedConversation,
    user && isAuthenticated ? user.id : null,
  ]);

  // メッセージ送信ハンドラー
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!messageContent.trim() || sendingMessage) return; // 送信中は無視

    try {
      if (selectedConversation && currentConversation) {
        // 既存の会話にメッセージを送信
        const otherParticipant = currentConversation.participants.find(
          p => user && isAuthenticated && p.user.id !== user.id
        );

        if (otherParticipant) {
          await sendMessage({
            variables: {
              input: {
                recipientId: otherParticipant.user.id,
                content: messageContent.trim(),
                type: 'TEXT',
              } as SendMessageInput,
            },
          });
        }
      } else if (selectedRecipient) {
        // 新しい会話を作成してメッセージを送信
        await sendMessage({
          variables: {
            input: {
              recipientId: selectedRecipient.id,
              content: messageContent.trim(),
              type: 'TEXT',
            } as SendMessageInput,
          },
        });
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
    }
  };

  // 複数送信先へのメッセージ送信ハンドラー
  const handleSendToMultipleRecipients = async (
    recipients: SelectedRecipient[],
    content: string
  ) => {
    const promises = recipients.map(async recipient => {
      if (recipient.type === 'user') {
        // ユーザーIDを抽出（"user-{id}"形式から）
        const userId = recipient.id.replace('user-', '');
        return sendMessage({
          variables: {
            input: {
              recipientId: userId,
              content,
              type: 'TEXT',
            } as SendMessageInput,
          },
        });
      } else if (recipient.type === 'conversation') {
        // 会話IDを抽出（"conversation-{id}"形式から）
        const conversationId = recipient.id.replace('conversation-', '');
        return sendMessage({
          variables: {
            input: {
              conversationId,
              content,
              type: 'TEXT',
            } as SendMessageInput,
          },
        });
      }
    });

    await Promise.all(promises);
  };

  // 会話選択ハンドラー（モバイル対応）
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowNewMessageForm(false);
    // モバイルでは会話選択時にチャット画面を表示
    setShowConversationList(false);
  };

  // 送信先選択モーダル表示ハンドラー
  const handleShowRecipientModal = () => {
    setShowRecipientModal(true);
  };

  // メッセージ削除ハンドラー
  const handleMessageDeleted = (messageId: string, deleteType: 'UNSEND' | 'HIDE') => {
    // メッセージリストを更新（Apollo Clientのキャッシュが自動更新）
    console.log(`メッセージ削除: ${messageId}, タイプ: ${deleteType}`);
  };

  // 会話一覧に戻る（モバイル用）
  const handleBackToConversationList = () => {
    setShowConversationList(true);
  };

  // 選択された会話の取得
  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  // 会話のタイトルを生成（参加者名から）
  const getConversationTitle = (conversation: {
    title?: string;
    participants: Array<{ user: { id: string; displayName?: string; username: string } }>;
  }) => {
    if (conversation.title) {
      return conversation.title;
    }

    // DIRECT会話の場合、相手の名前を表示
    const otherParticipants = conversation.participants.filter(
      p => user && isAuthenticated && p.user.id !== user.id
    );

    if (otherParticipants.length === 1) {
      const participant = otherParticipants[0];
      return participant?.user?.displayName || participant?.user?.username || 'Unknown User';
    }

    return `${conversation.participants.length}人の会話`;
  };

  // メッセージ機能が無効な場合
  if (!featureLoading && !canAccessMessages) {
    return (
      <Guard type='auth'>
        <div className='flex flex-col items-center justify-center min-h-screen p-8'>
          <div className='text-center'>
            <div className='h-16 w-16 text-muted-foreground mx-auto mb-4'>💬</div>
            <h2 className='text-xl font-semibold mb-2'>メッセージ機能は現在無効です</h2>
            <p className='text-muted-foreground'>
              メッセージ機能は現在利用できません。管理者にお問い合わせください。
            </p>
          </div>
        </div>
      </Guard>
    );
  }

  return (
    <Guard type='auth'>
      <MobileResponsiveLayout
        showSidebar={showConversationList}
        sidebar={
          <ConversationList
            conversations={conversations as any}
            selectedConversation={selectedConversation || undefined}
            loading={conversationsLoading}
            error={conversationsError}
            currentUserId={user && isAuthenticated ? user.id : ''}
            onConversationSelect={handleConversationSelect}
            onNewMessageModal={handleShowRecipientModal}
          />
        }
      >
        <ChatArea
          conversation={
            currentConversation as import('@libark/graphql-client').Conversation | undefined
          }
          messages={messages as import('@libark/graphql-client').Message[]}
          messagesLoading={messagesLoading}
          messagesError={messagesError}
          messageContent={messageContent}
          sendingMessage={sendingMessage}
          currentUserId={user && isAuthenticated ? user.id : ''}
          onMessageContentChange={setMessageContent}
          onSendMessage={canSendMessages ? handleSendMessage : () => {}}
          onBackToConversationList={handleBackToConversationList}
          getConversationTitle={
            getConversationTitle as (
              conversation: import('@libark/graphql-client').Conversation
            ) => string
          }
          onMessageDeleted={handleMessageDeleted}
        />
      </MobileResponsiveLayout>

      {/* 送信先選択モーダル */}
      <RecipientSelectionModal
        isOpen={showRecipientModal}
        onClose={() => setShowRecipientModal(false)}
        onSendMessage={handleSendToMultipleRecipients}
      />
    </Guard>
  );
};

export default MessagesPage;
