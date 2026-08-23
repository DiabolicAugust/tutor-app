import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CalendarFiltersSheet,
  CalendarPreferencesProvider,
  CalendarSettingsSheet,
  DayAgendaSheet,
  EventFormSheet,
  MonthView,
  TimeGridView,
  dayCountFor,
  useCalendarPreferences,
} from '@/shared/calendar';
import { useFormat, useT } from '@/shared/i18n';
import { useLessons } from '@/shared/lessons';
import { addDays, isToday, startOfDay } from '@/shared/lib/date';
import { createStyles } from '@/shared/theme';
import { Fab, IconButton, Text, icons, motion } from '@/shared/ui';

/**
 * The calendar tab.
 *
 * View preferences are mounted here rather than in `AppProviders` because
 * nothing outside this tab has any use for them. The schedule itself lives
 * app-wide — the news feed derives notifications from it.
 */
export default function CalendarRoute() {
  return (
    <CalendarPreferencesProvider>
      <CalendarScreen />
    </CalendarPreferencesProvider>
  );
}

/** Which transient surface, if any, is open. Only one can be at a time. */
type Sheet = 'none' | 'filters' | 'settings' | 'event';

function CalendarScreen() {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const { lessons } = useLessons();
  const { viewMode, visibleCalendarIds } = useCalendarPreferences();

  // Defaults to today, as a calendar should.
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [sheet, setSheet] = useState<Sheet>('none');
  const [agendaDay, setAgendaDay] = useState<Date | null>(null);
  const [eventDay, setEventDay] = useState(selectedDay);

  const dayCount = dayCountFor(viewMode);

  const days = useMemo(
    () =>
      dayCount === null
        ? []
        : Array.from({ length: dayCount }, (_, index) => addDays(selectedDay, index)),
    [dayCount, selectedDay],
  );

  /** Paging steps by whatever is on screen: a day, three days, or a month. */
  const shift = (direction: 1 | -1) => {
    setSelectedDay((current) => {
      if (viewMode === 'month') {
        return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      }
      return addDays(current, direction * (dayCount ?? 1));
    });
  };

  const title = viewMode === 'month' ? format.monthYear(selectedDay) : format.dayTitle(selectedDay);

  const openEventForm = (day: Date) => {
    setEventDay(day);
    setSheet('event');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="titleMd" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <IconButton
            name={icons.filters}
            accessibilityLabel={t('filters.title')}
            onPress={() => setSheet('filters')}
          />
          <IconButton
            name={icons.settings}
            accessibilityLabel={t('calendarSettings.title')}
            onPress={() => setSheet('settings')}
          />
        </View>

        <View style={styles.navRow}>
          <IconButton
            name={icons.chevronLeft}
            accessibilityLabel={t('calendar.previous')}
            onPress={() => shift(-1)}
          />
          <IconButton
            name={icons.today}
            accessibilityLabel={t('calendar.today')}
            active={isToday(selectedDay)}
            onPress={() => setSelectedDay(startOfDay(new Date()))}
          />
          <IconButton
            name={icons.chevronRight}
            accessibilityLabel={t('calendar.next')}
            onPress={() => shift(1)}
          />
        </View>
      </View>

      {/* Keyed on the view mode so switching day/3-day/month cross-fades: the
          content is replaced wholesale, and a cut reads as a glitch. */}
      <Animated.View
        key={viewMode}
        entering={motion.contentSwap()}
        style={styles.viewContainer}
      >
        {viewMode === 'month' ? (
          <MonthView
            month={selectedDay}
            selectedDay={selectedDay}
            lessons={lessons}
            visibleCalendarIds={visibleCalendarIds}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setAgendaDay(day);
            }}
          />
        ) : (
          <TimeGridView days={days} lessons={lessons} visibleCalendarIds={visibleCalendarIds} />
        )}
      </Animated.View>

      {/* Not in the month view: a floating button there covers the last row of
          dates. Booking from the month view goes through a date's agenda sheet,
          which has its own "add" action. */}
      {viewMode !== 'month' ? (
        <Fab
          name={icons.add}
          accessibilityLabel={t('event.add')}
          onPress={() => openEventForm(selectedDay)}
        />
      ) : null}

      <CalendarFiltersSheet visible={sheet === 'filters'} onClose={() => setSheet('none')} />
      <CalendarSettingsSheet visible={sheet === 'settings'} onClose={() => setSheet('none')} />

      <DayAgendaSheet
        day={agendaDay}
        lessons={lessons}
        visibleCalendarIds={visibleCalendarIds}
        onClose={() => setAgendaDay(null)}
        onAddEvent={(day) => {
          setAgendaDay(null);
          openEventForm(day);
        }}
      />

      <EventFormSheet
        visible={sheet === 'event'}
        initialDay={eventDay}
        onClose={() => setSheet('none')}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  header: {
    paddingHorizontal: t.spacing.md,
    paddingBottom: t.spacing.xs,
    gap: t.spacing.xs,
  },
  viewContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  title: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
}));
