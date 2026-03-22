/**
 * E2Eテスト用のテストデータとヘルパー関数
 */

// テスト用ユーザーデータ
export const TEST_USERS = {
  // 既存の有効なユーザー（シードデータと同じ）
  VALID_ADMIN: {
    email: 'admin@libark.io',
    username: 'admin',
    password: 'Password123',
    displayName: '管理者',
  },
  VALID_USER: {
    email: 'tanaka.taro@libark.io',
    username: 'tanaka_dev',
    password: 'Password123',
    displayName: '田中太郎',
  },
  // 新規登録用のユーザー（テスト実行時に動的生成）
  NEW_USER: {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: 'テストユーザー',
  },
  // 無効なユーザーデータ
  INVALID: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
} as const;

// バリデーションエラーのテストケース
export const VALIDATION_TEST_CASES = {
  EMAIL: {
    EMPTY: '',
    INVALID_FORMAT: 'invalid-email',
    TOO_LONG: 'a'.repeat(100) + '@example.com',
  },
  USERNAME: {
    EMPTY: '',
    TOO_SHORT: 'ab',
    TOO_LONG: 'a'.repeat(21),
    INVALID_CHARS: 'user@name',
    SPACES: 'user name',
  },
  PASSWORD: {
    EMPTY: '',
    TOO_SHORT: '1234567',
    NO_UPPERCASE: 'password123!',
    NO_LOWERCASE: 'PASSWORD123!',
    NO_NUMBER: 'Password!',
    NO_SPECIAL: 'Password123',
  },
} as const;

// 期待されるエラーメッセージ
export const EXPECTED_ERRORS = {
  LOGIN: {
    INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
    EMPTY_EMAIL: 'ユーザー名またはメールアドレスを入力してください',
    EMPTY_PASSWORD: 'パスワードを入力してください',
    SHORT_PASSWORD: 'パスワードは8文字以上で入力してください',
  },
  REGISTER: {
    EMPTY_USERNAME: 'ユーザー名を入力してください',
    SHORT_USERNAME: 'ユーザー名は3文字以上で入力してください',
    LONG_USERNAME: 'ユーザー名は20文字以下で入力してください',
    INVALID_USERNAME: 'ユーザー名は英数字とアンダースコアのみ使用できます',
    EMPTY_EMAIL: 'メールアドレスを入力してください',
    INVALID_EMAIL: '有効なメールアドレスを入力してください',
    EMPTY_PASSWORD: 'パスワードを入力してください',
    WEAK_PASSWORD: 'パスワードは8文字以上で、大文字・小文字・数字・記号を含む必要があります',
  },
} as const;

/**
 * ランダムなテストユーザーデータを生成
 */
export function generateTestUser() {
  const timestamp = Date.now().toString().slice(-6); // 最後の6桁のみ使用
  const random = Math.floor(Math.random() * 1000);

  return {
    username: `test${timestamp}${random}`, // 20文字以下に収める
    email: `test_${timestamp}_${random}@example.com`,
    password: 'TestPassword123!',
    displayName: `テストユーザー ${random}`,
  };
}

/**
 * テスト用の無効なメールアドレスを生成
 */
export function generateInvalidEmails() {
  return [
    'invalid-email',
    '@example.com',
    'test@',
    'test..test@example.com',
    'test@example',
    'test@.com',
  ];
}

/**
 * テスト用の無効なユーザー名を生成
 */
export function generateInvalidUsernames() {
  return [
    'ab', // 短すぎる
    'a'.repeat(21), // 長すぎる
    'user@name', // 無効な文字
    'user name', // スペース
    '123user', // 数字で始まる
    'user-name', // ハイフン
  ];
}

/**
 * テスト用の弱いパスワードを生成
 */
export function generateWeakPasswords() {
  return [
    '1234567', // 短すぎる
    'password', // 小文字のみ
    'PASSWORD', // 大文字のみ
    '12345678', // 数字のみ
    'Password', // 記号なし
    'password123', // 大文字なし
    'PASSWORD123', // 小文字なし
    'Password!', // 数字なし
  ];
}

/**
 * ページの読み込み完了を待機
 */
export async function waitForPageLoad(
  page: { waitForLoadState: (state: string, opts?: { timeout: number }) => Promise<unknown> },
  timeout = 10000
) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 認証後のリダイレクトを確認
 */
export async function verifyAuthRedirect(
  page: { waitForURL: (url: string, opts?: { timeout: number }) => Promise<unknown> },
  expectedPath = '/home'
) {
  await page.waitForURL(`**${expectedPath}`, { timeout: 15000 });
}

/**
 * トーストメッセージの確認
 */
export async function verifyToastMessage(
  page: {
    locator: (selector: string) => {
      first: () => { waitFor: (opts: { state: string; timeout: number }) => Promise<unknown> };
    };
  },
  expectedMessage: string
) {
  const toast = page.locator('[data-testid="toast"]').first();
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  await expect(toast).toContainText(expectedMessage);
}

/**
 * フォームのバリデーションエラーを確認
 */
export async function verifyValidationError(
  page: {
    locator: (selector: string) => {
      first: () => { waitFor: (opts: { state: string; timeout: number }) => Promise<unknown> };
    };
  },
  fieldTestId: string,
  expectedError: string
) {
  const errorElement = page.locator(`[data-testid="${fieldTestId}"] [role="alert"]`).first();
  await errorElement.waitFor({ state: 'visible', timeout: 3000 });
  await expect(errorElement).toContainText(expectedError);
}
