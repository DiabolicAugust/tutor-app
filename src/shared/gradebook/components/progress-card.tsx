import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

import type { GradeAverage, ProgressSummary } from '../progress';
import { useGradesEnabled } from '../use-grades-enabled';

export type ProgressCardProps = {
  progress: ProgressSummary | null;
  isLoading: boolean;
};

/**
 * How the student is doing, at a glance.
 *
 * This card is the feature: of everything a gradebook does, the thing schools
 * name as most valuable after a year of use is being able to see the average
 * without going looking for it. So it sits at the top of the student, always
 * visible, and never more than four numbers.
 */
export function ProgressCard({ progress, isLoading }: ProgressCardProps) {
  const { t } = useT();
  const styles = useStyles();
  const gradesEnabled = useGradesEnabled();

  if (isLoading) {
    return (
      <Card title={t('gradebook.progress.title')}>
        <Text color="textSecondary">{t('common.loading')}</Text>
      </Card>
    );
  }

  // Nothing marked and nothing graded: say so plainly rather than showing a wall
  // of zeroes that reads like a bad report. With marking off, marks do not count
  // towards "is there anything to show" — otherwise the card would claim to have
  // something and then render only attendance.
  const hasAnything =
    progress !== null &&
    (progress.attendance.marked > 0 || (gradesEnabled && progress.grades.count > 0));

  if (!hasAnything) {
    return (
      <Card title={t('gradebook.progress.title')}>
        <Text variant="bodySm" color="textMuted">
          {t('gradebook.progress.empty')}
        </Text>
      </Card>
    );
  }

  const { attendance, grades, lessons } = progress;

  return (
    <Card title={t('gradebook.progress.title')}>
      <View style={styles.row}>
        {/* Whichever register this school grades in. Both, if it uses both. */}
        {gradesEnabled && grades.classic ? (
          <Metric
            label={t('gradebook.progress.average')}
            value={formatAverage(grades.classic)}
            hint={t('gradebook.progress.fromMarks', { count: grades.classic.count })}
          />
        ) : null}

        {gradesEnabled && grades.percentage ? (
          <Metric
            label={t('gradebook.progress.averagePercent')}
            value={`${formatAverage(grades.percentage)}%`}
            hint={t('gradebook.progress.fromMarks', { count: grades.percentage.count })}
          />
        ) : null}

        {attendance.rate !== null ? (
          <Metric
            label={t('gradebook.progress.attendance')}
            value={`${Math.round(attendance.rate * 100)}%`}
            hint={t('gradebook.progress.ofMarked', { count: attendance.marked })}
          />
        ) : null}

        <Metric
          label={t('gradebook.progress.taught')}
          value={String(lessons.completed)}
          hint={t('gradebook.progress.ofTotal', { count: lessons.total })}
        />
      </View>

      {attendance.absentUnexcused > 0 ? (
        <Text variant="bodySm" color="warning">
          {t('gradebook.progress.missed', { count: attendance.absentUnexcused })}
        </Text>
      ) : null}
    </Card>
  );
}

/** Rounded for display, having already been rounded to two places on the wire. */
const formatAverage = ({ average }: GradeAverage): string =>
  Number.isInteger(average) ? String(average) : average.toFixed(1);

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  const styles = useStyles();

  return (
    <View style={styles.metric}>
      <Text variant="titleLg">{value}</Text>
      <Text variant="caption" color="textSecondary" numberOfLines={2}>
        {label}
      </Text>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
    paddingBottom: t.spacing.xs,
  },
  metric: {
    // Two per row on a phone, four across on a tablet — the metrics are
    // independent, so letting them reflow beats a fixed grid.
    flexBasis: '40%',
    flexGrow: 1,
    gap: 2,
  },
}));
