import { storage } from './storage';
import type { SyncStorage } from './types';

/**
 * The web has no keystore, so this is the ordinary store.
 *
 * `expo-secure-store` is not implemented on web at all — there is no browser
 * equivalent of the Keychain, and pretending otherwise would be worse than
 * saying so. A token in `localStorage` is readable by any script that runs on
 * this origin, which is the honest state of a browser session and the reason the
 * server's CORS list is not `*` in production.
 *
 * What this file does buy is that the native builds, where the phone actually
 * holds people's data, are protected — without the web build failing to import
 * a module that does not exist there.
 */
export const secureStorage: SyncStorage = storage;
