import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useT } from '@/shared/i18n';
import {
  createStyles,
  paletteVariantNames,
  paletteVariants,
  resolvePalette,
  useThemeController,
  type PaletteVariant,
} from '@/shared/theme';

/**
 * One cached swatch style per variant, showing each variant's accent as it
 * would look in the *current* scheme — so the dark-mode swatches are the
 * dark-mode accents, not the light ones.
 */
const useSwatchStyles = createStyles((t) => {
  const styles: Record<string, ViewStyle> = {};
  for (const variant of paletteVariantNames) {
    styles[variant] = {
      backgroundColor: resolvePalette(t.scheme, paletteVariants[variant][t.scheme]).brand,
    };
  }
  return styles as Record<PaletteVariant, ViewStyle>;
});

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: t.radius.full,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: t.colors.borderStrong,
  },
  swatchPressed: {
    opacity: 0.7,
  },
}));

/**
 * Accent-palette picker. Variant names are treated as brand names rather than
 * translatable copy — if variants ever come from a tenant record, their labels
 * come with them instead of from the dictionary.
 */
export function PaletteVariantSwitcher({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useT();
  const { variant, setVariant, availableVariants } = useThemeController();
  const styles = useStyles();
  const swatches = useSwatchStyles();

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('settings.appearance.accent')}
    >
      {availableVariants.map((option) => {
        const selected = option === variant;
        return (
          <Pressable
            key={option}
            onPress={() => setVariant(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option}
            style={({ pressed }) => [
              styles.swatch,
              swatches[option],
              selected && styles.swatchSelected,
              pressed && styles.swatchPressed,
            ]}
          />
        );
      })}
    </View>
  );
}
