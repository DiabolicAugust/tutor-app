import { useMemo } from 'react';

import { capitalizeFirst } from '@/shared/lib/text';

import { useT } from './use-translation';

/**
 * Locale-aware formatting.
 *
 * Kept next to i18n rather than in `lib/` because a formatted date is a
 * translation: "8/23/26", "23.08.2026" and "23.08.26" are the same instant
 * rendered for three audiences. Every formatter is bound to the active language
 * tag, so a language switch reformats the whole app with no extra wiring.
 *
 * `Intl` instances are expensive to construct, so they are cached per
 * (tag, options) pair, and every call is guarded — Hermes builds without full
 * ICU degrade to a readable fallback instead of throwing.
 */

type DateLike = Date | number | string;

const cache = new Map<string, unknown>();

function cached<T>(key: string, create: () => T): T | null {
  if (!cache.has(key)) {
    try {
      cache.set(key, create());
    } catch {
      cache.set(key, null);
    }
  }
  return (cache.get(key) as T | null) ?? null;
}

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

export type Formatters = {
  /** `1234.5` → "1,234.5" */
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** `(1200, 'USD')` → "$1,200.00" */
  currency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string;
  /** `0.42` → "42%" */
  percent: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Date only, medium length by default. */
  date: (value: DateLike, options?: Intl.DateTimeFormatOptions) => string;
  /** Time only, hours and minutes. */
  time: (value: DateLike, options?: Intl.DateTimeFormatOptions) => string;
  /** Date and time together — lesson slots, audit logs. */
  dateTime: (value: DateLike, options?: Intl.DateTimeFormatOptions) => string;
  /** Standalone weekday name, for schedule grids. Capitalised as a label. */
  weekday: (value: DateLike, width?: 'long' | 'short' | 'narrow') => string;
  /** "August 2026" / "Серпень 2026" — a month heading, capitalised. */
  monthYear: (value: DateLike) => string;
  /** "Sunday, 23 August" / "Неділя, 23 серпня" — a day heading, capitalised. */
  dayTitle: (value: DateLike) => string;
  /** `['Anna', 'Ben', 'Cleo']` → "Anna, Ben and Cleo" */
  list: (values: readonly string[], type?: 'conjunction' | 'disjunction') => string;
};

export function createFormatters(languageTag: string): Formatters {
  const numberFormat = (options?: Intl.NumberFormatOptions) =>
    cached(`n:${languageTag}:${JSON.stringify(options ?? {})}`, () =>
      new Intl.NumberFormat(languageTag, options),
    );

  const dateFormat = (options: Intl.DateTimeFormatOptions) =>
    cached(`d:${languageTag}:${JSON.stringify(options)}`, () =>
      new Intl.DateTimeFormat(languageTag, options),
    );

  return {
    number: (value, options) => numberFormat(options)?.format(value) ?? String(value),

    currency: (value, currency, options) =>
      numberFormat({ style: 'currency', currency, ...options })?.format(value) ??
      `${value} ${currency}`,

    percent: (value, options) =>
      numberFormat({ style: 'percent', ...options })?.format(value) ??
      `${Math.round(value * 100)}%`,

    date: (value, options) =>
      dateFormat(options ?? { dateStyle: 'medium' })?.format(toDate(value)) ??
      toDate(value).toDateString(),

    time: (value, options) =>
      dateFormat(options ?? { timeStyle: 'short' })?.format(toDate(value)) ??
      toDate(value).toTimeString().slice(0, 5),

    dateTime: (value, options) =>
      dateFormat(options ?? { dateStyle: 'medium', timeStyle: 'short' })?.format(toDate(value)) ??
      toDate(value).toISOString(),

    // Month and weekday names arrive lowercase in several languages, which is
    // right mid-sentence and wrong for a heading.
    weekday: (value, width = 'short') =>
      capitalizeFirst(
        dateFormat({ weekday: width })?.format(toDate(value)) ?? toDate(value).toDateString(),
        languageTag,
      ),

    monthYear: (value) =>
      capitalizeFirst(
        dateFormat({ month: 'long', year: 'numeric' })?.format(toDate(value)) ??
          toDate(value).toDateString(),
        languageTag,
      ),

    dayTitle: (value) =>
      capitalizeFirst(
        dateFormat({ weekday: 'long', day: 'numeric', month: 'long' })?.format(toDate(value)) ??
          toDate(value).toDateString(),
        languageTag,
      ),

    list: (values, type = 'conjunction') => {
      const formatter = cached(`l:${languageTag}:${type}`, () =>
        typeof Intl.ListFormat === 'function'
          ? new Intl.ListFormat(languageTag, { style: 'long', type })
          : null,
      );
      return formatter?.format(values) ?? values.join(', ');
    },
  };
}

/** Formatters bound to the active locale. */
export function useFormat(): Formatters {
  const { languageTag } = useT();
  return useMemo(() => createFormatters(languageTag), [languageTag]);
}
