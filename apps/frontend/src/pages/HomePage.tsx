import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@libark/graphql-client';

import { PostList, PostListFilters } from '@/features/posts/components/PostList';
import { PostCreatorContainer } from '@/features/posts/components/PostCreator';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { useFeatures } from '@/hooks';
import { Input, Motion } from '@/components/atoms';

// タブタイプ定義
type TabType = 'FOLLOWING' | 'RECOMMENDED' | 'ALL';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreatorExpanded, setIsCreatorExpanded] = useState(true); // 常に展開状態

  // 投稿機能フラグを取得
  const { features } = useFeatures();
  const canCreatePost = features.POST_CREATE;
  const canUploadImage = features.POST_IMAGE_UPLOAD;

  // タブ状態を取得
  const activeTab =
    (useAppStore(
      state => (state.ui as { timelineTab?: TabType } | undefined | null)?.timelineTab
    ) as TabType | undefined) || 'ALL';

  // 投稿作成後のリフレッシュ処理
  const handlePostCreated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    // setIsCreatorExpanded(false); // 投稿後にフォームを閉じる（無効化）
  }, []);

  // PostListからの投稿作成準備完了通知
  const handleCreatePostReady = useCallback(() => {
    // 必要に応じて追加の処理
  }, []);

  const expandCreator = useCallback(() => {
    setIsCreatorExpanded(true);
  }, []);

  return (
    <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
      {/* レスポンシブレイアウトコンテナ - 600px制限はPageLayoutTemplateで適用 */}
      <div className='flex flex-col w-full'>
        {/* メインコンテンツエリア */}
        <main className='w-full'>
          <div className='space-y-4 md:space-y-6'>
            {/* タブナビゲーション */}
            <Motion.div preset='slideUp' delay={0.1}>
              <PostListFilters />
            </Motion.div>

            {/* 投稿作成セクション - 機能フラグで制御 */}
            {canCreatePost && (
              <Motion.div preset='slideUp' delay={0.2}>
                <div className='bg-background border border-border/30 rounded-lg'>
                  {isCreatorExpanded ? (
                    <PostCreatorContainer
                      onPostCreated={handlePostCreated}
                      canUploadImage={canUploadImage}
                    />
                  ) : (
                    <div
                      onClick={expandCreator}
                      className='flex w-full cursor-text items-center gap-3 p-4'
                      role='button'
                      tabIndex={0}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && expandCreator()}
                      aria-label={t('actions.createPost', { defaultValue: '投稿を作成' })}
                    >
                      <Input
                        readOnly
                        placeholder={t('post.creator.placeholder', {
                          defaultValue: '今何を考えていますか？',
                        })}
                        className='cursor-text'
                      />
                    </div>
                  )}
                </div>
              </Motion.div>
            )}

            {/* 投稿リスト */}
            <Motion.div preset='slideUp' delay={0.3}>
              <PostList
                refreshTrigger={refreshTrigger}
                onCreatePostReady={handleCreatePostReady}
                postType='posts'
                timelineType={activeTab}
                key={activeTab} // タブ変更時にコンポーネントを再マウント
              />
            </Motion.div>
          </div>
        </main>
      </div>
    </PageLayoutTemplate>
  );
};

export default HomePage;
