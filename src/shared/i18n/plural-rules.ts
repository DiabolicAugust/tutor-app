/**
 * Plural category selection.
 *
 * **Why this exists instead of `Intl.PluralRules`:** Hermes ships without it.
 * On web the platform provides it and Ukrainian plurals worked; on device the
 * lookup silently failed and every count fell back to one/other, so "12
 * lessons left" rendered with the singular-ish form ("12 заняття" instead of
 * "12 занять"). Rules that differ between web and device are worse than rules
 * that are simply written down, so they are written down here.
 *
 * Rules follow CLDR. Add a language by adding an entry — the resolution order
 * below prefers these over the platform precisely so behaviour is identical
 * everywhere.
 */

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

type PluralRule = (count: number) => PluralCategory;

/** CLDR: en — one for exactly 1. */
const english: PluralRule = (count) => (count === 1 ? 'one' : 'other');

/**
 * CLDR: uk (also matches ru/be) —
 * - one:  n % 10 = 1 and n % 100 != 11        → 1, 21, 101
 * - few:  n % 10 = 2..4 and n % 100 != 12..14 → 2, 23, 104
 * - many: everything else integral            → 0, 5, 11..14, 25
 */
const eastSlavic: PluralRule = (count) => {
  if (!Number.isInteger(count)) return 'other';

  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;

  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  return 'many';
};

/** Keyed by language subtag, so `uk-UA` and `uk` both resolve. */
const rules: Record<string, PluralRule> = {
  en: english,
  uk: eastSlavic,
};

/**
 * The plural category for `count` in `languageTag`.
 *
 * Resolution order: our own rule for the language, then `Intl.PluralRules` if
 * the runtime has it (covers languages we have not written rules for), then
 * one/other as a last resort.
 */
export function selectPluralCategory(languageTag: string, count: number): PluralCategory {
  const language = languageTag.split('-')[0];
  const rule = rules[language];
  if (rule) return rule(count);

  try {
    if (typeof Intl.PluralRules === 'function') {
      return new Intl.PluralRules(languageTag).select(count) as PluralCategory;
    }
  } catch {
    // Runtime without full ICU. Fall through.
  }

  return english(count);
}
