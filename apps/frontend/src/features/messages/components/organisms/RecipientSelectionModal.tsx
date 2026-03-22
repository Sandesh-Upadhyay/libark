/**
 * 📨 送信先選択モーダル（X風デザイン）
 *
 * 複数または単体の送信先を選択できるモーダル
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Search, X, Check, Users, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  ScrollArea,
  Separator,
} from '@/components/atoms';

import { SEARCH_USERS, GET_CONVERSATIONS } from '../../messages';
import type { User, Conversation } from '../../messages';

interface RecipientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (recipients: SelectedRecipient[], content: string) => Promise<void>;
  initialMessage?: string;
}

interface SelectedRecipient {
  type: 'user' | 'conversation';
  id: string;
  name: string;
  username?: string;
  profileImageId?: string;
  isVerified?: boolean;
  participantCount?: number;
}

interface SearchUsersResponse {
  users: {
    edges: Array<{
      node: User;
    }>;
  };
}

interface GetConversationsResponse {
  conversations: {
    edges: Array<{
      node: Conversation;
    }>;
  };
}

export const RecipientSelectionModal: React.FC<RecipientSelectionModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  initialMessage = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  const [messageContent, setMessageContent] = useState(initialMessage);
  const [activeTab, setActiveTab] = useState<'users' | 'conversations'>('users');
  const [sending, setSending] = useState(false);

  // ユーザー検索
  const { data: usersData, loading: usersLoading } = useQuery<SearchUsersResponse>(SEARCH_USERS, {
    variables: { search: searchQuery, first: 20 },
    skip: !searchQuery || activeTab !== 'users',
  });

  // 会話一覧取得
  const { data: conversationsData, loading: conversationsLoading } =
    useQuery<GetConversationsResponse>(GET_CONVERSATIONS, {
      variables: { first: 20 },
      skip: activeTab !== 'conversations',
    });

  // 検索結果のユーザー
  const searchedUsers = useMemo(() => {
    return usersData?.users?.edges?.map(edge => edge.node) || [];
  }, [usersData]);

  // 会話一覧
  const conversations = useMemo(() => {
    return conversationsData?.conversations?.edges?.map(edge => edge.node) || [];
  }, [conversationsData]);

  // 初期化
  useEffect(() => {
    if (isOpen) {
      setMessageContent(initialMessage);
      setSelectedRecipients([]);
      setSearchQuery('');
      setActiveTab('users');
    }
  }, [isOpen, initialMessage]);

  // ユーザーを選択/選択解除
  const toggleUserSelection = (user: User) => {
    const recipientId = `user-${user.id}`;
    const existingIndex = selectedRecipients.findIndex(r => r.id === recipientId);

    if (existingIndex >= 0) {
      // 選択解除
      setSelectedRecipients(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // 選択追加
      const newRecipient: SelectedRecipient = {
        type: 'user',
        id: recipientId,
        name: user.displayName || user.username,
        username: user.username,
        profileImageId: user.profileImageId || undefined,
        isVerified: user.isVerified,
      };
      setSelectedRecipients(prev => [...prev, newRecipient]);
    }
  };

  // 会話を選択/選択解除
  const toggleConversationSelection = (conversation: Conversation) => {
    const recipientId = `conversation-${conversation.id}`;
    const existingIndex = selectedRecipients.findIndex(r => r.id === recipientId);

    if (existingIndex >= 0) {
      // 選択解除
      setSelectedRecipients(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // 選択追加
      const newRecipient: SelectedRecipient = {
        type: 'conversation',
        id: recipientId,
        name: conversation.title || `会話 (${conversation.participantCount}人)`,
        participantCount: conversation.participantCount,
      };
      setSelectedRecipients(prev => [...prev, newRecipient]);
    }
  };

  // 選択された受信者を削除
  const removeRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== recipientId));
  };

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!messageContent.trim() || selectedRecipients.length === 0) {
      toast.error('送信先とメッセージを入力してください');
      return;
    }

    setSending(true);
    try {
      await onSendMessage(selectedRecipients, messageContent.trim());
      toast.success(`${selectedRecipients.length}件の送信先にメッセージを送信しました`);
      onClose();
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      toast.error('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // 選択状態チェック
  const isUserSelected = (userId: string) => {
    return selectedRecipients.some(r => r.id === `user-${userId}`);
  };

  const isConversationSelected = (conversationId: string) => {
    return selectedRecipients.some(r => r.id === `conversation-${conversationId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] p-0'>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            新しいメッセージ
          </DialogTitle>
        </DialogHeader>

        {/* 選択された受信者 */}
        {selectedRecipients.length > 0 && (
          <div className='px-6 pb-4'>
            <div className='flex flex-wrap gap-2'>
              {selectedRecipients.map(recipient => (
                <Badge
                  key={recipient.id}
                  variant='secondary'
                  className='flex items-center gap-1 pr-1'
                >
                  {recipient.type === 'user' ? (
                    <Avatar className='h-4 w-4'>
                      <AvatarImage
                        src={
                          recipient.profileImageId
                            ? `/api/media/${recipient.profileImageId}`
                            : undefined
                        }
                      />
                      <AvatarFallback className='text-xs'>
                        {recipient.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Users className='h-4 w-4' />
                  )}
                  <span className='text-xs'>{recipient.name}</span>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground'
                    onClick={() => removeRecipient(recipient.id)}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* タブ切り替え */}
        <div className='px-6 pt-4'>
          <div className='flex space-x-1 bg-muted p-1 rounded-lg'>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size='sm'
              className='flex-1'
              onClick={() => setActiveTab('users')}
            >
              <Search className='h-4 w-4 mr-2' />
              ユーザー検索
            </Button>
            <Button
              variant={activeTab === 'conversations' ? 'default' : 'ghost'}
              size='sm'
              className='flex-1'
              onClick={() => setActiveTab('conversations')}
            >
              <MessageCircle className='h-4 w-4 mr-2' />
              既存の会話
            </Button>
          </div>
        </div>

        {/* 検索・選択エリア */}
        <div className='px-6 flex-1 min-h-0'>
          {activeTab === 'users' && (
            <div className='space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='ユーザー名で検索...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              <ScrollArea className='h-48'>
                {usersLoading ? (
                  <div className='text-center py-8 text-muted-foreground'>検索中...</div>
                ) : searchedUsers.length > 0 ? (
                  <div className='space-y-2'>
                    {searchedUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          isUserSelected(user.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleUserSelection(user)}
                      >
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage
                              src={
                                user.profileImageId
                                  ? `/api/media/${user.profileImageId}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>
                              {(user.displayName || user.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='flex items-center gap-1'>
                              <span className='font-medium'>
                                {user.displayName || user.username}
                              </span>
                              {user.isVerified && <Check className='h-4 w-4 text-blue-500' />}
                            </div>
                            <span className='text-sm text-muted-foreground'>@{user.username}</span>
                          </div>
                        </div>
                        {isUserSelected(user.id) && <Check className='h-5 w-5 text-primary' />}
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    ユーザーが見つかりませんでした
                  </div>
                ) : (
                  <div className='text-center py-8 text-muted-foreground'>
                    ユーザー名を入力して検索してください
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {activeTab === 'conversations' && (
            <ScrollArea className='h-64'>
              {conversationsLoading ? (
                <div className='text-center py-8 text-muted-foreground'>読み込み中...</div>
              ) : conversations.length > 0 ? (
                <div className='space-y-2'>
                  {conversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isConversationSelected(conversation.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleConversationSelection(conversation)}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='h-10 w-10 bg-muted rounded-full flex items-center justify-center'>
                          <Users className='h-5 w-5 text-muted-foreground' />
                        </div>
                        <div>
                          <div className='font-medium'>
                            {conversation.title || `会話 (${conversation.participantCount}人)`}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {conversation.participantCount}人の参加者
                          </div>
                        </div>
                      </div>
                      {isConversationSelected(conversation.id) && (
                        <Check className='h-5 w-5 text-primary' />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-muted-foreground'>会話がありません</div>
              )}
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* メッセージ入力 */}
        <div className='p-6 pt-4'>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>メッセージ</label>
              <textarea
                placeholder='メッセージを入力...'
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                className='w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary'
                maxLength={1000}
              />
              <div className='text-xs text-muted-foreground mt-1 text-right'>
                {messageContent.length}/1000
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='p-6 pt-0'>
          <Button variant='outline' onClick={onClose} disabled={sending}>
            キャンセル
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || selectedRecipients.length === 0 || sending}
            className='min-w-[100px]'
          >
            {sending ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                送信中...
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <Send className='h-4 w-4' />
                送信 ({selectedRecipients.length})
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
