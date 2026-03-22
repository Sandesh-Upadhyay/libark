/**
 * 🎯 Paid機能関連のGraphQL Mutation
 */

import { gql } from '@apollo/client';

// 投稿購入
export const PURCHASE_POST = gql`
  mutation PurchasePost($input: PurchasePostInput!) {
    purchasePost(input: $input) {
      id
      userId
      postId
      price
      purchasedAt
      expiresAt
      isActive
      user {
        id
        username
        displayName
      }
      post {
        id
        content
        visibility
        price
        paidAt
        user {
          id
          username
          displayName
        }
      }
    }
  }
`;

// 投稿をPaid化
export const UPDATE_POST_TO_PAID = gql`
  mutation UpdatePostToPaid($input: UpdatePostToPaidInput!) {
    updatePostToPaid(input: $input) {
      id
      content
      visibility
      price
      paidAt
      isProcessing
      createdAt
      updatedAt
      user {
        id
        username
        displayName
        profileImageId
      }
      media {
        id
        filename
        s3Key
        mimeType
        fileSize
        width
        height
        status

        variants {
          id
          type
          s3Key
          width
          height
          fileSize
          quality
        }
      }
      likesCount
      commentsCount
      viewsCount
      isLikedByCurrentUser
      isPurchasedByCurrentUser
    }
  }
`;

// 型定義
export interface PurchasePostInput {
  postId: string;
}

export interface UpdatePostToPaidInput {
  postId: string;
  price: number;
}

export interface PostPurchase {
  id: string;
  userId: string;
  postId: string;
  price: number;
  purchasedAt: string;
  expiresAt?: string;
  isActive: boolean;
  user: {
    id: string;
    username: string;
    displayName?: string;
  };
  post: {
    id: string;
    content?: string;
    visibility: string;
    price?: number;
    paidAt?: string;
    user: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}
