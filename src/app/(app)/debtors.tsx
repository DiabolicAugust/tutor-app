import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { DebtorList, useDebtors } from '@/shared/debtors';
import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { Button, Card, ListRow, Text } from '@/shared/ui';

/**
 * Who has run out of paid lessons.
 *
 * Built on the balance the register already spends, so there is no second ledger
 * to keep in step: mark a lesson and this screen changes, mark it excused and it
 * changes back.
 *
 * It counts **lessons, not money**. The app does not know what a lesson costs and
 * does not pretend to — a first lesson, an exam-prep hour and a place in a group
 * are three prices for most tutors, and a total in currency would be wrong for
 * all of them.
 */
export default function DebtorsScreen() {
  const { t } = useT();
  const styles = useStyles();
  // One lesson of warning, off by default. On, the list also names whoever has a
  // single lesson left — the moment a top-up still avoids the awkward
  // conversation rather than following it.
  const [warnEarly, setWarnEarly] = useState(false);
  const { debtors, isLoading, hasError, reload } = useDebtors(warnEarly ? 1 : 0);

  return (
    <ScrollView contentContainerStyle={styles.content} testID="screen-debtors">
      <Card>
        <Text variant="titleSm">{t('debtors.title')}</Text>
        <Text variant="bodySm" color="textSecondary">
          {t('debtors.subtitle')}
        </Text>
        <ListRow
          testID="debtors-warn-early"
          label={t('debtors.warnEarly')}
          description={t('debtors.warnEarlyHint')}
          selectable
          selected={warnEarly}
          onPress={() => setWarnEarly((current) => !current)}
        />
      </Card>

      {isLoading ? (
        <View style={styles.centred} testID="debtors-loading">
          <ActivityIndicator />
        </View>
      ) : hasError ? (
        <Card>
          <Text testID="debtors-failed" variant="bodySm" color="danger">
            {t('debtors.failed')}
          </Text>
          <Button
            testID="debtors-retry"
            label={t('common.retry')}
            variant="secondary"
            onPress={reload}
          />
        </Card>
      ) : debtors === null || debtors.length === 0 ? (
        <Card>
          {/* Good news, and worded as good news. An empty list here is the
              ordinary state of a school that keeps up with its packages, and it
              must not read like a screen that failed to load. */}
          <Text testID="debtors-empty" variant="bodySm" color="textMuted">
            {t('debtors.empty')}
          </Text>
        </Card>
      ) : (
        <DebtorList debtors={debtors} />
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
