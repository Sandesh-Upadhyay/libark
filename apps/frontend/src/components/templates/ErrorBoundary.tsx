import React from 'react';
import { Link } from 'react-router-dom';

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Reset body styles that might have been set by dialogs
    document.body.style.overflow = 'unset';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error', error, errorInfo);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center'>
          <h1 className='text-xl font-bold'>予期せぬエラーが発生しました</h1>
          <p className='text-sm text-muted-foreground'>
            ページを再読み込みするか、ホームに戻ってください。
          </p>
          <div className='flex gap-3'>
            <button
              onClick={this.handleReload}
              className='px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90'
            >
              再読み込み
            </button>
            <Link to='/home' className='px-4 py-2 rounded-md border hover:bg-muted'>
              ホームへ戻る
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
