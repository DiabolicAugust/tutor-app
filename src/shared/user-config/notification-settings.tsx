import { View } from 'react-native';

import { useT } from '@/shared/i18n';
import { createStyles } from '@/shared/theme';
import { ChipGroup, ListRow, Text } from '@/shared/ui';

import { reminderPresetsMinutes } from './user-config';
import { useUserConfig } from './user-config-provider';

const useStyles = createStyles((t) => ({
  section: { gap: t.spacing.xs, paddingTop: t.spacing.xs },
}));

/**
 * Lesson reminder preferences.
 *
 * The timing row is hidden while reminders are off: an interval for
 * notifications that are not sent is a control with no effect, and showing it
 * invites the user to set it and expect something.
 */
export function NotificationSettings() {
  const { t } = useT();
  const styles = useStyles();
  const { config, hasError, update } = useUserConfig();

  const options = reminderPresetsMinutes.map((minutes) => ({
    value: String(minutes),
    label: t('notificationSettings.minutesShort', { count: minutes }),
  }));

  return (
    <>
      <ListRow
        label={t('notificationSettings.lessonReminders')}
        description={t('notificationSettings.lessonRemindersHint')}
        selectable
        selected={config.lessonReminders}
        onPress={() => void update({ lessonReminders: !config.lessonReminders })}
      />

      {config.lessonReminders ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary">
            {t('notificationSettings.leadTime')}
          </Text>
          <ChipGroup
            options={options}
            value={String(config.lessonReminderMinutes)}
            onChange={(value) => void update({ lessonReminderMinutes: Number(value) })}
            accessibilityLabel={t('notificationSettings.leadTime')}
          />
        </View>
      ) : null}

      {hasError ? (
        <Text variant="caption" color="danger">
          {t('notificationSettings.saveFailed')}
        </Text>
      ) : null}
    </>
  );
}
