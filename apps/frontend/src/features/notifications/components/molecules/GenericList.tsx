/**
 * 🎯 汎用リストコンポーネント (Molecule)
 *
 * 責任:
 * - 任意のデータ配列をリスト表示
 * - アイテムのレンダリング関数を受け取る
 * - ページネーション、検索、フィルタリング対応
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { ListContainer } from '../atoms/ListContainer';
import { ListItem, type ListItemProps } from '../atoms/ListItem';

/**
 * 汎用リストのバリアント定義
 */
const genericListVariants = cva('', {
  variants: {
    variant: {
      default: '',
      compact: '',
      spacious: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface GenericListItem {
  id: string;
  [key: string]: unknown;
}

export interface GenericListProps<T extends GenericListItem>
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof genericListVariants> {
  /** データ配列 */
  items: T[];
  /** アイテムレンダリング関数 */
  renderItem: (item: T, index: number) => ListItemProps;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string | null;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** 空状態のアイコン */
  emptyIcon?: React.ReactNode;
  /** 最大表示件数 */
  maxItems?: number;
  /** アイテムクリック時のコールバック */
  onItemClick?: (item: T, index: number) => void;
  /** 最大高さ */
  maxHeight?: string;
  /** コンテナのバリアント */
  containerVariant?: 'default' | 'compact' | 'loose' | 'divided';
}

/**
 * 🎯 汎用リストコンポーネント
 */
export function GenericList<T extends GenericListItem>({
  items,
  renderItem,
  isLoading = false,
  error = null,
  emptyMessage = 'アイテムがありません',
  emptyIcon,
  maxItems,
  onItemClick,
  maxHeight,
  containerVariant = 'default',
  variant,
  className,
  ...props
}: GenericListProps<T>) {
  // 表示するアイテムを制限
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className={cn(genericListVariants({ variant }), className)} {...props}>
      <ListContainer
        isLoading={isLoading}
        error={error}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        maxHeight={maxHeight}
        variant={containerVariant}
      >
        {displayItems.map((item, index) => {
          const itemProps = renderItem(item, index);
          return (
            <ListItem
              key={item.id}
              {...itemProps}
              onItemClick={onItemClick ? () => onItemClick(item, index) : itemProps.onItemClick}
            />
          );
        })}

        {/* もっと見る表示 */}
        {maxItems && items.length > maxItems && (
          <div className='px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700'>
            <p className='text-xs text-center text-gray-500 dark:text-gray-400'>
              他 {items.length - maxItems} 件のアイテムがあります
            </p>
          </div>
        )}
      </ListContainer>
    </div>
  );
}

GenericList.displayName = 'GenericList';

export { genericListVariants };
