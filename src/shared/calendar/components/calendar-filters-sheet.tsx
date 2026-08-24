import { useT } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { useCalendarOwners } from '@/shared/tutors';
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
  const { isCalendarVisible, toggleCalendar } = useCalendarPreferences();
  const calendarOwners = useCalendarOwners();

  const visibleCount = calendarOwners.filter((tutor) => isCalendarVisible(tutor.id)).length;

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
        {/* Counted against the calendars that exist, not the ids in storage.
            The visible list is persisted, so it outlives the calendars it names
            — a build that once had colleagues left their ids behind, and the
            filter went on claiming two calendars where there was one. */}
        {t('filters.visibleCount', { count: visibleCount })}
      </Text>
    </ModalSheet>
  );
}
