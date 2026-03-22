/**
 * 🎯 統一リストコンポーネント (Molecule)
 *
 * 責任:
 * - メッセージリスト、設定項目リスト等の統一表示
 * - 汎用的なリストアイテム表示
 * - ローディング・エラー・空状態の統一処理
 * - クリック・選択状態の管理
 *
 * 特徴:
 * - ConversationListから共通化
 * - 設定項目、メニュー項目等に再利用可能
 * - 統一されたデザインシステム
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';

import { Button } from '@/components/atoms';
import { LoadingSpinner } from '@/components/atoms';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Header } from '@/components/molecules/Header';
import { cn } from '@/lib/utils';
import type { ListItem, ListProps } from '@/types';

/**
 * ListItem型ガード関数
 */
const isListItem = (item: unknown): item is ListItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    typeof (item as ListItem).id === 'string'
  );
};

/**
 * 🎯 リストコンポーネント
 */
const List: React.FC<ListProps> = ({
  title,
  items,
  selectedItemId,
  loading = false,
  error,
  emptyState,
  showAddButton = false,
  addButtonText: _addButtonText = '追加',
  onAddClick,
  customHeaderAction,
  onItemClick,
  className,
  itemClassName,
  variant = 'default',
  headerVariant = 'default',
  headerLevel = 'h3',
}) => {
  // ローディング状態
  if (loading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {title && (
          <Header
            title={title}
            variant={headerVariant}
            headingLevel={headerLevel}
            rightAction={
              customHeaderAction ||
              (showAddButton && onAddClick ? (
                <Button onClick={onAddClick} size='sm' variant='ghost' className='h-8 w-8 p-0'>
                  <Plus className='h-4 w-4' />
                </Button>
              ) : null)
            }
          />
        )}
        <div className='flex justify-center py-8'>
          <LoadingSpinner size='sm' />
          <span className='ml-2 text-sm text-muted-foreground'>読み込み中...</span>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {title && (
          <Header
            title={title}
            rightAction={
              customHeaderAction ||
              (showAddButton && onAddClick ? (
                <Button onClick={onAddClick} size='sm' variant='ghost' className='h-8 w-8 p-0'>
                  <Plus className='h-4 w-4' />
                </Button>
              ) : null)
            }
          />
        )}
        <div className='text-center py-8'>
          <p className='text-sm text-destructive'>{error.message}</p>
        </div>
      </div>
    );
  }

  // 空状態
  if (items.length === 0 && emptyState) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {title && (
          <Header
            title={title}
            rightAction={
              customHeaderAction ||
              (showAddButton && onAddClick ? (
                <Button onClick={onAddClick} size='sm' variant='ghost' className='h-8 w-8 p-0'>
                  <Plus className='h-4 w-4' />
                </Button>
              ) : null)
            }
          />
        )}
        <div className='text-center py-8'>
          {typeof emptyState === 'string' ? (
            <p className='text-sm text-muted-foreground'>{emptyState}</p>
          ) : (
            emptyState
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ヘッダー - 完全統一 */}
      {title && (
        <Header
          title={title}
          rightAction={
            customHeaderAction ||
            (showAddButton && onAddClick ? (
              <Button onClick={onAddClick} size='sm' variant='ghost' className='h-8 w-8 p-0'>
                <Plus className='h-4 w-4' />
              </Button>
            ) : null)
          }
        />
      )}

      {/* リストアイテム */}
      <div className='flex-1 overflow-y-auto'>
        {items
          .map(item => {
            if (!isListItem(item)) {
              console.warn('Invalid list item:', item);
              return null;
            }
            return (
              <ListItemComponent
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onClick={() => onItemClick?.(item)}
                className={itemClassName}
                variant={
                  variant === 'detailed'
                    ? 'detailed'
                    : variant === 'compact'
                      ? 'compact'
                      : 'default'
                }
              />
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
};

/**
 * 🎯 リストアイテムコンポーネント
 */
interface ListItemComponentProps {
  item: ListItem;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

const ListItemComponent: React.FC<ListItemComponentProps> = ({
  item,
  isSelected = false,
  onClick,
  className,
  variant = 'default',
}) => {
  const handleClick = () => {
    if (item.isDisabled) return;
    if (item.onClick) {
      item.onClick();
    } else if (onClick) {
      onClick();
    }
  };

  const baseClasses = cn(
    'flex items-center gap-3 p-4 cursor-pointer transition-colors',
    'hover:bg-accent/50',
    {
      'bg-accent': isSelected,
      'opacity-50 cursor-not-allowed': item.isDisabled,
      'py-2': variant === 'compact',
      'py-6': variant === 'detailed',
    },
    className
  );

  return (
    <div className={baseClasses} onClick={handleClick}>
      {/* アイコン・アバター */}
      {item.avatar ? (
        <UserAvatar
          username={item.avatar.username}
          displayName={item.avatar.displayName || undefined}
          profileImageId={item.avatar.profileImageId || undefined}
          size='sm'
          className='w-10 h-10 flex-shrink-0'
        />
      ) : item.icon ? (
        <div className='flex-shrink-0 w-10 h-10 flex items-center justify-center'>{item.icon}</div>
      ) : null}

      {/* メインコンテンツ */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm font-medium truncate'>{item.title}</h4>
          {item.badge && (
            <span
              className={cn('text-xs px-2 py-1 rounded-full', {
                'bg-primary/10 text-primary': item.badge.variant === 'default',
                'bg-secondary text-secondary-foreground': item.badge.variant === 'secondary',
                'bg-destructive/10 text-destructive': item.badge.variant === 'destructive',
                'border border-border text-muted-foreground': item.badge.variant === 'outline',
              })}
            >
              {item.badge.text}
            </span>
          )}
        </div>
        {item.subtitle && (
          <p className='text-xs text-muted-foreground truncate mt-1'>{item.subtitle}</p>
        )}
        {item.description && variant !== 'compact' && (
          <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{item.description}</p>
        )}
      </div>

      {/* 右側コンテンツ - ヘッダーと同じサイズのコンテナ */}
      <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center'>
        {item.rightContent || <ChevronRight className='h-4 w-4 text-muted-foreground' />}
      </div>
    </div>
  );
};

export { List };
export default List;
