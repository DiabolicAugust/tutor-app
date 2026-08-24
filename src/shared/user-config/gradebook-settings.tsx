import { useT } from '@/shared/i18n';
import { ListRow, Text } from '@/shared/ui';

import { useUserConfig } from './user-config-provider';

/**
 * Whether this tutor marks work.
 *
 * Its own component rather than a row inside the notification card, because it
 * is not a notification preference — and grouping it there would make it
 * findable only by someone who already knew where to look.
 *
 * Deliberately worded as a display choice, since that is what it is: nothing is
 * deleted, and a tutor who turns marking back on finds every mark still there.
 */
export function GradebookSettings() {
  const { t } = useT();
  const { config, hasError, update } = useUserConfig();

  return (
    <>
      <ListRow
        testID="settings-grades"
        label={t('gradebookSettings.enabled')}
        description={t('gradebookSettings.enabledHint')}
        selectable
        selected={config.gradesEnabled}
        onPress={() => void update({ gradesEnabled: !config.gradesEnabled })}
      />

      {config.gradesEnabled ? null : (
        <Text testID="settings-grades-off" variant="caption" color="textSecondary">
          {t('gradebookSettings.offHint')}
        </Text>
      )}

      {hasError ? (
        <Text variant="caption" color="danger">
          {t('notificationSettings.saveFailed')}
        </Text>
      ) : null}
    </>
  );
}
