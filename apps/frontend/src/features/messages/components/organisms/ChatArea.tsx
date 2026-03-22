import React, { useRef, useEffect } from 'react';
import { MessageSquare, CheckCheck, Users, Info } from 'lucide-react';
import type { Message as GraphQLMessage } from '@libark/graphql-client';


import { Button } from '@/components/atoms';
import { LoadingSpinner } from '@/components/atoms/loading';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Header } from '@/components/molecules/Header';

import type { Conversation } from '../../messages';
import { MessageDeleteMenu } from '../molecules/MessageDeleteMenu';
import { MessageInput } from '../molecules/MessageInput';

// User型、Message型、Conversation型はGraphQL生成型を使用

interface ChatAreaProps {
  conversation?: Conversation;
  messages: GraphQLMessage[];
  messagesLoading: boolean;
  messagesError?: Error;
  messageContent: string;
  sendingMessage: boolean;
  currentUserId?: string;
  onMessageContentChange: (content: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onBackToConversationList?: () => void;
  getConversationTitle: (conversation: Conversation) => string;
  onMessageDeleted?: (messageId: string, deleteType: 'UNSEND' | 'HIDE') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  messagesLoading,
  messagesError,
  messageContent,
  sendingMessage,
  currentUserId,
  onMessageContentChange,
  onSendMessage,
  onBackToConversationList,
  getConversationTitle,
  onMessageDeleted,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // バックエンドから新しい順で来るので、逆順にして古いメッセージを上に表示
  const displayMessages = [...messages].reverse();

  // メッセージエリアを最下部にスクロールする関数
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // メッセージが更新されたときに最下部にスクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  // 会話が変更されたときも最下部にスクロール
  useEffect(() => {
    if (conversation) {
      setTimeout(scrollToBottom, 200);
    }
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className='hidden sm:flex flex-1 flex-col min-h-0 h-full bg-background items-center justify-center'>
        <MessageSquare className='h-16 w-16 text-muted-foreground mb-4' />
        <h3 className='text-lg font-semibold text-muted-foreground mb-2'>会話を選択してください</h3>
        <p className='text-sm text-muted-foreground text-center max-w-md'>
          左側の会話一覧から会話を選択するか、新しいメッセージを作成してください
        </p>
      </div>
    );
  }

  // 他の参加者を取得
  const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);

  // 左側コンテンツ（アバター）
  const leftContent = otherParticipant ? (
    <UserAvatar
      username={otherParticipant.user.username}
      displayName={otherParticipant.user.displayName || undefined}
      profileImageId={otherParticipant.user.profileImageId || undefined}
      size='sm'
    />
  ) : (
    <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
      <Users className='w-4 h-4' />
    </div>
  );

  // 右側アクション（情報ボタン）
  const rightAction = (
    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
      <Info className='h-4 w-4' />
    </Button>
  );

  return (
    <div className='flex flex-col h-full'>
      <Header
        title={getConversationTitle(conversation)}
        showBackButton={!!onBackToConversationList}
        onBackClick={onBackToConversationList}
        backButtonLabel='会話リストに戻る'
        leftContent={leftContent}
        rightAction={rightAction}
        mobileBackOnly={true}
        variant='x-style'
        headingLevel='h2'
      />

      <div className='flex-1 overflow-y-auto min-w-0'>
        <div className='space-y-2 min-w-0 px-4'>
          <div className='text-center'>
            <div className='inline-block px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground'>
              今日
            </div>
          </div>

          {messagesLoading ? (
            <div className='flex justify-center py-8'>
              <LoadingSpinner size='sm' />
              <span className='ml-2 text-sm text-muted-foreground'>メッセージを読み込み中...</span>
            </div>
          ) : messagesError ? (
            <div className='text-center py-8'>
              <p className='text-sm text-destructive'>メッセージの読み込みに失敗しました</p>
            </div>
          ) : messages.length === 0 ? (
            <div className='text-center py-8'>
              <MessageSquare className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
              <p className='text-sm text-muted-foreground'>まだメッセージがありません</p>
              <p className='text-xs text-muted-foreground'>最初のメッセージを送信してみましょう</p>
            </div>
          ) : (
            displayMessages.map((message, index) => {
              const isOwnMessage = message.sender.id === currentUserId;
              const showAvatar =
                index === 0 || displayMessages[index - 1]?.sender.id !== message.sender.id;

              return (
                <div
                  key={message.id}
                  className={`group flex items-end space-x-2 mb-2 min-w-0 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className='flex-shrink-0 p-1'>
                    {showAvatar ? (
                      <UserAvatar
                        username={message.sender.username}
                        displayName={message.sender.displayName || undefined}
                        profileImageId={message.sender.profileImageId || undefined}
                        size='sm'
                      />
                    ) : (
                      <div className='w-8 h-8' />
                    )}
                  </div>

                  <div
                    className={`flex flex-col min-w-0 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <p className='text-xs text-muted-foreground mb-1 px-3'>
                        {message.sender.displayName || message.sender.username}
                      </p>
                    )}

                    <div
                      className={`relative flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      {/* メッセージ削除メニュー（相手のメッセージの場合は左側に表示） */}
                      {!isOwnMessage && currentUserId && message.canDelete && (
                        <MessageDeleteMenu
                          message={
                            {
                              ...message,
                              type: message.type as import('@libark/graphql-client').MessageType,
                              conversationId: conversation?.id || '',
                              updatedAt: message.createdAt,
                            } as import('@libark/graphql-client').Message
                          }
                          currentUserId={currentUserId}
                          context='chat'
                          onMessageDeleted={onMessageDeleted}
                        />
                      )}

                      <div
                        className={`min-w-0 px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className='text-sm leading-relaxed whitespace-pre-wrap break-words word-break overflow-wrap-anywhere'>
                          {message.content}
                        </p>
                      </div>

                      {/* メッセージ削除メニュー（自分のメッセージの場合は右側に表示） */}
                      {isOwnMessage && currentUserId && message.canDelete && (
                        <MessageDeleteMenu
                          message={
                            {
                              ...message,
                              type: message.type as import('@libark/graphql-client').MessageType,
                              conversationId: conversation?.id || '',
                              updatedAt: message.createdAt,
                            } as import('@libark/graphql-client').Message
                          }
                          currentUserId={currentUserId}
                          context='chat'
                          onMessageDeleted={onMessageDeleted}
                        />
                      )}
                    </div>

                    <div
                      className={`flex items-center space-x-1 mt-1 px-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <p className='text-xs text-muted-foreground'>
                        {new Date(message.createdAt).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {isOwnMessage && (
                        <div className='flex items-center space-x-1'>
                          {(() => {
                            // 1対1の会話の場合
                            if (conversation?.type === 'DIRECT') {
                              if (message.isRead) {
                                return <CheckCheck className='h-3 w-3 text-blue-500' />;
                              } else {
                                return <CheckCheck className='h-3 w-3 text-muted-foreground' />;
                              }
                            }
                            // グループチャットの場合
                            else {
                              const readCount = message.readCount || 0;
                              if (readCount > 0) {
                                return (
                                  <>
                                    <CheckCheck className='h-3 w-3 text-blue-500' />
                                    {readCount > 1 && (
                                      <span className='text-xs text-muted-foreground'>
                                        {readCount}
                                      </span>
                                    )}
                                  </>
                                );
                              } else {
                                return <CheckCheck className='h-3 w-3 text-muted-foreground' />;
                              }
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className='p-2'>
        <MessageInput
          value={messageContent}
          onChange={onMessageContentChange}
          onSend={onSendMessage}
          sending={sendingMessage}
          placeholder='メッセージを入力...'
        />
      </div>
    </div>
  );
};
