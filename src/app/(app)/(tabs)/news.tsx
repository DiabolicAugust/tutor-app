import { useState } from 'react';
import { ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonJournalSheet } from '@/shared/gradebook';
import { useFormat, useT } from '@/shared/i18n';
import { useLessons, type Lesson } from '@/shared/lessons';
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
  const { notifications, unreadCount, isRead, markRead, markAllRead, runAction } =
    useNotifications();
  const { lessons } = useLessons();

  const [writingUp, setWritingUp] = useState<Lesson | null>(null);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        pinned
        title={t('news.title')}
        subtitle={t('news.unread', { count: unreadCount })}
        action={
          // Leaves as soon as it has nothing left to do, which is also the
          // confirmation that it worked.
          unreadCount > 0 ? (
            <Animated.View entering={motion.messageEnter()} exiting={motion.messageExit()}>
              <Button label={t('news.markAllRead')} variant="ghost" onPress={markAllRead} />
            </Animated.View>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.length === 0 ? (
          <Card style={styles.empty}>
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
                // One action needs a screen rather than a mutation, so it is
                // handled here; every other intent still belongs to the store.
                if (action.id === 'writeUp') {
                  const lesson = lessons.find(
                    (candidate) => candidate.id === item.lessonId,
                  );
                  if (lesson) {
                    setWritingUp(lesson);
                    markRead(item.id);
                    return;
                  }
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
            ? `${writingUp.subject} · ${format.dayTitle(new Date(writingUp.startsAt))}`
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
