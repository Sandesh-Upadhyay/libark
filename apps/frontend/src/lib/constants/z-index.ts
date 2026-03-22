/**
 * 🎯 Z-Index統一管理システム
 *
 * 全コンポーネントのz-index値を統一管理し、
 * 型安全性とレイアウト階層の一貫性を確保します。
 *
 * 使用例:
 * ```tsx
 * import { Z_INDEX, getZIndexStyle, getZIndexClass } from '@/lib/constants/z-index';
 *
 * // 定数として使用
 * <div style={{ zIndex: Z_INDEX.MODAL }}>
 *
 * // ユーティリティ関数として使用
 * <div style={getZIndexStyle('modal')}>
 * <div className={getZIndexClass('modal')}>
 * ```
 */

/**
 * Z-Index階層定義
 *
 * 階層構造:
 * - 10000+: システムレベル（デバッグ、開発ツール等）
 * - 1000+: アプリケーションレベル（モーダル、サイドバー等）
 * - 100+: ページレベル（ドロップダウン、ツールチップ等）
 * - 10+: コンテンツレベル（カード、オーバーレイ等）
 * - 1+: 基本レベル（基本要素）
 * - 0: デフォルト（auto）
 * - -1: 背景レベル（背景要素）
 */
export const Z_INDEX = {
  // システムレベル（10000+）
  DEBUG: 10000,
  DEV_TOOLS: 9999,

  // アプリケーションレベル（1000+）
  SIDEBAR: 1000,
  SIDEBAR_OVERLAY: 900,
  MODAL: 1200, // サイドバーより前面に表示
  MODAL_OVERLAY: 1150, // Modalオーバーレイ（全体を暗くする）

  // ページレベル（100+）
  DROPDOWN: 500,
  TOOLTIP: 400,
  POPOVER: 350,
  TOAST: 300,

  // ナビゲーションレベル（50+）
  NAVIGATION: 100,
  MOBILE_BOTTOM_NAV: 90,

  // コンテンツレベル（10+）
  STICKY: 50,
  OVERLAY: 40,
  CARD_HOVER: 30,
  CARD: 20,

  // 基本レベル（1+）
  CONTENT: 10,
  BASE: 1,

  // デフォルト・背景レベル
  AUTO: 0,
  BACKGROUND: -1,
} as const;

/**
 * Z-Index階層の型定義
 */
export type ZIndexLevel = keyof typeof Z_INDEX;
export type ZIndexValue = (typeof Z_INDEX)[ZIndexLevel];

/**
 * コンポーネント別Z-Index マッピング
 *
 * 各コンポーネントが使用すべきz-index値を定義
 */
export const COMPONENT_Z_INDEX = {
  // ナビゲーション関連
  Navigation: Z_INDEX.NAVIGATION,
  MobileBottomNavigation: Z_INDEX.MOBILE_BOTTOM_NAV,
  MobileSidebar: Z_INDEX.SIDEBAR,
  MobileSidebarOverlay: Z_INDEX.SIDEBAR_OVERLAY,

  // モーダル・ダイアログ関連
  Dialog: Z_INDEX.MODAL,
  DialogOverlay: Z_INDEX.MODAL_OVERLAY,
  AlertDialog: Z_INDEX.MODAL,
  AlertDialogOverlay: Z_INDEX.MODAL_OVERLAY,
  SimpleImageModal: Z_INDEX.MODAL,
  SimpleImageModalOverlay: Z_INDEX.MODAL_OVERLAY,

  // ドロップダウン・ポップオーバー関連
  DropdownMenu: Z_INDEX.DROPDOWN,
  Popover: Z_INDEX.POPOVER,
  Tooltip: Z_INDEX.TOOLTIP,
  UserMenu: Z_INDEX.DROPDOWN,
  SidebarUserMenu: Z_INDEX.SIDEBAR + 100, // サイドバー内のユーザーメニューは特別に高く設定
  NotificationDropdown: Z_INDEX.DROPDOWN,
  PostVisibilityDropdown: Z_INDEX.DROPDOWN,

  // トースト・通知関連
  Toast: Z_INDEX.TOAST,
  NotificationContainer: Z_INDEX.TOAST,

  // コンテンツ関連
  PostCard: Z_INDEX.CARD,
  PostCardHover: Z_INDEX.CARD_HOVER,
  PostImageContainer: Z_INDEX.CONTENT,
  PostImageDragHandle: Z_INDEX.OVERLAY,

  // オーバーレイ・コントロール関連
  ImageModalControls: Z_INDEX.OVERLAY,
  ImageModalDots: Z_INDEX.CONTENT,
  LoadingOverlay: Z_INDEX.OVERLAY,

  // メインコンテンツ
  MainContent: Z_INDEX.AUTO,
  PageContent: Z_INDEX.AUTO,

  // 背景要素
  BackgroundElement: Z_INDEX.BACKGROUND,
} as const;

/**
 * コンポーネント名の型定義
 */
export type ComponentName = keyof typeof COMPONENT_Z_INDEX;

/**
 * Z-Index値をstyleオブジェクトとして取得
 */
export const getZIndexStyle = (level: ZIndexLevel): { zIndex: number } => ({
  zIndex: Z_INDEX[level],
});

/**
 * コンポーネント名からZ-Index値をstyleオブジェクトとして取得
 */
export const getComponentZIndexStyle = (component: ComponentName): { zIndex: number } => ({
  zIndex: COMPONENT_Z_INDEX[component],
});

/**
 * Z-Index値をTailwindクラス名として取得
 */
export const getZIndexClass = (level: ZIndexLevel): string => {
  const value = Z_INDEX[level];

  // 特別な値のマッピング
  if (value === 0) return 'z-auto';
  if (value < 0) return `z-[-${Math.abs(value)}]`;

  // 標準的なTailwindクラスがある場合
  const standardClasses: Record<number, string> = {
    1: 'z-[1]',
    10: 'z-10',
    20: 'z-20',
    30: 'z-30',
    40: 'z-40',
    50: 'z-50',
    100: 'z-[100]',
    300: 'z-[300]',
    350: 'z-[350]',
    400: 'z-[400]',
    500: 'z-[500]',
    750: 'z-[750]',
    800: 'z-[800]',
    900: 'z-[900]',
    1000: 'z-[1000]',
    1100: 'z-sidebar-user-menu',
    9999: 'z-[9999]',
    10000: 'z-[10000]',
  };

  return standardClasses[value] || `z-[${value}]`;
};

/**
 * コンポーネント名からZ-IndexクラスとしてTailwindクラス名を取得
 */
export const getComponentZIndexClass = (component: ComponentName): string => {
  const value = COMPONENT_Z_INDEX[component];

  // 特別な値のマッピング
  if (value === 0) return 'z-auto';
  if (value < 0) return `z-[-${Math.abs(value)}]`;

  // 標準的なTailwindクラスがある場合
  const standardClasses: Record<number, string> = {
    1: 'z-[1]',
    10: 'z-10',
    20: 'z-20',
    30: 'z-30',
    40: 'z-40',
    50: 'z-50',
    90: 'z-[90]',
    100: 'z-[100]',
    300: 'z-[300]',
    350: 'z-[350]',
    400: 'z-[400]',
    500: 'z-[500]',
    750: 'z-[750]',
    800: 'z-[800]',
    900: 'z-[900]',
    950: 'z-[950]',
    1000: 'z-[1000]',
    1050: 'z-[1050]',
    1100: 'z-sidebar-user-menu',
    1150: 'z-[1150]',
    1200: 'z-[1200]',
  };

  return standardClasses[value] || `z-[${value}]`;
};

/**
 * Z-Index階層の検証
 * 開発時にz-index値の競合をチェック
 */
export const validateZIndexHierarchy = (): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const values = Object.values(Z_INDEX);
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  if (duplicates.length > 0) {
    console.warn('⚠️ Z-Index値の重複が検出されました:', duplicates);
  }

  // 階層の論理的な順序をチェック
  const hierarchyChecks = [
    { name: 'MODAL > SIDEBAR', condition: Z_INDEX.MODAL > Z_INDEX.SIDEBAR },
    { name: 'MODAL > DROPDOWN', condition: Z_INDEX.MODAL > Z_INDEX.DROPDOWN },
    { name: 'DROPDOWN > NAVIGATION', condition: Z_INDEX.DROPDOWN > Z_INDEX.NAVIGATION },
    { name: 'NAVIGATION > CONTENT', condition: Z_INDEX.NAVIGATION > Z_INDEX.CONTENT },
    { name: 'CONTENT > BASE', condition: Z_INDEX.CONTENT > Z_INDEX.BASE },
  ];

  hierarchyChecks.forEach(({ name, condition }) => {
    if (!condition) {
      console.warn(`⚠️ Z-Index階層エラー: ${name}`);
    }
  });
};

/**
 * 開発時のz-index階層表示
 */
export const logZIndexHierarchy = (): void => {
  if (!import.meta.env.DEV) return;

  console.group('🎯 Z-Index階層');
  Object.entries(Z_INDEX)
    .sort(([, a], [, b]) => b - a)
    .forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  console.groupEnd();
};

// 開発時の自動検証
if (import.meta.env.DEV) {
  validateZIndexHierarchy();
}
