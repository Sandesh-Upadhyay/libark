import React from 'react';
import { X } from 'lucide-react';
import type { User } from '@libark/core-shared';

import { Button } from '@/components/atoms';
import { Header } from '@/components/molecules/Header';

import { UserSearchInput, MessageInput } from '../molecules';

interface NewMessageFormProps {
  recipientSearch: string;
  selectedRecipient: User | null;
  messageContent: string;
  sendingMessage: boolean;
  onRecipientSearchChange: (search: string) => void;
  onUserSelect: (user: User) => void;
  onMessageContentChange: (content: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onClose: () => void;
  onBackToConversationList?: () => void;
}

export const NewMessageForm: React.FC<NewMessageFormProps> = ({
  recipientSearch,
  selectedRecipient,
  messageContent,
  sendingMessage,
  onRecipientSearchChange,
  onUserSelect,
  onMessageContentChange,
  onSendMessage,
  onClose,
  onBackToConversationList,
}) => {
  // 右側アクション（閉じるボタン）
  const rightAction = (
    <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
      <X className='h-4 w-4' />
    </Button>
  );

  return (
    <div className='flex flex-1 flex-col min-h-0 h-full bg-background'>
      {/* ヘッダー */}
      <Header
        title='新しいメッセージ'
        showBackButton={!!onBackToConversationList}
        onBackClick={onBackToConversationList}
        backButtonLabel='会話リストに戻る'
        rightAction={rightAction}
        showBorder={true}
        mobileBackOnly={true}
      />

      {/* メインエリア */}
      <div className='flex-1 p-4'>
        <div className='flex flex-col justify-center items-center space-y-4 min-h-0 h-full'>
          <div className='w-full max-w-md space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>受信者を選択</label>
              <UserSearchInput
                value={recipientSearch}
                onChange={onRecipientSearchChange}
                onUserSelect={onUserSelect as any}
                placeholder='ユーザー名で検索...'
              />
            </div>

            {selectedRecipient && (
              <div className='p-4 bg-accent/50 rounded-xl border border-border'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                    <span className='text-sm font-medium text-primary'>
                      {(selectedRecipient.displayName || selectedRecipient.username)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className='text-sm font-medium'>
                      {selectedRecipient.displayName || selectedRecipient.username}
                    </p>
                    <p className='text-xs text-muted-foreground'>@{selectedRecipient.username}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRecipient && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>メッセージ</label>
                <MessageInput
                  value={messageContent}
                  onChange={onMessageContentChange}
                  onSend={onSendMessage}
                  sending={sendingMessage}
                  placeholder='メッセージを入力...'
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
