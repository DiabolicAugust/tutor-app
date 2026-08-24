import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { SegmentedControl, Text } from '@/shared/ui';

import type { AttendanceStatus } from '../attendance';
import type { RegisterLine } from '../use-lesson-journal';
import { AttendancePicker } from './attendance-picker';

export type RegisterRowProps = {
  line: RegisterLine;
  /** Shown as the row's heading. Absent while the roster is still loading. */
  name: string;
  /** Hides the name when the lesson has only one student to mark. */
  showName: boolean;
  /** True once homework has been set, which is what makes the check meaningful. */
  askHomework: boolean;
  onMark: (status: AttendanceStatus) => void;
  onHomeworkDone: (done: boolean | null) => void;
  /** Test handle prefix. One row per student, so the caller supplies the index. */
  testID?: string;
};

/**
 * One student's line in the register.
 *
 * The same row for an individual lesson and for each member of a group, because
 * it is the same act. In the individual case the name is hidden — the sheet's
 * title already says whose lesson it is, and repeating it is noise in the one
 * place where speed matters most.
 */
export function RegisterRow({
  line,
  name,
  showName,
  askHomework,
  onMark,
  onHomeworkDone,
  testID,
}: RegisterRowProps) {
  const { t } = useT();
  const styles = useStyles();

  return (
    <View style={[styles.row, showName && styles.separated]} testID={testID}>
      {showName ? (
        <Text variant="label" numberOfLines={1}>
          {name}
        </Text>
      ) : null}

      <AttendancePicker
        value={line.status}
        onChange={onMark}
        testID={testID ? `${testID}-mark` : undefined}
      />

      {/* Only once something has been set, and only once somebody has been
          marked: "did they do it?" about a student who was not there yet is a
          question with no answer. */}
      {askHomework && line.status !== null ? (
        <View style={styles.homework}>
          <Text variant="caption" color="textSecondary">
            {t('gradebook.journal.homeworkDone')}
          </Text>
          <SegmentedControl
            testID={testID ? `${testID}-homework` : undefined}
            options={[
              { value: 'unchecked', label: t('gradebook.journal.homeworkUnchecked') },
              { value: 'done', label: t('gradebook.journal.homeworkYes') },
              { value: 'notDone', label: t('gradebook.journal.homeworkNo') },
            ]}
            value={
              line.homeworkDone === null
                ? 'unchecked'
                : line.homeworkDone
                  ? 'done'
                  : 'notDone'
            }
            onChange={(value) =>
              onHomeworkDone(value === 'unchecked' ? null : value === 'done')
            }
            accessibilityLabel={
              showName
                ? `${t('gradebook.journal.homeworkDone')} — ${name}`
                : t('gradebook.journal.homeworkDone')
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { gap: t.spacing.sm },
  // Only in a group, where several rows stack and need telling apart.
  separated: {
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  homework: { gap: t.spacing.xs },
}));
