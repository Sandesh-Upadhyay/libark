'use client';

import React, { useState } from 'react';
import { useUserSettings } from '@libark/graphql-client';
import { Loader2 } from 'lucide-react';

import { Switch } from '@/components/atoms';
import { cn } from '@/lib/utils';

type AnimationToggleProps = {
  className?: string;
};

export function AnimationToggle({ className }: AnimationToggleProps) {
  const { settings, updateSettings } = useUserSettings(); // クエリをスキップして重複実行を防止
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    try {
      // ストアを更新し、APIを通じてDBにも保存
      await updateSettings({ animationsEnabled: checked });
    } catch (error) {
      console.error('Failed to save animation setting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {isSaving && <Loader2 size={16} className='animate-spin text-muted-foreground' />}
      <Switch
        id='animation-toggle'
        checked={settings.animationsEnabled}
        onCheckedChange={handleToggle}
        disabled={isSaving}
        aria-label={
          settings.animationsEnabled ? 'アニメーションを無効にする' : 'アニメーションを有効にする'
        }
      />
    </div>
  );
}
