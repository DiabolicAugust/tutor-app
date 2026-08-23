import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import { createTranslator } from './dictionary';
import {
  I18nContext,
  LocaleControllerContext,
  type I18nValue,
  type LocaleController,
} from './i18n-context';
import {
  appLocales,
  dictionaries,
  isAppLocale,
  localeMeta,
  type AppDictionary,
  type AppLocale,
} from './locales';
import { en } from './locales/en';
import { useDeviceLocale } from './use-device-locale';

const localeStore = createPersistedValue<AppLocale>(StorageKeys.locale, isAppLocale);

export type I18nProviderProps = {
  children: ReactNode;
  /** Overrides the persisted choice. Useful for tests and screenshot tooling. */
  initialLocale?: AppLocale;
};

/**
 * Owns the active language for the whole app. Mount once, above the router.
 *
 * Switching is a plain state update — no bundle reload, no app restart — because
 * every string is read through `t()` at render time rather than resolved once
 * at startup.
 */
export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [override, setOverride] = useState<AppLocale | null>(
    () => initialLocale ?? localeStore.read(),
  );
  const deviceLocale = useDeviceLocale();
  const locale = override ?? deviceLocale;

  const setLocale = useCallback((next: AppLocale | null) => {
    setOverride(next);
    if (next === null) localeStore.clear();
    else localeStore.write(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const meta = localeMeta[locale];
    return {
      locale,
      languageTag: meta.languageTag,
      direction: meta.direction,
      isRTL: meta.direction === 'rtl',
      // The type argument is pinned to the canonical dictionary: without it TS
      // would infer the key union from whichever partial locale is active.
      t: createTranslator<AppDictionary>(meta.languageTag, dictionaries[locale], en),
    };
  }, [locale]);

  const controller = useMemo<LocaleController>(
    () => ({ locale, override, setLocale, availableLocales: appLocales }),
    [locale, override, setLocale],
  );

  return (
    <LocaleControllerContext.Provider value={controller}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </LocaleControllerContext.Provider>
  );
}
