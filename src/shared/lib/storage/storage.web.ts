import type { SyncStorage } from './types';

/**
 * Web implementation. Guarded against static rendering (`web.output: static`
 * prerenders in Node, where `localStorage` does not exist) and against
 * browsers that block site data.
 */
function localStorageOrNull(): globalThis.Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const storage: SyncStorage = {
  get(key) {
    try {
      return localStorageOrNull()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorageOrNull()?.setItem(key, value);
    } catch {
      // Best-effort.
    }
  },
  remove(key) {
    try {
      localStorageOrNull()?.removeItem(key);
    } catch {
      // Best-effort.
    }
  },
};
