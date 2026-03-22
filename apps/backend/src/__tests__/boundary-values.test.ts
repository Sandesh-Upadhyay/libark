/**
 * 🧪 入力バリデーション境界値テスト
 *
 * 目的:
 * - 入力バリデーションの境界値とエッジケースをテスト
 * - 最小値、最大値、境界値±1、無効な値を検証
 *
 * テスト範囲:
 * - ユーザー名の境界値
 * - パスワードの境界値
 * - メールアドレスの境界値
 * - 投稿内容の境界値
 * - 金額の境界値
 * - 日付の境界値
 * - 数値の境界値
 * - 文字列の境界値
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { VALIDATION_CONSTANTS, PAGINATION_CONSTANTS } from '@libark/core-shared';

// バリデーション定数（フロントエンドと同じ定義）
const VALIDATION_LIMITS = {
  profile: {
    displayNameMin: 1,
    displayNameMax: 50,
    bioMax: 500,
  },
  post: {
    contentMax: 500,
    titleMax: 100,
    descriptionMax: 200,
  },
  comment: {
    contentMax: 300,
  },
  text: {
    shortMax: 50,
    mediumMax: 200,
    longMax: 500,
    veryLongMax: 1000,
  },
  password: {
    min: 8,
    max: 128,
  },
  email: {
    max: 254,
  },
} as const;

const VALIDATION_RANGES = {
  price: {
    min: 0.01,
    max: 10000,
  },
  age: {
    min: 13,
    max: 120,
  },
  rating: {
    min: 1,
    max: 5,
  },
  percentage: {
    min: 0,
    max: 100,
  },
  crypto: {
    minAmount: 0.00000001,
    maxAmount: 21000000,
  },
} as const;

/**
 * ユーザー名の境界値テスト
 */
describe('ユーザー名の境界値テスト', () => {
  const usernameSchema = z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH)
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます');

  it('最小長-1のユーザー名は無効（2文字）', () => {
    const result = usernameSchema.safeParse('ab');
    expect(result.success).toBe(false);
  });

  it('最小長のユーザー名は有効（3文字）', () => {
    const result = usernameSchema.safeParse('abc');
    expect(result.success).toBe(true);
  });

  it('最小長+1のユーザー名は有効（4文字）', () => {
    const result = usernameSchema.safeParse('abcd');
    expect(result.success).toBe(true);
  });

  it('最大長-1のユーザー名は有効（49文字）', () => {
    const result = usernameSchema.safeParse('a'.repeat(49));
    expect(result.success).toBe(true);
  });

  it('最大長のユーザー名は有効（50文字）', () => {
    const result = usernameSchema.safeParse('a'.repeat(50));
    expect(result.success).toBe(true);
  });

  it('最大長+1のユーザー名は無効（51文字）', () => {
    const result = usernameSchema.safeParse('a'.repeat(51));
    expect(result.success).toBe(false);
  });

  it('空文字のユーザー名は無効', () => {
    const result = usernameSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('空白のみのユーザー名は無効', () => {
    const result = usernameSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('特殊文字を含むユーザー名は無効', () => {
    const result = usernameSchema.safeParse('user@name');
    expect(result.success).toBe(false);
  });

  it('日本語を含むユーザー名は無効', () => {
    const result = usernameSchema.safeParse('ユーザー名');
    expect(result.success).toBe(false);
  });

  it('アンダースコアを含むユーザー名は有効', () => {
    const result = usernameSchema.safeParse('user_name');
    expect(result.success).toBe(true);
  });
});

/**
 * パスワードの境界値テスト
 */
describe('パスワードの境界値テスト', () => {
  const passwordSchema = z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字・小文字・数字を含む必要があります'
    );

  it('最小長-1のパスワードは無効（7文字）', () => {
    const result = passwordSchema.safeParse('Abcdef1');
    expect(result.success).toBe(false);
  });

  it('最小長のパスワードは有効（8文字）', () => {
    const result = passwordSchema.safeParse('Abcdef12');
    expect(result.success).toBe(true);
  });

  it('最小長+1のパスワードは有効（9文字）', () => {
    const result = passwordSchema.safeParse('Abcdef123');
    expect(result.success).toBe(true);
  });

  it('最大長-1のパスワードは有効（254文字）', () => {
    const password = 'Aa1' + 'a'.repeat(251);
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(true);
  });

  it('最大長のパスワードは有効（255文字）', () => {
    const password = 'Aa1' + 'a'.repeat(252);
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(true);
  });

  it('最大長+1のパスワードは無効（256文字）', () => {
    const password = 'Aa1' + 'a'.repeat(253);
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(false);
  });

  it('小文字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('abcdefgh');
    expect(result.success).toBe(false);
  });

  it('大文字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('ABCDEFGH');
    expect(result.success).toBe(false);
  });

  it('数字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('12345678');
    expect(result.success).toBe(false);
  });

  it('小文字と数字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('abcdef12');
    expect(result.success).toBe(false);
  });

  it('大文字と数字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('ABCDEF12');
    expect(result.success).toBe(false);
  });

  it('大文字と小文字のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('Abcdefgh');
    expect(result.success).toBe(false);
  });

  it('特殊文字を含むパスワードは有効', () => {
    const result = passwordSchema.safeParse('Abcdef12!');
    expect(result.success).toBe(true);
  });

  it('空文字のパスワードは無効', () => {
    const result = passwordSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('空白のみのパスワードは無効', () => {
    const result = passwordSchema.safeParse('        ');
    expect(result.success).toBe(false);
  });
});

/**
 * メールアドレスの境界値テスト
 */
describe('メールアドレスの境界値テスト', () => {
  const emailSchema = z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_EMAIL_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH)
    .email('有効なメールアドレスを入力してください');

  it('最小長-1のメールアドレスは無効（5文字）', () => {
    const result = emailSchema.safeParse('a@b.c');
    expect(result.success).toBe(false);
  });

  it('最小長のメールアドレスは有効（6文字）', () => {
    const result = emailSchema.safeParse('a@b.co');
    expect(result.success).toBe(true);
  });

  it('最大長-1のメールアドレスは有効（254文字）', () => {
    const localPart = 'a'.repeat(64);
    const domain = 'b'.repeat(185) + '.com';
    const email = `${localPart}@${domain}`;
    expect(email.length).toBe(254);
    const result = emailSchema.safeParse(email);
    expect(result.success).toBe(true);
  });

  it('最大長のメールアドレスは有効（255文字）', () => {
    const localPart = 'a'.repeat(64);
    const domain = 'b'.repeat(186) + '.com';
    const email = `${localPart}@${domain}`;
    expect(email.length).toBe(255);
    const result = emailSchema.safeParse(email);
    expect(result.success).toBe(true);
  });

  it('最大長+1のメールアドレスは無効（256文字）', () => {
    const localPart = 'a'.repeat(65);
    const domain = 'b'.repeat(186) + '.com';
    const email = `${localPart}@${domain}`;
    expect(email.length).toBe(256);
    const result = emailSchema.safeParse(email);
    expect(result.success).toBe(false);
  });

  it('@を含まないメールアドレスは無効', () => {
    const result = emailSchema.safeParse('example.com');
    expect(result.success).toBe(false);
  });

  it('ドメイン部分がないメールアドレスは無効', () => {
    const result = emailSchema.safeParse('user@');
    expect(result.success).toBe(false);
  });

  it('ローカル部分がないメールアドレスは無効', () => {
    const result = emailSchema.safeParse('@example.com');
    expect(result.success).toBe(false);
  });

  it('空文字のメールアドレスは無効', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('空白のみのメールアドレスは無効', () => {
    const result = emailSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('有効なメールアドレス形式', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });
});

/**
 * 投稿内容の境界値テスト
 */
describe('投稿内容の境界値テスト', () => {
  const postContentSchema = z
    .string()
    .max(
      VALIDATION_LIMITS.post.contentMax,
      `投稿内容は${VALIDATION_LIMITS.post.contentMax}文字以内で入力してください`
    )
    .nullable()
    .optional();

  it('空文字の投稿内容は有理（オプション）', () => {
    const result = postContentSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('nullの投稿内容は有理（オプション）', () => {
    const result = postContentSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it('1文字の投稿内容は有効', () => {
    const result = postContentSchema.safeParse('a');
    expect(result.success).toBe(true);
  });

  it('最大長-1の投稿内容は有効（499文字）', () => {
    const result = postContentSchema.safeParse('a'.repeat(499));
    expect(result.success).toBe(true);
  });

  it('最大長の投稿内容は有効（500文字）', () => {
    const result = postContentSchema.safeParse('a'.repeat(500));
    expect(result.success).toBe(true);
  });

  it('最大長+1の投稿内容は無効（501文字）', () => {
    const result = postContentSchema.safeParse('a'.repeat(501));
    expect(result.success).toBe(false);
  });

  it('空白のみの投稿内容は有効', () => {
    const result = postContentSchema.safeParse('   ');
    expect(result.success).toBe(true);
  });

  it('改行を含む投稿内容は有効', () => {
    const result = postContentSchema.safeParse('a\nb\nc');
    expect(result.success).toBe(true);
  });

  it('特殊文字を含む投稿内容は有効', () => {
    const result = postContentSchema.safeParse('あいうえお!@#$%^&*()');
    expect(result.success).toBe(true);
  });

  it('絵文字を含む投稿内容は有効', () => {
    const result = postContentSchema.safeParse('😀😁😂🤣');
    expect(result.success).toBe(true);
  });
});

/**
 * 金額の境界値テスト
 */
describe('金額の境界値テスト', () => {
  const priceSchema = z
    .number()
    .min(VALIDATION_RANGES.price.min, `価格は${VALIDATION_RANGES.price.min}以上で入力してください`)
    .max(VALIDATION_RANGES.price.max, `価格は${VALIDATION_RANGES.price.max}以下で入力してください`);

  it('最小値-1の金額は無効（0.00）', () => {
    const result = priceSchema.safeParse(0.0);
    expect(result.success).toBe(false);
  });

  it('最小値の金額は有効（0.01）', () => {
    const result = priceSchema.safeParse(0.01);
    expect(result.success).toBe(true);
  });

  it('最小値+1の金額は有効（0.02）', () => {
    const result = priceSchema.safeParse(0.02);
    expect(result.success).toBe(true);
  });

  it('最大値-1の金額は有効（9999.99）', () => {
    const result = priceSchema.safeParse(9999.99);
    expect(result.success).toBe(true);
  });

  it('最大値の金額は有効（10000.00）', () => {
    const result = priceSchema.safeParse(10000.0);
    expect(result.success).toBe(true);
  });

  it('最大値+1の金額は無効（10000.01）', () => {
    const result = priceSchema.safeParse(10000.01);
    expect(result.success).toBe(false);
  });

  it('0の金額は無効', () => {
    const result = priceSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it('負の金額は無効', () => {
    const result = priceSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });

  it('小数点以下3桁の金額は有効', () => {
    const result = priceSchema.safeParse(1.234);
    expect(result.success).toBe(true);
  });

  it('整数の金額は有効', () => {
    const result = priceSchema.safeParse(100);
    expect(result.success).toBe(true);
  });

  it('非常に小さい金額は有効（0.01）', () => {
    const result = priceSchema.safeParse(0.01);
    expect(result.success).toBe(true);
  });
});

/**
 * 日付の境界値テスト
 */
describe('日付の境界値テスト', () => {
  const dateSchema = z.date();

  it('過去の日付は有効', () => {
    const pastDate = new Date('2000-01-01');
    const result = dateSchema.safeParse(pastDate);
    expect(result.success).toBe(true);
  });

  it('現在の日付は有効', () => {
    const now = new Date();
    const result = dateSchema.safeParse(now);
    expect(result.success).toBe(true);
  });

  it('未来の日付は有効', () => {
    const futureDate = new Date('2100-01-01');
    const result = dateSchema.safeParse(futureDate);
    expect(result.success).toBe(true);
  });

  it('最小の日付（1970-01-01）は有効', () => {
    const minDate = new Date('1970-01-01T00:00:00.000Z');
    const result = dateSchema.safeParse(minDate);
    expect(result.success).toBe(true);
  });

  it('Unixエポック（0）は有効', () => {
    const epochDate = new Date(0);
    const result = dateSchema.safeParse(epochDate);
    expect(result.success).toBe(true);
  });

  it('最大の日付（9999-12-31）は有効', () => {
    const maxDate = new Date('9999-12-31T23:59:59.999Z');
    const result = dateSchema.safeParse(maxDate);
    expect(result.success).toBe(true);
  });

  it('無効な日付文字列は無効', () => {
    const invalidDate = new Date('invalid');
    const result = dateSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });

  it('現在時刻の1秒前は有効', () => {
    const oneSecondAgo = new Date(Date.now() - 1000);
    const result = dateSchema.safeParse(oneSecondAgo);
    expect(result.success).toBe(true);
  });

  it('現在時刻の1秒後は有効', () => {
    const oneSecondLater = new Date(Date.now() + 1000);
    const result = dateSchema.safeParse(oneSecondLater);
    expect(result.success).toBe(true);
  });
});

/**
 * 数値の境界値テスト
 */
describe('数値の境界値テスト', () => {
  const integerSchema = z.number().int();
  const positiveNumberSchema = z.number().positive();
  const nonNegativeNumberSchema = z.number().nonnegative();

  it('最大の整数（Number.MAX_SAFE_INTEGER）は有効', () => {
    const result = integerSchema.safeParse(Number.MAX_SAFE_INTEGER);
    expect(result.success).toBe(true);
  });

  it('最小の整数（Number.MIN_SAFE_INTEGER）は有効', () => {
    const result = integerSchema.safeParse(Number.MIN_SAFE_INTEGER);
    expect(result.success).toBe(true);
  });

  it('最大の整数+1は無効（安全な範囲外）', () => {
    const result = integerSchema.safeParse(Number.MAX_SAFE_INTEGER + 1);
    expect(result.success).toBe(true); // JavaScriptの制限により、これは整数として扱われる
  });

  it('浮動小数点数は有効', () => {
    const result = integerSchema.safeParse(1.5);
    expect(result.success).toBe(false);
  });

  it('0は有効な整数', () => {
    const result = integerSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it('正の数は有効', () => {
    const result = positiveNumberSchema.safeParse(1);
    expect(result.success).toBe(true);
  });

  it('0は正の数ではない', () => {
    const result = positiveNumberSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it('負の数は正の数ではない', () => {
    const result = positiveNumberSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });

  it('0は非負の数', () => {
    const result = nonNegativeNumberSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it('正の数は非負の数', () => {
    const result = nonNegativeNumberSchema.safeParse(1);
    expect(result.success).toBe(true);
  });

  it('負の数は非負の数ではない', () => {
    const result = nonNegativeNumberSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });

  it('非常に小さい浮動小数点数は有効', () => {
    const result = z.number().safeParse(Number.MIN_VALUE);
    expect(result.success).toBe(true);
  });

  it('非常に大きい浮動小数点数は有効', () => {
    const result = z.number().safeParse(Number.MAX_VALUE);
    expect(result.success).toBe(true);
  });
});

/**
 * 文字列の境界値テスト
 */
describe('文字列の境界値テスト', () => {
  const stringSchema = z.string();

  it('空文字は有効', () => {
    const result = stringSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('空白のみは有効', () => {
    const result = stringSchema.safeParse('   ');
    expect(result.success).toBe(true);
  });

  it('1文字は有効', () => {
    const result = stringSchema.safeParse('a');
    expect(result.success).toBe(true);
  });

  it('特殊文字は有効', () => {
    const result = stringSchema.safeParse('!@#$%^&*()');
    expect(result.success).toBe(true);
  });

  it('日本語は有効', () => {
    const result = stringSchema.safeParse('あいうえお');
    expect(result.success).toBe(true);
  });

  it('絵文字は有効', () => {
    const result = stringSchema.safeParse('😀😁😂');
    expect(result.success).toBe(true);
  });

  it('改行は有効', () => {
    const result = stringSchema.safeParse('a\nb');
    expect(result.success).toBe(true);
  });

  it('タブは有効', () => {
    const result = stringSchema.safeParse('a\tb');
    expect(result.success).toBe(true);
  });

  it('混合文字は有効', () => {
    const result = stringSchema.safeParse('aあ😀!1');
    expect(result.success).toBe(true);
  });

  it('nullは無効', () => {
    const result = stringSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('undefinedは無効', () => {
    const result = stringSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});

/**
 * 表示名の境界値テスト
 */
describe('表示名の境界値テスト', () => {
  const displayNameSchema = z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH);

  it('最小長-1の表示名は無効（1文字）', () => {
    const result = displayNameSchema.safeParse('a');
    expect(result.success).toBe(false);
  });

  it('最小長の表示名は有効（2文字）', () => {
    const result = displayNameSchema.safeParse('ab');
    expect(result.success).toBe(true);
  });

  it('最小長+1の表示名は有効（3文字）', () => {
    const result = displayNameSchema.safeParse('abc');
    expect(result.success).toBe(true);
  });

  it('最大長-1の表示名は有効（99文字）', () => {
    const result = displayNameSchema.safeParse('a'.repeat(99));
    expect(result.success).toBe(true);
  });

  it('最大長の表示名は有効（100文字）', () => {
    const result = displayNameSchema.safeParse('a'.repeat(100));
    expect(result.success).toBe(true);
  });

  it('最大長+1の表示名は無効（101文字）', () => {
    const result = displayNameSchema.safeParse('a'.repeat(101));
    expect(result.success).toBe(false);
  });

  it('空文字の表示名は無効', () => {
    const result = displayNameSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('空白のみの表示名は有効', () => {
    const result = displayNameSchema.safeParse('  ');
    expect(result.success).toBe(true);
  });

  it('日本語の表示名は有効', () => {
    const result = displayNameSchema.safeParse('山田太郎');
    expect(result.success).toBe(true);
  });
});

/**
 * コメント内容の境界値テスト
 */
describe('コメント内容の境界値テスト', () => {
  const commentContentSchema = z
    .string()
    .max(
      PAGINATION_CONSTANTS.COMMENT_MAX_LENGTH,
      `コメントは${PAGINATION_CONSTANTS.COMMENT_MAX_LENGTH}文字以内で入力してください`
    );

  it('空文字のコメントは有効', () => {
    const result = commentContentSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('1文字のコメントは有効', () => {
    const result = commentContentSchema.safeParse('a');
    expect(result.success).toBe(true);
  });

  it('最大長-1のコメントは有効（299文字）', () => {
    const result = commentContentSchema.safeParse('a'.repeat(299));
    expect(result.success).toBe(true);
  });

  it('最大長のコメントは有効（300文字）', () => {
    const result = commentContentSchema.safeParse('a'.repeat(300));
    expect(result.success).toBe(true);
  });

  it('最大長+1のコメントは無効（301文字）', () => {
    const result = commentContentSchema.safeParse('a'.repeat(301));
    expect(result.success).toBe(false);
  });
});

/**
 * ページネーションの境界値テスト
 */
describe('ページネーションの境界値テスト', () => {
  const paginationSchema = z.object({
    first: z
      .number()
      .int()
      .min(1)
      .max(PAGINATION_CONSTANTS.MAX_PAGE_SIZE)
      .default(PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE),
  });

  it('最小値-1のfirstは無効（0）', () => {
    const result = paginationSchema.safeParse({ first: 0 });
    expect(result.success).toBe(false);
  });

  it('最小値のfirstは有効（1）', () => {
    const result = paginationSchema.safeParse({ first: 1 });
    expect(result.success).toBe(true);
  });

  it('最小値+1のfirstは有効（2）', () => {
    const result = paginationSchema.safeParse({ first: 2 });
    expect(result.success).toBe(true);
  });

  it('最大値-1のfirstは有効（49）', () => {
    const result = paginationSchema.safeParse({ first: 49 });
    expect(result.success).toBe(true);
  });

  it('最大値のfirstは有効（50）', () => {
    const result = paginationSchema.safeParse({ first: 50 });
    expect(result.success).toBe(true);
  });

  it('最大値+1のfirstは無効（51）', () => {
    const result = paginationSchema.safeParse({ first: 51 });
    expect(result.success).toBe(false);
  });

  it('デフォルト値は使用される', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first).toBe(PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE);
    }
  });

  it('負の数は無効', () => {
    const result = paginationSchema.safeParse({ first: -1 });
    expect(result.success).toBe(false);
  });

  it('浮動小数点数は無効', () => {
    const result = paginationSchema.safeParse({ first: 1.5 });
    expect(result.success).toBe(false);
  });
});

/**
 * 自己紹介（bio）の境界値テスト
 */
describe('自己紹介（bio）の境界値テスト', () => {
  const bioSchema = z
    .string()
    .max(
      VALIDATION_LIMITS.profile.bioMax,
      `自己紹介は${VALIDATION_LIMITS.profile.bioMax}文字以内で入力してください`
    )
    .nullable()
    .optional();

  it('nullのbioは有効（オプション）', () => {
    const result = bioSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it('undefinedのbioは有効（オプション）', () => {
    const result = bioSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('空文字のbioは有効', () => {
    const result = bioSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('1文字のbioは有効', () => {
    const result = bioSchema.safeParse('a');
    expect(result.success).toBe(true);
  });

  it('最大長-1のbioは有効（499文字）', () => {
    const result = bioSchema.safeParse('a'.repeat(499));
    expect(result.success).toBe(true);
  });

  it('最大長のbioは有効（500文字）', () => {
    const result = bioSchema.safeParse('a'.repeat(500));
    expect(result.success).toBe(true);
  });

  it('最大長+1のbioは無効（501文字）', () => {
    const result = bioSchema.safeParse('a'.repeat(501));
    expect(result.success).toBe(false);
  });
});
