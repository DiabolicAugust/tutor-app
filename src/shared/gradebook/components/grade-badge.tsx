import { View } from 'react-native';

import { createStyles, useTheme, type Palette } from '@/shared/theme';
import { Icon, Text, icons } from '@/shared/ui';

import { formatGradeValue, type Grade } from '../grade';

export type GradeBadgeProps = { grade: Grade };

/**
 * The mark itself, as a chip.
 *
 * A descriptive mark has no short form — its words *are* the mark, and picking a
 * couple of them to stand in would be inventing a grade nobody gave. So it shows
 * an icon instead, and the words are read from the row beside it.
 */
export function GradeBadge({ grade }: GradeBadgeProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const label = formatGradeValue(grade);
  const tint: keyof Palette = 'brand';

  return (
    <View style={[styles.badge, { backgroundColor: colors.brandSoft }]}>
      {label === null ? (
        <Icon name={icons.note} size={14} color={tint} />
      ) : (
        <Text variant="label" color={tint} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  badge: {
    minWidth: 44,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
