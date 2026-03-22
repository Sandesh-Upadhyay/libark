'use client';

import React, { useState } from 'react';
import { Clock, Info, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useUserSettings } from '@libark/graphql-client';


import { SectionShell } from '@/components/molecules';
import { Button, Alert, AlertDescription } from '@/components/atoms';
import { getBrowserTimezone, getCurrentTimeInTimezone } from '@/lib/utils/timezoneUtils';

import { TimezoneErrorBoundary, useTimezoneErrorHandler } from './TimezoneErrorBoundary';
import { TimezoneSelector } from './TimezoneSelector';

export const TimezoneSettings: React.FC = React.memo(() => {
  const { settings, isLoading: loading, changeTimezone } = useUserSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const { handleError } = useTimezoneErrorHandler();

  const browserTimezone = getBrowserTimezone();
  const currentTimezone = (settings as any).timezone;

  const handleTimezoneChange = React.useCallback(
    async (newTimezone: string) => {
      if (newTimezone === currentTimezone) return;

      setIsUpdating(true);
      try {
        await changeTimezone(newTimezone);

        toast.success('タイムゾーンを更新しました', {
          description: `タイムゾーンが ${newTimezone} に変更されました。`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('タイムゾーン更新エラー:', error);

        handleError(error as Error);

        toast.error('エラーが発生しました', {
          description: `タイムゾーンの更新に失敗しました: ${errorMessage}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [currentTimezone, changeTimezone, handleError]
  );

  const handleResetToBrowser = React.useCallback(async () => {
    if (browserTimezone === currentTimezone) return;

    await handleTimezoneChange(browserTimezone);
  }, [browserTimezone, currentTimezone, handleTimezoneChange]);

  // 現在時刻の比較表示
  const timeComparison = React.useMemo(() => {
    try {
      const currentTime = getCurrentTimeInTimezone(currentTimezone);
      const browserTime = getCurrentTimeInTimezone(browserTimezone);

      const currentTimeStr = currentTime.toLocaleString('ja-JP', {
        timeZone: currentTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const browserTimeStr = browserTime.toLocaleString('ja-JP', {
        timeZone: browserTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        current: currentTimeStr,
        browser: browserTimeStr,
        isDifferent: currentTimezone !== browserTimezone,
      };
    } catch {
      return {
        current: '取得できません',
        browser: '取得できません',
        isDifferent: false,
      };
    }
  }, [currentTimezone, browserTimezone]);

  if (loading) {
    return (
      <SectionShell
        title='タイムゾーン設定'
        description='時間表示のタイムゾーンを設定します'
        icon={Clock}
        variant='settings'
      >
        <div className='animate-pulse space-y-4'>
          <div className='h-12 bg-muted rounded-md'></div>
          <div className='h-4 bg-muted rounded-md w-3/4'></div>
        </div>
      </SectionShell>
    );
  }

  return (
    <TimezoneErrorBoundary>
      <SectionShell
        title='タイムゾーン'
        description='時間表示のタイムゾーンを設定'
        icon={Clock}
        variant='settings'
      >
        {/* タイムゾーン選択 */}
        <TimezoneSelector
          value={currentTimezone}
          onValueChange={handleTimezoneChange}
          disabled={isUpdating}
        />

        {/* ブラウザタイムゾーンとの差異警告 */}
        {timeComparison.isDifferent && (
          <Alert className='mt-4'>
            <Info className='h-4 w-4' />
            <AlertDescription className='flex items-center justify-between'>
              <span className='text-sm'>ブラウザ設定と異なります（{browserTimezone}）</span>
              <Button
                variant='outline'
                size='sm'
                onClick={handleResetToBrowser}
                disabled={isUpdating}
              >
                <RotateCcw className='h-3 w-3 mr-1' />
                自動設定
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </SectionShell>
    </TimezoneErrorBoundary>
  );
});

TimezoneSettings.displayName = 'TimezoneSettings';
