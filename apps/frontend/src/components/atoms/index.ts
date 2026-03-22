/**
 * Atoms - 基本的なUI要素
 *
 * 最小単位のコンポーネント群
 * 他のatomsに依存せず、単独で機能する
 */

// UI基本コンポーネント（Radix UI + Tailwind）
export { Button, buttonVariants, type ButtonProps } from './button';

// ActionButtonは削除済み - 直接Button atomを使用
export { Input, type InputProps } from './input';
export { Label, labelVariants } from './label';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Skeleton } from './skeleton';

// 設定専用コンポーネント - features/settings/components/atoms/ に移行済み
export { LoadingSpinner, BrandLoading } from './loading';

// Toast機能は削除済み - Sonnerライブラリを使用

// Avatar関連コンポーネント（BaseAvatarに統一）

// 基本的な機能コンポーネント
export { Icon } from './icon';

// IconText は削除済み（未使用）
export { Logo, type LogoProps } from './logo';
// ThemeToggle削除済み - UserMenuに統合
// LanguageSwitcher削除済み - UserMenuに統合

// CloseButtonは削除済み - 直接Button atomを使用

export { CountBadge, type CountBadgeProps } from './count-badge';
// NotificationDot, NotificationIcon は features/notifications/components/atoms/ に移行済み

// 統一ドロップダウンコンポーネントは削除されました
// アトミックデザインの原則に従い、Moleculeレベルで実装してください

// 統計情報表示コンポーネント
export { StatsCard, statsCardVariants, type StatsCardProps } from './stats-card';

// 統一されたレイアウトコンポーネント
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
// Heading削除済み - 直接HTMLタグを使用
// PageHeader削除済み - ModernPageHeaderを使用
// NavigationItem削除済み - 直接Radix UI + Tailwindを使用
// Container削除済み - 直接Tailwindクラスを使用
// Flex削除済み - 直接Tailwindクラスを使用
// Grid削除済み - 直接Tailwindクラスを使用
// NavItemLayout削除済み - 直接Radix UI + Tailwindを使用

export { ModernPageHeader, type ModernPageHeaderProps } from './modern-page-header';

// ユーザー関連アトミックコンポーネント（BaseAvatarは削除済み - UserAvatarを直接使用）
export { UserText, userTextVariants, type UserTextProps } from './user-text';

// Motionコンポーネント
export { Motion } from './motion';

// PostCreator専用Atoms - features/posts/components/atoms/ に移行済み
// CharacterCounter は削除済み（未使用）
// ErrorAlert, PostVisibilitySelector, MenuButton は features/posts/components/atoms/ に移行済み

// 展開ボタンコンポーネント
export {
  ExpandButton,
  TextExpandButton,
  PaginationExpandButton,
  type ExpandButtonProps,
} from './expand-button';

// メディア関連アトミックコンポーネント
export { MediaThumbnail, type MediaThumbnailProps } from './media-thumbnail';
export { ImageDisplay } from './image-display';

// フッター専用コンポーネント

export { SocialLink } from './social-link';

// 汎用リスト関連コンポーネント - features/notifications/components/atoms/ に移行済み

// 型定義（重複削除済み）
// TextPropsは削除済み - 直接Tailwindクラスを使用
// HeadingPropsは削除済み - 直接HTMLタグを使用
// PageHeaderProps削除済み - ModernPageHeaderPropsを使用
// NavigationItemProps削除済み - 直接Radix UI + Tailwindを使用
// ContainerPropsは削除済み - 直接Tailwindクラスを使用
// FlexPropsは削除済み - 直接Tailwindクラスを使用
// GridPropsは削除済み - 直接Tailwindクラスを使用
export type { BaseMotionProps, InteractiveMotionProps } from './motion';

// PostCreator専用Atoms型定義 - features/posts/components/atoms/ に移行済み
// CharacterCounter は削除済み（未使用）
// ErrorAlert, PostVisibilitySelector, MenuButton は features/posts/components/atoms/ に移行済み

// Wallet Atoms - features/wallet/components/atoms/ に移行済み

// QRCode Component
export { QRCode, type QRCodeProps } from './qr-code';

// UI基盤コンポーネント（Radix UI + Tailwind）
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
// React Hook Form統合フォームコンポーネント
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './form-shadcn';

// 統一FormFieldコンポーネント
export { UnifiedFormField, type UnifiedFormFieldProps } from './form-unified';

// レガシーフォームコンポーネント削除済み - UnifiedFormFieldに統合完了
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Progress } from './progress';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Separator } from './separator';
export { Toaster } from './sonner';
export { Switch } from './switch';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
// Radix UI Tabs (標準的なタブ - 必要に応じて使用)
export { Tabs, TabsList, TabsTrigger } from './tabs';

// 新しいTab構造 (推奨)
export { TabNavigation, TabContent } from './tabs/index';
export type { TabItem, TabNavigationProps, TabContentProps } from './tabs/index';
export { Textarea } from './textarea';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// モバイル・レスポンシブコンポーネント
export {
  // MobileCard削除済み
  MobileSection,
  MobileListItem,
  // mobileCardVariants削除済み
  mobileSectionVariants,
  mobileListItemVariants,
  mobileLayoutUtils,
} from './mobile-layout';

// 画像モーダル
export { SimpleImageModal } from './simple-image-modal';
