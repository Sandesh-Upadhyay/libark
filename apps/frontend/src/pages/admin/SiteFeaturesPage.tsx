/**
 * 🎯 サイト機能管理ページ
 *
 * 責任:
 * - サイト機能（ウォレット、メッセージ、投稿、画像投稿）の有効/無効管理
 * - 管理者権限チェック
 * - 設定変更の確認ダイアログ
 */

'use client';

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sliders, Loader2, AlertCircle } from 'lucide-react';
import {
  useSiteFeatureSettingsQuery,
  useUpdateSiteFeatureMutation,
  GetFeatureFlagsDocument,
} from '@libark/graphql-client';
import type { SiteFeatureSettingInfoFragment } from '@libark/graphql-client';
import { toast } from 'sonner';

import { Header, SectionShell } from '@/components/molecules';
import { useAppData } from '@/hooks';
import { Switch } from '@/components/atoms';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms';
import { useIsMobile } from '@/hooks';

// サイト機能設定の型定義（GraphQL Codegenで生成された型を使用）
interface UpdateSiteFeatureData {
  updateSiteFeature: {
    featureName: string;
    isEnabled: boolean;
  };
}

// モバイル用のコンテキスト型定義
interface AdminOutletContext {
  showAdminMenu: boolean;
  setShowAdminMenu: (show: boolean) => void;
}

/**
 * 機能カテゴリの定義
 */
interface FeatureCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: FeatureInfo[];
}

interface FeatureInfo {
  name: string;
  displayName: string;
  description: string;
}

/**
 * 機能カテゴリとその詳細機能の定義
 */
const getFeatureCategories = (): FeatureCategory[] => [
  {
    id: 'posts',
    title: '投稿機能',
    description: 'コンテンツ投稿とインタラクション機能',
    icon: '📝',
    features: [
      {
        name: 'POST_CREATE',
        displayName: '投稿',
        description: 'PostCreator自体の表示・非表示',
      },
      {
        name: 'POST_IMAGE_UPLOAD',
        displayName: '画像アップロード',
        description: 'PostCreatorの画像追加ボタンの表示・非表示',
      },
      {
        name: 'POST_LIKE',
        displayName: 'いいね',
        description: 'いいねボタンの動作制御',
      },
    ],
  },
  {
    id: 'messaging',
    title: 'メッセージ機能',
    description: 'ユーザー間のコミュニケーション機能',
    icon: '💬',
    features: [
      {
        name: 'MESSAGES_ACCESS',
        displayName: 'メッセージ',
        description: 'メッセージ画面自体の表示・非表示',
      },
      {
        name: 'MESSAGES_SEND',
        displayName: '送信',
        description: 'メッセージ送信フォームの表示・非表示',
      },
    ],
  },
  {
    id: 'wallet',
    title: 'ウォレット機能',
    description: '残高管理と決済関連の機能',
    icon: '💰',
    features: [
      {
        name: 'WALLET_ACCESS',
        displayName: 'ウォレット',
        description: 'ウォレット画面自体の表示・非表示',
      },
      {
        name: 'WALLET_DEPOSIT',
        displayName: '入金',
        description: 'ウォレット入金画面の表示・非表示',
      },
      {
        name: 'WALLET_WITHDRAW',
        displayName: '出金',
        description: 'ウォレット出金画面の表示・非表示',
      },
    ],
  },
];

/**
 * 機能名から表示名を取得
 */
const getFeatureDisplayName = (featureName: string): string => {
  const categories = getFeatureCategories();
  for (const category of categories) {
    const feature = category.features.find(f => f.name === featureName);
    if (feature) {
      return feature.displayName;
    }
  }
  return featureName;
};

/**
 * 機能名から説明を取得
 */
const getFeatureDefaultDescription = (featureName: string): string => {
  const categories = getFeatureCategories();
  for (const category of categories) {
    const feature = category.features.find(f => f.name === featureName);
    if (feature) {
      return feature.description;
    }
  }
  return '機能の説明がありません';
};

/**
 * サイト機能設定のキャッシュを更新する統一関数（OptimisticUpdatesパターン準拠）
 */

const SiteFeaturesPage: React.FC = () => {
  const _isMobile = useIsMobile();
  const context = useOutletContext<AdminOutletContext>();
  const { refetch: refetchAppData } = useAppData();

  // 確認ダイアログの状態
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    featureName: string;
    currentEnabled: boolean;
    displayName: string;
  }>({
    open: false,
    featureName: '',
    currentEnabled: false,
    displayName: '',
  });

  // サイト機能設定データを取得
  const { data, loading, error, refetch } = useSiteFeatureSettingsQuery({
    errorPolicy: 'all',
  });

  // サイト機能設定更新ミューテーション（楽観的更新対応）
  const [updateSiteFeature, { loading: updating }] = useUpdateSiteFeatureMutation({
    onCompleted: (data: UpdateSiteFeatureData) => {
      toast.success(
        `${getFeatureDisplayName(data.updateSiteFeature.featureName)}を${data.updateSiteFeature.isEnabled ? '有効' : '無効'}にしました`
      );
    },
    onError: (error: Error) => {
      toast.error(`設定の更新に失敗しました: ${error.message}`);
      // エラー時はデータを再取得してキャッシュを修正
      refetch();
    },
  });

  // モバイルで管理メニューに戻る
  const _handleBackToMenu = () => {
    context?.setShowAdminMenu(true);
  };

  // 直接切り替え（悲観的更新・連打防止）
  const handleDirectToggle = async (featureName: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;

    if (updating) return;
    try {
      await updateSiteFeature({
        variables: {
          input: {
            featureName,
            isEnabled: newEnabled,
          },
        },
        refetchQueries: [{ query: GetFeatureFlagsDocument }],
        awaitRefetchQueries: true,
      });

      // 左ナビ等のAppDataを確実に更新
      await refetchAppData();

      // ここから下の update は不要（悲観的更新のため）
    } catch (error) {
      console.error('機能切り替えエラー:', error);
    }
  };

  // 確認ダイアログを閉じる
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  // サイト機能の有効/無効を切り替え（悲観的更新）
  const handleConfirmToggle = async () => {
    const newEnabled = !confirmDialog.currentEnabled;

    if (updating) return;
    try {
      await updateSiteFeature({
        variables: {
          input: {
            featureName: confirmDialog.featureName,
            isEnabled: newEnabled,
          },
        },
        refetchQueries: [{ query: GetFeatureFlagsDocument }],
        awaitRefetchQueries: true,
      });
      closeConfirmDialog();

      // 左ナビ等のAppDataを確実に更新
      await refetchAppData();
    } catch (error) {
      // エラーはonErrorで処理される
      console.error('機能切り替えエラー:', error);
    }
  };

  return (
    <div className='flex flex-col h-full'>
      {/* ページヘッダー - Xスタイル */}
      <Header title='サイト機能管理' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* コンテンツエリア - スクロール対応 */}
      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 space-y-6'>
          <SectionShell
            title='サイト機能設定'
            description='サイト全体の機能の有効/無効を管理します。無効にした機能は全ユーザーがアクセスできなくなります。'
            icon={Sliders}
            variant='admin'
          >
            {/* ローディング状態 */}
            {loading && (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                <span className='ml-2 text-muted-foreground'>読み込み中...</span>
              </div>
            )}

            {/* エラー状態 */}
            {error && (
              <div className='flex items-center p-4 border border-destructive/20 bg-destructive/5 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-destructive' />
                <span className='ml-2 text-destructive'>
                  データの読み込みに失敗しました: {error.message}
                </span>
              </div>
            )}

            {/* サイト機能設定一覧 - カテゴリ別表示 */}
            {data?.siteFeatureSettings && (
              <div className='space-y-6'>
                {getFeatureCategories().map(category => {
                  // このカテゴリに属する設定を取得
                  const categorySettings = data.siteFeatureSettings.filter(
                    (setting: SiteFeatureSettingInfoFragment) =>
                      category.features.some(feature => feature.name === setting.featureName)
                  );

                  // カテゴリに設定がない場合はスキップ
                  if (categorySettings.length === 0) return null;

                  return (
                    <div
                      key={category.id}
                      className='border border-border rounded-lg overflow-hidden'
                    >
                      {/* カテゴリヘッダー */}
                      <div className='bg-muted/30 px-4 py-3 border-b border-border'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-xl'>{category.icon}</span>
                          <div>
                            <h3 className='font-semibold text-foreground'>{category.title}</h3>
                            <p className='text-sm text-muted-foreground'>{category.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* カテゴリ内の機能一覧 */}
                      <div className='divide-y divide-border'>
                        {categorySettings.map((setting: SiteFeatureSettingInfoFragment) => (
                          <div key={setting.id} className='p-4 hover:bg-muted/20 transition-colors'>
                            <div className='flex items-center justify-between mb-2'>
                              <h4 className='font-medium text-foreground'>
                                {getFeatureDisplayName(setting.featureName)}
                              </h4>
                              <div className='flex items-center space-x-3'>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    setting.isEnabled
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}
                                >
                                  {setting.isEnabled ? '有効' : '無効'}
                                </div>
                                <Switch
                                  checked={setting.isEnabled}
                                  onCheckedChange={() =>
                                    handleDirectToggle(setting.featureName, setting.isEnabled)
                                  }
                                  disabled={updating}
                                  aria-label={`${getFeatureDisplayName(setting.featureName)}の有効/無効を切り替え`}
                                />
                              </div>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                              {setting.description ||
                                getFeatureDefaultDescription(setting.featureName)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* データが空の場合 */}
            {data?.siteFeatureSettings && data.siteFeatureSettings.length === 0 && (
              <div className='text-center py-8'>
                <Sliders className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                <p className='text-muted-foreground'>サイト機能設定がありません</p>
              </div>
            )}
          </SectionShell>
        </div>
      </div>

      {/* 確認ダイアログ */}
      <AlertDialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>機能設定の変更</AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <span>
                  {confirmDialog.displayName}を
                  <strong
                    className={confirmDialog.currentEnabled ? 'text-red-600' : 'text-green-600'}
                  >
                    {confirmDialog.currentEnabled ? '無効' : '有効'}
                  </strong>
                  にしますか？
                </span>
                {confirmDialog.currentEnabled && (
                  <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800'>
                    ⚠️ この機能を無効にすると、全ユーザーがアクセスできなくなります。
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDialog}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              disabled={updating}
              className={
                confirmDialog.currentEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {updating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  変更中...
                </>
              ) : (
                `${confirmDialog.currentEnabled ? '無効' : '有効'}にする`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SiteFeaturesPage;
