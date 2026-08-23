import { Pressable, View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles, useTheme, type Palette } from '@/shared/theme';
import { Text } from '@/shared/ui';

import {
  attendanceKeys,
  attendanceOrder,
  type AttendanceStatus,
} from '../attendance';

export type AttendancePickerProps = {
  value: AttendanceStatus | null;
  onChange: (value: AttendanceStatus) => void;
};

/**
 * How each answer should feel.
 *
 * Its own control rather than a `SegmentedControl`, precisely because of this:
 * the four answers are not interchangeable options, and colour is what lets a
 * tutor hit the right one without reading. Present is the good outcome, a no-show
 * is the one with consequences, and an excused absence is neither.
 */
const tone = {
  present: { fill: 'successSoft', text: 'success' },
  late: { fill: 'warningSoft', text: 'warning' },
  absentExcused: { fill: 'surfaceMuted', text: 'textSecondary' },
  absentUnexcused: { fill: 'dangerSoft', text: 'danger' },
} as const satisfies Record<AttendanceStatus, { fill: keyof Palette; text: keyof Palette }>;

/**
 * Whether the student turned up — the first thing a tutor touches after a lesson.
 *
 * A two-by-two grid of full-width targets rather than four segments in a row: the
 * labels are phrases, not words, and four of them squeezed across a phone are
 * four things to squint at when the point is one confident tap.
 */
export function AttendancePicker({ value, onChange }: AttendancePickerProps) {
  const { t } = useT();
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {attendanceOrder.map((status) => {
        const selected = status === value;
        const { fill, text } = tone[status];

        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              // The tone is always present as an outline and fills in when
              // chosen, so the meaning is legible before the choice is made.
              { borderColor: colors[text] },
              selected && { backgroundColor: colors[fill] },
              pressed && !selected && { backgroundColor: colors.surfaceActive },
            ]}
          >
            <Text
              variant="label"
              color={selected ? text : 'textSecondary'}
              style={styles.label}
              numberOfLines={2}
            >
              {t(attendanceKeys[status])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
  },
  option: {
    // Two per row, accounting for the gap between them.
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: t.layout.minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: 1,
  },
  label: { textAlign: 'center' },
}));
