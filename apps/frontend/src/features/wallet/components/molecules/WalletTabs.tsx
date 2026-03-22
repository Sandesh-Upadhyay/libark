'use client';

import React from 'react';
import { useAuth } from '@libark/graphql-client';

import { TabNavigation } from '@/components/atoms/tabs/TabNavigation';
import { TabContent } from '@/components/atoms/tabs/TabContent';
import { useTabs, createTypedTabs } from '@/hooks/tabs';
import type { WalletTabType } from '@/types';

import { WalletBalance } from '../atoms/WalletBalance';

// ============================================================================
// TYPES
// ============================================================================

interface WalletTabsProps {
  /** ウォレット残高 */
  walletBalance: number;
  /** 売上残高 */
  salesBalance?: number;
  /** P2P残高 */
  p2pBalance?: number;
  /** 通貨単位 */
  currency?: string;
  /** デフォルトのアクティブタブ */
  defaultTab?: WalletTabType;
  /** 残高クリック時のハンドラー */
  onBalanceClick?: (tabType: string) => void;
  /** 追加のCSSクラス */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ウォレット用タブコンポーネント
 *
 * 責任:
 * - ウォレットタブの定義と管理
 * - ユーザーロールに基づくタブ表示制御
 * - 残高情報の表示
 *
 * 特徴:
 * - ウォレット機能に特化した設計
 * - ロールベースのタブフィルタリング
 * - 型安全なタブ管理
 *
 * @example
 * ```tsx
 * <WalletTabs
 *   walletBalance={1000}
 *   salesBalance={500}
 *   currency="USD"
 *   onBalanceClick={(tab) => console.log(tab)}
 * />
 * ```
 */
export const WalletTabs: React.FC<WalletTabsProps> = ({
  walletBalance,
  salesBalance,
  p2pBalance,
  currency = 'USD',
  defaultTab = 'wallet',
  onBalanceClick,
  className,
}) => {
  const { user } = useAuth();

  // タブ状態管理
  const { activeTab, handleTabChange } = useTabs({
    defaultTab,
  });

  // ユーザーロールに基づいて利用可能なタブを決定
  const availableTabs = React.useMemo(() => {
    const tabs: Array<{ value: WalletTabType; label: string; balance: number; icon: any }> = [
      { value: 'wallet' as const, label: 'ウォレット', balance: walletBalance, icon: undefined },
    ];

    const userWithRole = user as { role?: 'SELLER' | 'P2P_SELLER' | 'ADMIN' | 'USER' };
    if (
      user &&
      'role' in user &&
      (userWithRole.role === 'SELLER' || userWithRole.role === 'ADMIN') &&
      salesBalance !== undefined
    ) {
      tabs.push({
        value: 'sales' as const,
        label: '売上',
        balance: salesBalance,
        icon: undefined,
      });
    }

    if (
      user &&
      'role' in user &&
      (userWithRole.role === 'P2P_SELLER' || userWithRole.role === 'ADMIN') &&
      p2pBalance !== undefined
    ) {
      tabs.push({ value: 'p2p' as const, label: 'P2P', balance: p2pBalance, icon: undefined });
    }

    return tabs;
  }, [user, walletBalance, salesBalance, p2pBalance]);

  // タブコンポーネント用のタブ定義
  const tabs = createTypedTabs(
    Object.fromEntries(availableTabs.map(tab => [tab.value, { label: tab.label }])) as Record<
      WalletTabType,
      { label: string }
    >
  );

  return (
    <div className={className}>
      {/* タブナビゲーション */}
      <TabNavigation tabs={tabs as any} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* タブコンテンツ */}
      <div className='w-full'>
        {availableTabs.map(tab => (
          <TabContent key={tab.value} value={tab.value} activeTab={activeTab} className='space-y-4'>
            <div className='text-center'>
              <WalletBalance
                amount={tab.balance}
                currency={currency}
                onClick={() => onBalanceClick?.(tab.value)}
                className='cursor-pointer hover:text-primary transition-colors'
              />
              <span className='text-sm text-muted-foreground mt-1'>{tab.label}残高</span>
            </div>
          </TabContent>
        ))}
      </div>
    </div>
  );
};

export default WalletTabs;
