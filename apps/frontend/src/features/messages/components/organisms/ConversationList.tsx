import React from 'react';
import { Plus } from 'lucide-react';
import type { User } from '@libark/core-shared';

import { Button } from '@/components/atoms/button';
import { List } from '@/components/molecules/List';
import type { Conversation } from '@/features/messages/messages';

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  badge?: {
    text: string;
    variant: 'default' | 'destructive';
  };
}

interface UserProps {
  id: string;
  username: string;
  displayName?: string;
  profileImageId?: string;
  isVerified?: boolean;
}

interface ConversationParticipant {
  user: User;
  role?: string;
  isActive?: boolean;
  unreadCount?: number;
}

interface ConversationProps {
  id: string;
  title?: string;
  type: string;
  participantCount: number;
  unreadCount?: number;
  participants: ConversationParticipant[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
  };
  creator?: User;
  activeParticipants?: User[];
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation?: string;
  loading: boolean;
  error?: Error;
  currentUserId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewMessageModal: () => void; // 送信先選択モーダル用（統一）
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  loading,
  error,
  currentUserId,
  onConversationSelect,
  onNewMessageModal,
}) => {
  // 会話データをListItem形式に変換
  const conversationItems: ListItem[] = conversations.map((conversation, _index) => {
    const otherParticipant = conversation.participants.find((p: any) => p.user.id !== currentUserId);

    return {
      id: conversation.id,
      title:
        otherParticipant?.user.displayName || otherParticipant?.user.username || 'Unknown User',
      subtitle: conversation.lastMessage?.content || 'まだメッセージがありません',
      avatar: otherParticipant
        ? {
            username: otherParticipant.user.username,
            displayName: otherParticipant.user.displayName,
            profileImageId: otherParticipant.user.profileImageId,
          }
        : undefined,
      badge:
        (conversation.unreadCount ?? 0) > 0
          ? {
              text: (conversation.unreadCount ?? 0).toString(),
              variant: 'default' as const,
            }
          : undefined,
      isActive: selectedConversation === conversation.id,
      onClick: () => onConversationSelect(conversation.id),
    };
  });

  // カスタムヘッダーアクション（送信先選択モーダル統一）
  const customHeaderAction = (
    <Button
      onClick={onNewMessageModal}
      size='sm'
      variant='ghost'
      className='h-8 w-8 p-0'
      title='新しいメッセージ'
    >
      <Plus className='h-4 w-4' />
    </Button>
  );

  return (
    <div className='w-full md:w-96 h-full flex flex-col bg-background border-r border-border'>
      <List
        title='メッセージ'
        items={conversationItems}
        selectedItemId={selectedConversation}
        loading={loading}
        error={error ? new Error(error.message) : undefined}
        emptyState={
          <div className='text-center py-8 text-muted-foreground'>まだ会話がありません</div>
        }
        customHeaderAction={customHeaderAction}
        onItemClick={item => onConversationSelect((item as any).id)}
        variant='default'
        headerVariant='x-style'
        headerLevel='h2'
      />
    </div>
  );
};
