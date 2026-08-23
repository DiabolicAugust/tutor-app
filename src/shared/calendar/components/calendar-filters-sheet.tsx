import { useT } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { calendarOwners } from '@/shared/tutors';
import { ListRow, ModalSheet, Text } from '@/shared/ui';

import { useCalendarPreferences } from '../use-calendar-preferences';

/**
 * Which calendars are overlaid on the grid.
 *
 * Each row carries the same identity color the events use, so the filter list
 * doubles as the legend for the grid — no separate legend to keep in sync.
 */
export function CalendarFiltersSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const { eventColors } = useTheme();
  const { isCalendarVisible, toggleCalendar, visibleCalendarIds } = useCalendarPreferences();

  return (
    <ModalSheet visible={visible} onClose={onClose} title={t('filters.title')}>
      <Text variant="label" color="textSecondary">
        {t('filters.calendars')}
      </Text>
      <Text variant="caption" color="textMuted">
        {t('filters.calendarsHint')}
      </Text>

      {calendarOwners.map((tutor) => (
        <ListRow
          key={tutor.id}
          label={tutor.name}
          description={tutor.speciality}
          swatchColor={eventColors[tutor.colorIndex % eventColors.length].solid}
          selectable
          selected={isCalendarVisible(tutor.id)}
          onPress={() => toggleCalendar(tutor.id)}
        />
      ))}

      <Text variant="caption" color="textMuted">
        {t('filters.visibleCount', { count: visibleCalendarIds.length })}
      </Text>
    </ModalSheet>
  );
}
