/**
 * Minimal synchronous key/value contract.
 *
 * Synchronous on purpose: providers read persisted preferences during their
 * first render, so the app never flashes the wrong theme or language while an
 * async read resolves. Implementations live in `./index.ts` (native) and
 * `./index.web.ts` (web) and must never throw.
 */
export type SyncStorage = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};
