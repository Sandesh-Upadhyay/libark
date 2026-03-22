import { z } from 'zod';

// 列挙型スキーマ
export const ConversationTypeSchema = z.enum(['DIRECT', 'GROUP']);
export const MessageTypeSchema = z.enum(['TEXT', 'IMAGE', 'FILE', 'VIDEO', 'SYSTEM']);
export const ParticipantRoleSchema = z.enum(['MEMBER', 'ADMIN']);

// 会話スキーマ（Prismaスキーマに合わせて更新）
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  type: ConversationTypeSchema,
  title: z.string().max(100).nullable(),
  createdBy: z.string().uuid(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 会話参加者スキーマ
export const ConversationParticipantSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: ParticipantRoleSchema,
  joinedAt: z.date(),
  leftAt: z.date().nullable(),
  isMuted: z.boolean(),
  lastReadAt: z.date().nullable(),
});

// メッセージスキーマ（Prismaスキーマに合わせて更新）
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  type: MessageTypeSchema,
  replyToId: z.string().uuid().nullable(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// メッセージ既読スキーマ
export const MessageReadSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  readAt: z.date(),
});

// メッセージ作成用スキーマ
export const MessageCreateSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  content: z.string().min(1),
  type: MessageTypeSchema.default('TEXT'),
  replyToId: z.string().uuid().optional(),
});

// 会話作成用スキーマ
export const ConversationCreateSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(2),
  title: z.string().max(100).optional(),
  type: ConversationTypeSchema.default('DIRECT'),
  initialMessage: z.string().min(1).optional(),
});

// 会話参加者追加用スキーマ
export const ConversationParticipantCreateSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: ParticipantRoleSchema.default('MEMBER'),
});

// メッセージ既読作成用スキーマ
export const MessageReadCreateSchema = z.object({
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
});

// メッセージ一覧取得用スキーマ
export const MessageListQuerySchema = z.object({
  conversationId: z.string().uuid(),
  first: z.coerce.number().min(1).max(100).default(50),
  after: z.string().optional(), // カーソルベースページネーション用
  includeDeleted: z.boolean().default(false),
});

// 会話一覧取得用スキーマ
export const ConversationListQuerySchema = z.object({
  first: z.coerce.number().min(1).max(100).default(20),
  after: z.string().optional(),
  includeArchived: z.boolean().default(false),
});

// メッセージ既読マーク用スキーマ
export const MarkAsReadSchema = z.object({
  conversationId: z.string().uuid(),
  messageIds: z.array(z.string().uuid()).optional(),
});

// 会話更新用スキーマ
export const ConversationUpdateSchema = z.object({
  conversationId: z.string().uuid(),
  title: z.string().max(100).optional(),
  isArchived: z.boolean().optional(),
});

// 会話ミュート用スキーマ
export const ConversationMuteSchema = z.object({
  conversationId: z.string().uuid(),
  isMuted: z.boolean(),
});

// 型エクスポート
export type ConversationType = z.infer<typeof ConversationTypeSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationParticipant = z.infer<typeof ConversationParticipantSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessageRead = z.infer<typeof MessageReadSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>;
export type ConversationParticipantCreate = z.infer<typeof ConversationParticipantCreateSchema>;
export type MessageReadCreate = z.infer<typeof MessageReadCreateSchema>;
export type MessageListQuery = z.infer<typeof MessageListQuerySchema>;
export type ConversationListQuery = z.infer<typeof ConversationListQuerySchema>;
export type MarkAsRead = z.infer<typeof MarkAsReadSchema>;
export type ConversationUpdate = z.infer<typeof ConversationUpdateSchema>;
export type ConversationMute = z.infer<typeof ConversationMuteSchema>;
