import { useContext } from 'react';

import { I18nContext, LocaleControllerContext, type I18nValue, type LocaleController } from './i18n-context';

/**
 * The translator plus locale metadata.
 *
 * @example
 * const { t } = useT();
 * <Text>{t('lessons.count', { count: lessons.length })}</Text>
 */
export function useT(): I18nValue {
  return useContext(I18nContext);
}

/** Read/write access to the language preference, for settings screens. */
export function useLocaleController(): LocaleController {
  const controller = useContext(LocaleControllerContext);
  if (!controller) {
    throw new Error('useLocaleController must be used inside <I18nProvider>.');
  }
  return controller;
}
