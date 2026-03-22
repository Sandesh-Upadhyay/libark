/**
 * Comment関係の型定義
 */

import type { User, CommentsQuery } from '@libark/graphql-client';

// GraphQLクエリの結果型を使用
type CommentItem = NonNullable<CommentsQuery['comments']>[number];

// コメント作成入力の型定義
export interface CommentCreateInput {
  postId: string;
  content: string;
}

// コメントセクションのプロパティ
export interface CommentSectionProps {
  postId: string;
  commentsCount?: number;
  currentUser?: User | null;
}

// コメントリストのプロパティ
export interface CommentListProps {
  postId: string;
  currentUser?: User | null;
  comments?: CommentItem[];
  isLoading?: boolean;
  error?: Error | null;
  onToggleLike?: (commentId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isDeleting?: boolean;
}

// コメントフォームのプロパティ
export interface CommentFormProps {
  postId: string;
  currentUser?: User | null;
  onSubmit: (data: { postId: string; content: string }) => Promise<void>;
  isSubmitting?: boolean;
}
