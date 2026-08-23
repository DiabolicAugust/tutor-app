import { useSyncExternalStore } from 'react';

/**
 * The current time, as something a component may read during render.
 *
 * `Date.now()` called inline is a side effect: the same props render a different
 * result each time, which is what the React Compiler objects to — and it is also
 * why a relative timestamp rendered that way is frozen at whatever the clock
 * said when the component last happened to re-render. "2 hours ago" quietly
 * becomes wrong and nothing triggers a correction.
 *
 * One timer for the whole app, not one per component: a screen listing thirty
 * notifications would otherwise hold thirty intervals that all fire for the same
 * reason.
 */
const TICK_MS = 60_000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let currentTime = Date.now();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Started on the first subscriber and stopped after the last, so an app on a
  // screen with no relative times is not waking up once a minute.
  timer ??= setInterval(() => {
    currentTime = Date.now();
    for (const notify of listeners) notify();
  }, TICK_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * Read once per tick rather than per call, so every component in one render pass
 * agrees on what "now" is. Two cards computing "an hour ago" and "2 hours ago"
 * from clocks a millisecond apart is the kind of inconsistency nobody can
 * reproduce.
 */
const getSnapshot = (): number => currentTime;

/**
 * Static rendering has no clock worth trusting — the prerender happened whenever
 * the build ran, and no timer runs there. The value captured at module load is
 * stable for the whole prerender, which keeps the server and the first client
 * render in agreement; the real time arrives with hydration.
 */
const getServerSnapshot = (): number => currentTime;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
