import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';

import { Button } from '@/components/atoms';

interface MessageStats {
  totalConversations: number;
  totalUnreadMessages: number;
}

interface MessagesHeaderProps {
  messageStats?: MessageStats;
  onNewMessage: () => void;
}

export const MessagesHeader: React.FC<MessagesHeaderProps> = ({ messageStats, onNewMessage }) => {
  return (
    <div className='p-6 border-b border-border bg-background/95 backdrop-blur-sm shadow-sm sticky top-0 z-10'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-primary/10 rounded-lg'>
            <MessageSquare className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h1 className='font-bold text-xl text-foreground'>メッセージ</h1>
            {messageStats && (
              <p className='text-sm text-muted-foreground'>
                {messageStats.totalConversations}件の会話 • {messageStats.totalUnreadMessages}
                件の未読
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <Button onClick={onNewMessage} size='default' className='shadow-sm'>
            <Plus className='h-4 w-4 mr-2' />
            新しいメッセージ
          </Button>
        </div>
      </div>
    </div>
  );
};
