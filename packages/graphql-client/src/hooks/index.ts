/**
 * 🎣 GraphQLクライアントフックのエクスポート
 */

// カスタム認証フック
// export {
//   useAuth,
//   type LoginCredentials,
//   type RegisterData,
//   type LogoutOptions,
//   type LogoutResult,
// } from './useAuth.js'; // 🚫 重複防止のため削除 - AuthProvider経由のみ使用

// GraphQLファイルアップロードフック
// useGraphQLImageUploadは削除されました（プリサインURL実装に移行済み）

// プリサインURL画像アップロードフック
// プリサインドアップロード（削除済み - 統一システムに移行）

// useAvatarPresignedUpload は削除されました - useUnifiedAvatar を使用してください

// プリサインダウンロードフック（削除済み - セキュアメディア配信システムに移行）
// 代替: GraphQLのMediaリゾルバーを使用

// アバター画像表示フック（削除済み）
// useAvatarImageは削除されました - Apollo ClientのGraphQLクエリを直接使用してください

// 統一メディアアップロードフック（削除済み）
// useUnifiedMediaUpload、useAvatarUpload、usePostImageUpload、useProductImageUpload、useCoverImageUploadは削除されました
// 代わりにusePostPresignedUpload、useAvatarPresignedUploadを使用してください

// アバター管理フック
export {
  useAvatar,
  type AvatarConfig,
  type AvatarUploadResult,
  type AvatarReturn,
} from './useAvatar.js';

// カバー画像管理フック
export {
  useCover,
  type CoverConfig,
  type CoverUploadResult,
  type CoverReturn,
} from './useCover.js';

// 統一画像キャッシュフック（削除済み - Apollo Clientの標準キャッシュを使用）

// メディアアップロードフック（責任分離対応）
export {
  useUploadMedia,
  useUploadPostMedia,
  useUploadAvatarMedia,
  useUploadCoverMedia,
  useUploadOgpMedia,
  type UploadConfig,
  type UploadResult,
  type UploadState,
} from './useUploadMedia.js';

// プロキシアップロードフック（責任分離対応）
export {
  useProxyUpload,
  useProxyUploadPost,
  useProxyUploadAvatar,
  useProxyUploadCover,
  useProxyUploadOgp,
  type ProxyUploadConfig,
  type ProxyUploadHookResponse,
  type ProxyUploadState,
} from './useProxyUpload.js';

// 生成されたフックを再エクスポート（便利なアクセス用）
export {
  // 認証クエリ
  useMeQuery,
  useMeLazyQuery,

  // 認証ミューテーション
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,

  // メディアクエリ
  useGetMediaQuery,
  useGetMediaMetadataQuery,
  useGetMyMediaQuery,

  // メディアミューテーション
  useDeleteMediaMutation,

  // 投稿クエリ
  usePostsQuery,
  usePostQuery,

  // 投稿ミューテーション
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,

  // コメントクエリ
  useCommentsQuery,

  // コメントミューテーション
  useCreateCommentMutation,
  useDeleteCommentMutation,

  // 管理者クエリ
  useGetSystemStatsQuery,

  // 管理者ミューテーション
  useResetPostsMutation,
  useResetPostsAndMediaMutation,

  // 型定義
  type LoginInput,
  type RegisterInput,
  type LoginMutation,
  type RegisterMutation,
  type MeQuery,
  type UserInfoFragment,
  type GetMediaMetadataQuery,
  type GetMediaMetadataQueryVariables,
  type Media,
  type Post,
  type MediaStatus,
  type SystemStats,
  type AdminResetResult,
  type GetSystemStatsQuery,
  type ResetPostsMutation,
  type ResetPostsAndMediaMutation,

  // コメント型定義
  type Comment,
  type CommentCreateInput,
  type CommentsQuery,
  type CommentsQueryVariables,
  type CreateCommentMutation,
  type CreateCommentMutationVariables,
  type DeleteCommentMutation,
  type DeleteCommentMutationVariables,
} from '../generated/graphql.js';
