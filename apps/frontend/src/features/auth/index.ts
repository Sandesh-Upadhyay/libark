/**
 * 🔐 認証機能 - Feature-based Architecture
 *
 * 認証関連のUIコンポーネントとフォームロジックを統合管理
 * 型定義は @libark/graphql-client から直接使用
 */

// 認証コンポーネント（Organism レベル）
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { AuthPageLayout } from './AuthPageLayout';

// 認証コンポーネント（統合）
export * from './components';

// 認証フック
export { useLogin } from './useLogin';
export { useRegister } from './useRegister';

// 統一認証フック
export { useAuthForm } from './hooks/useAuthForm';

// バリデーション
export * from './validations';

// 統一ユーティリティ
export * from './utils/authErrorHandler';

// 統一型定義
export * from './types/authForm';
