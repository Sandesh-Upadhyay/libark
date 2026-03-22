// GraphQLフラグメントのエクスポート

import { gql } from '@apollo/client';

// 投稿情報フラグメント（統一版）
export const POST_INFO_FRAGMENT = gql`
  fragment PostInfo on Post {
    id
    content
    visibility
    price
    paidAt
    createdAt
    updatedAt
    isProcessing
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
      url
      thumbnailUrl
      variants {
        id
        type
        s3Key
        width
        height
        fileSize
        quality
        url
      }
    }
    likesCount
    commentsCount
    isLikedByCurrentUser
  }
`;

// 投稿基本情報フラグメント（軽量版）
export const POST_BASIC_INFO_FRAGMENT = gql`
  fragment PostBasicInfo on Post {
    id
    content
    visibility
    createdAt
    updatedAt
    likesCount
    commentsCount
    isLikedByCurrentUser
    user {
      id
      username
      displayName
      profileImageId
    }
  }
`;
