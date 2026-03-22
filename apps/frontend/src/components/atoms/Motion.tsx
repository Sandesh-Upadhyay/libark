'use client';

/**
 * Motion - 統一されたアニメーションコンポーネント
 *
 * Framer Motionのラッパーコンポーネント
 * プリセットアニメーションを簡単に使用可能
 *
 * パフォーマンス最適化:
 * - useMemo/useCallbackによるメモ化
 * - useReducedMotion対応
 * - GPU加速の活用
 * - 不要な再レンダリングの防止
 */

import React, { useMemo } from 'react';
import {
  motion,
  type HTMLMotionProps,
  type Variants,
  type TargetAndTransition,
  useReducedMotion,
} from 'framer-motion';

import { presets, type PresetName, transitions } from '@/lib/motion-presets';

// 基本的なMotionコンポーネントのProps
interface BaseMotionProps {
  preset?: PresetName;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

// Motion.div用のProps
interface MotionDivProps
  extends
    BaseMotionProps,
    Omit<
      HTMLMotionProps<'div'>,
      'variants' | 'initial' | 'animate' | 'exit' | 'children' | 'whileHover' | 'whileTap'
    > {}

// Motion.span用のProps
interface MotionSpanProps
  extends
    BaseMotionProps,
    Omit<
      HTMLMotionProps<'span'>,
      'variants' | 'initial' | 'animate' | 'exit' | 'children' | 'whileHover' | 'whileTap'
    > {}

// Motion.section用のProps
interface MotionSectionProps
  extends
    BaseMotionProps,
    Omit<
      HTMLMotionProps<'section'>,
      'variants' | 'initial' | 'animate' | 'exit' | 'children' | 'whileHover' | 'whileTap'
    > {}

// Motion.article用のProps
interface MotionArticleProps
  extends
    BaseMotionProps,
    Omit<
      HTMLMotionProps<'article'>,
      'variants' | 'initial' | 'animate' | 'exit' | 'children' | 'whileHover' | 'whileTap'
    > {}

// 基本的なMotionコンポーネント作成関数（パフォーマンス最適化版）
function createMotionComponent<T extends keyof React.JSX.IntrinsicElements>(element: T) {
  const MotionComponent = React.memo(
    React.forwardRef<
      HTMLElement,
      BaseMotionProps & Omit<React.ComponentProps<T>, 'variants' | 'initial' | 'animate' | 'exit'>
    >((props, ref) => {
      const {
        preset = 'fade',
        delay = 0,
        className,
        children,
        ...restProps
      } = props as BaseMotionProps & React.ComponentProps<T>;
      const MotionElement = motion[element as keyof typeof motion] as React.ComponentType<
        Record<string, unknown>
      >;
      const shouldReduceMotion = useReducedMotion();

      // variantsのメモ化
      const variants = useMemo(() => presets[preset as keyof typeof presets] as Variants, [preset]);

      // delayが指定されている場合、variantsを動的に調整（メモ化）
      const adjustedVariants = useMemo(() => {
        if (delay <= 0) return variants;

        const visibleVariant = variants.visible;
        const transition =
          typeof visibleVariant === 'object' &&
          visibleVariant !== null &&
          'transition' in visibleVariant
            ? (visibleVariant as { transition?: Record<string, unknown> }).transition
            : {};

        return {
          ...variants,
          visible: {
            ...variants.visible,
            transition: {
              ...transition,
              delay,
            },
          },
        };
      }, [variants, delay]);

      // reduced-motion対応のvariantsを作成
      const finalVariants = useMemo(() => {
        if (!shouldReduceMotion) return adjustedVariants;

        // reduced-motionの場合、アニメーションを無効化
        return {
          hidden: { opacity: 1 },
          visible: { opacity: 1 },
          exit: { opacity: 1 },
        };
      }, [adjustedVariants, shouldReduceMotion]);

      return (
        <MotionElement
          ref={ref}
          className={className}
          variants={finalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          layout={false}
          {...restProps}
        >
          {children}
        </MotionElement>
      );
    })
  );

  MotionComponent.displayName = `Motion${element}`;
  return MotionComponent;
}

// 各要素用のMotionコンポーネント
const MotionDiv = createMotionComponent('div');
const MotionSpan = createMotionComponent('span');
const MotionSection = createMotionComponent('section');
const MotionArticle = createMotionComponent('article');
const MotionHeader = createMotionComponent('header');
const MotionFooter = createMotionComponent('footer');
const MotionNav = createMotionComponent('nav');
const MotionMain = createMotionComponent('main');
const MotionAside = createMotionComponent('aside');

// スタガーコンテナ用の特別なコンポーネント
interface StaggerContainerProps extends BaseMotionProps {
  staggerDelay?: number;
  childrenDelay?: number;
}

const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ staggerDelay = 0.1, childrenDelay = 0.1, className, children, ...props }, ref) => {
    const staggerVariants: Variants = {
      hidden: {
        opacity: 0,
      },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: childrenDelay,
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

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={staggerVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerContainer.displayName = 'StaggerContainer';

// スタガーアイテム用のコンポーネント
const StaggerItem = React.forwardRef<HTMLDivElement, BaseMotionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div ref={ref} className={className} variants={presets.stagger.item} {...props}>
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = 'StaggerItem';

// インタラクティブなMotionコンポーネント
interface InteractiveMotionProps extends BaseMotionProps {
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  _whileHover?: TargetAndTransition;
  _whileTap?: TargetAndTransition;
  enableHover?: boolean;
  enableTap?: boolean;
}

const InteractiveMotion = React.forwardRef<HTMLDivElement, InteractiveMotionProps>(
  (
    {
      preset = 'fade',
      delay = 0,
      className,
      children,
      _whileHover,
      _whileTap,
      enableHover = true,
      enableTap = true,
      ...props
    },
    ref
  ) => {
    const variants = presets[preset as keyof typeof presets] as Variants;

    const adjustedVariants =
      delay > 0
        ? {
            ...variants,
            visible: {
              ...variants.visible,
              transition: {
                ...(typeof variants.visible === 'object' &&
                variants.visible !== null &&
                'transition' in variants.visible
                  ? (variants.visible as { transition?: Record<string, unknown> }).transition
                  : {}),
                delay,
              },
            },
          }
        : variants;

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={adjustedVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        whileHover={enableHover ? { scale: 1.02, transition: transitions.fast } : undefined}
        whileTap={enableTap ? { scale: 0.98, transition: transitions.fast } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

InteractiveMotion.displayName = 'InteractiveMotion';

// Motionコンポーネントの集約
export const Motion = {
  div: MotionDiv,
  span: MotionSpan,
  section: MotionSection,
  article: MotionArticle,
  header: MotionHeader,
  footer: MotionFooter,
  nav: MotionNav,
  main: MotionMain,
  aside: MotionAside,
  StaggerContainer,
  StaggerItem,
  Interactive: InteractiveMotion,
};

// 型定義のエクスポート
export type {
  BaseMotionProps,
  MotionDivProps,
  MotionSpanProps,
  MotionSectionProps,
  MotionArticleProps,
  StaggerContainerProps,
  InteractiveMotionProps,
};
