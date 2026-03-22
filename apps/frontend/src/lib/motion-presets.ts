/**
 * LIBARK Motion Presets
 *
 * Framer Motionを使用した再利用可能なアニメーションプリセット
 * 統一されたアニメーション体験を提供
 */

import { type Variants, type Transition } from 'framer-motion';

// 基本的なトランジション設定
export const transitions = {
  // 高速アニメーション（100ms - INP最適化）
  fast: {
    type: 'tween',
    duration: 0.1, // 150ms → 100ms に短縮
    ease: [0.4, 0, 1, 1], // ease-in
  } as Transition,

  // 標準アニメーション（150ms - INP最適化）
  normal: {
    type: 'tween',
    duration: 0.15, // 200ms → 150ms に短縮
    ease: [0.4, 0, 0.2, 1], // ease-in-out
  } as Transition,

  // 緩やかなアニメーション（250ms - INP最適化）
  slow: {
    type: 'tween',
    duration: 0.25, // 300ms → 250ms に短縮
    ease: [0, 0, 0.2, 1], // ease-out
  } as Transition,

  // スプリングアニメーション（高速化）
  spring: {
    type: 'spring',
    stiffness: 400, // 300 → 400 に高速化
    damping: 35, // 30 → 35 に調整
  } as Transition,

  // バウンスアニメーション
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  } as Transition,
} as const;

// フェードアニメーション
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

// スライドアニメーション（上から）
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.fast,
  },
};

// スライドアニメーション（下から）
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: transitions.fast,
  },
};

// スライドアニメーション（左から）
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transitions.fast,
  },
};

// スライドアニメーション（右から）
export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.fast,
  },
};

// スケールアニメーション
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

// バウンスイン
export const bounceInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    transition: transitions.fast,
  },
};

// ローテーション
export const rotateVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    rotate: 10,
    transition: transitions.fast,
  },
};

// リストアイテム用のスタガーアニメーション
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.fast,
  },
};

// ホバーエフェクト
export const hoverScale = {
  scale: 1.05,
  transition: transitions.fast,
};

export const hoverLift = {
  y: -2,
  transition: transitions.fast,
};

// タップエフェクト
export const tapScale = {
  scale: 0.95,
  transition: transitions.fast,
};

// プリセット組み合わせ
export const presets = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
  scale: scaleVariants,
  bounceIn: bounceInVariants,
  rotate: rotateVariants,
  stagger: {
    container: staggerContainer,
    item: staggerItem,
  },
} as const;

// プリセット名の型定義
export type PresetName = keyof typeof presets;
export type StaggerPreset = 'container' | 'item';
