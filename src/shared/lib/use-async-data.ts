import { useCallback, useEffect, useState } from 'react';

export type AsyncData<T> = {
  /** `null` until the first load for the current key finishes. */
  data: T | null;
  isLoading: boolean;
  /** Replaces what is held, for a screen that has just written something. */
  setData: (next: T | ((current: T | null) => T)) => void;
  /** Fetches again for the same key. */
  reload: () => void;
};

/**
 * Data loaded for one key, reloaded when the key changes.
 *
 * **Loading is derived, not stored.** The obvious shape — an `isLoading` state
 * set to `true` at the top of the effect — writes state synchronously during an
 * effect, which cascades renders and is what the React Compiler objects to. It
 * also has a subtler problem: for one render after the key changes, the old
 * key's data is still in state and `isLoading` is still `false`, so a screen
 * briefly shows the previous student's notes. Holding the key alongside the data
 * makes both impossible: anything not loaded for the current key is, by
 * definition, still loading.
 *
 * `null` for the empty case rather than a caller-supplied empty value, because
 * an empty array literal would be a new object on every render and so a new
 * dependency.
 */
export function useAsyncData<T>(key: string | null, load: (key: string) => Promise<T>): AsyncData<T> {
  const [loaded, setLoaded] = useState<{ key: string; data: T } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null) return;

    let active = true;

    void (async () => {
      try {
        const data = await load(key);
        if (active) setLoaded({ key, data });
      } catch {
        // A failed load is an empty one as far as the screen is concerned; the
        // caller shows its own message if it has something useful to say.
        if (active) setLoaded(null);
      }
    })();

    return () => {
      active = false;
    };
    // `load` is deliberately not a dependency: it is a closure rebuilt on every
    // render of the screen that owns it, and including it would refetch
    // endlessly. The key is what identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const setData = useCallback(
    (next: T | ((current: T | null) => T)) => {
      if (key === null) return;

      setLoaded((current) => ({
        key,
        data:
          typeof next === 'function'
            ? (next as (value: T | null) => T)(current?.key === key ? current.data : null)
            : next,
      }));
    },
    [key],
  );

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const isCurrent = key !== null && loaded?.key === key;

  return {
    data: isCurrent ? loaded.data : null,
    isLoading: key !== null && !isCurrent,
    setData,
    reload,
  };
}
