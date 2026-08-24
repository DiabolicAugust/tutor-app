import { storage } from './storage';
import type { SyncStorage } from './types';

/**
 * A single validated, JSON-encoded preference.
 *
 * The guard is required rather than optional: stored values outlive the code
 * that wrote them, so a value that no longer matches the current union (a
 * removed locale, a renamed theme mode) must degrade to `null` instead of
 * poisoning provider state.
 *
 * The store is a parameter, defaulting to the ordinary one. The session passes
 * `secureStorage` instead: it holds a bearer token, which is a credential rather
 * than a preference and belongs in the platform's keystore.
 *
 * @example
 * const themeModeStore = createPersistedValue(StorageKeys.themeMode, isThemeMode);
 * themeModeStore.read();        // ThemeMode | null
 * themeModeStore.write('dark');
 */
export function createPersistedValue<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  store: SyncStorage = storage,
) {
  return {
    read(): T | null {
      const raw = store.get(key);
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    write(value: T): void {
      store.set(key, JSON.stringify(value));
    },
    clear(): void {
      store.remove(key);
    },
  };
}
