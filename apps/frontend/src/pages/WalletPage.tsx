import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

import { WalletActionButtonGroup } from '@/features/wallet/components/molecules';
import { type TransactionItem } from '@/features/wallet/components/molecules/TransactionTable';
import { WalletBalance } from '@/features/wallet/components/atoms';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { useWallet, useWalletTransactions, useTransactionConverter } from '@/features/wallet/hooks';
import { MOCK_BALANCE, MOCK_TRANSACTIONS, logWalletDebugInfo } from '@/data/mockWalletData';
import { useFeatures } from '@/hooks';

// 取引テーブルは初期表示に不要なため遅延読み込み
const TransactionTable = lazy(() =>
  import('@/features/wallet/components/molecules/TransactionTable').then(m => ({
    default: m.TransactionTable,
  }))
);

// 遅延読み込みでモーダルコンポーネントを最適化
const DepositModal = lazy(() =>
  import('@/features/wallet/components/organisms/DepositModal').then(module => ({
    default: module.DepositModal,
  }))
);
const WithdrawModal = lazy(() =>
  import('@/features/wallet/components/organisms/WithdrawModal').then(module => ({
    default: module.WithdrawModal,
  }))
);

/**
 * 🎯 ウォレットページ (リファクタリング版)
 *
 * 責任:
 * - ウォレット機能の統合表示
 * - 残高表示と取引履歴の管理
 * - 決済方法の提供
 * - HomePageスタイルの統一レイアウト使用
 *
 * 特徴:
 * - 右サイドバー非表示（PageLayoutTemplate使用）
 * - カードコンポーネント不使用（直接的なdivレイアウト）
 * - 共通コンポーネント活用（WalletBalance, TransactionTable等）
 * - HomePageと統一されたスタイリング
 */

/**
 * 🎯 ウォレットページコンポーネント
 */
const WalletPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 機能フラグチェック
  const { features, loading: featureLoading } = useFeatures();
  const canAccessWallet = features.WALLET_ACCESS;
  const canDeposit = features.WALLET_DEPOSIT;
  const canWithdraw = features.WALLET_WITHDRAW;

  // ウォレット情報とトランザクション履歴を取得
  const { wallet, loading: walletLoading } = useWallet();
  const { transactions, loading: transactionsLoading } = useWalletTransactions();

  // サブページかどうかを判定
  const isSubPage = location.pathname !== '/wallet';

  // モーダル状態
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // モーダル制御（パフォーマンス最適化）
  const closeDepositModal = useCallback(() => setIsDepositModalOpen(false), []);
  const closeWithdrawModal = useCallback(() => setIsWithdrawModalOpen(false), []);

  // 決済方法の処理（パフォーマンス最適化）
  const handleCryptoDeposit = useCallback(() => {
    navigate('/wallet/deposit/crypto');
  }, [navigate]);

  const handleCardDeposit = useCallback(() => {
    navigate('/wallet/deposit/card');
  }, [navigate]);

  const handleP2PDeposit = useCallback(() => {
    navigate('/wallet/p2p');
  }, [navigate]);

  const handleWithdraw = useCallback(() => {
    navigate('/wallet/withdraw');
  }, [navigate]);

  // 取引データの変換（カスタムフック使用）- 空配列の場合の最適化
  const convertedTransactions = useTransactionConverter(transactions || []);

  // 表示用の取引データ（DBから取得したデータを使用、フォールバックでモックデータ）
  const displayTransactions = useMemo(() => {
    // 実際のデータがある場合は変換されたデータを使用、なければモックデータ
    return convertedTransactions.length > 0 ? convertedTransactions : MOCK_TRANSACTIONS;
  }, [convertedTransactions]);

  // デバッグ用ログ（開発環境のみ）- パフォーマンス最適化のため条件付き実行
  if (process.env.NODE_ENV === 'development') {
    logWalletDebugInfo(wallet, transactions || [], walletLoading, transactionsLoading);
  }

  // 取引クリック処理（パフォーマンス最適化）
  const handleTransactionClick = useCallback(
    (transaction: TransactionItem) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('📊 取引詳細表示:', transaction);
      }
      // 取引履歴ページに遷移
      navigate('/wallet/transactions');
    },
    [navigate]
  );

  // サブページの場合はOutletを表示
  if (isSubPage) {
    return (
      <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
        <Outlet />
      </PageLayoutTemplate>
    );
  }

  // ウォレット機能が無効な場合
  if (!featureLoading && !canAccessWallet) {
    return (
      <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
        <div role='main' aria-label='ウォレット管理'>
          <Header title='ウォレット' />
          <div className='flex flex-col items-center justify-center min-h-[400px] p-8'>
            <div className='text-center'>
              <CreditCard className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
              <h2 className='text-xl font-semibold mb-2'>ウォレット機能は現在無効です</h2>
              <p className='text-muted-foreground'>
                ウォレット機能は現在利用できません。管理者にお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  return (
    <>
      <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
        {/* ウォレットコンテンツ - HomePageスタイル */}
        <div role='main' aria-label='ウォレット管理'>
          {/* メインヘッダー - 設定ページと統一 */}
          <Header title='ウォレット' />

          {/* 残高セクション */}
          <div className='bg-background border-b border-border/30'>
            <div className='p-4'>
              <p className='text-sm text-muted-foreground mb-2'>利用可能残高</p>
              <WalletBalance
                amount={wallet?.balanceUsd ?? MOCK_BALANCE}
                currency='USD'
                size='3xl'
                variant='primary'
                // align='left' // alignプロパティを削除
              />
            </div>
          </div>

          {/* アクションボタン */}
          <div className='bg-background border-b border-border/30'>
            <Header title='入金・出金' />
            <div className='p-4'>
              <p className='text-sm text-muted-foreground mb-4'>
                暗号通貨やクレジットカードで入金、または出金ができます
              </p>
              <WalletActionButtonGroup
                onCryptoDeposit={canDeposit ? handleCryptoDeposit : () => {}}
                onCardDeposit={canDeposit ? handleCardDeposit : () => {}}
                onP2PDeposit={canDeposit ? handleP2PDeposit : () => {}}
                onWithdraw={canWithdraw ? handleWithdraw : () => {}}
                layout='responsive'
                spacing='md'
              />
            </div>
          </div>

          {/* 取引履歴 */}
          <div>
            <Header title='取引履歴' />
            <div className='p-4'>
              <p className='text-sm text-muted-foreground mb-4'>
                過去の入金・出金・決済履歴を確認できます
              </p>
              <Suspense
                fallback={
                  <div className='p-4 text-sm text-muted-foreground'>取引履歴を読み込み中...</div>
                }
              >
                <TransactionTable
                  transactions={displayTransactions}
                  initialPageSize={10}
                  onTransactionClick={handleTransactionClick}
                  isLoading={transactionsLoading || walletLoading}
                  emptyMessage='取引履歴がありません'
                />
              </Suspense>
            </div>
          </div>
        </div>
      </PageLayoutTemplate>

      {/* モーダル - 遅延読み込み最適化 */}
      <Suspense fallback={null}>
        {isDepositModalOpen && (
          <DepositModal isOpen={isDepositModalOpen} onClose={closeDepositModal} />
        )}
        {isWithdrawModalOpen && (
          <WithdrawModal isOpen={isWithdrawModalOpen} onClose={closeWithdrawModal} />
        )}
      </Suspense>
    </>
  );
};

export default WalletPage;
