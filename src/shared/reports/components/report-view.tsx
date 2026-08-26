import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

import { hoursFrom, type Report, type ReportBreakdown } from '../report';

/**
 * A report, rendered.
 *
 * Split from the screen so the screen is only about choosing a period and
 * handling the three states a request can be in. This part is pure: give it a
 * report and it draws one.
 */
export function ReportView({ report }: { report: Report }) {
  const { t } = useT();
  const styles = useStyles();

  return (
    <>
      <Card title={t('reports.lessons.title')}>
        <View style={styles.figures}>
          <Figure
            testID="report-completed"
            label={t('reports.lessons.completed')}
            value={String(report.lessons.completed)}
          />
          <Figure
            testID="report-hours"
            label={t('reports.lessons.hours')}
            value={t('reports.hoursValue', {
              hours: hoursFrom(report.minutesTaught),
            })}
          />
          <Figure
            testID="report-students"
            label={t('reports.lessons.students')}
            value={String(report.studentsTaught)}
          />
          <Figure
            testID="report-cancelled"
            label={t('reports.lessons.cancelled')}
            value={String(report.lessons.cancelled)}
          />
          <Figure
            testID="report-scheduled"
            label={t('reports.lessons.scheduled')}
            value={String(report.lessons.scheduled)}
          />
        </View>
      </Card>

      <Card title={t('reports.attendance.title')}>
        {report.attendance.rate === null ? (
          // Two different facts, and they need different sentences. With lessons
          // taught but nothing marked, the reason there is no percentage is that
          // the registers are empty — saying only "nothing marked" leaves the
          // reader deciding whether the screen is broken. With no lessons either,
          // there is simply nothing to report.
          <Text testID="report-attendance-empty" variant="bodySm" color="textMuted">
            {report.lessons.unwritten > 0
              ? t('reports.attendance.noneButTaught', {
                  count: report.lessons.unwritten,
                })
              : t('reports.attendance.none')}
          </Text>
        ) : (
          <>
            <View style={styles.figures}>
              <Figure
                testID="report-attendance-rate"
                label={t('reports.attendance.rate')}
                value={`${Math.round(report.attendance.rate * 100)}%`}
              />
              <Figure
                label={t('reports.attendance.present')}
                value={String(report.attendance.present)}
              />
              <Figure
                label={t('reports.attendance.late')}
                value={String(report.attendance.late)}
              />
              <Figure
                label={t('reports.attendance.absentExcused')}
                value={String(report.attendance.absentExcused)}
              />
              <Figure
                label={t('reports.attendance.absentUnexcused')}
                value={String(report.attendance.absentUnexcused)}
              />
            </View>
            <Text variant="caption" color="textMuted">
              {t('reports.attendance.hint')}
            </Text>
          </>
        )}

        {/* The caveat on the number just read: the rate covers the lessons that
            were written up and no others. Only alongside a rate — the empty state
            above says it in its own words. */}
        {report.attendance.rate !== null && report.lessons.unwritten > 0 ? (
          <Text testID="report-attendance-unwritten" variant="bodySm" color="warning">
            {t('reports.attendance.unwritten', { count: report.lessons.unwritten })}
          </Text>
        ) : null}
      </Card>

      {/* Marks are hidden entirely when there are none, rather than shown as
          zeroes: a tutor who does not grade should not be told so every time
          they open the screen. */}
      {report.grades.count === 0 ? null : (
        <Card title={t('reports.grades.title')}>
          <View style={styles.figures}>
            {report.grades.classic ? (
              <Figure
                testID="report-grade-classic"
                label={t('reports.grades.classic')}
                value={String(report.grades.classic.average)}
              />
            ) : null}
            {report.grades.percentage ? (
              <Figure
                label={t('reports.grades.percentage')}
                value={`${report.grades.percentage.average}%`}
              />
            ) : null}
            {report.grades.descriptiveCount > 0 ? (
              <Figure
                label={t('reports.grades.descriptive')}
                value={String(report.grades.descriptiveCount)}
              />
            ) : null}
            <Figure
              label={t('reports.grades.count')}
              value={String(report.grades.count)}
            />
          </View>
        </Card>
      )}

      {report.bySubject.length > 0 ? (
        <Card title={t('reports.bySubject')}>
          <Breakdown
            rows={report.bySubject}
            testID="report-subject"
            unnamedKey="reports.noSubject"
          />
        </Card>
      ) : null}

      {report.byTutor && report.byTutor.length > 0 ? (
        <Card title={t('reports.byTutor')}>
          <Breakdown
            rows={report.byTutor}
            testID="report-tutor"
            unnamedKey="reports.unnamedTutor"
          />
        </Card>
      ) : null}
    </>
  );
}

/** One number, with what it counts underneath it. */
function Figure({
  label,
  value,
  testID,
}: {
  label: string;
  value: string;
  testID?: string;
}) {
  const styles = useStyles();

  return (
    <View style={styles.figure} testID={testID}>
      <Text variant="titleMd">{value}</Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/** Hours per subject or per tutor, busiest first — the order the server sends. */
function Breakdown({
  rows,
  testID,
  unnamedKey,
}: {
  rows: readonly ReportBreakdown[];
  testID: string;
  /**
   * What to call a row with no name — a lesson booked without a subject, or a
   * tutor who has left the school. Passed in rather than inferred from `testID`,
   * which would tie a visible label to a test handle and break silently the day
   * one of them is renamed.
   */
  unnamedKey: 'reports.noSubject' | 'reports.unnamedTutor';
}) {
  const { t } = useT();
  const styles = useStyles();

  return (
    <View style={styles.rows}>
      {rows.map((row, index) => (
        <View key={row.id ?? 'none'} style={styles.row} testID={`${testID}-${index}`}>
          <Text variant="bodySm" style={styles.rowName} numberOfLines={1}>
            {row.name ?? t(unnamedKey)}
          </Text>
          <Text variant="bodySm" color="textSecondary">
            {t('reports.breakdownRow', {
              lessons: row.lessons,
              hours: t('reports.hoursValue', { hours: hoursFrom(row.minutes) }),
            })}
          </Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  figures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
  },
  figure: { minWidth: 88, gap: 2 },
  rows: { gap: t.spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
  },
  rowName: { flexShrink: 1 },
}));
