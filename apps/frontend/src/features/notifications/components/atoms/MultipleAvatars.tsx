/**
 * 🎯 複数アバター表示コンポーネント (Atom)
 *
 * 責任:
 * - 複数のユーザーアバターを重複表示
 * - X風のアバター配置とスタイリング
 * - アバター数制限と「+N」表示
 */

import React from 'react';

import { cn } from '../../../../lib/utils';

export interface Actor {
  id: string;
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
}

export interface MultipleAvatarsProps {
  actors: Actor[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  className?: string;
}

/**
 * サイズ設定
 */
const sizeConfig = {
  sm: {
    container: 'h-6 w-6',
    avatar: 'h-6 w-6',
    text: 'text-xs',
    overlap: '-ml-2',
  },
  md: {
    container: 'h-8 w-8',
    avatar: 'h-8 w-8',
    text: 'text-sm',
    overlap: '-ml-2',
  },
  lg: {
    container: 'h-10 w-10',
    avatar: 'h-10 w-10',
    text: 'text-base',
    overlap: '-ml-3',
  },
};

/**
 * 個別アバターコンポーネント
 */
const Avatar: React.FC<{
  actor: Actor;
  size: keyof typeof sizeConfig;
  className?: string;
}> = ({ actor, size, className }) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-900 flex-shrink-0',
        config.container,
        className
      )}
      title={actor.displayName || actor.username}
    >
      {actor.profileImageUrl ? (
        <img
          src={actor.profileImageUrl}
          alt={actor.displayName || actor.username}
          className='w-full h-full object-cover'
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center text-gray-500 font-medium',
            config.text
          )}
        >
          {(actor.displayName || actor.username)?.[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
};

/**
 * 「+N」表示コンポーネント
 */
const MoreIndicator: React.FC<{
  count: number;
  size: keyof typeof sizeConfig;
  className?: string;
}> = ({ count, size, className }) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0',
        config.container,
        className
      )}
      title={`他${count}人`}
    >
      <span className={cn('text-gray-700 dark:text-gray-300 font-medium', config.text)}>
        +{count}
      </span>
    </div>
  );
};

/**
 * 🎯 複数アバター表示コンポーネント
 */
export const MultipleAvatars: React.FC<MultipleAvatarsProps> = ({
  actors,
  size = 'md',
  maxVisible = 3,
  className,
}) => {
  const config = sizeConfig[size];

  if (actors.length === 0) {
    return null;
  }

  // 表示するアクターと残りの数を計算
  const visibleActors = actors.slice(0, maxVisible);
  const remainingCount = Math.max(0, actors.length - maxVisible);

  return (
    <div className={cn('flex items-center', className)}>
      {visibleActors.map((actor, index) => (
        <Avatar
          key={actor.id}
          actor={actor}
          size={size}
          className={index > 0 ? config.overlap : undefined}
        />
      ))}

      {remainingCount > 0 && (
        <MoreIndicator count={remainingCount} size={size} className={config.overlap} />
      )}
    </div>
  );
};
