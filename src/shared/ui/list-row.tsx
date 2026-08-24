import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles } from '@/shared/theme';

import { Icon, icons } from './icon';
import { Text } from './text';

export type ListRowProps = {
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Right-aligned value, e.g. the current setting. */
  value?: string;
  onPress?: () => void;
  /** Shows a checkmark instead of a chevron — for multi-select lists. */
  selectable?: boolean;
  selected?: boolean;
  /** Identity swatch, for rows that stand for a calendar or a category. */
  swatchColor?: string;
  /**
   * Stable handle for end-to-end tests.
   *
   * Preferred over matching visible text, which is translated and rewritten for
   * clarity — a test that keys on copy fails for cosmetic edits and stops being
   * believed.
   */
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: t.layout.minTouchSize,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.sm,
  },
  pressed: { backgroundColor: t.colors.surfaceActive },
  swatch: { width: 12, height: 12, borderRadius: t.radius.full },
  labels: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
}));

/**
 * One row of a settings or selection list. Covers both roles because they
 * differ only in the trailing affordance: a chevron for navigation, a
 * checkmark for selection.
 */
export function ListRow({
  label,
  description,
  value,
  onPress,
  selectable = false,
  selected = false,
  swatchColor,
  style,
  testID,
}: ListRowProps) {
  const styles = useStyles();

  const content = (
    <>
      {swatchColor ? <View style={[styles.swatch, { backgroundColor: swatchColor }]} /> : null}

      <View style={styles.labels}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {value ? (
          <Text variant="bodySm" color="textSecondary">
            {value}
          </Text>
        ) : null}
        {selectable ? (
          selected ? <Icon name={icons.check} size={18} color="brand" /> : null
        ) : onPress ? (
          <Icon name={icons.chevronRight} size={16} color="textMuted" />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}
