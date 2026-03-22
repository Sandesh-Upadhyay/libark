import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

// i18n設定をインポート
import './i18n/config';

// 開発環境での初期化
if (import.meta.env.DEV) {
  // パフォーマンス監視を開始
  // startPerformanceMonitoring();
  // detectHeavyAnimations();
  // monitorLayoutShifts();

  // 統一ログシステムのデバッグ情報を表示
  console.log('🎯 統一ログシステム初期化完了（最適化版）');
  console.log('💡 ログ設定確認: window.loggerDebug.showConfig()');
  console.log('🔧 カテゴリ切り替え: window.loggerDebug.toggleCategory("APOLLO", false)');
  console.log('📝 環境変数でログ制御可能: VITE_LOG_LEVEL, VITE_LOG_CATEGORIES');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // 🧪 一時的に無効化してMeクエリ実行回数をテスト
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <App />
  </BrowserRouter>
  // </React.StrictMode>
);
