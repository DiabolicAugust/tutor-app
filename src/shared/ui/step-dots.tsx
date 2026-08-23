import { View } from 'react-native';

import { createStyles } from '@/shared/theme';

export type StepDotsProps = {
  total: number;
  /** Zero-based. */
  current: number;
};

/**
 * Progress through a short sequence of steps.
 *
 * Dots rather than "3 of 5" because the number that matters is how much is
 * left, and a glance at four dots answers that faster than reading. Shared
 * between the registration wizard and the interface tour, which is the whole
 * reason it is a component: two different sequences that look different would
 * read as two different mechanisms.
 */
export function StepDots({ total, current }: StepDotsProps) {
  const styles = useStyles();

  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === current && styles.dotCurrent,
            index < current && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.border,
  },
  // The current step is wider rather than merely brighter: it survives being
  // looked at on a dim screen outdoors.
  dotCurrent: { width: 18, backgroundColor: t.colors.brand },
  dotDone: { backgroundColor: t.colors.brandSoft },
}));
