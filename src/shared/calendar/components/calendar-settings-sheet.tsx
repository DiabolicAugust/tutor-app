import { useT } from '@/shared/i18n';
import { ModalSheet, SegmentedControl, Text } from '@/shared/ui';

import { calendarViewModes, type CalendarViewMode } from '../view-mode';
import { useCalendarPreferences } from '../use-calendar-preferences';

/**
 * Calendar view settings: how much of the schedule is on screen.
 *
 * Kept separate from the app's own settings screen because this is a property
 * of the calendar, not of the account — and it belongs one tap from the grid it
 * changes.
 */
export function CalendarSettingsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const { viewMode, setViewMode } = useCalendarPreferences();

  const options = calendarViewModes.map((mode: CalendarViewMode) => ({
    value: mode,
    label: t(`calendarSettings.${mode}`),
  }));

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={t('calendarSettings.title')}
      testID="calendar-settings-sheet"
    >
      <Text variant="label" color="textSecondary">
        {t('calendarSettings.view')}
      </Text>
      <SegmentedControl
        testID="calendar-view"
        options={options}
        value={viewMode}
        onChange={setViewMode}
        accessibilityLabel={t('calendarSettings.view')}
      />
    </ModalSheet>
  );
}
