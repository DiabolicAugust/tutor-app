import { useCallback, useState } from 'react';

/**
 * Backs a pull-to-refresh gesture.
 *
 * Takes the reloads a screen is responsible for and runs them together, because
 * a screen shows more than one thing: the calendar needs the schedule *and* the
 * roster, or a refreshed lesson renders a raw id where a name should be.
 *
 * `Promise.allSettled`, not `all`: one failing reload must not cancel the others
 * or leave the spinner turning. Each reload already reports its own failure.
 */
export function useRefresh(reloads: readonly (() => Promise<unknown>)[]) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled(reloads.map((reload) => reload()));
    } finally {
      setIsRefreshing(false);
    }
  }, [reloads]);

  return { isRefreshing, refresh };
}
