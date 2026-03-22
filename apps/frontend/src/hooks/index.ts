/**
 * カスタムフック集約エクスポート
 *
 * アプリケーション全体で使用されるカスタムフックを統一管理
 */

// メディアクエリ関連
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';

// GraphQL関連
// useApolloGraphQLComments は /features/posts/hooks/ に移行済み
// useGraphQLUser は /features/profile/hooks/ に移行済み
// usePosts は /features/posts/hooks/ に移行済み
// export { usePosts } from './usePosts';

// UI関連
export { useInfiniteScroll } from './useInfiniteScroll';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useLayoutSettings } from './useLayoutSettings';
export { useVirtualization, useOptimizedScroll } from './useLazyLoading';
export { useScrollToTop, useSimpleScrollToTop } from './useScrollToTop';

// エラーハンドリング関連
export { useErrorHandler } from './useErrorHandler';

// 🎯 統合アプリケーションデータフック（クリーン版）
export {
  useAppData,
  useUser,
  usePermissions,
  useSettings,
  useFeatures,
} from '@/providers/AppDataProvider';

// 🎯 認証フック（@libark/graphql-clientから）
export { useAuth } from '@libark/graphql-client';

// 🎯 投稿データフック
export { usePosts } from '@/features/posts/hooks/usePosts';

// ユーティリティ関連
export { useRealTimeFormat } from './useRealTimeFormat';
// useToggleCommentLike は /features/posts/hooks/ に移行済み
// useUnifiedErrorHandler は useErrorHandler に統一済み

// ウォレット関連
// useWallet, useCryptoDepositFlow, useTransactionConverter は /features/wallet/hooks/ に移行済み
