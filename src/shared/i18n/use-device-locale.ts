import { useLocales } from 'expo-localization';

import { defaultLocale, isAppLocale, type AppLocale } from './locales';

/**
 * The best supported match for the device's language preferences.
 *
 * `useLocales` re-renders when the OS setting changes, so a user who has not
 * picked a language explicitly follows their device live.
 */
export function useDeviceLocale(): AppLocale {
  const locales = useLocales();

  for (const locale of locales) {
    if (isAppLocale(locale.languageCode)) return locale.languageCode;
    const base = locale.languageTag.split('-')[0];
    if (isAppLocale(base)) return base;
  }

  return defaultLocale;
}
