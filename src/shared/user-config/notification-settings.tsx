import { View } from 'react-native';

import { useState } from 'react';

import { useT } from '@/shared/i18n';
import { remindersSupported, requestReminderPermission } from '@/shared/reminders';
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
  const [permissionDenied, setPermissionDenied] = useState(false);

  /**
   * Permission is asked for here, at the moment the user says they want
   * reminders — not at startup. A prompt that arrives before the app has shown
   * what it would notify about is the one most reliably denied.
   *
   * The preference is only saved if permission was granted: storing "on" while
   * the system will deliver nothing is a setting that lies.
   */
  const toggleReminders = async () => {
    if (config.lessonReminders) {
      await update({ lessonReminders: false });
      setPermissionDenied(false);
      return;
    }

    const granted = await requestReminderPermission();
    setPermissionDenied(!granted);
    if (granted) await update({ lessonReminders: true });
  };

  const options = reminderPresetsMinutes.map((minutes) => ({
    value: String(minutes),
    label: t('notificationSettings.minutesShort', { count: minutes }),
  }));

  // Nothing here can work on a platform that cannot deliver a scheduled
  // notification, so say so instead of offering controls that do nothing.
  if (!remindersSupported) {
    return (
      <Text variant="bodySm" color="textSecondary">
        {t('notificationSettings.unsupported')}
      </Text>
    );
  }

  return (
    <>
      <ListRow
        testID="settings-reminders"
        label={t('notificationSettings.lessonReminders')}
        description={t('notificationSettings.lessonRemindersHint')}
        selectable
        selected={config.lessonReminders}
        onPress={() => void toggleReminders()}
      />

      {config.lessonReminders ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary">
            {t('notificationSettings.leadTime')}
          </Text>
          <ChipGroup
            testID="settings-reminder-lead"
            options={options}
            value={String(config.lessonReminderMinutes)}
            onChange={(value) => void update({ lessonReminderMinutes: Number(value) })}
            accessibilityLabel={t('notificationSettings.leadTime')}
          />
        </View>
      ) : null}

      {permissionDenied ? (
        <Text variant="caption" color="warning">
          {t('reminders.permissionDenied')}
        </Text>
      ) : null}

      {hasError ? (
        <Text variant="caption" color="danger">
          {t('notificationSettings.saveFailed')}
        </Text>
      ) : null}
    </>
  );
}
