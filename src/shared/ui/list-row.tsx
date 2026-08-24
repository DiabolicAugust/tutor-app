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
  /**
   * Whether the row reaches its container's edges.
   *
   * On by default, and the reason is what a press looks like. A row has no
   * horizontal padding of its own, so its highlight spanned the *content* width
   * of whatever held it — and every container that holds one pads by `lg`. The
   * result was a band floating a wide margin short of the card on both sides,
   * which reads as a highlight around the text rather than a row being pressed.
   *
   * Cancelled with a negative margin and restored with padding, so the content
   * does not move: only the pressable area and the highlight grow. That also
   * makes the touch target the full width of the list, which is what a list row
   * should be.
   *
   * Turn it off where the row is not the full width of its container — a row
   * sharing a line with something else, where reaching outwards would paint over
   * its neighbour.
   */
  edgeToEdge?: boolean;
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
  /**
   * The same token every container that holds a row pads by — `Card` and the
   * body of `ModalSheet` both use `lg`. Stated here rather than passed in,
   * because a row that had to be told its parent's padding would be told wrong
   * on the first screen somebody added.
   *
   * No corner radius with it: at full width a rounded band reads as a floating
   * pill, and a row is not one. The rows are inset vertically by the container's
   * padding anyway, so the highlight never meets a rounded corner.
   */
  edgeToEdge: {
    marginHorizontal: -t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    borderRadius: 0,
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
  edgeToEdge = true,
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

  // Applied to both variants, so a row that does nothing when tapped still lines
  // its content up with one that does.
  const bleed = edgeToEdge && styles.edgeToEdge;

  if (!onPress) {
    return (
      <View style={[styles.row, bleed, style]} testID={testID}>
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
      style={({ pressed }) => [styles.row, bleed, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}
