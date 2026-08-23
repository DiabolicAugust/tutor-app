import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useFormat, useT } from '@/shared/i18n';
import { lessonLabel, useLessons } from '@/shared/lessons';
import { useStudents } from '@/shared/students';
import { useUserConfig } from '@/shared/user-config';

import { ensureReminderChannel } from './reminder-channel';
import { hasReminderPermission } from './reminder-permissions';
import { clearReminders, planReminders, syncReminders } from './reminder-scheduler';

/**
 * How a reminder behaves when it fires while the app is open.
 *
 * The banner and sound are kept: the whole point is a reminder that reaches the
 * tutor even mid-conversation with a student. The badge is not — an unread count
 * on the icon for something time-based is noise a minute later.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

/**
 * Keeps scheduled reminders in step with the schedule and the user's preference.
 *
 * Runs on every change to either, and re-syncs wholesale — see
 * `syncReminders` for why replacing beats diffing.
 *
 * Deliberately a hook mounted once rather than a call site per screen: reminders
 * are a consequence of the data, not of anyone looking at it.
 */
export function useLessonReminders(): void {
  const { t } = useT();
  const format = useFormat();
  const { lessons, isLoading } = useLessons();
  const { nameOf } = useStudents();
  const { config } = useUserConfig();

  useEffect(() => {
    // Nothing to schedule from an empty list; syncing now would cancel
    // everything and reschedule a moment later.
    if (isLoading) return;

    let cancelled = false;

    void (async () => {
      await ensureReminderChannel();

      if (!config.lessonReminders) {
        await clearReminders();
        return;
      }

      // Without permission there is nothing to schedule *into*; the toggle asks
      // for it, so this only guards the case where it was revoked in settings.
      if (!(await hasReminderPermission())) return;
      if (cancelled) return;

      const plans = planReminders(lessons, config.lessonReminderMinutes, (lesson, startsAt) => ({
        title: t('reminders.title', { name: lessonLabel(lesson, nameOf) }),
        body: t('reminders.body', {
          time: format.time(startsAt),
          subject: lesson.subject,
        }),
      }));

      if (!cancelled) await syncReminders(plans);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, lessons, config.lessonReminders, config.lessonReminderMinutes, nameOf, t, format]);
}
