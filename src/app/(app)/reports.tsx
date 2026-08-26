import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useT } from '@/shared/i18n';
import {
  defaultReportPeriod,
  reportPeriodKeys,
  reportPeriods,
  ReportView,
  useReport,
  type ReportPeriod,
} from '@/shared/reports';
import { createStyles } from '@/shared/theme';
import { Button, Card, ChipGroup, Text } from '@/shared/ui';

/**
 * What was taught over a period, and how it went.
 *
 * Every figure comes from one request, computed on the server from the lessons,
 * the register and the gradebook — so nothing here can disagree with what a
 * student's own progress page says about the same weeks.
 *
 * A tutor sees their own work; an admin sees the school, broken down by tutor.
 * The screen does not decide that and does not ask: the server scopes the answer
 * to whoever is holding the token, and says whose work it counted.
 */
export default function ReportsScreen() {
  const { t } = useT();
  const styles = useStyles();
  const [period, setPeriod] = useState<ReportPeriod>(defaultReportPeriod);
  const { report, isLoading, hasError, reload } = useReport({ period });

  return (
    <ScrollView contentContainerStyle={styles.content} testID="screen-reports">
      <Card>
        {/* Whose work this counts, taken from the answer rather than guessed
            from the reader's role: the server decides the scope, and a caption
            derived from anything else would eventually contradict the numbers
            under it. This screen only ever asks about the caller, so there are
            two cases — the school, or the person holding the phone. */}
        <Text testID="report-scope" variant="titleSm">
          {report === null || report.scope.tutorId !== null
            ? t('reports.scope.mine')
            : t('reports.scope.school')}
        </Text>
        <Text variant="bodySm" color="textSecondary">
          {t('reports.subtitle')}
        </Text>

        <ChipGroup
          testID="report-period"
          accessibilityLabel={t('reports.period.label')}
          value={String(period)}
          onChange={(next) => setPeriod(Number(next) as ReportPeriod)}
          options={reportPeriods.map((days) => ({
            value: String(days),
            label: t(reportPeriodKeys[days]),
          }))}
        />
      </Card>

      {isLoading ? (
        <View style={styles.centred} testID="report-loading">
          <ActivityIndicator />
        </View>
      ) : hasError ? (
        <Card>
          <Text testID="report-failed" variant="bodySm" color="danger">
            {t('reports.failed')}
          </Text>
          <Button
            testID="report-retry"
            label={t('reports.retry')}
            variant="secondary"
            onPress={reload}
          />
        </Card>
      ) : report === null || report.lessons.total === 0 ? (
        <Card>
          {/* Empty rather than broken, and worth saying plainly: a new account
              opening this screen would otherwise see a wall of zeroes and wonder
              which of them is a bug. */}
          <Text testID="report-empty" variant="bodySm" color="textMuted">
            {t('reports.empty')}
          </Text>
        </Card>
      ) : (
        <ReportView report={report} />
      )}
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  content: {
    gap: t.spacing.lg,
    padding: t.spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  centred: { paddingVertical: t.spacing.xl, alignItems: 'center' },
}));
