import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/atoms';
import { Button } from '@/components/atoms/button';
import type { Conversation, Message } from '@/features/messages/messages';

interface UserProps {
  id: string;
  username: string;
  displayName?: string;
  profileImageId?: string;
  isVerified?: boolean;
}

// ローカル型定義は削除し、インポートした型を使用

interface MessageSearchBarProps {
  conversations: Conversation[];
  messages: Message[];
  currentUserId?: string;
  onSearchResults: (filteredConversations: Conversation[], filteredMessages: Message[]) => void;
  onClearSearch: () => void;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  conversations,
  messages,
  currentUserId: _currentUserId,
  onSearchResults,
  onClearSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // 検索処理
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearchActive(false);
      onClearSearch();
      return;
    }

    setIsSearchActive(true);
    const query = searchQuery.toLowerCase();

    // 会話の検索（参加者の名前、表示名、ユーザー名で検索）
    const filteredConversations = conversations.filter(conversation => {
      // 参加者の名前で検索
      const participantMatch = conversation.participants.some(participant => {
        const user = participant.user;
        return (
          user.username.toLowerCase().includes(query) ||
          (user.displayName && user.displayName.toLowerCase().includes(query))
        );
      });

      // 最後のメッセージ内容で検索
      const lastMessageMatch = conversation.lastMessage?.content.toLowerCase().includes(query);

      return participantMatch || lastMessageMatch;
    });

    // メッセージの検索（内容、送信者名で検索）
    const filteredMessages = messages.filter(message => {
      const contentMatch = message.content.toLowerCase().includes(query);
      const senderMatch =
        message.sender.username.toLowerCase().includes(query) ||
        (message.sender.displayName && message.sender.displayName.toLowerCase().includes(query));

      return contentMatch || senderMatch;
    });

    onSearchResults(filteredConversations, filteredMessages);
  }, [searchQuery, conversations, messages, onSearchResults, onClearSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    onClearSearch();
  };

  return (
    <div className='p-4 border-b border-border bg-background/50'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder='メッセージ、ユーザー名で検索...'
          className='pl-10 pr-10 h-9 text-sm border-2 focus:border-primary/50 rounded-lg'
        />
        {isSearchActive && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClearSearch}
            className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0'
          >
            <X className='h-3 w-3' />
          </Button>
        )}
      </div>

      {isSearchActive && (
        <div className='mt-2 text-xs text-muted-foreground'>検索中: "{searchQuery}"</div>
      )}
    </div>
  );
};
