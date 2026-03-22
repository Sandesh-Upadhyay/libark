'use client';

import React, { useState, useMemo } from 'react';
import { Check, Clock, Globe, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/atoms';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms';
import { Badge } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { getBrowserTimezone, isValidTimezone } from '@/lib/utils/timezoneUtils';

// タイムゾーン情報の型定義
interface TimezoneInfo {
  value: string;
  label: string;
  region: string;
  offset: string;
}

// 地域のi18nキーマッピング
const REGION_I18N_KEYS: Record<string, string> = {
  Africa: 'timezone.regions.africa',
  America: 'timezone.regions.america',
  Antarctica: 'timezone.regions.antarctica',
  Arctic: 'timezone.regions.arctic',
  Asia: 'timezone.regions.asia',
  Atlantic: 'timezone.regions.atlantic',
  Australia: 'timezone.regions.australia',
  Europe: 'timezone.regions.europe',
  Indian: 'timezone.regions.indian',
  Pacific: 'timezone.regions.pacific',
};

// 主要都市のi18nキーマッピング
const CITY_I18N_KEYS: Record<string, string> = {
  // アジア
  Tokyo: 'timezone.cities.tokyo',
  Seoul: 'timezone.cities.seoul',
  Shanghai: 'timezone.cities.shanghai',
  Hong_Kong: 'timezone.cities.hong_kong',
  Singapore: 'timezone.cities.singapore',
  Bangkok: 'timezone.cities.bangkok',
  Jakarta: 'timezone.cities.jakarta',
  Manila: 'timezone.cities.manila',
  Kolkata: 'timezone.cities.kolkata',
  Mumbai: 'timezone.cities.mumbai',
  Delhi: 'timezone.cities.delhi',

  // オーストラリア・太平洋
  Sydney: 'timezone.cities.sydney',
  Melbourne: 'timezone.cities.melbourne',
  Brisbane: 'timezone.cities.brisbane',
  Perth: 'timezone.cities.perth',
  Auckland: 'timezone.cities.auckland',

  // アメリカ大陸
  New_York: 'timezone.cities.new_york',
  Chicago: 'timezone.cities.chicago',
  Los_Angeles: 'timezone.cities.los_angeles',
  Denver: 'timezone.cities.denver',
  Toronto: 'timezone.cities.toronto',
  Vancouver: 'timezone.cities.vancouver',
  Mexico_City: 'timezone.cities.mexico_city',
  Sao_Paulo: 'timezone.cities.sao_paulo',
  Buenos_Aires: 'timezone.cities.buenos_aires',

  // ヨーロッパ
  London: 'timezone.cities.london',
  Paris: 'timezone.cities.paris',
  Berlin: 'timezone.cities.berlin',
  Rome: 'timezone.cities.rome',
  Madrid: 'timezone.cities.madrid',
  Amsterdam: 'timezone.cities.amsterdam',
  Zurich: 'timezone.cities.zurich',
  Moscow: 'timezone.cities.moscow',
  Stockholm: 'timezone.cities.stockholm',

  // アフリカ
  Cairo: 'timezone.cities.cairo',
  Lagos: 'timezone.cities.lagos',
  Johannesburg: 'timezone.cities.johannesburg',
  Casablanca: 'timezone.cities.casablanca',
};

// 主要タイムゾーンのリスト（優先表示用）
const POPULAR_TIMEZONES = [
  'Asia/Tokyo',
  'America/New_York',
  'Europe/London',
  'America/Los_Angeles',
  'Asia/Shanghai',
  'Europe/Paris',
  'Asia/Seoul',
  'Australia/Sydney',
  'America/Chicago',
  'Europe/Berlin',
];

// すべてのタイムゾーンを取得（i18n対応）
const getAllTimezones = (t: (key: string) => string): TimezoneInfo[] => {
  try {
    // Intl.supportedValuesOf が利用可能な場合
    if ('supportedValuesOf' in Intl) {
      const timezones = Intl.supportedValuesOf('timeZone');
      const result = timezones.map(tz => {
        const parts = tz.split('/');
        const regionKey = parts[0];
        const cityKey = parts[parts.length - 1];

        // 地域名のi18n対応
        const regionKey_i18n = REGION_I18N_KEYS[regionKey] as string | undefined;
        const region = regionKey_i18n ? t(regionKey_i18n) : regionKey;

        // 都市名のi18n対応
        const cityKey_i18n = CITY_I18N_KEYS[cityKey] as string | undefined;
        const city = cityKey_i18n ? t(cityKey_i18n) : cityKey.replace(/_/g, ' ');

        // 現在のオフセットを取得
        const now = new Date();
        const offset =
          new Intl.DateTimeFormat('ja', {
            timeZone: tz,
            timeZoneName: 'shortOffset',
          })
            .formatToParts(now)
            .find(part => part.type === 'timeZoneName')?.value || '';

        return {
          value: tz,
          label: city,
          region,
          offset,
        };
      });

      return result;
    }
  } catch (error) {
    console.warn('Failed to get all timezones:', error);
  }

  // フォールバック: 主要タイムゾーンのみ
  return POPULAR_TIMEZONES.map(tz => {
    const parts = tz.split('/');
    const regionKey = parts[0];
    const cityKey = parts[parts.length - 1];

    // 地域名のi18n対応
    const regionKey_i18n = REGION_I18N_KEYS[regionKey] as string | undefined;
    const region = regionKey_i18n ? t(regionKey_i18n) : regionKey;

    // 都市名のi18n対応
    const cityKey_i18n = CITY_I18N_KEYS[cityKey] as string | undefined;
    const city = cityKey_i18n ? t(cityKey_i18n) : cityKey.replace(/_/g, ' ');

    try {
      const now = new Date();
      const offset =
        new Intl.DateTimeFormat('ja', {
          timeZone: tz,
          timeZoneName: 'shortOffset',
        })
          .formatToParts(now)
          .find(part => part.type === 'timeZoneName')?.value || '';

      return {
        value: tz,
        label: city,
        region,
        offset,
      };
    } catch {
      return {
        value: tz,
        label: city,
        region,
        offset: '',
      };
    }
  });
};

interface TimezoneSelectorProps {
  value: string;
  onValueChange: (timezone: string) => void;
  disabled?: boolean;
  className?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = React.memo(
  ({ value, onValueChange, disabled = false, className }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const { t } = useTranslation();

    // ブラウザのタイムゾーンを取得
    const browserTimezone = getBrowserTimezone();

    // すべてのタイムゾーンを取得（メモ化・i18n対応）
    const allTimezones = useMemo(() => getAllTimezones(t), [t]);

    // 現在選択されているタイムゾーンの情報
    const selectedTimezone = useMemo(() => {
      // valueがundefinedまたは空の場合のフォールバック
      if (!value) {
        return {
          value: 'Asia/Tokyo',
          label: t('timezone.cities.tokyo'),
          region: t('timezone.regions.asia'),
          offset: '+09:00',
        };
      }

      const timezone = allTimezones.find(tz => tz.value === value);
      if (timezone) {
        return timezone;
      }

      // 見つからない場合はカスタムタイムゾーン
      const parts = value.split('/');
      const regionKey = parts[0];
      const cityKey = parts[parts.length - 1];

      // 地域名のi18n対応
      const regionKey_i18n = REGION_I18N_KEYS[regionKey] as string | undefined;
      const region = regionKey_i18n ? t(regionKey_i18n) : regionKey;

      // 都市名のi18n対応
      const cityKey_i18n = CITY_I18N_KEYS[cityKey] as string | undefined;
      const city = cityKey_i18n ? t(cityKey_i18n) : cityKey.replace(/_/g, ' ');

      return {
        value,
        label: city,
        region,
        offset: '',
      };
    }, [value, allTimezones, t]);

    // フィルタリングされたタイムゾーン
    const filteredTimezones = useMemo(() => {
      if (!searchValue) {
        // 検索がない場合は人気のタイムゾーンを優先表示
        const popular = allTimezones.filter(tz => POPULAR_TIMEZONES.includes(tz.value));
        const others = allTimezones.filter(tz => !POPULAR_TIMEZONES.includes(tz.value));
        return [...popular, ...others];
      }

      const search = searchValue.toLowerCase();
      return allTimezones.filter(
        tz =>
          tz.label.toLowerCase().includes(search) ||
          tz.region.toLowerCase().includes(search) ||
          tz.value.toLowerCase().includes(search)
      );
    }, [searchValue, allTimezones]);

    // 地域別にグループ化
    const groupedTimezones = useMemo(() => {
      const groups: Record<string, TimezoneInfo[]> = {};

      filteredTimezones.forEach(tz => {
        if (!groups[tz.region]) {
          groups[tz.region] = [];
        }
        groups[tz.region].push(tz);
      });

      // 各グループ内をソート
      Object.keys(groups).forEach(region => {
        groups[region].sort((a, b) => a.label.localeCompare(b.label));
      });

      return groups;
    }, [filteredTimezones]);

    const handleSelect = React.useCallback(
      (timezone: string) => {
        if (isValidTimezone(timezone)) {
          onValueChange(timezone);
          setOpen(false);
        }
      },
      [onValueChange]
    );

    const handleBrowserTimezone = React.useCallback(() => {
      handleSelect(browserTimezone);
    }, [handleSelect, browserTimezone]);

    return (
      <div className={cn('space-y-2', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open}
              className='w-full justify-between'
              disabled={disabled}
            >
              <div className='flex items-center gap-2'>
                <Globe className='h-4 w-4' />
                <div className='flex flex-col items-start'>
                  <span className='font-medium'>{selectedTimezone.label}</span>
                  <span className='text-xs text-muted-foreground'>
                    {selectedTimezone.region}{' '}
                    {selectedTimezone.offset && `• ${selectedTimezone.offset}`}
                  </span>
                </div>
              </div>
              <Clock className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[500px] p-0' align='start'>
            <Command>
              <CommandInput
                placeholder='タイムゾーンを検索...'
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>タイムゾーンが見つかりません。</CommandEmpty>

                {/* ブラウザのタイムゾーン */}
                {browserTimezone !== value && (
                  <CommandGroup heading='推奨'>
                    <CommandItem
                      value={browserTimezone}
                      onSelect={() => handleBrowserTimezone()}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4' />
                        <div className='flex flex-col'>
                          <span>ブラウザのタイムゾーン</span>
                          <span className='text-xs text-muted-foreground'>{browserTimezone}</span>
                        </div>
                      </div>
                      <Badge variant='secondary' className='text-xs'>
                        自動検出
                      </Badge>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* 地域別タイムゾーン */}
                {Object.entries(groupedTimezones).map(([region, timezones]) => (
                  <CommandGroup key={region} heading={region}>
                    {timezones.map(timezone => (
                      <CommandItem
                        key={timezone.value}
                        value={timezone.value}
                        onSelect={() => handleSelect(timezone.value)}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <div className='flex flex-col'>
                            <span>{timezone.label}</span>
                            <span className='text-xs text-muted-foreground'>
                              {timezone.value} {timezone.offset && `• ${timezone.offset}`}
                            </span>
                          </div>
                        </div>
                        {value === timezone.value && <Check className='h-4 w-4' />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

TimezoneSelector.displayName = 'TimezoneSelector';
