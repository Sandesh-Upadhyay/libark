'use client';

// import type { TabItem } from '@/types'; // 存在しない型のためコメントアウト
interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: unknown;
  badge?: string | number;
  href?: string;
}

// ============================================================================
// TAB UTILITIES
// ============================================================================

/**
 * 型安全なタブ作成ヘルパー
 *
 * 責任:
 * - 型安全なタブ定義の作成
 * - 重複コードの削減
 *
 * @example
 * ```tsx
 * const tabs = createTypedTabs({
 *   posts: { label: '投稿', icon: MessageSquare },
 *   media: { label: 'メディア', icon: Image },
 *   likes: { label: 'いいね', icon: Heart },
 * });
 * ```
 */
export function createTypedTabs<T extends string>(
  tabs: Record<T, Omit<TabItem, 'value'>>
): Array<TabItem & { value: T }> {
  return Object.entries(tabs).map(([value, tab]) => ({
    ...(tab as any),
    value: value as T,
  })) as Array<TabItem & { value: T }>;
}

/**
 * タブの値が有効かどうかをチェック
 */
export function isValidTabValue<T extends string>(
  value: string,
  validValues: readonly T[]
): value is T {
  return validValues.includes(value as T);
}

/**
 * デフォルトタブを取得（無効な場合は最初のタブを返す）
 */
export function getDefaultTab<T extends string>(
  defaultTab: T,
  availableTabs: Array<{ value: T }>,
  fallbackTab?: T
): T {
  const hasDefaultTab = availableTabs.some(tab => tab.value === defaultTab);
  if (hasDefaultTab) {
    return defaultTab;
  }

  if (fallbackTab && availableTabs.some(tab => tab.value === fallbackTab)) {
    return fallbackTab;
  }

  return availableTabs[0]?.value || defaultTab;
}
