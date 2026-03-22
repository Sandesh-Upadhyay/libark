import React from 'react';

interface FlagIconProps {
  className?: string;
  size?: number;
}

/**
 * 日本国旗アイコン（丸型・モダン）
 */
export const JapanFlag: React.FC<FlagIconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' className={className}>
    <circle cx='12' cy='12' r='11' fill='#ffffff' stroke='#e5e7eb' strokeWidth='1' />
    <circle cx='12' cy='12' r='4' fill='#dc2626' />
  </svg>
);

/**
 * アメリカ国旗アイコン（丸型・モダン）
 */
export const USAFlag: React.FC<FlagIconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' className={className}>
    <circle cx='12' cy='12' r='11' fill='#ffffff' stroke='#e5e7eb' strokeWidth='1' />

    {/* 赤い縞模様 */}
    <path
      d='M12 1C18.075 1 23 5.925 23 12s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1z'
      fill='url(#usaStripes)'
    />

    {/* 青い四角（星の背景） */}
    <rect x='1' y='1' width='9' height='8' fill='#1e40af' rx='1' />

    {/* 星（簡略化） */}
    <g fill='#ffffff'>
      <circle cx='3' cy='3' r='0.5' />
      <circle cx='5' cy='3' r='0.5' />
      <circle cx='7' cy='3' r='0.5' />
      <circle cx='4' cy='5' r='0.5' />
      <circle cx='6' cy='5' r='0.5' />
      <circle cx='3' cy='7' r='0.5' />
      <circle cx='5' cy='7' r='0.5' />
      <circle cx='7' cy='7' r='0.5' />
    </g>

    <defs>
      <pattern id='usaStripes' patternUnits='userSpaceOnUse' width='24' height='2'>
        <rect width='24' height='1' fill='#dc2626' />
        <rect y='1' width='24' height='1' fill='#ffffff' />
      </pattern>
    </defs>
  </svg>
);

/**
 * イギリス国旗アイコン（丸型・モダン）
 */
export const UKFlag: React.FC<FlagIconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' className={className}>
    <circle cx='12' cy='12' r='11' fill='#1e40af' stroke='#e5e7eb' strokeWidth='1' />

    {/* 白い十字 */}
    <rect x='10.5' y='1' width='3' height='22' fill='#ffffff' />
    <rect x='1' y='10.5' width='22' height='3' fill='#ffffff' />

    {/* 赤い十字 */}
    <rect x='11' y='1' width='2' height='22' fill='#dc2626' />
    <rect x='1' y='11' width='22' height='2' fill='#dc2626' />

    {/* 対角線（簡略化） */}
    <path d='M1 1 L23 23 M23 1 L1 23' stroke='#ffffff' strokeWidth='2' />
    <path d='M1 1 L23 23 M23 1 L1 23' stroke='#dc2626' strokeWidth='1' />
  </svg>
);

/**
 * 汎用言語アイコン（多言語対応時のフォールバック）
 */
export const GenericLanguageFlag: React.FC<FlagIconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' className={className}>
    <circle cx='12' cy='12' r='11' fill='#f3f4f6' stroke='#e5e7eb' strokeWidth='1' />
    <path d='M8 8h8v2H8V8zm0 3h8v2H8v-2zm0 3h6v2H8v-2z' fill='#6b7280' />
  </svg>
);

/**
 * 国旗アイコンマップ
 */
export const FLAG_ICONS = {
  ja: JapanFlag,
  en: USAFlag,
  uk: UKFlag,
  default: GenericLanguageFlag,
} as const;

/**
 * 言語コードから適切な国旗アイコンを取得
 */
export const getFlagIcon = (locale: string): React.FC<FlagIconProps> => {
  return FLAG_ICONS[locale as keyof typeof FLAG_ICONS] || FLAG_ICONS.default;
};
