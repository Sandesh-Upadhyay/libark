/**
 * 🎯 設定グループコンポーネント (Molecule)
 *
 * 責任:
 * - 複数の設定項目をグループ化
 * - 統一されたレイアウト
 * - 注意事項やヘルプの表示
 * - 責任分離
 */

import React from 'react';
import { type LucideProps } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { SettingItem } from '../atoms/SettingItem';


const settingGroupVariants = cva('space-y-6 sm:space-y-8', {
  variants: {
    variant: {
      default: '',
      card: 'p-4 rounded-lg bg-muted/30 border border-border/30',
      highlight: 'p-4 rounded-lg bg-primary/5 border border-primary/20',
    },
    spacing: {
      sm: 'space-y-4 sm:space-y-6',
      md: 'space-y-6 sm:space-y-8',
      lg: 'space-y-8 sm:space-y-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: 'md',
  },
});

export interface SettingGroupItem {
  /** 項目のID */
  id: string;
  /** 項目のタイトル */
  title: string;
  /** 項目の説明 */
  description?: string;
  /** 項目のアイコン */
  icon?: React.ComponentType<LucideProps>;
  /** アイコンのバリアント */
  iconVariant?: 'default' | 'muted' | 'success' | 'warning' | 'destructive';
  /** 右側のコントロール要素 */
  control?: React.ReactNode;
  /** 必須項目かどうか */
  required?: boolean;
  /** 無効状態かどうか */
  disabled?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
}

export interface SettingGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof settingGroupVariants> {
  /** グループのタイトル */
  title?: string;
  /** グループの説明 */
  description?: string;
  /** 設定項目のリスト */
  items: SettingGroupItem[];
  /** 注意事項のリスト */
  notes?: string[];
  /** 注意事項のタイトル */
  notesTitle?: string;
}

export const SettingGroup: React.FC<SettingGroupProps> = ({
  className,
  variant,
  spacing,
  title,
  description,
  items,
  notes,
  notesTitle,
  ...props
}) => {
  return (
    <div className={cn(settingGroupVariants({ variant, spacing }), className)} {...props}>
      {/* グループヘッダー */}
      {(title || description) && (
        <div className='space-y-2'>
          {title && <h4 className='text-lg font-semibold text-foreground'>{title}</h4>}
          {description && <p className='text-sm text-muted-foreground'>{description}</p>}
        </div>
      )}

      {/* 設定項目 */}
      <div className='space-y-3'>
        {items.map(item => (
          <SettingItem
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            iconVariant={item.iconVariant}
            control={item.control}
            required={item.required}
            disabled={item.disabled}
            onClick={item.onClick}
            variant='default'
          />
        ))}
      </div>

      {/* 注意事項 */}
      {notes && notes.length > 0 && (
        <div className='space-y-3 pt-4 border-t border-border/50'>
          {notesTitle && <h5 className='text-sm font-semibold text-foreground'>{notesTitle}</h5>}
          <ul className='space-y-3'>
            {notes.map((note, index) => (
              <li
                key={index}
                className='flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30'
              >
                <div className='w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0' />
                <p className='text-sm font-medium text-foreground'>{note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
