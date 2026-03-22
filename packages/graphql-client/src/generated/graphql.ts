import type { DocumentNode } from 'graphql';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: string; output: string };
  Decimal: { input: any; output: any };
  JSON: { input: Record<string, unknown>; output: Record<string, unknown> };
  UUID: { input: string; output: string };
  Upload: { input: File; output: File };
};

export type AddParticipantInput = {
  conversationId: Scalars['UUID']['input'];
  role?: InputMaybe<ParticipantRole>;
  userId: Scalars['UUID']['input'];
};

export type AddParticipantPayload = {
  __typename?: 'AddParticipantPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  participant: Maybe<ConversationParticipant>;
  success: Scalars['Boolean']['output'];
};

export type AdminChangeUserPasswordInput = {
  newPassword: Scalars['String']['input'];
  userId: Scalars['UUID']['input'];
};

export type AdminChangeUserPasswordPayload = {
  __typename?: 'AdminChangeUserPasswordPayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AdminDeleteUserPayload = {
  __typename?: 'AdminDeleteUserPayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AdminResetResult = {
  __typename?: 'AdminResetResult';
  deletedCount: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AdminUpdateUserInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
  userId: Scalars['UUID']['input'];
  username?: InputMaybe<Scalars['String']['input']>;
};

export type AdminUpdateUserPayload = {
  __typename?: 'AdminUpdateUserPayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  user: Maybe<AdminUserDetail>;
};

export type AdminUserConnection = {
  __typename?: 'AdminUserConnection';
  edges: Array<AdminUserEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdminUserDetail = {
  __typename?: 'AdminUserDetail';
  bio: Maybe<Scalars['String']['output']>;
  coverImageId: Maybe<Scalars['UUID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  displayName: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  followersCount: Scalars['Int']['output'];
  followingCount: Scalars['Int']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  lastLoginAt: Maybe<Scalars['DateTime']['output']>;
  permissions: Array<UserPermission>;
  postsCount: Scalars['Int']['output'];
  profileImageId: Maybe<Scalars['UUID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};

export type AdminUserEdge = {
  __typename?: 'AdminUserEdge';
  cursor: Scalars['String']['output'];
  node: AdminUserDetail;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  requiresTwoFactor: Maybe<Scalars['Boolean']['output']>;
  success: Scalars['Boolean']['output'];
  tempUserId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

/** バックアップコード */
export type BackupCodes = {
  __typename?: 'BackupCodes';
  /** バックアップコードリスト */
  codes: Array<Scalars['String']['output']>;
  /** 生成日時 */
  generatedAt: Scalars['DateTime']['output'];
};

export enum BalanceType {
  P2P = 'P2P',
  Sales = 'SALES',
  Wallet = 'WALLET',
}

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
}

export type CacheStats = {
  __typename?: 'CacheStats';
  dbHits: Scalars['Int']['output'];
  enabled: Scalars['Boolean']['output'];
  hitRate: Scalars['Float']['output'];
  l1Hits: Scalars['Int']['output'];
  l2Hits: Scalars['Int']['output'];
  totalRequests: Scalars['Int']['output'];
};

export type ChangePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type Comment = {
  __typename?: 'Comment';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isLikedByCurrentUser: Maybe<Scalars['Boolean']['output']>;
  likesCount: Scalars['Int']['output'];
  post: Post;
  postId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type CommentCreateInput = {
  content: Scalars['String']['input'];
  postId: Scalars['UUID']['input'];
};

export type CompletedPart = {
  etag: Scalars['String']['input'];
  partNumber: Scalars['Int']['input'];
};

export type ConfirmP2PPaymentInput = {
  paymentDetails: Scalars['String']['input'];
  tradeId: Scalars['UUID']['input'];
};

export type Conversation = {
  __typename?: 'Conversation';
  activeParticipants: Array<User>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['UUID']['output'];
  creator: User;
  id: Scalars['UUID']['output'];
  isArchived: Scalars['Boolean']['output'];
  lastMessage: Maybe<Message>;
  messages: MessageConnection;
  participantCount: Scalars['Int']['output'];
  participants: Array<ConversationParticipant>;
  title: Maybe<Scalars['String']['output']>;
  type: ConversationType;
  unreadCount: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ConversationMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ConversationConnection = {
  __typename?: 'ConversationConnection';
  edges: Array<ConversationEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ConversationEdge = {
  __typename?: 'ConversationEdge';
  cursor: Scalars['String']['output'];
  node: Conversation;
};

export type ConversationParticipant = {
  __typename?: 'ConversationParticipant';
  conversation: Conversation;
  conversationId: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  isMuted: Scalars['Boolean']['output'];
  joinedAt: Scalars['DateTime']['output'];
  lastReadAt: Maybe<Scalars['DateTime']['output']>;
  leftAt: Maybe<Scalars['DateTime']['output']>;
  role: ParticipantRole;
  unreadCount: Scalars['Int']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export enum ConversationType {
  Direct = 'DIRECT',
  Group = 'GROUP',
}

export type CreateConversationInput = {
  initialMessage?: InputMaybe<Scalars['String']['input']>;
  participantIds: Array<Scalars['UUID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ConversationType>;
};

export type CreateConversationPayload = {
  __typename?: 'CreateConversationPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type CreateDepositRequestInput = {
  currency: Scalars['String']['input'];
  network: Scalars['String']['input'];
  requestedUsdAmount: Scalars['Float']['input'];
  userWalletAddress: Scalars['String']['input'];
};

export type CreateFiatCurrencyInput = {
  code: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
};

export type CreateP2PDisputeInput = {
  evidence?: InputMaybe<Scalars['String']['input']>;
  reason: Scalars['String']['input'];
  tradeId: Scalars['UUID']['input'];
};

export type CreateP2POfferInput = {
  exchangeRateMargin: Scalars['Decimal']['input'];
  fiatCurrency: Scalars['String']['input'];
  instructions?: InputMaybe<Scalars['String']['input']>;
  maxAmountUsd: Scalars['Decimal']['input'];
  minAmountUsd: Scalars['Decimal']['input'];
  paymentMethod: P2PPaymentMethodType;
  priority?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateP2PTradeRequestInput = {
  amountUsd: Scalars['Decimal']['input'];
  offerId: Scalars['UUID']['input'];
};

export type CreateUploadSessionInput = {
  byteSize: Scalars['Int']['input'];
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  height?: InputMaybe<Scalars['Int']['input']>;
  kind: MediaType;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateWithdrawalRequestInput = {
  amount: Scalars['Float']['input'];
  currency: Scalars['String']['input'];
  destinationAddress: Scalars['String']['input'];
  memo?: InputMaybe<Scalars['String']['input']>;
  network: Scalars['String']['input'];
};

export type DeleteMessageInput = {
  deleteType: MessageDeleteType;
  messageId: Scalars['UUID']['input'];
};

export type DeleteMessagePayload = {
  __typename?: 'DeleteMessagePayload';
  deleteType: MessageDeleteType;
  deletedMessage: Maybe<Message>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DepositRequest = {
  __typename?: 'DepositRequest';
  completedAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  exchangeRate: Scalars['Float']['output'];
  expectedCryptoAmount: Scalars['Float']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  network: Scalars['String']['output'];
  ourDepositAddress: Scalars['String']['output'];
  requestedUsdAmount: Scalars['Float']['output'];
  status: DepositStatus;
  user: User;
  userId: Scalars['UUID']['output'];
  walletTransactions: Array<WalletTransaction>;
};

export enum DepositStatus {
  Completed = 'COMPLETED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
}

export type ExchangeRate = {
  __typename?: 'ExchangeRate';
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  source: Scalars['String']['output'];
  usdRate: Scalars['Float']['output'];
};

export type FeatureFlags = {
  __typename?: 'FeatureFlags';
  MESSAGES_ACCESS: Scalars['Boolean']['output'];
  MESSAGES_SEND: Scalars['Boolean']['output'];
  POST_CREATE: Scalars['Boolean']['output'];
  POST_IMAGE_UPLOAD: Scalars['Boolean']['output'];
  POST_LIKE: Scalars['Boolean']['output'];
  WALLET_ACCESS: Scalars['Boolean']['output'];
  WALLET_DEPOSIT: Scalars['Boolean']['output'];
  WALLET_WITHDRAW: Scalars['Boolean']['output'];
};

export type FiatCurrency = {
  __typename?: 'FiatCurrency';
  code: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type Follow = {
  __typename?: 'Follow';
  createdAt: Scalars['DateTime']['output'];
  follower: User;
  following: User;
  id: Scalars['UUID']['output'];
};

export type FollowConnection = {
  __typename?: 'FollowConnection';
  edges: Array<FollowEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FollowEdge = {
  __typename?: 'FollowEdge';
  cursor: Scalars['String']['output'];
  followedAt: Scalars['DateTime']['output'];
  node: User;
};

export type FollowPayload = {
  __typename?: 'FollowPayload';
  follow: Maybe<Follow>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GrantPermissionInput = {
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  permissionName: Scalars['String']['input'];
  userId: Scalars['UUID']['input'];
};

export type HeaderPair = {
  __typename?: 'HeaderPair';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type HideMessageInput = {
  messageId: Scalars['UUID']['input'];
};

export type HideMessagePayload = {
  __typename?: 'HideMessagePayload';
  hiddenMessage: Maybe<Message>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Like = {
  __typename?: 'Like';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  post: Post;
  postId: Scalars['UUID']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LogoutPayload = {
  __typename?: 'LogoutPayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type MarkAsReadInput = {
  conversationId: Scalars['UUID']['input'];
  messageIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type MarkAsReadPayload = {
  __typename?: 'MarkAsReadPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  readCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type Media = {
  __typename?: 'Media';
  createdAt: Scalars['DateTime']['output'];
  fileSize: Scalars['Int']['output'];
  filename: Scalars['String']['output'];
  height: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  mimeType: Scalars['String']['output'];
  ogpUrl: Maybe<Scalars['String']['output']>;
  ogpUrls: MediaOgpUrls;
  post: Maybe<Post>;
  s3Key: Scalars['String']['output'];
  status: MediaStatus;
  thumbnailUrl: Maybe<Scalars['String']['output']>;
  type: MediaType;
  updatedAt: Scalars['DateTime']['output'];
  url: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  variants: Array<MediaVariant>;
  width: Maybe<Scalars['Int']['output']>;
};

export type MediaOgpUrlArgs = {
  variant?: InputMaybe<Scalars['String']['input']>;
};

export type MediaOgpUrls = {
  __typename?: 'MediaOgpUrls';
  large: Maybe<Scalars['String']['output']>;
  summary: Maybe<Scalars['String']['output']>;
};

export enum MediaStatus {
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Ready = 'READY',
}

export enum MediaType {
  Avatar = 'AVATAR',
  Cover = 'COVER',
  Ogp = 'OGP',
  Post = 'POST',
}

export type MediaVariant = {
  __typename?: 'MediaVariant';
  createdAt: Scalars['DateTime']['output'];
  fileSize: Maybe<Scalars['Int']['output']>;
  height: Maybe<Scalars['Int']['output']>;
  id: Scalars['UUID']['output'];
  media: Media;
  quality: Maybe<Scalars['Int']['output']>;
  s3Key: Scalars['String']['output'];
  type: MediaVariantType;
  url: Maybe<Scalars['String']['output']>;
  width: Maybe<Scalars['Int']['output']>;
};

export enum MediaVariantType {
  Blur = 'BLUR',
  Large = 'LARGE',
  Medium = 'MEDIUM',
  Ogp = 'OGP',
  Thumb = 'THUMB',
}

export type Message = {
  __typename?: 'Message';
  canDelete: Scalars['Boolean']['output'];
  content: Scalars['String']['output'];
  conversation: Conversation;
  conversationId: Scalars['UUID']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt: Maybe<Scalars['DateTime']['output']>;
  editedAt: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['UUID']['output'];
  isHidden: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  readCount: Scalars['Int']['output'];
  reads: Array<MessageRead>;
  replies: Array<Message>;
  replyTo: Maybe<Message>;
  replyToId: Maybe<Scalars['UUID']['output']>;
  sender: User;
  senderId: Scalars['UUID']['output'];
  type: MessageType;
  updatedAt: Scalars['DateTime']['output'];
};

export type MessageConnection = {
  __typename?: 'MessageConnection';
  edges: Array<MessageEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export enum MessageDeleteType {
  Hide = 'HIDE',
  Unsend = 'UNSEND',
}

export type MessageEdge = {
  __typename?: 'MessageEdge';
  cursor: Scalars['String']['output'];
  node: Message;
};

export type MessageRead = {
  __typename?: 'MessageRead';
  id: Scalars['UUID']['output'];
  message: Message;
  messageId: Scalars['UUID']['output'];
  readAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type MessageStats = {
  __typename?: 'MessageStats';
  activeConversations: Scalars['Int']['output'];
  archivedConversations: Scalars['Int']['output'];
  totalConversations: Scalars['Int']['output'];
  totalMessages: Scalars['Int']['output'];
  totalUnreadMessages: Scalars['Int']['output'];
  unreadConversations: Scalars['Int']['output'];
};

export enum MessageType {
  File = 'FILE',
  Image = 'IMAGE',
  System = 'SYSTEM',
  Text = 'TEXT',
}

export type MultipartUploadData = {
  __typename?: 'MultipartUploadData';
  expiresAt: Scalars['DateTime']['output'];
  mediaId: Scalars['UUID']['output'];
  partUrls: Array<PartUploadUrl>;
  s3Key: Scalars['String']['output'];
  uploadId: Scalars['String']['output'];
};

export type MultipartUploadInput = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  mediaType?: InputMaybe<MediaType>;
  partCount: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  abortMultipartUpload: Scalars['Boolean']['output'];
  acceptP2PTradeRequest: P2PTradeRequest;
  addParticipant: AddParticipantPayload;
  adminChangeUserPassword: AdminChangeUserPasswordPayload;
  adminDeleteUser: AdminDeleteUserPayload;
  adminUpdateUser: AdminUpdateUserPayload;
  cancelP2PTradeRequest: Scalars['Boolean']['output'];
  changePassword: UserUpdatePayload;
  completeMultipartUpload: UploadCompleteResponse;
  completeUploadSession: Media;
  confirmP2PPaymentReceived: P2PTradeRequest;
  createComment: Comment;
  createConversation: CreateConversationPayload;
  createDepositRequest: DepositRequest;
  createFiatCurrency: FiatCurrency;
  createP2PDispute: P2PDispute;
  createP2POffer: P2POffer;
  createP2PTradeRequest: P2PTradeRequest;
  createPost: Post;
  createTestNotification: Notification;
  createUploadSession: UploadSession;
  createWithdrawalRequest: WithdrawalRequest;
  deleteComment: Scalars['Boolean']['output'];
  deleteMedia: Scalars['Boolean']['output'];
  deleteMessage: DeleteMessagePayload;
  deleteP2PBuyerPreference: Scalars['Boolean']['output'];
  deleteP2POffer: Scalars['Boolean']['output'];
  deletePost: Scalars['Boolean']['output'];
  deleteUserAvatar: UserUpdatePayload;
  deleteUserCover: UserUpdatePayload;
  /** 2FA無効化 */
  disableTwoFactor: TwoFactorDisableResult;
  /** 2FA有効化 */
  enableTwoFactor: TwoFactorEnableResult;
  followUser: FollowPayload;
  generatePresignedDownload: PresignedDownloadData;
  generatePresignedUpload: PresignedUploadData;
  getSystemStats: SystemStats;
  grantPermission: UserPermission;
  hideMessage: HideMessagePayload;
  initiateMultipartUpload: MultipartUploadData;
  invalidateUserCache: Scalars['Boolean']['output'];
  login: AuthPayload;
  /** 2FA認証完了ログイン */
  loginWithTwoFactor: AuthPayload;
  logout: LogoutPayload;
  markAllNotificationsAsRead: Scalars['Int']['output'];
  markAsRead: MarkAsReadPayload;
  markNotificationAsRead: Notification;
  markNotificationsAsRead: Array<Notification>;
  markP2PPaymentSent: P2PTradeRequest;
  muteConversation: MuteConversationPayload;
  notifyUploadComplete: UploadCompleteResponse;
  purchasePost: PostPurchase;
  /** バックアップコード再生成 */
  regenerateBackupCodes: BackupCodes;
  register: AuthPayload;
  registerUserWallet: UserWallet;
  removeParticipant: RemoveParticipantPayload;
  resetDatabase: AdminResetResult;
  resetPosts: AdminResetResult;
  resetPostsAndMedia: AdminResetResult;
  resolveP2PDispute: P2PDispute;
  revokePermission: Scalars['Boolean']['output'];
  revokeUserFeaturePermission: Scalars['Boolean']['output'];
  sendMessage: SendMessagePayload;
  /** 2FA設定開始（QRコード生成） */
  setupTwoFactor: TwoFactorSetupData;
  toggleCommentLike: Comment;
  toggleLike: Post;
  transferBalance: WalletTransaction;
  unfollowUser: UnfollowPayload;
  updateConversation: UpdateConversationPayload;
  updateEmail: UserUpdatePayload;
  updateFiatCurrency: FiatCurrency;
  updateP2PBuyerPreference: P2PBuyerPreference;
  updateP2POffer: P2POffer;
  updatePost: Post;
  updatePostToPaid: Post;
  updateProfile: User;
  updateSiteFeature: SiteFeatureSetting;
  updateUserAvatar: UserUpdatePayload;
  updateUserCover: UserUpdatePayload;
  updateUserFeaturePermission: UserFeaturePermission;
  updateUserSettings: UserSettings;
  uploadFileProxy: ProxyUploadResponse;
  uploadMediaUnified: UnifiedUploadResponse;
  uploadToZenko: UploadCompleteResponse;
};

export type MutationAbortMultipartUploadArgs = {
  uploadId: Scalars['String']['input'];
};

export type MutationAcceptP2PTradeRequestArgs = {
  tradeId: Scalars['UUID']['input'];
};

export type MutationAddParticipantArgs = {
  input: AddParticipantInput;
};

export type MutationAdminChangeUserPasswordArgs = {
  input: AdminChangeUserPasswordInput;
};

export type MutationAdminDeleteUserArgs = {
  userId: Scalars['UUID']['input'];
};

export type MutationAdminUpdateUserArgs = {
  input: AdminUpdateUserInput;
};

export type MutationCancelP2PTradeRequestArgs = {
  tradeId: Scalars['UUID']['input'];
};

export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};

export type MutationCompleteMultipartUploadArgs = {
  parts: Array<CompletedPart>;
  uploadId: Scalars['String']['input'];
};

export type MutationCompleteUploadSessionArgs = {
  uploadId: Scalars['ID']['input'];
};

export type MutationConfirmP2PPaymentReceivedArgs = {
  input: ConfirmP2PPaymentInput;
};

export type MutationCreateCommentArgs = {
  input: CommentCreateInput;
};

export type MutationCreateConversationArgs = {
  input: CreateConversationInput;
};

export type MutationCreateDepositRequestArgs = {
  input: CreateDepositRequestInput;
};

export type MutationCreateFiatCurrencyArgs = {
  input: CreateFiatCurrencyInput;
};

export type MutationCreateP2PDisputeArgs = {
  input: CreateP2PDisputeInput;
};

export type MutationCreateP2POfferArgs = {
  input: CreateP2POfferInput;
};

export type MutationCreateP2PTradeRequestArgs = {
  input: CreateP2PTradeRequestInput;
};

export type MutationCreatePostArgs = {
  input: PostCreateInput;
};

export type MutationCreateTestNotificationArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['UUID']['input'];
};

export type MutationCreateUploadSessionArgs = {
  input: CreateUploadSessionInput;
};

export type MutationCreateWithdrawalRequestArgs = {
  input: CreateWithdrawalRequestInput;
};

export type MutationDeleteCommentArgs = {
  id: Scalars['UUID']['input'];
};

export type MutationDeleteMediaArgs = {
  id: Scalars['UUID']['input'];
};

export type MutationDeleteMessageArgs = {
  input: DeleteMessageInput;
};

export type MutationDeleteP2PBuyerPreferenceArgs = {
  id: Scalars['UUID']['input'];
};

export type MutationDeleteP2POfferArgs = {
  offerId: Scalars['UUID']['input'];
};

export type MutationDeletePostArgs = {
  id: Scalars['UUID']['input'];
};

export type MutationDisableTwoFactorArgs = {
  input: TwoFactorDisableInput;
};

export type MutationEnableTwoFactorArgs = {
  input: TwoFactorEnableInput;
};

export type MutationFollowUserArgs = {
  userId: Scalars['UUID']['input'];
};

export type MutationGeneratePresignedDownloadArgs = {
  s3Key: Scalars['String']['input'];
};

export type MutationGeneratePresignedUploadArgs = {
  input: PresignedUploadInput;
};

export type MutationGrantPermissionArgs = {
  input: GrantPermissionInput;
};

export type MutationHideMessageArgs = {
  input: HideMessageInput;
};

export type MutationInitiateMultipartUploadArgs = {
  input: MultipartUploadInput;
};

export type MutationInvalidateUserCacheArgs = {
  userId: Scalars['UUID']['input'];
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationLoginWithTwoFactorArgs = {
  input: TwoFactorLoginInput;
};

export type MutationMarkAsReadArgs = {
  input: MarkAsReadInput;
};

export type MutationMarkNotificationAsReadArgs = {
  id: Scalars['UUID']['input'];
};

export type MutationMarkNotificationsAsReadArgs = {
  ids: Array<Scalars['UUID']['input']>;
};

export type MutationMarkP2PPaymentSentArgs = {
  tradeId: Scalars['UUID']['input'];
};

export type MutationMuteConversationArgs = {
  input: MuteConversationInput;
};

export type MutationNotifyUploadCompleteArgs = {
  mediaId: Scalars['UUID']['input'];
  s3Key: Scalars['String']['input'];
};

export type MutationPurchasePostArgs = {
  input: PurchasePostInput;
};

export type MutationRegenerateBackupCodesArgs = {
  input: TwoFactorRegenerateBackupCodesInput;
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRegisterUserWalletArgs = {
  input: RegisterUserWalletInput;
};

export type MutationRemoveParticipantArgs = {
  input: RemoveParticipantInput;
};

export type MutationResolveP2PDisputeArgs = {
  input: ResolveP2PDisputeInput;
};

export type MutationRevokePermissionArgs = {
  input: RevokePermissionInput;
};

export type MutationRevokeUserFeaturePermissionArgs = {
  input: RevokeUserFeaturePermissionInput;
};

export type MutationSendMessageArgs = {
  input: SendMessageInput;
};

export type MutationSetupTwoFactorArgs = {
  input: TwoFactorSetupInput;
};

export type MutationToggleCommentLikeArgs = {
  commentId: Scalars['UUID']['input'];
};

export type MutationToggleLikeArgs = {
  postId: Scalars['UUID']['input'];
};

export type MutationTransferBalanceArgs = {
  input: TransferBalanceInput;
};

export type MutationUnfollowUserArgs = {
  userId: Scalars['UUID']['input'];
};

export type MutationUpdateConversationArgs = {
  input: UpdateConversationInput;
};

export type MutationUpdateEmailArgs = {
  input: UpdateEmailInput;
};

export type MutationUpdateFiatCurrencyArgs = {
  input: UpdateFiatCurrencyInput;
};

export type MutationUpdateP2PBuyerPreferenceArgs = {
  input: UpdateP2PBuyerPreferenceInput;
};

export type MutationUpdateP2POfferArgs = {
  input: UpdateP2POfferInput;
};

export type MutationUpdatePostArgs = {
  id: Scalars['UUID']['input'];
  input: PostUpdateInput;
};

export type MutationUpdatePostToPaidArgs = {
  input: UpdatePostToPaidInput;
};

export type MutationUpdateProfileArgs = {
  input: ProfileUpdateInput;
};

export type MutationUpdateSiteFeatureArgs = {
  input: UpdateSiteFeatureInput;
};

export type MutationUpdateUserAvatarArgs = {
  input: UpdateUserAvatarInput;
};

export type MutationUpdateUserCoverArgs = {
  input: UpdateUserCoverInput;
};

export type MutationUpdateUserFeaturePermissionArgs = {
  input: UpdateUserFeaturePermissionInput;
};

export type MutationUpdateUserSettingsArgs = {
  input: UserSettingsUpdateInput;
};

export type MutationUploadFileProxyArgs = {
  input: ProxyUploadInput;
};

export type MutationUploadMediaUnifiedArgs = {
  input: UnifiedUploadInput;
};

export type MutationUploadToZenkoArgs = {
  file: Scalars['Upload']['input'];
  mediaType?: InputMaybe<MediaType>;
};

export type MuteConversationInput = {
  conversationId: Scalars['UUID']['input'];
  isMuted: Scalars['Boolean']['input'];
};

export type MuteConversationPayload = {
  __typename?: 'MuteConversationPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Notification = {
  __typename?: 'Notification';
  actor: Maybe<User>;
  actorId: Maybe<Scalars['UUID']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isRead: Scalars['Boolean']['output'];
  readAt: Maybe<Scalars['DateTime']['output']>;
  referenceId: Maybe<Scalars['UUID']['output']>;
  type: NotificationType;
  user: User;
  userId: Scalars['UUID']['output'];
};

export enum NotificationType {
  AvatarProcessingCompleted = 'AVATAR_PROCESSING_COMPLETED',
  AvatarProcessingFailed = 'AVATAR_PROCESSING_FAILED',
  Comment = 'COMMENT',
  CommentProcessingCompleted = 'COMMENT_PROCESSING_COMPLETED',
  CommentProcessingFailed = 'COMMENT_PROCESSING_FAILED',
  Follow = 'FOLLOW',
  Like = 'LIKE',
  P2PPaymentSent = 'P2P_PAYMENT_SENT',
  P2PTradeCancelled = 'P2P_TRADE_CANCELLED',
  P2PTradeCompleted = 'P2P_TRADE_COMPLETED',
  P2PTradeCreated = 'P2P_TRADE_CREATED',
  P2PTradeMatched = 'P2P_TRADE_MATCHED',
  P2PTradeTimeout = 'P2P_TRADE_TIMEOUT',
  PostProcessingCompleted = 'POST_PROCESSING_COMPLETED',
  PostProcessingFailed = 'POST_PROCESSING_FAILED',
  WalletDepositCompleted = 'WALLET_DEPOSIT_COMPLETED',
  WalletWithdrawalCompleted = 'WALLET_WITHDRAWAL_COMPLETED',
  WalletWithdrawalFailed = 'WALLET_WITHDRAWAL_FAILED',
}

export type P2PBuyerPreference = {
  __typename?: 'P2PBuyerPreference';
  buyer: User;
  buyerId: Scalars['UUID']['output'];
  createdAt: Scalars['DateTime']['output'];
  fiatCurrency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  maxAmountUsd: Scalars['Decimal']['output'];
  minAmountUsd: Scalars['Decimal']['output'];
  paymentMethod: P2PPaymentMethodType;
  updatedAt: Scalars['DateTime']['output'];
};

export type P2PDispute = {
  __typename?: 'P2PDispute';
  createdAt: Scalars['DateTime']['output'];
  evidence: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  initiator: User;
  initiatorId: Scalars['UUID']['output'];
  reason: Scalars['String']['output'];
  resolution: Maybe<Scalars['String']['output']>;
  resolvedAt: Maybe<Scalars['DateTime']['output']>;
  resolvedBy: Maybe<Scalars['UUID']['output']>;
  resolver: Maybe<User>;
  status: P2PDisputeStatus;
  trade: P2PTradeRequest;
  tradeId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum P2PDisputeStatus {
  Closed = 'CLOSED',
  Open = 'OPEN',
  ResolvedBuyerWin = 'RESOLVED_BUYER_WIN',
  ResolvedSellerWin = 'RESOLVED_SELLER_WIN',
  ResolvedSplit = 'RESOLVED_SPLIT',
  UnderReview = 'UNDER_REVIEW',
}

export type P2POffer = {
  __typename?: 'P2POffer';
  createdAt: Scalars['DateTime']['output'];
  exchangeRateMargin: Scalars['Decimal']['output'];
  fiatCurrency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  instructions: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  maxAmountUsd: Scalars['Decimal']['output'];
  minAmountUsd: Scalars['Decimal']['output'];
  paymentMethod: P2PPaymentMethodType;
  priority: Scalars['Int']['output'];
  seller: User;
  sellerId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type P2POfferConnection = {
  __typename?: 'P2POfferConnection';
  edges: Array<P2POfferEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type P2POfferEdge = {
  __typename?: 'P2POfferEdge';
  cursor: Scalars['String']['output'];
  node: P2POffer;
};

export enum P2POfferSortField {
  CreatedAt = 'CREATED_AT',
  MaxAmount = 'MAX_AMOUNT',
  MinAmount = 'MIN_AMOUNT',
  Rate = 'RATE',
}

export type P2POfferSortInput = {
  field: P2POfferSortField;
  order: SortOrder;
};

export enum P2PPaymentMethodType {
  BankTransfer = 'BANK_TRANSFER',
  LinePay = 'LINE_PAY',
  Paypal = 'PAYPAL',
  Paypay = 'PAYPAY',
  RakutenPay = 'RAKUTEN_PAY',
  Wise = 'WISE',
}

export type P2PTradeRequest = {
  __typename?: 'P2PTradeRequest';
  amountUsd: Scalars['Decimal']['output'];
  buyer: User;
  buyerId: Scalars['UUID']['output'];
  completedAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  escrowAmount: Maybe<Scalars['Decimal']['output']>;
  exchangeRate: Scalars['Decimal']['output'];
  expiresAt: Scalars['DateTime']['output'];
  fiatAmount: Scalars['Decimal']['output'];
  fiatCurrency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  offer: Maybe<P2POffer>;
  offerId: Maybe<Scalars['UUID']['output']>;
  paymentDetails: Maybe<Scalars['String']['output']>;
  paymentMethod: Maybe<P2PPaymentMethodType>;
  seller: Maybe<User>;
  sellerId: Maybe<Scalars['UUID']['output']>;
  status: P2PTradeStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export enum P2PTradeStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Disputed = 'DISPUTED',
  Matched = 'MATCHED',
  PaymentSent = 'PAYMENT_SENT',
  Pending = 'PENDING',
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
};

export type PartUploadUrl = {
  __typename?: 'PartUploadUrl';
  partNumber: Scalars['Int']['output'];
  uploadUrl: Scalars['String']['output'];
};

export enum ParticipantRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
}

export enum PaymentMethod {
  Crypto = 'CRYPTO',
  P2P = 'P2P',
}

export type PaymentProvider = {
  __typename?: 'PaymentProvider';
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  type: ProviderType;
  updatedAt: Scalars['DateTime']['output'];
};

export type PaymentRequest = {
  __typename?: 'PaymentRequest';
  amountUsd: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Maybe<Scalars['String']['output']>;
  currencyAmount: Maybe<Scalars['Float']['output']>;
  id: Scalars['UUID']['output'];
  metadata: Maybe<Scalars['String']['output']>;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerId: Scalars['UUID']['output'];
  status: RequestStatus;
  type: RequestType;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
};

export type Post = {
  __typename?: 'Post';
  comments: Array<Comment>;
  commentsCount: Scalars['Int']['output'];
  content: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isLikedByCurrentUser: Maybe<Scalars['Boolean']['output']>;
  isProcessing: Scalars['Boolean']['output'];
  isPurchasedByCurrentUser: Maybe<Scalars['Boolean']['output']>;
  likes: Array<Like>;
  likesCount: Scalars['Int']['output'];
  media: Array<Media>;
  paidAt: Maybe<Scalars['DateTime']['output']>;
  price: Maybe<Scalars['Float']['output']>;
  purchases: Array<PostPurchase>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
  viewsCount: Scalars['Int']['output'];
  visibility: PostVisibility;
};

export type PostConnection = {
  __typename?: 'PostConnection';
  edges: Array<PostEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PostCreateInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  mediaIds?: InputMaybe<Array<Scalars['UUID']['input']>>;
  price?: InputMaybe<Scalars['Float']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export type PostEdge = {
  __typename?: 'PostEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export type PostPurchase = {
  __typename?: 'PostPurchase';
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  post: Post;
  postId: Scalars['UUID']['output'];
  price: Scalars['Float']['output'];
  purchasedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type PostPurchaseStatusResponse = {
  __typename?: 'PostPurchaseStatusResponse';
  canAccess: Scalars['Boolean']['output'];
  isPaid: Scalars['Boolean']['output'];
  isPurchased: Scalars['Boolean']['output'];
  postId: Scalars['UUID']['output'];
  price: Maybe<Scalars['Float']['output']>;
  purchasedAt: Maybe<Scalars['DateTime']['output']>;
};

export type PostUpdateInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export enum PostVisibility {
  FollowersOnly = 'FOLLOWERS_ONLY',
  Paid = 'PAID',
  Private = 'PRIVATE',
  Public = 'PUBLIC',
}

export type PostWithPurchaseInfo = {
  __typename?: 'PostWithPurchaseInfo';
  post: Post;
  purchaseInfo: PostPurchase;
};

export type PresignedDownloadData = {
  __typename?: 'PresignedDownloadData';
  downloadUrl: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
};

export type PresignedUploadData = {
  __typename?: 'PresignedUploadData';
  downloadUrl: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  fields: Maybe<Scalars['JSON']['output']>;
  mediaId: Scalars['UUID']['output'];
  s3Key: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type PresignedUploadInput = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  mediaType: MediaType;
  size: Scalars['Int']['input'];
};

export type ProfileUpdateInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  coverImageId?: InputMaybe<Scalars['UUID']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
};

export enum ProviderType {
  CryptoDeposit = 'CRYPTO_DEPOSIT',
  CryptoWithdrawal = 'CRYPTO_WITHDRAWAL',
  P2P = 'P2P',
}

export type ProxyUploadInput = {
  contentType: Scalars['String']['input'];
  fileData: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  mediaType: MediaType;
  size: Scalars['Int']['input'];
};

export type ProxyUploadResponse = {
  __typename?: 'ProxyUploadResponse';
  contentType: Scalars['String']['output'];
  downloadUrl: Scalars['String']['output'];
  encrypted: Scalars['Boolean']['output'];
  filename: Scalars['String']['output'];
  mediaId: Scalars['UUID']['output'];
  size: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type PurchasePostInput = {
  postId: Scalars['UUID']['input'];
};

export type PurchasedPostsResponse = {
  __typename?: 'PurchasedPostsResponse';
  hasNextPage: Scalars['Boolean']['output'];
  posts: Array<PostWithPurchaseInfo>;
  totalCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  adminP2PDisputes: Array<P2PDispute>;
  adminUser: Maybe<AdminUserDetail>;
  adminUsers: AdminUserConnection;
  allPermissions: Array<Permission>;
  authCacheStats: CacheStats;
  availableP2POffers: P2POfferConnection;
  checkPostPurchaseStatus: PostPurchaseStatusResponse;
  comment: Maybe<Comment>;
  comments: Array<Comment>;
  conversation: Maybe<Conversation>;
  conversations: ConversationConnection;
  currentExchangeRate: Scalars['Float']['output'];
  featureFlags: FeatureFlags;
  fiatCurrencies: Array<FiatCurrency>;
  followers: FollowConnection;
  following: FollowConnection;
  getExchangeRate: Scalars['Float']['output'];
  getSupportedCurrencies: Array<Scalars['String']['output']>;
  getUnifiedMedia: UnifiedMediaResponse;
  getUnifiedMediaList: UnifiedMediaListResponse;
  getUserPurchasedPosts: PurchasedPostsResponse;
  isFollowing: Scalars['Boolean']['output'];
  likedPosts: PostConnection;
  me: Maybe<User>;
  media: Maybe<Media>;
  mediaPosts: PostConnection;
  messageStats: MessageStats;
  myDepositRequests: Array<DepositRequest>;
  myFeaturePermissions: Array<UserFeaturePermission>;
  myMedia: Array<Media>;
  myP2PBuyerPreferences: Array<P2PBuyerPreference>;
  myP2PDisputes: Array<P2PDispute>;
  myP2POffers: Array<P2POffer>;
  myP2PTradeRequests: Array<P2PTradeRequest>;
  myPermissions: Array<UserPermission>;
  mySettings: Maybe<UserSettings>;
  myUserWallets: Array<UserWallet>;
  myWallet: Maybe<Wallet>;
  myWalletTransactions: Array<WalletTransaction>;
  myWalletTransactionsByBalance: Array<WalletTransaction>;
  myWithdrawalRequests: Array<WithdrawalRequest>;
  notifications: Array<Notification>;
  p2pDispute: Maybe<P2PDispute>;
  p2pTradeRequest: Maybe<P2PTradeRequest>;
  post: Maybe<Post>;
  posts: PostConnection;
  rateLimitStats: RateLimitStats;
  searchMessages: MessageConnection;
  siteFeatureSetting: Maybe<SiteFeatureSetting>;
  siteFeatureSettings: Array<SiteFeatureSetting>;
  systemStats: SystemStats;
  timeline: TimelineConnection;
  /** 2FA状態取得 */
  twoFactorStatus: TwoFactorStatus;
  unreadNotificationsCount: Scalars['Int']['output'];
  user: Maybe<User>;
  userByUsername: Maybe<User>;
  userFeaturePermissions: Array<UserFeaturePermission>;
  userPermissions: Array<UserPermission>;
  users: UserConnection;
};

export type QueryAdminP2PDisputesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<P2PDisputeStatus>;
};

export type QueryAdminUserArgs = {
  id: Scalars['UUID']['input'];
};

export type QueryAdminUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAvailableP2POffersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  amountUsd?: InputMaybe<Scalars['Decimal']['input']>;
  fiatCurrency?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<P2POfferSortInput>;
  paymentMethod?: InputMaybe<P2PPaymentMethodType>;
};

export type QueryCheckPostPurchaseStatusArgs = {
  postId: Scalars['UUID']['input'];
};

export type QueryCommentArgs = {
  id: Scalars['UUID']['input'];
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryCommentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
  postId: Scalars['UUID']['input'];
};

export type QueryConversationArgs = {
  id: Scalars['UUID']['input'];
};

export type QueryConversationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryCurrentExchangeRateArgs = {
  currency: Scalars['String']['input'];
};

export type QueryFiatCurrenciesArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryFollowersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['UUID']['input'];
};

export type QueryFollowingArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['UUID']['input'];
};

export type QueryGetExchangeRateArgs = {
  currency: Scalars['String']['input'];
};

export type QueryGetUnifiedMediaArgs = {
  mediaId: Scalars['UUID']['input'];
};

export type QueryGetUnifiedMediaListArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  mediaType?: InputMaybe<MediaType>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
};

export type QueryGetUserPurchasedPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
};

export type QueryIsFollowingArgs = {
  userId: Scalars['UUID']['input'];
};

export type QueryLikedPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['UUID']['input'];
};

export type QueryMediaArgs = {
  id: Scalars['UUID']['input'];
};

export type QueryMediaPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
};

export type QueryMyMediaArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyP2POffersArgs = {
  fiatCurrency?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  paymentMethod?: InputMaybe<P2PPaymentMethodType>;
};

export type QueryMyP2PTradeRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<P2PTradeStatus>;
};

export type QueryMyWalletTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyWalletTransactionsByBalanceArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  balanceType: BalanceType;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<NotificationType>;
};

export type QueryP2pDisputeArgs = {
  disputeId: Scalars['UUID']['input'];
};

export type QueryP2pTradeRequestArgs = {
  tradeId: Scalars['UUID']['input'];
};

export type QueryPostArgs = {
  id: Scalars['UUID']['input'];
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export type QuerySearchMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySiteFeatureSettingArgs = {
  featureName: Scalars['String']['input'];
};

export type QueryTimelineArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<TimelineType>;
};

export type QueryUserArgs = {
  id: Scalars['UUID']['input'];
};

export type QueryUserByUsernameArgs = {
  username: Scalars['String']['input'];
};

export type QueryUserFeaturePermissionsArgs = {
  userId: Scalars['UUID']['input'];
};

export type QueryUserPermissionsArgs = {
  userId: Scalars['UUID']['input'];
};

export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type RateLimitStats = {
  __typename?: 'RateLimitStats';
  blockedIdentifiers: Scalars['Int']['output'];
  enabled: Scalars['Boolean']['output'];
  totalKeys: Scalars['Int']['output'];
};

export type RegisterInput = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['String']['input'];
};

export type RegisterUserWalletInput = {
  address: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  network: Scalars['String']['input'];
  walletName: Scalars['String']['input'];
};

export type RemoveParticipantInput = {
  conversationId: Scalars['UUID']['input'];
  userId: Scalars['UUID']['input'];
};

export type RemoveParticipantPayload = {
  __typename?: 'RemoveParticipantPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum RequestStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
}

export enum RequestType {
  Deposit = 'DEPOSIT',
  Withdrawal = 'WITHDRAWAL',
}

export type ResolveP2PDisputeInput = {
  disputeId: Scalars['UUID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  resolution: P2PDisputeStatus;
};

export type RevokePermissionInput = {
  permissionName: Scalars['String']['input'];
  userId: Scalars['UUID']['input'];
};

export type RevokeUserFeaturePermissionInput = {
  featureName: Scalars['String']['input'];
  userId: Scalars['UUID']['input'];
};

export type Role = {
  __typename?: 'Role';
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
};

export type SendMessageInput = {
  content: Scalars['String']['input'];
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  recipientId?: InputMaybe<Scalars['UUID']['input']>;
  replyToId?: InputMaybe<Scalars['UUID']['input']>;
  type?: InputMaybe<MessageType>;
};

export type SendMessagePayload = {
  __typename?: 'SendMessagePayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  messageData: Maybe<Message>;
  success: Scalars['Boolean']['output'];
};

export type SiteFeatureSetting = {
  __typename?: 'SiteFeatureSetting';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  featureName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  isEnabled: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['UUID']['output'];
  updatedByUser: User;
};

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type Subscription = {
  __typename?: 'Subscription';
  allPostsProcessingUpdated: Post;
  commentAdded: Comment;
  conversationUpdated: Conversation;
  depositRequestUpdated: DepositRequest;
  likeToggled: Post;
  messageAdded: Message;
  messageDeleted: Message;
  messageHidden: Message;
  messageRead: MessageRead;
  notificationAdded: Maybe<Notification>;
  notificationCountUpdated: Maybe<Scalars['Int']['output']>;
  p2pDisputeUpdated: P2PDispute;
  p2pTradeUpdated: P2PTradeRequest;
  participantAdded: ConversationParticipant;
  participantRemoved: ConversationParticipant;
  postAdded: Post;
  postProcessingCompleted: Post;
  postUpdated: Post;
  uploadProgress: UploadProgressUpdate;
  walletBalanceUpdated: Wallet;
  walletTransactionAdded: WalletTransaction;
  withdrawalRequestUpdated: WithdrawalRequest;
};

export type SubscriptionCommentAddedArgs = {
  postId: Scalars['UUID']['input'];
};

export type SubscriptionConversationUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionDepositRequestUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionLikeToggledArgs = {
  postId: Scalars['UUID']['input'];
};

export type SubscriptionMessageAddedArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionMessageDeletedArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionMessageHiddenArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionMessageReadArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionNotificationAddedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionNotificationCountUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionP2pDisputeUpdatedArgs = {
  tradeId: Scalars['UUID']['input'];
};

export type SubscriptionP2pTradeUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionParticipantAddedArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionParticipantRemovedArgs = {
  conversationId: Scalars['UUID']['input'];
};

export type SubscriptionPostProcessingCompletedArgs = {
  postId: Scalars['UUID']['input'];
};

export type SubscriptionPostUpdatedArgs = {
  postId: Scalars['UUID']['input'];
};

export type SubscriptionUploadProgressArgs = {
  mediaId: Scalars['UUID']['input'];
};

export type SubscriptionWalletBalanceUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionWalletTransactionAddedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SubscriptionWithdrawalRequestUpdatedArgs = {
  userId: Scalars['UUID']['input'];
};

export type SystemStats = {
  __typename?: 'SystemStats';
  activeUsers7d: Scalars['Int']['output'];
  activeUsers24h: Scalars['Int']['output'];
  activeUsers30d: Scalars['Int']['output'];
  storageUsed: Scalars['String']['output'];
  totalComments: Scalars['Int']['output'];
  totalLikes: Scalars['Int']['output'];
  totalMedia: Scalars['Int']['output'];
  totalPosts: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type TimelineConnection = {
  __typename?: 'TimelineConnection';
  edges: Array<PostEdge>;
  pageInfo: PageInfo;
  timelineType: TimelineType;
  totalCount: Scalars['Int']['output'];
};

export enum TimelineType {
  All = 'ALL',
  Following = 'FOLLOWING',
  Recommended = 'RECOMMENDED',
}

export enum TransactionStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
}

export enum TransactionType {
  Deposit = 'DEPOSIT',
  Payment = 'PAYMENT',
  Receive = 'RECEIVE',
  Transfer = 'TRANSFER',
  Withdrawal = 'WITHDRAWAL',
}

export type TransferBalanceInput = {
  amountUsd: Scalars['Float']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  fromBalanceType: BalanceType;
  toBalanceType: BalanceType;
};

/** 2FA無効化入力 */
export type TwoFactorDisableInput = {
  /** TOTPコードまたはバックアップコード */
  code: Scalars['String']['input'];
  /** パスワード確認 */
  password: Scalars['String']['input'];
};

/** 2FA無効化結果 */
export type TwoFactorDisableResult = {
  __typename?: 'TwoFactorDisableResult';
  /** メッセージ */
  message: Scalars['String']['output'];
  /** 成功フラグ */
  success: Scalars['Boolean']['output'];
};

/** 2FA有効化入力 */
export type TwoFactorEnableInput = {
  /** パスワード確認 */
  password: Scalars['String']['input'];
  /** TOTPコード（6桁） */
  totpCode: Scalars['String']['input'];
};

/** 2FA有効化結果 */
export type TwoFactorEnableResult = {
  __typename?: 'TwoFactorEnableResult';
  /** バックアップコード */
  backupCodes: BackupCodes;
  /** メッセージ */
  message: Scalars['String']['output'];
  /** 成功フラグ */
  success: Scalars['Boolean']['output'];
};

/** 2FAログイン入力 */
export type TwoFactorLoginInput = {
  /** TOTPコードまたはバックアップコード */
  code: Scalars['String']['input'];
  /** 一時的なユーザーID */
  tempUserId: Scalars['String']['input'];
};

/** バックアップコード再生成入力 */
export type TwoFactorRegenerateBackupCodesInput = {
  /** パスワード確認 */
  password: Scalars['String']['input'];
  /** TOTPコード */
  totpCode: Scalars['String']['input'];
};

/** 2FA設定データ */
export type TwoFactorSetupData = {
  __typename?: 'TwoFactorSetupData';
  /** バックアップ用の手動入力シークレット */
  manualEntryKey: Scalars['String']['output'];
  /** QRコード用のotpauth:// URL */
  qrCodeUrl: Scalars['String']['output'];
  /** Base32エンコードされたシークレット */
  secret: Scalars['String']['output'];
};

/** 2FA設定開始入力 */
export type TwoFactorSetupInput = {
  /** パスワード確認 */
  password: Scalars['String']['input'];
};

/** 2FA状態 */
export type TwoFactorStatus = {
  __typename?: 'TwoFactorStatus';
  /** 残りのバックアップコード数 */
  backupCodesCount: Scalars['Int']['output'];
  /** 2FAが有効かどうか */
  enabled: Scalars['Boolean']['output'];
  /** 有効化日時 */
  enabledAt: Maybe<Scalars['DateTime']['output']>;
};

export type UnfollowPayload = {
  __typename?: 'UnfollowPayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type UnifiedMediaListResponse = {
  __typename?: 'UnifiedMediaListResponse';
  hasNextPage: Scalars['Boolean']['output'];
  media: Array<UnifiedMediaResponse>;
  totalCount: Scalars['Int']['output'];
};

export type UnifiedMediaResponse = {
  __typename?: 'UnifiedMediaResponse';
  accessGranted: Scalars['Boolean']['output'];
  hasBlurVariant: Scalars['Boolean']['output'];
  isPaid: Scalars['Boolean']['output'];
  media: Media;
  variants: Array<MediaVariant>;
};

export type UnifiedUploadInput = {
  contentType: Scalars['String']['input'];
  fileData: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  mediaType: MediaType;
  size: Scalars['Int']['input'];
};

export type UnifiedUploadResponse = {
  __typename?: 'UnifiedUploadResponse';
  contentType: Scalars['String']['output'];
  downloadUrl: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  mediaId: Scalars['String']['output'];
  message: Maybe<Scalars['String']['output']>;
  size: Scalars['Int']['output'];
  status: MediaStatus;
  success: Scalars['Boolean']['output'];
};

export type UpdateConversationInput = {
  conversationId: Scalars['UUID']['input'];
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConversationPayload = {
  __typename?: 'UpdateConversationPayload';
  conversation: Maybe<Conversation>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type UpdateEmailInput = {
  newEmail: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type UpdateFiatCurrencyInput = {
  id: Scalars['UUID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateP2PBuyerPreferenceInput = {
  fiatCurrency: Scalars['String']['input'];
  maxAmountUsd: Scalars['Decimal']['input'];
  minAmountUsd: Scalars['Decimal']['input'];
  paymentMethod: P2PPaymentMethodType;
};

export type UpdateP2POfferInput = {
  exchangeRateMargin?: InputMaybe<Scalars['Decimal']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  maxAmountUsd?: InputMaybe<Scalars['Decimal']['input']>;
  minAmountUsd?: InputMaybe<Scalars['Decimal']['input']>;
  offerId: Scalars['UUID']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdatePostToPaidInput = {
  postId: Scalars['UUID']['input'];
  price: Scalars['Float']['input'];
};

export type UpdateSiteFeatureInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  featureName: Scalars['String']['input'];
  isEnabled: Scalars['Boolean']['input'];
};

export type UpdateUserAvatarInput = {
  mediaId: Scalars['UUID']['input'];
};

export type UpdateUserCoverInput = {
  mediaId: Scalars['UUID']['input'];
};

export type UpdateUserFeaturePermissionInput = {
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  featureName: Scalars['String']['input'];
  isEnabled: Scalars['Boolean']['input'];
  userId: Scalars['UUID']['input'];
};

export type UploadCompleteResponse = {
  __typename?: 'UploadCompleteResponse';
  media: Media;
  message: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum UploadProgressStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Uploading = 'UPLOADING',
}

export type UploadProgressUpdate = {
  __typename?: 'UploadProgressUpdate';
  error: Maybe<Scalars['String']['output']>;
  mediaId: Scalars['UUID']['output'];
  message: Maybe<Scalars['String']['output']>;
  progress: Scalars['Int']['output'];
  status: UploadProgressStatus;
};

export type UploadSession = {
  __typename?: 'UploadSession';
  expiresAt: Scalars['DateTime']['output'];
  maxBytes: Scalars['Int']['output'];
  requiredHeaders: Array<HeaderPair>;
  uploadAuthToken: Scalars['String']['output'];
  uploadId: Scalars['ID']['output'];
  uploadPath: Scalars['String']['output'];
};

export enum UploadSessionStatus {
  Completed = 'COMPLETED',
  Created = 'CREATED',
  Expired = 'EXPIRED',
  Failed = 'FAILED',
  Uploaded = 'UPLOADED',
  Uploading = 'UPLOADING',
}

export type User = {
  __typename?: 'User';
  bio: Maybe<Scalars['String']['output']>;
  comments: Array<Comment>;
  coverImageId: Maybe<Scalars['UUID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  displayName: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  followersCount: Scalars['Int']['output'];
  followingCount: Scalars['Int']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  isFollowedBy: Maybe<Scalars['Boolean']['output']>;
  isFollowing: Maybe<Scalars['Boolean']['output']>;
  isVerified: Scalars['Boolean']['output'];
  lastLoginAt: Maybe<Scalars['DateTime']['output']>;
  likes: Array<Like>;
  notifications: Array<Notification>;
  posts: Array<Post>;
  postsCount: Scalars['Int']['output'];
  profileImageId: Maybe<Scalars['UUID']['output']>;
  role: Maybe<Role>;
  settings: Maybe<UserSettings>;
  updatedAt: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFeaturePermission = {
  __typename?: 'UserFeaturePermission';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  featureName: Scalars['String']['output'];
  grantedAt: Scalars['DateTime']['output'];
  grantedBy: Scalars['UUID']['output'];
  grantedByUser: User;
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  isEnabled: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type UserPermission = {
  __typename?: 'UserPermission';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  grantedAt: Scalars['DateTime']['output'];
  grantedBy: Maybe<Scalars['UUID']['output']>;
  grantedByUser: Maybe<User>;
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  permission: Permission;
  permissionId: Scalars['UUID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['UUID']['output'];
};

export type UserSettings = {
  __typename?: 'UserSettings';
  animationsEnabled: Scalars['Boolean']['output'];
  contentFilter: Scalars['String']['output'];
  displayMode: Scalars['String']['output'];
  locale: Scalars['String']['output'];
  theme: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['UUID']['output'];
};

export type UserSettingsUpdateInput = {
  animationsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  contentFilter?: InputMaybe<Scalars['String']['input']>;
  displayMode?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  theme?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UserUpdatePayload = {
  __typename?: 'UserUpdatePayload';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  user: Maybe<User>;
};

export type UserWallet = {
  __typename?: 'UserWallet';
  address: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  network: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
  walletName: Scalars['String']['output'];
};

export type Wallet = {
  __typename?: 'Wallet';
  balanceUsd: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  p2pBalanceUsd: Scalars['Float']['output'];
  p2pLockedUsd: Scalars['Float']['output'];
  salesBalanceUsd: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
};

export type WalletTransaction = {
  __typename?: 'WalletTransaction';
  amountUsd: Scalars['Float']['output'];
  balanceType: BalanceType;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  metadata: Maybe<Scalars['String']['output']>;
  paymentRequest: Maybe<PaymentRequest>;
  paymentRequestId: Maybe<Scalars['UUID']['output']>;
  type: TransactionType;
  user: User;
  userId: Scalars['UUID']['output'];
};

export type WithdrawalRequest = {
  __typename?: 'WithdrawalRequest';
  amount: Scalars['Float']['output'];
  amountUsd: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  destinationAddress: Scalars['String']['output'];
  errorMessage: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  memo: Maybe<Scalars['String']['output']>;
  network: Scalars['String']['output'];
  processedAt: Maybe<Scalars['DateTime']['output']>;
  status: WithdrawalStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['UUID']['output'];
  walletTransactions: Array<WalletTransaction>;
};

export enum WithdrawalStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
}

export type P2PTradeInfoFragment = {
  __typename?: 'P2PTradeRequest';
  id: string;
  buyerId: string;
  sellerId: string | null;
  offerId: string | null;
  amountUsd: any;
  fiatCurrency: string;
  fiatAmount: any;
  exchangeRate: any;
  status: P2PTradeStatus;
  paymentMethod: P2PPaymentMethodType | null;
  paymentDetails: string | null;
  escrowAmount: any | null;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  offer: {
    __typename?: 'P2POffer';
    id: string;
    sellerId: string;
    paymentMethod: P2PPaymentMethodType;
    minAmountUsd: any;
    maxAmountUsd: any;
    fiatCurrency: string;
    exchangeRateMargin: any;
    isActive: boolean;
    instructions: string | null;
    priority: number;
    createdAt: string;
    updatedAt: string;
    seller: { __typename?: 'User' } & UserInfoFragment;
  } | null;
  buyer: { __typename?: 'User' } & UserInfoFragment;
  seller: ({ __typename?: 'User' } & UserInfoFragment) | null;
};

export type P2POfferInfoFragment = {
  __typename?: 'P2POffer';
  id: string;
  sellerId: string;
  paymentMethod: P2PPaymentMethodType;
  minAmountUsd: any;
  maxAmountUsd: any;
  fiatCurrency: string;
  exchangeRateMargin: any;
  isActive: boolean;
  instructions: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  seller: { __typename?: 'User' } & UserInfoFragment;
};

export type FiatCurrencyInfoFragment = {
  __typename?: 'FiatCurrency';
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
};

export type P2PBuyerPreferenceInfoFragment = {
  __typename?: 'P2PBuyerPreference';
  id: string;
  buyerId: string;
  paymentMethod: P2PPaymentMethodType;
  fiatCurrency: string;
  minAmountUsd: any;
  maxAmountUsd: any;
  createdAt: string;
  updatedAt: string;
};

export type P2PDisputeInfoFragment = {
  __typename?: 'P2PDispute';
  id: string;
  tradeId: string;
  initiatorId: string;
  reason: string;
  evidence: string | null;
  status: P2PDisputeStatus;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  initiator: { __typename?: 'User' } & UserInfoFragment;
};

export type PostInfoFragment = {
  __typename?: 'Post';
  id: string;
  content: string | null;
  visibility: PostVisibility;
  price: number | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  isProcessing: boolean;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean | null;
  user: {
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
    profileImageId: string | null;
  };
  media: Array<{
    __typename?: 'Media';
    id: string;
    filename: string;
    s3Key: string;
    mimeType: string;
    fileSize: number;
    width: number | null;
    height: number | null;
    status: MediaStatus;
    url: string | null;
    thumbnailUrl: string | null;
    variants: Array<{
      __typename?: 'MediaVariant';
      id: string;
      type: MediaVariantType;
      s3Key: string;
      width: number | null;
      height: number | null;
      fileSize: number | null;
      quality: number | null;
      url: string | null;
    }>;
  }>;
};

export type PostBasicInfoFragment = {
  __typename?: 'Post';
  id: string;
  content: string | null;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean | null;
  user: {
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
    profileImageId: string | null;
  };
};

export type CreateP2PTradeRequestMutationVariables = Exact<{
  input: CreateP2PTradeRequestInput;
}>;

export type CreateP2PTradeRequestMutation = {
  __typename?: 'Mutation';
  createP2PTradeRequest: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
};

export type CreateP2POfferMutationVariables = Exact<{
  input: CreateP2POfferInput;
}>;

export type CreateP2POfferMutation = {
  __typename?: 'Mutation';
  createP2POffer: { __typename?: 'P2POffer' } & P2POfferInfoFragment;
};

export type UpdateP2POfferMutationVariables = Exact<{
  input: UpdateP2POfferInput;
}>;

export type UpdateP2POfferMutation = {
  __typename?: 'Mutation';
  updateP2POffer: { __typename?: 'P2POffer' } & P2POfferInfoFragment;
};

export type DeleteP2POfferMutationVariables = Exact<{
  offerId: Scalars['UUID']['input'];
}>;

export type DeleteP2POfferMutation = { __typename?: 'Mutation'; deleteP2POffer: boolean };

export type CancelP2PTradeRequestMutationVariables = Exact<{
  tradeId: Scalars['UUID']['input'];
}>;

export type CancelP2PTradeRequestMutation = {
  __typename?: 'Mutation';
  cancelP2PTradeRequest: boolean;
};

export type MarkP2PPaymentSentMutationVariables = Exact<{
  tradeId: Scalars['UUID']['input'];
}>;

export type MarkP2PPaymentSentMutation = {
  __typename?: 'Mutation';
  markP2PPaymentSent: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
};

export type AcceptP2PTradeRequestMutationVariables = Exact<{
  tradeId: Scalars['UUID']['input'];
}>;

export type AcceptP2PTradeRequestMutation = {
  __typename?: 'Mutation';
  acceptP2PTradeRequest: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
};

export type ConfirmP2PPaymentReceivedMutationVariables = Exact<{
  input: ConfirmP2PPaymentInput;
}>;

export type ConfirmP2PPaymentReceivedMutation = {
  __typename?: 'Mutation';
  confirmP2PPaymentReceived: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
};

export type CreateP2PDisputeMutationVariables = Exact<{
  input: CreateP2PDisputeInput;
}>;

export type CreateP2PDisputeMutation = {
  __typename?: 'Mutation';
  createP2PDispute: { __typename?: 'P2PDispute' } & P2PDisputeInfoFragment;
};

export type ResolveP2PDisputeMutationVariables = Exact<{
  input: ResolveP2PDisputeInput;
}>;

export type ResolveP2PDisputeMutation = {
  __typename?: 'Mutation';
  resolveP2PDispute: { __typename?: 'P2PDispute' } & P2PDisputeInfoFragment;
};

export type UpdateP2PBuyerPreferenceMutationVariables = Exact<{
  input: UpdateP2PBuyerPreferenceInput;
}>;

export type UpdateP2PBuyerPreferenceMutation = {
  __typename?: 'Mutation';
  updateP2PBuyerPreference: { __typename?: 'P2PBuyerPreference' } & P2PBuyerPreferenceInfoFragment;
};

export type DeleteP2PBuyerPreferenceMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type DeleteP2PBuyerPreferenceMutation = {
  __typename?: 'Mutation';
  deleteP2PBuyerPreference: boolean;
};

export type PurchasePostMutationVariables = Exact<{
  input: PurchasePostInput;
}>;

export type PurchasePostMutation = {
  __typename?: 'Mutation';
  purchasePost: {
    __typename?: 'PostPurchase';
    id: string;
    userId: string;
    postId: string;
    price: number;
    purchasedAt: string;
    expiresAt: string | null;
    isActive: boolean;
    user: { __typename?: 'User'; id: string; username: string; displayName: string | null };
    post: {
      __typename?: 'Post';
      id: string;
      content: string | null;
      visibility: PostVisibility;
      price: number | null;
      paidAt: string | null;
      user: { __typename?: 'User'; id: string; username: string; displayName: string | null };
    };
  };
};

export type UpdatePostToPaidMutationVariables = Exact<{
  input: UpdatePostToPaidInput;
}>;

export type UpdatePostToPaidMutation = {
  __typename?: 'Mutation';
  updatePostToPaid: {
    __typename?: 'Post';
    id: string;
    content: string | null;
    visibility: PostVisibility;
    price: number | null;
    paidAt: string | null;
    isProcessing: boolean;
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    isLikedByCurrentUser: boolean | null;
    isPurchasedByCurrentUser: boolean | null;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    };
    media: Array<{
      __typename?: 'Media';
      id: string;
      filename: string;
      s3Key: string;
      mimeType: string;
      fileSize: number;
      width: number | null;
      height: number | null;
      status: MediaStatus;
      variants: Array<{
        __typename?: 'MediaVariant';
        id: string;
        type: MediaVariantType;
        s3Key: string;
        width: number | null;
        height: number | null;
        fileSize: number | null;
        quality: number | null;
      }>;
    }>;
  };
};

export type GeneratePresignedUploadMutationVariables = Exact<{
  input: PresignedUploadInput;
}>;

export type GeneratePresignedUploadMutation = {
  __typename?: 'Mutation';
  generatePresignedUpload: {
    __typename?: 'PresignedUploadData';
    uploadUrl: string;
    downloadUrl: string;
    s3Key: string;
    mediaId: string;
    expiresAt: string;
    fields: Record<string, unknown> | null;
  };
};

export type GeneratePresignedDownloadMutationVariables = Exact<{
  s3Key: Scalars['String']['input'];
}>;

export type GeneratePresignedDownloadMutation = {
  __typename?: 'Mutation';
  generatePresignedDownload: {
    __typename?: 'PresignedDownloadData';
    downloadUrl: string;
    expiresAt: string;
  };
};

export type NotifyUploadCompleteMutationVariables = Exact<{
  mediaId: Scalars['UUID']['input'];
  s3Key: Scalars['String']['input'];
}>;

export type NotifyUploadCompleteMutation = {
  __typename?: 'Mutation';
  notifyUploadComplete: {
    __typename?: 'UploadCompleteResponse';
    success: boolean;
    message: string | null;
    media: {
      __typename?: 'Media';
      id: string;
      status: MediaStatus;
      url: string | null;
      thumbnailUrl: string | null;
    };
  };
};

export type UploadMediaUnifiedMutationVariables = Exact<{
  input: UnifiedUploadInput;
}>;

export type UploadMediaUnifiedMutation = {
  __typename?: 'Mutation';
  uploadMediaUnified: {
    __typename?: 'UnifiedUploadResponse';
    success: boolean;
    mediaId: string;
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
    status: MediaStatus;
    message: string | null;
  };
};

export type UpdateUserAvatarMutationVariables = Exact<{
  input: UpdateUserAvatarInput;
}>;

export type UpdateUserAvatarMutation = {
  __typename?: 'Mutation';
  updateUserAvatar: {
    __typename?: 'UserUpdatePayload';
    success: boolean;
    message: string;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      bio: string | null;
      profileImageId: string | null;
      coverImageId: string | null;
      isVerified: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt: string | null;
    } | null;
  };
};

export type DeleteUserAvatarMutationVariables = Exact<{ [key: string]: never }>;

export type DeleteUserAvatarMutation = {
  __typename?: 'Mutation';
  deleteUserAvatar: {
    __typename?: 'UserUpdatePayload';
    success: boolean;
    message: string;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      bio: string | null;
      profileImageId: string | null;
      coverImageId: string | null;
      isVerified: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt: string | null;
    } | null;
  };
};

export type UpdateUserCoverMutationVariables = Exact<{
  input: UpdateUserCoverInput;
}>;

export type UpdateUserCoverMutation = {
  __typename?: 'Mutation';
  updateUserCover: {
    __typename?: 'UserUpdatePayload';
    success: boolean;
    message: string;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      bio: string | null;
      profileImageId: string | null;
      coverImageId: string | null;
      isVerified: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt: string | null;
    } | null;
  };
};

export type DeleteUserCoverMutationVariables = Exact<{ [key: string]: never }>;

export type DeleteUserCoverMutation = {
  __typename?: 'Mutation';
  deleteUserCover: {
    __typename?: 'UserUpdatePayload';
    success: boolean;
    message: string;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      bio: string | null;
      profileImageId: string | null;
      coverImageId: string | null;
      isVerified: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt: string | null;
    } | null;
  };
};

export type GetSystemStatsQueryVariables = Exact<{ [key: string]: never }>;

export type GetSystemStatsQuery = {
  __typename?: 'Query';
  systemStats: {
    __typename?: 'SystemStats';
    totalUsers: number;
    totalPosts: number;
    totalMedia: number;
    totalComments: number;
    totalLikes: number;
    storageUsed: string;
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
  };
};

export type ResetPostsMutationVariables = Exact<{ [key: string]: never }>;

export type ResetPostsMutation = {
  __typename?: 'Mutation';
  resetPosts: {
    __typename?: 'AdminResetResult';
    success: boolean;
    message: string;
    deletedCount: number;
  };
};

export type ResetPostsAndMediaMutationVariables = Exact<{ [key: string]: never }>;

export type ResetPostsAndMediaMutation = {
  __typename?: 'Mutation';
  resetPostsAndMedia: {
    __typename?: 'AdminResetResult';
    success: boolean;
    message: string;
    deletedCount: number;
  };
};

export type AdminUserDetailInfoFragment = {
  __typename?: 'AdminUserDetail';
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  profileImageId: string | null;
  coverImageId: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  permissions: Array<{
    __typename?: 'UserPermission';
    id: string;
    userId: string;
    permissionId: string;
    grantedBy: string | null;
    grantedAt: string;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    permission: {
      __typename?: 'Permission';
      id: string;
      name: string;
      description: string | null;
      createdAt: string;
    };
    grantedByUser: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
    } | null;
  }>;
};

export type AdminUsersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;

export type AdminUsersQuery = {
  __typename?: 'Query';
  adminUsers: {
    __typename?: 'AdminUserConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'AdminUserEdge';
      cursor: string;
      node: { __typename?: 'AdminUserDetail' } & AdminUserDetailInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type AdminUserQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type AdminUserQuery = {
  __typename?: 'Query';
  adminUser: ({ __typename?: 'AdminUserDetail' } & AdminUserDetailInfoFragment) | null;
};

export type AdminUpdateUserMutationVariables = Exact<{
  input: AdminUpdateUserInput;
}>;

export type AdminUpdateUserMutation = {
  __typename?: 'Mutation';
  adminUpdateUser: {
    __typename?: 'AdminUpdateUserPayload';
    success: boolean;
    message: string;
    user: ({ __typename?: 'AdminUserDetail' } & AdminUserDetailInfoFragment) | null;
  };
};

export type AdminChangeUserPasswordMutationVariables = Exact<{
  input: AdminChangeUserPasswordInput;
}>;

export type AdminChangeUserPasswordMutation = {
  __typename?: 'Mutation';
  adminChangeUserPassword: {
    __typename?: 'AdminChangeUserPasswordPayload';
    success: boolean;
    message: string;
  };
};

export type AdminDeleteUserMutationVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type AdminDeleteUserMutation = {
  __typename?: 'Mutation';
  adminDeleteUser: { __typename?: 'AdminDeleteUserPayload'; success: boolean; message: string };
};

export type AdminP2PDisputesQueryVariables = Exact<{
  status?: InputMaybe<P2PDisputeStatus>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type AdminP2PDisputesQuery = {
  __typename?: 'Query';
  adminP2PDisputes: Array<
    {
      __typename?: 'P2PDispute';
      trade: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
    } & P2PDisputeInfoFragment
  >;
};

export type AdminP2PDisputeQueryVariables = Exact<{
  disputeId: Scalars['UUID']['input'];
}>;

export type AdminP2PDisputeQuery = {
  __typename?: 'Query';
  p2pDispute:
    | ({
        __typename?: 'P2PDispute';
        trade: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
      } & P2PDisputeInfoFragment)
    | null;
};

export type CreateFiatCurrencyMutationVariables = Exact<{
  input: CreateFiatCurrencyInput;
}>;

export type CreateFiatCurrencyMutation = {
  __typename?: 'Mutation';
  createFiatCurrency: {
    __typename?: 'FiatCurrency';
    id: string;
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
  };
};

export type UpdateFiatCurrencyMutationVariables = Exact<{
  input: UpdateFiatCurrencyInput;
}>;

export type UpdateFiatCurrencyMutation = {
  __typename?: 'Mutation';
  updateFiatCurrency: {
    __typename?: 'FiatCurrency';
    id: string;
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
  };
};

export type AdminFiatCurrenciesQueryVariables = Exact<{
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type AdminFiatCurrenciesQuery = {
  __typename?: 'Query';
  fiatCurrencies: Array<{
    __typename?: 'FiatCurrency';
    id: string;
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
  }>;
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me: ({ __typename?: 'User' } & UserInfoFragment) | null;
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'AuthPayload';
    success: boolean;
    message: string;
    accessToken: string | null;
    requiresTwoFactor: boolean | null;
    tempUserId: string | null;
    user: ({ __typename?: 'User' } & UserInfoFragment) | null;
  };
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    success: boolean;
    message: string;
    accessToken: string | null;
    user: ({ __typename?: 'User' } & UserInfoFragment) | null;
  };
};

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = {
  __typename?: 'Mutation';
  logout: { __typename?: 'LogoutPayload'; success: boolean; message: string };
};

export type LoginWithTwoFactorMutationVariables = Exact<{
  input: TwoFactorLoginInput;
}>;

export type LoginWithTwoFactorMutation = {
  __typename?: 'Mutation';
  loginWithTwoFactor: {
    __typename?: 'AuthPayload';
    success: boolean;
    message: string;
    accessToken: string | null;
    user: ({ __typename?: 'User' } & UserInfoFragment) | null;
  };
};

export type CommentInfoFragment = {
  __typename?: 'Comment';
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLikedByCurrentUser: boolean | null;
  user: {
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
    profileImageId: string | null;
  };
};

export type CommentsQueryVariables = Exact<{
  postId: Scalars['UUID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type CommentsQuery = {
  __typename?: 'Query';
  comments: Array<{ __typename?: 'Comment' } & CommentInfoFragment>;
};

export type CommentQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type CommentQuery = {
  __typename?: 'Query';
  comment:
    | ({ __typename?: 'Comment'; post: { __typename?: 'Post'; id: string } } & CommentInfoFragment)
    | null;
};

export type CommentDetailQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type CommentDetailQuery = {
  __typename?: 'Query';
  comment:
    | ({ __typename?: 'Comment'; post: { __typename?: 'Post'; id: string } } & CommentInfoFragment)
    | null;
};

export type CreateCommentMutationVariables = Exact<{
  input: CommentCreateInput;
}>;

export type CreateCommentMutation = {
  __typename?: 'Mutation';
  createComment: { __typename?: 'Comment' } & CommentInfoFragment;
};

export type DeleteCommentMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type DeleteCommentMutation = { __typename?: 'Mutation'; deleteComment: boolean };

export type ToggleCommentLikeMutationVariables = Exact<{
  commentId: Scalars['UUID']['input'];
}>;

export type ToggleCommentLikeMutation = {
  __typename?: 'Mutation';
  toggleCommentLike: { __typename?: 'Comment' } & CommentInfoFragment;
};

export type MediaInfoFragment = {
  __typename?: 'Media';
  id: string;
  filename: string;
  s3Key: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  url: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  variants: Array<{
    __typename?: 'MediaVariant';
    id: string;
    type: MediaVariantType;
    s3Key: string;
    width: number | null;
    height: number | null;
    fileSize: number | null;
    quality: number | null;
    url: string | null;
    createdAt: string;
  }>;
  post: {
    __typename?: 'Post';
    id: string;
    visibility: PostVisibility;
    isDeleted: boolean;
    userId: string;
  } | null;
};

export type GetMediaQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type GetMediaQuery = {
  __typename?: 'Query';
  media: ({ __typename?: 'Media' } & MediaInfoFragment) | null;
};

export type GetMediaBasicInfoQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type GetMediaBasicInfoQuery = {
  __typename?: 'Query';
  media: {
    __typename?: 'Media';
    id: string;
    filename: string;
    s3Key: string;
    mimeType: string;
    status: MediaStatus;
    variants: Array<{
      __typename?: 'MediaVariant';
      id: string;
      type: MediaVariantType;
      s3Key: string;
      width: number | null;
      height: number | null;
      fileSize: number | null;
    }>;
  } | null;
};

export type GetMediaMetadataQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type GetMediaMetadataQuery = {
  __typename?: 'Query';
  media: {
    __typename?: 'Media';
    id: string;
    filename: string;
    s3Key: string;
    mimeType: string;
    fileSize: number;
    width: number | null;
    height: number | null;
    status: MediaStatus;
    url: string | null;
    thumbnailUrl: string | null;
    variants: Array<{
      __typename?: 'MediaVariant';
      id: string;
      type: MediaVariantType;
      s3Key: string;
      width: number | null;
      height: number | null;
      fileSize: number | null;
      url: string | null;
    }>;
    post: {
      __typename?: 'Post';
      id: string;
      visibility: PostVisibility;
      isDeleted: boolean;
      userId: string;
    } | null;
  } | null;
};

export type GetMyMediaQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type GetMyMediaQuery = {
  __typename?: 'Query';
  myMedia: Array<{ __typename?: 'Media' } & MediaInfoFragment>;
};

export type DeleteMediaMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type DeleteMediaMutation = { __typename?: 'Mutation'; deleteMedia: boolean };

export type MessageInfoFragment = {
  __typename?: 'Message';
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readCount: number;
  isHidden: boolean;
  canDelete: boolean;
  sender: {
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
    profileImageId: string | null;
    isVerified: boolean;
  };
};

export type ConversationInfoFragment = {
  __typename?: 'Conversation';
  id: string;
  type: ConversationType;
  title: string | null;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  participantCount: number;
  lastMessage: ({ __typename?: 'Message' } & MessageInfoFragment) | null;
  activeParticipants: Array<{
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
    profileImageId: string | null;
    isVerified: boolean;
  }>;
  participants: Array<{
    __typename?: 'ConversationParticipant';
    id: string;
    userId: string;
    role: ParticipantRole;
    joinedAt: string;
    leftAt: string | null;
    isMuted: boolean;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
      isVerified: boolean;
    };
  }>;
};

export type GetConversationsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  includeArchived?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type GetConversationsQuery = {
  __typename?: 'Query';
  conversations: {
    __typename?: 'ConversationConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'ConversationEdge';
      cursor: string;
      node: { __typename?: 'Conversation' } & ConversationInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type GetConversationQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type GetConversationQuery = {
  __typename?: 'Query';
  conversation:
    | ({
        __typename?: 'Conversation';
        messages: {
          __typename?: 'MessageConnection';
          totalCount: number;
          edges: Array<{
            __typename?: 'MessageEdge';
            cursor: string;
            node: { __typename?: 'Message' } & MessageInfoFragment;
          }>;
          pageInfo: {
            __typename?: 'PageInfo';
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
          };
        };
      } & ConversationInfoFragment)
    | null;
};

export type GetConversationMessagesQueryVariables = Exact<{
  conversationId: Scalars['UUID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type GetConversationMessagesQuery = {
  __typename?: 'Query';
  conversation: {
    __typename?: 'Conversation';
    id: string;
    messages: {
      __typename?: 'MessageConnection';
      totalCount: number;
      edges: Array<{
        __typename?: 'MessageEdge';
        cursor: string;
        node: { __typename?: 'Message' } & MessageInfoFragment;
      }>;
      pageInfo: {
        __typename?: 'PageInfo';
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
    };
  } | null;
};

export type GetMessageStatsQueryVariables = Exact<{ [key: string]: never }>;

export type GetMessageStatsQuery = {
  __typename?: 'Query';
  messageStats: {
    __typename?: 'MessageStats';
    totalConversations: number;
    activeConversations: number;
    unreadConversations: number;
    totalUnreadMessages: number;
    totalMessages: number;
    archivedConversations: number;
  };
};

export type SearchUsersQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchUsersQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserConnection';
    edges: Array<{
      __typename?: 'UserEdge';
      node: {
        __typename?: 'User';
        id: string;
        username: string;
        displayName: string | null;
        profileImageId: string | null;
        isVerified: boolean;
      };
    }>;
  };
};

export type SendMessageMutationVariables = Exact<{
  input: SendMessageInput;
}>;

export type SendMessageMutation = {
  __typename?: 'Mutation';
  sendMessage: {
    __typename?: 'SendMessagePayload';
    success: boolean;
    message: string;
    messageData: ({ __typename?: 'Message' } & MessageInfoFragment) | null;
    conversation: ({ __typename?: 'Conversation' } & ConversationInfoFragment) | null;
  };
};

export type CreateConversationMutationVariables = Exact<{
  input: CreateConversationInput;
}>;

export type CreateConversationMutation = {
  __typename?: 'Mutation';
  createConversation: {
    __typename?: 'CreateConversationPayload';
    success: boolean;
    message: string;
    conversation: ({ __typename?: 'Conversation' } & ConversationInfoFragment) | null;
  };
};

export type MarkAsReadMutationVariables = Exact<{
  input: MarkAsReadInput;
}>;

export type MarkAsReadMutation = {
  __typename?: 'Mutation';
  markAsRead: {
    __typename?: 'MarkAsReadPayload';
    success: boolean;
    message: string;
    readCount: number;
    conversation: ({ __typename?: 'Conversation' } & ConversationInfoFragment) | null;
  };
};

export type UpdateConversationMutationVariables = Exact<{
  input: UpdateConversationInput;
}>;

export type UpdateConversationMutation = {
  __typename?: 'Mutation';
  updateConversation: {
    __typename?: 'UpdateConversationPayload';
    success: boolean;
    message: string;
    conversation: ({ __typename?: 'Conversation' } & ConversationInfoFragment) | null;
  };
};

export type DeleteMessageMutationVariables = Exact<{
  input: DeleteMessageInput;
}>;

export type DeleteMessageMutation = {
  __typename?: 'Mutation';
  deleteMessage: {
    __typename?: 'DeleteMessagePayload';
    success: boolean;
    message: string;
    deleteType: MessageDeleteType;
    deletedMessage: ({ __typename?: 'Message' } & MessageInfoFragment) | null;
  };
};

export type HideMessageMutationVariables = Exact<{
  input: HideMessageInput;
}>;

export type HideMessageMutation = {
  __typename?: 'Mutation';
  hideMessage: {
    __typename?: 'HideMessagePayload';
    success: boolean;
    message: string;
    hiddenMessage: ({ __typename?: 'Message' } & MessageInfoFragment) | null;
  };
};

export type MessageAddedSubscriptionVariables = Exact<{
  conversationId: Scalars['UUID']['input'];
}>;

export type MessageAddedSubscription = {
  __typename?: 'Subscription';
  messageAdded: { __typename?: 'Message' } & MessageInfoFragment;
};

export type MessageReadSubscriptionVariables = Exact<{
  conversationId: Scalars['UUID']['input'];
}>;

export type MessageReadSubscription = {
  __typename?: 'Subscription';
  messageRead: {
    __typename?: 'MessageRead';
    id: string;
    messageId: string;
    userId: string;
    readAt: string;
    message: { __typename?: 'Message' } & MessageInfoFragment;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    };
  };
};

export type ConversationUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type ConversationUpdatedSubscription = {
  __typename?: 'Subscription';
  conversationUpdated: { __typename?: 'Conversation' } & ConversationInfoFragment;
};

export type NotificationsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<NotificationType>;
}>;

export type NotificationsQuery = {
  __typename?: 'Query';
  notifications: Array<{
    __typename?: 'Notification';
    id: string;
    type: NotificationType;
    content: string;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
    referenceId: string | null;
    userId: string;
    actorId: string | null;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    };
    actor: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    } | null;
  }>;
};

export type UnreadNotificationsCountQueryVariables = Exact<{ [key: string]: never }>;

export type UnreadNotificationsCountQuery = {
  __typename?: 'Query';
  unreadNotificationsCount: number;
};

export type MarkNotificationsAsReadMutationVariables = Exact<{
  ids: Array<Scalars['UUID']['input']> | Scalars['UUID']['input'];
}>;

export type MarkNotificationsAsReadMutation = {
  __typename?: 'Mutation';
  markNotificationsAsRead: Array<{
    __typename?: 'Notification';
    id: string;
    isRead: boolean;
    readAt: string | null;
  }>;
};

export type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never }>;

export type MarkAllNotificationsAsReadMutation = {
  __typename?: 'Mutation';
  markAllNotificationsAsRead: number;
};

export type P2PTradeRequestQueryVariables = Exact<{
  tradeId: Scalars['UUID']['input'];
}>;

export type P2PTradeRequestQuery = {
  __typename?: 'Query';
  p2pTradeRequest: ({ __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment) | null;
};

export type MyP2PTradeRequestsQueryVariables = Exact<{
  status?: InputMaybe<P2PTradeStatus>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type MyP2PTradeRequestsQuery = {
  __typename?: 'Query';
  myP2PTradeRequests: Array<{ __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment>;
};

export type AvailableP2POffersQueryVariables = Exact<{
  fiatCurrency?: InputMaybe<Scalars['String']['input']>;
  paymentMethod?: InputMaybe<P2PPaymentMethodType>;
  amountUsd?: InputMaybe<Scalars['Decimal']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<P2POfferSortInput>;
}>;

export type AvailableP2POffersQuery = {
  __typename?: 'Query';
  availableP2POffers: {
    __typename?: 'P2POfferConnection';
    totalCount: number;
    pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; endCursor: string | null };
    edges: Array<{
      __typename?: 'P2POfferEdge';
      cursor: string;
      node: { __typename?: 'P2POffer' } & P2POfferInfoFragment;
    }>;
  };
};

export type MyP2POffersQueryVariables = Exact<{
  fiatCurrency?: InputMaybe<Scalars['String']['input']>;
  paymentMethod?: InputMaybe<P2PPaymentMethodType>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type MyP2POffersQuery = {
  __typename?: 'Query';
  myP2POffers: Array<{ __typename?: 'P2POffer' } & P2POfferInfoFragment>;
};

export type FiatCurrenciesQueryVariables = Exact<{
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type FiatCurrenciesQuery = {
  __typename?: 'Query';
  fiatCurrencies: Array<{ __typename?: 'FiatCurrency' } & FiatCurrencyInfoFragment>;
};

export type MyP2PBuyerPreferencesQueryVariables = Exact<{ [key: string]: never }>;

export type MyP2PBuyerPreferencesQuery = {
  __typename?: 'Query';
  myP2PBuyerPreferences: Array<
    { __typename?: 'P2PBuyerPreference' } & P2PBuyerPreferenceInfoFragment
  >;
};

export type P2PDisputeQueryVariables = Exact<{
  disputeId: Scalars['UUID']['input'];
}>;

export type P2PDisputeQuery = {
  __typename?: 'Query';
  p2pDispute: ({ __typename?: 'P2PDispute' } & P2PDisputeInfoFragment) | null;
};

export type MyP2PDisputesQueryVariables = Exact<{ [key: string]: never }>;

export type MyP2PDisputesQuery = {
  __typename?: 'Query';
  myP2PDisputes: Array<{ __typename?: 'P2PDispute' } & P2PDisputeInfoFragment>;
};

export type CurrentExchangeRateQueryVariables = Exact<{
  currency: Scalars['String']['input'];
}>;

export type CurrentExchangeRateQuery = { __typename?: 'Query'; currentExchangeRate: number };

export type GetPostsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
  visibility?: InputMaybe<PostVisibility>;
}>;

export type GetPostsQuery = {
  __typename?: 'Query';
  posts: {
    __typename?: 'PostConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; endCursor: string | null };
  };
};

export type GetMediaPostsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
}>;

export type GetMediaPostsQuery = {
  __typename?: 'Query';
  mediaPosts: {
    __typename?: 'PostConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; endCursor: string | null };
  };
};

export type GetLikedPostsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['UUID']['input'];
}>;

export type GetLikedPostsQuery = {
  __typename?: 'Query';
  likedPosts: {
    __typename?: 'PostConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; endCursor: string | null };
  };
};

export type GetPostQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type GetPostQuery = {
  __typename?: 'Query';
  post: ({ __typename?: 'Post' } & PostInfoFragment) | null;
};

export type CreatePostMutationVariables = Exact<{
  input: PostCreateInput;
}>;

export type CreatePostMutation = {
  __typename?: 'Mutation';
  createPost: { __typename?: 'Post' } & PostInfoFragment;
};

export type ToggleLikeMutationVariables = Exact<{
  postId: Scalars['UUID']['input'];
}>;

export type ToggleLikeMutation = {
  __typename?: 'Mutation';
  toggleLike: {
    __typename?: 'Post';
    id: string;
    isLikedByCurrentUser: boolean | null;
    likesCount: number;
  };
};

export type DeletePostMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type DeletePostMutation = { __typename?: 'Mutation'; deletePost: boolean };

export type PostsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
  visibility?: InputMaybe<PostVisibility>;
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type PostsQuery = {
  __typename?: 'Query';
  posts: {
    __typename?: 'PostConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type PostQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type PostQuery = {
  __typename?: 'Query';
  post: ({ __typename?: 'Post' } & PostInfoFragment) | null;
};

export type PostDetailQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
  includeProcessing?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type PostDetailQuery = {
  __typename?: 'Query';
  post: ({ __typename?: 'Post' } & PostInfoFragment) | null;
};

export type UpdatePostMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  input: PostUpdateInput;
}>;

export type UpdatePostMutation = {
  __typename?: 'Mutation';
  updatePost: { __typename?: 'Post' } & PostInfoFragment;
};

export type MediaPostsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['UUID']['input']>;
}>;

export type MediaPostsQuery = {
  __typename?: 'Query';
  mediaPosts: {
    __typename?: 'PostConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type SiteFeatureSettingInfoFragment = {
  __typename?: 'SiteFeatureSetting';
  id: string;
  featureName: string;
  isEnabled: boolean;
  description: string | null;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  updatedByUser: { __typename?: 'User'; id: string; username: string; displayName: string | null };
};

export type UserFeaturePermissionInfoFragment = {
  __typename?: 'UserFeaturePermission';
  id: string;
  userId: string;
  featureName: string;
  isEnabled: boolean;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: { __typename?: 'User'; id: string; username: string; displayName: string | null };
  grantedByUser: { __typename?: 'User'; id: string; username: string; displayName: string | null };
};

export type SiteFeatureSettingsQueryVariables = Exact<{ [key: string]: never }>;

export type SiteFeatureSettingsQuery = {
  __typename?: 'Query';
  siteFeatureSettings: Array<
    { __typename?: 'SiteFeatureSetting' } & SiteFeatureSettingInfoFragment
  >;
};

export type SiteFeatureSettingQueryVariables = Exact<{
  featureName: Scalars['String']['input'];
}>;

export type SiteFeatureSettingQuery = {
  __typename?: 'Query';
  siteFeatureSetting:
    | ({ __typename?: 'SiteFeatureSetting' } & SiteFeatureSettingInfoFragment)
    | null;
};

export type UserFeaturePermissionsQueryVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type UserFeaturePermissionsQuery = {
  __typename?: 'Query';
  userFeaturePermissions: Array<
    { __typename?: 'UserFeaturePermission' } & UserFeaturePermissionInfoFragment
  >;
};

export type MyFeaturePermissionsQueryVariables = Exact<{ [key: string]: never }>;

export type MyFeaturePermissionsQuery = {
  __typename?: 'Query';
  myFeaturePermissions: Array<
    { __typename?: 'UserFeaturePermission' } & UserFeaturePermissionInfoFragment
  >;
};

export type GetFeatureFlagsQueryVariables = Exact<{ [key: string]: never }>;

export type GetFeatureFlagsQuery = {
  __typename?: 'Query';
  featureFlags: {
    __typename?: 'FeatureFlags';
    POST_CREATE: boolean;
    POST_IMAGE_UPLOAD: boolean;
    POST_LIKE: boolean;
    MESSAGES_ACCESS: boolean;
    MESSAGES_SEND: boolean;
    WALLET_ACCESS: boolean;
    WALLET_DEPOSIT: boolean;
    WALLET_WITHDRAW: boolean;
  };
};

export type UpdateSiteFeatureMutationVariables = Exact<{
  input: UpdateSiteFeatureInput;
}>;

export type UpdateSiteFeatureMutation = {
  __typename?: 'Mutation';
  updateSiteFeature: { __typename?: 'SiteFeatureSetting' } & SiteFeatureSettingInfoFragment;
};

export type UpdateUserFeaturePermissionMutationVariables = Exact<{
  input: UpdateUserFeaturePermissionInput;
}>;

export type UpdateUserFeaturePermissionMutation = {
  __typename?: 'Mutation';
  updateUserFeaturePermission: {
    __typename?: 'UserFeaturePermission';
  } & UserFeaturePermissionInfoFragment;
};

export type RevokeUserFeaturePermissionMutationVariables = Exact<{
  input: RevokeUserFeaturePermissionInput;
}>;

export type RevokeUserFeaturePermissionMutation = {
  __typename?: 'Mutation';
  revokeUserFeaturePermission: boolean;
};

export type TimelineQueryVariables = Exact<{
  type: TimelineType;
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type TimelineQuery = {
  __typename?: 'Query';
  timeline: {
    __typename?: 'TimelineConnection';
    totalCount: number;
    timelineType: TimelineType;
    edges: Array<{
      __typename?: 'PostEdge';
      cursor: string;
      node: { __typename?: 'Post' } & PostInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type TwoFactorStatusQueryVariables = Exact<{ [key: string]: never }>;

export type TwoFactorStatusQuery = {
  __typename?: 'Query';
  twoFactorStatus: {
    __typename?: 'TwoFactorStatus';
    enabled: boolean;
    enabledAt: string | null;
    backupCodesCount: number;
  };
};

export type SetupTwoFactorMutationVariables = Exact<{
  input: TwoFactorSetupInput;
}>;

export type SetupTwoFactorMutation = {
  __typename?: 'Mutation';
  setupTwoFactor: {
    __typename?: 'TwoFactorSetupData';
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  };
};

export type EnableTwoFactorMutationVariables = Exact<{
  input: TwoFactorEnableInput;
}>;

export type EnableTwoFactorMutation = {
  __typename?: 'Mutation';
  enableTwoFactor: {
    __typename?: 'TwoFactorEnableResult';
    success: boolean;
    message: string;
    backupCodes: { __typename?: 'BackupCodes'; codes: Array<string>; generatedAt: string };
  };
};

export type DisableTwoFactorMutationVariables = Exact<{
  input: TwoFactorDisableInput;
}>;

export type DisableTwoFactorMutation = {
  __typename?: 'Mutation';
  disableTwoFactor: { __typename?: 'TwoFactorDisableResult'; success: boolean; message: string };
};

export type RegenerateBackupCodesMutationVariables = Exact<{
  input: TwoFactorRegenerateBackupCodesInput;
}>;

export type RegenerateBackupCodesMutation = {
  __typename?: 'Mutation';
  regenerateBackupCodes: { __typename?: 'BackupCodes'; codes: Array<string>; generatedAt: string };
};

export type UserInfoFragment = {
  __typename?: 'User';
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  profileImageId: string | null;
  coverImageId: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type UserSettingsInfoFragment = {
  __typename?: 'UserSettings';
  userId: string;
  theme: string;
  animationsEnabled: boolean;
  locale: string;
  contentFilter: string;
  displayMode: string;
  timezone: string;
  updatedAt: string;
};

export type UsersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;

export type UsersQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'UserEdge';
      cursor: string;
      node: { __typename?: 'User' } & UserInfoFragment;
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

export type UserQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;

export type UserQuery = {
  __typename?: 'Query';
  user: ({ __typename?: 'User' } & UserInfoFragment) | null;
};

export type UserByUsernameQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;

export type UserByUsernameQuery = {
  __typename?: 'Query';
  userByUsername: ({ __typename?: 'User' } & UserInfoFragment) | null;
};

export type MySettingsQueryVariables = Exact<{ [key: string]: never }>;

export type MySettingsQuery = {
  __typename?: 'Query';
  mySettings: ({ __typename?: 'UserSettings' } & UserSettingsInfoFragment) | null;
};

export type UpdateProfileMutationVariables = Exact<{
  input: ProfileUpdateInput;
}>;

export type UpdateProfileMutation = {
  __typename?: 'Mutation';
  updateProfile: { __typename?: 'User' } & UserInfoFragment;
};

export type UpdateUserSettingsMutationVariables = Exact<{
  input: UserSettingsUpdateInput;
}>;

export type UpdateUserSettingsMutation = {
  __typename?: 'Mutation';
  updateUserSettings: { __typename?: 'UserSettings' } & UserSettingsInfoFragment;
};

export type WalletInfoFragment = {
  __typename?: 'Wallet';
  id: string;
  userId: string;
  balanceUsd: number;
  salesBalanceUsd: number;
  p2pBalanceUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserWalletInfoFragment = {
  __typename?: 'UserWallet';
  id: string;
  userId: string;
  walletName: string;
  currency: string;
  network: string;
  address: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DepositRequestInfoFragment = {
  __typename?: 'DepositRequest';
  id: string;
  userId: string;
  requestedUsdAmount: number;
  currency: string;
  network: string;
  expectedCryptoAmount: number;
  exchangeRate: number;
  ourDepositAddress: string;
  status: DepositStatus;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
};

export type WithdrawalRequestInfoFragment = {
  __typename?: 'WithdrawalRequest';
  id: string;
  userId: string;
  currency: string;
  amount: number;
  amountUsd: number;
  destinationAddress: string;
  memo: string | null;
  network: string;
  status: WithdrawalStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WalletTransactionInfoFragment = {
  __typename?: 'WalletTransaction';
  id: string;
  userId: string;
  paymentRequestId: string | null;
  type: TransactionType;
  balanceType: BalanceType;
  amountUsd: number;
  description: string;
  metadata: string | null;
  createdAt: string;
};

export type ExchangeRateInfoFragment = {
  __typename?: 'ExchangeRate';
  id: string;
  currency: string;
  usdRate: number;
  source: string;
  isActive: boolean;
  createdAt: string;
};

export type MyWalletQueryVariables = Exact<{ [key: string]: never }>;

export type MyWalletQuery = {
  __typename?: 'Query';
  myWallet: ({ __typename?: 'Wallet' } & WalletInfoFragment) | null;
};

export type MyWalletTransactionsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type MyWalletTransactionsQuery = {
  __typename?: 'Query';
  myWalletTransactions: Array<{ __typename?: 'WalletTransaction' } & WalletTransactionInfoFragment>;
};

export type MyUserWalletsQueryVariables = Exact<{ [key: string]: never }>;

export type MyUserWalletsQuery = {
  __typename?: 'Query';
  myUserWallets: Array<{ __typename?: 'UserWallet' } & UserWalletInfoFragment>;
};

export type MyDepositRequestsQueryVariables = Exact<{ [key: string]: never }>;

export type MyDepositRequestsQuery = {
  __typename?: 'Query';
  myDepositRequests: Array<{ __typename?: 'DepositRequest' } & DepositRequestInfoFragment>;
};

export type MyWithdrawalRequestsQueryVariables = Exact<{ [key: string]: never }>;

export type MyWithdrawalRequestsQuery = {
  __typename?: 'Query';
  myWithdrawalRequests: Array<{ __typename?: 'WithdrawalRequest' } & WithdrawalRequestInfoFragment>;
};

export type GetExchangeRateQueryVariables = Exact<{
  currency: Scalars['String']['input'];
}>;

export type GetExchangeRateQuery = { __typename?: 'Query'; getExchangeRate: number };

export type GetSupportedCurrenciesQueryVariables = Exact<{ [key: string]: never }>;

export type GetSupportedCurrenciesQuery = {
  __typename?: 'Query';
  getSupportedCurrencies: Array<string>;
};

export type CreateDepositRequestMutationVariables = Exact<{
  input: CreateDepositRequestInput;
}>;

export type CreateDepositRequestMutation = {
  __typename?: 'Mutation';
  createDepositRequest: { __typename?: 'DepositRequest' } & DepositRequestInfoFragment;
};

export type CreateWithdrawalRequestMutationVariables = Exact<{
  input: CreateWithdrawalRequestInput;
}>;

export type CreateWithdrawalRequestMutation = {
  __typename?: 'Mutation';
  createWithdrawalRequest: { __typename?: 'WithdrawalRequest' } & WithdrawalRequestInfoFragment;
};

export type RegisterUserWalletMutationVariables = Exact<{
  input: RegisterUserWalletInput;
}>;

export type RegisterUserWalletMutation = {
  __typename?: 'Mutation';
  registerUserWallet: { __typename?: 'UserWallet' } & UserWalletInfoFragment;
};

export type WalletBalanceUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type WalletBalanceUpdatedSubscription = {
  __typename?: 'Subscription';
  walletBalanceUpdated: { __typename?: 'Wallet' } & WalletInfoFragment;
};

export type WalletTransactionAddedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type WalletTransactionAddedSubscription = {
  __typename?: 'Subscription';
  walletTransactionAdded: { __typename?: 'WalletTransaction' } & WalletTransactionInfoFragment;
};

export type DepositRequestUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type DepositRequestUpdatedSubscription = {
  __typename?: 'Subscription';
  depositRequestUpdated: { __typename?: 'DepositRequest' } & DepositRequestInfoFragment;
};

export type WithdrawalRequestUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type WithdrawalRequestUpdatedSubscription = {
  __typename?: 'Subscription';
  withdrawalRequestUpdated: { __typename?: 'WithdrawalRequest' } & WithdrawalRequestInfoFragment;
};

export type PermissionInfoFragment = {
  __typename?: 'Permission';
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type UserPermissionInfoFragment = {
  __typename?: 'UserPermission';
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permission: { __typename?: 'Permission' } & PermissionInfoFragment;
  grantedByUser: {
    __typename?: 'User';
    id: string;
    username: string;
    displayName: string | null;
  } | null;
};

export type MyPermissionsQueryVariables = Exact<{ [key: string]: never }>;

export type MyPermissionsQuery = {
  __typename?: 'Query';
  myPermissions: Array<{ __typename?: 'UserPermission' } & UserPermissionInfoFragment>;
};

export type AllPermissionsQueryVariables = Exact<{ [key: string]: never }>;

export type AllPermissionsQuery = {
  __typename?: 'Query';
  allPermissions: Array<{ __typename?: 'Permission' } & PermissionInfoFragment>;
};

export type UserPermissionsQueryVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type UserPermissionsQuery = {
  __typename?: 'Query';
  userPermissions: Array<{ __typename?: 'UserPermission' } & UserPermissionInfoFragment>;
};

export type MyWalletTransactionsByBalanceQueryVariables = Exact<{
  balanceType: BalanceType;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;

export type MyWalletTransactionsByBalanceQuery = {
  __typename?: 'Query';
  myWalletTransactionsByBalance: Array<
    { __typename?: 'WalletTransaction' } & WalletTransactionInfoFragment
  >;
};

export type TransferBalanceMutationVariables = Exact<{
  input: TransferBalanceInput;
}>;

export type TransferBalanceMutation = {
  __typename?: 'Mutation';
  transferBalance: { __typename?: 'WalletTransaction' } & WalletTransactionInfoFragment;
};

export type GrantPermissionMutationVariables = Exact<{
  input: GrantPermissionInput;
}>;

export type GrantPermissionMutation = {
  __typename?: 'Mutation';
  grantPermission: { __typename?: 'UserPermission' } & UserPermissionInfoFragment;
};

export type RevokePermissionMutationVariables = Exact<{
  input: RevokePermissionInput;
}>;

export type RevokePermissionMutation = { __typename?: 'Mutation'; revokePermission: boolean };

export type NotificationAddedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type NotificationAddedSubscription = {
  __typename?: 'Subscription';
  notificationAdded: {
    __typename?: 'Notification';
    id: string;
    type: NotificationType;
    content: string;
    isRead: boolean;
    createdAt: string;
    referenceId: string | null;
    user: { __typename?: 'User'; id: string; username: string; displayName: string | null };
    actor: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    } | null;
  } | null;
};

export type NotificationCountUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type NotificationCountUpdatedSubscription = {
  __typename?: 'Subscription';
  notificationCountUpdated: number | null;
};

export type PostAddedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type PostAddedSubscription = {
  __typename?: 'Subscription';
  postAdded: { __typename?: 'Post' } & PostInfoFragment;
};

export type PostUpdatedSubscriptionVariables = Exact<{
  postId: Scalars['UUID']['input'];
}>;

export type PostUpdatedSubscription = {
  __typename?: 'Subscription';
  postUpdated: { __typename?: 'Post' } & PostInfoFragment;
};

export type CommentAddedSubscriptionVariables = Exact<{
  postId: Scalars['UUID']['input'];
}>;

export type CommentAddedSubscription = {
  __typename?: 'Subscription';
  commentAdded: {
    __typename?: 'Comment';
    id: string;
    content: string;
    createdAt: string;
    user: {
      __typename?: 'User';
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    };
    post: { __typename?: 'Post'; id: string };
  };
};

export type LikeToggledSubscriptionVariables = Exact<{
  postId: Scalars['UUID']['input'];
}>;

export type LikeToggledSubscription = {
  __typename?: 'Subscription';
  likeToggled: { __typename?: 'Post' } & PostInfoFragment;
};

export type P2PTradeUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['UUID']['input'];
}>;

export type P2PTradeUpdatedSubscription = {
  __typename?: 'Subscription';
  p2pTradeUpdated: { __typename?: 'P2PTradeRequest' } & P2PTradeInfoFragment;
};

export type P2PDisputeUpdatedSubscriptionVariables = Exact<{
  tradeId: Scalars['UUID']['input'];
}>;

export type P2PDisputeUpdatedSubscription = {
  __typename?: 'Subscription';
  p2pDisputeUpdated: { __typename?: 'P2PDispute' } & P2PDisputeInfoFragment;
};

export const UserInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const P2PTradeInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const P2POfferInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2POfferInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POffer' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
          { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const FiatCurrencyInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'FiatCurrencyInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'FiatCurrency' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const P2PBuyerPreferenceInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PBuyerPreferenceInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PBuyerPreference' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const P2PDisputeInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const PostInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const PostBasicInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostBasicInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const AdminUserDetailInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AdminUserDetailInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AdminUserDetail' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'permission' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grantedByUser' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const CommentInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const MediaInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Media' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
          { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'variants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const MessageInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const ConversationInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const SiteFeatureSettingInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SiteFeatureSettingInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'SiteFeatureSetting' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const UserFeaturePermissionInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserFeaturePermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const UserSettingsInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserSettingsInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserSettings' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'theme' } },
          { kind: 'Field', name: { kind: 'Name', value: 'animationsEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'locale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contentFilter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'timezone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const WalletInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Wallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'salesBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'p2pBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const UserWalletInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserWalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserWallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'walletName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'address' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const DepositRequestInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DepositRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'DepositRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'requestedUsdAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expectedCryptoAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'ourDepositAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const WithdrawalRequestInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WithdrawalRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WithdrawalRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'destinationAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'errorMessage' } },
          { kind: 'Field', name: { kind: 'Name', value: 'processedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const WalletTransactionInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletTransactionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WalletTransaction' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentRequestId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const ExchangeRateInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ExchangeRateInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'ExchangeRate' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'usdRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'source' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const PermissionInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const UserPermissionInfoFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserPermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserPermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permission' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PermissionInfo' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export const CreateP2PTradeRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateP2PTradeRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateP2PTradeRequestInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createP2PTradeRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateP2PTradeRequestMutationFn = Apollo.MutationFunction<
  CreateP2PTradeRequestMutation,
  CreateP2PTradeRequestMutationVariables
>;

/**
 * __useCreateP2PTradeRequestMutation__
 *
 * To run a mutation, you first call `useCreateP2PTradeRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateP2PTradeRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createP2PTradeRequestMutation, { data, loading, error }] = useCreateP2PTradeRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateP2PTradeRequestMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateP2PTradeRequestMutation,
    CreateP2PTradeRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateP2PTradeRequestMutation,
    CreateP2PTradeRequestMutationVariables
  >(CreateP2PTradeRequestDocument, options);
}
export type CreateP2PTradeRequestMutationHookResult = ReturnType<
  typeof useCreateP2PTradeRequestMutation
>;
export type CreateP2PTradeRequestMutationResult =
  Apollo.MutationResult<CreateP2PTradeRequestMutation>;
export type CreateP2PTradeRequestMutationOptions = Apollo.BaseMutationOptions<
  CreateP2PTradeRequestMutation,
  CreateP2PTradeRequestMutationVariables
>;
export const CreateP2POfferDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateP2POffer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateP2POfferInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createP2POffer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2POfferInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2POfferInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POffer' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
          { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateP2POfferMutationFn = Apollo.MutationFunction<
  CreateP2POfferMutation,
  CreateP2POfferMutationVariables
>;

/**
 * __useCreateP2POfferMutation__
 *
 * To run a mutation, you first call `useCreateP2POfferMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateP2POfferMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createP2POfferMutation, { data, loading, error }] = useCreateP2POfferMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateP2POfferMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateP2POfferMutation,
    CreateP2POfferMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<CreateP2POfferMutation, CreateP2POfferMutationVariables>(
    CreateP2POfferDocument,
    options
  );
}
export type CreateP2POfferMutationHookResult = ReturnType<typeof useCreateP2POfferMutation>;
export type CreateP2POfferMutationResult = Apollo.MutationResult<CreateP2POfferMutation>;
export type CreateP2POfferMutationOptions = Apollo.BaseMutationOptions<
  CreateP2POfferMutation,
  CreateP2POfferMutationVariables
>;
export const UpdateP2POfferDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateP2POffer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateP2POfferInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateP2POffer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2POfferInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2POfferInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POffer' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
          { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateP2POfferMutationFn = Apollo.MutationFunction<
  UpdateP2POfferMutation,
  UpdateP2POfferMutationVariables
>;

/**
 * __useUpdateP2POfferMutation__
 *
 * To run a mutation, you first call `useUpdateP2POfferMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateP2POfferMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateP2POfferMutation, { data, loading, error }] = useUpdateP2POfferMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateP2POfferMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateP2POfferMutation,
    UpdateP2POfferMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdateP2POfferMutation, UpdateP2POfferMutationVariables>(
    UpdateP2POfferDocument,
    options
  );
}
export type UpdateP2POfferMutationHookResult = ReturnType<typeof useUpdateP2POfferMutation>;
export type UpdateP2POfferMutationResult = Apollo.MutationResult<UpdateP2POfferMutation>;
export type UpdateP2POfferMutationOptions = Apollo.BaseMutationOptions<
  UpdateP2POfferMutation,
  UpdateP2POfferMutationVariables
>;
export const DeleteP2POfferDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteP2POffer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offerId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteP2POffer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offerId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offerId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteP2POfferMutationFn = Apollo.MutationFunction<
  DeleteP2POfferMutation,
  DeleteP2POfferMutationVariables
>;

/**
 * __useDeleteP2POfferMutation__
 *
 * To run a mutation, you first call `useDeleteP2POfferMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteP2POfferMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteP2POfferMutation, { data, loading, error }] = useDeleteP2POfferMutation({
 *   variables: {
 *      offerId: // value for 'offerId'
 *   },
 * });
 */
export function useDeleteP2POfferMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteP2POfferMutation,
    DeleteP2POfferMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteP2POfferMutation, DeleteP2POfferMutationVariables>(
    DeleteP2POfferDocument,
    options
  );
}
export type DeleteP2POfferMutationHookResult = ReturnType<typeof useDeleteP2POfferMutation>;
export type DeleteP2POfferMutationResult = Apollo.MutationResult<DeleteP2POfferMutation>;
export type DeleteP2POfferMutationOptions = Apollo.BaseMutationOptions<
  DeleteP2POfferMutation,
  DeleteP2POfferMutationVariables
>;
export const CancelP2PTradeRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CancelP2PTradeRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cancelP2PTradeRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tradeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CancelP2PTradeRequestMutationFn = Apollo.MutationFunction<
  CancelP2PTradeRequestMutation,
  CancelP2PTradeRequestMutationVariables
>;

/**
 * __useCancelP2PTradeRequestMutation__
 *
 * To run a mutation, you first call `useCancelP2PTradeRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelP2PTradeRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelP2PTradeRequestMutation, { data, loading, error }] = useCancelP2PTradeRequestMutation({
 *   variables: {
 *      tradeId: // value for 'tradeId'
 *   },
 * });
 */
export function useCancelP2PTradeRequestMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CancelP2PTradeRequestMutation,
    CancelP2PTradeRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CancelP2PTradeRequestMutation,
    CancelP2PTradeRequestMutationVariables
  >(CancelP2PTradeRequestDocument, options);
}
export type CancelP2PTradeRequestMutationHookResult = ReturnType<
  typeof useCancelP2PTradeRequestMutation
>;
export type CancelP2PTradeRequestMutationResult =
  Apollo.MutationResult<CancelP2PTradeRequestMutation>;
export type CancelP2PTradeRequestMutationOptions = Apollo.BaseMutationOptions<
  CancelP2PTradeRequestMutation,
  CancelP2PTradeRequestMutationVariables
>;
export const MarkP2PPaymentSentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkP2PPaymentSent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'markP2PPaymentSent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tradeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type MarkP2PPaymentSentMutationFn = Apollo.MutationFunction<
  MarkP2PPaymentSentMutation,
  MarkP2PPaymentSentMutationVariables
>;

/**
 * __useMarkP2PPaymentSentMutation__
 *
 * To run a mutation, you first call `useMarkP2PPaymentSentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkP2PPaymentSentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markP2PPaymentSentMutation, { data, loading, error }] = useMarkP2PPaymentSentMutation({
 *   variables: {
 *      tradeId: // value for 'tradeId'
 *   },
 * });
 */
export function useMarkP2PPaymentSentMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    MarkP2PPaymentSentMutation,
    MarkP2PPaymentSentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    MarkP2PPaymentSentMutation,
    MarkP2PPaymentSentMutationVariables
  >(MarkP2PPaymentSentDocument, options);
}
export type MarkP2PPaymentSentMutationHookResult = ReturnType<typeof useMarkP2PPaymentSentMutation>;
export type MarkP2PPaymentSentMutationResult = Apollo.MutationResult<MarkP2PPaymentSentMutation>;
export type MarkP2PPaymentSentMutationOptions = Apollo.BaseMutationOptions<
  MarkP2PPaymentSentMutation,
  MarkP2PPaymentSentMutationVariables
>;
export const AcceptP2PTradeRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AcceptP2PTradeRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'acceptP2PTradeRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tradeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type AcceptP2PTradeRequestMutationFn = Apollo.MutationFunction<
  AcceptP2PTradeRequestMutation,
  AcceptP2PTradeRequestMutationVariables
>;

/**
 * __useAcceptP2PTradeRequestMutation__
 *
 * To run a mutation, you first call `useAcceptP2PTradeRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAcceptP2PTradeRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [acceptP2PTradeRequestMutation, { data, loading, error }] = useAcceptP2PTradeRequestMutation({
 *   variables: {
 *      tradeId: // value for 'tradeId'
 *   },
 * });
 */
export function useAcceptP2PTradeRequestMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AcceptP2PTradeRequestMutation,
    AcceptP2PTradeRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    AcceptP2PTradeRequestMutation,
    AcceptP2PTradeRequestMutationVariables
  >(AcceptP2PTradeRequestDocument, options);
}
export type AcceptP2PTradeRequestMutationHookResult = ReturnType<
  typeof useAcceptP2PTradeRequestMutation
>;
export type AcceptP2PTradeRequestMutationResult =
  Apollo.MutationResult<AcceptP2PTradeRequestMutation>;
export type AcceptP2PTradeRequestMutationOptions = Apollo.BaseMutationOptions<
  AcceptP2PTradeRequestMutation,
  AcceptP2PTradeRequestMutationVariables
>;
export const ConfirmP2PPaymentReceivedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ConfirmP2PPaymentReceived' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ConfirmP2PPaymentInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'confirmP2PPaymentReceived' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ConfirmP2PPaymentReceivedMutationFn = Apollo.MutationFunction<
  ConfirmP2PPaymentReceivedMutation,
  ConfirmP2PPaymentReceivedMutationVariables
>;

/**
 * __useConfirmP2PPaymentReceivedMutation__
 *
 * To run a mutation, you first call `useConfirmP2PPaymentReceivedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmP2PPaymentReceivedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmP2PPaymentReceivedMutation, { data, loading, error }] = useConfirmP2PPaymentReceivedMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConfirmP2PPaymentReceivedMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ConfirmP2PPaymentReceivedMutation,
    ConfirmP2PPaymentReceivedMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    ConfirmP2PPaymentReceivedMutation,
    ConfirmP2PPaymentReceivedMutationVariables
  >(ConfirmP2PPaymentReceivedDocument, options);
}
export type ConfirmP2PPaymentReceivedMutationHookResult = ReturnType<
  typeof useConfirmP2PPaymentReceivedMutation
>;
export type ConfirmP2PPaymentReceivedMutationResult =
  Apollo.MutationResult<ConfirmP2PPaymentReceivedMutation>;
export type ConfirmP2PPaymentReceivedMutationOptions = Apollo.BaseMutationOptions<
  ConfirmP2PPaymentReceivedMutation,
  ConfirmP2PPaymentReceivedMutationVariables
>;
export const CreateP2PDisputeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateP2PDispute' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateP2PDisputeInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createP2PDispute' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateP2PDisputeMutationFn = Apollo.MutationFunction<
  CreateP2PDisputeMutation,
  CreateP2PDisputeMutationVariables
>;

/**
 * __useCreateP2PDisputeMutation__
 *
 * To run a mutation, you first call `useCreateP2PDisputeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateP2PDisputeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createP2PDisputeMutation, { data, loading, error }] = useCreateP2PDisputeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateP2PDisputeMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateP2PDisputeMutation,
    CreateP2PDisputeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<CreateP2PDisputeMutation, CreateP2PDisputeMutationVariables>(
    CreateP2PDisputeDocument,
    options
  );
}
export type CreateP2PDisputeMutationHookResult = ReturnType<typeof useCreateP2PDisputeMutation>;
export type CreateP2PDisputeMutationResult = Apollo.MutationResult<CreateP2PDisputeMutation>;
export type CreateP2PDisputeMutationOptions = Apollo.BaseMutationOptions<
  CreateP2PDisputeMutation,
  CreateP2PDisputeMutationVariables
>;
export const ResolveP2PDisputeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResolveP2PDispute' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ResolveP2PDisputeInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'resolveP2PDispute' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ResolveP2PDisputeMutationFn = Apollo.MutationFunction<
  ResolveP2PDisputeMutation,
  ResolveP2PDisputeMutationVariables
>;

/**
 * __useResolveP2PDisputeMutation__
 *
 * To run a mutation, you first call `useResolveP2PDisputeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResolveP2PDisputeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resolveP2PDisputeMutation, { data, loading, error }] = useResolveP2PDisputeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useResolveP2PDisputeMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ResolveP2PDisputeMutation,
    ResolveP2PDisputeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    ResolveP2PDisputeMutation,
    ResolveP2PDisputeMutationVariables
  >(ResolveP2PDisputeDocument, options);
}
export type ResolveP2PDisputeMutationHookResult = ReturnType<typeof useResolveP2PDisputeMutation>;
export type ResolveP2PDisputeMutationResult = Apollo.MutationResult<ResolveP2PDisputeMutation>;
export type ResolveP2PDisputeMutationOptions = Apollo.BaseMutationOptions<
  ResolveP2PDisputeMutation,
  ResolveP2PDisputeMutationVariables
>;
export const UpdateP2PBuyerPreferenceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateP2PBuyerPreference' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateP2PBuyerPreferenceInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateP2PBuyerPreference' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PBuyerPreferenceInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PBuyerPreferenceInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PBuyerPreference' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateP2PBuyerPreferenceMutationFn = Apollo.MutationFunction<
  UpdateP2PBuyerPreferenceMutation,
  UpdateP2PBuyerPreferenceMutationVariables
>;

/**
 * __useUpdateP2PBuyerPreferenceMutation__
 *
 * To run a mutation, you first call `useUpdateP2PBuyerPreferenceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateP2PBuyerPreferenceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateP2PBuyerPreferenceMutation, { data, loading, error }] = useUpdateP2PBuyerPreferenceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateP2PBuyerPreferenceMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateP2PBuyerPreferenceMutation,
    UpdateP2PBuyerPreferenceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateP2PBuyerPreferenceMutation,
    UpdateP2PBuyerPreferenceMutationVariables
  >(UpdateP2PBuyerPreferenceDocument, options);
}
export type UpdateP2PBuyerPreferenceMutationHookResult = ReturnType<
  typeof useUpdateP2PBuyerPreferenceMutation
>;
export type UpdateP2PBuyerPreferenceMutationResult =
  Apollo.MutationResult<UpdateP2PBuyerPreferenceMutation>;
export type UpdateP2PBuyerPreferenceMutationOptions = Apollo.BaseMutationOptions<
  UpdateP2PBuyerPreferenceMutation,
  UpdateP2PBuyerPreferenceMutationVariables
>;
export const DeleteP2PBuyerPreferenceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteP2PBuyerPreference' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteP2PBuyerPreference' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteP2PBuyerPreferenceMutationFn = Apollo.MutationFunction<
  DeleteP2PBuyerPreferenceMutation,
  DeleteP2PBuyerPreferenceMutationVariables
>;

/**
 * __useDeleteP2PBuyerPreferenceMutation__
 *
 * To run a mutation, you first call `useDeleteP2PBuyerPreferenceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteP2PBuyerPreferenceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteP2PBuyerPreferenceMutation, { data, loading, error }] = useDeleteP2PBuyerPreferenceMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteP2PBuyerPreferenceMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteP2PBuyerPreferenceMutation,
    DeleteP2PBuyerPreferenceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    DeleteP2PBuyerPreferenceMutation,
    DeleteP2PBuyerPreferenceMutationVariables
  >(DeleteP2PBuyerPreferenceDocument, options);
}
export type DeleteP2PBuyerPreferenceMutationHookResult = ReturnType<
  typeof useDeleteP2PBuyerPreferenceMutation
>;
export type DeleteP2PBuyerPreferenceMutationResult =
  Apollo.MutationResult<DeleteP2PBuyerPreferenceMutation>;
export type DeleteP2PBuyerPreferenceMutationOptions = Apollo.BaseMutationOptions<
  DeleteP2PBuyerPreferenceMutation,
  DeleteP2PBuyerPreferenceMutationVariables
>;
export const PurchasePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'PurchasePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PurchasePostInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'purchasePost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                { kind: 'Field', name: { kind: 'Name', value: 'purchasedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'post' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'user' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type PurchasePostMutationFn = Apollo.MutationFunction<
  PurchasePostMutation,
  PurchasePostMutationVariables
>;

/**
 * __usePurchasePostMutation__
 *
 * To run a mutation, you first call `usePurchasePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePurchasePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [purchasePostMutation, { data, loading, error }] = usePurchasePostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePurchasePostMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PurchasePostMutation,
    PurchasePostMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<PurchasePostMutation, PurchasePostMutationVariables>(
    PurchasePostDocument,
    options
  );
}
export type PurchasePostMutationHookResult = ReturnType<typeof usePurchasePostMutation>;
export type PurchasePostMutationResult = Apollo.MutationResult<PurchasePostMutation>;
export type PurchasePostMutationOptions = Apollo.BaseMutationOptions<
  PurchasePostMutation,
  PurchasePostMutationVariables
>;
export const UpdatePostToPaidDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePostToPaid' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePostToPaidInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePostToPaid' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'media' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'variants' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                            { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'viewsCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isPurchasedByCurrentUser' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdatePostToPaidMutationFn = Apollo.MutationFunction<
  UpdatePostToPaidMutation,
  UpdatePostToPaidMutationVariables
>;

/**
 * __useUpdatePostToPaidMutation__
 *
 * To run a mutation, you first call `useUpdatePostToPaidMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePostToPaidMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePostToPaidMutation, { data, loading, error }] = useUpdatePostToPaidMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePostToPaidMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdatePostToPaidMutation,
    UpdatePostToPaidMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdatePostToPaidMutation, UpdatePostToPaidMutationVariables>(
    UpdatePostToPaidDocument,
    options
  );
}
export type UpdatePostToPaidMutationHookResult = ReturnType<typeof useUpdatePostToPaidMutation>;
export type UpdatePostToPaidMutationResult = Apollo.MutationResult<UpdatePostToPaidMutation>;
export type UpdatePostToPaidMutationOptions = Apollo.BaseMutationOptions<
  UpdatePostToPaidMutation,
  UpdatePostToPaidMutationVariables
>;
export const GeneratePresignedUploadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'GeneratePresignedUpload' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PresignedUploadInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'generatePresignedUpload' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'uploadUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'downloadUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mediaId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fields' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type GeneratePresignedUploadMutationFn = Apollo.MutationFunction<
  GeneratePresignedUploadMutation,
  GeneratePresignedUploadMutationVariables
>;

/**
 * __useGeneratePresignedUploadMutation__
 *
 * To run a mutation, you first call `useGeneratePresignedUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGeneratePresignedUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generatePresignedUploadMutation, { data, loading, error }] = useGeneratePresignedUploadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGeneratePresignedUploadMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    GeneratePresignedUploadMutation,
    GeneratePresignedUploadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    GeneratePresignedUploadMutation,
    GeneratePresignedUploadMutationVariables
  >(GeneratePresignedUploadDocument, options);
}
export type GeneratePresignedUploadMutationHookResult = ReturnType<
  typeof useGeneratePresignedUploadMutation
>;
export type GeneratePresignedUploadMutationResult =
  Apollo.MutationResult<GeneratePresignedUploadMutation>;
export type GeneratePresignedUploadMutationOptions = Apollo.BaseMutationOptions<
  GeneratePresignedUploadMutation,
  GeneratePresignedUploadMutationVariables
>;
export const GeneratePresignedDownloadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'GeneratePresignedDownload' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 's3Key' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'generatePresignedDownload' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 's3Key' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 's3Key' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'downloadUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type GeneratePresignedDownloadMutationFn = Apollo.MutationFunction<
  GeneratePresignedDownloadMutation,
  GeneratePresignedDownloadMutationVariables
>;

/**
 * __useGeneratePresignedDownloadMutation__
 *
 * To run a mutation, you first call `useGeneratePresignedDownloadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGeneratePresignedDownloadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generatePresignedDownloadMutation, { data, loading, error }] = useGeneratePresignedDownloadMutation({
 *   variables: {
 *      s3Key: // value for 's3Key'
 *   },
 * });
 */
export function useGeneratePresignedDownloadMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    GeneratePresignedDownloadMutation,
    GeneratePresignedDownloadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    GeneratePresignedDownloadMutation,
    GeneratePresignedDownloadMutationVariables
  >(GeneratePresignedDownloadDocument, options);
}
export type GeneratePresignedDownloadMutationHookResult = ReturnType<
  typeof useGeneratePresignedDownloadMutation
>;
export type GeneratePresignedDownloadMutationResult =
  Apollo.MutationResult<GeneratePresignedDownloadMutation>;
export type GeneratePresignedDownloadMutationOptions = Apollo.BaseMutationOptions<
  GeneratePresignedDownloadMutation,
  GeneratePresignedDownloadMutationVariables
>;
export const NotifyUploadCompleteDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'NotifyUploadComplete' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mediaId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 's3Key' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notifyUploadComplete' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mediaId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mediaId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 's3Key' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 's3Key' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'media' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type NotifyUploadCompleteMutationFn = Apollo.MutationFunction<
  NotifyUploadCompleteMutation,
  NotifyUploadCompleteMutationVariables
>;

/**
 * __useNotifyUploadCompleteMutation__
 *
 * To run a mutation, you first call `useNotifyUploadCompleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useNotifyUploadCompleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [notifyUploadCompleteMutation, { data, loading, error }] = useNotifyUploadCompleteMutation({
 *   variables: {
 *      mediaId: // value for 'mediaId'
 *      s3Key: // value for 's3Key'
 *   },
 * });
 */
export function useNotifyUploadCompleteMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    NotifyUploadCompleteMutation,
    NotifyUploadCompleteMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    NotifyUploadCompleteMutation,
    NotifyUploadCompleteMutationVariables
  >(NotifyUploadCompleteDocument, options);
}
export type NotifyUploadCompleteMutationHookResult = ReturnType<
  typeof useNotifyUploadCompleteMutation
>;
export type NotifyUploadCompleteMutationResult =
  Apollo.MutationResult<NotifyUploadCompleteMutation>;
export type NotifyUploadCompleteMutationOptions = Apollo.BaseMutationOptions<
  NotifyUploadCompleteMutation,
  NotifyUploadCompleteMutationVariables
>;
export const UploadMediaUnifiedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UploadMediaUnified' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UnifiedUploadInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'uploadMediaUnified' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mediaId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'size' } },
                { kind: 'Field', name: { kind: 'Name', value: 'downloadUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UploadMediaUnifiedMutationFn = Apollo.MutationFunction<
  UploadMediaUnifiedMutation,
  UploadMediaUnifiedMutationVariables
>;

/**
 * __useUploadMediaUnifiedMutation__
 *
 * To run a mutation, you first call `useUploadMediaUnifiedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadMediaUnifiedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadMediaUnifiedMutation, { data, loading, error }] = useUploadMediaUnifiedMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadMediaUnifiedMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UploadMediaUnifiedMutation,
    UploadMediaUnifiedMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UploadMediaUnifiedMutation,
    UploadMediaUnifiedMutationVariables
  >(UploadMediaUnifiedDocument, options);
}
export type UploadMediaUnifiedMutationHookResult = ReturnType<typeof useUploadMediaUnifiedMutation>;
export type UploadMediaUnifiedMutationResult = Apollo.MutationResult<UploadMediaUnifiedMutation>;
export type UploadMediaUnifiedMutationOptions = Apollo.BaseMutationOptions<
  UploadMediaUnifiedMutation,
  UploadMediaUnifiedMutationVariables
>;
export const UpdateUserAvatarDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUserAvatar' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateUserAvatarInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateUserAvatar' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateUserAvatarMutationFn = Apollo.MutationFunction<
  UpdateUserAvatarMutation,
  UpdateUserAvatarMutationVariables
>;

/**
 * __useUpdateUserAvatarMutation__
 *
 * To run a mutation, you first call `useUpdateUserAvatarMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserAvatarMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserAvatarMutation, { data, loading, error }] = useUpdateUserAvatarMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserAvatarMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateUserAvatarMutation,
    UpdateUserAvatarMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdateUserAvatarMutation, UpdateUserAvatarMutationVariables>(
    UpdateUserAvatarDocument,
    options
  );
}
export type UpdateUserAvatarMutationHookResult = ReturnType<typeof useUpdateUserAvatarMutation>;
export type UpdateUserAvatarMutationResult = Apollo.MutationResult<UpdateUserAvatarMutation>;
export type UpdateUserAvatarMutationOptions = Apollo.BaseMutationOptions<
  UpdateUserAvatarMutation,
  UpdateUserAvatarMutationVariables
>;
export const DeleteUserAvatarDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteUserAvatar' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteUserAvatar' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteUserAvatarMutationFn = Apollo.MutationFunction<
  DeleteUserAvatarMutation,
  DeleteUserAvatarMutationVariables
>;

/**
 * __useDeleteUserAvatarMutation__
 *
 * To run a mutation, you first call `useDeleteUserAvatarMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserAvatarMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserAvatarMutation, { data, loading, error }] = useDeleteUserAvatarMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteUserAvatarMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteUserAvatarMutation,
    DeleteUserAvatarMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteUserAvatarMutation, DeleteUserAvatarMutationVariables>(
    DeleteUserAvatarDocument,
    options
  );
}
export type DeleteUserAvatarMutationHookResult = ReturnType<typeof useDeleteUserAvatarMutation>;
export type DeleteUserAvatarMutationResult = Apollo.MutationResult<DeleteUserAvatarMutation>;
export type DeleteUserAvatarMutationOptions = Apollo.BaseMutationOptions<
  DeleteUserAvatarMutation,
  DeleteUserAvatarMutationVariables
>;
export const UpdateUserCoverDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUserCover' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateUserCoverInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateUserCover' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateUserCoverMutationFn = Apollo.MutationFunction<
  UpdateUserCoverMutation,
  UpdateUserCoverMutationVariables
>;

/**
 * __useUpdateUserCoverMutation__
 *
 * To run a mutation, you first call `useUpdateUserCoverMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserCoverMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserCoverMutation, { data, loading, error }] = useUpdateUserCoverMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserCoverMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateUserCoverMutation,
    UpdateUserCoverMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdateUserCoverMutation, UpdateUserCoverMutationVariables>(
    UpdateUserCoverDocument,
    options
  );
}
export type UpdateUserCoverMutationHookResult = ReturnType<typeof useUpdateUserCoverMutation>;
export type UpdateUserCoverMutationResult = Apollo.MutationResult<UpdateUserCoverMutation>;
export type UpdateUserCoverMutationOptions = Apollo.BaseMutationOptions<
  UpdateUserCoverMutation,
  UpdateUserCoverMutationVariables
>;
export const DeleteUserCoverDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteUserCover' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteUserCover' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteUserCoverMutationFn = Apollo.MutationFunction<
  DeleteUserCoverMutation,
  DeleteUserCoverMutationVariables
>;

/**
 * __useDeleteUserCoverMutation__
 *
 * To run a mutation, you first call `useDeleteUserCoverMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserCoverMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserCoverMutation, { data, loading, error }] = useDeleteUserCoverMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteUserCoverMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteUserCoverMutation,
    DeleteUserCoverMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteUserCoverMutation, DeleteUserCoverMutationVariables>(
    DeleteUserCoverDocument,
    options
  );
}
export type DeleteUserCoverMutationHookResult = ReturnType<typeof useDeleteUserCoverMutation>;
export type DeleteUserCoverMutationResult = Apollo.MutationResult<DeleteUserCoverMutation>;
export type DeleteUserCoverMutationOptions = Apollo.BaseMutationOptions<
  DeleteUserCoverMutation,
  DeleteUserCoverMutationVariables
>;
export const GetSystemStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetSystemStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'systemStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalUsers' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalPosts' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalMedia' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalComments' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalLikes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'storageUsed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'activeUsers24h' } },
                { kind: 'Field', name: { kind: 'Name', value: 'activeUsers7d' } },
                { kind: 'Field', name: { kind: 'Name', value: 'activeUsers30d' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetSystemStatsQuery__
 *
 * To run a query within a React component, call `useGetSystemStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSystemStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSystemStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSystemStatsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<GetSystemStatsQuery, GetSystemStatsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetSystemStatsQuery, GetSystemStatsQueryVariables>(
    GetSystemStatsDocument,
    options
  );
}
export function useGetSystemStatsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetSystemStatsQuery,
    GetSystemStatsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetSystemStatsQuery, GetSystemStatsQueryVariables>(
    GetSystemStatsDocument,
    options
  );
}
export function useGetSystemStatsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetSystemStatsQuery, GetSystemStatsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetSystemStatsQuery, GetSystemStatsQueryVariables>(
    GetSystemStatsDocument,
    options
  );
}
export type GetSystemStatsQueryHookResult = ReturnType<typeof useGetSystemStatsQuery>;
export type GetSystemStatsLazyQueryHookResult = ReturnType<typeof useGetSystemStatsLazyQuery>;
export type GetSystemStatsSuspenseQueryHookResult = ReturnType<
  typeof useGetSystemStatsSuspenseQuery
>;
export type GetSystemStatsQueryResult = Apollo.QueryResult<
  GetSystemStatsQuery,
  GetSystemStatsQueryVariables
>;
export const ResetPostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResetPosts' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'resetPosts' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                { kind: 'Field', name: { kind: 'Name', value: 'deletedCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ResetPostsMutationFn = Apollo.MutationFunction<
  ResetPostsMutation,
  ResetPostsMutationVariables
>;

/**
 * __useResetPostsMutation__
 *
 * To run a mutation, you first call `useResetPostsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetPostsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetPostsMutation, { data, loading, error }] = useResetPostsMutation({
 *   variables: {
 *   },
 * });
 */
export function useResetPostsMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ResetPostsMutation,
    ResetPostsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<ResetPostsMutation, ResetPostsMutationVariables>(
    ResetPostsDocument,
    options
  );
}
export type ResetPostsMutationHookResult = ReturnType<typeof useResetPostsMutation>;
export type ResetPostsMutationResult = Apollo.MutationResult<ResetPostsMutation>;
export type ResetPostsMutationOptions = Apollo.BaseMutationOptions<
  ResetPostsMutation,
  ResetPostsMutationVariables
>;
export const ResetPostsAndMediaDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResetPostsAndMedia' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'resetPostsAndMedia' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                { kind: 'Field', name: { kind: 'Name', value: 'deletedCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ResetPostsAndMediaMutationFn = Apollo.MutationFunction<
  ResetPostsAndMediaMutation,
  ResetPostsAndMediaMutationVariables
>;

/**
 * __useResetPostsAndMediaMutation__
 *
 * To run a mutation, you first call `useResetPostsAndMediaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetPostsAndMediaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetPostsAndMediaMutation, { data, loading, error }] = useResetPostsAndMediaMutation({
 *   variables: {
 *   },
 * });
 */
export function useResetPostsAndMediaMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ResetPostsAndMediaMutation,
    ResetPostsAndMediaMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    ResetPostsAndMediaMutation,
    ResetPostsAndMediaMutationVariables
  >(ResetPostsAndMediaDocument, options);
}
export type ResetPostsAndMediaMutationHookResult = ReturnType<typeof useResetPostsAndMediaMutation>;
export type ResetPostsAndMediaMutationResult = Apollo.MutationResult<ResetPostsAndMediaMutation>;
export type ResetPostsAndMediaMutationOptions = Apollo.BaseMutationOptions<
  ResetPostsAndMediaMutation,
  ResetPostsAndMediaMutationVariables
>;
export const AdminUsersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AdminUsers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '20' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminUsers' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'AdminUserDetailInfo' },
                            },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AdminUserDetailInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AdminUserDetail' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'permission' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grantedByUser' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAdminUsersQuery__
 *
 * To run a query within a React component, call `useAdminUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminUsersQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useAdminUsersQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<AdminUsersQuery, AdminUsersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AdminUsersQuery, AdminUsersQueryVariables>(
    AdminUsersDocument,
    options
  );
}
export function useAdminUsersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<AdminUsersQuery, AdminUsersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AdminUsersQuery, AdminUsersQueryVariables>(
    AdminUsersDocument,
    options
  );
}
export function useAdminUsersSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<AdminUsersQuery, AdminUsersQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AdminUsersQuery, AdminUsersQueryVariables>(
    AdminUsersDocument,
    options
  );
}
export type AdminUsersQueryHookResult = ReturnType<typeof useAdminUsersQuery>;
export type AdminUsersLazyQueryHookResult = ReturnType<typeof useAdminUsersLazyQuery>;
export type AdminUsersSuspenseQueryHookResult = ReturnType<typeof useAdminUsersSuspenseQuery>;
export type AdminUsersQueryResult = Apollo.QueryResult<AdminUsersQuery, AdminUsersQueryVariables>;
export const AdminUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AdminUser' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminUser' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AdminUserDetailInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AdminUserDetailInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AdminUserDetail' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'permission' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grantedByUser' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAdminUserQuery__
 *
 * To run a query within a React component, call `useAdminUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAdminUserQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<AdminUserQuery, AdminUserQueryVariables> &
    ({ variables: AdminUserQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AdminUserQuery, AdminUserQueryVariables>(
    AdminUserDocument,
    options
  );
}
export function useAdminUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<AdminUserQuery, AdminUserQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AdminUserQuery, AdminUserQueryVariables>(
    AdminUserDocument,
    options
  );
}
export function useAdminUserSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<AdminUserQuery, AdminUserQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AdminUserQuery, AdminUserQueryVariables>(
    AdminUserDocument,
    options
  );
}
export type AdminUserQueryHookResult = ReturnType<typeof useAdminUserQuery>;
export type AdminUserLazyQueryHookResult = ReturnType<typeof useAdminUserLazyQuery>;
export type AdminUserSuspenseQueryHookResult = ReturnType<typeof useAdminUserSuspenseQuery>;
export type AdminUserQueryResult = Apollo.QueryResult<AdminUserQuery, AdminUserQueryVariables>;
export const AdminUpdateUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AdminUpdateUser' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'AdminUpdateUserInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminUpdateUser' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'FragmentSpread',
                        name: { kind: 'Name', value: 'AdminUserDetailInfo' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AdminUserDetailInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AdminUserDetail' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'permission' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grantedByUser' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type AdminUpdateUserMutationFn = Apollo.MutationFunction<
  AdminUpdateUserMutation,
  AdminUpdateUserMutationVariables
>;

/**
 * __useAdminUpdateUserMutation__
 *
 * To run a mutation, you first call `useAdminUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminUpdateUserMutation, { data, loading, error }] = useAdminUpdateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAdminUpdateUserMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AdminUpdateUserMutation,
    AdminUpdateUserMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<AdminUpdateUserMutation, AdminUpdateUserMutationVariables>(
    AdminUpdateUserDocument,
    options
  );
}
export type AdminUpdateUserMutationHookResult = ReturnType<typeof useAdminUpdateUserMutation>;
export type AdminUpdateUserMutationResult = Apollo.MutationResult<AdminUpdateUserMutation>;
export type AdminUpdateUserMutationOptions = Apollo.BaseMutationOptions<
  AdminUpdateUserMutation,
  AdminUpdateUserMutationVariables
>;
export const AdminChangeUserPasswordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AdminChangeUserPassword' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AdminChangeUserPasswordInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminChangeUserPassword' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type AdminChangeUserPasswordMutationFn = Apollo.MutationFunction<
  AdminChangeUserPasswordMutation,
  AdminChangeUserPasswordMutationVariables
>;

/**
 * __useAdminChangeUserPasswordMutation__
 *
 * To run a mutation, you first call `useAdminChangeUserPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminChangeUserPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminChangeUserPasswordMutation, { data, loading, error }] = useAdminChangeUserPasswordMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAdminChangeUserPasswordMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AdminChangeUserPasswordMutation,
    AdminChangeUserPasswordMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    AdminChangeUserPasswordMutation,
    AdminChangeUserPasswordMutationVariables
  >(AdminChangeUserPasswordDocument, options);
}
export type AdminChangeUserPasswordMutationHookResult = ReturnType<
  typeof useAdminChangeUserPasswordMutation
>;
export type AdminChangeUserPasswordMutationResult =
  Apollo.MutationResult<AdminChangeUserPasswordMutation>;
export type AdminChangeUserPasswordMutationOptions = Apollo.BaseMutationOptions<
  AdminChangeUserPasswordMutation,
  AdminChangeUserPasswordMutationVariables
>;
export const AdminDeleteUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AdminDeleteUser' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminDeleteUser' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type AdminDeleteUserMutationFn = Apollo.MutationFunction<
  AdminDeleteUserMutation,
  AdminDeleteUserMutationVariables
>;

/**
 * __useAdminDeleteUserMutation__
 *
 * To run a mutation, you first call `useAdminDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminDeleteUserMutation, { data, loading, error }] = useAdminDeleteUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useAdminDeleteUserMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AdminDeleteUserMutation,
    AdminDeleteUserMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<AdminDeleteUserMutation, AdminDeleteUserMutationVariables>(
    AdminDeleteUserDocument,
    options
  );
}
export type AdminDeleteUserMutationHookResult = ReturnType<typeof useAdminDeleteUserMutation>;
export type AdminDeleteUserMutationResult = Apollo.MutationResult<AdminDeleteUserMutation>;
export type AdminDeleteUserMutationOptions = Apollo.BaseMutationOptions<
  AdminDeleteUserMutation,
  AdminDeleteUserMutationVariables
>;
export const AdminP2PDisputesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AdminP2PDisputes' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDisputeStatus' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'adminP2PDisputes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'trade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAdminP2PDisputesQuery__
 *
 * To run a query within a React component, call `useAdminP2PDisputesQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminP2PDisputesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminP2PDisputesQuery({
 *   variables: {
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useAdminP2PDisputesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    AdminP2PDisputesQuery,
    AdminP2PDisputesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AdminP2PDisputesQuery, AdminP2PDisputesQueryVariables>(
    AdminP2PDisputesDocument,
    options
  );
}
export function useAdminP2PDisputesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AdminP2PDisputesQuery,
    AdminP2PDisputesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AdminP2PDisputesQuery, AdminP2PDisputesQueryVariables>(
    AdminP2PDisputesDocument,
    options
  );
}
export function useAdminP2PDisputesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        AdminP2PDisputesQuery,
        AdminP2PDisputesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AdminP2PDisputesQuery, AdminP2PDisputesQueryVariables>(
    AdminP2PDisputesDocument,
    options
  );
}
export type AdminP2PDisputesQueryHookResult = ReturnType<typeof useAdminP2PDisputesQuery>;
export type AdminP2PDisputesLazyQueryHookResult = ReturnType<typeof useAdminP2PDisputesLazyQuery>;
export type AdminP2PDisputesSuspenseQueryHookResult = ReturnType<
  typeof useAdminP2PDisputesSuspenseQuery
>;
export type AdminP2PDisputesQueryResult = Apollo.QueryResult<
  AdminP2PDisputesQuery,
  AdminP2PDisputesQueryVariables
>;
export const AdminP2PDisputeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AdminP2PDispute' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'disputeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'p2pDispute' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'disputeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'disputeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'trade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAdminP2PDisputeQuery__
 *
 * To run a query within a React component, call `useAdminP2PDisputeQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminP2PDisputeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminP2PDisputeQuery({
 *   variables: {
 *      disputeId: // value for 'disputeId'
 *   },
 * });
 */
export function useAdminP2PDisputeQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    AdminP2PDisputeQuery,
    AdminP2PDisputeQueryVariables
  > &
    ({ variables: AdminP2PDisputeQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AdminP2PDisputeQuery, AdminP2PDisputeQueryVariables>(
    AdminP2PDisputeDocument,
    options
  );
}
export function useAdminP2PDisputeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AdminP2PDisputeQuery,
    AdminP2PDisputeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AdminP2PDisputeQuery, AdminP2PDisputeQueryVariables>(
    AdminP2PDisputeDocument,
    options
  );
}
export function useAdminP2PDisputeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<AdminP2PDisputeQuery, AdminP2PDisputeQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AdminP2PDisputeQuery, AdminP2PDisputeQueryVariables>(
    AdminP2PDisputeDocument,
    options
  );
}
export type AdminP2PDisputeQueryHookResult = ReturnType<typeof useAdminP2PDisputeQuery>;
export type AdminP2PDisputeLazyQueryHookResult = ReturnType<typeof useAdminP2PDisputeLazyQuery>;
export type AdminP2PDisputeSuspenseQueryHookResult = ReturnType<
  typeof useAdminP2PDisputeSuspenseQuery
>;
export type AdminP2PDisputeQueryResult = Apollo.QueryResult<
  AdminP2PDisputeQuery,
  AdminP2PDisputeQueryVariables
>;
export const CreateFiatCurrencyDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateFiatCurrency' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateFiatCurrencyInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createFiatCurrency' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateFiatCurrencyMutationFn = Apollo.MutationFunction<
  CreateFiatCurrencyMutation,
  CreateFiatCurrencyMutationVariables
>;

/**
 * __useCreateFiatCurrencyMutation__
 *
 * To run a mutation, you first call `useCreateFiatCurrencyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFiatCurrencyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFiatCurrencyMutation, { data, loading, error }] = useCreateFiatCurrencyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateFiatCurrencyMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateFiatCurrencyMutation,
    CreateFiatCurrencyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateFiatCurrencyMutation,
    CreateFiatCurrencyMutationVariables
  >(CreateFiatCurrencyDocument, options);
}
export type CreateFiatCurrencyMutationHookResult = ReturnType<typeof useCreateFiatCurrencyMutation>;
export type CreateFiatCurrencyMutationResult = Apollo.MutationResult<CreateFiatCurrencyMutation>;
export type CreateFiatCurrencyMutationOptions = Apollo.BaseMutationOptions<
  CreateFiatCurrencyMutation,
  CreateFiatCurrencyMutationVariables
>;
export const UpdateFiatCurrencyDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateFiatCurrency' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateFiatCurrencyInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateFiatCurrency' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateFiatCurrencyMutationFn = Apollo.MutationFunction<
  UpdateFiatCurrencyMutation,
  UpdateFiatCurrencyMutationVariables
>;

/**
 * __useUpdateFiatCurrencyMutation__
 *
 * To run a mutation, you first call `useUpdateFiatCurrencyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateFiatCurrencyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateFiatCurrencyMutation, { data, loading, error }] = useUpdateFiatCurrencyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateFiatCurrencyMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateFiatCurrencyMutation,
    UpdateFiatCurrencyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateFiatCurrencyMutation,
    UpdateFiatCurrencyMutationVariables
  >(UpdateFiatCurrencyDocument, options);
}
export type UpdateFiatCurrencyMutationHookResult = ReturnType<typeof useUpdateFiatCurrencyMutation>;
export type UpdateFiatCurrencyMutationResult = Apollo.MutationResult<UpdateFiatCurrencyMutation>;
export type UpdateFiatCurrencyMutationOptions = Apollo.BaseMutationOptions<
  UpdateFiatCurrencyMutation,
  UpdateFiatCurrencyMutationVariables
>;
export const AdminFiatCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AdminFiatCurrencies' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'fiatCurrencies' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAdminFiatCurrenciesQuery__
 *
 * To run a query within a React component, call `useAdminFiatCurrenciesQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminFiatCurrenciesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminFiatCurrenciesQuery({
 *   variables: {
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useAdminFiatCurrenciesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    AdminFiatCurrenciesQuery,
    AdminFiatCurrenciesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AdminFiatCurrenciesQuery, AdminFiatCurrenciesQueryVariables>(
    AdminFiatCurrenciesDocument,
    options
  );
}
export function useAdminFiatCurrenciesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AdminFiatCurrenciesQuery,
    AdminFiatCurrenciesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AdminFiatCurrenciesQuery, AdminFiatCurrenciesQueryVariables>(
    AdminFiatCurrenciesDocument,
    options
  );
}
export function useAdminFiatCurrenciesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        AdminFiatCurrenciesQuery,
        AdminFiatCurrenciesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    AdminFiatCurrenciesQuery,
    AdminFiatCurrenciesQueryVariables
  >(AdminFiatCurrenciesDocument, options);
}
export type AdminFiatCurrenciesQueryHookResult = ReturnType<typeof useAdminFiatCurrenciesQuery>;
export type AdminFiatCurrenciesLazyQueryHookResult = ReturnType<
  typeof useAdminFiatCurrenciesLazyQuery
>;
export type AdminFiatCurrenciesSuspenseQueryHookResult = ReturnType<
  typeof useAdminFiatCurrenciesSuspenseQuery
>;
export type AdminFiatCurrenciesQueryResult = Apollo.QueryResult<
  AdminFiatCurrenciesQuery,
  AdminFiatCurrenciesQueryVariables
>;
export const MeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Me' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MeQuery, MeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQuery, MeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const LoginDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Login' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'LoginInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'login' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
                { kind: 'Field', name: { kind: 'Name', value: 'requiresTwoFactor' } },
                { kind: 'Field', name: { kind: 'Name', value: 'tempUserId' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(
    LoginDocument,
    options
  );
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<
  LoginMutation,
  LoginMutationVariables
>;
export const RegisterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Register' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'RegisterInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'register' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type RegisterMutationFn = Apollo.MutationFunction<
  RegisterMutation,
  RegisterMutationVariables
>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument,
    options
  );
}
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<
  RegisterMutation,
  RegisterMutationVariables
>;
export const LogoutDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Logout' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'logout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutation, LogoutMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<LogoutMutation, LogoutMutationVariables>(
    LogoutDocument,
    options
  );
}
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<
  LogoutMutation,
  LogoutMutationVariables
>;
export const LoginWithTwoFactorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'LoginWithTwoFactor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TwoFactorLoginInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'loginWithTwoFactor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type LoginWithTwoFactorMutationFn = Apollo.MutationFunction<
  LoginWithTwoFactorMutation,
  LoginWithTwoFactorMutationVariables
>;

/**
 * __useLoginWithTwoFactorMutation__
 *
 * To run a mutation, you first call `useLoginWithTwoFactorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginWithTwoFactorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginWithTwoFactorMutation, { data, loading, error }] = useLoginWithTwoFactorMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginWithTwoFactorMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    LoginWithTwoFactorMutation,
    LoginWithTwoFactorMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    LoginWithTwoFactorMutation,
    LoginWithTwoFactorMutationVariables
  >(LoginWithTwoFactorDocument, options);
}
export type LoginWithTwoFactorMutationHookResult = ReturnType<typeof useLoginWithTwoFactorMutation>;
export type LoginWithTwoFactorMutationResult = Apollo.MutationResult<LoginWithTwoFactorMutation>;
export type LoginWithTwoFactorMutationOptions = Apollo.BaseMutationOptions<
  LoginWithTwoFactorMutation,
  LoginWithTwoFactorMutationVariables
>;
export const CommentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Comments' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '50' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'comments' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'CommentInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useCommentsQuery__
 *
 * To run a query within a React component, call `useCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCommentsQuery({
 *   variables: {
 *      postId: // value for 'postId'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      includeProcessing: // value for 'includeProcessing'
 *   },
 * });
 */
export function useCommentsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<CommentsQuery, CommentsQueryVariables> &
    ({ variables: CommentsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<CommentsQuery, CommentsQueryVariables>(
    CommentsDocument,
    options
  );
}
export function useCommentsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<CommentsQuery, CommentsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<CommentsQuery, CommentsQueryVariables>(
    CommentsDocument,
    options
  );
}
export function useCommentsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<CommentsQuery, CommentsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<CommentsQuery, CommentsQueryVariables>(
    CommentsDocument,
    options
  );
}
export type CommentsQueryHookResult = ReturnType<typeof useCommentsQuery>;
export type CommentsLazyQueryHookResult = ReturnType<typeof useCommentsLazyQuery>;
export type CommentsSuspenseQueryHookResult = ReturnType<typeof useCommentsSuspenseQuery>;
export type CommentsQueryResult = Apollo.QueryResult<CommentsQuery, CommentsQueryVariables>;
export const CommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Comment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'comment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'CommentInfo' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'post' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useCommentQuery__
 *
 * To run a query within a React component, call `useCommentQuery` and pass it any options that fit your needs.
 * When your component renders, `useCommentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCommentQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeProcessing: // value for 'includeProcessing'
 *   },
 * });
 */
export function useCommentQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<CommentQuery, CommentQueryVariables> &
    ({ variables: CommentQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<CommentQuery, CommentQueryVariables>(CommentDocument, options);
}
export function useCommentLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<CommentQuery, CommentQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<CommentQuery, CommentQueryVariables>(
    CommentDocument,
    options
  );
}
export function useCommentSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<CommentQuery, CommentQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<CommentQuery, CommentQueryVariables>(
    CommentDocument,
    options
  );
}
export type CommentQueryHookResult = ReturnType<typeof useCommentQuery>;
export type CommentLazyQueryHookResult = ReturnType<typeof useCommentLazyQuery>;
export type CommentSuspenseQueryHookResult = ReturnType<typeof useCommentSuspenseQuery>;
export type CommentQueryResult = Apollo.QueryResult<CommentQuery, CommentQueryVariables>;
export const CommentDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CommentDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'comment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'BooleanValue', value: true },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'CommentInfo' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'post' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useCommentDetailQuery__
 *
 * To run a query within a React component, call `useCommentDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useCommentDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCommentDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCommentDetailQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<CommentDetailQuery, CommentDetailQueryVariables> &
    ({ variables: CommentDetailQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<CommentDetailQuery, CommentDetailQueryVariables>(
    CommentDetailDocument,
    options
  );
}
export function useCommentDetailLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    CommentDetailQuery,
    CommentDetailQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<CommentDetailQuery, CommentDetailQueryVariables>(
    CommentDetailDocument,
    options
  );
}
export function useCommentDetailSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<CommentDetailQuery, CommentDetailQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<CommentDetailQuery, CommentDetailQueryVariables>(
    CommentDetailDocument,
    options
  );
}
export type CommentDetailQueryHookResult = ReturnType<typeof useCommentDetailQuery>;
export type CommentDetailLazyQueryHookResult = ReturnType<typeof useCommentDetailLazyQuery>;
export type CommentDetailSuspenseQueryHookResult = ReturnType<typeof useCommentDetailSuspenseQuery>;
export type CommentDetailQueryResult = Apollo.QueryResult<
  CommentDetailQuery,
  CommentDetailQueryVariables
>;
export const CreateCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateComment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CommentCreateInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createComment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'CommentInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateCommentMutationFn = Apollo.MutationFunction<
  CreateCommentMutation,
  CreateCommentMutationVariables
>;

/**
 * __useCreateCommentMutation__
 *
 * To run a mutation, you first call `useCreateCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCommentMutation, { data, loading, error }] = useCreateCommentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCommentMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateCommentMutation,
    CreateCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<CreateCommentMutation, CreateCommentMutationVariables>(
    CreateCommentDocument,
    options
  );
}
export type CreateCommentMutationHookResult = ReturnType<typeof useCreateCommentMutation>;
export type CreateCommentMutationResult = Apollo.MutationResult<CreateCommentMutation>;
export type CreateCommentMutationOptions = Apollo.BaseMutationOptions<
  CreateCommentMutation,
  CreateCommentMutationVariables
>;
export const DeleteCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteComment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteComment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteCommentMutationFn = Apollo.MutationFunction<
  DeleteCommentMutation,
  DeleteCommentMutationVariables
>;

/**
 * __useDeleteCommentMutation__
 *
 * To run a mutation, you first call `useDeleteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCommentMutation, { data, loading, error }] = useDeleteCommentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteCommentMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteCommentMutation,
    DeleteCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteCommentMutation, DeleteCommentMutationVariables>(
    DeleteCommentDocument,
    options
  );
}
export type DeleteCommentMutationHookResult = ReturnType<typeof useDeleteCommentMutation>;
export type DeleteCommentMutationResult = Apollo.MutationResult<DeleteCommentMutation>;
export type DeleteCommentMutationOptions = Apollo.BaseMutationOptions<
  DeleteCommentMutation,
  DeleteCommentMutationVariables
>;
export const ToggleCommentLikeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleCommentLike' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'commentId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'toggleCommentLike' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'commentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'commentId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'CommentInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CommentInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Comment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ToggleCommentLikeMutationFn = Apollo.MutationFunction<
  ToggleCommentLikeMutation,
  ToggleCommentLikeMutationVariables
>;

/**
 * __useToggleCommentLikeMutation__
 *
 * To run a mutation, you first call `useToggleCommentLikeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleCommentLikeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleCommentLikeMutation, { data, loading, error }] = useToggleCommentLikeMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useToggleCommentLikeMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ToggleCommentLikeMutation,
    ToggleCommentLikeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    ToggleCommentLikeMutation,
    ToggleCommentLikeMutationVariables
  >(ToggleCommentLikeDocument, options);
}
export type ToggleCommentLikeMutationHookResult = ReturnType<typeof useToggleCommentLikeMutation>;
export type ToggleCommentLikeMutationResult = Apollo.MutationResult<ToggleCommentLikeMutation>;
export type ToggleCommentLikeMutationOptions = Apollo.BaseMutationOptions<
  ToggleCommentLikeMutation,
  ToggleCommentLikeMutationVariables
>;
export const GetMediaDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMedia' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Media' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
          { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'variants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMediaQuery__
 *
 * To run a query within a React component, call `useGetMediaQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMediaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMediaQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMediaQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<GetMediaQuery, GetMediaQueryVariables> &
    ({ variables: GetMediaQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMediaQuery, GetMediaQueryVariables>(
    GetMediaDocument,
    options
  );
}
export function useGetMediaLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMediaQuery, GetMediaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMediaQuery, GetMediaQueryVariables>(
    GetMediaDocument,
    options
  );
}
export function useGetMediaSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetMediaQuery, GetMediaQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMediaQuery, GetMediaQueryVariables>(
    GetMediaDocument,
    options
  );
}
export type GetMediaQueryHookResult = ReturnType<typeof useGetMediaQuery>;
export type GetMediaLazyQueryHookResult = ReturnType<typeof useGetMediaLazyQuery>;
export type GetMediaSuspenseQueryHookResult = ReturnType<typeof useGetMediaSuspenseQuery>;
export type GetMediaQueryResult = Apollo.QueryResult<GetMediaQuery, GetMediaQueryVariables>;
export const GetMediaBasicInfoDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMediaBasicInfo' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMediaBasicInfoQuery__
 *
 * To run a query within a React component, call `useGetMediaBasicInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMediaBasicInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMediaBasicInfoQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMediaBasicInfoQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetMediaBasicInfoQuery,
    GetMediaBasicInfoQueryVariables
  > &
    ({ variables: GetMediaBasicInfoQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMediaBasicInfoQuery, GetMediaBasicInfoQueryVariables>(
    GetMediaBasicInfoDocument,
    options
  );
}
export function useGetMediaBasicInfoLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetMediaBasicInfoQuery,
    GetMediaBasicInfoQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMediaBasicInfoQuery, GetMediaBasicInfoQueryVariables>(
    GetMediaBasicInfoDocument,
    options
  );
}
export function useGetMediaBasicInfoSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetMediaBasicInfoQuery,
        GetMediaBasicInfoQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMediaBasicInfoQuery, GetMediaBasicInfoQueryVariables>(
    GetMediaBasicInfoDocument,
    options
  );
}
export type GetMediaBasicInfoQueryHookResult = ReturnType<typeof useGetMediaBasicInfoQuery>;
export type GetMediaBasicInfoLazyQueryHookResult = ReturnType<typeof useGetMediaBasicInfoLazyQuery>;
export type GetMediaBasicInfoSuspenseQueryHookResult = ReturnType<
  typeof useGetMediaBasicInfoSuspenseQuery
>;
export type GetMediaBasicInfoQueryResult = Apollo.QueryResult<
  GetMediaBasicInfoQuery,
  GetMediaBasicInfoQueryVariables
>;
export const GetMediaMetadataDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMediaMetadata' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'post' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMediaMetadataQuery__
 *
 * To run a query within a React component, call `useGetMediaMetadataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMediaMetadataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMediaMetadataQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMediaMetadataQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetMediaMetadataQuery,
    GetMediaMetadataQueryVariables
  > &
    ({ variables: GetMediaMetadataQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMediaMetadataQuery, GetMediaMetadataQueryVariables>(
    GetMediaMetadataDocument,
    options
  );
}
export function useGetMediaMetadataLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetMediaMetadataQuery,
    GetMediaMetadataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMediaMetadataQuery, GetMediaMetadataQueryVariables>(
    GetMediaMetadataDocument,
    options
  );
}
export function useGetMediaMetadataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetMediaMetadataQuery,
        GetMediaMetadataQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMediaMetadataQuery, GetMediaMetadataQueryVariables>(
    GetMediaMetadataDocument,
    options
  );
}
export type GetMediaMetadataQueryHookResult = ReturnType<typeof useGetMediaMetadataQuery>;
export type GetMediaMetadataLazyQueryHookResult = ReturnType<typeof useGetMediaMetadataLazyQuery>;
export type GetMediaMetadataSuspenseQueryHookResult = ReturnType<
  typeof useGetMediaMetadataSuspenseQuery
>;
export type GetMediaMetadataQueryResult = Apollo.QueryResult<
  GetMediaMetadataQuery,
  GetMediaMetadataQueryVariables
>;
export const GetMyMediaDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyMedia' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myMedia' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Media' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
          { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
          { kind: 'Field', name: { kind: 'Name', value: 'width' } },
          { kind: 'Field', name: { kind: 'Name', value: 'height' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'url' } },
          { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'variants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isDeleted' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMyMediaQuery__
 *
 * To run a query within a React component, call `useGetMyMediaQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyMediaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyMediaQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useGetMyMediaQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyMediaQuery, GetMyMediaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMyMediaQuery, GetMyMediaQueryVariables>(
    GetMyMediaDocument,
    options
  );
}
export function useGetMyMediaLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyMediaQuery, GetMyMediaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMyMediaQuery, GetMyMediaQueryVariables>(
    GetMyMediaDocument,
    options
  );
}
export function useGetMyMediaSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetMyMediaQuery, GetMyMediaQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMyMediaQuery, GetMyMediaQueryVariables>(
    GetMyMediaDocument,
    options
  );
}
export type GetMyMediaQueryHookResult = ReturnType<typeof useGetMyMediaQuery>;
export type GetMyMediaLazyQueryHookResult = ReturnType<typeof useGetMyMediaLazyQuery>;
export type GetMyMediaSuspenseQueryHookResult = ReturnType<typeof useGetMyMediaSuspenseQuery>;
export type GetMyMediaQueryResult = Apollo.QueryResult<GetMyMediaQuery, GetMyMediaQueryVariables>;
export const DeleteMediaDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteMedia' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteMedia' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteMediaMutationFn = Apollo.MutationFunction<
  DeleteMediaMutation,
  DeleteMediaMutationVariables
>;

/**
 * __useDeleteMediaMutation__
 *
 * To run a mutation, you first call `useDeleteMediaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMediaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMediaMutation, { data, loading, error }] = useDeleteMediaMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteMediaMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteMediaMutation,
    DeleteMediaMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteMediaMutation, DeleteMediaMutationVariables>(
    DeleteMediaDocument,
    options
  );
}
export type DeleteMediaMutationHookResult = ReturnType<typeof useDeleteMediaMutation>;
export type DeleteMediaMutationResult = Apollo.MutationResult<DeleteMediaMutation>;
export type DeleteMediaMutationOptions = Apollo.BaseMutationOptions<
  DeleteMediaMutation,
  DeleteMediaMutationVariables
>;
export const GetConversationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetConversations' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeArchived' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'conversations' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeArchived' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeArchived' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'ConversationInfo' },
                            },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetConversationsQuery__
 *
 * To run a query within a React component, call `useGetConversationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetConversationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetConversationsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      includeArchived: // value for 'includeArchived'
 *   },
 * });
 */
export function useGetConversationsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetConversationsQuery,
    GetConversationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetConversationsQuery, GetConversationsQueryVariables>(
    GetConversationsDocument,
    options
  );
}
export function useGetConversationsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetConversationsQuery,
    GetConversationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetConversationsQuery, GetConversationsQueryVariables>(
    GetConversationsDocument,
    options
  );
}
export function useGetConversationsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetConversationsQuery,
        GetConversationsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetConversationsQuery, GetConversationsQueryVariables>(
    GetConversationsDocument,
    options
  );
}
export type GetConversationsQueryHookResult = ReturnType<typeof useGetConversationsQuery>;
export type GetConversationsLazyQueryHookResult = ReturnType<typeof useGetConversationsLazyQuery>;
export type GetConversationsSuspenseQueryHookResult = ReturnType<
  typeof useGetConversationsSuspenseQuery
>;
export type GetConversationsQueryResult = Apollo.QueryResult<
  GetConversationsQuery,
  GetConversationsQueryVariables
>;
export const GetConversationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetConversation' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'conversation' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'messages' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'first' },
                      value: { kind: 'IntValue', value: '50' },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'edges' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'node' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'FragmentSpread',
                                    name: { kind: 'Name', value: 'MessageInfo' },
                                  },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageInfo' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetConversationQuery__
 *
 * To run a query within a React component, call `useGetConversationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetConversationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetConversationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetConversationQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetConversationQuery,
    GetConversationQueryVariables
  > &
    ({ variables: GetConversationQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetConversationQuery, GetConversationQueryVariables>(
    GetConversationDocument,
    options
  );
}
export function useGetConversationLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetConversationQuery,
    GetConversationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetConversationQuery, GetConversationQueryVariables>(
    GetConversationDocument,
    options
  );
}
export function useGetConversationSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetConversationQuery, GetConversationQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetConversationQuery, GetConversationQueryVariables>(
    GetConversationDocument,
    options
  );
}
export type GetConversationQueryHookResult = ReturnType<typeof useGetConversationQuery>;
export type GetConversationLazyQueryHookResult = ReturnType<typeof useGetConversationLazyQuery>;
export type GetConversationSuspenseQueryHookResult = ReturnType<
  typeof useGetConversationSuspenseQuery
>;
export type GetConversationQueryResult = Apollo.QueryResult<
  GetConversationQuery,
  GetConversationQueryVariables
>;
export const GetConversationMessagesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetConversationMessages' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'conversation' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'messages' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'first' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'after' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'edges' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'node' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'FragmentSpread',
                                    name: { kind: 'Name', value: 'MessageInfo' },
                                  },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageInfo' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetConversationMessagesQuery__
 *
 * To run a query within a React component, call `useGetConversationMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetConversationMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetConversationMessagesQuery({
 *   variables: {
 *      conversationId: // value for 'conversationId'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useGetConversationMessagesQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetConversationMessagesQuery,
    GetConversationMessagesQueryVariables
  > &
    ({ variables: GetConversationMessagesQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetConversationMessagesQuery,
    GetConversationMessagesQueryVariables
  >(GetConversationMessagesDocument, options);
}
export function useGetConversationMessagesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetConversationMessagesQuery,
    GetConversationMessagesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetConversationMessagesQuery,
    GetConversationMessagesQueryVariables
  >(GetConversationMessagesDocument, options);
}
export function useGetConversationMessagesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetConversationMessagesQuery,
        GetConversationMessagesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetConversationMessagesQuery,
    GetConversationMessagesQueryVariables
  >(GetConversationMessagesDocument, options);
}
export type GetConversationMessagesQueryHookResult = ReturnType<
  typeof useGetConversationMessagesQuery
>;
export type GetConversationMessagesLazyQueryHookResult = ReturnType<
  typeof useGetConversationMessagesLazyQuery
>;
export type GetConversationMessagesSuspenseQueryHookResult = ReturnType<
  typeof useGetConversationMessagesSuspenseQuery
>;
export type GetConversationMessagesQueryResult = Apollo.QueryResult<
  GetConversationMessagesQuery,
  GetConversationMessagesQueryVariables
>;
export const GetMessageStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMessageStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'messageStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalConversations' } },
                { kind: 'Field', name: { kind: 'Name', value: 'activeConversations' } },
                { kind: 'Field', name: { kind: 'Name', value: 'unreadConversations' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalUnreadMessages' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalMessages' } },
                { kind: 'Field', name: { kind: 'Name', value: 'archivedConversations' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMessageStatsQuery__
 *
 * To run a query within a React component, call `useGetMessageStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMessageStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMessageStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMessageStatsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetMessageStatsQuery,
    GetMessageStatsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMessageStatsQuery, GetMessageStatsQueryVariables>(
    GetMessageStatsDocument,
    options
  );
}
export function useGetMessageStatsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetMessageStatsQuery,
    GetMessageStatsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMessageStatsQuery, GetMessageStatsQueryVariables>(
    GetMessageStatsDocument,
    options
  );
}
export function useGetMessageStatsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetMessageStatsQuery, GetMessageStatsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMessageStatsQuery, GetMessageStatsQueryVariables>(
    GetMessageStatsDocument,
    options
  );
}
export type GetMessageStatsQueryHookResult = ReturnType<typeof useGetMessageStatsQuery>;
export type GetMessageStatsLazyQueryHookResult = ReturnType<typeof useGetMessageStatsLazyQuery>;
export type GetMessageStatsSuspenseQueryHookResult = ReturnType<
  typeof useGetMessageStatsSuspenseQuery
>;
export type GetMessageStatsQueryResult = Apollo.QueryResult<
  GetMessageStatsQuery,
  GetMessageStatsQueryVariables
>;
export const SearchUsersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchUsers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '10' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      search: // value for 'search'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useSearchUsersQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables> &
    ({ variables: SearchUsersQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(
    SearchUsersDocument,
    options
  );
}
export function useSearchUsersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(
    SearchUsersDocument,
    options
  );
}
export function useSearchUsersSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<SearchUsersQuery, SearchUsersQueryVariables>(
    SearchUsersDocument,
    options
  );
}
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<typeof useSearchUsersLazyQuery>;
export type SearchUsersSuspenseQueryHookResult = ReturnType<typeof useSearchUsersSuspenseQuery>;
export type SearchUsersQueryResult = Apollo.QueryResult<
  SearchUsersQuery,
  SearchUsersQueryVariables
>;
export const SendMessageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendMessage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'SendMessageInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'messageData' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'conversation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type SendMessageMutationFn = Apollo.MutationFunction<
  SendMessageMutation,
  SendMessageMutationVariables
>;

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendMessageMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    SendMessageMutation,
    SendMessageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<SendMessageMutation, SendMessageMutationVariables>(
    SendMessageDocument,
    options
  );
}
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationResult = Apollo.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = Apollo.BaseMutationOptions<
  SendMessageMutation,
  SendMessageMutationVariables
>;
export const CreateConversationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateConversation' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateConversationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createConversation' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'conversation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateConversationMutationFn = Apollo.MutationFunction<
  CreateConversationMutation,
  CreateConversationMutationVariables
>;

/**
 * __useCreateConversationMutation__
 *
 * To run a mutation, you first call `useCreateConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createConversationMutation, { data, loading, error }] = useCreateConversationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateConversationMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateConversationMutation,
    CreateConversationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateConversationMutation,
    CreateConversationMutationVariables
  >(CreateConversationDocument, options);
}
export type CreateConversationMutationHookResult = ReturnType<typeof useCreateConversationMutation>;
export type CreateConversationMutationResult = Apollo.MutationResult<CreateConversationMutation>;
export type CreateConversationMutationOptions = Apollo.BaseMutationOptions<
  CreateConversationMutation,
  CreateConversationMutationVariables
>;
export const MarkAsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkAsRead' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'MarkAsReadInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'markAsRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'conversation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type MarkAsReadMutationFn = Apollo.MutationFunction<
  MarkAsReadMutation,
  MarkAsReadMutationVariables
>;

/**
 * __useMarkAsReadMutation__
 *
 * To run a mutation, you first call `useMarkAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAsReadMutation, { data, loading, error }] = useMarkAsReadMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useMarkAsReadMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    MarkAsReadMutation,
    MarkAsReadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<MarkAsReadMutation, MarkAsReadMutationVariables>(
    MarkAsReadDocument,
    options
  );
}
export type MarkAsReadMutationHookResult = ReturnType<typeof useMarkAsReadMutation>;
export type MarkAsReadMutationResult = Apollo.MutationResult<MarkAsReadMutation>;
export type MarkAsReadMutationOptions = Apollo.BaseMutationOptions<
  MarkAsReadMutation,
  MarkAsReadMutationVariables
>;
export const UpdateConversationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateConversation' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateConversationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateConversation' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'conversation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateConversationMutationFn = Apollo.MutationFunction<
  UpdateConversationMutation,
  UpdateConversationMutationVariables
>;

/**
 * __useUpdateConversationMutation__
 *
 * To run a mutation, you first call `useUpdateConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateConversationMutation, { data, loading, error }] = useUpdateConversationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateConversationMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateConversationMutation,
    UpdateConversationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateConversationMutation,
    UpdateConversationMutationVariables
  >(UpdateConversationDocument, options);
}
export type UpdateConversationMutationHookResult = ReturnType<typeof useUpdateConversationMutation>;
export type UpdateConversationMutationResult = Apollo.MutationResult<UpdateConversationMutation>;
export type UpdateConversationMutationOptions = Apollo.BaseMutationOptions<
  UpdateConversationMutation,
  UpdateConversationMutationVariables
>;
export const DeleteMessageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteMessage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DeleteMessageInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deletedMessage' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'deleteType' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeleteMessageMutationFn = Apollo.MutationFunction<
  DeleteMessageMutation,
  DeleteMessageMutationVariables
>;

/**
 * __useDeleteMessageMutation__
 *
 * To run a mutation, you first call `useDeleteMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMessageMutation, { data, loading, error }] = useDeleteMessageMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteMessageMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteMessageMutation,
    DeleteMessageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteMessageMutation, DeleteMessageMutationVariables>(
    DeleteMessageDocument,
    options
  );
}
export type DeleteMessageMutationHookResult = ReturnType<typeof useDeleteMessageMutation>;
export type DeleteMessageMutationResult = Apollo.MutationResult<DeleteMessageMutation>;
export type DeleteMessageMutationOptions = Apollo.BaseMutationOptions<
  DeleteMessageMutation,
  DeleteMessageMutationVariables
>;
export const HideMessageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'HideMessage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'HideMessageInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'hideMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'hiddenMessage' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type HideMessageMutationFn = Apollo.MutationFunction<
  HideMessageMutation,
  HideMessageMutationVariables
>;

/**
 * __useHideMessageMutation__
 *
 * To run a mutation, you first call `useHideMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHideMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [hideMessageMutation, { data, loading, error }] = useHideMessageMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useHideMessageMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    HideMessageMutation,
    HideMessageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<HideMessageMutation, HideMessageMutationVariables>(
    HideMessageDocument,
    options
  );
}
export type HideMessageMutationHookResult = ReturnType<typeof useHideMessageMutation>;
export type HideMessageMutationResult = Apollo.MutationResult<HideMessageMutation>;
export type HideMessageMutationOptions = Apollo.BaseMutationOptions<
  HideMessageMutation,
  HideMessageMutationVariables
>;
export const MessageAddedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'MessageAdded' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'messageAdded' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'conversationId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMessageAddedSubscription__
 *
 * To run a query within a React component, call `useMessageAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useMessageAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMessageAddedSubscription({
 *   variables: {
 *      conversationId: // value for 'conversationId'
 *   },
 * });
 */
export function useMessageAddedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    MessageAddedSubscription,
    MessageAddedSubscriptionVariables
  > &
    ({ variables: MessageAddedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    MessageAddedSubscription,
    MessageAddedSubscriptionVariables
  >(MessageAddedDocument, options);
}
export type MessageAddedSubscriptionHookResult = ReturnType<typeof useMessageAddedSubscription>;
export type MessageAddedSubscriptionResult = Apollo.SubscriptionResult<MessageAddedSubscription>;
export const MessageReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'MessageRead' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'messageRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'conversationId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'conversationId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'messageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'readAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'message' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMessageReadSubscription__
 *
 * To run a query within a React component, call `useMessageReadSubscription` and pass it any options that fit your needs.
 * When your component renders, `useMessageReadSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMessageReadSubscription({
 *   variables: {
 *      conversationId: // value for 'conversationId'
 *   },
 * });
 */
export function useMessageReadSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    MessageReadSubscription,
    MessageReadSubscriptionVariables
  > &
    ({ variables: MessageReadSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    MessageReadSubscription,
    MessageReadSubscriptionVariables
  >(MessageReadDocument, options);
}
export type MessageReadSubscriptionHookResult = ReturnType<typeof useMessageReadSubscription>;
export type MessageReadSubscriptionResult = Apollo.SubscriptionResult<MessageReadSubscription>;
export const ConversationUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'ConversationUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'conversationUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'ConversationInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MessageInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Message' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'conversationId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'senderId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'replyToId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'editedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'deletedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
          { kind: 'Field', name: { kind: 'Name', value: 'readCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isHidden' } },
          { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sender' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ConversationInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Conversation' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isArchived' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lastMessage' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MessageInfo' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'participantCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activeParticipants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'participants' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'joinedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'leftAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMuted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useConversationUpdatedSubscription__
 *
 * To run a query within a React component, call `useConversationUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useConversationUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConversationUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useConversationUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    ConversationUpdatedSubscription,
    ConversationUpdatedSubscriptionVariables
  > &
    ({ variables: ConversationUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    ConversationUpdatedSubscription,
    ConversationUpdatedSubscriptionVariables
  >(ConversationUpdatedDocument, options);
}
export type ConversationUpdatedSubscriptionHookResult = ReturnType<
  typeof useConversationUpdatedSubscription
>;
export type ConversationUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<ConversationUpdatedSubscription>;
export const NotificationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Notifications' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isRead' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'NotificationType' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notifications' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isRead' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isRead' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'readAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'referenceId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'actorId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'actor' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useNotificationsQuery__
 *
 * To run a query within a React component, call `useNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      isRead: // value for 'isRead'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useNotificationsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<NotificationsQuery, NotificationsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<NotificationsQuery, NotificationsQueryVariables>(
    NotificationsDocument,
    options
  );
}
export function useNotificationsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    NotificationsQuery,
    NotificationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<NotificationsQuery, NotificationsQueryVariables>(
    NotificationsDocument,
    options
  );
}
export function useNotificationsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<NotificationsQuery, NotificationsQueryVariables>(
    NotificationsDocument,
    options
  );
}
export type NotificationsQueryHookResult = ReturnType<typeof useNotificationsQuery>;
export type NotificationsLazyQueryHookResult = ReturnType<typeof useNotificationsLazyQuery>;
export type NotificationsSuspenseQueryHookResult = ReturnType<typeof useNotificationsSuspenseQuery>;
export type NotificationsQueryResult = Apollo.QueryResult<
  NotificationsQuery,
  NotificationsQueryVariables
>;
export const UnreadNotificationsCountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UnreadNotificationsCount' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'unreadNotificationsCount' } }],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUnreadNotificationsCountQuery__
 *
 * To run a query within a React component, call `useUnreadNotificationsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnreadNotificationsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnreadNotificationsCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useUnreadNotificationsCountQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    UnreadNotificationsCountQuery,
    UnreadNotificationsCountQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    UnreadNotificationsCountQuery,
    UnreadNotificationsCountQueryVariables
  >(UnreadNotificationsCountDocument, options);
}
export function useUnreadNotificationsCountLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UnreadNotificationsCountQuery,
    UnreadNotificationsCountQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    UnreadNotificationsCountQuery,
    UnreadNotificationsCountQueryVariables
  >(UnreadNotificationsCountDocument, options);
}
export function useUnreadNotificationsCountSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        UnreadNotificationsCountQuery,
        UnreadNotificationsCountQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    UnreadNotificationsCountQuery,
    UnreadNotificationsCountQueryVariables
  >(UnreadNotificationsCountDocument, options);
}
export type UnreadNotificationsCountQueryHookResult = ReturnType<
  typeof useUnreadNotificationsCountQuery
>;
export type UnreadNotificationsCountLazyQueryHookResult = ReturnType<
  typeof useUnreadNotificationsCountLazyQuery
>;
export type UnreadNotificationsCountSuspenseQueryHookResult = ReturnType<
  typeof useUnreadNotificationsCountSuspenseQuery
>;
export type UnreadNotificationsCountQueryResult = Apollo.QueryResult<
  UnreadNotificationsCountQuery,
  UnreadNotificationsCountQueryVariables
>;
export const MarkNotificationsAsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkNotificationsAsRead' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'ids' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'markNotificationsAsRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'ids' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'ids' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
                { kind: 'Field', name: { kind: 'Name', value: 'readAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type MarkNotificationsAsReadMutationFn = Apollo.MutationFunction<
  MarkNotificationsAsReadMutation,
  MarkNotificationsAsReadMutationVariables
>;

/**
 * __useMarkNotificationsAsReadMutation__
 *
 * To run a mutation, you first call `useMarkNotificationsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkNotificationsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markNotificationsAsReadMutation, { data, loading, error }] = useMarkNotificationsAsReadMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useMarkNotificationsAsReadMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    MarkNotificationsAsReadMutation,
    MarkNotificationsAsReadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    MarkNotificationsAsReadMutation,
    MarkNotificationsAsReadMutationVariables
  >(MarkNotificationsAsReadDocument, options);
}
export type MarkNotificationsAsReadMutationHookResult = ReturnType<
  typeof useMarkNotificationsAsReadMutation
>;
export type MarkNotificationsAsReadMutationResult =
  Apollo.MutationResult<MarkNotificationsAsReadMutation>;
export type MarkNotificationsAsReadMutationOptions = Apollo.BaseMutationOptions<
  MarkNotificationsAsReadMutation,
  MarkNotificationsAsReadMutationVariables
>;
export const MarkAllNotificationsAsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkAllNotificationsAsRead' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'markAllNotificationsAsRead' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type MarkAllNotificationsAsReadMutationFn = Apollo.MutationFunction<
  MarkAllNotificationsAsReadMutation,
  MarkAllNotificationsAsReadMutationVariables
>;

/**
 * __useMarkAllNotificationsAsReadMutation__
 *
 * To run a mutation, you first call `useMarkAllNotificationsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAllNotificationsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAllNotificationsAsReadMutation, { data, loading, error }] = useMarkAllNotificationsAsReadMutation({
 *   variables: {
 *   },
 * });
 */
export function useMarkAllNotificationsAsReadMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    MarkAllNotificationsAsReadMutation,
    MarkAllNotificationsAsReadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    MarkAllNotificationsAsReadMutation,
    MarkAllNotificationsAsReadMutationVariables
  >(MarkAllNotificationsAsReadDocument, options);
}
export type MarkAllNotificationsAsReadMutationHookResult = ReturnType<
  typeof useMarkAllNotificationsAsReadMutation
>;
export type MarkAllNotificationsAsReadMutationResult =
  Apollo.MutationResult<MarkAllNotificationsAsReadMutation>;
export type MarkAllNotificationsAsReadMutationOptions = Apollo.BaseMutationOptions<
  MarkAllNotificationsAsReadMutation,
  MarkAllNotificationsAsReadMutationVariables
>;
export const P2PTradeRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'P2PTradeRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'p2pTradeRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tradeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useP2PTradeRequestQuery__
 *
 * To run a query within a React component, call `useP2PTradeRequestQuery` and pass it any options that fit your needs.
 * When your component renders, `useP2PTradeRequestQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useP2PTradeRequestQuery({
 *   variables: {
 *      tradeId: // value for 'tradeId'
 *   },
 * });
 */
export function useP2PTradeRequestQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    P2PTradeRequestQuery,
    P2PTradeRequestQueryVariables
  > &
    ({ variables: P2PTradeRequestQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<P2PTradeRequestQuery, P2PTradeRequestQueryVariables>(
    P2PTradeRequestDocument,
    options
  );
}
export function useP2PTradeRequestLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    P2PTradeRequestQuery,
    P2PTradeRequestQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<P2PTradeRequestQuery, P2PTradeRequestQueryVariables>(
    P2PTradeRequestDocument,
    options
  );
}
export function useP2PTradeRequestSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<P2PTradeRequestQuery, P2PTradeRequestQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<P2PTradeRequestQuery, P2PTradeRequestQueryVariables>(
    P2PTradeRequestDocument,
    options
  );
}
export type P2PTradeRequestQueryHookResult = ReturnType<typeof useP2PTradeRequestQuery>;
export type P2PTradeRequestLazyQueryHookResult = ReturnType<typeof useP2PTradeRequestLazyQuery>;
export type P2PTradeRequestSuspenseQueryHookResult = ReturnType<
  typeof useP2PTradeRequestSuspenseQuery
>;
export type P2PTradeRequestQueryResult = Apollo.QueryResult<
  P2PTradeRequestQuery,
  P2PTradeRequestQueryVariables
>;
export const MyP2PTradeRequestsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyP2PTradeRequests' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeStatus' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myP2PTradeRequests' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyP2PTradeRequestsQuery__
 *
 * To run a query within a React component, call `useMyP2PTradeRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyP2PTradeRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyP2PTradeRequestsQuery({
 *   variables: {
 *      status: // value for 'status'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useMyP2PTradeRequestsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyP2PTradeRequestsQuery,
    MyP2PTradeRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyP2PTradeRequestsQuery, MyP2PTradeRequestsQueryVariables>(
    MyP2PTradeRequestsDocument,
    options
  );
}
export function useMyP2PTradeRequestsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyP2PTradeRequestsQuery,
    MyP2PTradeRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyP2PTradeRequestsQuery, MyP2PTradeRequestsQueryVariables>(
    MyP2PTradeRequestsDocument,
    options
  );
}
export function useMyP2PTradeRequestsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyP2PTradeRequestsQuery,
        MyP2PTradeRequestsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyP2PTradeRequestsQuery,
    MyP2PTradeRequestsQueryVariables
  >(MyP2PTradeRequestsDocument, options);
}
export type MyP2PTradeRequestsQueryHookResult = ReturnType<typeof useMyP2PTradeRequestsQuery>;
export type MyP2PTradeRequestsLazyQueryHookResult = ReturnType<
  typeof useMyP2PTradeRequestsLazyQuery
>;
export type MyP2PTradeRequestsSuspenseQueryHookResult = ReturnType<
  typeof useMyP2PTradeRequestsSuspenseQuery
>;
export type MyP2PTradeRequestsQueryResult = Apollo.QueryResult<
  MyP2PTradeRequestsQuery,
  MyP2PTradeRequestsQueryVariables
>;
export const AvailableP2POffersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AvailableP2POffers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'fiatCurrency' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'paymentMethod' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PPaymentMethodType' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'amountUsd' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Decimal' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'orderBy' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POfferSortInput' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'availableP2POffers' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'fiatCurrency' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'fiatCurrency' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'paymentMethod' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'paymentMethod' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'amountUsd' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'amountUsd' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'orderBy' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'orderBy' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'P2POfferInfo' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2POfferInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POffer' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
          { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAvailableP2POffersQuery__
 *
 * To run a query within a React component, call `useAvailableP2POffersQuery` and pass it any options that fit your needs.
 * When your component renders, `useAvailableP2POffersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAvailableP2POffersQuery({
 *   variables: {
 *      fiatCurrency: // value for 'fiatCurrency'
 *      paymentMethod: // value for 'paymentMethod'
 *      amountUsd: // value for 'amountUsd'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useAvailableP2POffersQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    AvailableP2POffersQuery,
    AvailableP2POffersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AvailableP2POffersQuery, AvailableP2POffersQueryVariables>(
    AvailableP2POffersDocument,
    options
  );
}
export function useAvailableP2POffersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AvailableP2POffersQuery,
    AvailableP2POffersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AvailableP2POffersQuery, AvailableP2POffersQueryVariables>(
    AvailableP2POffersDocument,
    options
  );
}
export function useAvailableP2POffersSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        AvailableP2POffersQuery,
        AvailableP2POffersQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    AvailableP2POffersQuery,
    AvailableP2POffersQueryVariables
  >(AvailableP2POffersDocument, options);
}
export type AvailableP2POffersQueryHookResult = ReturnType<typeof useAvailableP2POffersQuery>;
export type AvailableP2POffersLazyQueryHookResult = ReturnType<
  typeof useAvailableP2POffersLazyQuery
>;
export type AvailableP2POffersSuspenseQueryHookResult = ReturnType<
  typeof useAvailableP2POffersSuspenseQuery
>;
export type AvailableP2POffersQueryResult = Apollo.QueryResult<
  AvailableP2POffersQuery,
  AvailableP2POffersQueryVariables
>;
export const MyP2POffersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyP2POffers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'fiatCurrency' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'paymentMethod' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PPaymentMethodType' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myP2POffers' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'fiatCurrency' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'fiatCurrency' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'paymentMethod' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'paymentMethod' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2POfferInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2POfferInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2POffer' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
          { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyP2POffersQuery__
 *
 * To run a query within a React component, call `useMyP2POffersQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyP2POffersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyP2POffersQuery({
 *   variables: {
 *      fiatCurrency: // value for 'fiatCurrency'
 *      paymentMethod: // value for 'paymentMethod'
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useMyP2POffersQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MyP2POffersQuery, MyP2POffersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyP2POffersQuery, MyP2POffersQueryVariables>(
    MyP2POffersDocument,
    options
  );
}
export function useMyP2POffersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MyP2POffersQuery, MyP2POffersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyP2POffersQuery, MyP2POffersQueryVariables>(
    MyP2POffersDocument,
    options
  );
}
export function useMyP2POffersSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MyP2POffersQuery, MyP2POffersQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyP2POffersQuery, MyP2POffersQueryVariables>(
    MyP2POffersDocument,
    options
  );
}
export type MyP2POffersQueryHookResult = ReturnType<typeof useMyP2POffersQuery>;
export type MyP2POffersLazyQueryHookResult = ReturnType<typeof useMyP2POffersLazyQuery>;
export type MyP2POffersSuspenseQueryHookResult = ReturnType<typeof useMyP2POffersSuspenseQuery>;
export type MyP2POffersQueryResult = Apollo.QueryResult<
  MyP2POffersQuery,
  MyP2POffersQueryVariables
>;
export const FiatCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'FiatCurrencies' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'fiatCurrencies' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'FiatCurrencyInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'FiatCurrencyInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'FiatCurrency' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useFiatCurrenciesQuery__
 *
 * To run a query within a React component, call `useFiatCurrenciesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFiatCurrenciesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFiatCurrenciesQuery({
 *   variables: {
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useFiatCurrenciesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<FiatCurrenciesQuery, FiatCurrenciesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<FiatCurrenciesQuery, FiatCurrenciesQueryVariables>(
    FiatCurrenciesDocument,
    options
  );
}
export function useFiatCurrenciesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    FiatCurrenciesQuery,
    FiatCurrenciesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<FiatCurrenciesQuery, FiatCurrenciesQueryVariables>(
    FiatCurrenciesDocument,
    options
  );
}
export function useFiatCurrenciesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<FiatCurrenciesQuery, FiatCurrenciesQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<FiatCurrenciesQuery, FiatCurrenciesQueryVariables>(
    FiatCurrenciesDocument,
    options
  );
}
export type FiatCurrenciesQueryHookResult = ReturnType<typeof useFiatCurrenciesQuery>;
export type FiatCurrenciesLazyQueryHookResult = ReturnType<typeof useFiatCurrenciesLazyQuery>;
export type FiatCurrenciesSuspenseQueryHookResult = ReturnType<
  typeof useFiatCurrenciesSuspenseQuery
>;
export type FiatCurrenciesQueryResult = Apollo.QueryResult<
  FiatCurrenciesQuery,
  FiatCurrenciesQueryVariables
>;
export const MyP2PBuyerPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyP2PBuyerPreferences' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myP2PBuyerPreferences' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PBuyerPreferenceInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PBuyerPreferenceInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PBuyerPreference' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyP2PBuyerPreferencesQuery__
 *
 * To run a query within a React component, call `useMyP2PBuyerPreferencesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyP2PBuyerPreferencesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyP2PBuyerPreferencesQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyP2PBuyerPreferencesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyP2PBuyerPreferencesQuery,
    MyP2PBuyerPreferencesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyP2PBuyerPreferencesQuery, MyP2PBuyerPreferencesQueryVariables>(
    MyP2PBuyerPreferencesDocument,
    options
  );
}
export function useMyP2PBuyerPreferencesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyP2PBuyerPreferencesQuery,
    MyP2PBuyerPreferencesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    MyP2PBuyerPreferencesQuery,
    MyP2PBuyerPreferencesQueryVariables
  >(MyP2PBuyerPreferencesDocument, options);
}
export function useMyP2PBuyerPreferencesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyP2PBuyerPreferencesQuery,
        MyP2PBuyerPreferencesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyP2PBuyerPreferencesQuery,
    MyP2PBuyerPreferencesQueryVariables
  >(MyP2PBuyerPreferencesDocument, options);
}
export type MyP2PBuyerPreferencesQueryHookResult = ReturnType<typeof useMyP2PBuyerPreferencesQuery>;
export type MyP2PBuyerPreferencesLazyQueryHookResult = ReturnType<
  typeof useMyP2PBuyerPreferencesLazyQuery
>;
export type MyP2PBuyerPreferencesSuspenseQueryHookResult = ReturnType<
  typeof useMyP2PBuyerPreferencesSuspenseQuery
>;
export type MyP2PBuyerPreferencesQueryResult = Apollo.QueryResult<
  MyP2PBuyerPreferencesQuery,
  MyP2PBuyerPreferencesQueryVariables
>;
export const P2PDisputeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'P2PDispute' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'disputeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'p2pDispute' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'disputeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'disputeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useP2PDisputeQuery__
 *
 * To run a query within a React component, call `useP2PDisputeQuery` and pass it any options that fit your needs.
 * When your component renders, `useP2PDisputeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useP2PDisputeQuery({
 *   variables: {
 *      disputeId: // value for 'disputeId'
 *   },
 * });
 */
export function useP2PDisputeQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<P2PDisputeQuery, P2PDisputeQueryVariables> &
    ({ variables: P2PDisputeQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<P2PDisputeQuery, P2PDisputeQueryVariables>(
    P2PDisputeDocument,
    options
  );
}
export function useP2PDisputeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<P2PDisputeQuery, P2PDisputeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<P2PDisputeQuery, P2PDisputeQueryVariables>(
    P2PDisputeDocument,
    options
  );
}
export function useP2PDisputeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<P2PDisputeQuery, P2PDisputeQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<P2PDisputeQuery, P2PDisputeQueryVariables>(
    P2PDisputeDocument,
    options
  );
}
export type P2PDisputeQueryHookResult = ReturnType<typeof useP2PDisputeQuery>;
export type P2PDisputeLazyQueryHookResult = ReturnType<typeof useP2PDisputeLazyQuery>;
export type P2PDisputeSuspenseQueryHookResult = ReturnType<typeof useP2PDisputeSuspenseQuery>;
export type P2PDisputeQueryResult = Apollo.QueryResult<P2PDisputeQuery, P2PDisputeQueryVariables>;
export const MyP2PDisputesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyP2PDisputes' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myP2PDisputes' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyP2PDisputesQuery__
 *
 * To run a query within a React component, call `useMyP2PDisputesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyP2PDisputesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyP2PDisputesQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyP2PDisputesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MyP2PDisputesQuery, MyP2PDisputesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyP2PDisputesQuery, MyP2PDisputesQueryVariables>(
    MyP2PDisputesDocument,
    options
  );
}
export function useMyP2PDisputesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyP2PDisputesQuery,
    MyP2PDisputesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyP2PDisputesQuery, MyP2PDisputesQueryVariables>(
    MyP2PDisputesDocument,
    options
  );
}
export function useMyP2PDisputesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MyP2PDisputesQuery, MyP2PDisputesQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyP2PDisputesQuery, MyP2PDisputesQueryVariables>(
    MyP2PDisputesDocument,
    options
  );
}
export type MyP2PDisputesQueryHookResult = ReturnType<typeof useMyP2PDisputesQuery>;
export type MyP2PDisputesLazyQueryHookResult = ReturnType<typeof useMyP2PDisputesLazyQuery>;
export type MyP2PDisputesSuspenseQueryHookResult = ReturnType<typeof useMyP2PDisputesSuspenseQuery>;
export type MyP2PDisputesQueryResult = Apollo.QueryResult<
  MyP2PDisputesQuery,
  MyP2PDisputesQueryVariables
>;
export const CurrentExchangeRateDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CurrentExchangeRate' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currency' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'currentExchangeRate' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currency' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currency' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useCurrentExchangeRateQuery__
 *
 * To run a query within a React component, call `useCurrentExchangeRateQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentExchangeRateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentExchangeRateQuery({
 *   variables: {
 *      currency: // value for 'currency'
 *   },
 * });
 */
export function useCurrentExchangeRateQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    CurrentExchangeRateQuery,
    CurrentExchangeRateQueryVariables
  > &
    ({ variables: CurrentExchangeRateQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<CurrentExchangeRateQuery, CurrentExchangeRateQueryVariables>(
    CurrentExchangeRateDocument,
    options
  );
}
export function useCurrentExchangeRateLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    CurrentExchangeRateQuery,
    CurrentExchangeRateQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<CurrentExchangeRateQuery, CurrentExchangeRateQueryVariables>(
    CurrentExchangeRateDocument,
    options
  );
}
export function useCurrentExchangeRateSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        CurrentExchangeRateQuery,
        CurrentExchangeRateQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    CurrentExchangeRateQuery,
    CurrentExchangeRateQueryVariables
  >(CurrentExchangeRateDocument, options);
}
export type CurrentExchangeRateQueryHookResult = ReturnType<typeof useCurrentExchangeRateQuery>;
export type CurrentExchangeRateLazyQueryHookResult = ReturnType<
  typeof useCurrentExchangeRateLazyQuery
>;
export type CurrentExchangeRateSuspenseQueryHookResult = ReturnType<
  typeof useCurrentExchangeRateSuspenseQuery
>;
export type CurrentExchangeRateQueryResult = Apollo.QueryResult<
  CurrentExchangeRateQuery,
  CurrentExchangeRateQueryVariables
>;
export const GetPostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPosts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'visibility' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostVisibility' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'posts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'visibility' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'visibility' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetPostsQuery__
 *
 * To run a query within a React component, call `useGetPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      userId: // value for 'userId'
 *      visibility: // value for 'visibility'
 *   },
 * });
 */
export function useGetPostsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<GetPostsQuery, GetPostsQueryVariables> &
    ({ variables: GetPostsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetPostsQuery, GetPostsQueryVariables>(
    GetPostsDocument,
    options
  );
}
export function useGetPostsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetPostsQuery, GetPostsQueryVariables>(
    GetPostsDocument,
    options
  );
}
export function useGetPostsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetPostsQuery, GetPostsQueryVariables>(
    GetPostsDocument,
    options
  );
}
export type GetPostsQueryHookResult = ReturnType<typeof useGetPostsQuery>;
export type GetPostsLazyQueryHookResult = ReturnType<typeof useGetPostsLazyQuery>;
export type GetPostsSuspenseQueryHookResult = ReturnType<typeof useGetPostsSuspenseQuery>;
export type GetPostsQueryResult = Apollo.QueryResult<GetPostsQuery, GetPostsQueryVariables>;
export const GetMediaPostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMediaPosts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mediaPosts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetMediaPostsQuery__
 *
 * To run a query within a React component, call `useGetMediaPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMediaPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMediaPostsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetMediaPostsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<GetMediaPostsQuery, GetMediaPostsQueryVariables> &
    ({ variables: GetMediaPostsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetMediaPostsQuery, GetMediaPostsQueryVariables>(
    GetMediaPostsDocument,
    options
  );
}
export function useGetMediaPostsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetMediaPostsQuery,
    GetMediaPostsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetMediaPostsQuery, GetMediaPostsQueryVariables>(
    GetMediaPostsDocument,
    options
  );
}
export function useGetMediaPostsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetMediaPostsQuery, GetMediaPostsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetMediaPostsQuery, GetMediaPostsQueryVariables>(
    GetMediaPostsDocument,
    options
  );
}
export type GetMediaPostsQueryHookResult = ReturnType<typeof useGetMediaPostsQuery>;
export type GetMediaPostsLazyQueryHookResult = ReturnType<typeof useGetMediaPostsLazyQuery>;
export type GetMediaPostsSuspenseQueryHookResult = ReturnType<typeof useGetMediaPostsSuspenseQuery>;
export type GetMediaPostsQueryResult = Apollo.QueryResult<
  GetMediaPostsQuery,
  GetMediaPostsQueryVariables
>;
export const GetLikedPostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLikedPosts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'likedPosts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetLikedPostsQuery__
 *
 * To run a query within a React component, call `useGetLikedPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLikedPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLikedPostsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetLikedPostsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<GetLikedPostsQuery, GetLikedPostsQueryVariables> &
    ({ variables: GetLikedPostsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetLikedPostsQuery, GetLikedPostsQueryVariables>(
    GetLikedPostsDocument,
    options
  );
}
export function useGetLikedPostsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetLikedPostsQuery,
    GetLikedPostsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetLikedPostsQuery, GetLikedPostsQueryVariables>(
    GetLikedPostsDocument,
    options
  );
}
export function useGetLikedPostsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetLikedPostsQuery, GetLikedPostsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetLikedPostsQuery, GetLikedPostsQueryVariables>(
    GetLikedPostsDocument,
    options
  );
}
export type GetLikedPostsQueryHookResult = ReturnType<typeof useGetLikedPostsQuery>;
export type GetLikedPostsLazyQueryHookResult = ReturnType<typeof useGetLikedPostsLazyQuery>;
export type GetLikedPostsSuspenseQueryHookResult = ReturnType<typeof useGetLikedPostsSuspenseQuery>;
export type GetLikedPostsQueryResult = Apollo.QueryResult<
  GetLikedPostsQuery,
  GetLikedPostsQueryVariables
>;
export const GetPostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetPostQuery__
 *
 * To run a query within a React component, call `useGetPostQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPostQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<GetPostQuery, GetPostQueryVariables> &
    ({ variables: GetPostQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetPostQuery, GetPostQueryVariables>(GetPostDocument, options);
}
export function useGetPostLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostQuery, GetPostQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetPostQuery, GetPostQueryVariables>(
    GetPostDocument,
    options
  );
}
export function useGetPostSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetPostQuery, GetPostQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetPostQuery, GetPostQueryVariables>(
    GetPostDocument,
    options
  );
}
export type GetPostQueryHookResult = ReturnType<typeof useGetPostQuery>;
export type GetPostLazyQueryHookResult = ReturnType<typeof useGetPostLazyQuery>;
export type GetPostSuspenseQueryHookResult = ReturnType<typeof useGetPostSuspenseQuery>;
export type GetPostQueryResult = Apollo.QueryResult<GetPostQuery, GetPostQueryVariables>;
export const CreatePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostCreateInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreatePostMutationFn = Apollo.MutationFunction<
  CreatePostMutation,
  CreatePostMutationVariables
>;

/**
 * __useCreatePostMutation__
 *
 * To run a mutation, you first call `useCreatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPostMutation, { data, loading, error }] = useCreatePostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePostMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreatePostMutation,
    CreatePostMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<CreatePostMutation, CreatePostMutationVariables>(
    CreatePostDocument,
    options
  );
}
export type CreatePostMutationHookResult = ReturnType<typeof useCreatePostMutation>;
export type CreatePostMutationResult = Apollo.MutationResult<CreatePostMutation>;
export type CreatePostMutationOptions = Apollo.BaseMutationOptions<
  CreatePostMutation,
  CreatePostMutationVariables
>;
export const ToggleLikeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleLike' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'toggleLike' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type ToggleLikeMutationFn = Apollo.MutationFunction<
  ToggleLikeMutation,
  ToggleLikeMutationVariables
>;

/**
 * __useToggleLikeMutation__
 *
 * To run a mutation, you first call `useToggleLikeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleLikeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleLikeMutation, { data, loading, error }] = useToggleLikeMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useToggleLikeMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ToggleLikeMutation,
    ToggleLikeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<ToggleLikeMutation, ToggleLikeMutationVariables>(
    ToggleLikeDocument,
    options
  );
}
export type ToggleLikeMutationHookResult = ReturnType<typeof useToggleLikeMutation>;
export type ToggleLikeMutationResult = Apollo.MutationResult<ToggleLikeMutation>;
export type ToggleLikeMutationOptions = Apollo.BaseMutationOptions<
  ToggleLikeMutation,
  ToggleLikeMutationVariables
>;
export const DeletePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeletePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deletePost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DeletePostMutationFn = Apollo.MutationFunction<
  DeletePostMutation,
  DeletePostMutationVariables
>;

/**
 * __useDeletePostMutation__
 *
 * To run a mutation, you first call `useDeletePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePostMutation, { data, loading, error }] = useDeletePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePostMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeletePostMutation,
    DeletePostMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeletePostMutation, DeletePostMutationVariables>(
    DeletePostDocument,
    options
  );
}
export type DeletePostMutationHookResult = ReturnType<typeof useDeletePostMutation>;
export type DeletePostMutationResult = Apollo.MutationResult<DeletePostMutation>;
export type DeletePostMutationOptions = Apollo.BaseMutationOptions<
  DeletePostMutation,
  DeletePostMutationVariables
>;
export const PostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Posts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'visibility' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostVisibility' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'posts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'visibility' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'visibility' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __usePostsQuery__
 *
 * To run a query within a React component, call `usePostsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      userId: // value for 'userId'
 *      visibility: // value for 'visibility'
 *      includeProcessing: // value for 'includeProcessing'
 *   },
 * });
 */
export function usePostsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<PostsQuery, PostsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<PostsQuery, PostsQueryVariables>(PostsDocument, options);
}
export function usePostsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostsQuery, PostsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<PostsQuery, PostsQueryVariables>(PostsDocument, options);
}
export function usePostsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<PostsQuery, PostsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<PostsQuery, PostsQueryVariables>(PostsDocument, options);
}
export type PostsQueryHookResult = ReturnType<typeof usePostsQuery>;
export type PostsLazyQueryHookResult = ReturnType<typeof usePostsLazyQuery>;
export type PostsSuspenseQueryHookResult = ReturnType<typeof usePostsSuspenseQuery>;
export type PostsQueryResult = Apollo.QueryResult<PostsQuery, PostsQueryVariables>;
export const PostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Post' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __usePostQuery__
 *
 * To run a query within a React component, call `usePostQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeProcessing: // value for 'includeProcessing'
 *   },
 * });
 */
export function usePostQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<PostQuery, PostQueryVariables> &
    ({ variables: PostQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<PostQuery, PostQueryVariables>(PostDocument, options);
}
export function usePostLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostQuery, PostQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<PostQuery, PostQueryVariables>(PostDocument, options);
}
export function usePostSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<PostQuery, PostQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<PostQuery, PostQueryVariables>(PostDocument, options);
}
export type PostQueryHookResult = ReturnType<typeof usePostQuery>;
export type PostLazyQueryHookResult = ReturnType<typeof usePostLazyQuery>;
export type PostSuspenseQueryHookResult = ReturnType<typeof usePostSuspenseQuery>;
export type PostQueryResult = Apollo.QueryResult<PostQuery, PostQueryVariables>;
export const PostDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PostDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeProcessing' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeProcessing' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __usePostDetailQuery__
 *
 * To run a query within a React component, call `usePostDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *      includeProcessing: // value for 'includeProcessing'
 *   },
 * });
 */
export function usePostDetailQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<PostDetailQuery, PostDetailQueryVariables> &
    ({ variables: PostDetailQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<PostDetailQuery, PostDetailQueryVariables>(
    PostDetailDocument,
    options
  );
}
export function usePostDetailLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<PostDetailQuery, PostDetailQueryVariables>(
    PostDetailDocument,
    options
  );
}
export function usePostDetailSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<PostDetailQuery, PostDetailQueryVariables>(
    PostDetailDocument,
    options
  );
}
export type PostDetailQueryHookResult = ReturnType<typeof usePostDetailQuery>;
export type PostDetailLazyQueryHookResult = ReturnType<typeof usePostDetailLazyQuery>;
export type PostDetailSuspenseQueryHookResult = ReturnType<typeof usePostDetailSuspenseQuery>;
export type PostDetailQueryResult = Apollo.QueryResult<PostDetailQuery, PostDetailQueryVariables>;
export const UpdatePostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePost' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostUpdateInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePost' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdatePostMutationFn = Apollo.MutationFunction<
  UpdatePostMutation,
  UpdatePostMutationVariables
>;

/**
 * __useUpdatePostMutation__
 *
 * To run a mutation, you first call `useUpdatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePostMutation, { data, loading, error }] = useUpdatePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePostMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdatePostMutation,
    UpdatePostMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdatePostMutation, UpdatePostMutationVariables>(
    UpdatePostDocument,
    options
  );
}
export type UpdatePostMutationHookResult = ReturnType<typeof useUpdatePostMutation>;
export type UpdatePostMutationResult = Apollo.MutationResult<UpdatePostMutation>;
export type UpdatePostMutationOptions = Apollo.BaseMutationOptions<
  UpdatePostMutation,
  UpdatePostMutationVariables
>;
export const MediaPostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MediaPosts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mediaPosts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMediaPostsQuery__
 *
 * To run a query within a React component, call `useMediaPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMediaPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMediaPostsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMediaPostsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MediaPostsQuery, MediaPostsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MediaPostsQuery, MediaPostsQueryVariables>(
    MediaPostsDocument,
    options
  );
}
export function useMediaPostsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MediaPostsQuery, MediaPostsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MediaPostsQuery, MediaPostsQueryVariables>(
    MediaPostsDocument,
    options
  );
}
export function useMediaPostsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MediaPostsQuery, MediaPostsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MediaPostsQuery, MediaPostsQueryVariables>(
    MediaPostsDocument,
    options
  );
}
export type MediaPostsQueryHookResult = ReturnType<typeof useMediaPostsQuery>;
export type MediaPostsLazyQueryHookResult = ReturnType<typeof useMediaPostsLazyQuery>;
export type MediaPostsSuspenseQueryHookResult = ReturnType<typeof useMediaPostsSuspenseQuery>;
export type MediaPostsQueryResult = Apollo.QueryResult<MediaPostsQuery, MediaPostsQueryVariables>;
export const SiteFeatureSettingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteFeatureSettings' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteFeatureSettings' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'SiteFeatureSettingInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SiteFeatureSettingInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'SiteFeatureSetting' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useSiteFeatureSettingsQuery__
 *
 * To run a query within a React component, call `useSiteFeatureSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSiteFeatureSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSiteFeatureSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSiteFeatureSettingsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    SiteFeatureSettingsQuery,
    SiteFeatureSettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<SiteFeatureSettingsQuery, SiteFeatureSettingsQueryVariables>(
    SiteFeatureSettingsDocument,
    options
  );
}
export function useSiteFeatureSettingsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    SiteFeatureSettingsQuery,
    SiteFeatureSettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<SiteFeatureSettingsQuery, SiteFeatureSettingsQueryVariables>(
    SiteFeatureSettingsDocument,
    options
  );
}
export function useSiteFeatureSettingsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        SiteFeatureSettingsQuery,
        SiteFeatureSettingsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    SiteFeatureSettingsQuery,
    SiteFeatureSettingsQueryVariables
  >(SiteFeatureSettingsDocument, options);
}
export type SiteFeatureSettingsQueryHookResult = ReturnType<typeof useSiteFeatureSettingsQuery>;
export type SiteFeatureSettingsLazyQueryHookResult = ReturnType<
  typeof useSiteFeatureSettingsLazyQuery
>;
export type SiteFeatureSettingsSuspenseQueryHookResult = ReturnType<
  typeof useSiteFeatureSettingsSuspenseQuery
>;
export type SiteFeatureSettingsQueryResult = Apollo.QueryResult<
  SiteFeatureSettingsQuery,
  SiteFeatureSettingsQueryVariables
>;
export const SiteFeatureSettingDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteFeatureSetting' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'featureName' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteFeatureSetting' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'featureName' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'featureName' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'SiteFeatureSettingInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SiteFeatureSettingInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'SiteFeatureSetting' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useSiteFeatureSettingQuery__
 *
 * To run a query within a React component, call `useSiteFeatureSettingQuery` and pass it any options that fit your needs.
 * When your component renders, `useSiteFeatureSettingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSiteFeatureSettingQuery({
 *   variables: {
 *      featureName: // value for 'featureName'
 *   },
 * });
 */
export function useSiteFeatureSettingQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    SiteFeatureSettingQuery,
    SiteFeatureSettingQueryVariables
  > &
    ({ variables: SiteFeatureSettingQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<SiteFeatureSettingQuery, SiteFeatureSettingQueryVariables>(
    SiteFeatureSettingDocument,
    options
  );
}
export function useSiteFeatureSettingLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    SiteFeatureSettingQuery,
    SiteFeatureSettingQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<SiteFeatureSettingQuery, SiteFeatureSettingQueryVariables>(
    SiteFeatureSettingDocument,
    options
  );
}
export function useSiteFeatureSettingSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        SiteFeatureSettingQuery,
        SiteFeatureSettingQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    SiteFeatureSettingQuery,
    SiteFeatureSettingQueryVariables
  >(SiteFeatureSettingDocument, options);
}
export type SiteFeatureSettingQueryHookResult = ReturnType<typeof useSiteFeatureSettingQuery>;
export type SiteFeatureSettingLazyQueryHookResult = ReturnType<
  typeof useSiteFeatureSettingLazyQuery
>;
export type SiteFeatureSettingSuspenseQueryHookResult = ReturnType<
  typeof useSiteFeatureSettingSuspenseQuery
>;
export type SiteFeatureSettingQueryResult = Apollo.QueryResult<
  SiteFeatureSettingQuery,
  SiteFeatureSettingQueryVariables
>;
export const UserFeaturePermissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserFeaturePermissions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userFeaturePermissions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserFeaturePermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUserFeaturePermissionsQuery__
 *
 * To run a query within a React component, call `useUserFeaturePermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserFeaturePermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserFeaturePermissionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUserFeaturePermissionsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    UserFeaturePermissionsQuery,
    UserFeaturePermissionsQueryVariables
  > &
    ({ variables: UserFeaturePermissionsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    UserFeaturePermissionsQuery,
    UserFeaturePermissionsQueryVariables
  >(UserFeaturePermissionsDocument, options);
}
export function useUserFeaturePermissionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UserFeaturePermissionsQuery,
    UserFeaturePermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    UserFeaturePermissionsQuery,
    UserFeaturePermissionsQueryVariables
  >(UserFeaturePermissionsDocument, options);
}
export function useUserFeaturePermissionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        UserFeaturePermissionsQuery,
        UserFeaturePermissionsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    UserFeaturePermissionsQuery,
    UserFeaturePermissionsQueryVariables
  >(UserFeaturePermissionsDocument, options);
}
export type UserFeaturePermissionsQueryHookResult = ReturnType<
  typeof useUserFeaturePermissionsQuery
>;
export type UserFeaturePermissionsLazyQueryHookResult = ReturnType<
  typeof useUserFeaturePermissionsLazyQuery
>;
export type UserFeaturePermissionsSuspenseQueryHookResult = ReturnType<
  typeof useUserFeaturePermissionsSuspenseQuery
>;
export type UserFeaturePermissionsQueryResult = Apollo.QueryResult<
  UserFeaturePermissionsQuery,
  UserFeaturePermissionsQueryVariables
>;
export const MyFeaturePermissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyFeaturePermissions' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myFeaturePermissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserFeaturePermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyFeaturePermissionsQuery__
 *
 * To run a query within a React component, call `useMyFeaturePermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyFeaturePermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyFeaturePermissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyFeaturePermissionsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyFeaturePermissionsQuery,
    MyFeaturePermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyFeaturePermissionsQuery, MyFeaturePermissionsQueryVariables>(
    MyFeaturePermissionsDocument,
    options
  );
}
export function useMyFeaturePermissionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyFeaturePermissionsQuery,
    MyFeaturePermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    MyFeaturePermissionsQuery,
    MyFeaturePermissionsQueryVariables
  >(MyFeaturePermissionsDocument, options);
}
export function useMyFeaturePermissionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyFeaturePermissionsQuery,
        MyFeaturePermissionsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyFeaturePermissionsQuery,
    MyFeaturePermissionsQueryVariables
  >(MyFeaturePermissionsDocument, options);
}
export type MyFeaturePermissionsQueryHookResult = ReturnType<typeof useMyFeaturePermissionsQuery>;
export type MyFeaturePermissionsLazyQueryHookResult = ReturnType<
  typeof useMyFeaturePermissionsLazyQuery
>;
export type MyFeaturePermissionsSuspenseQueryHookResult = ReturnType<
  typeof useMyFeaturePermissionsSuspenseQuery
>;
export type MyFeaturePermissionsQueryResult = Apollo.QueryResult<
  MyFeaturePermissionsQuery,
  MyFeaturePermissionsQueryVariables
>;
export const GetFeatureFlagsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetFeatureFlags' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'featureFlags' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'POST_CREATE' } },
                { kind: 'Field', name: { kind: 'Name', value: 'POST_IMAGE_UPLOAD' } },
                { kind: 'Field', name: { kind: 'Name', value: 'POST_LIKE' } },
                { kind: 'Field', name: { kind: 'Name', value: 'MESSAGES_ACCESS' } },
                { kind: 'Field', name: { kind: 'Name', value: 'MESSAGES_SEND' } },
                { kind: 'Field', name: { kind: 'Name', value: 'WALLET_ACCESS' } },
                { kind: 'Field', name: { kind: 'Name', value: 'WALLET_DEPOSIT' } },
                { kind: 'Field', name: { kind: 'Name', value: 'WALLET_WITHDRAW' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetFeatureFlagsQuery__
 *
 * To run a query within a React component, call `useGetFeatureFlagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeatureFlagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeatureFlagsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFeatureFlagsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetFeatureFlagsQuery,
    GetFeatureFlagsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(
    GetFeatureFlagsDocument,
    options
  );
}
export function useGetFeatureFlagsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetFeatureFlagsQuery,
    GetFeatureFlagsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(
    GetFeatureFlagsDocument,
    options
  );
}
export function useGetFeatureFlagsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(
    GetFeatureFlagsDocument,
    options
  );
}
export type GetFeatureFlagsQueryHookResult = ReturnType<typeof useGetFeatureFlagsQuery>;
export type GetFeatureFlagsLazyQueryHookResult = ReturnType<typeof useGetFeatureFlagsLazyQuery>;
export type GetFeatureFlagsSuspenseQueryHookResult = ReturnType<
  typeof useGetFeatureFlagsSuspenseQuery
>;
export type GetFeatureFlagsQueryResult = Apollo.QueryResult<
  GetFeatureFlagsQuery,
  GetFeatureFlagsQueryVariables
>;
export const UpdateSiteFeatureDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateSiteFeature' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateSiteFeatureInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateSiteFeature' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'SiteFeatureSettingInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SiteFeatureSettingInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'SiteFeatureSetting' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateSiteFeatureMutationFn = Apollo.MutationFunction<
  UpdateSiteFeatureMutation,
  UpdateSiteFeatureMutationVariables
>;

/**
 * __useUpdateSiteFeatureMutation__
 *
 * To run a mutation, you first call `useUpdateSiteFeatureMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSiteFeatureMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSiteFeatureMutation, { data, loading, error }] = useUpdateSiteFeatureMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSiteFeatureMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateSiteFeatureMutation,
    UpdateSiteFeatureMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateSiteFeatureMutation,
    UpdateSiteFeatureMutationVariables
  >(UpdateSiteFeatureDocument, options);
}
export type UpdateSiteFeatureMutationHookResult = ReturnType<typeof useUpdateSiteFeatureMutation>;
export type UpdateSiteFeatureMutationResult = Apollo.MutationResult<UpdateSiteFeatureMutation>;
export type UpdateSiteFeatureMutationOptions = Apollo.BaseMutationOptions<
  UpdateSiteFeatureMutation,
  UpdateSiteFeatureMutationVariables
>;
export const UpdateUserFeaturePermissionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUserFeaturePermission' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateUserFeaturePermissionInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateUserFeaturePermission' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserFeaturePermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserFeaturePermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'featureName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateUserFeaturePermissionMutationFn = Apollo.MutationFunction<
  UpdateUserFeaturePermissionMutation,
  UpdateUserFeaturePermissionMutationVariables
>;

/**
 * __useUpdateUserFeaturePermissionMutation__
 *
 * To run a mutation, you first call `useUpdateUserFeaturePermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserFeaturePermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserFeaturePermissionMutation, { data, loading, error }] = useUpdateUserFeaturePermissionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserFeaturePermissionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateUserFeaturePermissionMutation,
    UpdateUserFeaturePermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateUserFeaturePermissionMutation,
    UpdateUserFeaturePermissionMutationVariables
  >(UpdateUserFeaturePermissionDocument, options);
}
export type UpdateUserFeaturePermissionMutationHookResult = ReturnType<
  typeof useUpdateUserFeaturePermissionMutation
>;
export type UpdateUserFeaturePermissionMutationResult =
  Apollo.MutationResult<UpdateUserFeaturePermissionMutation>;
export type UpdateUserFeaturePermissionMutationOptions = Apollo.BaseMutationOptions<
  UpdateUserFeaturePermissionMutation,
  UpdateUserFeaturePermissionMutationVariables
>;
export const RevokeUserFeaturePermissionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RevokeUserFeaturePermission' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'RevokeUserFeaturePermissionInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'revokeUserFeaturePermission' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type RevokeUserFeaturePermissionMutationFn = Apollo.MutationFunction<
  RevokeUserFeaturePermissionMutation,
  RevokeUserFeaturePermissionMutationVariables
>;

/**
 * __useRevokeUserFeaturePermissionMutation__
 *
 * To run a mutation, you first call `useRevokeUserFeaturePermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevokeUserFeaturePermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revokeUserFeaturePermissionMutation, { data, loading, error }] = useRevokeUserFeaturePermissionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRevokeUserFeaturePermissionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RevokeUserFeaturePermissionMutation,
    RevokeUserFeaturePermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    RevokeUserFeaturePermissionMutation,
    RevokeUserFeaturePermissionMutationVariables
  >(RevokeUserFeaturePermissionDocument, options);
}
export type RevokeUserFeaturePermissionMutationHookResult = ReturnType<
  typeof useRevokeUserFeaturePermissionMutation
>;
export type RevokeUserFeaturePermissionMutationResult =
  Apollo.MutationResult<RevokeUserFeaturePermissionMutation>;
export type RevokeUserFeaturePermissionMutationOptions = Apollo.BaseMutationOptions<
  RevokeUserFeaturePermissionMutation,
  RevokeUserFeaturePermissionMutationVariables
>;
export const TimelineDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Timeline' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TimelineType' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'timeline' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'timelineType' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useTimelineQuery__
 *
 * To run a query within a React component, call `useTimelineQuery` and pass it any options that fit your needs.
 * When your component renders, `useTimelineQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTimelineQuery({
 *   variables: {
 *      type: // value for 'type'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useTimelineQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<TimelineQuery, TimelineQueryVariables> &
    ({ variables: TimelineQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<TimelineQuery, TimelineQueryVariables>(
    TimelineDocument,
    options
  );
}
export function useTimelineLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<TimelineQuery, TimelineQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<TimelineQuery, TimelineQueryVariables>(
    TimelineDocument,
    options
  );
}
export function useTimelineSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TimelineQuery, TimelineQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<TimelineQuery, TimelineQueryVariables>(
    TimelineDocument,
    options
  );
}
export type TimelineQueryHookResult = ReturnType<typeof useTimelineQuery>;
export type TimelineLazyQueryHookResult = ReturnType<typeof useTimelineLazyQuery>;
export type TimelineSuspenseQueryHookResult = ReturnType<typeof useTimelineSuspenseQuery>;
export type TimelineQueryResult = Apollo.QueryResult<TimelineQuery, TimelineQueryVariables>;
export const TwoFactorStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'TwoFactorStatus' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'twoFactorStatus' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'enabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'enabledAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'backupCodesCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useTwoFactorStatusQuery__
 *
 * To run a query within a React component, call `useTwoFactorStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useTwoFactorStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTwoFactorStatusQuery({
 *   variables: {
 *   },
 * });
 */
export function useTwoFactorStatusQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    TwoFactorStatusQuery,
    TwoFactorStatusQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<TwoFactorStatusQuery, TwoFactorStatusQueryVariables>(
    TwoFactorStatusDocument,
    options
  );
}
export function useTwoFactorStatusLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TwoFactorStatusQuery,
    TwoFactorStatusQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<TwoFactorStatusQuery, TwoFactorStatusQueryVariables>(
    TwoFactorStatusDocument,
    options
  );
}
export function useTwoFactorStatusSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TwoFactorStatusQuery, TwoFactorStatusQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<TwoFactorStatusQuery, TwoFactorStatusQueryVariables>(
    TwoFactorStatusDocument,
    options
  );
}
export type TwoFactorStatusQueryHookResult = ReturnType<typeof useTwoFactorStatusQuery>;
export type TwoFactorStatusLazyQueryHookResult = ReturnType<typeof useTwoFactorStatusLazyQuery>;
export type TwoFactorStatusSuspenseQueryHookResult = ReturnType<
  typeof useTwoFactorStatusSuspenseQuery
>;
export type TwoFactorStatusQueryResult = Apollo.QueryResult<
  TwoFactorStatusQuery,
  TwoFactorStatusQueryVariables
>;
export const SetupTwoFactorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SetupTwoFactor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TwoFactorSetupInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'setupTwoFactor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'secret' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qrCodeUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'manualEntryKey' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type SetupTwoFactorMutationFn = Apollo.MutationFunction<
  SetupTwoFactorMutation,
  SetupTwoFactorMutationVariables
>;

/**
 * __useSetupTwoFactorMutation__
 *
 * To run a mutation, you first call `useSetupTwoFactorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetupTwoFactorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setupTwoFactorMutation, { data, loading, error }] = useSetupTwoFactorMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetupTwoFactorMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    SetupTwoFactorMutation,
    SetupTwoFactorMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<SetupTwoFactorMutation, SetupTwoFactorMutationVariables>(
    SetupTwoFactorDocument,
    options
  );
}
export type SetupTwoFactorMutationHookResult = ReturnType<typeof useSetupTwoFactorMutation>;
export type SetupTwoFactorMutationResult = Apollo.MutationResult<SetupTwoFactorMutation>;
export type SetupTwoFactorMutationOptions = Apollo.BaseMutationOptions<
  SetupTwoFactorMutation,
  SetupTwoFactorMutationVariables
>;
export const EnableTwoFactorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'EnableTwoFactor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TwoFactorEnableInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'enableTwoFactor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'backupCodes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'codes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'generatedAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type EnableTwoFactorMutationFn = Apollo.MutationFunction<
  EnableTwoFactorMutation,
  EnableTwoFactorMutationVariables
>;

/**
 * __useEnableTwoFactorMutation__
 *
 * To run a mutation, you first call `useEnableTwoFactorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnableTwoFactorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enableTwoFactorMutation, { data, loading, error }] = useEnableTwoFactorMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEnableTwoFactorMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    EnableTwoFactorMutation,
    EnableTwoFactorMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<EnableTwoFactorMutation, EnableTwoFactorMutationVariables>(
    EnableTwoFactorDocument,
    options
  );
}
export type EnableTwoFactorMutationHookResult = ReturnType<typeof useEnableTwoFactorMutation>;
export type EnableTwoFactorMutationResult = Apollo.MutationResult<EnableTwoFactorMutation>;
export type EnableTwoFactorMutationOptions = Apollo.BaseMutationOptions<
  EnableTwoFactorMutation,
  EnableTwoFactorMutationVariables
>;
export const DisableTwoFactorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DisableTwoFactor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TwoFactorDisableInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'disableTwoFactor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type DisableTwoFactorMutationFn = Apollo.MutationFunction<
  DisableTwoFactorMutation,
  DisableTwoFactorMutationVariables
>;

/**
 * __useDisableTwoFactorMutation__
 *
 * To run a mutation, you first call `useDisableTwoFactorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisableTwoFactorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disableTwoFactorMutation, { data, loading, error }] = useDisableTwoFactorMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDisableTwoFactorMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DisableTwoFactorMutation,
    DisableTwoFactorMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DisableTwoFactorMutation, DisableTwoFactorMutationVariables>(
    DisableTwoFactorDocument,
    options
  );
}
export type DisableTwoFactorMutationHookResult = ReturnType<typeof useDisableTwoFactorMutation>;
export type DisableTwoFactorMutationResult = Apollo.MutationResult<DisableTwoFactorMutation>;
export type DisableTwoFactorMutationOptions = Apollo.BaseMutationOptions<
  DisableTwoFactorMutation,
  DisableTwoFactorMutationVariables
>;
export const RegenerateBackupCodesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RegenerateBackupCodes' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'TwoFactorRegenerateBackupCodesInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'regenerateBackupCodes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'codes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type RegenerateBackupCodesMutationFn = Apollo.MutationFunction<
  RegenerateBackupCodesMutation,
  RegenerateBackupCodesMutationVariables
>;

/**
 * __useRegenerateBackupCodesMutation__
 *
 * To run a mutation, you first call `useRegenerateBackupCodesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegenerateBackupCodesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [regenerateBackupCodesMutation, { data, loading, error }] = useRegenerateBackupCodesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegenerateBackupCodesMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RegenerateBackupCodesMutation,
    RegenerateBackupCodesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    RegenerateBackupCodesMutation,
    RegenerateBackupCodesMutationVariables
  >(RegenerateBackupCodesDocument, options);
}
export type RegenerateBackupCodesMutationHookResult = ReturnType<
  typeof useRegenerateBackupCodesMutation
>;
export type RegenerateBackupCodesMutationResult =
  Apollo.MutationResult<RegenerateBackupCodesMutation>;
export type RegenerateBackupCodesMutationOptions = Apollo.BaseMutationOptions<
  RegenerateBackupCodesMutation,
  RegenerateBackupCodesMutationVariables
>;
export const UsersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Users' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'cursor' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'hasNextPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasPreviousPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startCursor' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endCursor' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCount' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useUsersQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<UsersQuery, UsersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
}
export function useUsersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UsersQuery, UsersQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
}
export function useUsersSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
}
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersSuspenseQueryHookResult = ReturnType<typeof useUsersSuspenseQuery>;
export type UsersQueryResult = Apollo.QueryResult<UsersQuery, UsersQueryVariables>;
export const UserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'User' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUserQuery__
 *
 * To run a query within a React component, call `useUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUserQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<UserQuery, UserQueryVariables> &
    ({ variables: UserQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UserQuery, UserQueryVariables>(UserDocument, options);
}
export function useUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UserQuery, UserQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UserQuery, UserQueryVariables>(UserDocument, options);
}
export function useUserSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<UserQuery, UserQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UserQuery, UserQueryVariables>(UserDocument, options);
}
export type UserQueryHookResult = ReturnType<typeof useUserQuery>;
export type UserLazyQueryHookResult = ReturnType<typeof useUserLazyQuery>;
export type UserSuspenseQueryHookResult = ReturnType<typeof useUserSuspenseQuery>;
export type UserQueryResult = Apollo.QueryResult<UserQuery, UserQueryVariables>;
export const UserByUsernameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserByUsername' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'username' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userByUsername' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'username' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'username' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUserByUsernameQuery__
 *
 * To run a query within a React component, call `useUserByUsernameQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserByUsernameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserByUsernameQuery({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useUserByUsernameQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    UserByUsernameQuery,
    UserByUsernameQueryVariables
  > &
    ({ variables: UserByUsernameQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UserByUsernameQuery, UserByUsernameQueryVariables>(
    UserByUsernameDocument,
    options
  );
}
export function useUserByUsernameLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UserByUsernameQuery,
    UserByUsernameQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UserByUsernameQuery, UserByUsernameQueryVariables>(
    UserByUsernameDocument,
    options
  );
}
export function useUserByUsernameSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<UserByUsernameQuery, UserByUsernameQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UserByUsernameQuery, UserByUsernameQueryVariables>(
    UserByUsernameDocument,
    options
  );
}
export type UserByUsernameQueryHookResult = ReturnType<typeof useUserByUsernameQuery>;
export type UserByUsernameLazyQueryHookResult = ReturnType<typeof useUserByUsernameLazyQuery>;
export type UserByUsernameSuspenseQueryHookResult = ReturnType<
  typeof useUserByUsernameSuspenseQuery
>;
export type UserByUsernameQueryResult = Apollo.QueryResult<
  UserByUsernameQuery,
  UserByUsernameQueryVariables
>;
export const MySettingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MySettings' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mySettings' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserSettingsInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserSettingsInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserSettings' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'theme' } },
          { kind: 'Field', name: { kind: 'Name', value: 'animationsEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'locale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contentFilter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'timezone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMySettingsQuery__
 *
 * To run a query within a React component, call `useMySettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMySettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMySettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMySettingsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MySettingsQuery, MySettingsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MySettingsQuery, MySettingsQueryVariables>(
    MySettingsDocument,
    options
  );
}
export function useMySettingsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MySettingsQuery, MySettingsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MySettingsQuery, MySettingsQueryVariables>(
    MySettingsDocument,
    options
  );
}
export function useMySettingsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MySettingsQuery, MySettingsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MySettingsQuery, MySettingsQueryVariables>(
    MySettingsDocument,
    options
  );
}
export type MySettingsQueryHookResult = ReturnType<typeof useMySettingsQuery>;
export type MySettingsLazyQueryHookResult = ReturnType<typeof useMySettingsLazyQuery>;
export type MySettingsSuspenseQueryHookResult = ReturnType<typeof useMySettingsSuspenseQuery>;
export type MySettingsQueryResult = Apollo.QueryResult<MySettingsQuery, MySettingsQueryVariables>;
export const UpdateProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ProfileUpdateInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateProfile' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateProfileMutationFn = Apollo.MutationFunction<
  UpdateProfileMutation,
  UpdateProfileMutationVariables
>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateProfileMutation,
    UpdateProfileMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(
    UpdateProfileDocument,
    options
  );
}
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<
  UpdateProfileMutation,
  UpdateProfileMutationVariables
>;
export const UpdateUserSettingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUserSettings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UserSettingsUpdateInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateUserSettings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserSettingsInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserSettingsInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserSettings' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'theme' } },
          { kind: 'Field', name: { kind: 'Name', value: 'animationsEnabled' } },
          { kind: 'Field', name: { kind: 'Name', value: 'locale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'contentFilter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayMode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'timezone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type UpdateUserSettingsMutationFn = Apollo.MutationFunction<
  UpdateUserSettingsMutation,
  UpdateUserSettingsMutationVariables
>;

/**
 * __useUpdateUserSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateUserSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserSettingsMutation, { data, loading, error }] = useUpdateUserSettingsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserSettingsMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateUserSettingsMutation,
    UpdateUserSettingsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateUserSettingsMutation,
    UpdateUserSettingsMutationVariables
  >(UpdateUserSettingsDocument, options);
}
export type UpdateUserSettingsMutationHookResult = ReturnType<typeof useUpdateUserSettingsMutation>;
export type UpdateUserSettingsMutationResult = Apollo.MutationResult<UpdateUserSettingsMutation>;
export type UpdateUserSettingsMutationOptions = Apollo.BaseMutationOptions<
  UpdateUserSettingsMutation,
  UpdateUserSettingsMutationVariables
>;
export const MyWalletDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyWallet' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myWallet' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Wallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'salesBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'p2pBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyWalletQuery__
 *
 * To run a query within a React component, call `useMyWalletQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyWalletQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyWalletQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyWalletQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MyWalletQuery, MyWalletQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyWalletQuery, MyWalletQueryVariables>(
    MyWalletDocument,
    options
  );
}
export function useMyWalletLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MyWalletQuery, MyWalletQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyWalletQuery, MyWalletQueryVariables>(
    MyWalletDocument,
    options
  );
}
export function useMyWalletSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MyWalletQuery, MyWalletQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyWalletQuery, MyWalletQueryVariables>(
    MyWalletDocument,
    options
  );
}
export type MyWalletQueryHookResult = ReturnType<typeof useMyWalletQuery>;
export type MyWalletLazyQueryHookResult = ReturnType<typeof useMyWalletLazyQuery>;
export type MyWalletSuspenseQueryHookResult = ReturnType<typeof useMyWalletSuspenseQuery>;
export type MyWalletQueryResult = Apollo.QueryResult<MyWalletQuery, MyWalletQueryVariables>;
export const MyWalletTransactionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyWalletTransactions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myWalletTransactions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletTransactionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletTransactionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WalletTransaction' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentRequestId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyWalletTransactionsQuery__
 *
 * To run a query within a React component, call `useMyWalletTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyWalletTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyWalletTransactionsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useMyWalletTransactionsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyWalletTransactionsQuery,
    MyWalletTransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyWalletTransactionsQuery, MyWalletTransactionsQueryVariables>(
    MyWalletTransactionsDocument,
    options
  );
}
export function useMyWalletTransactionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyWalletTransactionsQuery,
    MyWalletTransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    MyWalletTransactionsQuery,
    MyWalletTransactionsQueryVariables
  >(MyWalletTransactionsDocument, options);
}
export function useMyWalletTransactionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyWalletTransactionsQuery,
        MyWalletTransactionsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyWalletTransactionsQuery,
    MyWalletTransactionsQueryVariables
  >(MyWalletTransactionsDocument, options);
}
export type MyWalletTransactionsQueryHookResult = ReturnType<typeof useMyWalletTransactionsQuery>;
export type MyWalletTransactionsLazyQueryHookResult = ReturnType<
  typeof useMyWalletTransactionsLazyQuery
>;
export type MyWalletTransactionsSuspenseQueryHookResult = ReturnType<
  typeof useMyWalletTransactionsSuspenseQuery
>;
export type MyWalletTransactionsQueryResult = Apollo.QueryResult<
  MyWalletTransactionsQuery,
  MyWalletTransactionsQueryVariables
>;
export const MyUserWalletsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyUserWallets' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myUserWallets' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserWalletInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserWalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserWallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'walletName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'address' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyUserWalletsQuery__
 *
 * To run a query within a React component, call `useMyUserWalletsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyUserWalletsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyUserWalletsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyUserWalletsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MyUserWalletsQuery, MyUserWalletsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyUserWalletsQuery, MyUserWalletsQueryVariables>(
    MyUserWalletsDocument,
    options
  );
}
export function useMyUserWalletsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyUserWalletsQuery,
    MyUserWalletsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyUserWalletsQuery, MyUserWalletsQueryVariables>(
    MyUserWalletsDocument,
    options
  );
}
export function useMyUserWalletsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MyUserWalletsQuery, MyUserWalletsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyUserWalletsQuery, MyUserWalletsQueryVariables>(
    MyUserWalletsDocument,
    options
  );
}
export type MyUserWalletsQueryHookResult = ReturnType<typeof useMyUserWalletsQuery>;
export type MyUserWalletsLazyQueryHookResult = ReturnType<typeof useMyUserWalletsLazyQuery>;
export type MyUserWalletsSuspenseQueryHookResult = ReturnType<typeof useMyUserWalletsSuspenseQuery>;
export type MyUserWalletsQueryResult = Apollo.QueryResult<
  MyUserWalletsQuery,
  MyUserWalletsQueryVariables
>;
export const MyDepositRequestsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyDepositRequests' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myDepositRequests' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'DepositRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DepositRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'DepositRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'requestedUsdAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expectedCryptoAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'ourDepositAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyDepositRequestsQuery__
 *
 * To run a query within a React component, call `useMyDepositRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyDepositRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyDepositRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyDepositRequestsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyDepositRequestsQuery,
    MyDepositRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyDepositRequestsQuery, MyDepositRequestsQueryVariables>(
    MyDepositRequestsDocument,
    options
  );
}
export function useMyDepositRequestsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyDepositRequestsQuery,
    MyDepositRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyDepositRequestsQuery, MyDepositRequestsQueryVariables>(
    MyDepositRequestsDocument,
    options
  );
}
export function useMyDepositRequestsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyDepositRequestsQuery,
        MyDepositRequestsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyDepositRequestsQuery, MyDepositRequestsQueryVariables>(
    MyDepositRequestsDocument,
    options
  );
}
export type MyDepositRequestsQueryHookResult = ReturnType<typeof useMyDepositRequestsQuery>;
export type MyDepositRequestsLazyQueryHookResult = ReturnType<typeof useMyDepositRequestsLazyQuery>;
export type MyDepositRequestsSuspenseQueryHookResult = ReturnType<
  typeof useMyDepositRequestsSuspenseQuery
>;
export type MyDepositRequestsQueryResult = Apollo.QueryResult<
  MyDepositRequestsQuery,
  MyDepositRequestsQueryVariables
>;
export const MyWithdrawalRequestsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyWithdrawalRequests' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myWithdrawalRequests' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WithdrawalRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WithdrawalRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WithdrawalRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'destinationAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'errorMessage' } },
          { kind: 'Field', name: { kind: 'Name', value: 'processedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyWithdrawalRequestsQuery__
 *
 * To run a query within a React component, call `useMyWithdrawalRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyWithdrawalRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyWithdrawalRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyWithdrawalRequestsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    MyWithdrawalRequestsQuery,
    MyWithdrawalRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyWithdrawalRequestsQuery, MyWithdrawalRequestsQueryVariables>(
    MyWithdrawalRequestsDocument,
    options
  );
}
export function useMyWithdrawalRequestsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyWithdrawalRequestsQuery,
    MyWithdrawalRequestsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    MyWithdrawalRequestsQuery,
    MyWithdrawalRequestsQueryVariables
  >(MyWithdrawalRequestsDocument, options);
}
export function useMyWithdrawalRequestsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyWithdrawalRequestsQuery,
        MyWithdrawalRequestsQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyWithdrawalRequestsQuery,
    MyWithdrawalRequestsQueryVariables
  >(MyWithdrawalRequestsDocument, options);
}
export type MyWithdrawalRequestsQueryHookResult = ReturnType<typeof useMyWithdrawalRequestsQuery>;
export type MyWithdrawalRequestsLazyQueryHookResult = ReturnType<
  typeof useMyWithdrawalRequestsLazyQuery
>;
export type MyWithdrawalRequestsSuspenseQueryHookResult = ReturnType<
  typeof useMyWithdrawalRequestsSuspenseQuery
>;
export type MyWithdrawalRequestsQueryResult = Apollo.QueryResult<
  MyWithdrawalRequestsQuery,
  MyWithdrawalRequestsQueryVariables
>;
export const GetExchangeRateDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetExchangeRate' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currency' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getExchangeRate' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currency' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currency' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetExchangeRateQuery__
 *
 * To run a query within a React component, call `useGetExchangeRateQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetExchangeRateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetExchangeRateQuery({
 *   variables: {
 *      currency: // value for 'currency'
 *   },
 * });
 */
export function useGetExchangeRateQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetExchangeRateQuery,
    GetExchangeRateQueryVariables
  > &
    ({ variables: GetExchangeRateQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetExchangeRateQuery, GetExchangeRateQueryVariables>(
    GetExchangeRateDocument,
    options
  );
}
export function useGetExchangeRateLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetExchangeRateQuery,
    GetExchangeRateQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetExchangeRateQuery, GetExchangeRateQueryVariables>(
    GetExchangeRateDocument,
    options
  );
}
export function useGetExchangeRateSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetExchangeRateQuery, GetExchangeRateQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetExchangeRateQuery, GetExchangeRateQueryVariables>(
    GetExchangeRateDocument,
    options
  );
}
export type GetExchangeRateQueryHookResult = ReturnType<typeof useGetExchangeRateQuery>;
export type GetExchangeRateLazyQueryHookResult = ReturnType<typeof useGetExchangeRateLazyQuery>;
export type GetExchangeRateSuspenseQueryHookResult = ReturnType<
  typeof useGetExchangeRateSuspenseQuery
>;
export type GetExchangeRateQueryResult = Apollo.QueryResult<
  GetExchangeRateQuery,
  GetExchangeRateQueryVariables
>;
export const GetSupportedCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetSupportedCurrencies' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'getSupportedCurrencies' } }],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useGetSupportedCurrenciesQuery__
 *
 * To run a query within a React component, call `useGetSupportedCurrenciesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSupportedCurrenciesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSupportedCurrenciesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSupportedCurrenciesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetSupportedCurrenciesQuery,
    GetSupportedCurrenciesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetSupportedCurrenciesQuery,
    GetSupportedCurrenciesQueryVariables
  >(GetSupportedCurrenciesDocument, options);
}
export function useGetSupportedCurrenciesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetSupportedCurrenciesQuery,
    GetSupportedCurrenciesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetSupportedCurrenciesQuery,
    GetSupportedCurrenciesQueryVariables
  >(GetSupportedCurrenciesDocument, options);
}
export function useGetSupportedCurrenciesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetSupportedCurrenciesQuery,
        GetSupportedCurrenciesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetSupportedCurrenciesQuery,
    GetSupportedCurrenciesQueryVariables
  >(GetSupportedCurrenciesDocument, options);
}
export type GetSupportedCurrenciesQueryHookResult = ReturnType<
  typeof useGetSupportedCurrenciesQuery
>;
export type GetSupportedCurrenciesLazyQueryHookResult = ReturnType<
  typeof useGetSupportedCurrenciesLazyQuery
>;
export type GetSupportedCurrenciesSuspenseQueryHookResult = ReturnType<
  typeof useGetSupportedCurrenciesSuspenseQuery
>;
export type GetSupportedCurrenciesQueryResult = Apollo.QueryResult<
  GetSupportedCurrenciesQuery,
  GetSupportedCurrenciesQueryVariables
>;
export const CreateDepositRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateDepositRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateDepositRequestInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createDepositRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'DepositRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DepositRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'DepositRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'requestedUsdAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expectedCryptoAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'ourDepositAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateDepositRequestMutationFn = Apollo.MutationFunction<
  CreateDepositRequestMutation,
  CreateDepositRequestMutationVariables
>;

/**
 * __useCreateDepositRequestMutation__
 *
 * To run a mutation, you first call `useCreateDepositRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDepositRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDepositRequestMutation, { data, loading, error }] = useCreateDepositRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDepositRequestMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateDepositRequestMutation,
    CreateDepositRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateDepositRequestMutation,
    CreateDepositRequestMutationVariables
  >(CreateDepositRequestDocument, options);
}
export type CreateDepositRequestMutationHookResult = ReturnType<
  typeof useCreateDepositRequestMutation
>;
export type CreateDepositRequestMutationResult =
  Apollo.MutationResult<CreateDepositRequestMutation>;
export type CreateDepositRequestMutationOptions = Apollo.BaseMutationOptions<
  CreateDepositRequestMutation,
  CreateDepositRequestMutationVariables
>;
export const CreateWithdrawalRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateWithdrawalRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateWithdrawalRequestInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createWithdrawalRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WithdrawalRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WithdrawalRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WithdrawalRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'destinationAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'errorMessage' } },
          { kind: 'Field', name: { kind: 'Name', value: 'processedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type CreateWithdrawalRequestMutationFn = Apollo.MutationFunction<
  CreateWithdrawalRequestMutation,
  CreateWithdrawalRequestMutationVariables
>;

/**
 * __useCreateWithdrawalRequestMutation__
 *
 * To run a mutation, you first call `useCreateWithdrawalRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateWithdrawalRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createWithdrawalRequestMutation, { data, loading, error }] = useCreateWithdrawalRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateWithdrawalRequestMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateWithdrawalRequestMutation,
    CreateWithdrawalRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateWithdrawalRequestMutation,
    CreateWithdrawalRequestMutationVariables
  >(CreateWithdrawalRequestDocument, options);
}
export type CreateWithdrawalRequestMutationHookResult = ReturnType<
  typeof useCreateWithdrawalRequestMutation
>;
export type CreateWithdrawalRequestMutationResult =
  Apollo.MutationResult<CreateWithdrawalRequestMutation>;
export type CreateWithdrawalRequestMutationOptions = Apollo.BaseMutationOptions<
  CreateWithdrawalRequestMutation,
  CreateWithdrawalRequestMutationVariables
>;
export const RegisterUserWalletDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RegisterUserWallet' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'RegisterUserWalletInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'registerUserWallet' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserWalletInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserWalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserWallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'walletName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'address' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type RegisterUserWalletMutationFn = Apollo.MutationFunction<
  RegisterUserWalletMutation,
  RegisterUserWalletMutationVariables
>;

/**
 * __useRegisterUserWalletMutation__
 *
 * To run a mutation, you first call `useRegisterUserWalletMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterUserWalletMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerUserWalletMutation, { data, loading, error }] = useRegisterUserWalletMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterUserWalletMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RegisterUserWalletMutation,
    RegisterUserWalletMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    RegisterUserWalletMutation,
    RegisterUserWalletMutationVariables
  >(RegisterUserWalletDocument, options);
}
export type RegisterUserWalletMutationHookResult = ReturnType<typeof useRegisterUserWalletMutation>;
export type RegisterUserWalletMutationResult = Apollo.MutationResult<RegisterUserWalletMutation>;
export type RegisterUserWalletMutationOptions = Apollo.BaseMutationOptions<
  RegisterUserWalletMutation,
  RegisterUserWalletMutationVariables
>;
export const WalletBalanceUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'WalletBalanceUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'walletBalanceUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Wallet' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'salesBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'p2pBalanceUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useWalletBalanceUpdatedSubscription__
 *
 * To run a query within a React component, call `useWalletBalanceUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useWalletBalanceUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWalletBalanceUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useWalletBalanceUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    WalletBalanceUpdatedSubscription,
    WalletBalanceUpdatedSubscriptionVariables
  > &
    ({ variables: WalletBalanceUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    WalletBalanceUpdatedSubscription,
    WalletBalanceUpdatedSubscriptionVariables
  >(WalletBalanceUpdatedDocument, options);
}
export type WalletBalanceUpdatedSubscriptionHookResult = ReturnType<
  typeof useWalletBalanceUpdatedSubscription
>;
export type WalletBalanceUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<WalletBalanceUpdatedSubscription>;
export const WalletTransactionAddedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'WalletTransactionAdded' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'walletTransactionAdded' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletTransactionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletTransactionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WalletTransaction' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentRequestId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useWalletTransactionAddedSubscription__
 *
 * To run a query within a React component, call `useWalletTransactionAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useWalletTransactionAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWalletTransactionAddedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useWalletTransactionAddedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    WalletTransactionAddedSubscription,
    WalletTransactionAddedSubscriptionVariables
  > &
    ({ variables: WalletTransactionAddedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    WalletTransactionAddedSubscription,
    WalletTransactionAddedSubscriptionVariables
  >(WalletTransactionAddedDocument, options);
}
export type WalletTransactionAddedSubscriptionHookResult = ReturnType<
  typeof useWalletTransactionAddedSubscription
>;
export type WalletTransactionAddedSubscriptionResult =
  Apollo.SubscriptionResult<WalletTransactionAddedSubscription>;
export const DepositRequestUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'DepositRequestUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'depositRequestUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'DepositRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DepositRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'DepositRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'requestedUsdAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expectedCryptoAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'ourDepositAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useDepositRequestUpdatedSubscription__
 *
 * To run a query within a React component, call `useDepositRequestUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useDepositRequestUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDepositRequestUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useDepositRequestUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    DepositRequestUpdatedSubscription,
    DepositRequestUpdatedSubscriptionVariables
  > &
    ({ variables: DepositRequestUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    DepositRequestUpdatedSubscription,
    DepositRequestUpdatedSubscriptionVariables
  >(DepositRequestUpdatedDocument, options);
}
export type DepositRequestUpdatedSubscriptionHookResult = ReturnType<
  typeof useDepositRequestUpdatedSubscription
>;
export type DepositRequestUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<DepositRequestUpdatedSubscription>;
export const WithdrawalRequestUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'WithdrawalRequestUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'withdrawalRequestUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WithdrawalRequestInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WithdrawalRequestInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WithdrawalRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'destinationAddress' } },
          { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
          { kind: 'Field', name: { kind: 'Name', value: 'network' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'errorMessage' } },
          { kind: 'Field', name: { kind: 'Name', value: 'processedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useWithdrawalRequestUpdatedSubscription__
 *
 * To run a query within a React component, call `useWithdrawalRequestUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useWithdrawalRequestUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWithdrawalRequestUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useWithdrawalRequestUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    WithdrawalRequestUpdatedSubscription,
    WithdrawalRequestUpdatedSubscriptionVariables
  > &
    (
      | { variables: WithdrawalRequestUpdatedSubscriptionVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    WithdrawalRequestUpdatedSubscription,
    WithdrawalRequestUpdatedSubscriptionVariables
  >(WithdrawalRequestUpdatedDocument, options);
}
export type WithdrawalRequestUpdatedSubscriptionHookResult = ReturnType<
  typeof useWithdrawalRequestUpdatedSubscription
>;
export type WithdrawalRequestUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<WithdrawalRequestUpdatedSubscription>;
export const MyPermissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyPermissions' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myPermissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserPermissionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserPermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserPermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permission' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PermissionInfo' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyPermissionsQuery__
 *
 * To run a query within a React component, call `useMyPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyPermissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyPermissionsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MyPermissionsQuery, MyPermissionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MyPermissionsQuery, MyPermissionsQueryVariables>(
    MyPermissionsDocument,
    options
  );
}
export function useMyPermissionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyPermissionsQuery,
    MyPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MyPermissionsQuery, MyPermissionsQueryVariables>(
    MyPermissionsDocument,
    options
  );
}
export function useMyPermissionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MyPermissionsQuery, MyPermissionsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MyPermissionsQuery, MyPermissionsQueryVariables>(
    MyPermissionsDocument,
    options
  );
}
export type MyPermissionsQueryHookResult = ReturnType<typeof useMyPermissionsQuery>;
export type MyPermissionsLazyQueryHookResult = ReturnType<typeof useMyPermissionsLazyQuery>;
export type MyPermissionsSuspenseQueryHookResult = ReturnType<typeof useMyPermissionsSuspenseQuery>;
export type MyPermissionsQueryResult = Apollo.QueryResult<
  MyPermissionsQuery,
  MyPermissionsQueryVariables
>;
export const AllPermissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AllPermissions' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allPermissions' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PermissionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useAllPermissionsQuery__
 *
 * To run a query within a React component, call `useAllPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllPermissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAllPermissionsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<AllPermissionsQuery, AllPermissionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AllPermissionsQuery, AllPermissionsQueryVariables>(
    AllPermissionsDocument,
    options
  );
}
export function useAllPermissionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AllPermissionsQuery,
    AllPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AllPermissionsQuery, AllPermissionsQueryVariables>(
    AllPermissionsDocument,
    options
  );
}
export function useAllPermissionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<AllPermissionsQuery, AllPermissionsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AllPermissionsQuery, AllPermissionsQueryVariables>(
    AllPermissionsDocument,
    options
  );
}
export type AllPermissionsQueryHookResult = ReturnType<typeof useAllPermissionsQuery>;
export type AllPermissionsLazyQueryHookResult = ReturnType<typeof useAllPermissionsLazyQuery>;
export type AllPermissionsSuspenseQueryHookResult = ReturnType<
  typeof useAllPermissionsSuspenseQuery
>;
export type AllPermissionsQueryResult = Apollo.QueryResult<
  AllPermissionsQuery,
  AllPermissionsQueryVariables
>;
export const UserPermissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserPermissions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userPermissions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserPermissionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserPermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserPermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permission' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PermissionInfo' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useUserPermissionsQuery__
 *
 * To run a query within a React component, call `useUserPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserPermissionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUserPermissionsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    UserPermissionsQuery,
    UserPermissionsQueryVariables
  > &
    ({ variables: UserPermissionsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UserPermissionsQuery, UserPermissionsQueryVariables>(
    UserPermissionsDocument,
    options
  );
}
export function useUserPermissionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UserPermissionsQuery,
    UserPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UserPermissionsQuery, UserPermissionsQueryVariables>(
    UserPermissionsDocument,
    options
  );
}
export function useUserPermissionsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<UserPermissionsQuery, UserPermissionsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UserPermissionsQuery, UserPermissionsQueryVariables>(
    UserPermissionsDocument,
    options
  );
}
export type UserPermissionsQueryHookResult = ReturnType<typeof useUserPermissionsQuery>;
export type UserPermissionsLazyQueryHookResult = ReturnType<typeof useUserPermissionsLazyQuery>;
export type UserPermissionsSuspenseQueryHookResult = ReturnType<
  typeof useUserPermissionsSuspenseQuery
>;
export type UserPermissionsQueryResult = Apollo.QueryResult<
  UserPermissionsQuery,
  UserPermissionsQueryVariables
>;
export const MyWalletTransactionsByBalanceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyWalletTransactionsByBalance' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'balanceType' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'BalanceType' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myWalletTransactionsByBalance' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'balanceType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'balanceType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'after' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletTransactionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletTransactionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WalletTransaction' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentRequestId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useMyWalletTransactionsByBalanceQuery__
 *
 * To run a query within a React component, call `useMyWalletTransactionsByBalanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyWalletTransactionsByBalanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyWalletTransactionsByBalanceQuery({
 *   variables: {
 *      balanceType: // value for 'balanceType'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useMyWalletTransactionsByBalanceQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    MyWalletTransactionsByBalanceQuery,
    MyWalletTransactionsByBalanceQueryVariables
  > &
    ({ variables: MyWalletTransactionsByBalanceQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    MyWalletTransactionsByBalanceQuery,
    MyWalletTransactionsByBalanceQueryVariables
  >(MyWalletTransactionsByBalanceDocument, options);
}
export function useMyWalletTransactionsByBalanceLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MyWalletTransactionsByBalanceQuery,
    MyWalletTransactionsByBalanceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    MyWalletTransactionsByBalanceQuery,
    MyWalletTransactionsByBalanceQueryVariables
  >(MyWalletTransactionsByBalanceDocument, options);
}
export function useMyWalletTransactionsByBalanceSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        MyWalletTransactionsByBalanceQuery,
        MyWalletTransactionsByBalanceQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    MyWalletTransactionsByBalanceQuery,
    MyWalletTransactionsByBalanceQueryVariables
  >(MyWalletTransactionsByBalanceDocument, options);
}
export type MyWalletTransactionsByBalanceQueryHookResult = ReturnType<
  typeof useMyWalletTransactionsByBalanceQuery
>;
export type MyWalletTransactionsByBalanceLazyQueryHookResult = ReturnType<
  typeof useMyWalletTransactionsByBalanceLazyQuery
>;
export type MyWalletTransactionsByBalanceSuspenseQueryHookResult = ReturnType<
  typeof useMyWalletTransactionsByBalanceSuspenseQuery
>;
export type MyWalletTransactionsByBalanceQueryResult = Apollo.QueryResult<
  MyWalletTransactionsByBalanceQuery,
  MyWalletTransactionsByBalanceQueryVariables
>;
export const TransferBalanceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'TransferBalance' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'TransferBalanceInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'transferBalance' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'WalletTransactionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WalletTransactionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WalletTransaction' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentRequestId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'type' } },
          { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type TransferBalanceMutationFn = Apollo.MutationFunction<
  TransferBalanceMutation,
  TransferBalanceMutationVariables
>;

/**
 * __useTransferBalanceMutation__
 *
 * To run a mutation, you first call `useTransferBalanceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTransferBalanceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [transferBalanceMutation, { data, loading, error }] = useTransferBalanceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTransferBalanceMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    TransferBalanceMutation,
    TransferBalanceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<TransferBalanceMutation, TransferBalanceMutationVariables>(
    TransferBalanceDocument,
    options
  );
}
export type TransferBalanceMutationHookResult = ReturnType<typeof useTransferBalanceMutation>;
export type TransferBalanceMutationResult = Apollo.MutationResult<TransferBalanceMutation>;
export type TransferBalanceMutationOptions = Apollo.BaseMutationOptions<
  TransferBalanceMutation,
  TransferBalanceMutationVariables
>;
export const GrantPermissionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'GrantPermission' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'GrantPermissionInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantPermission' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserPermissionInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Permission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserPermissionInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'UserPermission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'userId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'permissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'grantedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'permission' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'PermissionInfo' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grantedByUser' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type GrantPermissionMutationFn = Apollo.MutationFunction<
  GrantPermissionMutation,
  GrantPermissionMutationVariables
>;

/**
 * __useGrantPermissionMutation__
 *
 * To run a mutation, you first call `useGrantPermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGrantPermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [grantPermissionMutation, { data, loading, error }] = useGrantPermissionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGrantPermissionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    GrantPermissionMutation,
    GrantPermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<GrantPermissionMutation, GrantPermissionMutationVariables>(
    GrantPermissionDocument,
    options
  );
}
export type GrantPermissionMutationHookResult = ReturnType<typeof useGrantPermissionMutation>;
export type GrantPermissionMutationResult = Apollo.MutationResult<GrantPermissionMutation>;
export type GrantPermissionMutationOptions = Apollo.BaseMutationOptions<
  GrantPermissionMutation,
  GrantPermissionMutationVariables
>;
export const RevokePermissionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RevokePermission' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'RevokePermissionInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'revokePermission' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;
export type RevokePermissionMutationFn = Apollo.MutationFunction<
  RevokePermissionMutation,
  RevokePermissionMutationVariables
>;

/**
 * __useRevokePermissionMutation__
 *
 * To run a mutation, you first call `useRevokePermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevokePermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revokePermissionMutation, { data, loading, error }] = useRevokePermissionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRevokePermissionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RevokePermissionMutation,
    RevokePermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<RevokePermissionMutation, RevokePermissionMutationVariables>(
    RevokePermissionDocument,
    options
  );
}
export type RevokePermissionMutationHookResult = ReturnType<typeof useRevokePermissionMutation>;
export type RevokePermissionMutationResult = Apollo.MutationResult<RevokePermissionMutation>;
export type RevokePermissionMutationOptions = Apollo.BaseMutationOptions<
  RevokePermissionMutation,
  RevokePermissionMutationVariables
>;
export const NotificationAddedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'NotificationAdded' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notificationAdded' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'referenceId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'actor' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useNotificationAddedSubscription__
 *
 * To run a query within a React component, call `useNotificationAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useNotificationAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationAddedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useNotificationAddedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    NotificationAddedSubscription,
    NotificationAddedSubscriptionVariables
  > &
    ({ variables: NotificationAddedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    NotificationAddedSubscription,
    NotificationAddedSubscriptionVariables
  >(NotificationAddedDocument, options);
}
export type NotificationAddedSubscriptionHookResult = ReturnType<
  typeof useNotificationAddedSubscription
>;
export type NotificationAddedSubscriptionResult =
  Apollo.SubscriptionResult<NotificationAddedSubscription>;
export const NotificationCountUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'NotificationCountUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notificationCountUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useNotificationCountUpdatedSubscription__
 *
 * To run a query within a React component, call `useNotificationCountUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useNotificationCountUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationCountUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useNotificationCountUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    NotificationCountUpdatedSubscription,
    NotificationCountUpdatedSubscriptionVariables
  > &
    (
      | { variables: NotificationCountUpdatedSubscriptionVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    NotificationCountUpdatedSubscription,
    NotificationCountUpdatedSubscriptionVariables
  >(NotificationCountUpdatedDocument, options);
}
export type NotificationCountUpdatedSubscriptionHookResult = ReturnType<
  typeof useNotificationCountUpdatedSubscription
>;
export type NotificationCountUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<NotificationCountUpdatedSubscription>;
export const PostAddedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'PostAdded' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'postAdded' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __usePostAddedSubscription__
 *
 * To run a query within a React component, call `usePostAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePostAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostAddedSubscription({
 *   variables: {
 *   },
 * });
 */
export function usePostAddedSubscription(
  baseOptions?: ApolloReactHooks.SubscriptionHookOptions<
    PostAddedSubscription,
    PostAddedSubscriptionVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<PostAddedSubscription, PostAddedSubscriptionVariables>(
    PostAddedDocument,
    options
  );
}
export type PostAddedSubscriptionHookResult = ReturnType<typeof usePostAddedSubscription>;
export type PostAddedSubscriptionResult = Apollo.SubscriptionResult<PostAddedSubscription>;
export const PostUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'PostUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'postUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __usePostUpdatedSubscription__
 *
 * To run a query within a React component, call `usePostUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePostUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostUpdatedSubscription({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function usePostUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    PostUpdatedSubscription,
    PostUpdatedSubscriptionVariables
  > &
    ({ variables: PostUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    PostUpdatedSubscription,
    PostUpdatedSubscriptionVariables
  >(PostUpdatedDocument, options);
}
export type PostUpdatedSubscriptionHookResult = ReturnType<typeof usePostUpdatedSubscription>;
export type PostUpdatedSubscriptionResult = Apollo.SubscriptionResult<PostUpdatedSubscription>;
export const CommentAddedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'CommentAdded' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'commentAdded' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'post' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useCommentAddedSubscription__
 *
 * To run a query within a React component, call `useCommentAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCommentAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCommentAddedSubscription({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useCommentAddedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    CommentAddedSubscription,
    CommentAddedSubscriptionVariables
  > &
    ({ variables: CommentAddedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    CommentAddedSubscription,
    CommentAddedSubscriptionVariables
  >(CommentAddedDocument, options);
}
export type CommentAddedSubscriptionHookResult = ReturnType<typeof useCommentAddedSubscription>;
export type CommentAddedSubscriptionResult = Apollo.SubscriptionResult<CommentAddedSubscription>;
export const LikeToggledDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'LikeToggled' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'likeToggled' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PostInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PostInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Post' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'content' } },
          { kind: 'Field', name: { kind: 'Name', value: 'visibility' } },
          { kind: 'Field', name: { kind: 'Name', value: 'price' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isProcessing' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'username' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'media' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filename' } },
                { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'thumbnailUrl' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'variants' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 's3Key' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'width' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'height' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileSize' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quality' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'likesCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'commentsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isLikedByCurrentUser' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useLikeToggledSubscription__
 *
 * To run a query within a React component, call `useLikeToggledSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLikeToggledSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLikeToggledSubscription({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useLikeToggledSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    LikeToggledSubscription,
    LikeToggledSubscriptionVariables
  > &
    ({ variables: LikeToggledSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    LikeToggledSubscription,
    LikeToggledSubscriptionVariables
  >(LikeToggledDocument, options);
}
export type LikeToggledSubscriptionHookResult = ReturnType<typeof useLikeToggledSubscription>;
export type LikeToggledSubscriptionResult = Apollo.SubscriptionResult<LikeToggledSubscription>;
export const P2PTradeUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'P2PTradeUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'p2pTradeUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PTradeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PTradeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PTradeRequest' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'buyerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'offerId' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'offer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sellerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'maxAmountUsd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchangeRateMargin' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'instructions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'priority' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'seller' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } },
                    ],
                  },
                },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'amountUsd' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatCurrency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'fiatAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'exchangeRate' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentMethod' } },
          { kind: 'Field', name: { kind: 'Name', value: 'paymentDetails' } },
          { kind: 'Field', name: { kind: 'Name', value: 'escrowAmount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'buyer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'seller' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useP2PTradeUpdatedSubscription__
 *
 * To run a query within a React component, call `useP2PTradeUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useP2PTradeUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useP2PTradeUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useP2PTradeUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    P2PTradeUpdatedSubscription,
    P2PTradeUpdatedSubscriptionVariables
  > &
    ({ variables: P2PTradeUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    P2PTradeUpdatedSubscription,
    P2PTradeUpdatedSubscriptionVariables
  >(P2PTradeUpdatedDocument, options);
}
export type P2PTradeUpdatedSubscriptionHookResult = ReturnType<
  typeof useP2PTradeUpdatedSubscription
>;
export type P2PTradeUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<P2PTradeUpdatedSubscription>;
export const P2PDisputeUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'P2PDisputeUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UUID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'p2pDisputeUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tradeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tradeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'P2PDisputeInfo' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'P2PDisputeInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'P2PDispute' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'tradeId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'initiatorId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'evidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolution' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedBy' } },
          { kind: 'Field', name: { kind: 'Name', value: 'resolvedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'initiator' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'UserInfo' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserInfo' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'User' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'username' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'bio' } },
          { kind: 'Field', name: { kind: 'Name', value: 'profileImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'coverImageId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isVerified' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastLoginAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postsCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
          { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

/**
 * __useP2PDisputeUpdatedSubscription__
 *
 * To run a query within a React component, call `useP2PDisputeUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useP2PDisputeUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useP2PDisputeUpdatedSubscription({
 *   variables: {
 *      tradeId: // value for 'tradeId'
 *   },
 * });
 */
export function useP2PDisputeUpdatedSubscription(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    P2PDisputeUpdatedSubscription,
    P2PDisputeUpdatedSubscriptionVariables
  > &
    ({ variables: P2PDisputeUpdatedSubscriptionVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    P2PDisputeUpdatedSubscription,
    P2PDisputeUpdatedSubscriptionVariables
  >(P2PDisputeUpdatedDocument, options);
}
export type P2PDisputeUpdatedSubscriptionHookResult = ReturnType<
  typeof useP2PDisputeUpdatedSubscription
>;
export type P2PDisputeUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<P2PDisputeUpdatedSubscription>;
