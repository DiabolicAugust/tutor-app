import { createContext } from 'react';

import { createTranslator, type Translate } from './dictionary';
import { defaultLocale, localeMeta, type AppDictionary, type AppLocale } from './locales';
import { en } from './locales/en';

export type I18nValue = {
  locale: AppLocale;
  /** BCP 47 tag for `Intl` APIs. */
  languageTag: string;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  t: Translate<AppDictionary>;
};

/**
 * Same split as the theme: the value context changes on every language switch,
 * the controller context only carries the setter and the current selection.
 */
export const I18nContext = createContext<I18nValue>({
  locale: defaultLocale,
  languageTag: localeMeta[defaultLocale].languageTag,
  direction: 'ltr',
  isRTL: false,
  t: createTranslator(localeMeta[defaultLocale].languageTag, en, en),
});

export type LocaleController = {
  /** The language actually in effect. */
  locale: AppLocale;
  /** The user's explicit choice, or `null` when following the device. */
  override: AppLocale | null;
  /** Pass `null` to go back to following the device language. */
  setLocale: (locale: AppLocale | null) => void;
  availableLocales: readonly AppLocale[];
};

export const LocaleControllerContext = createContext<LocaleController | null>(null);
