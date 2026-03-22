/**
 * 🚀 Media V2 GraphQL Mutations
 * 統一メディアシステム用のGraphQLミューテーション
 */

import { gql } from '@apollo/client';

// プリサインドアップロードURL生成
export const GENERATE_PRESIGNED_UPLOAD = gql`
  mutation GeneratePresignedUpload($input: PresignedUploadInput!) {
    generatePresignedUpload(input: $input) {
      uploadUrl
      downloadUrl
      s3Key
      mediaId
      expiresAt
      fields
    }
  }
`;

// プリサインドダウンロードURL生成（削除済み - セキュアメディア配信システムに移行）
// 代替: GraphQLのMediaリゾルバーを使用

// アップロード完了通知（フロントエンド責任分離版）
export const NOTIFY_UPLOAD_COMPLETE = gql`
  mutation NotifyUploadComplete($mediaId: UUID!, $s3Key: String!) {
    notifyUploadComplete(mediaId: $mediaId, s3Key: $s3Key) {
      media {
        id
        filename
        mimeType
        fileSize
        status
        createdAt
      }
      success
      message
    }
  }
`;

// アップロード完了通知（廃止予定）
export const COMPLETE_UPLOAD = gql`
  mutation CompleteUpload($mediaId: UUID!, $s3Key: String!) {
    completeUpload(mediaId: $mediaId, s3Key: $s3Key) {
      media {
        id
        filename
        mimeType
        fileSize
        status
        createdAt
      }
      success
      message
    }
  }
`;

// ユーザーアバター更新
export const UPDATE_USER_AVATAR = gql`
  mutation UpdateUserAvatar($input: UpdateUserAvatarInput!) {
    updateUserAvatar(input: $input) {
      success
      message
      user {
        id
        username
        displayName
        profileImageId
      }
    }
  }
`;

// 統一メディア取得クエリ
export const GET_UNIFIED_MEDIA = gql`
  query GetUnifiedMedia($mediaId: UUID!) {
    getUnifiedMedia(mediaId: $mediaId) {
      media {
        id
        filename
        mimeType
        fileSize
        status
        s3Key
        createdAt
        isPaid
        hasBlurVariant
      }
      variants {
        id
        type
        s3Key
        width
        height
        fileSize
        quality
      }
      isPaid
      hasBlurVariant
      accessGranted
    }
  }
`;

// 統一メディア一覧取得クエリ
export const GET_UNIFIED_MEDIA_LIST = gql`
  query GetUnifiedMediaList(
    $mediaType: MediaType
    $userId: UUID
    $limit: Int = 20
    $offset: Int = 0
  ) {
    getUnifiedMediaList(mediaType: $mediaType, userId: $userId, limit: $limit, offset: $offset) {
      media {
        media {
          id
          filename
          mimeType
          fileSize
          status
          s3Key
          createdAt
          isPaid
          hasBlurVariant
        }
        variants {
          id
          type
          s3Key
          width
          height
          fileSize
          quality
        }
        isPaid
        hasBlurVariant
        accessGranted
      }
      totalCount
      hasNextPage
    }
  }
`;

// Paid投稿購入状況確認クエリ
export const CHECK_POST_PURCHASE_STATUS = gql`
  query CheckPostPurchaseStatus($postId: UUID!) {
    checkPostPurchaseStatus(postId: $postId) {
      postId
      isPaid
      price
      isPurchased
      purchasedAt
      canAccess
    }
  }
`;

// ユーザーの購入済み投稿一覧クエリ
export const GET_USER_PURCHASED_POSTS = gql`
  query GetUserPurchasedPosts($userId: UUID, $limit: Int = 20, $offset: Int = 0) {
    getUserPurchasedPosts(userId: $userId, limit: $limit, offset: $offset) {
      posts {
        post {
          id
          content
          visibility
          price
          paidAt
          createdAt
          user {
            id
            username
            displayName
          }
        }
        purchaseInfo {
          id
          price
          purchasedAt
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

// 🚀 S3 Gateway Presigned URL 移行 - UploadSession
export const CREATE_UPLOAD_SESSION = gql`
  mutation CreateUploadSession($input: CreateUploadSessionInput!) {
    createUploadSession(input: $input) {
      uploadId
      uploadPath
      uploadAuthToken
      expiresAt
      requiredHeaders {
        key
        value
      }
      maxBytes
    }
  }
`;

export const COMPLETE_UPLOAD_SESSION = gql`
  mutation CompleteUploadSession($uploadId: ID!) {
    completeUploadSession(uploadId: $uploadId) {
      id
      filename
      mimeType
      fileSize
      status
      s3Key
      url
      thumbnailUrl
      createdAt
      updatedAt
    }
  }
`;
