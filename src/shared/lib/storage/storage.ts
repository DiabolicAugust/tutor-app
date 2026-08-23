import Storage from 'expo-sqlite/kv-store';

import type { SyncStorage } from './types';

/**
 * Native implementation, backed by `expo-sqlite/kv-store` (a drop-in
 * AsyncStorage replacement that also exposes a synchronous API).
 */
export const storage: SyncStorage = {
  get(key) {
    try {
      return Storage.getItemSync(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      Storage.setItemSync(key, value);
    } catch {
      // Preferences are best-effort: a failed write must never break render.
    }
  },
  remove(key) {
    try {
      Storage.removeItemSync(key);
    } catch {
      // See above.
    }
  },
};
