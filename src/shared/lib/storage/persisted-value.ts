import { storage } from './storage';

/**
 * A single validated, JSON-encoded preference.
 *
 * The guard is required rather than optional: stored values outlive the code
 * that wrote them, so a value that no longer matches the current union (a
 * removed locale, a renamed theme mode) must degrade to `null` instead of
 * poisoning provider state.
 *
 * @example
 * const themeModeStore = createPersistedValue(StorageKeys.themeMode, isThemeMode);
 * themeModeStore.read();        // ThemeMode | null
 * themeModeStore.write('dark');
 */
export function createPersistedValue<T>(
  key: string,
  isValid: (value: unknown) => value is T,
) {
  return {
    read(): T | null {
      const raw = storage.get(key);
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    write(value: T): void {
      storage.set(key, JSON.stringify(value));
    },
    clear(): void {
      storage.remove(key);
    },
  };
}
