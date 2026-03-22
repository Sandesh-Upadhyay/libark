/**
 * 🎯 ウォレット管理コンポーネント (Molecule)
 *
 * 責任:
 * - 登録済みウォレットの表示・選択
 * - 新規ウォレットの追加
 * - ウォレットの編集・削除
 */

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
} from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';

import { CurrencyIcon, type CurrencyType } from '../atoms/CurrencyIcon';

/**
 * ウォレット管理のバリアント定義（シンプル版）
 */
const walletManagerVariants = cva('w-full space-y-4', {
  variants: {
    variant: {
      default: '',
      compact: 'space-y-3',
      minimal: 'space-y-3',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface UserWallet {
  id: string;
  walletName: string;
  currency: string;
  network: string;
  address: string;
  isVerified: boolean;
}

export interface WalletManagerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof walletManagerVariants> {
  /** 登録済みウォレット一覧 */
  userWallets: UserWallet[];
  /** 選択されたウォレット */
  selectedWallet?: UserWallet;
  /** ウォレット選択時のコールバック */
  onWalletSelect: (wallet: UserWallet) => void;
  /** 新規ウォレット追加時のコールバック */
  onWalletAdd: (wallet: Omit<UserWallet, 'id' | 'isVerified'>) => Promise<void>;
  /** ウォレット更新時のコールバック */
  onWalletUpdate: (id: string, wallet: Partial<UserWallet>) => Promise<void>;
  /** ウォレット削除時のコールバック */
  onWalletDelete: (id: string) => Promise<void>;
  /** 現在選択中の通貨 */
  selectedCurrency: string;
  /** 現在選択中のネットワーク */
  selectedNetwork: string;
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * 🎯 ウォレット管理コンポーネント
 */
export const WalletManager = React.forwardRef<HTMLDivElement, WalletManagerProps>(
  (
    {
      userWallets,
      selectedWallet,
      onWalletSelect,
      onWalletAdd,
      onWalletUpdate: _onWalletUpdate,
      onWalletDelete,
      selectedCurrency,
      selectedNetwork,
      isLoading = false,
      variant,
      className,
      ...props
    },
    ref
  ) => {
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [, setEditingWalletId] = useState<string | null>(null);
    const [newWallet, setNewWallet] = useState({
      walletName: '',
      address: '',
    });

    // 現在の通貨・ネットワークに対応するウォレット
    const compatibleWallets = (userWallets || []).filter(
      wallet => wallet.currency === selectedCurrency && wallet.network === selectedNetwork
    );

    // 新規ウォレット追加
    const handleAddWallet = async () => {
      if (!newWallet.walletName.trim() || !newWallet.address.trim()) {
        toast.error('ウォレット名とアドレスを入力してください');
        return;
      }

      try {
        await onWalletAdd({
          walletName: newWallet.walletName,
          currency: selectedCurrency,
          network: selectedNetwork,
          address: newWallet.address,
        });

        setNewWallet({ walletName: '', address: '' });
        setIsAddingWallet(false);
        toast.success('ウォレットを追加しました');
      } catch {
        toast.error('ウォレットの追加に失敗しました');
      }
    };

    // ウォレット削除
    const handleDeleteWallet = async (id: string) => {
      try {
        await onWalletDelete(id);
        toast.success('ウォレットを削除しました');
      } catch {
        toast.error('ウォレットの削除に失敗しました');
      }
    };

    return (
      <div ref={ref} className={cn(walletManagerVariants({ variant }), className)} {...props}>
        <div
          className={cn(
            'transition-all duration-300 rounded-lg',
            variant === 'minimal'
              ? 'border bg-background p-4'
              : 'bg-card border border-border shadow-sm'
          )}
        >
          {variant === 'minimal' ? (
            // Minimal variant content
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CurrencyIcon currency={selectedCurrency as CurrencyType} size='xs' />
                  <span className='text-sm font-medium'>送金元ウォレット</span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsAddingWallet(true)}
                  disabled={isLoading}
                >
                  <Plus className='h-4 w-4 mr-1' />
                  追加
                </Button>
              </div>

              {/* 既存ウォレット選択 */}
              {compatibleWallets.length > 0 && (
                <div className='space-y-2'>
                  <Label>登録済みウォレット</Label>
                  <Select
                    value={selectedWallet?.id || ''}
                    onValueChange={value => {
                      const wallet = compatibleWallets.find(w => w.id === value);
                      if (wallet) onWalletSelect(wallet);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='ウォレットを選択' />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleWallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm'>{wallet.walletName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 選択されたウォレットの詳細 */}
              {selectedWallet && !isAddingWallet && (
                <div className='border p-3 bg-muted/30 rounded-lg'>
                  <div className='flex justify-between items-start'>
                    <div className='space-y-1'>
                      <span className='text-sm font-medium'>{selectedWallet.walletName}</span>
                      <span className='text-xs text-muted-foreground font-mono break-all'>
                        {selectedWallet.address}
                      </span>
                    </div>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditingWalletId(selectedWallet.id)}
                      >
                        <Edit2 className='h-3 w-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteWallet(selectedWallet.id)}
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 新規ウォレット追加フォーム */}
              {isAddingWallet && (
                <div className='border border-dashed p-3 bg-background rounded-lg'>
                  <div className='space-y-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='wallet-name'>ウォレット名</Label>
                      <Input
                        id='wallet-name'
                        placeholder='例: MetaMask'
                        value={newWallet.walletName}
                        onChange={e =>
                          setNewWallet(prev => ({ ...prev, walletName: e.target.value }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='wallet-address'>ウォレットアドレス</Label>
                      <Input
                        id='wallet-address'
                        placeholder='あなたのウォレットアドレス'
                        value={newWallet.address}
                        onChange={e => setNewWallet(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Button size='sm' onClick={handleAddWallet} disabled={isLoading}>
                        <Check className='h-4 w-4 mr-1' />
                        保存
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setIsAddingWallet(false);
                          setNewWallet({ walletName: '', address: '' });
                        }}
                      >
                        <X className='h-4 w-4 mr-1' />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 対応ウォレットがない場合 */}
              {compatibleWallets.length === 0 && !isAddingWallet && (
                <div className='text-center py-4'>
                  <span className='text-sm text-muted-foreground'>
                    {selectedCurrency} ({selectedNetwork}) 対応のウォレットがありません
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-2'
                    onClick={() => setIsAddingWallet(true)}
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    ウォレットを追加
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Default Card structure
            <>
              <CardHeader>
                <CardTitle className='text-sm flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CurrencyIcon currency={selectedCurrency as CurrencyType} size='xs' />
                    送金元ウォレット
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsAddingWallet(true)}
                    disabled={isLoading}
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    追加
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Original Card content */}
                {compatibleWallets.length > 0 && (
                  <div className='space-y-2'>
                    <Label>登録済みウォレット</Label>
                    <Select
                      value={selectedWallet?.id || ''}
                      onValueChange={value => {
                        const wallet = compatibleWallets.find(w => w.id === value);
                        if (wallet) onWalletSelect(wallet);
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='ウォレットを選択' />
                      </SelectTrigger>
                      <SelectContent>
                        {compatibleWallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className='flex items-center gap-2'>
                              <div className='text-sm'>{wallet.walletName}</div>
                              {wallet.isVerified && (
                                <Badge variant='secondary' className='text-xs'>
                                  認証済み
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedWallet && (
                  <Card className='bg-muted/50'>
                    <CardContent className='pt-3 space-y-2'>
                      <div className='flex justify-between items-start'>
                        <div className='space-y-1'>
                          <div className='text-sm font-medium'>{selectedWallet.walletName}</div>
                          <div className='text-xs text-muted-foreground font-mono break-all'>
                            {selectedWallet.address}
                          </div>
                        </div>
                        <div className='flex gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setEditingWalletId(selectedWallet.id)}
                          >
                            <Edit2 className='h-3 w-3' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteWallet(selectedWallet.id)}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isAddingWallet && (
                  <Card className='border-dashed'>
                    <CardContent className='pt-4 space-y-3'>
                      <div className='space-y-2'>
                        <Label htmlFor='wallet-name'>ウォレット名</Label>
                        <Input
                          id='wallet-name'
                          placeholder='例: MetaMask'
                          value={newWallet.walletName}
                          onChange={e =>
                            setNewWallet(prev => ({ ...prev, walletName: e.target.value }))
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='wallet-address'>ウォレットアドレス</Label>
                        <Input
                          id='wallet-address'
                          placeholder='あなたのウォレットアドレス'
                          value={newWallet.address}
                          onChange={e =>
                            setNewWallet(prev => ({ ...prev, address: e.target.value }))
                          }
                        />
                      </div>
                      <div className='flex gap-2'>
                        <Button size='sm' onClick={handleAddWallet} disabled={isLoading}>
                          <Check className='h-4 w-4 mr-1' />
                          保存
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setIsAddingWallet(false);
                            setNewWallet({ walletName: '', address: '' });
                          }}
                        >
                          <X className='h-4 w-4 mr-1' />
                          キャンセル
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {compatibleWallets.length === 0 && !isAddingWallet && (
                  <div className='text-center py-4'>
                    <div className='text-sm text-muted-foreground'>
                      {selectedCurrency} ({selectedNetwork}) 対応のウォレットがありません
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-2'
                      onClick={() => setIsAddingWallet(true)}
                    >
                      <Plus className='h-4 w-4 mr-1' />
                      ウォレットを追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </div>
      </div>
    );
  }
);

WalletManager.displayName = 'WalletManager';

export { walletManagerVariants };
