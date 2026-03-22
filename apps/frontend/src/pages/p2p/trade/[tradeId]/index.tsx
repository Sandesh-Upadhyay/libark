import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useP2PTradeRequestQuery,
  useAcceptP2PTradeRequestMutation,
  useConfirmP2PPaymentReceivedMutation,
  useMarkP2PPaymentSentMutation,
  useCancelP2PTradeRequestMutation,
  useCreateP2PDisputeMutation,
} from '@libark/graphql-client';

import { useP2PSubscription } from '@/features/wallet/hooks/useP2PSubscription';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { P2PTradeProgress } from '@/features/wallet/components/organisms/P2PTradeProgress';
import { P2PTradeCard } from '@/features/wallet/components/molecules/P2PTradeCard';
import { P2PPaymentInfo } from '@/features/wallet/components/molecules/P2PPaymentInfo';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Textarea } from '@/components/atoms/textarea';
import { Label } from '@/components/atoms/label';
import { toast } from '@/lib/toast';
import { useUser } from '@/hooks';

export default function P2PTradeDetailPage() {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  // クエリ
  const { data, loading, error, refetch } = useP2PTradeRequestQuery({
    variables: { tradeId: tradeId! },
    skip: !tradeId,
  });

  // リアルタイム更新のサブスクリプション
  useP2PSubscription({
    userId: user?.id || '',
    enabled: !!user?.id && !!tradeId,
    onTradeUpdate: (updatedTrade) => {
      // 表示中の取引が更新された場合のみリフレッシュ
      if (updatedTrade.id === tradeId) {
        refetch();
        toast.info('取引ステータスが更新されました');
      }
    },
  });

  // ミューテーション
  const [acceptTrade, { loading: acceptLoading }] = useAcceptP2PTradeRequestMutation();
  const [confirmPayment, { loading: confirmLoading }] = useConfirmP2PPaymentReceivedMutation();
  const [markPaymentSent, { loading: markPaymentLoading }] = useMarkP2PPaymentSentMutation();
  const [cancelTrade, { loading: cancelLoading }] = useCancelP2PTradeRequestMutation();
  const [createDispute, { loading: disputeLoading }] = useCreateP2PDisputeMutation();

  const trade = data?.p2pTradeRequest;

  // ユーザーの役割を判定
  const isBuyer = trade?.buyerId === user?.id;
  const isSeller = trade?.sellerId === user?.id;

  // 取引を承認（売り手）
  const handleAcceptTrade = useCallback(async () => {
    if (!tradeId) return;

    try {
      await acceptTrade({
        variables: { tradeId },
      });
      toast.success('取引を承認しました');
      refetch();
    } catch (err) {
      console.error('取引承認エラー:', err);
      toast.error('取引の承認に失敗しました');
    }
  }, [tradeId, acceptTrade, refetch]);

  // 支払い完了を通知（買い手）
  const handleMarkPaymentSent = useCallback(async () => {
    if (!tradeId) return;

    try {
      await markPaymentSent({
        variables: { tradeId },
      });
      toast.success('支払い完了を通知しました');
      refetch();
    } catch (err) {
      console.error('支払い完了通知エラー:', err);
      toast.error('支払い完了の通知に失敗しました');
    }
  }, [tradeId, markPaymentSent, refetch]);

  // 支払い受領を確認（売り手）
  const handleConfirmPayment = useCallback(async () => {
    if (!tradeId) return;

    try {
      await confirmPayment({
        variables: {
          input: {
            tradeId,
            paymentDetails: JSON.stringify({ confirmed: true }),
          },
        },
      });
      toast.success('支払いを確認しました。取引が完了しました。');
      refetch();
    } catch (err) {
      console.error('支払い確認エラー:', err);
      toast.error('支払いの確認に失敗しました');
    }
  }, [tradeId, confirmPayment, refetch]);

  // 取引をキャンセル
  const handleCancelTrade = useCallback(async () => {
    if (!tradeId) return;

    if (!confirm('本当にこの取引をキャンセルしますか？')) return;

    try {
      await cancelTrade({
        variables: { tradeId },
      });
      toast.success('取引をキャンセルしました');
      navigate('/wallet/p2p/history');
    } catch (err) {
      console.error('取引キャンセルエラー:', err);
      toast.error('取引のキャンセルに失敗しました');
    }
  }, [tradeId, cancelTrade, navigate]);

  // 紛争を作成
  const handleCreateDispute = useCallback(async () => {
    if (!tradeId || !disputeReason.trim()) {
      toast.error('紛争の理由を入力してください');
      return;
    }

    try {
      await createDispute({
        variables: {
          input: {
            tradeId,
            reason: disputeReason,
            evidence: disputeEvidence || undefined,
          },
        },
      });
      toast.success('紛争を作成しました。管理者が確認します。');
      setIsDisputeDialogOpen(false);
      setDisputeReason('');
      setDisputeEvidence('');
      refetch();
    } catch (err) {
      console.error('紛争作成エラー:', err);
      toast.error('紛争の作成に失敗しました');
    }
  }, [tradeId, disputeReason, disputeEvidence, createDispute, refetch]);

  // 期限切れハンドリング
  const handleExpire = useCallback(() => {
    toast.error('取引の期限が切れました');
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
        <div role='main' aria-label='取引詳細'>
          <Header title='取引詳細' />
          <div className='space-y-6'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-48 w-full' />
            <Skeleton className='h-24 w-full' />
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  if (error || !trade) {
    return (
      <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
        <div role='main' aria-label='取引詳細'>
          <Header title='取引詳細' />
          <div className='text-center py-12'>
            <p className='text-muted-foreground mb-4'>取引が見つかりません</p>
            <Button onClick={() => navigate('/wallet/p2p/history')}>
              履歴に戻る
            </Button>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  const isLoading = acceptLoading || confirmLoading || markPaymentLoading || cancelLoading;

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='取引詳細'>
        <Header
          title='取引詳細'
          subtitle={`取引ID: ${trade.id.slice(0, 8)}...`}
        />

        <div className='space-y-6'>
          {/* 取引カード */}
          <P2PTradeCard trade={trade} />

          {/* 進行状況 */}
          <P2PTradeProgress
            trade={trade}
            onExpire={handleExpire}
            onDispute={() => setIsDisputeDialogOpen(true)}
          />

          {/* 支払い情報（MATCHEDまたはPAYMENT_SENT状態の場合） */}
          {['MATCHED', 'PAYMENT_SENT'].includes(trade.status) && (
            <P2PPaymentInfo trade={trade} />
          )}

          {/* アクションボタン */}
          <div className='border-t border-border pt-6 space-y-4'>
            {/* 売り手：取引を承認 */}
            {isSeller && trade.status === 'PENDING' && (
              <Button
                onClick={handleAcceptTrade}
                loading={acceptLoading}
                disabled={isLoading}
                className='w-full'
                size='lg'
              >
                取引を承認する
              </Button>
            )}

            {/* 買い手：支払い完了を通知 */}
            {isBuyer && trade.status === 'MATCHED' && (
              <Button
                onClick={handleMarkPaymentSent}
                loading={markPaymentLoading}
                disabled={isLoading}
                className='w-full'
                size='lg'
              >
                支払いを完了しました
              </Button>
            )}

            {/* 売り手：支払い受領を確認 */}
            {isSeller && trade.status === 'PAYMENT_SENT' && (
              <Button
                onClick={handleConfirmPayment}
                loading={confirmLoading}
                disabled={isLoading}
                className='w-full bg-green-600 hover:bg-green-700'
                size='lg'
              >
                支払いを確認しました
              </Button>
            )}

            {/* キャンセルボタン（PENDING/MATCHED状態のみ） */}
            {['PENDING', 'MATCHED'].includes(trade.status) && (
              <Button
                onClick={handleCancelTrade}
                loading={cancelLoading}
                disabled={isLoading}
                variant='outline'
                className='w-full border-destructive text-destructive hover:bg-destructive/10'
                size='lg'
              >
                取引をキャンセル
              </Button>
            )}
          </div>
        </div>

        {/* 紛争作成ダイアログ */}
        <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>問題を報告する</DialogTitle>
              <DialogDescription>
                支払いを行ったにもかかわらず売り手が確認しない場合、紛争を作成できます。
                管理者が確認し、解決します。
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div>
                <Label htmlFor='dispute-reason'>理由 *</Label>
                <Textarea
                  id='dispute-reason'
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder='紛争の理由を詳しく説明してください'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor='dispute-evidence'>証拠（任意）</Label>
                <Textarea
                  id='dispute-evidence'
                  value={disputeEvidence}
                  onChange={e => setDisputeEvidence(e.target.value)}
                  placeholder='振込明細のスクリーンショットのURLなど'
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsDisputeDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCreateDispute}
                loading={disputeLoading}
                disabled={!disputeReason.trim()}
                variant='destructive'
              >
                紛争を作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayoutTemplate>
  );
}
