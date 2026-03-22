/**
 * 💬 ユーザー検索入力コンポーネント (Molecule)
 *
 * 責任:
 * - リアルタイムユーザー検索
 * - ユーザー選択機能
 * - ドロップダウン表示
 *
 * 特徴:
 * - デバウンス機能付き検索
 * - ユーザー名・表示名での検索
 * - キーボードナビゲーション対応
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Search, Users, Check } from 'lucide-react';

import { Input } from '@/components/atoms';
import { LoadingSpinner } from '@/components/atoms';

import { SEARCH_USERS, type SearchUsersResponse, type User } from '../../messages';

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

/**
 * 💬 ユーザー検索入力コンポーネント
 *
 * リアルタイムでユーザーを検索し、選択可能なドロップダウンを表示
 *
 * 使用例:
 * ```tsx
 * <UserSearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onUserSelect={(user) => setSelectedUser(user)}
 *   placeholder="ユーザーを検索..."
 * />
 * ```
 */
export const UserSearchInput: React.FC<UserSearchInputProps> = ({
  value,
  onChange,
  onUserSelect,
  placeholder = 'ユーザーを検索...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // デバウンス機能
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // ユーザー検索クエリ
  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
  } = useQuery<SearchUsersResponse>(SEARCH_USERS, {
    variables: { search: debouncedQuery, first: 10 },
    skip: !debouncedQuery || debouncedQuery.length < 2,
    errorPolicy: 'all',
  });

  const users = searchData?.users?.edges?.map(edge => edge.node) || [];

  // 入力値変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
    setSelectedIndex(-1);
  };

  // ユーザー選択ハンドラー
  const handleUserSelect = (user: User | undefined) => {
    if (!user) return;
    onUserSelect(user);
    onChange(user.displayName || user.username);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < users.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < users.length) {
          handleUserSelect(users[selectedIndex] as any);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* 検索入力フィールド */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className='pl-10'
          autoComplete='off'
        />
        {searchLoading && (
          <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
            <LoadingSpinner size='sm' />
          </div>
        )}
      </div>

      {/* 検索結果ドロップダウン */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className='absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto'
        >
          {searchLoading ? (
            <div className='p-4 text-center'>
              <LoadingSpinner size='sm' />
              <p className='text-sm text-muted-foreground mt-2'>検索中...</p>
            </div>
          ) : searchError ? (
            <div className='p-4 text-center'>
              <p className='text-sm text-destructive'>検索エラーが発生しました</p>
            </div>
          ) : users.length === 0 ? (
            <div className='p-4 text-center'>
              <Users className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
              <p className='text-sm text-muted-foreground'>ユーザーが見つかりません</p>
            </div>
          ) : (
            <div className='py-1'>
              {users.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user as any)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center'>
                      <Users className='w-4 h-4 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2'>
                        <p className='text-sm font-medium truncate'>
                          {user.displayName || user.username}
                        </p>
                        {user.isVerified && <Check className='h-3 w-3 text-primary' />}
                      </div>
                      {user.displayName && (
                        <p className='text-xs text-muted-foreground truncate'>@{user.username}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// displayNameを設定
UserSearchInput.displayName = 'UserSearchInput';

// 型定義のexport
export type { UserSearchInputProps };
