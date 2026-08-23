import type { AppDictionary, TranslationKey } from '@/shared/i18n';
import { icons, type IconName } from '@/shared/ui';

/** Route name inside `app/(app)/(tabs)/`. */
export type TabKey = 'index' | 'students' | 'news' | 'more';

export type TabDefinition = {
  key: TabKey;
  /** Path the web bar navigates to. */
  href: '/' | '/students' | '/news' | '/more';
  labelKey: TranslationKey<AppDictionary>;
  icon: IconName;
  /**
   * Tabs that may never be hidden.
   *
   * `more` is the way back to settings, so hiding it would lock the user out of
   * the screen that could restore it. The constraint lives in the data rather
   * than in the settings UI, so every consumer respects it.
   */
  alwaysVisible?: boolean;
};

/**
 * Every tab the app has, in its default order.
 *
 * Adding a tab: add a route under `(tabs)/`, add an entry here. Both tab bars
 * and the settings screen are driven by this list.
 */
export const tabDefinitions: readonly TabDefinition[] = [
  { key: 'index', href: '/', labelKey: 'tabs.calendar', icon: icons.today },
  // Second, next to the calendar: the two are read together — a lesson leads to
  // a student and a student to their lessons.
  { key: 'students', href: '/students', labelKey: 'tabs.students', icon: icons.students },
  { key: 'news', href: '/news', labelKey: 'tabs.news', icon: icons.news },
  { key: 'more', href: '/more', labelKey: 'tabs.more', icon: icons.more, alwaysVisible: true },
];

export const defaultTabOrder: readonly TabKey[] = tabDefinitions.map((tab) => tab.key);

export function isTabKey(value: unknown): value is TabKey {
  return typeof value === 'string' && tabDefinitions.some((tab) => tab.key === value);
}

export function findTab(key: TabKey): TabDefinition {
  const tab = tabDefinitions.find((definition) => definition.key === key);
  if (!tab) throw new Error(`Unknown tab: ${key}`);
  return tab;
}
