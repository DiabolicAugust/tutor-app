import { localeMeta, useLocaleController, useT, type AppLocale } from '@/shared/i18n';

import { SegmentedControl } from './segmented-control';

/** `system` stands for "follow the device language" (a `null` override). */
type LanguageValue = AppLocale | 'system';

/**
 * Language picker. Selecting a language re-renders the app in it immediately —
 * no reload — because every string is resolved through `t()` at render time.
 */
export function LanguageSwitcher() {
  const { t } = useT();
  const { override, setLocale, availableLocales } = useLocaleController();

  const options = [
    { value: 'system' as const, label: t('settings.language.system') },
    ...availableLocales.map((locale) => ({
      value: locale,
      label: localeMeta[locale].nativeName,
    })),
  ];

  return (
    <SegmentedControl<LanguageValue>
      options={options}
      value={override ?? 'system'}
      onChange={(value) => setLocale(value === 'system' ? null : value)}
      accessibilityLabel={t('settings.language.title')}
    />
  );
}
