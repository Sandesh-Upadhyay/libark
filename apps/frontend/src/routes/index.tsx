import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// レイアウトコンポーネント
import { ClientLayout } from '@/components/templates/ClientLayout';
import { ScrollToTop } from '@/components/templates/ScrollToTop';
import { Guard } from '@/features/auth/components/organisms/Guard';

// ページコンポーネント（遅延読み込み）
const HomePage = React.lazy(() => import('../pages/HomePage'));
const RegisterPage = React.lazy(() => import('../pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'));
const PostDetailPage = React.lazy(() => import('../pages/PostDetailPage'));
const NotificationsPage = React.lazy(() => import('../pages/NotificationsPage'));
const MessagesPage = React.lazy(() => import('../pages/MessagesPage'));
const WalletPage = React.lazy(() => import('../pages/WalletPage'));
const AdminPage = React.lazy(() => import('../pages/AdminPage'));
const SiteFeaturesPage = React.lazy(() => import('../pages/admin/SiteFeaturesPage'));
const UserPermissionsPage = React.lazy(() => import('../pages/admin/UserPermissionsPage'));
const AdminP2PDisputesPage = React.lazy(() => import('../pages/admin/p2p/disputes/index'));
const AdminP2PDisputeDetailPage = React.lazy(
  () => import('../pages/admin/p2p/disputes/[disputeId]/index')
);
const AdminP2PCurrenciesPage = React.lazy(() => import('../pages/admin/p2p/currencies/index'));
const ForgotPasswordPage = React.lazy(() => import('../pages/ForgotPasswordPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

// 設定サブページ
const AccountPage = React.lazy(() => import('../pages/settings/AccountPage'));
const DisplaySettingsPage = React.lazy(() => import('../pages/settings/DisplaySettingsPage'));
const SecuritySettingsPage = React.lazy(() => import('../pages/settings/SecuritySettingsPage'));

// ウォレットサブページ
const WithdrawPage = React.lazy(() => import('../pages/wallet/WithdrawPage'));
const DepositPage = React.lazy(() => import('../pages/wallet/DepositPage'));
const NOWPaymentsCryptoHistoryPage = React.lazy(
  () => import('../pages/wallet/NOWPaymentsCryptoHistoryPage')
);
const NOWPaymentsCryptoDetailPage = React.lazy(
  () => import('../pages/wallet/NOWPaymentsCryptoDetailPage')
);
const WithdrawalCryptoHistoryPage = React.lazy(
  () => import('../pages/wallet/WithdrawalCryptoHistoryPage')
);
const NOWPaymentsPage = React.lazy(() => import('../pages/wallet/NOWPaymentsPage'));
const TransactionsPage = React.lazy(() => import('../pages/wallet/TransactionsPage'));

// P2Pページ
const P2PMainPage = React.lazy(() => import('../pages/p2p/index'));
const P2PTradeDetailPage = React.lazy(() => import('../pages/p2p/trade/[tradeId]/index'));
const P2PTradeHistoryPage = React.lazy(() => import('../pages/p2p/history/index'));
const P2PSellerOfferPage = React.lazy(() => import('../pages/p2p/seller/index'));
const P2PSellerDashboardPage = React.lazy(() => import('../pages/p2p/seller/dashboard'));
const P2PSettingsPage = React.lazy(() => import('../pages/p2p/settings/index'));

// ローディングコンポーネント
const PageLoader = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary'></div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      {/* スクロール位置制御 */}
      <ScrollToTop
        enabled={true}
        excludePaths={[
          '/modal/*', // モーダル内のナビゲーション
          '/tabs/*', // タブ切り替え
        ]}
        debug={process.env.NODE_ENV === 'development'}
      />
      <Routes>
        {/* メインページ（登録ページ）- 独立レイアウト・ナビゲーション非表示 */}
        <Route index element={<RegisterPage />} />

        {/* パスワード忘れページ - 独立レイアウト */}
        <Route path='forgot-password' element={<ForgotPasswordPage />} />

        {/* メインレイアウト */}
        <Route path='/' element={<ClientLayout />}>
          {/* ホームページ（認証済みユーザー向け） */}
          <Route
            path='home'
            element={
              <Guard type='auth'>
                <HomePage />
              </Guard>
            }
          />

          {/* 投稿詳細ページ */}
          <Route path='posts/:id' element={<PostDetailPage />} />

          {/* 通知ページ（認証必要） */}
          <Route
            path='notifications'
            element={
              <Guard type='auth'>
                <NotificationsPage />
              </Guard>
            }
          />

          {/* メッセージページ（認証必要） */}
          <Route
            path='messages'
            element={
              <Guard type='auth'>
                <MessagesPage />
              </Guard>
            }
          />

          {/* ウォレットページ（認証必要・ネストルーティング） */}
          <Route path='wallet' element={<WalletPage />}>
            <Route path='deposit/crypto' element={<DepositPage />} />
            <Route path='deposit/crypto/history' element={<NOWPaymentsCryptoHistoryPage />} />
            <Route
              path='deposit/crypto/history/:paymentId'
              element={<NOWPaymentsCryptoDetailPage />}
            />
            <Route path='deposit/card' element={<NOWPaymentsPage />} />
            <Route path='withdraw' element={<WithdrawPage />} />
            <Route path='withdraw/crypto/history' element={<WithdrawalCryptoHistoryPage />} />
            <Route
              path='withdraw/crypto/history/:withdrawalId'
              element={<WithdrawalCryptoHistoryPage />}
            />
            <Route path='transactions' element={<TransactionsPage />} />

            {/* P2Pルート */}
            <Route path='p2p' element={<P2PMainPage />} />
            <Route path='p2p/trade/:tradeId' element={<P2PTradeDetailPage />} />
            <Route path='p2p/history' element={<P2PTradeHistoryPage />} />
            <Route path='p2p/seller' element={<P2PSellerOfferPage />} />
            <Route path='p2p/seller/dashboard' element={<P2PSellerDashboardPage />} />
            <Route path='p2p/settings' element={<P2PSettingsPage />} />
          </Route>

          {/* プロフィールページ */}
          <Route path='profile/:username' element={<ProfilePage />} />

          {/* 設定ページ（認証必要・ネストルーティング） */}
          <Route path='settings' element={<SettingsPage />}>
            <Route path='account' element={<AccountPage />} />
            <Route path='display' element={<DisplaySettingsPage />} />
            <Route path='security' element={<SecuritySettingsPage />} />
          </Route>

          {/* 管理者ページ（認証必要・管理者権限必要・ネストルーティング） */}
          <Route path='admin' element={<AdminPage />}>
            <Route path='site-features' element={<SiteFeaturesPage />} />
            <Route path='user-permissions' element={<UserPermissionsPage />} />
            <Route path='p2p/disputes' element={<AdminP2PDisputesPage />} />
            <Route path='p2p/disputes/:disputeId' element={<AdminP2PDisputeDetailPage />} />
            <Route path='p2p/currencies' element={<AdminP2PCurrenciesPage />} />
            {/* TODO: 他の管理ページを追加 */}
          </Route>

          {/* 404ページ */}
          <Route path='404' element={<NotFoundPage />} />

          {/* 存在しないパスは404にリダイレクト */}
          <Route path='*' element={<Navigate to='/404' replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
