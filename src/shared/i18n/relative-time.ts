import type { TranslationKey } from './dictionary';
import type { AppDictionary } from './locales';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type TimeAgo = {
  key: TranslationKey<AppDictionary>;
  /** Interpolated into the key's plural forms. */
  count: number;
};

/**
 * How long ago something happened, as a dictionary key and a count.
 *
 * Not `Intl.RelativeTimeFormat`. Hermes ships a reduced `Intl` without it, so on
 * a device the formatter fell back to printing its arguments — which is how the
 * news feed came to say "-52 hour": the raw difference, unlocalised, with the
 * sign the subtraction happened to produce.
 *
 * Returning a key rather than a string keeps the translation in the dictionary,
 * where Ukrainian's four plural forms already work, and keeps this function pure
 * enough to check without rendering anything.
 *
 * The unit is chosen rather than fixed. "52 hours ago" is a number somebody has
 * to divide; "2 days ago" is the same fact already read.
 */
export function describeTimeAgo(instant: string | number | Date, now: number): TimeAgo {
  const then = instant instanceof Date ? instant.getTime() : new Date(instant).getTime();

  // A future timestamp means a clock disagreement, not a prediction — the phone's
  // clock against the server's. "Just now" is the honest reading of it, and a
  // negative count would be nonsense in every language.
  const elapsed = Math.max(0, now - then);

  if (elapsed < MINUTE_MS) return { key: 'time.justNow', count: 0 };
  if (elapsed < HOUR_MS) {
    return { key: 'time.minutesAgo', count: Math.floor(elapsed / MINUTE_MS) };
  }
  if (elapsed < DAY_MS) {
    return { key: 'time.hoursAgo', count: Math.floor(elapsed / HOUR_MS) };
  }

  return { key: 'time.daysAgo', count: Math.floor(elapsed / DAY_MS) };
}
