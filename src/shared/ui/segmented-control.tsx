import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles } from '@/shared/theme';

import { Text } from './text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /**
   * Spoken label, when the visible one is abbreviated to fit. Segments are
   * narrow, so a short label is often the right visual choice and the wrong
   * thing to read aloud.
   */
  accessibilityLabel?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Announced to screen readers as the group's purpose. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  container: {
    flexDirection: 'row',
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.full,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 2,
  },
  segment: {
    flex: 1,
    minHeight: t.layout.minTouchSize - 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Tight horizontally, generous vertically: three segments in a phone-width
    // column leave little room sideways, so a long label needs somewhere to go
    // other than into its own edges.
    paddingHorizontal: t.spacing.xs,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.full,
  },
  label: { textAlign: 'center' },
  segmentSelected: {
    backgroundColor: t.colors.brand,
  },
  segmentPressed: {
    backgroundColor: t.colors.surfaceActive,
  },
}));

/**
 * Generic single-choice control. Kept free of any domain knowledge so it can
 * back appearance, language, lesson-status and billing-period pickers alike —
 * the label strings are the caller's job, which also keeps translation at the
 * call site where the key is known.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: SegmentedControlProps<T>) {
  const styles = useStyles();

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text
              variant="label"
              color={selected ? 'textOnAccent' : 'textSecondary'}
              style={styles.label}
              numberOfLines={2}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
