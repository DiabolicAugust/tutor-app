import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonJournalSheet } from '@/shared/gradebook';
import { useFormat, useT } from '@/shared/i18n';
import { useLessons, type Lesson } from '@/shared/lessons';
import { useRefresh } from '@/shared/lib/use-refresh';
import { NotificationCard, useNotifications } from '@/shared/notifications';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, ScreenHeader, Text, icons, motion } from '@/shared/ui';

/**
 * News tab: one feed of everything that needs the tutor's attention.
 *
 * The screen knows nothing about notification kinds — it maps over the list and
 * lets `NotificationCard` resolve presentation from the registry. Adding a kind
 * never touches this file.
 */
export default function NewsScreen() {
  const { t } = useT();
  const format = useFormat();
  const styles = useStyles();
  const {
    notifications,
    unreadCount,
    isRead,
    markRead,
    markAllRead,
    runAction,
    refresh: refreshFeed,
  } = useNotifications();
  const { lessons, reload: reloadLessons } = useLessons();

  // Half the feed is derived from the schedule, so both are refreshed together
  // or the derived items would be answering a question already out of date.
  const {
    isRefreshing,
    refresh: pullToRefresh,
    controlKey,
  } = useRefresh([refreshFeed, reloadLessons]);

  /**
   * Refetched whenever this tab is opened.
   *
   * The store already refetches when the app returns to the foreground, which
   * does not cover the commonest case: an announcement sent from the school
   * screen a moment ago, in this same session. It was in the database and not on
   * the feed, and only a pull-to-refresh would show it.
   */
  useFocusEffect(
    useCallback(() => {
      void refreshFeed();
    }, [refreshFeed]),
  );

  const [writingUp, setWritingUp] = useState<Lesson | null>(null);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        testID="screen-news"
        pinned
        title={t('news.title')}
        subtitle={t('news.unread', { count: unreadCount })}
        action={
          // Leaves as soon as it has nothing left to do, which is also the
          // confirmation that it worked.
          unreadCount > 0 ? (
            <Animated.View entering={motion.messageEnter()} exiting={motion.messageExit()}>
              <Button
                testID="news-mark-all-read"
                label={t('news.markAllRead')}
                variant="ghost"
                onPress={markAllRead}
              />
            </Animated.View>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            key={controlKey}
            refreshing={isRefreshing}
            onRefresh={() => void pullToRefresh()}
          />
        }
      >
        {notifications.length === 0 ? (
          <Card style={styles.empty} testID="news-empty">
            <Icon name={icons.inbox} size={28} color="textMuted" />
            <Text variant="titleSm">{t('news.empty')}</Text>
            <Text variant="bodySm" color="textSecondary" style={styles.emptyHint}>
              {t('news.emptyHint')}
            </Text>
          </Card>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              read={isRead(notification.id)}
              onPress={() => markRead(notification.id)}
              onAction={(item, action) => {
                // Some intents need a screen rather than a mutation, so they are
                // handled here; every other one still belongs to the store.
                const lesson = lessons.find(
                  (candidate) => candidate.id === item.lessonId,
                );

                // Two ways to arrive at the write-up. `writeUp` asks for it
                // outright. "Took place" needs it for a *group* lesson: the tap
                // says the hour happened, and nothing more — marking everybody
                // present would charge whoever cancelled in time, and one extra
                // tap is cheaper than taking a student's money by assumption. An
                // individual lesson has one attendee and needs no asking.
                const mustAskWhoCame =
                  action.id === 'markHeld' && lesson !== undefined && !lesson.studentId;

                if (lesson && (action.id === 'writeUp' || mustAskWhoCame)) {
                  setWritingUp(lesson);
                  markRead(item.id);
                  return;
                }
                runAction(item, action);
              }}
            />
          ))
        )}
      </ScrollView>

      <LessonJournalSheet
        lesson={writingUp}
        title={
          writingUp
            ? `${writingUp.subject?.name ?? t('lessons.title')} · ${format.dayTitle(new Date(writingUp.startsAt))}`
            : ''
        }
        onClose={() => setWritingUp(null)}
        // Closed on save: the write-up is the whole errand, and the item that
        // prompted it has stopped applying — leaving the sheet open over a feed
        // that has just changed under it is the confusing outcome.
        onSaved={() => setWritingUp(null)}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: t.layout.maxContentWidth,
  },
  empty: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl },
  emptyHint: { textAlign: 'center' },
}));
