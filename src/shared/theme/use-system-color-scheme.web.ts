import { useSyncExternalStore } from 'react';

import type { ColorScheme } from './theme';

/**
 * Web variant.
 *
 * Static rendering (`web.output: static`) prerenders in Node, where no media
 * query exists, so the first client render has to agree with the server's output
 * and only then adopt the real scheme. `useSyncExternalStore` is built for
 * exactly that shape: it takes a separate server snapshot and re-renders once
 * hydration hands over — no effect, and no state written during one.
 */
const QUERY = '(prefers-color-scheme: dark)';

function subscribe(listener: () => void): () => void {
  // Guarded because this also runs during prerender, where `window` is absent.
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  const media = window.matchMedia(QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

function getSnapshot(): ColorScheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/** The prerender has no user to ask, so it commits to the light palette. */
const getServerSnapshot = (): ColorScheme => 'light';

/** The OS appearance setting, normalized to a concrete scheme. */
export function useSystemColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
