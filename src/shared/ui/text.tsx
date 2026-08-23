import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { createStyles, type Palette, type typography } from '@/shared/theme';

export type TextVariant = keyof typeof typography;
export type TextColor = keyof Palette;

/**
 * Typography is exposed as-is: `t.typography` is already a map of named text
 * styles, so `StyleSheet.create` over it yields one cached style per variant.
 */
const useVariantStyles = createStyles((t) => t.typography);

/** One cached `{ color }` style per palette entry, so no inline objects. */
const useColorStyles = createStyles((t) => {
  const styles: Record<string, TextStyle> = {};
  for (const [name, value] of Object.entries(t.colors)) {
    styles[name] = { color: value };
  }
  return styles as Record<TextColor, TextStyle>;
});

export type TextProps = RNTextProps & {
  /** Role in the type scale — not a raw font size. */
  variant?: TextVariant;
  /** Semantic palette entry. */
  color?: TextColor;
};

/**
 * The app's text primitive. Prefer it over `react-native`'s `Text` so every
 * string picks up the active theme and a consistent type scale, and so a
 * typography change lands everywhere at once.
 *
 * @example
 * <Text variant="titleMd">{t('lessons.title')}</Text>
 * <Text variant="caption" color="textSecondary">{format.date(lesson.startsAt)}</Text>
 */
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const variants = useVariantStyles();
  const colors = useColorStyles();

  return <RNText style={[variants[variant], colors[color], style]} {...rest} />;
}
