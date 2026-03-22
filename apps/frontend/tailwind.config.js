/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
  ],
  theme: {
    // レスポンシブブレークポイントの最適化（モバイルファースト）
    screens: {
      xs: '475px', // 小型スマートフォン対応
      sm: '640px', // スマートフォン（縦向き）
      md: '768px', // タブレット（縦向き）
      lg: '1024px', // タブレット（横向き）・小型ノートPC
      xl: '1280px', // デスクトップ
      '2xl': '1536px', // 大型デスクトップ
      // 注意：タッチデバイス検出ブレークポイントを削除
      // 'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      // 'hover': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // セマンティックカラーの追加
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // カスタムアスペクト比の追加
      aspectRatio: {
        inherit: 'inherit',
        '16/9': '16 / 9',
        '4/3': '4 / 3',
        '1/1': '1 / 1',
      },
      // 最小サイズの標準化
      minWidth: {
        6: '1.5rem', // 24px
        8: '2rem', // 32px
        10: '2.5rem', // 40px
        35: '8.75rem', // 140px
      },
      minHeight: {
        6: '1.5rem', // 24px
        8: '2rem', // 32px
        10: '2.5rem', // 40px
      },
      // z-index階層管理の統一（統一管理システムに基づく）
      zIndex: {
        // アプリケーションレベル
        sidebar: '1000', // MobileSidebar
        'sidebar-user-menu': '1100', // SidebarUserMenu
        'sidebar-overlay': '900', // MobileSidebarオーバーレイ
        modal: '1200', // Dialog/Modal（サイドバーより前面に表示）
        'modal-overlay': '1150', // Modalオーバーレイ（全体を暗くする）

        // ページレベル
        dropdown: '500', // DropdownMenu
        tooltip: '400', // Tooltip
        popover: '350', // Popover
        toast: '300', // Toast通知

        // ナビゲーションレベル
        navigation: '100', // NavigationBar
        'mobile-bottom-nav': '90', // MobileBottomNavigation

        // コンテンツレベル
        sticky: '50', // Sticky要素
        overlay: '40', // ImageModal controls等
        'card-hover': '30', // カードホバー
        card: '20', // PostCard等
        content: '10', // 基本コンテンツ
        base: '1', // 基本要素
      },
      // レスポンシブフォントサイズ（標準的な設定）
      fontSize: {
        'xs-mobile': '0.875rem', // モバイル用小サイズ
        'sm-mobile': '1rem', // モバイル用標準サイズ
        'base-mobile': '1.125rem', // モバイル用大サイズ
        'lg-mobile': '1.25rem', // モバイル用特大サイズ
      },
      // レスポンシブスペーシング
      spacing: {
        'touch-target': '44px', // モバイルタッチターゲット最小サイズ
        'button-sm': '32px', // 小さなボタンの最小高さ
        'button-md': '40px', // 中サイズボタンの高さ
        'button-lg': '48px', // 大きなボタンの高さ
      },
      // カスタムグラデーション（LandingPage用）
      backgroundImage: {
        'landing-hero':
          'linear-gradient(to bottom right, rgb(251 207 232), rgb(255 255 255), rgb(255 228 230))',
        'landing-hero-dark':
          'linear-gradient(to bottom right, rgb(2 6 23), rgb(15 23 42), rgb(76 5 25))',
        'landing-text-primary':
          'linear-gradient(to right, rgb(15 23 42), rgb(157 23 77), rgb(190 24 93))',
        'landing-text-primary-dark':
          'linear-gradient(to right, rgb(255 255 255), rgb(251 207 232), rgb(254 205 211))',
        'landing-text-accent': 'linear-gradient(to right, rgb(219 39 119), rgb(225 29 72))',
        'landing-button-primary': 'linear-gradient(to right, rgb(219 39 119), rgb(225 29 72))',
        'landing-button-primary-hover': 'linear-gradient(to right, rgb(190 24 93), rgb(190 18 60))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
