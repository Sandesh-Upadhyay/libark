import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }),
    tsconfigPaths(),
  ],

  // シンプルなビルド設定
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // ファイル名にタイムスタンプを追加してキャッシュを強制的に無効化
        entryFileNames: `[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `[name]-[hash]-${Date.now()}.[ext]`,
      },
    },
    // メモリ使用量最適化
    chunkSizeWarningLimit: 1000,
  },

  // シンプルなエイリアス設定
  resolve: {
    // ブラウザ環境を強制するための条件設定
    conditions: ['browser', 'module', 'import', 'default'],
    // パッケージ解決の優先順位（ブラウザ版を最優先）
    mainFields: ['browser', 'module', 'main'],
    // モノレポパッケージの依存関係をルートnode_modulesから解決
    dedupe: ['@apollo/client', 'apollo3-cache-persist', 'graphql', 'react', 'react-dom', 'zustand'],
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types'),
      '@/i18n': resolve(__dirname, './src/i18n'),
      '@/messages': resolve(__dirname, './src/messages'),
      '@/src': resolve(__dirname, './src'),

      // モノレポパッケージのソースファイルを直接参照（ホットリロード対応）
      '@libark/core-shared': resolve(__dirname, '../../packages/core-shared/src'),
      '@libark/core-client': resolve(__dirname, '../../packages/core-client/src'),
      '@libark/db': resolve(__dirname, '../../packages/db/src'),
      '@libark/graphql-client': resolve(__dirname, '../../packages/graphql-client/src'),
      '@libark/media': resolve(__dirname, '../../packages/media/src'),

      // Node.jsモジュールのブラウザ互換実装
      crypto: 'crypto-browserify',
      buffer: 'buffer',
    },
  },

  // シンプルな環境変数設定
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis',

    // GraphQL URL設定（本番環境対応）
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'https://libark.io' : 'http://localhost'
    ),
    'import.meta.env.VITE_GRAPHQL_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://libark.io/graphql'
        : 'http://localhost/graphql'
    ),

    // 後方互換性のためのNEXT_PUBLIC_*環境変数
    'process.env.NEXT_PUBLIC_BACKEND_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'https://libark.io' : 'http://localhost'
    ),
    'process.env.NEXT_PUBLIC_GRAPHQL_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://libark.io/graphql'
        : 'http://localhost/graphql'
    ),
    'process.env.NEXT_PUBLIC_FRONTEND_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'https://libark.io' : 'http://localhost'
    ),
    'process.env.NEXT_PUBLIC_MEDIA_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'https://libark.io' : 'http://localhost'
    ),
    'process.env.NEXT_PUBLIC_S3_GATEWAY_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? 'https://libark.io' : 'http://localhost'
    ),
  },

  // シンプルな依存関係最適化設定
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@apollo/client',
      'apollo3-cache-persist',
      'crypto-browserify',
      'buffer',
    ],
    exclude: ['fs', 'path', 'os', 'qrcode', 'bcrypt'],
  },

  // シンプルな開発サーバー設定
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Docker内部ネットワークからのリクエストを許可
    allowedHosts: ['localhost', 'frontend', 'nginx', '127.0.0.1'],
    proxy: {
      '/graphql': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
      '/upload': {
        target: 'http://s3-gateway:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
