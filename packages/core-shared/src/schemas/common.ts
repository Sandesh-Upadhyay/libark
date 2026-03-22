import { z } from 'zod';

// 共通のページネーションスキーマ（従来型）
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// 無限クエリ用のカーソルベースページネーションスキーマ
export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(), // カーソル（通常は最後のアイテムのID）
  limit: z.coerce.number().min(1).max(100).default(20),
});

// 共通のソートスキーマ
export const SortSchema = z.object({
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 共通のフィルタースキーマ
export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// API レスポンス用スキーマ
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// ページネーション付きレスポンススキーマ（従来型）
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// 無限クエリ用のカーソルベースレスポンススキーマ
export const CursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      nextCursor: z.string().nullable(), // 次のページのカーソル
      hasNextPage: z.boolean(),
    }),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// エラーレスポンススキーマ
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.union([
    z.string(),
    z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
  ]),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

// 成功レスポンススキーマ
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

// 型エクスポート
export type Pagination = z.infer<typeof PaginationSchema>;
export type CursorPagination = z.infer<typeof CursorPaginationSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
export type PaginatedResponse<T> = {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
  message?: string;
};
export type CursorPaginatedResponse<T> = {
  success: boolean;
  data: {
    items: T[];
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  error?: string;
  message?: string;
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};
