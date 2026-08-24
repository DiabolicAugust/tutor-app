import * as SecureStore from 'expo-secure-store';

import { storage } from './storage';
import type { SyncStorage } from './types';

/**
 * Storage for the one value that is a credential.
 *
 * The session carries a bearer token, and a bearer token is the whole account:
 * anybody holding it can read every student, every note and every uploaded
 * document that account can reach, from anywhere, until it expires. It has no
 * business sitting in the same plain SQLite file as the chosen theme.
 *
 * `expo-secure-store` puts it in the platform's keystore — the Keychain on iOS,
 * `EncryptedSharedPreferences` on Android — which means it is encrypted at rest,
 * excluded from device backups, and not readable by pulling the app's data
 * directory off a rooted phone.
 *
 * Everything else in `StorageKeys` deliberately stays where it is. Encrypting a
 * theme preference costs a keystore round trip on every launch and protects
 * nothing.
 */
export const secureStorage: SyncStorage = {
  get(key) {
    try {
      const stored = SecureStore.getItem(key);
      if (stored !== null) return stored;

      // A session written by a build that predates this file. Moved rather than
      // ignored, so upgrading does not sign everybody out — and moved rather
      // than copied, so the plain copy stops existing.
      return migrate(key);
    } catch {
      // A failed read is treated as no session, which means signing in again.
      // Deliberately not falling back to plain storage: a silent fallback would
      // leave the token unprotected on exactly the devices where the keystore
      // refused to work, which are the ones least worth trusting.
      return null;
    }
  },

  set(key, value) {
    try {
      SecureStore.setItem(key, value);
    } catch {
      // Nothing to do but carry on unpersisted: the session still works for
      // this launch, and the alternative is writing the token somewhere it
      // should not be.
    }
  },

  remove(key) {
    try {
      // No synchronous delete exists, and signing out must not wait. The promise
      // is deliberately unawaited; the in-memory session is cleared by the
      // caller either way.
      void SecureStore.deleteItemAsync(key);
    } catch {
      // See above.
    }
  },
};

/**
 * Moves a value from the old plain store into the keystore, once.
 *
 * Returns what it found, so the caller's read succeeds on the same launch the
 * move happens.
 */
function migrate(key: string): string | null {
  const legacy = storage.get(key);
  if (legacy === null) return null;

  try {
    SecureStore.setItem(key, legacy);
    storage.remove(key);
  } catch {
    // If it cannot be moved it is not left behind either: an unprotected token
    // that the app has decided to stop using is worth removing on its own.
    storage.remove(key);
    return null;
  }

  return legacy;
}
