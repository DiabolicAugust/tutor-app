import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { StorageKeys, createPersistedValue } from '@/shared/lib/storage';

import {
  defaultTabOrder,
  findTab,
  isTabKey,
  tabDefinitions,
  type TabDefinition,
  type TabKey,
} from './tab-definitions';

const isTabKeyArray = (value: unknown): value is TabKey[] =>
  Array.isArray(value) && value.every(isTabKey);

const orderStore = createPersistedValue<TabKey[]>(StorageKeys.tabOrder, isTabKeyArray);
const hiddenStore = createPersistedValue<TabKey[]>(StorageKeys.tabHidden, isTabKeyArray);

export type TabPreferences = {
  /** Every tab in the user's order, hidden ones included. */
  orderedTabs: readonly TabDefinition[];
  /** What the tab bars actually render. */
  visibleTabs: readonly TabDefinition[];
  isVisible: (key: TabKey) => boolean;
  canHide: (key: TabKey) => boolean;
  toggleVisible: (key: TabKey) => void;
  /** Moves a tab one place towards the start (-1) or the end (1). */
  move: (key: TabKey, direction: -1 | 1) => void;
  reset: () => void;
};

const TabPreferencesContext = createContext<TabPreferences | null>(null);

/**
 * Reconciles a stored order with the tabs that exist now.
 *
 * A build that adds or removes a tab must not strand the stored value: unknown
 * keys are dropped and new ones appended, so an upgrade shows the new tab
 * instead of hiding it or crashing.
 */
function reconcileOrder(stored: readonly TabKey[] | null): TabKey[] {
  const known = stored?.filter(isTabKey) ?? [];
  const missing = defaultTabOrder.filter((key) => !known.includes(key));
  return [...known, ...missing];
}

/**
 * Which tabs appear in the bottom bar and in what order.
 *
 * Mounted app-wide because both tab bars and the settings screen read it.
 */
export function TabPreferencesProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<TabKey[]>(() => reconcileOrder(orderStore.read()));
  const [hidden, setHidden] = useState<TabKey[]>(() => {
    const stored = hiddenStore.read() ?? [];
    // A stored value can never hide a tab that must stay reachable.
    return stored.filter((key) => isTabKey(key) && !findTab(key).alwaysVisible);
  });

  const persistOrder = useCallback((next: TabKey[]) => {
    setOrder(next);
    orderStore.write(next);
  }, []);

  const persistHidden = useCallback((next: TabKey[]) => {
    setHidden(next);
    hiddenStore.write(next);
  }, []);

  const value = useMemo<TabPreferences>(() => {
    const orderedTabs = order.map(findTab);
    const hiddenSet = new Set(hidden);

    const canHide = (key: TabKey) => {
      if (findTab(key).alwaysVisible) return false;
      // Never let the last visible tab disappear.
      return orderedTabs.filter((tab) => !hiddenSet.has(tab.key)).length > 1;
    };

    return {
      orderedTabs,
      visibleTabs: orderedTabs.filter((tab) => !hiddenSet.has(tab.key)),
      isVisible: (key) => !hiddenSet.has(key),
      canHide,
      toggleVisible: (key) => {
        if (hiddenSet.has(key)) {
          persistHidden(hidden.filter((item) => item !== key));
          return;
        }
        if (!canHide(key)) return;
        persistHidden([...hidden, key]);
      },
      move: (key, direction) => {
        const from = order.indexOf(key);
        const to = from + direction;
        if (from === -1 || to < 0 || to >= order.length) return;
        const next = [...order];
        [next[from], next[to]] = [next[to], next[from]];
        persistOrder(next);
      },
      reset: () => {
        persistOrder([...defaultTabOrder]);
        persistHidden([]);
      },
    };
  }, [order, hidden, persistOrder, persistHidden]);

  return (
    <TabPreferencesContext.Provider value={value}>{children}</TabPreferencesContext.Provider>
  );
}

export function useTabPreferences(): TabPreferences {
  const value = useContext(TabPreferencesContext);
  if (!value) {
    throw new Error('useTabPreferences must be used inside <TabPreferencesProvider>.');
  }
  return value;
}

export { tabDefinitions };
