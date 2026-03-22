/**
 * 🎯 P2P紛争管理ページ (Admin)
 *
 * 責任:
 * - 発生したP2P紛争の一覧表示
 * - 紛争のステータス確認
 * - 詳細ページへの遷移
 */

'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2, AlertCircle, Eye } from 'lucide-react';
import { useAdminP2PDisputesQuery, P2PDisputeStatus } from '@libark/graphql-client';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { Header, SectionShell } from '@/components/molecules';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { UserAvatar } from '@/components/molecules/UserAvatar';

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

const getStatusColor = (status: P2PDisputeStatus) => {
  switch (status) {
    case P2PDisputeStatus.Open:
      return 'destructive'; // 赤
    case P2PDisputeStatus.UnderReview:
      return 'warning'; // 黄
    case P2PDisputeStatus.ResolvedBuyerWin:
    case P2PDisputeStatus.ResolvedSellerWin:
    case P2PDisputeStatus.ResolvedSplit:
      return 'success'; // 緑
    default:
      return 'secondary'; // グレー
  }
};

const AdminP2PDisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useAdminP2PDisputesQuery({
    variables: { limit: 50, offset: 0 },
    fetchPolicy: 'network-only',
  });

  const disputes = data?.adminP2PDisputes || [];

  return (
    <div className='flex flex-col h-full'>
      <Header title='P2P紛争管理' variant='x-style' headingLevel='h2' showBorder={true} />

      <div className='flex-1 overflow-y-auto'>
        <div className='p-4'>
          <SectionShell
            title='紛争一覧'
            description='発生しているP2P取引の紛争を管理・解決します。'
            icon={ShieldAlert}
            variant='admin'
          >
            {loading && (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                <span className='ml-2 text-muted-foreground'>読み込み中...</span>
              </div>
            )}

            {error && (
              <div className='flex items-center p-4 border border-destructive/20 bg-destructive/5 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-destructive' />
                <span className='ml-2 text-destructive'>
                  データの読み込みに失敗しました: {error.message}
                </span>
              </div>
            )}

            {!loading && !error && disputes.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                紛争は現在ありません
              </div>
            )}

            {!loading && !error && disputes.length > 0 && (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='bg-muted/50 text-muted-foreground uppercase'>
                    <tr>
                      <th className='px-4 py-3'>ID / 日時</th>
                      <th className='px-4 py-3'>申立人</th>
                      <th className='px-4 py-3'>取引相手</th>
                      <th className='px-4 py-3'>理由</th>
                      <th className='px-4 py-3'>ステータス</th>
                      <th className='px-4 py-3 text-right'>アクション</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {disputes.map(dispute => {
                      const trade = dispute.trade;
                      const opponent =
                        trade?.buyer?.id === dispute.initiatorId
                          ? trade?.seller
                          : trade?.buyer;

                      return (
                        <tr key={dispute.id} className='hover:bg-muted/20'>
                          <td className='px-4 py-3 font-mono'>
                            <div className='font-medium'>{dispute.id.slice(0, 8)}...</div>
                            <div className='text-xs text-muted-foreground'>
                              {format(new Date(dispute.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <UserAvatar
                                user={dispute.initiator}
                                size='sm'
                              />
                              <span>{dispute.initiator.displayName || dispute.initiator.username}</span>
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                             <div className='flex items-center gap-2'>
                                {opponent ? (
                                    <>
                                    <UserAvatar user={opponent} size='sm' />
                                    <span>{opponent.displayName || opponent.username}</span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">不明</span>
                                )}
                            </div>
                          </td>
                          <td className='px-4 py-3 max-w-[200px] truncate'>
                            {dispute.reason}
                          </td>
                          <td className='px-4 py-3'>
                            <Badge variant={getStatusColor(dispute.status) as any}>
                              {getStatusLabel(dispute.status)}
                            </Badge>
                          </td>
                          <td className='px-4 py-3 text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => navigate(`/admin/p2p/disputes/${dispute.id}`)}
                            >
                              <Eye className='h-4 w-4 mr-1' />
                              詳細
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionShell>
        </div>
      </div>
    </div>
  );
};

export default AdminP2PDisputesPage;
