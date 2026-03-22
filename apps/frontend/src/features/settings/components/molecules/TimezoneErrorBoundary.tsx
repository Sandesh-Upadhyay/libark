'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

interface TimezoneErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface TimezoneErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * タイムゾーン関連コンポーネント用のエラー境界
 *
 * タイムゾーン設定やフォーマット処理でエラーが発生した場合の
 * フォールバック表示とリカバリ機能を提供
 */
export class TimezoneErrorBoundary extends React.Component<
  TimezoneErrorBoundaryProps,
  TimezoneErrorBoundaryState
> {
  constructor(props: TimezoneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TimezoneErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TimezoneErrorBoundary caught an error:', error, errorInfo);

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
              タイムゾーン設定エラー
            </CardTitle>
            <CardDescription>タイムゾーン設定の読み込み中にエラーが発生しました</CardDescription>
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
                <p>• ページを再読み込みしてください</p>
                <p>• 問題が続く場合は、ブラウザのタイムゾーン設定を確認してください</p>
                <p>• それでも解決しない場合は、サポートにお問い合わせください</p>
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
 * タイムゾーン設定用の軽量エラーフォールバック
 */
export const TimezoneSettingsFallback: React.FC<{ error?: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <Card className='border-destructive'>
    <CardContent className='pt-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-destructive' />
          <span className='text-sm'>タイムゾーン設定を読み込めませんでした</span>
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
 * タイムゾーン表示用の軽量エラーフォールバック
 */
export const TimezoneDisplayFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <span className='text-muted-foreground text-sm' title={error?.message}>
    時間表示エラー
  </span>
);

/**
 * HOC: タイムゾーン関連コンポーネントをエラー境界で包む
 */
export function withTimezoneErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
) {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => (
    <TimezoneErrorBoundary fallback={fallback}>
      <Component {...(props as any)} ref={ref} />
    </TimezoneErrorBoundary>
  ));

  WrappedComponent.displayName = `withTimezoneErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * フック: タイムゾーン関連のエラーハンドリング
 */
export function useTimezoneErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error: Error) => {
    console.error('Timezone error:', error);
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
