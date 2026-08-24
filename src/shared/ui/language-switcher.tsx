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
    {
      value: 'system' as const,
      // Abbreviated on purpose: this segment sits next to language names in a
      // narrow column. The full wording is what screen readers announce.
      label: t('settings.language.systemShort'),
      accessibilityLabel: t('settings.language.system'),
    },
    ...availableLocales.map((locale) => ({
      value: locale,
      label: localeMeta[locale].nativeName,
    })),
  ];

  return (
    <SegmentedControl<LanguageValue>
      testID="settings-language"
      options={options}
      value={override ?? 'system'}
      onChange={(value) => setLocale(value === 'system' ? null : value)}
      accessibilityLabel={t('settings.language.title')}
    />
  );
}
