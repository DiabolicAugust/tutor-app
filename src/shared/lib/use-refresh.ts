import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';

/**
 * How long a pull-to-refresh may spin before it gives up on saying so.
 *
 * Not a request timeout — each client has its own, and a reload that fails
 * reports it. This is only about the spinner: one still turning a quarter of a
 * minute after the gesture has stopped meaning "working" and started meaning
 * "stuck", and one reload that never settles must not be able to hold the
 * indicator hostage for the sixty seconds a request is allowed.
 */
const SPIN_CEILING_MS = 15_000;

/**
 * Backs a pull-to-refresh gesture.
 *
 * Takes the reloads a screen is responsible for and runs them together, because
 * a screen shows more than one thing: the calendar needs the schedule *and* the
 * roster, or a refreshed lesson renders a raw id where a name should be.
 *
 * `Promise.allSettled`, not `all`: one failing reload must not cancel the others
 * or leave the spinner turning. Each reload already reports its own failure.
 *
 * Returns a `controlKey` to put on the `RefreshControl`. Leaving a screen
 * mid-refresh and coming back showed a spinner over data that had already
 * arrived: the refresh finished while the screen was off-stage, and the native
 * control never got the news. Remounting it on the way back is what makes the
 * indicator agree with the state again — and it is done only when nothing is
 * actually in flight, so a refresh still running is left alone to finish.
 */
export function useRefresh(reloads: readonly (() => Promise<unknown>)[]) {
  const isFocused = useIsFocused();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [controlKey, setControlKey] = useState(0);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    inFlight.current = true;
    setIsRefreshing(true);

    // Whichever finishes first. The reloads keep running either way — they own
    // their own state, so a late arrival still lands; this only decides when the
    // gesture stops reporting itself as ongoing.
    const settled = Promise.allSettled(reloads.map((reload) => reload()));
    const ceiling = new Promise((resolve) => setTimeout(resolve, SPIN_CEILING_MS));

    try {
      await Promise.race([settled, ceiling]);
    } finally {
      inFlight.current = false;
      setIsRefreshing(false);
    }
  }, [reloads]);

  useEffect(() => {
    // Only on the way back, and only when the spinner has nothing left to show.
    if (isFocused && !inFlight.current) setControlKey((current) => current + 1);
  }, [isFocused]);

  return { isRefreshing, refresh, controlKey };
}
