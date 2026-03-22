import { z } from 'zod';

// IANA タイムゾーン識別子のバリデーション
const timezoneSchema = z.string().refine(
  tz => {
    try {
      // Intl.DateTimeFormat で有効なタイムゾーンかチェック
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  {
    message: '有効なタイムゾーン識別子を指定してください（例: Asia/Tokyo, America/New_York）',
  }
);

// ユーザー設定のベーススキーマ
export const UserSettingsSchema = z.object({
  userId: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  animationsEnabled: z.boolean().default(true),
  locale: z.string().min(1).max(10).default('ja'),
  contentFilter: z.enum(['all', 'following', 'nsfw-safe']).default('all'),
  displayMode: z.enum(['card', 'list']).default('card'),
  timezone: timezoneSchema.default('Asia/Tokyo'),
  updatedAt: z.date(),
});

// ユーザー設定作成用スキーマ（userIdを除外）
export const UserSettingsCreateSchema = UserSettingsSchema.omit({
  userId: true,
  updatedAt: true,
});

// ユーザー設定更新用スキーマ（部分更新対応）
export const UserSettingsUpdateSchema = UserSettingsCreateSchema.partial();

// 個別設定更新用スキーマ（より具体的な型定義）
export const UserSettingUpdateSchema = z.discriminatedUnion('key', [
  z.object({
    key: z.literal('theme'),
    value: z.enum(['light', 'dark', 'system']),
  }),
  z.object({
    key: z.literal('animationsEnabled'),
    value: z.boolean(),
  }),
  z.object({
    key: z.literal('locale'),
    value: z.string().min(1).max(10),
  }),
  z.object({
    key: z.literal('contentFilter'),
    value: z.enum(['all', 'following', 'nsfw-safe']),
  }),
  z.object({
    key: z.literal('displayMode'),
    value: z.enum(['card', 'list']),
  }),
  z.object({
    key: z.literal('timezone'),
    value: timezoneSchema,
  }),
]);

// フロントエンド用の型定義（userIdとupdatedAtを除外）
export const UserSettingsClientSchema = UserSettingsSchema.omit({
  userId: true,
  updatedAt: true,
});

// 型エクスポート
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsCreate = z.infer<typeof UserSettingsCreateSchema>;
export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type UserSettingUpdate = z.infer<typeof UserSettingUpdateSchema>;
export type UserSettingsClient = z.infer<typeof UserSettingsClientSchema>;
