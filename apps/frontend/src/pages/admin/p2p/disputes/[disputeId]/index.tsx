/**
 * 🎯 P2P紛争詳細・解決ページ (Admin)
 *
 * 責任:
 * - 紛争の詳細情報の表示
 * - 当事者の主張・証拠の確認
 * - 紛争の解決（裁定）
 */

'use client';

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useAdminP2PDisputeQuery,
  useResolveP2PDisputeMutation,
  P2PDisputeStatus,
} from '@libark/graphql-client';
import {
  ShieldAlert,
  Gavel,
  DollarSign,
  Briefcase,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Header } from '@/components/molecules';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Textarea } from '@/components/atoms/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Skeleton } from '@/components/atoms/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';

const getStatusLabel = (status: P2PDisputeStatus) => {
  switch (status) {
    case P2PDisputeStatus.Open:
      return '未解決';
    case P2PDisputeStatus.UnderReview:
      return '審査中';
    case P2PDisputeStatus.ResolvedBuyerWin:
      return '解決（買い手勝利）';
    case P2PDisputeStatus.ResolvedSellerWin:
      return '解決（売り手勝利）';
    case P2PDisputeStatus.ResolvedSplit:
      return '解決（分割）';
    case P2PDisputeStatus.Closed:
      return '終了';
    default:
      return status;
  }
};

const AdminP2PDisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();

  const [resolutionStatus, setResolutionStatus] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data, loading, error, refetch } = useAdminP2PDisputeQuery({
    variables: { disputeId: disputeId! },
    skip: !disputeId,
  });

  const [resolveDispute, { loading: resolving }] = useResolveP2PDisputeMutation({
    onCompleted: () => {
      toast.success('紛争を解決しました');
      refetch();
    },
    onError: (err) => {
      toast.error(`解決に失敗しました: ${err.message}`);
    },
  });

  const handleResolve = async () => {
    if (!disputeId || !resolutionStatus) return;

    if (!confirm('この内容で紛争を解決しますか？この操作は取り消せません。')) {
      return;
    }

    await resolveDispute({
      variables: {
        input: {
          disputeId,
          resolution: resolutionStatus as P2PDisputeStatus,
          notes: resolutionNotes,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className='p-8 space-y-4'>
        <Skeleton className='h-8 w-1/3' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (error || !data?.p2pDispute) {
    return (
      <div className='p-8 text-center'>
        <p className='text-destructive mb-4'>紛争情報の取得に失敗しました</p>
        <Button onClick={() => navigate('/admin/p2p/disputes')}>一覧に戻る</Button>
      </div>
    );
  }

  const dispute = data.p2pDispute;
  const trade = dispute.trade!; // p2pDispute query currently doesn't include trade in generated types due to fragment? Check schema.
  // Actually, standard p2pDispute query in schema returns P2PDispute which has trade.
  // But my query definition only included ...P2PDisputeInfo.
  // P2PDisputeInfo fragment does NOT include trade detail, only tradeId.
  // Wait, I need to check `packages/graphql-client/src/fragments/p2p.graphql`.

  // Checking Step 523:
  // fragment P2PDisputeInfo on P2PDispute { ... tradeId ... initiator ... }
  // It does NOT include `trade { ... }`.

  // But wait, the admin query `AdminP2PDisputes` I added in Step 603 INCLUDES trade.
  // However, here I am using `useP2PDisputeQuery` (step 526 definition).
  // Step 526: query P2PDispute { p2pDispute { ...P2PDisputeInfo } }
  // So it DOES NOT fetch trade details.

  // I need to update `P2PDispute` query to fetch trade details too, OR create a new `AdminP2PDispute` query.
  // Since `P2PDispute` query is also used by users (maybe?), user might not need detailed trade if they are on trade page.
  // But for Admin Detail page, I absolutely need trade info.

  // I should use `p2pTradeRequest(tradeId: dispute.tradeId)` to fetch trade details separately, OR update the P2PDispute query.
  // Let's assume for now I will fix the query or use separate query.
  // Actually, I can just update `packages/graphql-client/src/queries/p2p.graphql` to include trade in `P2PDispute` query.
  // Or better, define `query AdminP2PDispute($disputeId: UUID!)` in `admin.graphql`.

  return (
    <div className='flex flex-col h-full overflow-y-auto pb-10'>
      <Header
        title='紛争詳細'
        variant='x-style'
        headingLevel='h2'
        showBorder={true}
        showBackButton={true}
        onBackClick={() => navigate('/admin/p2p/disputes')}
      />

      <div className='container mx-auto p-4 space-y-6 max-w-4xl'>
        {/* ステータスバナー */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          dispute.status === 'OPEN' ? 'bg-destructive/10 border border-destructive/20' :
          dispute.status === 'UNDER_REVIEW' ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200' :
          'bg-green-100 dark:bg-green-900/20 border-green-200'
        }`}>
          <div className='flex items-center gap-3'>
            <ShieldAlert className='h-6 w-6' />
            <div>
              <h3 className='font-bold text-lg'>ステータス: {getStatusLabel(dispute.status)}</h3>
              <p className='text-sm opacity-80'>ID: {dispute.id}</p>
            </div>
          </div>
          <div className='text-right text-sm'>
            <div>作成日: {format(new Date(dispute.createdAt), 'yyyy/MM/dd HH:mm')}</div>
          </div>
        </div>

        {/* 紛争内容 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5' />
              申立内容
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>申立人</div>
              <div className='flex items-center gap-2 p-2 bg-muted/30 rounded border'>
                <UserAvatar user={dispute.initiator} size='sm' />
                <span className='font-bold'>{dispute.initiator.displayName}</span>
                <span className='text-muted-foreground text-sm'>@{dispute.initiator.username}</span>
              </div>
            </div>

            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>理由</div>
              <div className='p-3 bg-muted/30 rounded border text-lg'>
                {dispute.reason}
              </div>
            </div>

            {dispute.evidence && (
              <div>
                <div className='text-sm font-medium text-muted-foreground mb-1'>証拠</div>
                <div className='p-3 bg-muted/30 rounded border whitespace-pre-wrap'>
                  {dispute.evidence}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 取引詳細 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              取引詳細
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm font-medium text-muted-foreground'>取引ID</div>
                  <div className='font-mono'>{trade?.id}</div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground'>金額</div>
                  <div className='text-xl font-bold flex items-center gap-1'>
                    <DollarSign className='h-4 w-4' />
                    {Number(trade?.amountUsd).toLocaleString()} USD
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    ({Number(trade?.fiatAmount).toLocaleString()} {trade?.fiatCurrency})
                  </div>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t'>
                <div>
                    <div className='text-sm font-medium text-muted-foreground mb-2'>買い手</div>
                     <div className='flex items-center gap-2 p-2 bg-muted/30 rounded border'>
                        {trade?.buyer && <UserAvatar user={trade.buyer} size='sm' />}
                        <div>
                            <div className='font-bold'>{trade?.buyer?.displayName}</div>
                            <div className='text-xs text-muted-foreground'>@{trade?.buyer?.username}</div>
                        </div>
                            <Badge variant='outline' className='ml-auto'>Buyer</Badge>
                     </div>
                </div>
                <div>
                    <div className='text-sm font-medium text-muted-foreground mb-2'>売り手</div>
                     <div className='flex items-center gap-2 p-2 bg-muted/30 rounded border'>
                        {trade?.seller && <UserAvatar user={trade.seller} size='sm' />}
                        <div>
                            <div className='font-bold'>{trade?.seller?.displayName}</div>
                            <div className='text-xs text-muted-foreground'>@{trade?.seller?.username}</div>
                        </div>
                        <Badge variant='outline' className='ml-auto'>Seller</Badge>
                     </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* 解決フォーム (未解決の場合のみ) */}
        {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
          <Card className='border-primary/50 shadow-lg'>
            <CardHeader className='bg-primary/5'>
              <CardTitle className='flex items-center gap-2 text-primary'>
                <Gavel className='h-5 w-5' />
                裁定を下す
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6 space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>裁定結果</label>
                <Select onValueChange={setResolutionStatus} value={resolutionStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='裁定結果を選択してください' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={P2PDisputeStatus.ResolvedBuyerWin}>
                      買い手の勝利（全額返金・エスクロー解放）
                    </SelectItem>
                    <SelectItem value={P2PDisputeStatus.ResolvedSellerWin}>
                      売り手の勝利（支払い受領済み・エスクロー完了）
                    </SelectItem>
                    <SelectItem value={P2PDisputeStatus.ResolvedSplit}>
                      分割（50:50で分配）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>解決メモ（当事者に公開されます）</label>
                <Textarea
                  placeholder='裁定の理由や詳細を入力してください'
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className='pt-4 flex justify-end'>
                <Button
                    onClick={handleResolve}
                    disabled={!resolutionStatus || resolving}
                    className="w-full sm:w-auto"
                >
                    {resolving ? <Loader2 className="animate-spin mr-2" /> : <Gavel className="mr-2 h-4 w-4" />}
                    紛争を解決する
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminP2PDisputeDetailPage;
