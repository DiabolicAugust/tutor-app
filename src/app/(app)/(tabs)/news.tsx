import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/shared/i18n';
import { NotificationCard, useNotifications } from '@/shared/notifications';
import { createStyles } from '@/shared/theme';
import { Button, Card, Icon, Text, icons, motion } from '@/shared/ui';

/**
 * News tab: one feed of everything that needs the tutor's attention.
 *
 * The screen knows nothing about notification kinds — it maps over the list and
 * lets `NotificationCard` resolve presentation from the registry. Adding a kind
 * never touches this file.
 */
export default function NewsScreen() {
  const { t } = useT();
  const styles = useStyles();
  const { notifications, unreadCount, isRead, markRead, markAllRead, runAction } =
    useNotifications();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="titleLg">{t('news.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('news.unread', { count: unreadCount })}
          </Text>
        </View>

        {/* Leaves as soon as it has nothing left to do, which is also the
            confirmation that it worked. */}
        {unreadCount > 0 ? (
          <Animated.View entering={motion.messageEnter()} exiting={motion.messageExit()}>
            <Button label={t('news.markAllRead')} variant="ghost" onPress={markAllRead} />
          </Animated.View>
        ) : null}
      </View>

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
              onAction={runAction}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.sm,
  },
  headerText: { gap: 2, flexShrink: 1 },
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
