import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Sun, Moon, Laptop, Languages } from 'lucide-react';
import { useUserSettings } from '@libark/graphql-client';
import { toast } from 'sonner';

import { TimezoneSettings } from '@/features/settings/components/molecules/TimezoneSettings';
import { JapanFlag, USAFlag } from '@/features/settings/components/atoms/FlagIcons';
import { Header, SectionShell } from '@/components/molecules';
import {
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/atoms';

/**
 * 🎯 表示設定ページ (統一デザイン・モダン版)
 *
 * 責任:
 * - テーマ設定の管理
 * - 言語設定の管理
 * - 表示オプションの管理
 * - 統一されたデザインシステムの適用
 */

const DisplaySettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    settings,
    changeTheme,
    changeLocale,
    toggleAnimations,
    isDarkMode,
    isSystemTheme,
    currentLocale,
    animationsEnabled,
  } = useUserSettings();

  // テーマ変更処理
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    changeTheme(newTheme);
    toast.success(
      t('settings.display.theme.changeSuccess', {
        default: `テーマを${
          newTheme === 'light' ? 'ライト' : newTheme === 'dark' ? 'ダーク' : 'システム'
        }に変更しました`,
      })
    );
  };

  // 言語変更処理
  const handleLanguageChange = (newLanguage: string) => {
    changeLocale(newLanguage as 'ja' | 'en');
    toast.success(
      newLanguage === 'ja' ? '言語を日本語に変更しました' : 'Language changed to English'
    );
  };

  // アニメーション設定変更
  const handleAnimationToggle = () => {
    toggleAnimations();
    toast.success(
      animationsEnabled
        ? t('settings.display.animations.disabled', { default: 'アニメーションを無効にしました' })
        : t('settings.display.animations.enabled', { default: 'アニメーションを有効にしました' })
    );
  };

  return (
    <div>
      {/* ページヘッダー - Xスタイル */}
      <Header title='表示設定' variant='x-style' headingLevel='h2' showBorder={true} />

      {/* テーマ設定セクション */}
      <SectionShell
        title='テーマ設定'
        description='アプリの外観テーマを選択できます'
        icon={Sun}
        variant='settings'
      >
        <RadioGroup value={settings.theme} onValueChange={handleThemeChange}>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors'>
              <RadioGroupItem value='light' id='light' />
              <Label htmlFor='light' className='flex items-center gap-2 cursor-pointer flex-1'>
                <Sun className='w-4 h-4' />
                ライト
              </Label>
            </div>
            <div className='flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors'>
              <RadioGroupItem value='dark' id='dark' />
              <Label htmlFor='dark' className='flex items-center gap-2 cursor-pointer flex-1'>
                <Moon className='w-4 h-4' />
                ダーク
              </Label>
            </div>
            <div className='flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors'>
              <RadioGroupItem value='system' id='system' />
              <Label htmlFor='system' className='flex items-center gap-2 cursor-pointer flex-1'>
                <Laptop className='w-4 h-4' />
                システム
              </Label>
            </div>
          </div>
        </RadioGroup>

        {/* 現在のテーマ状態表示 */}
        <div className='flex items-center justify-between p-3 bg-muted/50 rounded-md'>
          <div className='flex items-center gap-2'>
            {isDarkMode ? <Moon className='w-4 h-4' /> : <Sun className='w-4 h-4' />}
            <span className='text-sm font-medium'>現在のテーマ:</span>
            <span className='text-sm'>{isDarkMode ? 'ダーク' : 'ライト'}</span>
          </div>
          {isSystemTheme && (
            <span className='text-xs bg-primary/10 text-primary px-2 py-1 rounded'>
              システム設定
            </span>
          )}
        </div>
      </SectionShell>

      {/* 言語設定セクション */}
      <SectionShell
        title='言語設定'
        description='アプリの表示言語を変更できます'
        icon={Languages}
        variant='settings'
      >
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <Label className='text-sm font-medium'>表示言語</Label>
            <p className='text-xs text-muted-foreground'>アプリ全体の表示言語を選択</p>
          </div>
          <Select value={currentLocale} onValueChange={handleLanguageChange}>
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ja'>
                <div className='flex items-center gap-2'>
                  <JapanFlag size={16} />
                  日本語
                </div>
              </SelectItem>
              <SelectItem value='en'>
                <div className='flex items-center gap-2'>
                  <USAFlag size={16} />
                  English
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionShell>

      {/* アニメーション設定セクション */}
      <SectionShell
        title='アニメーション設定'
        description='アプリのアニメーション効果を制御できます'
        icon={Zap}
        variant='settings'
      >
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <Label className='text-sm font-medium'>アニメーションを有効にする</Label>
            <p className='text-xs text-muted-foreground'>
              ページ遷移やUI要素のアニメーション効果を有効にします
            </p>
          </div>
          <Switch checked={animationsEnabled} onCheckedChange={handleAnimationToggle} />
        </div>
      </SectionShell>

      {/* タイムゾーン設定セクション */}
      <TimezoneSettings />
    </div>
  );
};

export default DisplaySettingsPage;
