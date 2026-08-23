/**
 * Small string helpers. Locale-aware where it matters.
 */

/**
 * Capitalises the first character.
 *
 * Needed for date labels: CLDR gives standalone month and weekday names in the
 * language's own convention, which for Ukrainian is lowercase ("серпень",
 * "нд"). That is correct inside a sentence and wrong as a heading, so labels
 * are capitalised at the point of display rather than by rewriting the data.
 *
 * Uses `toLocaleUpperCase` so locales with special casing (Turkish i) are not
 * corrupted.
 */
export function capitalizeFirst(value: string, locale?: string): string {
  if (!value) return value;
  const first = value.charAt(0);
  return first.toLocaleUpperCase(locale) + value.slice(1);
}
