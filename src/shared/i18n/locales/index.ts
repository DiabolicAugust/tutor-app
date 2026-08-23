import type { PartialDictionary } from '../dictionary';

import { en, type AppDictionary } from './en';
import { uk } from './uk';

export type { AppDictionary };

/**
 * Adding a language is a three-line change: create `locales/<code>.ts`, add it
 * to `dictionaries`, add its metadata below. Everything else — the typed keys,
 * the switcher UI, persistence, formatting — picks it up automatically.
 */
export const dictionaries = { en, uk } satisfies Record<
  string,
  AppDictionary | PartialDictionary<AppDictionary>
>;

export type AppLocale = keyof typeof dictionaries;

export const defaultLocale: AppLocale = 'en';

export type LocaleMeta = {
  /** BCP 47 tag handed to `Intl` for plurals, dates, numbers and currency. */
  languageTag: string;
  /** Name in the language itself — what a language picker should show. */
  nativeName: string;
  /** Name in English, for admin tooling and support. */
  englishName: string;
  direction: 'ltr' | 'rtl';
};

export const localeMeta: Record<AppLocale, LocaleMeta> = {
  en: {
    languageTag: 'en-US',
    nativeName: 'English',
    englishName: 'English',
    direction: 'ltr',
  },
  uk: {
    languageTag: 'uk-UA',
    nativeName: 'Українська',
    englishName: 'Ukrainian',
    direction: 'ltr',
  },
};

export const appLocales = Object.keys(dictionaries) as AppLocale[];

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && value in dictionaries;
}
