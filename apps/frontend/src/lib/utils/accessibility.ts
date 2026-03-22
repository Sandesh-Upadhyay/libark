/**
 * 🎯 Accessibility Utilities - アクセシビリティ関連のユーティリティ
 *
 * 責任:
 * - フォーカス管理
 * - ARIA属性の適切な使用
 * - アクセシビリティ警告の回避
 *
 * 特徴:
 * - WAI-ARIA準拠
 * - フォーカストラップ
 * - 適切なaria-hidden使用
 */

/**
 * フォーカス可能な要素のセレクター
 */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * 要素内のフォーカス可能な要素を取得
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
}

/**
 * 要素にフォーカス可能な子要素があるかチェック
 */
export function hasFocusableChildren(element: HTMLElement): boolean {
  return getFocusableElements(element).length > 0;
}

/**
 * aria-hiddenを安全に設定（フォーカス可能な要素がある場合は警告）
 */
export function setSafeAriaHidden(element: HTMLElement, hidden: boolean): void {
  if (hidden && hasFocusableChildren(element)) {
    console.warn(
      'aria-hidden="true"をフォーカス可能な要素を含む要素に設定しようとしています。',
      'inert属性の使用を検討してください。',
      element
    );

    // inert属性が利用可能な場合は使用
    if ('inert' in element) {
      (element as any).inert = hidden;
    } else {
      (element as any).setAttribute('aria-hidden', hidden.toString());
    }
  } else {
    element.setAttribute('aria-hidden', hidden.toString());
  }
}

/**
 * 要素を非表示にする（アクセシビリティ対応）
 */
export function hideFromAssistiveTech(element: HTMLElement): void {
  setSafeAriaHidden(element, true);
}

/**
 * 要素を表示する（アクセシビリティ対応）
 */
export function showToAssistiveTech(element: HTMLElement): void {
  element.removeAttribute('aria-hidden');
  if ('inert' in element) {
    (element as any).inert = false;
  }
}

/**
 * フォーカストラップの作成
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return {
    activate: () => {
      firstElement?.focus();
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeyDown);
    },
  };
}

/**
 * ライブリージョンの作成
 */
export function createLiveRegion(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): HTMLElement {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // 短時間後に削除
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);

  return liveRegion;
}
