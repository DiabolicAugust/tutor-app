import { Pressable, ScrollView, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles } from '@/shared/theme';

import { Text } from './text';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  /** Secondary line inside the chip, e.g. a weekday above a date. */
  caption?: string;
};

export type ChipGroupProps<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** Test handle. Each chip gets `${testID}-${value}` — see `SegmentedControl`. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  scroll: { flexGrow: 0 },
  content: { gap: t.spacing.xs, paddingVertical: 2 },
  chip: {
    minWidth: 56,
    minHeight: t.layout.minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    gap: 1,
  },
  chipSelected: { backgroundColor: t.colors.brand, borderColor: t.colors.brand },
  chipPressed: { backgroundColor: t.colors.surfaceActive },
}));

/**
 * Horizontally scrolling single-choice control for options that do not fit a
 * segmented control — dates, time slots, anything with more than a handful of
 * values.
 *
 * Deliberately not a native picker: chips work identically on iOS, Android and
 * web, keep every option one tap away, and add no dependency. A platform date
 * picker can replace the date row later without touching the form's logic.
 */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
  style,
}: ChipGroupProps<T>) {
  const styles = useStyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.content}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.caption ?? ''} ${option.label}`.trim()}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}
          >
            {option.caption ? (
              <Text variant="caption" color={selected ? 'textOnAccent' : 'textMuted'}>
                {option.caption}
              </Text>
            ) : null}
            <Text variant="bodyStrong" color={selected ? 'textOnAccent' : 'text'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
