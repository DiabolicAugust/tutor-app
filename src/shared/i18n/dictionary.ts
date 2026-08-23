/**
 * The translation engine: dictionary shape, compile-time key inference,
 * interpolation and pluralization. Deliberately free of React so it can be used
 * from services, notifications and tests.
 */

import { selectPluralCategory } from './plural-rules';

/**
 * A pluralized entry. Only `other` is required; which of the remaining
 * categories a language actually needs is decided by `selectPluralCategory`
 * (English uses one/other, Ukrainian uses one/few/many/other).
 *
 * `zero` is a convenience that wins for `count === 0` when present, so
 * "No lessons yet" does not need a separate key.
 */
export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

export type DictionaryNode = string | PluralForms | DictionaryTree;

export type DictionaryTree = { readonly [key: string]: DictionaryNode };

/** A namespace is anything that is not a leaf; a leaf is a string or a plural. */
type IsLeaf<T> = T extends string ? true : T extends { other: string } ? true : false;

/**
 * Every valid dot path of a dictionary, as a string-literal union. This is what
 * makes `t('lessons.ttile')` a compile error rather than a runtime surprise.
 */
export type TranslationKey<T> = {
  [K in keyof T & string]: IsLeaf<T[K]> extends true ? K : `${K}.${TranslationKey<T[K]>}`;
}[keyof T & string];

/**
 * Shape for non-default locales: every key optional, so a language can ship
 * incrementally and fall back to the default locale per key instead of
 * blocking a release on a complete translation.
 */
export type PartialDictionary<T> = {
  [K in keyof T]?: T[K] extends string
    ? string
    : T[K] extends { other: string }
      ? PluralForms
      : PartialDictionary<T[K]>;
};

export type TranslationParams = Record<string, string | number> & { count?: number };

/** `(key, params?) => string`, with keys constrained to the dictionary. */
export type Translate<T> = (key: TranslationKey<T>, params?: TranslationParams) => string;

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

function isPluralForms(node: DictionaryNode): node is PluralForms {
  return typeof node === 'object' && typeof (node as PluralForms).other === 'string';
}

function lookup(tree: DictionaryTree | undefined, path: readonly string[]): DictionaryNode | undefined {
  let node: DictionaryNode | undefined = tree;
  for (const segment of path) {
    if (node === undefined || typeof node === 'string' || isPluralForms(node)) return undefined;
    node = (node as DictionaryTree)[segment];
  }
  return node;
}

function selectPluralForm(forms: PluralForms, count: number, languageTag: string): string {
  if (count === 0 && forms.zero !== undefined) return forms.zero;
  const category = selectPluralCategory(languageTag, count);
  return forms[category] ?? forms.other;
}

function interpolate(template: string, params: TranslationParams | undefined, key: string): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      warnOnce(`Missing param "${name}" for translation key "${key}".`);
      return match;
    }
    return String(value);
  });
}

const warned = new Set<string>();

function warnOnce(message: string): void {
  if (!__DEV__ || warned.has(message)) return;
  warned.add(message);
  console.warn(`[i18n] ${message}`);
}

/**
 * Builds a translator bound to one locale.
 *
 * Resolution order for each key: active dictionary → fallback dictionary → the
 * key itself. Returning the key (instead of an empty string) keeps a missing
 * translation visible in the UI rather than silently blank.
 */
export function createTranslator<T extends DictionaryTree>(
  languageTag: string,
  dictionary: PartialDictionary<T> | T,
  fallback: T,
): Translate<T> {
  return (key, params) => {
    const path = (key as string).split('.');
    const node =
      lookup(dictionary as DictionaryTree, path) ?? lookup(fallback as DictionaryTree, path);

    if (node === undefined) {
      warnOnce(`Missing translation for key "${key}" (${languageTag}).`);
      return key as string;
    }

    if (typeof node === 'string') return interpolate(node, params, key as string);

    if (isPluralForms(node)) {
      const count = params?.count;
      if (typeof count !== 'number') {
        warnOnce(`Key "${key}" is pluralized but no "count" param was passed.`);
        return interpolate(node.other, params, key as string);
      }
      return interpolate(selectPluralForm(node, count, languageTag), params, key as string);
    }

    warnOnce(`Key "${key}" resolves to a namespace, not a translation.`);
    return key as string;
  };
}
