import { Page, Locator, expect } from '@playwright/test';

/**
 * 認証ページのPage Object Model
 * ログイン・登録ページの共通操作を提供
 */
export class AuthPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ページが正しく読み込まれているかを確認
   */
  async waitForLoad() {
    // ページの基本的な読み込み完了を待機
    await this.page.waitForLoadState('networkidle');
    // メインコンテンツが表示されるまで待機
    await this.page.locator('body').waitFor({ state: 'visible' });
  }

  /**
   * ページタイトルを確認
   */
  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }
}

/**
 * ログインページのPage Object Model
 */
export class LoginPage extends AuthPage {
  // ログインフォーム要素（ダイアログ内）
  readonly loginDialog: Locator;
  readonly loginForm: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;
  readonly socialLoginButtons: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly switchToRegisterButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginDialog = page.getByTestId('login-dialog');
    this.loginForm = this.loginDialog.getByTestId('login-form');
    this.emailField = this.loginDialog.getByTestId('email-field').locator('input');
    this.passwordField = this.loginDialog.getByTestId('password-field').locator('input');
    this.submitButton = this.loginDialog.getByTestId('login-submit-button');
    this.closeButton = this.loginDialog.getByTestId('close-login-dialog-button');
    this.socialLoginButtons = this.loginDialog
      .locator('button')
      .filter({ hasText: /Google|GitHub/ });
    this.registerLink = this.loginDialog.getByTestId('register-link');
    this.forgotPasswordLink = this.loginDialog.getByTestId('dialog-forgot-password-link');
    this.switchToRegisterButton = this.loginDialog.getByTestId('switch-to-register-button');
  }

  /**
   * ログインページに移動（実際はルートページでログインダイアログを開く）
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
    // data-testidを使用してログインボタンを探してクリック
    const loginButton = this.page.getByTestId('open-login-dialog-button');
    await loginButton.waitFor({ state: 'visible' });
    await loginButton.click();
    // ダイアログが開くまで待機
    await this.loginDialog.waitFor({ state: 'visible' });
  }

  /**
   * ログイン実行
   */
  async login(email: string, password: string) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.submitButton.click();
  }

  /**
   * 登録ページへのリンクをクリック（フォーム内のリンク）
   */
  async goToRegister() {
    await this.registerLink.click();
  }

  /**
   * 登録ダイアログに切り替え（ダイアログ専用ボタン）
   */
  async switchToRegister() {
    await this.switchToRegisterButton.click();
  }

  /**
   * パスワード忘れページへのリンクをクリック
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * フォームエラーの確認
   */
  async verifyFormError(expectedError: string) {
    // FormMessageコンポーネントで表示されるエラーメッセージを確認
    // FormMessageは p要素で id*="form-item-message" を持つ
    const errorMessage = this.page
      .locator('p[id*="form-item-message"]')
      .filter({ hasText: expectedError });
    await expect(errorMessage).toBeVisible();
  }

  /**
   * トーストエラーメッセージを確認
   */
  async verifyToastError(expectedError: string) {
    // Sonnerトーストのエラーメッセージを確認
    const toastMessage = this.page
      .locator('[data-sonner-toast]')
      .filter({ hasText: expectedError });
    await expect(toastMessage).toBeVisible();
  }

  /**
   * ログインボタンのローディング状態を確認
   */
  async verifyLoadingState() {
    await expect(this.submitButton).toBeDisabled();
    await expect(this.submitButton).toContainText('ログイン中');
  }
}

/**
 * 登録ページのPage Object Model
 */
export class RegisterPage extends AuthPage {
  // メインページの要素
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly socialLoginButtons: Locator;

  // 登録ダイアログ要素
  readonly registerDialog: Locator;
  readonly registerForm: Locator;
  readonly usernameField: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly displayNameField: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly closeButton: Locator;
  readonly switchToLoginButton: Locator;

  constructor(page: Page) {
    super(page);
    // メインページの要素（data-testidを使用）
    this.loginButton = page.getByTestId('open-login-dialog-button');
    this.registerButton = page.getByTestId('open-register-dialog-button');
    this.socialLoginButtons = page.locator('button').filter({ hasText: /Google|Apple/ });

    // 登録ダイアログの要素
    this.registerDialog = page.getByTestId('register-dialog');
    this.registerForm = this.registerDialog.getByTestId('register-form');
    this.usernameField = this.registerDialog.getByTestId('username-field').locator('input');
    this.emailField = this.registerDialog.getByTestId('register-email-field').locator('input');
    this.passwordField = this.registerDialog
      .getByTestId('register-password-field')
      .locator('input');
    this.displayNameField = this.registerDialog.getByTestId('display-name-field').locator('input');
    this.submitButton = this.registerDialog.getByTestId('register-submit-button');
    this.loginLink = this.registerDialog.getByTestId('switch-to-login-button');
    this.closeButton = this.registerDialog.getByTestId('close-register-dialog-button');
    this.switchToLoginButton = this.registerDialog.getByTestId('switch-to-login-button');
    this.closeButton = this.registerDialog.getByTestId('close-register-dialog-button');
  }

  /**
   * 登録ページに移動（実際はルートページで登録ダイアログを開く）
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
    // 登録ボタンをクリックしてダイアログを開く
    await this.registerButton.waitFor({ state: 'visible' });
    await this.registerButton.click();
    // 登録ダイアログが開くまで待機
    await this.registerDialog.waitFor({ state: 'visible' });
  }

  /**
   * 登録実行
   */
  async register(username: string, email: string, password: string, displayName?: string) {
    await this.usernameField.fill(username);
    await this.emailField.fill(email);
    await this.passwordField.fill(password);

    if (displayName) {
      await this.displayNameField.fill(displayName);
    }

    await this.submitButton.click();
  }

  /**
   * ログインページへのリンクをクリック
   */
  async goToLogin() {
    await this.loginLink.click();
  }

  /**
   * フォームエラーの確認
   */
  async verifyFormError(fieldName: string, expectedError: string) {
    // RegisterFormのフィールド名に合わせてセレクターを調整
    let testId = fieldName;
    if (fieldName === 'username') {
      testId = 'username-field';
    } else if (fieldName === 'register-email-field') {
      testId = 'register-email-field';
    } else if (fieldName === 'register-password-field') {
      testId = 'register-password-field';
    }

    // FormMessageコンポーネントで表示されるエラーメッセージを確認
    const errorMessage = this.page
      .locator(`[data-testid="${testId}"] p[id*="form-item-message"]`)
      .filter({ hasText: expectedError });
    await expect(errorMessage).toBeVisible();
  }

  /**
   * 登録ボタンのローディング状態を確認
   */
  async verifyLoadingState() {
    await expect(this.submitButton).toBeDisabled();
    await expect(this.submitButton).toContainText('登録中');
  }
}
