'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, ImageOff } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@/components/atoms';

interface PostCreatorImageGridErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface PostCreatorImageGridErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * PostCreatorImageGrid専用のエラー境界
 *
 * 画像グリッドコンポーネントでエラーが発生した場合の
 * フォールバック表示とリカバリ機能を提供
 */
export class PostCreatorImageGridErrorBoundary extends React.Component<
  PostCreatorImageGridErrorBoundaryProps,
  PostCreatorImageGridErrorBoundaryState
> {
  constructor(props: PostCreatorImageGridErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PostCreatorImageGridErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PostCreatorImageGridErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // エラー報告（必要に応じて）
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックコンポーネントが提供されている場合
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // デフォルトのエラー表示
      return (
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='h-5 w-5' />
              画像グリッドエラー
            </CardTitle>
            <CardDescription>画像の表示中にエラーが発生しました</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                {this.state.error?.message || '不明なエラーが発生しました'}
              </AlertDescription>
            </Alert>

            <div className='flex flex-col gap-2'>
              <Button onClick={this.handleRetry} variant='outline' className='w-full'>
                <RefreshCw className='h-4 w-4 mr-2' />
                再試行
              </Button>

              <div className='text-xs text-muted-foreground space-y-1'>
                <p>• 画像ファイルが破損していないか確認してください</p>
                <p>• ページを再読み込みしてください</p>
                <p>• 問題が続く場合は、別の画像をお試しください</p>
              </div>
            </div>

            {/* 開発環境でのデバッグ情報 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4'>
                <summary className='cursor-pointer text-sm font-medium'>
                  デバッグ情報（開発環境のみ）
                </summary>
                <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 画像グリッド用の軽量エラーフォールバック
 */
export const ImageGridFallback: React.FC<{ error?: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <Card className='border-destructive'>
    <CardContent className='pt-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <ImageOff className='h-4 w-4 text-destructive' />
          <span className='text-sm'>画像を読み込めませんでした</span>
        </div>
        <Button onClick={retry} variant='outline' size='sm'>
          <RefreshCw className='h-3 w-3 mr-1' />
          再試行
        </Button>
      </div>
      {error && <p className='text-xs text-muted-foreground mt-2'>エラー: {error.message}</p>}
    </CardContent>
  </Card>
);

/**
 * 画像アイテム用の軽量エラーフォールバック
 */
export const ImageItemFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className='w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square bg-muted rounded-lg flex items-center justify-center'>
    <div className='flex flex-col items-center gap-1'>
      <ImageOff className='h-4 w-4 text-muted-foreground' />
      <span className='text-xs text-muted-foreground' title={error?.message}>
        エラー
      </span>
    </div>
  </div>
);

/**
 * HOC: PostCreatorImageGrid関連コンポーネントをエラー境界で包む
 */
export function withImageGridErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
) {
  const WrappedComponent = React.forwardRef<unknown, unknown>((props, ref) => (
    <PostCreatorImageGridErrorBoundary fallback={fallback}>
      <Component {...(props as any)} ref={ref} />
    </PostCreatorImageGridErrorBoundary>
  ));

  WrappedComponent.displayName = `withImageGridErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * フック: 画像グリッド関連のエラーハンドリング
 */
export function useImageGridErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error: Error) => {
    console.error('Image grid error:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback(
    async (retryFn?: () => Promise<void> | void) => {
      setIsRetrying(true);
      setError(null);

      try {
        if (retryFn) {
          await retryFn();
        }
      } catch (error) {
        handleError(error as Error);
      } finally {
        setIsRetrying(false);
      }
    },
    [handleError]
  );

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
    hasError: !!error,
  };
}
