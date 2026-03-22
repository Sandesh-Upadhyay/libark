/**
 * 🗑️ メッセージ削除メニューコンポーネント
 *
 * X風のメッセージ削除機能を提供
 * - 送信取り消し（全員から削除）
 * - トーク削除（自分のみ削除）
 *
 * コンテキスト別の制限:
 * - chat: チャット画面 - 送信取り消しのみ
 * - list: メッセージリスト画面 - 送信取り消し + トーク削除
 */

'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { MoreHorizontal, Trash2, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from '@libark/graphql-client';
import { MessageDeleteType } from '@libark/graphql-client';

import { OptimisticUpdates } from '@/lib/graphql-client-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/atoms';

import { DELETE_MESSAGE, HIDE_MESSAGE } from '../../messages';
import type {
  DeleteMessageInput,
  HideMessageInput,
  DeleteMessageResponse,
  HideMessageResponse,
} from '../../messages';

// Message型にはすでに必要なプロパティが含まれているため、ExtendedMessageは不要
type ExtendedMessage = Message;

interface MessageDeleteMenuProps {
  message: ExtendedMessage;
  currentUserId: string;
  context?: 'chat' | 'list'; // チャット画面かリスト画面か
  onMessageDeleted?: (messageId: string, deleteType: 'UNSEND' | 'HIDE') => void;
}

export const MessageDeleteMenu: React.FC<MessageDeleteMenuProps> = ({
  message,
  currentUserId,
  context = 'chat', // デフォルトはチャット画面
  onMessageDeleted,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'UNSEND' | 'HIDE'>('HIDE');

  // 統一パターンのキャッシュ更新関数
  const updateMessageCache = OptimisticUpdates.removeMessage(message.conversationId, message.id);

  // メッセージ削除Mutation（楽観的更新対応）
  const [deleteMessage, { loading: deletingMessage }] = useMutation<
    DeleteMessageResponse,
    { input: DeleteMessageInput }
  >(DELETE_MESSAGE, {
    optimisticResponse: variables => ({
      deleteMessage: {
        success: true,
        message:
          variables.input.deleteType === 'UNSEND'
            ? 'メッセージを取り消しました'
            : 'メッセージを非表示にしました',
        deletedMessage: {
          ...message,
          deletedAt:
            variables.input.deleteType === 'UNSEND' ? new Date().toISOString() : message.deletedAt,
          isHidden: variables.input.deleteType === 'HIDE' ? true : message.isHidden,
        },
        deleteType: variables.input.deleteType,
      },
    }),
    update: updateMessageCache,
    onCompleted: data => {
      if (data.deleteMessage.success) {
        toast.success(data.deleteMessage.message);
        onMessageDeleted?.(message.id, data.deleteMessage.deleteType);
      }
    },
    onError: error => {
      console.error('メッセージ削除エラー:', error);
      toast.error('メッセージの削除に失敗しました');
    },
  });

  // メッセージ非表示Mutation（楽観的更新対応）
  const [hideMessage, { loading: hidingMessage }] = useMutation<
    HideMessageResponse,
    { input: HideMessageInput }
  >(HIDE_MESSAGE, {
    optimisticResponse: () => ({
      hideMessage: {
        success: true,
        message: 'メッセージを非表示にしました',
        hiddenMessage: {
          ...message,
          isHidden: true,
        },
      },
    }),
    update: updateMessageCache,
    onCompleted: data => {
      if (data.hideMessage.success) {
        toast.success(data.hideMessage.message);
        onMessageDeleted?.(message.id, 'HIDE');
      }
    },
    onError: error => {
      console.error('メッセージ非表示エラー:', error);
      toast.error('メッセージの非表示に失敗しました');
    },
  });

  // 削除可能かチェック
  const canUnsend = message.senderId === currentUserId && !message.deletedAt;
  const canHide = !message.isHidden && context === 'list'; // リスト画面でのみトーク削除可能

  // 削除実行
  const handleDelete = async () => {
    try {
      if (deleteType === 'UNSEND') {
        await deleteMessage({
          variables: {
            input: {
              messageId: message.id,
              deleteType: MessageDeleteType.Unsend,
            },
          },
        });
      } else {
        await hideMessage({
          variables: {
            input: {
              messageId: message.id,
            },
          },
        });
      }
      setShowConfirmDialog(false);
    } catch {
      // エラーはMutationのonErrorで処理
    }
  };

  // 送信取り消し確認
  const handleUnsendClick = () => {
    setDeleteType('UNSEND');
    setShowConfirmDialog(true);
  };

  // トーク削除確認
  const handleHideClick = () => {
    setDeleteType('HIDE');
    setShowConfirmDialog(true);
  };

  // メニューが表示できない場合は何も表示しない
  if (!canUnsend && !canHide) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50 rounded-full'
            title='メッセージオプション'
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {canUnsend && (
            <DropdownMenuItem
              onClick={handleUnsendClick}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              送信を取り消し
            </DropdownMenuItem>
          )}
          {canHide && (
            <DropdownMenuItem onClick={handleHideClick}>
              <EyeOff className='h-4 w-4 mr-2' />
              トークを削除
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 削除確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              {deleteType === 'UNSEND' ? 'メッセージの送信を取り消し' : 'トークを削除'}
            </DialogTitle>
          </DialogHeader>

          <div className='py-4'>
            {deleteType === 'UNSEND' ? (
              <div className='space-y-3'>
                <p className='text-sm text-muted-foreground'>このメッセージを取り消しますか？</p>
                <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
                  <p className='text-sm text-amber-800'>
                    <strong>注意:</strong> メッセージは全ての参加者から削除され、復元できません。
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                <p className='text-sm text-muted-foreground'>
                  このメッセージをトークから削除しますか？
                </p>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                  <p className='text-sm text-blue-800'>
                    <strong>情報:</strong>{' '}
                    メッセージはあなたのトークからのみ削除されます。他の参加者には引き続き表示されます。
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              disabled={deletingMessage || hidingMessage}
            >
              キャンセル
            </Button>
            <Button
              variant={deleteType === 'UNSEND' ? 'destructive' : 'default'}
              onClick={handleDelete}
              disabled={deletingMessage || hidingMessage}
            >
              {deletingMessage || hidingMessage ? (
                <div className='flex items-center gap-2'>
                  <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  削除中...
                </div>
              ) : deleteType === 'UNSEND' ? (
                '送信を取り消し'
              ) : (
                'トークを削除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
