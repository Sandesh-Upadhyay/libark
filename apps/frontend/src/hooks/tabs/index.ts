// ============================================================================
// TAB HOOKS EXPORTS
// ============================================================================

export { default as useTabs } from './useTabs';
export { default as useTabFiltering } from './useTabFiltering';
export { createTypedTabs, isValidTabValue, getDefaultTab } from './utils';

// Re-export types for convenience
export type { UseTabsOptions, UseTabsReturn, TabFilterOptions } from '@/types';
