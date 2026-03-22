/**
 * Navigation Features
 *
 * ハイブリッド型ディレクトリ構造（Atomic Design + Feature-based Architecture）
 * 機能固有のナビゲーションコンポーネント
 */

// Mobile Navigation Features
export { MobileBottomNavigation } from './mobile-bottom-navigation';
export { MobileHeader } from './mobile-header';

// Desktop Navigation Features
export { LeftSidebar } from './left-sidebar';
export { RightSidebar } from './right-sidebar';

// Configuration
export { getMobileBottomNavConfig, getLeftSidebarMenuConfig, getUnreadCount } from './config';

// Types
export type { MobileBottomNavigationProps } from './mobile-bottom-navigation';
export type { MobileHeaderProps } from './mobile-header';
export type { LeftSidebarProps } from './left-sidebar';
export type { RightSidebarProps } from './right-sidebar';
export type { NavMenuConfig, UnreadCounts, SidebarUserProfile } from './config';
